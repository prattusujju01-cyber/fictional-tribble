// Choreographed Broadcast Shot-Boundary Transitions Engine (v14.0)
// Eliminates sterile hard-cut monotony via deterministic optical whip-pans, macro zoom-dives,
// warm archival film flashes, and physical cream dossier paper wipes!
import { W, H, clamp, easeOutCubic, easeOutExpo, lerp } from './dossier.js';

let _snapCanvas = null;

function getSnapCanvas() {
  if (!_snapCanvas) {
    _snapCanvas = document.createElement('canvas');
    _snapCanvas.width = W;
    _snapCanvas.height = H;
  }
  return _snapCanvas;
}

// Modifies camera state near shot start/end for whip_left / whip_right / zoom_dive continuity!
export function computeShotTransitionCamMod(shot, nextShot, localT, dur) {
  const inType = shot.trans || 'cut';
  const outType = nextShot ? (nextShot.trans || 'cut') : 'cut';
  const inWin = 0.20;
  const outWin = 0.16;

  let panOffsetX = 0;
  let zoomScale = 1.0;
  let blurX = 0;
  let radialZoom = 0;

  // Incoming transition settle (first 0.20s of shot)
  if (localT < inWin && inType !== 'cut') {
    const u = 1 - easeOutExpo(localT / inWin); // 1 -> 0 rapidly
    if (inType === 'whip_left') {
      panOffsetX = u * 1.15;
      blurX = -u * 42;
    } else if (inType === 'whip_right') {
      panOffsetX = -u * 1.15;
      blurX = u * 42;
    } else if (inType === 'zoom_dive') {
      zoomScale = 1 + u * 0.22;
      radialZoom = u;
    }
  }

  // Outgoing transition anticipation (final 0.16s of shot into next shot)
  const rem = dur - localT;
  if (rem < outWin && outType !== 'cut') {
    const u = Math.pow(clamp(1 - rem / outWin), 2.2); // 0 -> 1 accelerating
    if (outType === 'whip_left') {
      panOffsetX -= u * 1.05;
      blurX = -u * 46;
    } else if (outType === 'whip_right') {
      panOffsetX += u * 1.05;
      blurX = u * 46;
    } else if (outType === 'zoom_dive') {
      zoomScale = 1 - u * 0.20;
      radialZoom = u;
    }
  }

  return { panOffsetX, zoomScale, blurX, radialZoom };
}

// Post-render optical screen-space FX on #stage (whip smear, radial zoom rush, film flash, paper wipe)
export function renderTransitionPostFX(ctx, shot, nextShot, localT, dur, camMod) {
  const inType = shot.trans || 'cut';
  const outType = nextShot ? (nextShot.trans || 'cut') : 'cut';

  // 1. Multi-tap directional optical whip-pan blur smear
  if (Math.abs(camMod.blurX) > 2.5) {
    const snap = getSnapCanvas();
    snap.getContext('2d').drawImage(ctx.canvas, 0, 0);
    const dx = camMod.blurX;
    ctx.save();
    for (let tap = 1; tap <= 3; tap++) {
      ctx.globalAlpha = 0.20 / tap;
      ctx.drawImage(snap, dx * (tap / 3), 0);
      ctx.drawImage(snap, -dx * (tap / 4), 0);
    }
    ctx.restore();
  }

  // 2. Macro Zoom-Dive radial rush ghost
  if (camMod.radialZoom > 0.06) {
    const snap = getSnapCanvas();
    snap.getContext('2d').drawImage(ctx.canvas, 0, 0);
    const z = camMod.radialZoom;
    ctx.save();
    ctx.globalAlpha = clamp(z * 0.30, 0, 0.28);
    const sw = W * (1 + z * 0.08);
    const sh = H * (1 + z * 0.08);
    ctx.drawImage(snap, (W - sw) * 0.5, (H - sh) * 0.5, sw, sh);
    ctx.restore();
  }

  // 3. Warm Archival Film Exposure Bloom (`film_flash`)
  if (inType === 'film_flash' && localT < 0.22) {
    const a = (1 - easeOutCubic(localT / 0.22)) * 0.42;
    ctx.save();
    const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 80, W * 0.5, H * 0.5, 1100);
    g.addColorStop(0, `rgba(255, 246, 214, ${a.toFixed(3)})`);
    g.addColorStop(1, `rgba(255, 196, 92, ${(a * 0.55).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (outType === 'film_flash' && dur - localT < 0.12) {
    const a = clamp(1 - (dur - localT) / 0.12) * 0.32;
    ctx.save();
    ctx.fillStyle = `rgba(255, 240, 198, ${a.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 4. Tactile Archival Paper-Edge Wipe (`paper_wipe`)
  if (inType === 'paper_wipe' && localT < 0.22) {
    const p = easeOutCubic(localT / 0.22); // 0 -> 1 sweeping off to right
    const edgeX = lerp(-120, W + 180, p);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetX = -16;
    ctx.fillStyle = '#E8D9B8';
    ctx.beginPath();
    ctx.moveTo(edgeX, 0);
    ctx.lineTo(W + 220, 0);
    ctx.lineTo(W + 220, H);
    ctx.lineTo(edgeX - 70, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
