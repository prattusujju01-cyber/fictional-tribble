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

function getArg(prefix, fallback) {
  const hit = process.argv.find(a => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const FPS = 30;
const START_FRAME = parseInt(getArg('--start=', '0'), 10);
const END_FRAME = parseInt(getArg('--end=', '3600'), 10);
const SEG_OUT = getArg('--out=', path.join(ROOT, 'out/water_intoxication_silent.mp4'));
const WORKERS = parseInt(getArg('--workers=', '3'), 10);
const BATCH_SIZE = 15;
const TOTAL_IN_RANGE = END_FRAME - START_FRAME;

const FRAME_DIR = getArg('--frame-dir=', path.join(ROOT, `tmp_frames_${START_FRAME}_${END_FRAME}`));
if (process.argv.includes('--clean')) {
  fs.rmSync(FRAME_DIR, { recursive: true, force: true });
}
fs.mkdirSync(FRAME_DIR, { recursive: true });
fs.mkdirSync(path.dirname(SEG_OUT), { recursive: true });

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

const remaining = [];
for (let f = START_FRAME; f < END_FRAME; f++) {
  const localIdx = f - START_FRAME;
  const fp = path.join(FRAME_DIR, `f_${String(localIdx).padStart(5, '0')}.jpg`);
  if (!fs.existsSync(fp) || fs.statSync(fp).size < 4000) remaining.push(f);
}
console.log(`Range [${START_FRAME}..${END_FRAME}) -> remaining: ${remaining.length} / ${TOTAL_IN_RANGE}`);

const t0 = Date.now();
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader']
});

let cursor = 0;
let doneCount = TOTAL_IN_RANGE - remaining.length;

async function runWorker(workerIdx) {
  await new Promise(r => setTimeout(r, workerIdx * 700));
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', err => console.error(`[W${workerIdx}] PAGE_ERROR:`, err));
  await page.goto(`http://127.0.0.1:${port}/?t=0`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 120000 });

  while (true) {
    const startIdx = cursor;
    if (startIdx >= remaining.length) break;
    cursor += BATCH_SIZE;
    const batch = remaining.slice(startIdx, startIdx + BATCH_SIZE);

    const dataUrls = await page.evaluate((frames) => {
      const stage = document.getElementById('stage');
      const out = [];
      for (let i = 0; i < frames.length; i++) {
        window.renderFrame(frames[i]);
        out.push(stage.toDataURL('image/jpeg', 0.94));
      }
      return out;
    }, batch);

    for (let i = 0; i < batch.length; i++) {
      const f = batch[i];
      const localIdx = f - START_FRAME;
      const b64 = dataUrls[i].slice(dataUrls[i].indexOf(',') + 1);
      fs.writeFileSync(path.join(FRAME_DIR, `f_${String(localIdx).padStart(5, '0')}.jpg`), Buffer.from(b64, 'base64'));
    }

    doneCount += batch.length;
    if (doneCount % 90 < BATCH_SIZE || doneCount === TOTAL_IN_RANGE) {
      const el = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[W${workerIdx}] range=${START_FRAME}..${END_FRAME} done=${doneCount}/${TOTAL_IN_RANGE} (${el}s)`);
    }
  }
  await page.close();
}

await Promise.all(Array.from({ length: WORKERS }, (_, i) => runWorker(i)));
await browser.close();
server.close();
console.log(`ALL ${TOTAL_IN_RANGE} FRAMES CAPTURED in ${((Date.now() - t0) / 1000).toFixed(1)}s!`);

execSync(
  `ffmpeg -nostdin -y -framerate ${FPS} -i "${FRAME_DIR}/f_%05d.jpg" -c:v libx264 -preset fast -crf 16 -pix_fmt yuv420p -r ${FPS} -video_track_timescale 90000 -g 30 -bf 0 "${SEG_OUT}"`,
  { stdio: 'inherit' }
);
fs.rmSync(FRAME_DIR, { recursive: true, force: true });
console.log('ENCODED VIDEO SEGMENT:', SEG_OUT);
