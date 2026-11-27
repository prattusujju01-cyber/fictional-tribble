// Sovereign v15.0 — Authentic @meanwhilemayank Left-Aligned Progressive 2-Line Cumulative Captions
// Verified against strip_08.jpg, strip_09.jpg, shots_02.jpg, micro30fps_04.jpg & micro30fps_05.jpg:
// 1. STRICTLY LEFT-ALIGNED at x = 72px (NEVER centered, NEVER slot-machine swapped mid-shot).
// 2. 0.00..0.16s: Clean visual cut settles first.
// 3. 0.16..0.34s: Line 1 (44px OswaldBold uppercase) fades in smoothly with 6px upward settle.
// 4. line2Delay (~0.56s): Line 2 (84px Anton uppercase, auto-fitted <= 936px) fades in smoothly
//    flush-left directly beneath Line 1, completing ONE coherent grammatical sentence, and BOTH hold steady!

import { clamp, easeOutCubic } from './dossier.js';

const LEFT_X = 72;
const MAX_TEXT_W = 936; // 1080 - 72*2

function fitFontSize(ctx, text, family, startPx, minPx, maxW, weight = '700') {
  let px = startPx;
  while (px > minPx) {
    ctx.font = `${weight} ${px}px "${family}"`;
    if (ctx.measureText(text).width <= maxW) break;
    px -= 2;
  }
  return px;
}

export function drawProgressiveHeadline(ctx, shot, localSec) {
  if (!shot || (!shot.line1 && !shot.line2)) return;

  ctx.save();

  // Gentle studio top-edge vignette (y = 0..330px) ensuring 100% crisp headline legibility across all palettes
  const topScrim = ctx.createLinearGradient(0, 0, 0, 340);
  topScrim.addColorStop(0.0, 'rgba(10, 9, 8, 0.46)');
  topScrim.addColorStop(0.68, 'rgba(10, 9, 8, 0.20)');
  topScrim.addColorStop(1.0, 'rgba(10, 9, 8, 0.0)');
  ctx.fillStyle = topScrim;
  ctx.fillRect(0, 0, 1080, 340);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const l1Alpha = easeOutCubic((localSec - 0.14) / 0.20);
  const l2Delay = typeof shot.line2Delay === 'number' ? shot.line2Delay : 0.58;
  const l2Alpha = easeOutCubic((localSec - l2Delay) / 0.22);

  if (l1Alpha > 0.005 && shot.line1) {
    const t1 = shot.line1.toUpperCase();
    const y1 = 118 + (1 - l1Alpha) * 7;
    const px1 = fitFontSize(ctx, t1, 'OswaldBold', 44, 30, MAX_TEXT_W, '700');

    ctx.save();
    ctx.globalAlpha = clamp(l1Alpha);
    ctx.font = `700 ${px1}px "OswaldBold"`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(12, 10, 8, 0.55)';
    ctx.strokeText(t1, LEFT_X, y1);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#FAF6EE';
    ctx.fillText(t1, LEFT_X, y1);
    ctx.restore();
  }

  if (l2Alpha > 0.005 && shot.line2) {
    const t2 = shot.line2.toUpperCase();
    const y2 = 170 + (1 - l2Alpha) * 8;
    const px2 = fitFontSize(ctx, t2, 'Anton', 84, 48, MAX_TEXT_W, '700');

    ctx.save();
    ctx.globalAlpha = clamp(l2Alpha);
    ctx.font = `700 ${px2}px "Anton"`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(12, 10, 8, 0.62)';
    ctx.strokeText(t2, LEFT_X, y2);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = shot.accent || '#F49328';
    ctx.fillText(t2, LEFT_X, y2);
    ctx.restore();
  }

  ctx.restore();
}
