// Sovereign v15.0 — Era-2 World Palettes, Deterministic Math & Subtle 6-Hole Archival Sheet Chrome
export const W = 1080;
export const H = 1920;

export const PALETTES = {
  studio_day: {
    top: '#2C4251', mid: '#3B5668', bot: '#1B252E',
    glow: 'rgba(255, 194, 118, 0.22)', glowY: 0.44, dark: true
  },
  studio_alert: {
    top: '#3D181E', mid: '#591E25', bot: '#1D090D',
    glow: 'rgba(255, 76, 64, 0.26)', glowY: 0.40, dark: true
  },
  night_indigo: {
    top: '#18233C', mid: '#223254', bot: '#0C1222',
    glow: 'rgba(255, 168, 76, 0.20)', glowY: 0.56, dark: true
  },
  ochre_board: {
    top: '#BD892B', mid: '#CD9938', bot: '#7D5414',
    glow: 'rgba(255, 232, 168, 0.26)', glowY: 0.46, dark: true
  },
  crimson_bio: {
    top: '#4A1017', mid: '#6B1822', bot: '#210609',
    glow: 'rgba(255, 92, 92, 0.24)', glowY: 0.50, dark: true
  },
  slate_lab: {
    top: '#253543', mid: '#33485A', bot: '#141D26',
    glow: 'rgba(130, 212, 255, 0.18)', glowY: 0.48, dark: true
  },
  cellular_indigo: {
    top: '#132847', mid: '#1B3B66', bot: '#091426',
    glow: 'rgba(73, 206, 255, 0.25)', glowY: 0.50, dark: true
  },
  dark_anatomy: {
    top: '#232026', mid: '#322D36', bot: '#121015',
    glow: 'rgba(244, 142, 118, 0.20)', glowY: 0.50, dark: true
  },
  switchboard_green: {
    top: '#123F31', mid: '#1B5946', bot: '#09221A',
    glow: 'rgba(245, 180, 72, 0.20)', glowY: 0.48, dark: true
  },
  icu_ward: {
    top: '#1C303D', mid: '#274354', bot: '#0F1B24',
    glow: 'rgba(92, 224, 196, 0.18)', glowY: 0.48, dark: true
  }
};

export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutCubic = (t) => {
  const c = clamp(t);
  return 1 - Math.pow(1 - c, 3);
};
export const easeInOutCubic = (t) => {
  const c = clamp(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
export const easeOutBack = (t, s = 1.35) => {
  const c = clamp(t) - 1;
  return 1 + c * c * ((s + 1) * c + s);
};

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

export function drawBackdrop(ctx, paletteKey) {
  const pal = PALETTES[paletteKey] || PALETTES.ochre_board;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0.0, pal.top);
  g.addColorStop(0.48, pal.mid);
  g.addColorStop(1.0, pal.bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const rg = ctx.createRadialGradient(W * 0.52, H * pal.glowY, 40, W * 0.52, H * pal.glowY, W * 0.85);
  rg.addColorStop(0.0, pal.glow);
  rg.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);
}

let _grainTile = null;
function getGrainTile() {
  if (_grainTile) return _grainTile;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  const img = g.createImageData(512, 512);
  const d = img.data;
  const rng = mulberry32(915027);
  for (let i = 0; i < d.length; i += 4) {
    const n = Math.floor(118 + (rng() - 0.5) * 44);
    d[i] = n + 4;
    d[i + 1] = n + 1;
    d[i + 2] = n - 4;
    d[i + 3] = 19;
  }
  g.putImageData(img, 0, 0);

  // Subtle horizontal & vertical laid paper fibers
  g.strokeStyle = 'rgba(255,248,232,0.025)';
  g.lineWidth = 1;
  for (let k = 0; k < 110; k++) {
    const y = Math.floor(rng() * 512);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(512, y);
    g.stroke();
  }
  _grainTile = c;
  return _grainTile;
}

// Authentic @meanwhilemayank subtle archival sheet finish (verified in strip_08.jpg & strip_09.jpg):
// - Cached paper fiber weave
// - Whisper-thin x = 540 vertical center fold crease + subtle horizontal crease
// - 6 delicate r = 6.5px punched circular binder holes at x = 25px (ZERO black sidebar!)
// - Soft framing vignette
export function drawArchivalSheetChrome(ctx) {
  ctx.save();

  // 1. Paper fiber texture
  const tile = getGrainTile();
  for (let y = 0; y < H; y += 512) {
    for (let x = 0; x < W; x += 512) {
      ctx.drawImage(tile, x, y);
    }
  }

  // 2. Vertical center fold crease at x = 540
  const foldG = ctx.createLinearGradient(534, 0, 546, 0);
  foldG.addColorStop(0.0, 'rgba(0,0,0,0)');
  foldG.addColorStop(0.45, 'rgba(0,0,0,0.16)');
  foldG.addColorStop(0.55, 'rgba(255,250,238,0.06)');
  foldG.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = foldG;
  ctx.fillRect(534, 0, 12, H);

  // Subtle horizontal quarter-fold hints
  for (const fy of [640, 1280]) {
    const hg = ctx.createLinearGradient(0, fy - 4, 0, fy + 4);
    hg.addColorStop(0.0, 'rgba(0,0,0,0)');
    hg.addColorStop(0.5, 'rgba(0,0,0,0.08)');
    hg.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, fy - 4, W, 8);
  }

  // 3. Soft edge vignette
  const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.36, W * 0.5, H * 0.5, H * 0.62);
  vg.addColorStop(0.0, 'rgba(0,0,0,0)');
  vg.addColorStop(1.0, 'rgba(6,5,4,0.26)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // 4. 6 subtle punched binder holes on left margin (x = 25, r = 6.5px — NO dark bar)
  const holeYs = [205, 505, 805, 1105, 1405, 1705];
  for (const hy of holeYs) {
    ctx.beginPath();
    ctx.arc(25, hy, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(14, 12, 10, 0.52)';
    ctx.fill();

    // Inner top-left shadow & bottom-right paper rim
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.arc(25, hy, 6.5, Math.PI * 0.85, Math.PI * 1.95);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 248, 232, 0.18)';
    ctx.beginPath();
    ctx.arc(25, hy, 6.5, -0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  ctx.restore();
}
