// Era-2 Whisper-Clean Archival Paper Grain, Fold Crease & High-Saturation Palettes (v13.0)
// Eliminates v12's heavy 46px left sidebar, screaming FIG header bars, and per-frame pattern rebuilds.
export const W = 1080;
export const H = 1920;

export function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function smoothstep(t) { t = clamp(t); return t * t * (3 - 2 * t); }
export function easeOutCubic(t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); }
export function easeOutExpo(t) { t = clamp(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
export function easeInOutCubic(t) {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// High-saturation Era-2 palettes matching @meanwhilemayank R08-R10 (Golden-Ochre, Velvet Crimson, Midnight Indigo)
export const PALETTES = {
  goldenOchre: {
    isDark: false,
    ink: '#1C140A',
    subInk: 'rgba(28,20,10,0.68)',
    accent: '#C82818',
    accentAlt: '#1B5E42',
    vignette: 'rgba(92,48,4,0.34)'
  },
  warmKraft: {
    isDark: false,
    ink: '#1A140E',
    subInk: 'rgba(26,20,14,0.68)',
    accent: '#C82818',
    accentAlt: '#1E6B48',
    vignette: 'rgba(62,40,16,0.32)'
  },
  velvetCrimson: {
    isDark: true,
    ink: '#F8F1E5',
    subInk: 'rgba(248,241,229,0.72)',
    accent: '#F7C137',
    accentAlt: '#52D1F0',
    vignette: 'rgba(18,2,4,0.46)'
  },
  midnightIndigo: {
    isDark: true,
    ink: '#F6F0E4',
    subInk: 'rgba(246,240,228,0.72)',
    accent: '#F7C137',
    accentAlt: '#F05232',
    vignette: 'rgba(4,8,18,0.48)'
  },
  volcanicAmber: {
    isDark: true,
    ink: '#FAF2E4',
    subInk: 'rgba(250,242,228,0.72)',
    accent: '#FF6A38',
    accentAlt: '#F7C137',
    vignette: 'rgba(20,5,1,0.46)'
  },
  emeraldLab: {
    isDark: true,
    ink: '#F4FAF8',
    subInk: 'rgba(244,250,248,0.72)',
    accent: '#4AE3B5',
    accentAlt: '#52D1F0',
    vignette: 'rgba(2,14,12,0.44)'
  }
};

let _cachedGrainPat = null;
let _cachedSpineDark = null;
let _cachedSpineLight = null;
let _cachedVigDark = null;
let _cachedVigLight = null;

function ensureCachedChrome(ctx) {
  if (_cachedGrainPat) return;

  const gc = document.createElement('canvas');
  gc.width = 512; gc.height = 512;
  const gx = gc.getContext('2d');
  const rnd = mulberry32(99042);
  for (let i = 0; i < 9500; i++) {
    const x = rnd() * 512;
    const y = rnd() * 512;
    gx.fillStyle = rnd() > 0.5 ? 'rgba(255,248,230,0.048)' : 'rgba(18,10,4,0.062)';
    gx.fillRect(x, y, rnd() > 0.85 ? 2 : 1, 1);
  }
  for (let i = 0; i < 180; i++) {
    const x = rnd() * 512;
    const y = rnd() * 512;
    gx.strokeStyle = rnd() > 0.5 ? 'rgba(255,244,220,0.032)' : 'rgba(24,14,6,0.036)';
    gx.lineWidth = 0.8;
    gx.beginPath();
    gx.moveTo(x, y);
    gx.lineTo(x + (rnd() - 0.5) * 7, y + 12 + rnd() * 26);
    gx.stroke();
  }
  _cachedGrainPat = ctx.createPattern(gc, 'repeat');

  _cachedSpineLight = ctx.createLinearGradient(528, 0, 540, 0);
  _cachedSpineLight.addColorStop(0, 'rgba(0,0,0,0)');
  _cachedSpineLight.addColorStop(1, 'rgba(38,22,6,0.13)');

  _cachedSpineDark = ctx.createLinearGradient(528, 0, 540, 0);
  _cachedSpineDark.addColorStop(0, 'rgba(0,0,0,0)');
  _cachedSpineDark.addColorStop(1, 'rgba(0,0,0,0.24)');

  _cachedVigLight = ctx.createRadialGradient(W * 0.5, H * 0.48, 380, W * 0.5, H * 0.5, 1180);
  _cachedVigLight.addColorStop(0, 'rgba(0,0,0,0)');
  _cachedVigLight.addColorStop(1, 'rgba(72,38,6,0.34)');

  _cachedVigDark = ctx.createRadialGradient(W * 0.5, H * 0.48, 360, W * 0.5, H * 0.5, 1160);
  _cachedVigDark.addColorStop(0, 'rgba(0,0,0,0)');
  _cachedVigDark.addColorStop(1, 'rgba(0,0,0,0.46)');
}

// Whisper-clean Era-2 archival finish: fine tactile grain + delicate x=540 fold + outer burn vignette.
// Zero chunky left gutter, zero screaming FIG header bars!
export function drawEra2Chrome(ctx, pal) {
  ensureCachedChrome(ctx);
  const isDark = pal.isDark;

  // 1. Subtle paper fibers
  ctx.save();
  ctx.globalAlpha = isDark ? 0.34 : 0.52;
  ctx.fillStyle = _cachedGrainPat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // 2. Delicate center vertical book crease at x = 540 (exact @meanwhilemayank Era-2 signature)
  ctx.save();
  ctx.fillStyle = isDark ? _cachedSpineDark : _cachedSpineLight;
  ctx.fillRect(528, 0, 12, H);
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,248,230,0.18)';
  ctx.fillRect(540, 0, 1.5, H);
  ctx.restore();

  // 3. Soft corner edge burn vignette
  ctx.save();
  ctx.fillStyle = isDark ? _cachedVigDark : _cachedVigLight;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
