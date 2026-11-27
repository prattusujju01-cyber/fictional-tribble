// tools/render_parallel.mjs
// High-throughput multi-worker 1080x1920 @ 30fps shard renderer

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

const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/vo_timeline.json'), 'utf8'));
const TOTAL_FRAMES = timeline.totalFrames;
const NUM_SHARDS = parseInt(getArg('--num-shards=', '4'), 10);
const SHARD_IDX = parseInt(getArg('--shard=', '0'), 10);
const WORKERS = parseInt(getArg('--workers=', '3'), 10);

const perShard = Math.ceil(TOTAL_FRAMES / NUM_SHARDS);
const START_FRAME = SHARD_IDX * perShard;
const END_FRAME = Math.min(TOTAL_FRAMES, (SHARD_IDX + 1) * perShard);
const COUNT = END_FRAME - START_FRAME;

const SEG_OUT = getArg('--out=', path.join(ROOT, `out/seg_${SHARD_IDX}.mp4`));
const FRAME_DIR = path.join(ROOT, `tmp_frames_${SHARD_IDX}`);
fs.rmSync(FRAME_DIR, { recursive: true, force: true });
fs.mkdirSync(FRAME_DIR, { recursive: true });
fs.mkdirSync(path.dirname(SEG_OUT), { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ttf': 'font/ttf'
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

console.log(`[Shard ${SHARD_IDX}/${NUM_SHARDS}] Rendering frames [${START_FRAME}..${END_FRAME}) (${COUNT} frames) with ${WORKERS} workers...`);
const t0 = Date.now();

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});

let nextOffset = 0;
async function runWorker(workerId) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__READY === true || window.__ERROR !== null, { timeout: 30000 });
  const err = await page.evaluate(() => window.__ERROR);
  if (err) throw new Error(`Worker ${workerId} boot error: ${err}`);

  while (true) {
    const localIdx = nextOffset++;
    if (localIdx >= COUNT) break;
    const globalFrame = START_FRAME + localIdx;
    await page.evaluate((f) => window.renderFrame(f), globalFrame);
    const outJpg = path.join(FRAME_DIR, `f_${String(localIdx).padStart(5, '0')}.jpg`);
    await page.screenshot({ path: outJpg, type: 'jpeg', quality: 94 });
  }
  await page.close();
}

await Promise.all(Array.from({ length: WORKERS }, (_, i) => runWorker(i)));
await browser.close();
server.close();

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`[Shard ${SHARD_IDX}] Rendered ${COUNT} frames in ${elapsed}s (${(COUNT / Math.max(0.1, elapsed)).toFixed(1)} fps). Encoding H.264...`);

execSync(
  `ffmpeg -nostdin -y -framerate 30 -i "${path.join(FRAME_DIR, 'f_%05d.jpg')}" ` +
  `-c:v libx264 -preset fast -crf 16 -pix_fmt yuv420p -r 30 -video_track_timescale 90000 -g 30 -bf 0 "${SEG_OUT}"`,
  { stdio: 'inherit' }
);

fs.rmSync(FRAME_DIR, { recursive: true, force: true });
console.log(`[Shard ${SHARD_IDX}] Encoded segment -> ${SEG_OUT}`);
