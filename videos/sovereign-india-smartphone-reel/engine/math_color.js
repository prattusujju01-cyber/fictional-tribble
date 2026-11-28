// engine/math_color.js (v2.0)
// Deterministic math, 2.5D virtual camera planes, studio radial atmospheres & 6 optical scene transitions

export const W = 1080;
export const H = 1920;

export function clamp(v, lo = 0, hi = 1) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeOutCubic(t) {
  const u = clamp(t);
  return 1 - Math.pow(1 - u, 3);
}

export function easeOutQuart(t) {
  const u = clamp(t);
  return 1 - Math.pow(1 - u, 4);
}

export function easeOutQuint(t) {
  const u = clamp(t);
  return 1 - Math.pow(1 - u, 5);
}

export function easeInOutCubic(t) {
  const u = clamp(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

export function easeInOutQuart(t) {
  const u = clamp(t);
  return u < 0.5 ? 8 * u * u * u * u : 1 - Math.pow(-2 * u + 2, 4) / 2;
}

export function easeOutBack(t, s = 1.2) {
  const u = clamp(t) - 1;
  return 1 + u * u * ((s + 1) * u + s);
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Apply 2.5D Multi-Plane Camera Rig (zoom, panX, panY, rollRad) with depth parallax factor
export function withCameraPlane(ctx, cam, depthFactor, drawFn) {
  const zoom = 1 + ((cam.zoom || 1) - 1) * depthFactor;
  const px = (cam.panX || 0) * depthFactor;
  const py = (cam.panY || 0) * depthFactor;
  const roll = (cam.roll || 0) * depthFactor;
  const pivotX = cam.pivotX ?? W / 2;
  const pivotY = cam.pivotY ?? H / 2;

  ctx.save();
  ctx.translate(pivotX + px, pivotY + py);
  if (Math.abs(roll) > 1e-5) ctx.rotate(roll);
  if (Math.abs(zoom - 1) > 1e-4) ctx.scale(zoom, zoom);
  ctx.translate(-pivotX, -pivotY);
  drawFn();
  ctx.restore();
}

export const PALETTES = {
  royalCobalt: {
    cx: 540, cy: 840, rOuter: 1380,
    stops: [
      [0.00, '#1230EE'],
      [0.44, '#0812A8'],
      [0.78, '#04066E'],
      [1.00, '#02013E']
    ]
  },
  deepIndigo: {
    cx: 540, cy: 860, rOuter: 1380,
    stops: [
      [0.00, '#1B2296'],
      [0.48, '#0E1068'],
      [0.82, '#070542'],
      [1.00, '#020124']
    ]
  },
  crimsonAmber: {
    cx: 620, cy: 1020, rOuter: 1440,
    stops: [
      [0.00, '#E89646'],
      [0.36, '#BD4338'],
      [0.72, '#781A3E'],
      [1.00, '#32083B']
    ]
  },
  blueprintDark: {
    cx: 540, cy: 960, rOuter: 1350,
    stops: [
      [0.00, '#102A52'],
      [0.50, '#06132B'],
      [0.85, '#020817'],
      [1.00, '#01030B']
    ]
  },
  patrioticDusk: {
    cx: 540, cy: 1480, rOuter: 1580,
    stops: [
      [0.00, '#F59E36'],
      [0.38, '#C85A48'],
      [0.72, '#6A1E82'],
      [1.00, '#270A4E']
    ]
  }
};

// Fixed static dithering pattern (eliminates gradient banding WITHOUT causing H.264 inter-frame bitrate spikes!)
let cachedDitherCanvas = null;
function getDitherCanvas() {
  if (cachedDitherCanvas) return cachedDitherCanvas;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(128, 128);
  const rng = mulberry32(90210);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rng() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
    img.data[i + 3] = 5;
  }
  ctx.putImageData(img, 0, 0);
  cachedDitherCanvas = c;
  return c;
}

export function drawStudioBackdrop(ctx, paletteName, tSec = 0) {
  const pal = PALETTES[paletteName] || PALETTES.royalCobalt;
  const driftX = Math.sin(tSec * 0.55) * 32;
  const driftY = Math.cos(tSec * 0.42) * 26;
  const g = ctx.createRadialGradient(
    pal.cx + driftX, pal.cy + driftY, 40,
    pal.cx, pal.cy, pal.rOuter
  );
  for (const [stop, hex] of pal.stops) g.addColorStop(stop, hex);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (paletteName === 'blueprintDark') {
    ctx.save();
    ctx.strokeStyle = 'rgba(91, 192, 255, 0.08)';
    ctx.lineWidth = 1;
    const step = 60;
    ctx.beginPath();
    for (let x = 0; x <= W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(148, 205, 255, 0.62)';
    ctx.lineWidth = 3;
    const mX = 54, mTop = 204, mBot = 1710, arm = 52;
    for (const [cx, cy, dx, dy] of [
      [mX, mTop, 1, 1], [W - mX, mTop, -1, 1], [mX, mBot, 1, -1], [W - mX, mBot, -1, -1]
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * arm, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * arm);
      ctx.stroke();
      ctx.fillStyle = '#F7C948';
      ctx.beginPath(); ctx.arc(cx + dx * 16, cy + dy * 16, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = ctx.createPattern(getDitherCanvas(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// 6 Choreographed Cinematic Transitions
export function compositeTransition(ctx, prevCanvas, nextCanvas, type, progress, origin = { x: 540, y: 960 }) {
  const p = clamp(progress, 0, 1);
  if (p >= 0.999 || type === 'none') {
    ctx.drawImage(nextCanvas, 0, 0);
    return;
  }
  if (p <= 0.001) {
    ctx.drawImage(prevCanvas, 0, 0);
    return;
  }

  // 1. PORTAL CAMERA ZOOM-THROUGH (Accelerating 3D dive into next scene with optical zoom-blur!)
  if (type === 'portal_zoom_in') {
    const e = easeInOutQuart(p);
    const outScale = 1 + e * 1.65;
    const inScale = lerp(0.76, 1.0, easeOutCubic(p));

    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.scale(outScale, outScale);
    ctx.translate(-origin.x, -origin.y);
    ctx.drawImage(prevCanvas, 0, 0);
    // Subtle multi-tap optical zoom streak on outgoing frame
    ctx.globalAlpha = 0.28 * (1 - e);
    ctx.save();
    ctx.translate(origin.x, origin.y); ctx.scale(1.04, 1.04); ctx.translate(-origin.x, -origin.y);
    ctx.drawImage(prevCanvas, 0, 0);
    ctx.restore();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = easeInOutCubic(p);
    ctx.translate(W / 2, H / 2);
    ctx.scale(inScale, inScale);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();
    return;
  }

  // 2. RADIAL COLOR-ATMOSPHERE IRIS BLOOM (b.mp4 00:12 & 00:18)
  if (type === 'radial_iris') {
    ctx.drawImage(prevCanvas, 0, 0);
    const e = easeInOutCubic(p);
    const r = e * 2280;
    ctx.save();
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
    ctx.clip();
    // Slight incoming scale settle inside iris
    const s = lerp(1.06, 1.0, e);
    ctx.translate(origin.x, origin.y); ctx.scale(s, s); ctx.translate(-origin.x, -origin.y);
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();

    ctx.save();
    const feather = ctx.createRadialGradient(origin.x, origin.y, Math.max(0, r - 95), origin.x, origin.y, r + 65);
    feather.addColorStop(0, 'rgba(255, 230, 145, 0)');
    feather.addColorStop(0.55, `rgba(255, 224, 130, ${(0.48 * (1 - p)).toFixed(3)})`);
    feather.addColorStop(1, 'rgba(255, 230, 145, 0)');
    ctx.fillStyle = feather;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    return;
  }

  // 3. VERTICAL LASER BLUEPRINT SCANLINE WIPE (a.mp4 00:18)
  if (type === 'laser_scan') {
    ctx.drawImage(prevCanvas, 0, 0);
    const e = easeInOutCubic(p);
    const scanX = e * W;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, scanX, H);
    ctx.clip();
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();

    ctx.save();
    const beam = ctx.createLinearGradient(scanX - 54, 0, scanX + 54, 0);
    beam.addColorStop(0, 'rgba(91, 192, 255, 0)');
    beam.addColorStop(0.44, 'rgba(91, 192, 255, 0.72)');
    beam.addColorStop(0.50, 'rgba(255, 255, 255, 1.00)');
    beam.addColorStop(0.56, 'rgba(247, 201, 72, 0.72)');
    beam.addColorStop(1, 'rgba(247, 201, 72, 0)');
    ctx.fillStyle = beam;
    ctx.fillRect(scanX - 54, 0, 108, H);
    ctx.restore();
    return;
  }

  // 4. 360° CONCENTRIC RADAR SONAR SWEEP (d.mp4 00:36)
  if (type === 'radar_sweep') {
    ctx.drawImage(prevCanvas, 0, 0);
    const e = easeInOutCubic(p);
    const r = e * 2220;
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, 920, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();

    // Rotating radar sweep arm + 3 sonar shockwaves
    const angle = -Math.PI / 2 + e * Math.PI * 2;
    ctx.save();
    ctx.translate(540, 920);
    ctx.rotate(angle);
    const sweepGrad = ctx.createLinearGradient(0, -140, 0, 20);
    sweepGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
    sweepGrad.addColorStop(1, `rgba(250, 204, 21, ${(0.55 * (1 - p)).toFixed(3)})`);
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 1400, -0.35, 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    for (let k = 0; k < 3; k++) {
      const rk = Math.max(12, r - k * 155);
      ctx.strokeStyle = `rgba(186, 224, 255, ${(0.60 * (1 - p) * (1 - k * 0.28)).toFixed(3)})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(540, 920, rk, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // 5. KINETIC HORIZONTAL WHIP-PAN WITH MOTION TRAIL
  if (type === 'whip_pan_left') {
    const e = easeInOutQuart(p);
    const vel = Math.sin(p * Math.PI);
    const shift = e * W;

    for (const [tapOff, tapAlpha] of [[-vel * 48, 0.18], [-vel * 22, 0.26], [0, 1.0]]) {
      ctx.save();
      ctx.globalAlpha = tapAlpha;
      ctx.drawImage(prevCanvas, -shift + tapOff, 0);
      ctx.drawImage(nextCanvas, W - shift + tapOff, 0);
      ctx.restore();
    }
    return;
  }

  // 6. KINETIC VERTICAL WHIP-PAN WITH MOTION TRAIL
  if (type === 'whip_pan_up') {
    const e = easeInOutQuart(p);
    const vel = Math.sin(p * Math.PI);
    const shift = e * H;

    for (const [tapOff, tapAlpha] of [[-vel * 64, 0.18], [-vel * 30, 0.26], [0, 1.0]]) {
      ctx.save();
      ctx.globalAlpha = tapAlpha;
      ctx.drawImage(prevCanvas, 0, -shift + tapOff);
      ctx.drawImage(nextCanvas, 0, H - shift + tapOff);
      ctx.restore();
    }
    return;
  }

  ctx.drawImage(prevCanvas, 0, 0);
  ctx.save();
  ctx.globalAlpha = easeOutCubic(p);
  ctx.drawImage(nextCanvas, 0, 0);
  ctx.restore();
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
