// engine/math_color.js
// Deterministic math, easing, studio radial atmospheres & optical scene transitions

export const W = 1080;
export const H = 1920;

export function clamp(v, lo = 0, hi = 1) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function invLerp(a, b, v) {
  if (Math.abs(b - a) < 1e-9) return 0;
  return clamp((v - a) / (b - a), 0, 1);
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

export function easeOutBack(t, s = 1.25) {
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

// Exact pixel-sampled radial studio atmospheres from a.mp4 - d.mp4
export const PALETTES = {
  royalCobalt: {
    cx: 540, cy: 840, rOuter: 1380,
    stops: [
      [0.00, '#1230EE'],
      [0.44, '#0812A8'],
      [0.78, '#04066E'],
      [1.00, '#02013E']
    ],
    accent: '#FDE68A',
    accentSecondary: '#9EC5FF',
    glow: 'rgba(250, 204, 21, 0.55)'
  },
  deepIndigo: {
    cx: 540, cy: 860, rOuter: 1380,
    stops: [
      [0.00, '#1B2296'],
      [0.48, '#0E1068'],
      [0.82, '#070542'],
      [1.00, '#020124']
    ],
    accent: '#FDE68A',
    accentSecondary: '#7DD3FC',
    glow: 'rgba(125, 211, 252, 0.45)'
  },
  crimsonAmber: {
    cx: 620, cy: 1020, rOuter: 1440,
    stops: [
      [0.00, '#E89646'],
      [0.36, '#BD4338'],
      [0.72, '#781A3E'],
      [1.00, '#32083B']
    ],
    accent: '#FFFDF2',
    accentSecondary: '#FFE484',
    glow: 'rgba(255, 224, 116, 0.65)'
  },
  blueprintDark: {
    cx: 540, cy: 960, rOuter: 1350,
    stops: [
      [0.00, '#102A52'],
      [0.50, '#06132B'],
      [0.85, '#020817'],
      [1.00, '#01030B']
    ],
    accent: '#F7C948',
    accentSecondary: '#5BC0FF',
    glow: 'rgba(91, 192, 255, 0.55)'
  },
  patrioticDusk: {
    cx: 540, cy: 1480, rOuter: 1580,
    stops: [
      [0.00, '#F59E36'],
      [0.38, '#C85A48'],
      [0.72, '#6A1E82'],
      [1.00, '#270A4E']
    ],
    accent: '#FFF4B8',
    accentSecondary: '#E9D5FF',
    glow: 'rgba(255, 200, 90, 0.60)'
  }
};

let cachedGrainCanvas = null;
function getGrainCanvas() {
  if (cachedGrainCanvas) return cachedGrainCanvas;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 256);
  const rng = mulberry32(90210);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rng() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 11; // subtle editorial film grain
  }
  ctx.putImageData(img, 0, 0);
  cachedGrainCanvas = c;
  return c;
}

export function drawStudioBackdrop(ctx, paletteName, tSec = 0) {
  const pal = PALETTES[paletteName] || PALETTES.royalCobalt;
  const driftX = Math.sin(tSec * 0.45) * 24;
  const driftY = Math.cos(tSec * 0.35) * 20;
  const g = ctx.createRadialGradient(
    pal.cx + driftX, pal.cy + driftY, 40,
    pal.cx, pal.cy, pal.rOuter
  );
  for (const [stop, hex] of pal.stops) {
    g.addColorStop(stop, hex);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // If blueprintDark, draw crisp 1px CAD coordinate grid + 4 corner L-brackets
  if (paletteName === 'blueprintDark') {
    ctx.save();
    ctx.strokeStyle = 'rgba(91, 192, 255, 0.075)';
    ctx.lineWidth = 1;
    const step = 60;
    ctx.beginPath();
    for (let x = 0; x <= W; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 0; y <= H; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    // 4 Corner CAD L-brackets (exact match to ref_a_blueprint_xray.jpg)
    ctx.strokeStyle = 'rgba(148, 205, 255, 0.58)';
    ctx.lineWidth = 3;
    const mX = 56, mTop = 210, mBot = 1690, arm = 54;
    const corners = [
      [mX, mTop, 1, 1],
      [W - mX, mTop, -1, 1],
      [mX, mBot, 1, -1],
      [W - mX, mBot, -1, -1]
    ];
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * arm, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * arm);
      ctx.stroke();
      ctx.fillStyle = '#F7C948';
      ctx.beginPath();
      ctx.arc(cx + dx * 16, cy + dy * 16, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Subtle cached grain overlay to eliminate 8-bit H.264 gradient banding
  const grain = getGrainCanvas();
  const pat = ctx.createPattern(grain, 'repeat');
  ctx.save();
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Composite transition helper between outgoing buffer and incoming buffer
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

  ctx.drawImage(prevCanvas, 0, 0);

  if (type === 'radial_iris') {
    // Expanding circular iris bloom with soft feathered luminous rim (b.mp4 00:12 & 00:18)
    const e = easeInOutCubic(p);
    const maxR = 2250;
    const r = e * maxR;
    ctx.save();
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();

    // Soft glowing feather ring along expanding iris edge
    ctx.save();
    const feather = ctx.createRadialGradient(origin.x, origin.y, Math.max(0, r - 90), origin.x, origin.y, r + 60);
    feather.addColorStop(0, 'rgba(255, 225, 140, 0)');
    feather.addColorStop(0.55, `rgba(255, 220, 130, ${(0.42 * (1 - p)).toFixed(3)})`);
    feather.addColorStop(1, 'rgba(255, 225, 140, 0)');
    ctx.fillStyle = feather;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    return;
  }

  if (type === 'laser_scan') {
    // Vertical glowing laser blueprint scanline wipe (a.mp4 00:18)
    const e = easeInOutCubic(p);
    const scanX = e * W;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, scanX, H);
    ctx.clip();
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();

    // Glowing vertical cyan-white laser beam at x = scanX
    ctx.save();
    const beam = ctx.createLinearGradient(scanX - 48, 0, scanX + 48, 0);
    beam.addColorStop(0, 'rgba(91, 192, 255, 0)');
    beam.addColorStop(0.45, 'rgba(91, 192, 255, 0.65)');
    beam.addColorStop(0.50, 'rgba(255, 255, 255, 0.98)');
    beam.addColorStop(0.55, 'rgba(247, 201, 72, 0.65)');
    beam.addColorStop(1, 'rgba(247, 201, 72, 0)');
    ctx.fillStyle = beam;
    ctx.fillRect(scanX - 48, 0, 96, H);
    ctx.restore();
    return;
  }

  if (type === 'radar_sweep') {
    // Concentric sonar + angular radar sweep transition (d.mp4 00:36)
    const e = easeInOutCubic(p);
    const maxR = 2200;
    const r = e * maxR;
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, 920, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();

    ctx.save();
    for (let k = 0; k < 3; k++) {
      const rk = Math.max(10, r - k * 140);
      ctx.strokeStyle = `rgba(180, 220, 255, ${(0.55 * (1 - p) * (1 - k * 0.28)).toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(540, 920, rk, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Default: smooth optical DOF crossfade ('dof_rack' / 'camera_zoom')
  const e = easeOutCubic(p);
  ctx.save();
  ctx.globalAlpha = e;
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
