// engine/camera_v3.js
// Sovereign v3.0 High-Velocity Kinetic Camera, Exponential Snap-Zoom, 4-Tap Shutter Blur & Reference Transitions

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

// Aggressive S-curve whip/snap easing (matches @jay_speaks.in 10-14 frame fast zooms & country hops!)
export function expoInOut(t) {
  const u = clamp(t, 0, 1);
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return u < 0.5
    ? Math.pow(2, 18 * u - 9) / 2
    : (2 - Math.pow(2, -18 * u + 9)) / 2;
}

// Crisp spring overshoot settle on snap landings (2.4% tactile settle, zero cartoon bounce)
export function snapOutSpring(t) {
  const u = clamp(t, 0, 1);
  const c1 = 1.35;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
}

// Logarithmic scale interpolation: constant perceptual optical velocity across 4x-10x zoom ratios!
export function expScale(s0, s1, u) {
  const a = Math.max(0.001, s0);
  const b = Math.max(0.001, s1);
  return a * Math.pow(b / a, u);
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

/**
 * Evaluate multi-beat keyframed 2.5D camera at localTimeSec.
 * Each keyframe: { t, x: 0, y: 0, zoom: 1.0, roll: 0, curve: 'whip' | 'spring' | 'drift' }
 * x, y are focal target offsets in world space (positive x shifts camera look-target right).
 */
export function evalKeyframedCamera(localTimeSec, keyframes) {
  if (!keyframes || keyframes.length === 0) {
    return { x: 0, y: 0, zoom: 1, roll: 0, speed: 0 };
  }
  if (localTimeSec <= keyframes[0].t) {
    const k = keyframes[0];
    return { x: k.x || 0, y: k.y || 0, zoom: k.zoom || 1, roll: k.roll || 0, speed: 0 };
  }
  const last = keyframes[keyframes.length - 1];
  if (localTimeSec >= last.t) {
    return { x: last.x || 0, y: last.y || 0, zoom: last.zoom || 1, roll: last.roll || 0, speed: 0 };
  }

  let i = 0;
  for (let k = 0; k < keyframes.length - 1; k++) {
    if (localTimeSec >= keyframes[k].t && localTimeSec < keyframes[k + 1].t) {
      i = k;
      break;
    }
  }

  const k0 = keyframes[i];
  const k1 = keyframes[i + 1];
  const dt = Math.max(0.001, k1.t - k0.t);
  const rawU = clamp((localTimeSec - k0.t) / dt, 0, 1);

  const curve = k1.curve || 'whip';
  let u;
  if (curve === 'spring') u = snapOutSpring(rawU);
  else if (curve === 'drift') u = easeInOutCubic(rawU);
  else u = expoInOut(rawU);

  const x = lerp(k0.x || 0, k1.x || 0, u);
  const y = lerp(k0.y || 0, k1.y || 0, u);
  const zoom = expScale(k0.zoom || 1, k1.zoom || 1, u);
  const roll = lerp(k0.roll || 0, k1.roll || 0, u);

  // Instantaneous velocity estimate via finite difference (pixels/sec + zoom-equiv pixels/sec)
  const eps = 0.008;
  const rawU2 = clamp((localTimeSec + eps - k0.t) / dt, 0, 1);
  const u2 = curve === 'spring' ? snapOutSpring(rawU2) : curve === 'drift' ? easeInOutCubic(rawU2) : expoInOut(rawU2);
  const dx = (lerp(k0.x || 0, k1.x || 0, u2) - x) / eps;
  const dy = (lerp(k0.y || 0, k1.y || 0, u2) - y) / eps;
  const dz = Math.abs(Math.log(expScale(k0.zoom || 1, k1.zoom || 1, u2) / zoom)) / eps;
  const speed = Math.hypot(dx, dy) + dz * 950;

  return { x, y, zoom, roll, speed };
}

// Transform context for a parallax depth layer under camera cam (look-at point (W/2 + cam.x, H/2 + cam.y))
export function withCameraPlane(ctx, cam, depthFactor, drawFn) {
  const z = Math.pow(cam.zoom || 1, depthFactor);
  const lx = (cam.x || 0) * depthFactor;
  const ly = (cam.y || 0) * depthFactor;
  const r = (cam.roll || 0) * depthFactor;

  ctx.save();
  ctx.translate(W / 2, H / 2);
  if (Math.abs(r) > 1e-5) ctx.rotate(r);
  if (Math.abs(z - 1) > 1e-4) ctx.scale(z, z);
  ctx.translate(-W / 2 - lx, -H / 2 - ly);
  drawFn();
  ctx.restore();
}

// Reusable scratch canvas for 4-tap shutter-sampled camera motion blur
let mbScratch = null;
function getMbScratch() {
  if (!mbScratch) {
    mbScratch = document.createElement('canvas');
    mbScratch.width = W;
    mbScratch.height = H;
  }
  return mbScratch;
}

/**
 * Renders a scene function `drawAt(ctx, sampleLocalTime)` with real 4-tap 180-degree cinema shutter blur
 * whenever camera velocity exceeds threshold (during fast zooms, snap pull-backs, and whip-pans!).
 */
export function renderWithShutterBlur(targetCtx, localTimeSec, keyframes, drawAtFn) {
  const camNow = evalKeyframedCamera(localTimeSec, keyframes);
  if (camNow.speed < 480) {
    drawAtFn(targetCtx, localTimeSec, camNow);
    return;
  }

  // 4-tap shutter integration across [-0.018s .. 0.000s]
  const samples = [
    { dt: -0.018, w: 0.16 },
    { dt: -0.012, w: 0.22 },
    { dt: -0.006, w: 0.28 },
    { dt:  0.000, w: 0.34 }
  ];

  const scratch = getMbScratch();
  const sctx = scratch.getContext('2d');
  targetCtx.clearRect(0, 0, W, H);

  for (let i = 0; i < samples.length; i++) {
    const st = Math.max(0, localTimeSec + samples[i].dt);
    const scam = evalKeyframedCamera(st, keyframes);
    sctx.clearRect(0, 0, W, H);
    drawAtFn(sctx, st, scam);

    targetCtx.save();
    // Normalized cumulative over-blend so sum of opacities = 1.0 with zero darkening!
    const cumAlpha = i === 0 ? 1.0 : samples[i].w / samples.slice(0, i + 1).reduce((a, b) => a + b.w, 0);
    targetCtx.globalAlpha = cumAlpha;
    targetCtx.drawImage(scratch, 0, 0);
    targetCtx.restore();
  }
}

// Studio Radial Atmospheres
export const PALETTES = {
  royalCobalt: {
    cx: 540, cy: 840, rOuter: 1380,
    stops: [[0.00, '#1230EE'], [0.44, '#0812A8'], [0.78, '#04066E'], [1.00, '#02013E']]
  },
  deepIndigo: {
    cx: 540, cy: 860, rOuter: 1380,
    stops: [[0.00, '#1B2296'], [0.48, '#0E1068'], [0.82, '#070542'], [1.00, '#020124']]
  },
  crimsonAmber: {
    cx: 620, cy: 1000, rOuter: 1440,
    stops: [[0.00, '#E89646'], [0.36, '#BD4338'], [0.72, '#781A3E'], [1.00, '#32083B']]
  },
  blueprintDark: {
    cx: 540, cy: 960, rOuter: 1350,
    stops: [[0.00, '#102A52'], [0.50, '#06132B'], [0.85, '#020817'], [1.00, '#01030B']]
  },
  patrioticDusk: {
    cx: 540, cy: 1480, rOuter: 1580,
    stops: [[0.00, '#F59E36'], [0.38, '#C85A48'], [0.72, '#6A1E82'], [1.00, '#270A4E']]
  }
};

let cachedDither = null;
function getDither() {
  if (cachedDither) return cachedDither;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(128, 128);
  const rng = mulberry32(90210);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rng() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 5;
  }
  ctx.putImageData(img, 0, 0);
  cachedDither = c;
  return c;
}

export function drawStudioBackdrop(ctx, paletteName, tSec = 0) {
  const pal = PALETTES[paletteName] || PALETTES.royalCobalt;
  const g = ctx.createRadialGradient(
    pal.cx + Math.sin(tSec * 0.6) * 32,
    pal.cy + Math.cos(tSec * 0.45) * 26,
    40,
    pal.cx, pal.cy, pal.rOuter
  );
  for (const [stop, hex] of pal.stops) g.addColorStop(stop, hex);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (paletteName === 'blueprintDark') {
    ctx.save();
    ctx.strokeStyle = 'rgba(91, 192, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += 60) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(148, 205, 255, 0.65)';
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
  ctx.fillStyle = ctx.createPattern(getDither(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ============================================================================
// THE 6 REFERENCE-LOCKED v3.0 HIGH-VELOCITY SCENE TRANSITIONS
// ============================================================================
export function compositeV3Transition(ctx, prevCanvas, nextCanvas, type, progress, origin = { x: 540, y: 620 }) {
  const p = clamp(progress, 0, 1);
  if (p >= 0.999 || type === 'none') {
    ctx.drawImage(nextCanvas, 0, 0);
    return;
  }
  if (p <= 0.001) {
    ctx.drawImage(prevCanvas, 0, 0);
    return;
  }

  // 1. CIRCULAR TARGET PORTAL DIVE (Exact match to cam_a_kashmir_dive.jpg Row 2 Tiles 4-6!)
  // Outgoing India map zooms 1.0 -> 4.6x into target pin while golden-rimmed portal circle peels open next world!
  if (type === 'circular_portal_dive') {
    const e = expoInOut(p);
    const outZoom = expScale(1.0, 4.6, e);

    // Multi-tap zoom-blurred outgoing dive
    for (const [sMul, alpha] of [[0.92, 0.25], [0.96, 0.35], [1.0, 1.0]]) {
      const z = outZoom * sMul;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(origin.x, origin.y);
      ctx.scale(z, z);
      ctx.translate(-origin.x, -origin.y);
      ctx.drawImage(prevCanvas, 0, 0);
      ctx.restore();
    }

    // Expanding golden-rimmed cobalt portal circle from target pin!
    const r = expoInOut(clamp((p - 0.06) / 0.94, 0, 1)) * 1950;
    if (r > 4) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
      ctx.clip();
      const inScale = expScale(0.55, 1.0, easeOutQuart(p));
      ctx.translate(origin.x, origin.y);
      ctx.scale(inScale, inScale);
      ctx.translate(-origin.x, -origin.y);
      ctx.drawImage(nextCanvas, 0, 0);
      ctx.restore();

      // Crisp luminous golden rim around expanding portal circle (exact match to a.mp4 00:01.3!)
      ctx.save();
      ctx.strokeStyle = `rgba(255, 232, 140, ${(0.92 * (1 - p * 0.65)).toFixed(3)})`;
      ctx.lineWidth = 4.5;
      ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  // 2. PLANETARY HORIZON SPHERE WIPE (Exact match to cam_d_horizon_wipe.jpg Row 3 Tiles 1-6!)
  if (type === 'planetary_horizon_wipe') {
    const e = expoInOut(p);
    // Outgoing world pushes upward & recedes slightly
    ctx.save();
    ctx.translate(0, -e * 420);
    ctx.drawImage(prevCanvas, 0, 0);
    ctx.restore();

    // Giant curved planetary horizon sphere rising from bottom -> enveloping full frame
    const R = 1750;
    const sphereCy = lerp(H + R + 80, H * 0.48, e);
    ctx.save();
    ctx.shadowColor = 'rgba(2, 4, 48, 0.92)';
    ctx.shadowBlur = 65;
    ctx.beginPath();
    ctx.arc(W / 2, sphereCy, R, 0, Math.PI * 2);
    ctx.fillStyle = '#040866';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, sphereCy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(0, (1 - e) * 380);
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();

    // Subtle atmospheric horizon arc rim
    ctx.save();
    ctx.strokeStyle = `rgba(148, 197, 255, ${(0.55 * (1 - p)).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(W / 2, sphereCy, R, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // 3. AXIAL SNAP-ZOOM PORTAL (4.4x exponential zoom-through + spring snap landing!)
  if (type === 'snap_zoom_portal') {
    const e = expoInOut(p);
    const outZ = expScale(1.0, 4.4, e);
    const inZ = lerp(0.42, 1.0, snapOutSpring(clamp((p - 0.12) / 0.88, 0, 1)));

    for (const [m, a] of [[0.90, 0.24], [0.95, 0.34], [1.0, 1.0]]) {
      ctx.save();
      ctx.globalAlpha = a * (1 - easeInOutCubic(p));
      ctx.translate(origin.x, origin.y);
      ctx.scale(outZ * m, outZ * m);
      ctx.translate(-origin.x, -origin.y);
      ctx.drawImage(prevCanvas, 0, 0);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = clamp(p / 0.42, 0, 1);
    ctx.translate(W / 2, H / 2);
    ctx.scale(inZ, inZ);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();
    return;
  }

  // 4. SNAP ZOOM-OUT WITH OPTICAL DOF BLUR PULSE (Exact match to cam_b_snap_zoomout_blur.jpg!)
  if (type === 'snap_zoomout_dof') {
    const e = expoInOut(p);
    const outZ = expScale(1.0, 0.26, e);
    const inZ = expScale(2.8, 1.0, e);
    const blurAmt = Math.sin(p * Math.PI) * 13;

    ctx.save();
    if (blurAmt > 0.6) ctx.filter = `blur(${blurAmt.toFixed(1)}px)`;
    ctx.drawImage(nextCanvas, 0, 0);

    ctx.globalAlpha = 1 - e;
    ctx.translate(W / 2, H / 2);
    ctx.scale(outZ, outZ);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(prevCanvas, 0, 0);

    ctx.globalAlpha = e;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(W / 2, H / 2);
    ctx.scale(inZ, inZ);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();
    return;
  }

  // 5. RADIAL IRIS COLOR BLOOM + CAMERA PUNCH
  if (type === 'radial_iris_punch') {
    ctx.drawImage(prevCanvas, 0, 0);
    const e = expoInOut(p);
    const r = e * 2280;
    const inS = lerp(1.22, 1.0, snapOutSpring(p));

    ctx.save();
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(origin.x, origin.y);
    ctx.scale(inS, inS);
    ctx.translate(-origin.x, -origin.y);
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();

    ctx.save();
    const feather = ctx.createRadialGradient(origin.x, origin.y, Math.max(0, r - 95), origin.x, origin.y, r + 70);
    feather.addColorStop(0, 'rgba(255, 232, 145, 0)');
    feather.addColorStop(0.55, `rgba(255, 224, 130, ${(0.58 * (1 - p)).toFixed(3)})`);
    feather.addColorStop(1, 'rgba(255, 232, 145, 0)');
    ctx.fillStyle = feather;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    return;
  }

  // 6. HIGH-SPEED VERTICAL LASER BLUEPRINT SCANLINE
  if (type === 'laser_blueprint_scan') {
    ctx.drawImage(prevCanvas, 0, 0);
    const e = expoInOut(p);
    const scanX = e * W;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, scanX, H);
    ctx.clip();
    ctx.drawImage(nextCanvas, 0, 0);
    ctx.restore();

    ctx.save();
    const beam = ctx.createLinearGradient(scanX - 60, 0, scanX + 60, 0);
    beam.addColorStop(0, 'rgba(91, 192, 255, 0)');
    beam.addColorStop(0.44, 'rgba(91, 192, 255, 0.78)');
    beam.addColorStop(0.50, 'rgba(255, 255, 255, 1.00)');
    beam.addColorStop(0.56, 'rgba(247, 201, 72, 0.78)');
    beam.addColorStop(1, 'rgba(247, 201, 72, 0)');
    ctx.fillStyle = beam;
    ctx.fillRect(scanX - 60, 0, 120, H);
    ctx.restore();
    return;
  }

  // 7. DIRECTIONAL HORIZONTAL OR VERTICAL WHIP-PAN WITH 4-TAP SHUTTER STREAKS
  if (type === 'whip_pan_left' || type === 'whip_pan_up') {
    const e = expoInOut(p);
    const vel = Math.sin(p * Math.PI);
    const isHoriz = type === 'whip_pan_left';
    const span = isHoriz ? W : H;
    const shift = e * span;

    for (const [mul, a] of [[-95, 0.18], [-55, 0.25], [-22, 0.34], [0, 1.0]]) {
      const off = vel * mul;
      ctx.save();
      ctx.globalAlpha = a;
      if (isHoriz) {
        ctx.drawImage(prevCanvas, -shift + off, 0);
        ctx.drawImage(nextCanvas, W - shift + off, 0);
      } else {
        ctx.drawImage(prevCanvas, 0, -shift + off);
        ctx.drawImage(nextCanvas, 0, H - shift + off);
      }
      ctx.restore();
    }
    return;
  }

  ctx.drawImage(nextCanvas, 0, 0);
}
