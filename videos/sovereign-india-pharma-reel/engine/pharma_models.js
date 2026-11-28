// engine/pharma_models.js
// Bespoke Procedural 3D/CAD Pharmaceutical & Bioreactor Assemblies for Topic #5:
//  1. Western Monopoly ($10,000/yr) vs Cipla Indian Generic ($1/day — 96% Price Crash!) Monument (S04)
//  2. Exploded Enteric Micro-Pellet Capsule + 10,000L Stainless Vaccine Bioreactor CAD X-Ray (S06)
//  3. 4-in-10 US Generic Capsules Shelf + Curiosity Lock (🔒 650+ -> 🔓 650+ FDA Plants) (S07)
//  4. 3-Breakthrough Medical Poll & Med-School DM Share Card (S11-S12)

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
    drawPadlockIcon(ctx, bx + 40, by + 31, 26, 0, '#FACC15');
    ctx.save();
    ctx.filter = 'blur(7px)';
    ctx.font = '600 26px PlusJakarta';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('650+', bx + 74, by + 40);
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
    drawPadlockIcon(ctx, bx + lerp(120, 40, dockT), cy - lerp(12, 0, dockT), lerp(58, 26, dockT), 0, '#FACC15');

    ctx.save();
    ctx.globalAlpha = appear;
    ctx.filter = `blur(${lerp(15, 7, dockT).toFixed(1)}px)`;
    ctx.font = `600 ${Math.round(lerp(104, 26, dockT))}px PlusJakarta`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('650+', bx + lerp(235, 74, dockT), cy + lerp(24, 9, dockT));
    ctx.restore();

    if (dockT < 0.45) {
      const subA = appear * (1 - dockT / 0.45);
      drawTrackedCaps(ctx, 'GLOBAL FDA PLANTS', bx + 52, by + bh - 38, { fontSize: 18, alpha: subA });
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
    drawPadlockIcon(ctx, bx + lerp(40, 118, clamp(flyT, 0, 1)), cy - lerp(0, 18, clamp(flyT, 0, 1)), lerp(26, 70, clamp(flyT, 0, 1)), openT, '#FACC15');

    if (openT > 0.12) {
      drawOdometer(ctx, {
        startValue: 120,
        value: 650,
        suffix: '+ FDA',
        suffixItalicSerif: true,
        progress: clamp((p - 0.18) / 0.36, 0, 1),
        x: bx + 505,
        y: cy + 30,
        fontSize: 128,
        weight: 300,
        color: '#FFFFFF',
        suffixColor: '#FDE68A'
      });
    }
    if (flyT > 0.7) {
      drawTrackedCaps(ctx, '#1 US-FDA APPROVED PLANTS OUTSIDE AMERICA', cx, by + bh - 40, {
        fontSize: 18, tracking: 2.6, align: 'center', color: '#FFFFFF'
      });
    }
  }
}

// Helper: 3D Two-Tone Capsule Pill Graphic
export function drawCapsuleIcon(ctx, cx, cy, len = 120, rad = 28, angle = -0.45, goldActive = true) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Outer shadow
  if (goldActive) {
    ctx.shadowColor = 'rgba(250, 204, 21, 0.65)';
    ctx.shadowBlur = 22;
  }

  // Left half (Cap)
  ctx.beginPath();
  ctx.arc(-len * 0.25, 0, rad, Math.PI * 0.5, Math.PI * 1.5);
  ctx.lineTo(0, -rad);
  ctx.lineTo(0, rad);
  ctx.closePath();
  ctx.fillStyle = goldActive ? '#FACC15' : 'rgba(148, 163, 184, 0.45)';
  ctx.fill();

  // Right half (Body)
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(len * 0.25, 0, rad, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.lineTo(0, rad);
  ctx.lineTo(0, -rad);
  ctx.closePath();
  ctx.fillStyle = goldActive ? '#FFFBEB' : 'rgba(226, 232, 240, 0.32)';
  ctx.fill();

  // Specular highlight strip
  ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
  roundRectPath(ctx, -len * 0.32, -rad * 0.62, len * 0.64, rad * 0.26, rad * 0.13);
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// $10,000 MONOPOLY PILL TOWER VS $1/DAY CIPLA INDIAN GENERIC REVOLUTION (S04)
// ============================================================================
export function drawPriceCrashCiplaMonument(ctx, opts = {}) {
  const {
    baseY = 1290,
    monopolyProgress = 1.0,
    indiaProgress = 1.0,
    tSec = 0
  } = opts;

  const maxH = 650;
  const monH = maxH * easeOutQuart(clamp(monopolyProgress, 0, 1));
  const indPedestalH = 190 * easeOutQuart(clamp(indiaProgress, 0, 1));

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(76, baseY); ctx.lineTo(W - 76, baseY); ctx.stroke();

  // --- LEFT: $10,000 / YEAR WESTERN MONOPOLY DRUG PRICE COLUMN ---
  const mx = 136, mw = 290;
  const mTopY = baseY - monH;
  if (monH > 15) {
    drawFrostedCard(ctx, mx, mTopY, mw, monH, {
      radius: 26, fill: 'rgba(255, 255, 255, 0.13)', borderTop: 'rgba(255, 255, 255, 0.55)'
    });
    if (monH > 180) {
      drawCapsuleIcon(ctx, mx + mw / 2, mTopY + 125, 110, 26, -0.4, false);
      drawTrackedCaps(ctx, 'PATENT MONOPOLY', mx + mw / 2, mTopY + 215, {
        fontSize: 14, tracking: 2.2, align: 'center', color: 'rgba(255,255,255,0.65)'
      });
    }
    drawOdometer(ctx, {
      prefix: '$', startValue: 1200, value: 10000, suffix: '/yr',
      progress: monopolyProgress,
      x: mx + mw / 2, y: mTopY - 32, fontSize: 58, weight: 300, color: 'rgba(255,255,255,0.92)'
    });
    drawTrackedCaps(ctx, 'WESTERN BIG PHARMA', mx + mw / 2, baseY + 42, {
      fontSize: 16, tracking: 2.2, align: 'center', color: 'rgba(255,255,255,0.82)'
    });
  }

  // --- RIGHT: < $1 / DAY CIPLA INDIAN GENERIC LIFESAVER MONUMENT! ---
  const ix = 545, iw = 385;
  const iTopY = baseY - indPedestalH;
  if (indiaProgress > 0.02) {
    drawFrostedCard(ctx, ix, iTopY, iw, Math.max(24, indPedestalH), {
      radius: 26,
      fill: 'rgba(255, 224, 102, 0.28)',
      borderTop: '#FFFDF2',
      borderWidth: 2.5,
      glowColor: 'rgba(250, 204, 21, 0.58)',
      glowBlur: 38
    });

    // Hero Levitating Golden Lifesaver Capsule + Medical Cross Aura above Pedestal!
    const cx = ix + iw / 2;
    const capY = iTopY - 145 + Math.sin(tSec * 2.4) * 8;
    const cScale = easeOutQuart(clamp(indiaProgress, 0, 1));

    ctx.save();
    ctx.translate(cx, capY);
    ctx.scale(cScale, cScale);
    const rg = ctx.createRadialGradient(0, 0, 12, 0, 0, 145);
    rg.addColorStop(0, 'rgba(255, 251, 235, 0.72)');
    rg.addColorStop(0.5, 'rgba(250, 204, 21, 0.30)');
    rg.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(0, 0, 145, 0, Math.PI * 2); ctx.fill();
    drawCapsuleIcon(ctx, 0, 0, 195, 46, -0.38, true);
    ctx.restore();

    drawOdometer(ctx, {
      prefix: '$', startValue: 99, value: 1, suffix: '/ day', suffixItalicSerif: true,
      progress: indiaProgress,
      x: cx, y: capY - 110, fontSize: 124, weight: 300, color: '#FFFFFF', suffixColor: '#FFF7D6'
    });

    if (indiaProgress > 0.65) {
      drawFrostedCard(ctx, ix + 34, iTopY + indPedestalH * 0.5 - 32, iw - 68, 64, {
        radius: 32, fill: 'rgba(50, 8, 59, 0.78)', borderTop: '#FFFDF2'
      });
      drawTrackedCaps(ctx, '96% CHEAPER • MILLIONS SAVED!', cx, iTopY + indPedestalH * 0.5, {
        fontSize: 15, tracking: 2.0, align: 'center', color: '#FEF08A'
      });
    }

    drawTrackedCaps(ctx, 'CIPLA INDIA • GLOBAL LIFELINE', cx, baseY + 42, {
      fontSize: 16, tracking: 2.2, align: 'center', color: '#FFFDF2'
    });
  }

  ctx.restore();
}

// ============================================================================
// EXPLODED ENTERIC CAPSULE + 10,000L STAINLESS BIOREACTOR CAD X-RAY (S06)
// ============================================================================
export function drawPharmaCapsuleBlueprintXRay(ctx, opts = {}) {
  const {
    cy = 625,
    stepActive = 1, // 1: Overview, 2: Exploded API Micro-Pellet Capsule, 3: 10,000L Automated Bioreactor
    tSec = 0
  } = opts;

  ctx.save();

  // --- LEFT ASSEMBLY (cx = 310): EXPLODED SUSTAINED-RELEASE CAPSULE & API MICRO-PELLETS ---
  const capCx = 310, capCy = cy;
  const sep = 48 + Math.sin(tSec * 2.0) * 6;
  const capFocus = stepActive <= 2;

  ctx.strokeStyle = capFocus ? '#F7C948' : '#5BC0FF';
  ctx.fillStyle = 'rgba(12, 42, 92, 0.62)';
  ctx.lineWidth = capFocus ? 3.4 : 2.2;

  // Top Capsule Shell (pulled upward)
  ctx.beginPath();
  ctx.arc(capCx, capCy - sep - 55, 64, Math.PI, 0, false);
  ctx.lineTo(capCx + 64, capCy - sep + 25);
  ctx.lineTo(capCx - 64, capCy - sep + 25);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Bottom Capsule Shell (pulled downward)
  ctx.beginPath();
  ctx.arc(capCx, capCy + sep + 55, 64, 0, Math.PI, false);
  ctx.lineTo(capCx - 64, capCy + sep - 25);
  ctx.lineTo(capCx + 64, capCy + sep - 25);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // 28 Glowing API Sustained-Release Micro-Pellet Spheres suspended inside core!
  for (let i = 0; i < 28; i++) {
    const row = Math.floor(i / 4) - 3;
    const col = (i % 4) - 1.5;
    const px = capCx + col * 24 + Math.sin(tSec * 2.2 + i) * 3;
    const py = capCy + row * 19 + Math.cos(tSec * 1.8 + i) * 3;
    ctx.fillStyle = i % 3 === 0 ? '#FACC15' : '#38BDF8';
    ctx.beginPath(); ctx.arc(px, py, 6.5, 0, Math.PI * 2); ctx.fill();
  }

  // Pulsing CAD Target Reticle around API Micro-Pellets
  const pulse = (tSec * 1.5) % 1;
  ctx.strokeStyle = `rgba(253, 224, 71, ${(1 - pulse).toFixed(2)})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(capCx, capCy, 28 + pulse * 58, 0, Math.PI * 2); ctx.stroke();

  // --- RIGHT ASSEMBLY (cx = 760): 10,000L STAINLESS VACCINE BIOREACTOR VESSEL ---
  const bioCx = 760, bioTopY = cy - 175, bioW = 190, bioH = 340;
  const bioFocus = stepActive === 3;

  ctx.strokeStyle = bioFocus ? '#F7C948' : '#5BC0FF';
  ctx.fillStyle = 'rgba(10, 36, 82, 0.65)';
  ctx.lineWidth = bioFocus ? 3.6 : 2.4;

  // Cylindrical domed bioreactor vessel
  roundRectPath(ctx, bioCx - bioW / 2, bioTopY, bioW, bioH, 68);
  ctx.fill(); ctx.stroke();

  // External thermal cooling jacket coils
  ctx.strokeStyle = 'rgba(91, 192, 255, 0.42)';
  ctx.lineWidth = 2.0;
  for (let jy = bioTopY + 85; jy <= bioTopY + bioH - 85; jy += 34) {
    ctx.beginPath();
    ctx.moveTo(bioCx - bioW / 2 - 8, jy);
    ctx.lineTo(bioCx + bioW / 2 + 8, jy);
    ctx.stroke();
  }

  // Central Agitator Shaft + Twin Rotating Impeller Blades!
  ctx.strokeStyle = '#E0F2FE';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(bioCx, bioTopY - 28);
  ctx.lineTo(bioCx, bioTopY + bioH - 48);
  ctx.stroke();

  const spinW = Math.cos(tSec * 4.2) * 56;
  for (const iy of [bioTopY + 145, bioTopY + 235]) {
    ctx.fillStyle = '#FACC15';
    roundRectPath(ctx, bioCx - Math.abs(spinW), iy - 8, Math.max(12, Math.abs(spinW) * 2), 16, 5);
    ctx.fill();
  }

  // Rising sterile oxygenation bubbles inside bioreactor
  for (let b = 0; b < 14; b++) {
    const bx = bioCx + ((b * 29) % 110) - 55;
    const by = bioTopY + bioH - 65 - (((tSec * 90) + b * 22) % 210);
    ctx.fillStyle = 'rgba(125, 211, 252, 0.72)';
    ctx.beginPath(); ctx.arc(bx, by, 4.0, 0, Math.PI * 2); ctx.fill();
  }

  // Connecting sterile transfer pipeline between Bioreactor & Capsule Encapsulation
  ctx.strokeStyle = 'rgba(91, 192, 255, 0.55)';
  ctx.setLineDash([7, 6]);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bioCx - bioW / 2, cy);
  ctx.lineTo(capCx + 92, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // --- CALLOUT BADGES ---
  const badges = [
    { x: 76,  y: cy - 275, w: 450, title: '01 • 99.9% BIO-EQUIVALENT API CORE', active: stepActive <= 2 },
    { x: 556, y: cy - 275, w: 448, title: '02 • 10,000L VACCINE BIOREACTOR',    active: stepActive === 3 },
    { x: 280, y: cy + 235, w: 520, title: '03 • 65% LOWER CLEANROOM COST VS WEST', active: stepActive >= 2 }
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
// 4-IN-10 AMERICAN GENERIC PILLS SHELF + 60% GLOBAL VACCINES CARD (S07)
// ============================================================================
export function drawUSCabinet10PillsGrid(ctx, progress = 1.0, alpha = 1.0) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  drawFrostedCard(ctx, 84, 830, 912, 435, {
    radius: 30, fill: 'rgba(10, 22, 122, 0.78)', borderTop: 'rgba(253, 230, 138, 0.85)'
  });

  drawTrackedCaps(ctx, '4 IN 10 US GENERIC PILLS • 60% OF WORLD VACCINES', 540, 880, {
    fontSize: 16.5, tracking: 2.5, align: 'center', color: '#FDE68A'
  });

  // 5x2 Grid of 10 Giant 3D Capsules: first 4 blaze in Saffron Gold!
  const cols = 5, rows = 2;
  for (let i = 0; i < 10; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const px = 212 + c * 164;
    const py = 995 + r * 145;
    const ip = snapOutSpring(clamp((progress - i * 0.06) / 0.30, 0, 1));
    const isIndia = i < 4;

    ctx.save();
    ctx.translate(px, py);
    ctx.scale(ip, ip);
    drawCapsuleIcon(ctx, 0, 0, 96, 23, -0.42, isIndia);
    ctx.restore();
  }

  drawTrackedCaps(ctx, 'GOLD = ENGINEERED IN INDIA (40% US SHARE)', 540, 1222, {
    fontSize: 14.5, tracking: 2.2, align: 'center', color: '#BAE6FD'
  });

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

    // Medical Vector Icons (0: Capsule, 1: Hexagonal Chemical Benzene Ring, 2: Vaccine Vial)
    const bx = startX + 34, by = y + 29;
    roundRectPath(ctx, bx, by, 84, 84, 22);
    ctx.fillStyle = isSel ? 'rgba(250, 204, 21, 0.24)' : 'rgba(255, 255, 255, 0.10)';
    ctx.fill();
    ctx.strokeStyle = isSel ? '#FDE68A' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2; ctx.stroke();

    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.8;
    ctx.beginPath();
    if (i === 0) {
      ctx.moveTo(bx + 24, by + 56); ctx.lineTo(bx + 56, by + 24);
      ctx.arc(bx + 42, by + 42, 20, 0, Math.PI * 2);
    } else if (i === 1) {
      for (let h = 0; h < 6; h++) {
        const a = (h / 6) * Math.PI * 2 - Math.PI / 2;
        const hx = bx + 42 + Math.cos(a) * 22;
        const hy = by + 42 + Math.sin(a) * 22;
        if (h === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    } else {
      ctx.rect(bx + 28, by + 30, 28, 34);
      ctx.moveTo(bx + 34, by + 30); ctx.lineTo(bx + 34, by + 20);
      ctx.lineTo(bx + 50, by + 20); ctx.lineTo(bx + 50, by + 30);
    }
    ctx.stroke();

    ctx.font = 'italic 400 60px InstrumentSerif';
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
  ctx.fillText('Med School Friend', cx + 114, cy + 62);
  drawTrackedCaps(ctx, 'ACTIVE NOW', cx + 114, cy + 86, { fontSize: 15, tracking: 2.5, color: '#FDE68A' });

  roundRectPath(ctx, cx + 42, cy + 132, 610, 84, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.11)'; ctx.fill();
  ctx.font = '400 28px PlusJakarta'; ctx.fillStyle = '#FFFFFF';
  ctx.fillText('4 in 10 US pills are from India?!', cx + 70, cy + 183);

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
    ctx.fillText('650+ FDA', pcx, thumbY + thumbH - 48);
    ctx.font = '600 13px PlusJakarta'; ctx.fillStyle = '#FDE68A';
    ctx.fillText('WORLD PHARMACY', pcx, thumbY + thumbH - 22);
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
