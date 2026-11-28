// engine/isro_models.js
// Bespoke Procedural 3D/CAD Aerospace & Lunar Engineering Assemblies for Topic #3:
//  1. Hollywood (Interstellar ₹1,350 Cr) vs ISRO Chandrayaan-3 / LVM3 Rocket (₹615 Cr — 54% LESS!)
//  2. 5-Orbit Oberth Earth-to-Moon Gravity-Assist Slingshot & Lunar South Pole (69.37°S)
//  3. 3-Stage LVM3 + Indigenous CE-20 Cryogenic Engine (-253°C) + Laser-Guided Vikram Lander CAD X-Ray
//  4. Curiosity Lock (🔒 434 -> 🔓 434 sats), 3-Mission Poll & DM Share Card

import { W, H, clamp, lerp, easeOutCubic, easeOutQuart, snapOutSpring, roundRectPath } from './camera_v3.js';
import { drawTrackedCaps, drawOdometer } from './typography.js';

export function drawFrostedCard(ctx, x, y, w, h, opts = {}) {
  const {
    radius = 28,
    fill = 'rgba(255, 255, 255, 0.085)',
    borderTop = 'rgba(255, 255, 255, 0.58)',
    borderBot = 'rgba(255, 255, 255, 0.14)',
    borderWidth = 1.6,
    glowColor = null,
    glowBlur = 0,
    alpha = 1.0,
    blurPx = 0
  } = opts;

  if (alpha <= 0.005) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (blurPx > 0.3) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;

  if (glowColor && glowBlur > 0) {
    ctx.save();
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  } else {
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.55);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0.00)');
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = sheen;
  ctx.fill();

  const sg = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
  sg.addColorStop(0, borderTop);
  sg.addColorStop(1, borderBot);
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.strokeStyle = sg;
  ctx.lineWidth = borderWidth;
  ctx.stroke();
  ctx.restore();
}

export function drawChapterRail(ctx, chapters, activeIdx, alpha = 1) {
  if (alpha <= 0.01) return;
  const startX = 82, y = 112, stepX = 82, count = 7;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count - 1; i++) {
    const x1 = startX + i * stepX, x2 = startX + (i + 1) * stepX;
    const done = (i + 1) <= activeIdx;
    ctx.strokeStyle = done ? '#FACC15' : 'rgba(255, 255, 255, 0.30)';
    ctx.lineWidth = done ? 2.6 : 1.6;
    ctx.beginPath(); ctx.moveTo(x1 + 9, y); ctx.lineTo(x2 - 9, y); ctx.stroke();
  }
  for (let i = 0; i < count; i++) {
    const cx = startX + i * stepX, chapNum = i + 1;
    if (chapNum === activeIdx) {
      ctx.save();
      ctx.shadowColor = 'rgba(250, 204, 21, 0.85)'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#FFE066';
      ctx.beginPath(); ctx.arc(cx, y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const label = chapters[chapNum] ? chapters[chapNum].label : '';
      drawTrackedCaps(ctx, label, Math.max(82, cx - 28), y + 40, { fontSize: 19, tracking: 3.4, color: '#FFFFFF' });
    } else if (chapNum < activeIdx) {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath(); ctx.arc(cx, y, 6.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(cx, y, 6.5, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawPadlockIcon(ctx, cx, cy, size = 44, unlockedProgress = 0, color = '#FACC15') {
  const s = size / 44;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.save();
  ctx.translate(11, -6 - unlockedProgress * 9);
  ctx.rotate(-unlockedProgress * 0.48);
  ctx.strokeStyle = color; ctx.lineWidth = 4.6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, 6); ctx.lineTo(-22, -6);
  ctx.arc(-11, -6, 11, Math.PI, 0, false);
  ctx.lineTo(0, unlockedProgress > 0.2 ? 0 : 6);
  ctx.stroke();
  ctx.restore();
  roundRectPath(ctx, -18, -2, 36, 28, 7);
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#07106B';
  ctx.beginPath(); ctx.arc(0, 9, 3.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-1.8, 11, 3.6, 8);
  ctx.restore();
}

export function drawCuriosityLockWidget(ctx, mode, p = 1) {
  if (mode === 'docked') {
    const bx = 832, by = 82, bw = 174, bh = 60;
    drawFrostedCard(ctx, bx, by, bw, bh, { radius: 18, fill: 'rgba(18, 28, 145, 0.56)' });
    drawPadlockIcon(ctx, bx + 42, by + 31, 26, 0, '#FACC15');
    ctx.save();
    ctx.filter = 'blur(7px)';
    ctx.font = '600 28px PlusJakarta';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('434', bx + 78, by + 40);
    ctx.restore();
    return;
  }

  if (mode === 'plant') {
    const appear = easeOutCubic(clamp(p / 0.20, 0, 1));
    const dockT = easeOutQuart(clamp((p - 0.76) / 0.24, 0, 1));
    const cx = lerp(540, 919, dockT), cy = lerp(1120, 112, dockT);
    const bw = lerp(660, 174, dockT), bh = lerp(240, 60, dockT);
    const bx = cx - bw / 2, by = cy - bh / 2;

    drawFrostedCard(ctx, bx, by, bw, bh, {
      radius: lerp(32, 18, dockT),
      fill: 'rgba(14, 24, 142, 0.72)',
      borderTop: 'rgba(255, 240, 180, 0.7)',
      glowColor: 'rgba(250, 204, 21, 0.28)',
      glowBlur: 28 * (1 - dockT),
      alpha: appear
    });
    drawPadlockIcon(ctx, bx + lerp(125, 42, dockT), cy - lerp(12, 0, dockT), lerp(58, 26, dockT), 0, '#FACC15');

    ctx.save();
    ctx.globalAlpha = appear;
    ctx.filter = `blur(${lerp(15, 7, dockT).toFixed(1)}px)`;
    ctx.font = `600 ${Math.round(lerp(110, 28, dockT))}px PlusJakarta`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('434', bx + lerp(245, 78, dockT), cy + lerp(24, 9, dockT));
    ctx.restore();

    if (dockT < 0.45) {
      const subA = appear * (1 - dockT / 0.45);
      drawTrackedCaps(ctx, 'FOREIGN SATELLITES', bx + 52, by + bh - 38, { fontSize: 18, alpha: subA });
      drawTrackedCaps(ctx, 'LOCKED', bx + bw - 52, by + bh - 38, { fontSize: 18, color: '#FDE68A', align: 'right', alpha: subA });
    }
    return;
  }

  if (mode === 'unlock') {
    const flyT = snapOutSpring(clamp(p / 0.24, 0, 1));
    const openT = easeOutCubic(clamp((p - 0.20) / 0.28, 0, 1));
    const cx = lerp(919, 540, clamp(flyT, 0, 1));
    const cy = lerp(112, 650, clamp(flyT, 0, 1));
    const bw = lerp(174, 830, clamp(flyT, 0, 1));
    const bh = lerp(60, 285, clamp(flyT, 0, 1));
    const bx = cx - bw / 2, by = cy - bh / 2;

    drawFrostedCard(ctx, bx, by, bw, bh, {
      radius: lerp(18, 34, clamp(flyT, 0, 1)),
      fill: 'rgba(10, 18, 128, 0.80)',
      borderTop: 'rgba(255, 238, 160, 0.88)',
      glowColor: 'rgba(250, 204, 21, 0.48)',
      glowBlur: 42 * openT
    });
    drawPadlockIcon(ctx, bx + lerp(42, 130, clamp(flyT, 0, 1)), cy - lerp(0, 18, clamp(flyT, 0, 1)), lerp(26, 72, clamp(flyT, 0, 1)), openT, '#FACC15');

    if (openT > 0.12) {
      drawOdometer(ctx, {
        startValue: 90,
        value: 434,
        suffix: 'sats',
        suffixItalicSerif: true,
        progress: clamp((p - 0.18) / 0.36, 0, 1),
        x: bx + 500,
        y: cy + 32,
        fontSize: 136,
        weight: 300,
        color: '#FFFFFF',
        suffixColor: '#FDE68A'
      });
    }
    if (flyT > 0.7) {
      drawTrackedCaps(ctx, 'LAUNCHED FOR 36 COUNTRIES FROM SRIHARIKOTA', cx, by + bh - 42, {
        fontSize: 18.5, tracking: 2.8, align: 'center', color: '#FFFFFF'
      });
    }
  }
}

// ============================================================================
// HOLLYWOOD INTERSTELLAR (₹1,350 Cr) VS CHANDRAYAAN-3 / LVM3 (₹615 Cr!) (S04)
// ============================================================================
export function drawHollywoodVsISROMonument(ctx, opts = {}) {
  const {
    baseY = 1290,
    hollywoodProgress = 1.0,
    isroProgress = 1.0,
    tSec = 0
  } = opts;

  const maxBarH = 650; // ₹1,350 Cr = 650px tall!
  const hollyH = maxBarH * easeOutQuart(clamp(hollywoodProgress, 0, 1));
  const isroBarH = (615 / 1350) * maxBarH * easeOutQuart(clamp(isroProgress, 0, 1)); // ~296px!

  ctx.save();
  // Baseline axis
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(76, baseY); ctx.lineTo(W - 76, baseY); ctx.stroke();

  // --- LEFT: HOLLYWOOD SCI-FI MOVIE BUDGET BAR (₹1,350 CRORE — INTERSTELLAR) ---
  const hx = 140, hw = 285;
  const hTopY = baseY - hollyH;
  if (hollyH > 15) {
    drawFrostedCard(ctx, hx, hTopY, hw, hollyH, {
      radius: 24,
      fill: 'rgba(255, 255, 255, 0.13)',
      borderTop: 'rgba(255, 255, 255, 0.55)'
    });

    // Cinema film-strip perforations & clapper icon inside bar
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let py = hTopY + 26; py < baseY - 26; py += 36) {
      roundRectPath(ctx, hx + 16, py, 12, 18, 3); ctx.fill();
      roundRectPath(ctx, hx + hw - 28, py, 12, 18, 3); ctx.fill();
    }
    // Cinema reel icon
    const rcx = hx + hw / 2, rcy = hTopY + Math.min(110, hollyH * 0.35);
    if (hollyH > 160) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(rcx, rcy, 38, 0, Math.PI * 2); ctx.stroke();
      for (let a = 0; a < 5; a++) {
        const ang = (a / 5) * Math.PI * 2 + tSec * 0.8;
        ctx.beginPath(); ctx.arc(rcx + Math.cos(ang) * 18, rcy + Math.sin(ang) * 18, 6, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();

    drawOdometer(ctx, {
      prefix: '₹', startValue: 300, value: 1350, suffix: 'Cr',
      indianGrouping: true,
      progress: hollywoodProgress,
      x: hx + hw / 2, y: hTopY - 32, fontSize: 66, weight: 300, color: 'rgba(255,255,255,0.92)'
    });
    drawTrackedCaps(ctx, 'INTERSTELLAR • MOVIE', hx + hw / 2, baseY + 42, {
      fontSize: 16.5, tracking: 2.4, align: 'center', color: 'rgba(255,255,255,0.82)'
    });
  }

  // --- RIGHT: CHANDRAYAAN-3 REAL MOON MISSION BUDGET (₹615 CRORE!) + GOLDEN LVM3 ROCKET! ---
  const ix = 555, iw = 365;
  const iTopY = baseY - isroBarH;
  if (isroProgress > 0.02) {
    // Luminous Golden ₹615 Cr Cost Pedestal
    drawFrostedCard(ctx, ix, iTopY, iw, Math.max(24, isroBarH), {
      radius: 26,
      fill: 'rgba(255, 224, 102, 0.26)',
      borderTop: '#FFFDF2',
      borderWidth: 2.4,
      glowColor: 'rgba(250, 204, 21, 0.55)',
      glowBlur: 36
    });

    // Architectural LVM3-M4 Heavy Rocket standing/igniting above the ₹615 Cr pedestal!
    const rx = ix + iw / 2;
    const rocketBaseY = iTopY - 12;
    const rScale = easeOutQuart(clamp(isroProgress, 0, 1));
    const rH = 335 * rScale;

    if (rH > 30) {
      ctx.save();
      // Golden ignition plasma plume at base
      const flicker = 1 + Math.sin(tSec * 28) * 0.08;
      const pg = ctx.createRadialGradient(rx, rocketBaseY + 6, 4, rx, rocketBaseY + 24, 65 * flicker);
      pg.addColorStop(0, '#FFFFFF');
      pg.addColorStop(0.35, 'rgba(253, 224, 71, 0.85)');
      pg.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(rx, rocketBaseY + 12, 65 * flicker, 0, Math.PI * 2); ctx.fill();

      // Core Stage (L110 + CE-20 + Payload Fairing)
      const coreW = 46;
      const noseH = rH * 0.28;
      const bodyTopY = rocketBaseY - rH + noseH;
      roundRectPath(ctx, rx - coreW / 2, bodyTopY, coreW, rH - noseH, 6);
      ctx.fillStyle = '#FFFBEB';
      ctx.fill();
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Nosecone Fairing (Vikram & Pragyan inside)
      ctx.beginPath();
      ctx.moveTo(rx - coreW / 2, bodyTopY);
      ctx.quadraticCurveTo(rx - coreW * 0.48, rocketBaseY - rH + noseH * 0.25, rx, rocketBaseY - rH);
      ctx.quadraticCurveTo(rx + coreW * 0.48, rocketBaseY - rH + noseH * 0.25, rx + coreW / 2, bodyTopY);
      ctx.closePath();
      ctx.fillStyle = '#FEF08A';
      ctx.fill();
      ctx.stroke();

      // Saffron-White-Green Indian Tricolor Band on Fairing
      ctx.fillStyle = '#F97316'; ctx.fillRect(rx - 16, bodyTopY + 16, 32, 5);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(rx - 16, bodyTopY + 21, 32, 5);
      ctx.fillStyle = '#16A34A'; ctx.fillRect(rx - 16, bodyTopY + 26, 32, 5);

      // Twin S200 Solid Strap-On Boosters
      const bW = 24, bH = rH * 0.62;
      for (const side of [-1, 1]) {
        const bx = side < 0 ? rx - coreW / 2 - bW - 5 : rx + coreW / 2 + 5;
        const bTop = rocketBaseY - bH;
        roundRectPath(ctx, bx, bTop + 22, bW, bH - 22, 4);
        ctx.fillStyle = 'rgba(255, 251, 235, 0.92)';
        ctx.fill();
        ctx.stroke();
        // Booster cone
        ctx.beginPath();
        ctx.moveTo(bx, bTop + 22);
        ctx.lineTo(bx + bW / 2, bTop);
        ctx.lineTo(bx + bW, bTop + 22);
        ctx.closePath();
        ctx.fillStyle = '#FDE047';
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // Giant ₹615 Cr Odometer above rocket!
      drawOdometer(ctx, {
        prefix: '₹', startValue: 120, value: 615, suffix: 'Cr',
        progress: isroProgress,
        x: rx, y: rocketBaseY - rH - 36, fontSize: 112, weight: 300, color: '#FFFFFF', suffixColor: '#FFF7D6'
      });
    }

    // 54% LESS THAN THE MOVIE comparison bracket!
    if (isroProgress > 0.65) {
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255, 248, 210, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx + hw, hTopY);
      ctx.lineTo(ix + iw, hTopY);
      ctx.stroke();
      ctx.restore();

      drawFrostedCard(ctx, ix + 32, iTopY + isroBarH * 0.5 - 30, iw - 64, 60, {
        radius: 30, fill: 'rgba(50, 8, 59, 0.72)', borderTop: '#FFFDF2'
      });
      drawTrackedCaps(ctx, '54% CHEAPER • REAL MOON!', ix + iw / 2, iTopY + isroBarH * 0.5, {
        fontSize: 15.5, tracking: 2.0, align: 'center', color: '#FEF08A'
      });
    }

    drawTrackedCaps(ctx, 'CHANDRAYAAN-3 • ACTUAL MOON', ix + iw / 2, baseY + 42, {
      fontSize: 16.5, tracking: 2.4, align: 'center', color: '#FFFDF2'
    });
  }

  ctx.restore();
}

// ============================================================================
// 5-ORBIT OBERTH GRAVITY-ASSIST EARTH-TO-MOON SLINGSHOT DIAGRAM (S05)
// ============================================================================
export function drawEarthMoonSlingshot(ctx, opts = {}) {
  const { progress = 1.0, tSec = 0 } = opts;

  const earthX = 285, earthY = 760;
  const moonX = 835, moonY = 545;

  ctx.save();
  // 5 Expanding Elliptical Earth Orbits (Oberth Perigee Burns!)
  for (let k = 1; k <= 5; k++) {
    const op = easeOutCubic(clamp((progress - (k - 1) * 0.11) / 0.28, 0, 1));
    if (op <= 0.01) continue;
    const rx = 68 + k * 44;
    const ry = 46 + k * 25;
    const cx = earthX + (k - 1) * 32;
    const cy = earthY - (k - 1) * 12;

    ctx.save();
    ctx.globalAlpha = op * (0.35 + k * 0.11);
    ctx.translate(cx, cy);
    ctx.rotate(-0.28);
    ctx.strokeStyle = k === 5 ? '#FACC15' : '#7DD3FC';
    ctx.lineWidth = k === 5 ? 3.2 : 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2 * op);
    ctx.stroke();
    ctx.restore();
  }

  // Trans-Lunar Slingshot Arc from Orbit 5 Perigee to Moon's South Pole!
  const tliP = easeOutQuart(clamp((progress - 0.45) / 0.45, 0, 1));
  if (tliP > 0.01) {
    ctx.save();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 4.2;
    ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    let hx = earthX, hy = earthY;
    for (let s = 0; s <= 32; s++) {
      const u = (s / 32) * tliP;
      const inv = 1 - u;
      const sx = earthX - 45, sy = earthY + 38;
      const cpx = 580, cpy = 830;
      const ex = moonX, ey = moonY + 58; // Lunar South Pole!
      const px = inv * inv * sx + 2 * inv * u * cpx + u * u * ex;
      const py = inv * inv * sy + 2 * inv * u * cpy + u * u * ey;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      hx = px; hy = py;
    }
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Glowing Cobalt-Blue Earth Sphere
  const eg = ctx.createRadialGradient(earthX - 16, earthY - 16, 8, earthX, earthY, 54);
  eg.addColorStop(0, '#93C5FD');
  eg.addColorStop(0.55, '#2563EB');
  eg.addColorStop(1, '#1E3A8A');
  ctx.shadowColor = 'rgba(59, 130, 246, 0.75)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = eg;
  ctx.beginPath(); ctx.arc(earthX, earthY, 52, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  drawTrackedCaps(ctx, '5 EARTH SLINGSHOTS', earthX, earthY + 82, {
    fontSize: 15, tracking: 2.2, align: 'center', color: '#BAE6FD'
  });

  // Glowing Cratered Moon Sphere + South Pole Touchdown Beacon (69.37°S)
  const mg = ctx.createRadialGradient(moonX - 14, moonY - 14, 6, moonX, moonY, 58);
  mg.addColorStop(0, '#FFFBEB');
  mg.addColorStop(0.65, '#CBD5E1');
  mg.addColorStop(1, '#64748B');
  ctx.shadowColor = 'rgba(254, 240, 138, 0.65)';
  ctx.shadowBlur = 28;
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.arc(moonX, moonY, 56, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Lunar South Pole (bottom of Moon!) pulsing beacon
  const pulse = (tSec * 1.5) % 1;
  ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - pulse).toFixed(2)})`;
  ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.arc(moonX, moonY + 54, 8 + pulse * 26, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#FACC15';
  ctx.beginPath(); ctx.arc(moonX, moonY + 54, 7, 0, Math.PI * 2); ctx.fill();

  drawTrackedCaps(ctx, 'SOUTH POLE • 69.37°S', moonX, moonY - 76, {
    fontSize: 15, tracking: 2.2, align: 'center', color: '#FDE68A'
  });
  ctx.restore();
}

// ============================================================================
// 3-STAGE LVM3 + CE-20 CRYOGENIC ENGINE + VIKRAM LANDER CAD X-RAY (S06)
// ============================================================================
export function drawLVM3BlueprintXRay(ctx, opts = {}) {
  const {
    cx = 540,
    topY = 300,
    totalH = 680,
    stepActive = 1, // 1: Full LVM3, 2: CE-20 Cryogenic Engine (-253°C), 3: Vikram Laser Lander
    tSec = 0
  } = opts;

  const coreW = 104;
  const fairingH = 195;
  const cryoH = 165;
  const coreH = totalH - fairingH - cryoH;

  const fairingBotY = topY + fairingH;
  const cryoBotY = fairingBotY + cryoH;
  const baseBotY = topY + totalH;

  ctx.save();

  // --- 1. TWIN S200 SOLID BOOSTERS (Left & Right) ---
  const bW = 54, bTopY = topY + 235;
  for (const side of [-1, 1]) {
    const bx = side < 0 ? cx - coreW / 2 - bW - 14 : cx + coreW / 2 + 14;
    ctx.strokeStyle = 'rgba(91, 192, 255, 0.62)';
    ctx.fillStyle = 'rgba(14, 42, 88, 0.45)';
    ctx.lineWidth = 2.2;
    roundRectPath(ctx, bx, bTopY + 42, bW, baseBotY - (bTopY + 42), 6);
    ctx.fill(); ctx.stroke();

    // Nosecone
    ctx.beginPath();
    ctx.moveTo(bx, bTopY + 42);
    ctx.lineTo(bx + bW / 2, bTopY);
    ctx.lineTo(bx + bW, bTopY + 42);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Booster nozzle
    ctx.beginPath();
    ctx.moveTo(bx + 12, baseBotY);
    ctx.lineTo(bx + 4, baseBotY + 26);
    ctx.lineTo(bx + bW - 4, baseBotY + 26);
    ctx.lineTo(bx + bW - 12, baseBotY);
    ctx.stroke();
  }

  // --- 2. L110 LIQUID CORE STAGE ---
  ctx.strokeStyle = 'rgba(91, 192, 255, 0.72)';
  ctx.fillStyle = 'rgba(12, 34, 74, 0.50)';
  ctx.lineWidth = 2.4;
  roundRectPath(ctx, cx - coreW / 2, cryoBotY, coreW, coreH, 6);
  ctx.fill(); ctx.stroke();

  // Internal fuel tank cross-hatching
  ctx.strokeStyle = 'rgba(91, 192, 255, 0.30)';
  ctx.lineWidth = 1.4;
  roundRectPath(ctx, cx - coreW / 2 + 14, cryoBotY + 18, coreW - 28, coreH * 0.42, 18); ctx.stroke();
  roundRectPath(ctx, cx - coreW / 2 + 14, cryoBotY + coreH * 0.50, coreW - 28, coreH * 0.38, 18); ctx.stroke();

  // --- 3. INDIGENOUS CE-20 CRYOGENIC UPPER STAGE (-253°C LH2 / LOX!) ---
  // Center at (cx, fairingBotY + cryoH*0.5) -> (540, 578)!
  const cryoFocus = stepActive <= 2;
  ctx.strokeStyle = cryoFocus ? '#F7C948' : '#5BC0FF';
  ctx.fillStyle = cryoFocus ? 'rgba(247, 201, 72, 0.16)' : 'rgba(14, 48, 96, 0.65)';
  ctx.lineWidth = cryoFocus ? 3.8 : 2.4;
  roundRectPath(ctx, cx - coreW / 2, fairingBotY, coreW, cryoH, 6);
  ctx.fill(); ctx.stroke();

  // LH2 / LOX Cryogenic Tank & CE-20 Bell Nozzle inside stage
  const cryoMidY = fairingBotY + cryoH * 0.52;
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2.2;
  roundRectPath(ctx, cx - 34, fairingBotY + 14, 68, 72, 22);
  ctx.stroke();

  // CE-20 Combustion Chamber & Bell Nozzle
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(cx - 12, fairingBotY + 92);
  ctx.lineTo(cx - 26, fairingBotY + 146);
  ctx.lineTo(cx + 26, fairingBotY + 146);
  ctx.lineTo(cx + 12, fairingBotY + 92);
  ctx.closePath();
  ctx.stroke();

  // Pulsing Cryogenic Target Reticle around CE-20 (y ~ 605)!
  const pulse = (tSec * 1.4) % 1;
  const ceY = fairingBotY + 115;
  const cg = ctx.createRadialGradient(cx, ceY, 4, cx, ceY, 82);
  cg.addColorStop(0, 'rgba(56, 189, 248, 0.65)');
  cg.addColorStop(0.55, 'rgba(247, 201, 72, 0.25)');
  cg.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(cx, ceY, 82, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = `rgba(253, 224, 71, ${(1 - pulse).toFixed(2)})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(cx, ceY, 16 + pulse * 52, 0, Math.PI * 2); ctx.stroke();

  // --- 4. CUTAWAY PAYLOAD FAIRING + VIKRAM LUNAR LANDER (topY..fairingBotY, center y ~ 410)! ---
  ctx.strokeStyle = stepActive === 3 ? '#F7C948' : 'rgba(147, 197, 253, 0.85)';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(cx - coreW / 2 - 8, fairingBotY);
  ctx.quadraticCurveTo(cx - coreW * 0.56, topY + 55, cx, topY);
  ctx.quadraticCurveTo(cx + coreW * 0.56, topY + 55, cx + coreW / 2 + 8, fairingBotY);
  ctx.stroke();

  // Vikram Lander Trapezoid Body + 4 Lunar Legs + Laser Hazard Scan Cone!
  const vy = topY + 108;
  ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(cx - 24, vy - 22);
  ctx.lineTo(cx + 24, vy - 22);
  ctx.lineTo(cx + 32, vy + 18);
  ctx.lineTo(cx - 32, vy + 18);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // 4 Lunar Landing Legs
  ctx.beginPath();
  ctx.moveTo(cx - 28, vy + 14); ctx.lineTo(cx - 44, vy + 38);
  ctx.moveTo(cx + 28, vy + 14); ctx.lineTo(cx + 44, vy + 38);
  ctx.stroke();

  // Laser Doppler Hazard Detection Scan Cone!
  const lg = ctx.createLinearGradient(cx, vy + 18, cx, vy + 76);
  lg.addColorStop(0, 'rgba(56, 189, 248, 0.68)');
  lg.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(cx - 8, vy + 18);
  ctx.lineTo(cx - 38, vy + 76);
  ctx.lineTo(cx + 38, vy + 76);
  ctx.lineTo(cx + 8, vy + 18);
  ctx.closePath();
  ctx.fill();

  // --- CALLOUT BADGES FLANKING THE ROCKET ---
  const badges = [
    { x: 64,  y: fairingBotY + 68, w: 344, title: '01 • CE-20 CRYOGENIC (-253°C)', active: stepActive <= 2 },
    { x: 672, y: topY + 84,        w: 344, title: '02 • LASER VIKRAM LANDER',     active: stepActive === 3 },
    { x: 672, y: cryoBotY + 85,    w: 344, title: '03 • S200 TWIN BOOSTERS',      active: stepActive === 1 }
  ];
  for (const b of badges) {
    drawFrostedCard(ctx, b.x, b.y, b.w, 58, {
      radius: 16,
      fill: b.active ? 'rgba(247, 201, 72, 0.20)' : 'rgba(8, 25, 58, 0.88)',
      borderTop: b.active ? '#F7C948' : 'rgba(91, 192, 255, 0.65)'
    });
    drawTrackedCaps(ctx, b.title, b.x + b.w / 2, b.y + 30, {
      fontSize: 13.5, tracking: 1.8, align: 'center', color: b.active ? '#FFFBEB' : '#93C5FD'
    });
  }

  ctx.restore();
}

// ============================================================================
// POLL & DM SHARE WIDGETS
// ============================================================================
export function drawPaperPlaneIcon(ctx, cx, cy, size, color) {
  const s = size / 24;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, -10); ctx.lineTo(-11, -1); ctx.lineTo(-2, 2);
  ctx.lineTo(10, -10); ctx.lineTo(2, 11); ctx.lineTo(-2, 2);
  ctx.stroke();
  ctx.restore();
}

export function drawPollWidget(ctx, options, activeOptionIdx, progress = 1) {
  const appear = easeOutCubic(clamp(progress / 0.22, 0, 1));
  const cardW = 880, cardH = 142, gap = 24;
  const startX = (W - cardW) / 2, startY = 720;

  ctx.save();
  ctx.globalAlpha = appear;
  for (let i = 0; i < options.length; i++) {
    const y = startY + i * (cardH + gap);
    const isSel = i === activeOptionIdx;
    drawFrostedCard(ctx, startX, y, cardW, cardH, {
      radius: 30,
      fill: isSel ? 'rgba(255, 244, 210, 0.20)' : 'rgba(255, 255, 255, 0.09)',
      borderTop: isSel ? 'rgba(255, 232, 130, 0.94)' : 'rgba(255, 255, 255, 0.38)',
      borderWidth: isSel ? 2.4 : 1.5,
      glowColor: isSel ? 'rgba(250, 204, 21, 0.35)' : null,
      glowBlur: isSel ? 26 : 0
    });

    // Bespoke Space Mission Vector Icons (0: Lunar Lander, 1: Mars Planet + Orbit, 2: Gaganyaan Crew Capsule)
    const bx = startX + 34, by = y + 29;
    roundRectPath(ctx, bx, by, 84, 84, 22);
    ctx.fillStyle = isSel ? 'rgba(250, 204, 21, 0.24)' : 'rgba(255, 255, 255, 0.10)';
    ctx.fill();
    ctx.strokeStyle = isSel ? '#FDE68A' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2; ctx.stroke();

    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.8;
    ctx.beginPath();
    if (i === 0) {
      // Vikram Lunar Lander
      ctx.rect(bx + 26, by + 24, 32, 24);
      ctx.moveTo(bx + 26, by + 48); ctx.lineTo(bx + 16, by + 64);
      ctx.moveTo(bx + 58, by + 48); ctx.lineTo(bx + 68, by + 64);
    } else if (i === 1) {
      // Mangalyaan Mars Orbiter
      ctx.arc(bx + 42, by + 42, 16, 0, Math.PI * 2);
      ctx.moveTo(bx + 14, by + 48); ctx.quadraticCurveTo(bx + 42, by + 18, bx + 70, by + 36);
    } else {
      // Gaganyaan Crew Capsule
      ctx.moveTo(bx + 22, by + 58); ctx.lineTo(bx + 32, by + 24);
      ctx.lineTo(bx + 52, by + 24); ctx.lineTo(bx + 62, by + 58); ctx.closePath();
    }
    ctx.stroke();

    ctx.font = 'italic 400 62px InstrumentSerif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(options[i].label, startX + 148, y + cardH / 2 + 4);

    const rx = startX + cardW - 64, ry = y + cardH / 2;
    ctx.strokeStyle = isSel ? '#FDE68A' : 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(rx, ry, 18, 0, Math.PI * 2); ctx.stroke();
    if (isSel) {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath(); ctx.arc(rx, ry, 11, 0, Math.PI * 2); ctx.fill();
    }
  }

  const iy = startY + 3 * (cardH + gap) + 18;
  drawFrostedCard(ctx, startX, iy, cardW, 92, { radius: 46, fill: 'rgba(255, 255, 255, 0.10)' });
  ctx.font = 'italic 400 38px InstrumentSerif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.textBaseline = 'middle';
  ctx.fillText('Your one word...', startX + 44, iy + 48);

  const sx = startX + cardW - 48, sy = iy + 46;
  ctx.fillStyle = '#FACC15';
  ctx.beginPath(); ctx.arc(sx, sy, 32, 0, Math.PI * 2); ctx.fill();
  drawPaperPlaneIcon(ctx, sx - 2, sy + 1, 24, '#1E1B4B');
  ctx.restore();
}

export function drawDMShareCard(ctx, progress = 1) {
  const appear = easeOutCubic(clamp(progress / 0.20, 0, 1));
  const sendP = easeOutQuart(clamp((progress - 0.34) / 0.34, 0, 1));
  const clickPulse = clamp(1 - Math.abs(progress - 0.36) / 0.09, 0, 1);

  const cw = 880, ch = 640, cx = (W - cw) / 2, cy = 710;
  ctx.save();
  ctx.globalAlpha = appear;
  drawFrostedCard(ctx, cx, cy, cw, ch, {
    radius: 36, fill: 'rgba(18, 22, 110, 0.70)', borderTop: 'rgba(255, 255, 255, 0.52)',
    glowColor: 'rgba(15, 23, 95, 0.5)', glowBlur: 32
  });

  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath(); ctx.arc(cx + 66, cy + 68, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#CBD5E1';
  ctx.beginPath(); ctx.arc(cx + 66, cy + 60, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 66, cy + 84, 16, Math.PI, 0, false); ctx.fill();

  ctx.font = '600 28px PlusJakarta'; ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('Space Nerd Buddy', cx + 114, cy + 62);
  drawTrackedCaps(ctx, 'ACTIVE NOW', cx + 114, cy + 86, { fontSize: 15, tracking: 2.5, color: '#FDE68A' });

  roundRectPath(ctx, cx + 42, cy + 132, 600, 84, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.11)'; ctx.fill();
  ctx.font = '400 28px PlusJakarta'; ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Vikram landing still gives chills!', cx + 70, cy + 183);

  const barX = cx + 42, barY = cy + ch - 118, barW = cw - 178, barH = 80;
  roundRectPath(ctx, barX, barY, barW, barH, 40);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)'; ctx.lineWidth = 1.4; ctx.stroke();

  if (sendP > 0.4) {
    ctx.font = '400 26px PlusJakarta'; ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
    ctx.fillText('Message...', barX + 34, barY + 49);
  }

  const btnX = cx + cw - 82, btnY = barY + 40;
  ctx.save();
  const bs = 1 - clickPulse * 0.14;
  ctx.translate(btnX, btnY); ctx.scale(bs, bs);
  ctx.fillStyle = '#FACC15';
  ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill();
  drawPaperPlaneIcon(ctx, -2, 1, 26, '#1E1B4B');
  ctx.restore();

  const thumbW = lerp(110, 178, sendP), thumbH = lerp(164, 262, sendP);
  const thumbX = lerp(barX + 26, cx + cw - thumbW - 56, sendP);
  const thumbY = lerp(barY - thumbH + 58, cy + 232, sendP);

  ctx.save();
  roundRectPath(ctx, thumbX, thumbY, thumbW, thumbH, 20);
  const tg = ctx.createLinearGradient(thumbX, thumbY, thumbX, thumbY + thumbH);
  tg.addColorStop(0, '#1D4ED8'); tg.addColorStop(0.6, '#7C2D12'); tg.addColorStop(1, '#F59E0B');
  ctx.fillStyle = tg; ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)'; ctx.lineWidth = 2; ctx.stroke();

  const pcx = thumbX + thumbW / 2, pcy = thumbY + thumbH * 0.42;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.moveTo(pcx - 10, pcy - 14); ctx.lineTo(pcx + 15, pcy); ctx.lineTo(pcx - 10, pcy + 14); ctx.closePath(); ctx.fill();

  if (sendP > 0.5) {
    ctx.font = 'italic 400 28px InstrumentSerif'; ctx.fillStyle = '#FFFBEB'; ctx.textAlign = 'center';
    ctx.fillText('₹615 Cr Moon', pcx, thumbY + thumbH - 48);
    ctx.font = '600 13.5px PlusJakarta'; ctx.fillStyle = '#FDE68A';
    ctx.fillText('ISRO SOUTH POLE', pcx, thumbY + thumbH - 22);
    ctx.textAlign = 'left';
  }
  ctx.restore();

  if (sendP > 0.85) {
    drawTrackedCaps(ctx, 'SENT ✓', thumbX + thumbW, thumbY + thumbH + 24, {
      fontSize: 15, tracking: 2.4, align: 'right', color: '#FDE68A'
    });
  }

  const curP = easeOutCubic(clamp((progress - 0.12) / 0.24, 0, 1));
  ctx.save();
  ctx.translate(lerp(cx + cw + 40, btnX + 12, curP), lerp(cy + ch + 40, btnY + 14, curP));
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26);
  ctx.lineTo(16, 40); ctx.lineTo(22, 37); ctx.lineTo(15, 23); ctx.lineTo(26, 22);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
}
