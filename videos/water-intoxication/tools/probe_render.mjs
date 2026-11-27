import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

let playwrightPkg = 'playwright';
if (process.env.NODE_PATH && fs.existsSync(path.join(process.env.NODE_PATH, 'playwright'))) {
  playwrightPkg = path.join(process.env.NODE_PATH, 'playwright');
}
const { chromium } = require(playwrightPkg);

const OUT_DIR = path.join(ROOT, 'out');
const PROBE_FRAMES = path.join(OUT_DIR, 'probe_frames');
fs.rmSync(PROBE_FRAMES, { recursive: true, force: true });
fs.mkdirSync(PROBE_FRAMES, { recursive: true });

const scriptData = JSON.parse(fs.readFileSync(path.join(ROOT, 'script.json'), 'utf8'));
const shots = scriptData.shots;

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const fp = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', err => { console.error('PAGE_ERROR:', err); errors.push(String(err)); });
page.on('console', msg => { if (msg.type() === 'error') console.error('CONSOLE_ERROR:', msg.text()); });

await page.goto(`http://127.0.0.1:${port}/?t=0`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForFunction(() => window.__READY__ === true || Boolean(window.__INIT_ERROR__), null, { timeout: 120000 });
const initErr = await page.evaluate(() => window.__INIT_ERROR__ || null);
if (initErr) throw new Error(`Browser init failed: ${initErr}`);

// 1. Capture all 32 shots at t0 + 1.55s (both Line 1 & Line 2 + mid-action diorama state!)
for (let i = 0; i < shots.length; i++) {
  const s = shots[i];
  const sampleT = Math.min(s.t1 - 0.15, s.t0 + 1.55);
  const b64 = await page.evaluate((t) => {
    window.__renderAt(t);
    const u = document.getElementById('stage').toDataURL('image/jpeg', 0.92);
    return u.slice(u.indexOf(',') + 1);
  }, sampleT);
  fs.writeFileSync(path.join(PROBE_FRAMES, `shot_${String(i + 1).padStart(2, '0')}.jpg`), Buffer.from(b64, 'base64'));
  console.log(`Captured ${s.id} @ ${sampleT.toFixed(2)}s`);
}

// 2. Capture Progressive Caption & Clean Cut Verification Strip across 3 Shot Transitions
// Columns: [-0.08s prev end, +0.05s visual-only cut, +0.32s Line 1 only, +0.76s Line 1+2 reveal, +1.50s hold, +2.40s action]
const cutAnchors = [
  { label: 'S02->S03', cutT: 7.4 },
  { label: 'S13->S14', cutT: 49.4 },
  { label: 'S19->S20', cutT: 73.0 }
];
const offsets = [-0.08, 0.05, 0.32, 0.78, 1.50, 2.40];

for (let r = 0; r < cutAnchors.length; r++) {
  for (let c = 0; c < offsets.length; c++) {
    const t = cutAnchors[r].cutT + offsets[c];
    const b64 = await page.evaluate((ts) => {
      window.__renderAt(ts);
      const u = document.getElementById('stage').toDataURL('image/jpeg', 0.92);
      return u.slice(u.indexOf(',') + 1);
    }, t);
    fs.writeFileSync(path.join(PROBE_FRAMES, `micro_${r}_${c}.jpg`), Buffer.from(b64, 'base64'));
  }
}

await browser.close();
server.close();
if (errors.length) throw new Error(`Page errors detected: ${errors.join(' | ')}`);

// Stitch probe_32.jpg (8 cols x 4 rows of crisp 324x576 tiles) AND micro_strip.jpg (6 cols x 3 rows)
const pyCode = `
from PIL import Image, ImageDraw
import os, json

root = ${JSON.stringify(ROOT)}
pdir = os.path.join(root, 'out', 'probe_frames')
shots = json.load(open(os.path.join(root, 'script.json'), encoding='utf-8'))['shots']

# 1. probe_32.jpg (8x4)
tw, th, pad = 324, 576, 8
cols, rows = 8, 4
sheet = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + 28 + pad) + pad), (14, 13, 12))
draw = ImageDraw.Draw(sheet)
for i, s in enumerate(shots):
    r, c = divmod(i, cols)
    x = pad + c * (tw + pad)
    y = pad + r * (th + 28 + pad)
    im = Image.open(os.path.join(pdir, f"shot_{i+1:02d}.jpg")).resize((tw, th), Image.Resampling.LANCZOS)
    sheet.paste(im, (x, y + 24))
    draw.text((x + 4, y + 4), f"{s['id']} ({s['t0']:.1f}-{s['t1']:.1f}s) {s['world']}", fill=(240, 232, 214))
out_probe = os.path.join(root, 'out', 'probe_32.jpg')
sheet.save(out_probe, quality=92)
print("Saved:", out_probe)

# 2. micro_strip.jpg (6x3)
mw, mh = 324, 576
labels = ["prev -0.08s", "cut +0.05s", "L1 +0.32s", "L1+L2 +0.78s", "hold +1.50s", "act +2.40s"]
anchors = ["S02->S03 (7.4s)", "S13->S14 (49.4s)", "S19->S20 (73.0s)"]
msheet = Image.new('RGB', (6 * (mw + pad) + pad, 3 * (mh + 28 + pad) + pad), (14, 13, 12))
mdraw = ImageDraw.Draw(msheet)
for r in range(3):
    for c in range(6):
        x = pad + c * (mw + pad)
        y = pad + r * (mh + 28 + pad)
        im = Image.open(os.path.join(pdir, f"micro_{r}_{c}.jpg")).resize((mw, mh), Image.Resampling.LANCZOS)
        msheet.paste(im, (x, y + 24))
        mdraw.text((x + 4, y + 4), f"{anchors[r]} | {labels[c]}", fill=(245, 215, 140))
out_micro = os.path.join(root, 'out', 'micro_strip.jpg')
msheet.save(out_micro, quality=92)
print("Saved:", out_micro)
`;
const pyPath = path.join(OUT_DIR, 'stitch_probe.py');
fs.writeFileSync(pyPath, pyCode);
execSync(`python3 "${pyPath}"`, { stdio: 'inherit' });
