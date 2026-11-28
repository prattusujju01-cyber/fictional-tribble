// engine/solar_models.js
// Bespoke Procedural 3D/CAD Clean-Energy & Megacity Footprint Assemblies for Topic #4:
//  1. 2014 Baseline (2.8 GW) vs Today's 100+ GW (38x Surge!) Solar Megatower Monument (S04)
//  2. Khavda 30 GW Hybrid Stage: Animated 200m 5.2 MW Wind Turbine + Solar Array + 16M Homes Grid (S05)
//  3. Bifacial Solar Tracker + Autonomous Waterless Cleaning Robot + Salt-Rann Albedo CAD X-Ray (S06)
//  4. Paris (105 sq km) Fitting 5x Inside Khavda (538 sq km) Footprint Comparison + Curiosity Lock (S07)

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
    ctx.fillText('5×', bx + 84, by + 40);
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
    ctx.fillText('5×', bx + lerp(265, 84, dockT), cy + lerp(24, 9, dockT));
    ctx.restore();

    if (dockT < 0.45) {
      const subA = appear * (1 - dockT / 0.45);
      drawTrackedCaps(ctx, 'MEGACITY SCALE', bx + 52, by + bh - 38, { fontSize: 18, alpha: subA });
      drawTrackedCaps(ctx, 'LOCKED', bx + bw - 52, by + bh - 38, { fontSize: 18, color: '#FDE68A', align: 'right', alpha: subA });
    }
    return;
  }

  if (mode === 'unlock') {
    const flyT = snapOutSpring(clamp(p / 0.24, 0, 1));
    const openT = easeOutCubic(clamp((p - 0.20) / 0.28, 0, 1));
    const cx = lerp(919, 540, clamp(flyT, 0, 1));
    const cy = lerp(112, 635, clamp(flyT, 0, 1));
    const bw = lerp(174, 850, clamp(flyT, 0, 1));
    const bh = lerp(60, 275, clamp(flyT, 0, 1));
    const bx = cx - bw / 2, by = cy - bh / 2;

    drawFrostedCard(ctx, bx, by, bw, bh, {
      radius: lerp(18, 34, clamp(flyT, 0, 1)),
      fill: 'rgba(10, 18, 128, 0.82)',
      borderTop: 'rgba(255, 238, 160, 0.88)',
      glowColor: 'rgba(250, 204, 21, 0.48)',
      glowBlur: 42 * openT
    });
    drawPadlockIcon(ctx, bx + lerp(42, 120, clamp(flyT, 0, 1)), cy - lerp(0, 18, clamp(flyT, 0, 1)), lerp(26, 70, clamp(flyT, 0, 1)), openT, '#FACC15');

    if (openT > 0.12) {
      drawOdometer(ctx, {
        startValue: 1,
        value: 5,
        suffix: '× Paris',
        suffixItalicSerif: true,
        progress: clamp((p - 0.18) / 0.36, 0, 1),
        x: bx + 505,
        y: cy + 30,
        fontSize: 132,
        weight: 300,
        color: '#FFFFFF',
        suffixColor: '#FDE68A'
      });
    }
    if (flyT > 0.7) {
      drawTrackedCaps(ctx, '538 SQ KM • WORLD\'S LARGEST POWER PLANT', cx, by + bh - 40, {
        fontSize: 18, tracking: 2.8, align: 'center', color: '#FFFFFF'
      });
    }
  }
}

// ============================================================================
// 2014 BASELINE (2.8 GW) VS TODAY'S 100+ GW (38X SURGE!) SOLAR MONUMENT (S04)
// ============================================================================
export function drawSurge38xSolarMonument(ctx, opts = {}) {
  const {
    baseY = 1290,
    oldProgress = 1.0,
    newProgress = 1.0,
    tSec = 0
  } = opts;

  const maxH = 660;
  const oldH = Math.max(28, (2.8 / 105) * maxH * easeOutQuart(clamp(oldProgress, 0, 1)));
  const newH = maxH * easeOutQuart(clamp(newProgress, 0, 1));

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(76, baseY); ctx.lineTo(W - 76, baseY); ctx.stroke();

  // --- LEFT: 2014 TINY 2.8 GW BASELINE ---
  const ox = 140, ow = 280;
  const oTopY = baseY - oldH;
  if (oldProgress > 0.02) {
    drawFrostedCard(ctx, ox, oTopY, ow, oldH, {
      radius: 14, fill: 'rgba(255, 255, 255, 0.18)', borderTop: 'rgba(255, 255, 255, 0.65)'
    });
    drawOdometer(ctx, {
      startValue: 0.5, value: 2.8, decimals: 1, suffix: 'GW',
      progress: oldProgress,
      x: ox + ow / 2, y: oTopY - 32, fontSize: 68, weight: 300, color: 'rgba(255,255,255,0.92)'
    });
    drawTrackedCaps(ctx, '2014 • ALL OF INDIA', ox + ow / 2, baseY + 42, {
      fontSize: 16.5, tracking: 2.4, align: 'center', color: 'rgba(255,255,255,0.82)'
    });
  }

  // --- RIGHT: TOWERING 100+ GW GOLDEN SOLAR MEGATOWER (38X SURGE!) ---
  const nx = 540, nw = 380;
  const nTopY = baseY - newH;
  if (newProgress > 0.02 && newH > 20) {
    // Blazing golden solar corona behind crest
    const sunY = nTopY;
    const sg = ctx.createRadialGradient(nx + nw / 2, sunY, 12, nx + nw / 2, sunY, 165);
    sg.addColorStop(0, 'rgba(255, 251, 235, 0.85)');
    sg.addColorStop(0.45, 'rgba(250, 204, 21, 0.42)');
    sg.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(nx + nw / 2, sunY, 165, 0, Math.PI * 2); ctx.fill();

    drawFrostedCard(ctx, nx, nTopY, nw, newH, {
      radius: 28,
      fill: 'rgba(255, 224, 102, 0.28)',
      borderTop: '#FFFDF2',
      borderWidth: 2.6,
      glowColor: 'rgba(250, 204, 21, 0.58)',
      glowBlur: 40
    });

    // Architectural photovoltaic cell grid lines inside the golden tower!
    ctx.save();
    roundRectPath(ctx, nx + 14, nTopY + 14, nw - 28, Math.max(10, newH - 28), 20);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 251, 235, 0.30)';
    ctx.lineWidth = 1.6;
    for (let gx = nx + 58; gx < nx + nw - 20; gx += 54) {
      ctx.beginPath(); ctx.moveTo(gx, nTopY); ctx.lineTo(gx, baseY); ctx.stroke();
    }
    for (let gy = nTopY + 46; gy < baseY - 16; gy += 46) {
      ctx.beginPath(); ctx.moveTo(nx, gy); ctx.lineTo(nx + nw, gy); ctx.stroke();
    }
    // Animated diagonal sun-glint shimmer sweeping down tower
    const glintY = nTopY + ((tSec * 240) % (newH + 180)) - 90;
    const gg = ctx.createLinearGradient(nx, glintY - 50, nx, glintY + 50);
    gg.addColorStop(0, 'rgba(255,255,255,0)');
    gg.addColorStop(0.5, 'rgba(255,255,255,0.28)');
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(nx, nTopY, nw, newH);
    ctx.restore();

    drawOdometer(ctx, {
      startValue: 8, value: 100, suffix: '+ GW', suffixItalicSerif: true,
      progress: newProgress,
      x: nx + nw / 2, y: nTopY - 38, fontSize: 118, weight: 300, color: '#FFFFFF', suffixColor: '#FFF7D6'
    });

    if (newProgress > 0.65) {
      drawFrostedCard(ctx, nx + 38, nTopY + newH * 0.48 - 34, nw - 76, 68, {
        radius: 34, fill: 'rgba(50, 8, 59, 0.78)', borderTop: '#FFFDF2'
      });
      drawTrackedCaps(ctx, '38× SURGE • GLOBAL TOP 3!', nx + nw / 2, nTopY + newH * 0.48, {
        fontSize: 16.5, tracking: 2.2, align: 'center', color: '#FEF08A'
      });
    }

    drawTrackedCaps(ctx, 'INDIA SOLAR • CROSSED 100+ GW', nx + nw / 2, baseY + 42, {
      fontSize: 16.5, tracking: 2.4, align: 'center', color: '#FFFDF2'
    });
  }

  ctx.restore();
}

// ============================================================================
// ANIMATED 200M 5.2 MW WIND TURBINE + SOLAR HYBRID STAGE (S05)
// ============================================================================
export function drawWindTurbineGraphic(ctx, cx, baseY, height = 270, tSec = 0) {
  const hubY = baseY - height;
  const bladeLen = height * 0.48;

  ctx.save();
  // Tapered tubular steel pylon
  ctx.fillStyle = '#E0F2FE';
  ctx.strokeStyle = '#7DD3FC';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, baseY);
  ctx.lineTo(cx - 4, hubY);
  ctx.lineTo(cx + 4, hubY);
  ctx.lineTo(cx + 10, baseY);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // 3 Aerodynamic Rotating Blades (5.2 MW = 160m rotor diameter!)
  ctx.translate(cx, hubY);
  const baseAngle = tSec * 2.2;
  for (let b = 0; b < 3; b++) {
    ctx.save();
    ctx.rotate(baseAngle + (b * Math.PI * 2) / 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(9, -bladeLen * 0.35, 2, -bladeLen);
    ctx.quadraticCurveTo(-5, -bladeLen * 0.45, 0, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Nacelle hub
  ctx.fillStyle = '#FACC15';
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ============================================================================
// BIFACIAL SOLAR TRACKER + WATERLESS CLEANING ROBOT + SALT ALBEDO X-RAY (S06)
// ============================================================================
export function drawKhavdaSolarBlueprintXRay(ctx, opts = {}) {
  const {
    cx = 540,
    cy = 630,
    stepActive = 1, // 1: Full Tracker, 2: Waterless Dry-Brush Robot, 3: Bifacial Salt-Albedo Reflection
    tSec = 0
  } = opts;

  const tableW = 720, tableH = 230;
  const leftX = cx - tableW / 2, rightX = cx + tableW / 2;
  const tiltYLeft = cy - 75, tiltYRight = cy + 65; // inclined solar tracker angle!
  const saltFloorY = cy + 255;

  ctx.save();

  // --- 1. SALINE-PROOF GALVANIZED FOUNDATION PILES & WHITE SALT RANN FLOOR ---
  ctx.strokeStyle = 'rgba(91, 192, 255, 0.45)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(70, saltFloorY); ctx.lineTo(W - 70, saltFloorY);
  ctx.stroke();

  // Foundation piles driven into corrosive Kutch salt flat
  for (const u of [0.22, 0.50, 0.78]) {
    const px = lerp(leftX, rightX, u);
    const pyTop = lerp(tiltYLeft, tiltYRight, u) + tableH * 0.52;
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.75)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(px, pyTop);
    ctx.lineTo(px, saltFloorY + 42);
    ctx.stroke();

    // Torque-tube tracker pivot joint
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath(); ctx.arc(px, pyTop, 8, 0, Math.PI * 2); ctx.fill();
  }

  // --- 2. BIFACIAL REAR-SIDE SALT ALBEDO REFLECTION RAYS (+15% BONUS YIELD!) ---
  const albedoGlow = stepActive === 3 ? 0.92 : 0.36;
  ctx.save();
  ctx.strokeStyle = `rgba(253, 224, 71, ${albedoGlow})`;
  ctx.setLineDash([7, 6]);
  ctx.lineWidth = stepActive === 3 ? 3.0 : 1.8;
  for (let r = 0; r < 6; r++) {
    const u = 0.14 + r * 0.14;
    const bounceX = lerp(leftX + 30, rightX - 30, u);
    const underY = lerp(tiltYLeft, tiltYRight, u) + tableH * 0.5;
    ctx.beginPath();
    ctx.moveTo(bounceX - 42, saltFloorY);
    ctx.lineTo(bounceX + 12, underY + 8);
    ctx.stroke();
  }
  ctx.restore();

  // --- 3. INCLINED BIFACIAL PHOTOVOLTAIC TRACKER ARRAY (parallelogram) ---
  const pTL = [leftX, tiltYLeft - tableH * 0.5];
  const pTR = [rightX, tiltYRight - tableH * 0.5];
  const pBR = [rightX - 24, tiltYRight + tableH * 0.5];
  const pBL = [leftX - 24, tiltYLeft + tableH * 0.5];

  ctx.fillStyle = 'rgba(12, 42, 92, 0.72)';
  ctx.strokeStyle = '#5BC0FF';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(pTL[0], pTL[1]);
  ctx.lineTo(pTR[0], pTR[1]);
  ctx.lineTo(pBR[0], pBR[1]);
  ctx.lineTo(pBL[0], pBL[1]);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // 12x4 Internal Solar Silicon Cell Grid
  ctx.strokeStyle = 'rgba(91, 192, 255, 0.42)';
  ctx.lineWidth = 1.4;
  for (let c = 1; c < 12; c++) {
    const u = c / 12;
    ctx.beginPath();
    ctx.moveTo(lerp(pTL[0], pTR[0], u), lerp(pTL[1], pTR[1], u));
    ctx.lineTo(lerp(pBL[0], pBR[0], u), lerp(pBL[1], pBR[1], u));
    ctx.stroke();
  }
  for (let r = 1; r < 4; r++) {
    const v = r / 4;
    ctx.beginPath();
    ctx.moveTo(lerp(pTL[0], pBL[0], v), lerp(pTL[1], pBL[1], v));
    ctx.lineTo(lerp(pTR[0], pBR[0], v), lerp(pTR[1], pBR[1], v));
    ctx.stroke();
  }

  // --- 4. AUTONOMOUS WATERLESS DRY-BRUSH CLEANING ROBOT GLIDING ON RAILS! ---
  const robU = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(tSec * 1.3));
  const rTopX = lerp(pTL[0], pTR[0], robU);
  const rTopY = lerp(pTL[1], pTR[1], robU);
  const rBotX = lerp(pBL[0], pBR[0], robU);
  const rBotY = lerp(pBL[1], pBR[1], robU);
  const rMidX = (rTopX + rBotX) * 0.5;
  const rMidY = (rTopY + rBotY) * 0.5;

  // Swept clean golden glow behind robot
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.moveTo(rTopX, rTopY - 8);
  ctx.lineTo(rBotX, rBotY + 8);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Robot drive chassis pods at top & bottom rails
  ctx.fillStyle = '#FFFBEB';
  ctx.strokeStyle = '#F7C948';
  ctx.lineWidth = 2.5;
  roundRectPath(ctx, rTopX - 18, rTopY - 22, 36, 22, 6); ctx.fill(); ctx.stroke();
  roundRectPath(ctx, rBotX - 18, rBotY, 36, 22, 6); ctx.fill(); ctx.stroke();

  // Pulsing CAD Target Reticle on Waterless Robot!
  const pulse = (tSec * 1.5) % 1;
  ctx.strokeStyle = `rgba(253, 224, 71, ${(1 - pulse).toFixed(2)})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(rMidX, rMidY, 22 + pulse * 54, 0, Math.PI * 2); ctx.stroke();

  // --- CALLOUT BADGES ---
  const badges = [
    { x: 76,  y: cy - 265, w: 420, title: '01 • WATERLESS NIGHT ROBOTICS',   active: stepActive <= 2 },
    { x: 584, y: cy - 265, w: 420, title: '02 • ZERO FRESH WATER USED',      active: stepActive === 2 },
    { x: 280, y: saltFloorY + 26, w: 520, title: '03 • SALT-CRUST REAR ALBEDO (+15%)', active: stepActive === 3 }
  ];
  for (const b of badges) {
    drawFrostedCard(ctx, b.x, b.y, b.w, 56, {
      radius: 16,
      fill: b.active ? 'rgba(247, 201, 72, 0.20)' : 'rgba(8, 25, 58, 0.88)',
      borderTop: b.active ? '#F7C948' : 'rgba(91, 192, 255, 0.65)'
    });
    drawTrackedCaps(ctx, b.title, b.x + b.w / 2, b.y + 29, {
      fontSize: 13.5, tracking: 1.8, align: 'center', color: b.active ? '#FFFBEB' : '#93C5FD'
    });
  }

  ctx.restore();
}

// ============================================================================
// PARIS (105 SQ KM) FITTING 5X INSIDE KHAVDA (538 SQ KM) COMPARISON CARD (S07)
// ============================================================================
function drawParisSilhouette(ctx, cx, cy, r, fillCol, strokeCol) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fillCol;
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 2.2;
  // Characteristic oval Boulevard Périphérique of Paris (slightly wider E-W than N-S)
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const radMod = 1 + 0.08 * Math.cos(3 * a) - 0.05 * Math.sin(2 * a);
    const px = Math.cos(a) * r * 1.18 * radMod;
    const py = Math.sin(a) * r * 0.90 * radMod;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Curved Seine River arc through Paris!
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-r * 0.95, r * 0.22);
  ctx.quadraticCurveTo(-r * 0.1, -r * 0.42, r * 0.95, r * 0.18);
  ctx.stroke();
  ctx.restore();
}

export function drawParisVsKhavdaFootprint(ctx, progress = 1.0, alpha = 1.0) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  drawFrostedCard(ctx, 84, 830, 912, 435, {
    radius: 30, fill: 'rgba(10, 22, 122, 0.78)', borderTop: 'rgba(253, 230, 138, 0.85)'
  });

  drawTrackedCaps(ctx, 'PARIS (105 KM²) FITS 5 TIMES INSIDE KHAVDA (538 KM²)', 540, 878, {
    fontSize: 16, tracking: 2.4, align: 'center', color: '#BAE6FD'
  });

  // Left: 1x Paris reference badge
  drawParisSilhouette(ctx, 215, 1060, 56, 'rgba(56, 189, 248, 0.22)', '#7DD3FC');
  drawTrackedCaps(ctx, '1× PARIS', 215, 1152, { fontSize: 15, tracking: 2.2, align: 'center', color: '#E0F2FE' });
  drawTrackedCaps(ctx, '105 SQ KM', 215, 1180, { fontSize: 13.5, tracking: 2.0, align: 'center', color: '#7DD3FC' });

  // Right: Khavda 538 sq km Golden Solar Boundary containing 5 stamped Paris silhouettes!
  const kx = 345, ky = 930, kw = 605, kh = 280;
  roundRectPath(ctx, kx, ky, kw, kh, 22);
  ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
  ctx.fill();
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 2.6;
  ctx.stroke();

  const positions = [
    [kx + 115, ky + 86],  [kx + 302, ky + 86],  [kx + 490, ky + 86],
    [kx + 208, ky + 196], [kx + 402, ky + 196]
  ];
  for (let i = 0; i < 5; i++) {
    const ip = snapOutSpring(clamp((progress - i * 0.13) / 0.32, 0, 1));
    const ia = clamp((progress - i * 0.13) / 0.18, 0, 1);
    if (ia > 0.01) {
      ctx.save();
      ctx.globalAlpha = alpha * ia;
      ctx.translate(positions[i][0], positions[i][1]);
      ctx.scale(ip, ip);
      drawParisSilhouette(ctx, 0, 0, 44, 'rgba(250, 204, 21, 0.34)', '#FEF08A');
      ctx.font = '600 20px PlusJakarta';
      ctx.fillStyle = '#FFFBEB';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}×`, 0, 2);
      ctx.restore();
    }
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

    // Clean Energy Vector Icons (0: Sun Rays, 1: Atomic Orbit, 2: H2 Molecule)
    const bx = startX + 34, by = y + 29;
    roundRectPath(ctx, bx, by, 84, 84, 22);
    ctx.fillStyle = isSel ? 'rgba(250, 204, 21, 0.24)' : 'rgba(255, 255, 255, 0.10)';
    ctx.fill();
    ctx.strokeStyle = isSel ? '#FDE68A' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2; ctx.stroke();

    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.8;
    ctx.beginPath();
    if (i === 0) {
      ctx.arc(bx + 42, by + 42, 14, 0, Math.PI * 2);
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        ctx.moveTo(bx + 42 + Math.cos(ang) * 20, by + 42 + Math.sin(ang) * 20);
        ctx.lineTo(bx + 42 + Math.cos(ang) * 28, by + 42 + Math.sin(ang) * 28);
      }
    } else if (i === 1) {
      ctx.ellipse(bx + 42, by + 42, 26, 11, 0.6, 0, Math.PI * 2);
      ctx.moveTo(bx + 60, by + 30);
      ctx.ellipse(bx + 42, by + 42, 26, 11, -0.6, 0, Math.PI * 2);
    } else {
      ctx.arc(bx + 30, by + 42, 12, 0, Math.PI * 2);
      ctx.moveTo(bx + 66, by + 42);
      ctx.arc(bx + 54, by + 42, 12, 0, Math.PI * 2);
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
  ctx.fillText('Clean Tech Buddy', cx + 114, cy + 62);
  drawTrackedCaps(ctx, 'ACTIVE NOW', cx + 114, cy + 86, { fontSize: 15, tracking: 2.5, color: '#FDE68A' });

  roundRectPath(ctx, cx + 42, cy + 132, 610, 84, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.11)'; ctx.fill();
  ctx.font = '400 28px PlusJakarta'; ctx.fillStyle = '#FFFFFF';
  ctx.fillText('5x larger than Paris in Kutch?!', cx + 70, cy + 183);

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
  tg.addColorStop(0, '#1D4ED8'); tg.addColorStop(0.6, '#B45309'); tg.addColorStop(1, '#FACC15');
  ctx.fillStyle = tg; ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)'; ctx.lineWidth = 2; ctx.stroke();

  const pcx = thumbX + thumbW / 2, pcy = thumbY + thumbH * 0.42;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.moveTo(pcx - 10, pcy - 14); ctx.lineTo(pcx + 15, pcy); ctx.lineTo(pcx - 10, pcy + 14); ctx.closePath(); ctx.fill();

  if (sendP > 0.5) {
    ctx.font = 'italic 400 28px InstrumentSerif'; ctx.fillStyle = '#FFFBEB'; ctx.textAlign = 'center';
    ctx.fillText('30 GW Sun', pcx, thumbY + thumbH - 48);
    ctx.font = '600 13.5px PlusJakarta'; ctx.fillStyle = '#FDE68A';
    ctx.fillText('5X PARIS IN KUTCH', pcx, thumbY + thumbH - 22);
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
