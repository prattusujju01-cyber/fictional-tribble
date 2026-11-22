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
if (fs.existsSync('/workspaces/fictional-tribble/v10_runtime/node_modules/playwright')) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/workspaces/fictional-tribble/v10_runtime/browsers';
  playwrightPkg = '/workspaces/fictional-tribble/v10_runtime/node_modules/playwright';
} else if (process.env.NODE_PATH && fs.existsSync(path.join(process.env.NODE_PATH, 'playwright'))) {
  playwrightPkg = path.join(process.env.NODE_PATH, 'playwright');
}
const { chromium } = require(playwrightPkg);

const PROBE_DIR = path.join(ROOT, 'tmp_probe');
fs.rmSync(PROBE_DIR, { recursive: true, force: true });
fs.mkdirSync(PROBE_DIR, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const fp = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const scriptData = JSON.parse(fs.readFileSync(path.join(ROOT, 'script.json'), 'utf8'));
const TIMES = scriptData.shots.map(s => +(s.t0 + (s.t1 - s.t0) * 0.58).toFixed(2));

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', err => { console.error('PAGE_ERROR:', err); errors.push(String(err)); });
page.on('console', msg => { if (msg.type() === 'error') { console.error('CONSOLE_ERR:', msg.text()); errors.push(msg.text()); } });

await page.goto(`http://127.0.0.1:${port}/?t=0`, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 90000 });

const t0 = Date.now();
for (let i = 0; i < TIMES.length; i++) {
  await page.evaluate(ts => window.__renderAt(ts), TIMES[i]);
  await page.screenshot({ path: path.join(PROBE_DIR, `p_${String(i).padStart(2, '0')}.png`), type: 'png' });
}
console.log(`35-shot Era-2 probe rendered in ${((Date.now() - t0) / 1000).toFixed(2)}s (${Math.round((Date.now() - t0) / TIMES.length)} ms/frame)`);
await browser.close();
server.close();

if (errors.length > 0) {
  console.error('RENDER ERRORS DETECTED:', errors);
  process.exit(1);
}

const pyBin = fs.existsSync('/workspaces/fictional-tribble/v10_runtime/.venv/bin/python3')
  ? '/workspaces/fictional-tribble/v10_runtime/.venv/bin/python3'
  : 'python3';

const py = `
from PIL import Image, ImageDraw
import glob, os
files = sorted(glob.glob(r"${PROBE_DIR}/p_*.png"))[:${TIMES.length}]
times = ${JSON.stringify(TIMES)}
cols, rows, tw, th = 7, 5, 270, 480
sheet = Image.new("RGB", (cols * tw, rows * th), (12, 12, 16))
d = ImageDraw.Draw(sheet)
for i, fp in enumerate(files):
    im = Image.open(fp).convert("RGB").resize((tw, th), Image.Resampling.LANCZOS)
    x, y = (i % cols) * tw, (i // cols) * th
    sheet.paste(im, (x, y))
    d.rectangle([x, y + th - 22, x + 132, y + th], fill=(0, 0, 0))
    d.text((x + 6, y + th - 17), f"S{i+1:02d} {times[i]:.1f}s", fill=(255, 230, 120))
out_path = os.path.join(r"${ROOT}", "out", "probe_35.jpg")
sheet.save(out_path, quality=92)
print("PROBE_SHEET_SAVED:", out_path)
`;
const pyFile = path.join(PROBE_DIR, 'make_probe.py');
fs.writeFileSync(pyFile, py, 'utf8');
execSync(`${pyBin} "${pyFile}"`, { stdio: 'inherit' });
