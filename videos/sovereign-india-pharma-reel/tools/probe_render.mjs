// tools/probe_render.mjs (v3.0 — 24 Scene Beats + 12 Fast-Zoom/Whip Transition Strip + 4 HD Heroes)

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
const PROBE_DIR = path.join(OUT_DIR, 'probe_frames');
const TRANS_DIR = path.join(OUT_DIR, 'trans_frames');
fs.rmSync(PROBE_DIR, { recursive: true, force: true });
fs.rmSync(TRANS_DIR, { recursive: true, force: true });
fs.mkdirSync(PROBE_DIR, { recursive: true });
fs.mkdirSync(TRANS_DIR, { recursive: true });

const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/vo_timeline.json'), 'utf8'));
const fps = timeline.fps || 30;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4'
};

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
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });

const errors = [];
page.on('pageerror', err => { console.error('PAGE_ERROR:', err); errors.push(String(err)); });
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.error('CONSOLE_ERROR:', msg.text());
    errors.push(msg.text());
  }
});

await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__READY === true || window.__ERROR !== null, { timeout: 30000 });

const bootErr = await page.evaluate(() => window.__ERROR);
if (bootErr) throw new Error('Engine boot error: ' + bootErr);

let idx = 1;
const heroMap = {
  'S01_CABINET_HOOK_B': 'hero_s01_pharma_map.jpg',
  'S04_ONE_DOLLAR_REVOLUTION_B': 'hero_s04_cipla_1dollar.jpg',
  'S06_CAPSULE_BIOREACTOR_XRAY_A': 'hero_s06_capsule_xray.jpg',
  'S07_UNLOCK_650_FDA_B': 'hero_s07_650_fda.jpg'
};

for (const sc of timeline.scenes) {
  const dur = sc.endSec - sc.startSec;
  for (const [beatTag, frac] of [['A', 0.30], ['B', 0.72]]) {
    const tSec = sc.startSec + dur * frac;
    const frameIdx = Math.min(timeline.totalFrames - 1, Math.round(tSec * fps));
    await page.evaluate((f) => window.renderFrame(f), frameIdx);

    const outPath = path.join(PROBE_DIR, `p_${String(idx).padStart(2, '0')}.jpg`);
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 92 });

    const heroKey = `${sc.id}_${beatTag}`;
    if (heroMap[heroKey]) {
      fs.copyFileSync(outPath, path.join(OUT_DIR, heroMap[heroKey]));
    }
    idx++;
  }
}

const kineticTimestamps = [
  5.74,  // S01->S02 Circular Golden-Rimmed Portal Dive into Hyderabad/Pune!
  9.42,  // S02 Beat A->B Snap Zoom-Out + Velocity DOF Blur Pulse!
  13.25, // S02->S03 Planetary Horizon Sphere Wipe!
  19.73, // S03->S04 Radial Iris Crimson-Amber Punch!
  21.40, // S04 $10,000 -> $1/day 4-Tap Shutter Whip-Zoom!
  26.70, // S04->S05 Axial Snap-Zoom Portal!
  34.22, // S05->S06 High-Speed Vertical Laser Blueprint Scanline!
  35.70, // S06 Snap-Zoom into Exploded API Capsule!
  37.45, // S06 Whip-Pan to 10,000L Vaccine Bioreactor!
  41.72, // S06->S07 Snap Zoom-Out DOF!
  51.30, // S08 Global Lifeline Whip-Hop (UK -> Africa -> USA)!
  55.68  // S08->S09 4-Tap Directional Whip-Pan Left!
];

for (let k = 0; k < kineticTimestamps.length; k++) {
  const fIdx = Math.round(kineticTimestamps[k] * fps);
  await page.evaluate((f) => window.renderFrame(f), fIdx);
  const tOut = path.join(TRANS_DIR, `t_${String(k + 1).padStart(2, '0')}.jpg`);
  await page.screenshot({ path: tOut, type: 'jpeg', quality: 92 });
}

await browser.close();
server.close();

if (errors.length > 0) {
  throw new Error(`Probe encountered ${errors.length} runtime errors:\n` + errors.join('\n'));
}

const sheetOut = path.join(OUT_DIR, 'probe_24.jpg');
execSync(
  `ffmpeg -nostdin -y -i "${path.join(PROBE_DIR, 'p_%02d.jpg')}" -vf "scale=320:568,tile=6x4:padding=4:margin=4:color=0x0b0f29" -q:v 2 "${sheetOut}"`,
  { stdio: 'inherit' }
);

const transOut = path.join(OUT_DIR, 'probe_transitions_12.jpg');
execSync(
  `ffmpeg -nostdin -y -i "${path.join(TRANS_DIR, 't_%02d.jpg')}" -vf "scale=320:568,tile=6x2:padding=4:margin=4:color=0x0b0f29" -q:v 2 "${transOut}"`,
  { stdio: 'inherit' }
);

console.log('PHARMA PROBE v3.0 COMPLETE:', sheetOut, transOut);
