// tools/probe_render.mjs
// Renders 24 audit keyframes (Beat A & Beat B of all 12 scenes) + 4 full-HD hero frames

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
fs.rmSync(PROBE_DIR, { recursive: true, force: true });
fs.mkdirSync(PROBE_DIR, { recursive: true });

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
  if (!fs.existsSync(fp)) {
    res.writeHead(404);
    res.end();
    return;
  }
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
if (bootErr) {
  throw new Error('Engine boot error: ' + bootErr);
}

// Capture 2 beats per scene (24 frames total) + save 4 full-res hero frames
let idx = 1;
const heroMap = {
  'S01_HOOK_IMPORT_B': 'hero_s01_map_cards.jpg',
  'S04_EXPLOSION_165X_B': 'hero_s04_165x_amber.jpg',
  'S06_BLUEPRINT_XRAY_B': 'hero_s06_exploded_phone.jpg',
  'S10_SEMICON_SUPERPOWER_B': 'hero_s10_glass_reframe.jpg'
};

for (const sc of timeline.scenes) {
  const dur = sc.endSec - sc.startSec;
  for (const [beatTag, frac] of [['A', 0.30], ['B', 0.78]]) {
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

await browser.close();
server.close();

if (errors.length > 0) {
  throw new Error(`Probe encountered ${errors.length} runtime errors:\n` + errors.join('\n'));
}

// Build 6x4 contact sheet at 320x568 per tile -> 1920x2272 crisp JPEG
const sheetOut = path.join(OUT_DIR, 'probe_24.jpg');
execSync(
  `ffmpeg -nostdin -y -i "${path.join(PROBE_DIR, 'p_%02d.jpg')}" -vf "scale=320:568,tile=6x4:padding=4:margin=4:color=0x0b0f29" -q:v 2 "${sheetOut}"`,
  { stdio: 'inherit' }
);
console.log('PROBE COMPLETE:', sheetOut);
