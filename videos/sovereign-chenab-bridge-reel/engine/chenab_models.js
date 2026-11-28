// engine/chenab_models.js
// Procedural 3D/CAD Engineering Assemblies: Eiffel Tower vs 359m Chenab Arch, 467m Steel Truss & DRDO Blast-Proof X-Ray, UI Widgets

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
    ctx.fillText('266', bx + 78, by + 40);
    ctx.restore();
    return;
  }

  if (mode === 'plant') {
    const appear = easeOutCubic(clamp(p / 0.20, 0, 1));
    const dockT = easeOutQuart(clamp((p - 0.76) / 0.24, 0, 1));
    const cx = lerp(540, 919, dockT), cy = lerp(1120, 112, dockT);
    const bw = lerp(650, 174, dockT), bh = lerp(240, 60, dockT);
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
    ctx.fillText('266', bx + lerp(245, 78, dockT), cy + lerp(24, 9, dockT));
    ctx.restore();

    if (dockT < 0.45) {
      const subA = appear * (1 - dockT / 0.45);
      drawTrackedCaps(ctx, 'SURVIVAL LIMIT', bx + 52, by + bh - 38, { fontSize: 18, alpha: subA });
      drawTrackedCaps(ctx, 'LOCKED', bx + bw - 52, by + bh - 38, { fontSize: 18, color: '#FDE68A', align: 'right', alpha: subA });
    }
    return;
  }

  if (mode === 'unlock') {
    const flyT = snapOutSpring(clamp(p / 0.24, 0, 1));
    const openT = easeOutCubic(clamp((p - 0.20) / 0.28, 0, 1));
    const cx = lerp(919, 540, clamp(flyT, 0, 1));
    const cy = lerp(112, 650, clamp(flyT, 0, 1));
    const bw = lerp(174, 820, clamp(flyT, 0, 1));
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
        startValue: 80,
        value: 266,
        suffix: 'km/h',
        suffixItalicSerif: true,
        progress: clamp((p - 0.18) / 0.36, 0, 1),
        x: bx + 495,
        y: cy + 32,
        fontSize: 136,
        weight: 300,
        color: '#FFFFFF',
        suffixColor: '#FDE68A'
      });
    }
    if (flyT > 0.7) {
      drawTrackedCaps(ctx, 'CYCLONIC HIMALAYAN WIND RATING', cx, by + bh - 42, {
        fontSize: 20, tracking: 3.4, align: 'center', color: '#FFFFFF'
      });
    }
  }
}

// ============================================================================
// EIFFEL TOWER (324m) VS CHENAB ARCH BRIDGE (359m = +35m TALLER!) MONUMENT
// ============================================================================
export function drawEiffelVsChenabMonument(ctx, opts = {}) {
  const {
    riverY = 1310,
    eiffelProgress = 1.0,
    chenabProgress = 1.0,
    trainProgress = 0.5
  } = opts;

  const pxPerMetre = 2.08; // 359m = 747px tall!
  const eiffelH = 324 * pxPerMetre * easeOutQuart(clamp(eiffelProgress, 0, 1));
  const chenabH = 359 * pxPerMetre * easeOutQuart(clamp(chenabProgress, 0, 1));

  // Roaring turquoise Chenab River baseline
  ctx.save();
  const rg = ctx.createLinearGradient(80, riverY, W - 80, riverY);
  rg.addColorStop(0, 'rgba(255,255,255,0.2)');
  rg.addColorStop(0.5, '#7DD3FC');
  rg.addColorStop(1, 'rgba(255,255,255,0.2)');
  ctx.strokeStyle = rg;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(76, riverY); ctx.lineTo(W - 76, riverY); ctx.stroke();

  // --- LEFT: ARCHITECTURAL EIFFEL TOWER SILHOUETTE & LATTICE (x = 255) ---
  const ex = 255;
  const eTopY = riverY - eiffelH;
  if (eiffelH > 20) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2.4;

    // Classic curved parabolic Eiffel Tower profile
    ctx.beginPath();
    ctx.moveTo(ex - 6, eTopY);
    ctx.quadraticCurveTo(ex - 18, riverY - eiffelH * 0.42, ex - 108, riverY);
    ctx.lineTo(ex - 64, riverY);
    ctx.arc(ex, riverY, 64, Math.PI, 0, false);
    ctx.lineTo(ex + 108, riverY);
    ctx.quadraticCurveTo(ex + 18, riverY - eiffelH * 0.42, ex + 6, eTopY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Observation decks + spire + cross-bracing
    const d1Y = riverY - eiffelH * 0.22;
    const d2Y = riverY - eiffelH * 0.42;
    const d3Y = riverY - eiffelH * 0.86;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(ex - 78, d1Y); ctx.lineTo(ex + 78, d1Y);
    ctx.moveTo(ex - 48, d2Y); ctx.lineTo(ex + 48, d2Y);
    ctx.moveTo(ex - 16, d3Y); ctx.lineTo(ex + 16, d3Y);
    ctx.moveTo(ex, eTopY - 22); ctx.lineTo(ex, eTopY);
    ctx.stroke();

    // Dashed horizontal reference line across from Eiffel's 324m peak!
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.50)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(ex - 90, eTopY);
    ctx.lineTo(980, eTopY);
    ctx.stroke();
    ctx.restore();

    drawOdometer(ctx, {
      startValue: 100, value: 324, suffix: 'm',
      progress: eiffelProgress,
      x: ex, y: eTopY - 34, fontSize: 72, weight: 300, color: 'rgba(255,255,255,0.9)'
    });
    drawTrackedCaps(ctx, 'EIFFEL TOWER • PARIS', ex, riverY + 42, {
      fontSize: 17, tracking: 2.6, align: 'center', color: 'rgba(255,255,255,0.82)'
    });
  }

  // --- RIGHT: TOWERING 359m GOLDEN CHENAB STEEL ARCH BRIDGE (x = 460..985) ---
  if (chenabH > 20) {
    const cLeft = 455, cRight = 985, cMid = (cLeft + cRight) / 2;
    const deckY = riverY - chenabH;
    const archFootY = riverY - chenabH * 0.14;

    ctx.save();
    // Himalayan rock canyon slopes flanking the river
    ctx.fillStyle = 'rgba(40, 12, 48, 0.55)';
    ctx.beginPath();
    ctx.moveTo(cLeft - 20, deckY + 25);
    ctx.lineTo(cLeft + 75, riverY);
    ctx.lineTo(cLeft - 20, riverY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cRight + 20, deckY + 25);
    ctx.lineTo(cRight - 75, riverY);
    ctx.lineTo(cRight + 20, riverY);
    ctx.closePath();
    ctx.fill();

    // Luminous golden twin-rib parabolic arch
    ctx.shadowColor = 'rgba(255, 224, 110, 0.78)';
    ctx.shadowBlur = 32;
    ctx.strokeStyle = '#FFF4B8';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cLeft + 36, archFootY);
    ctx.quadraticCurveTo(cMid, deckY - (archFootY - deckY) * 0.96, cRight - 36, archFootY);
    ctx.stroke();

    // Lower parallel truss chord
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(cLeft + 46, archFootY + 24);
    ctx.quadraticCurveTo(cMid, deckY + 26 - (archFootY - deckY) * 0.94, cRight - 46, archFootY + 24);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Vertical spandrel steel piers rising from parabolic arch up to horizontal rail deck!
    const numPiers = 11;
    ctx.strokeStyle = 'rgba(255, 244, 184, 0.85)';
    ctx.lineWidth = 2.6;
    for (let i = 0; i <= numPiers; i++) {
      const u = i / numPiers;
      const px = lerp(cLeft + 24, cRight - 24, u);
      const parabolaT = 4 * u * (1 - u); // 0 at ends, 1 at crown
      const archY = lerp(archFootY, deckY + 8, parabolaT);
      ctx.beginPath();
      ctx.moveTo(px, deckY);
      ctx.lineTo(px, archY);
      ctx.stroke();
    }

    // Main 1,315m Horizontal Blast-Proof Viaduct Deck
    ctx.shadowColor = 'rgba(255, 232, 130, 0.9)';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#FFFDF2';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(cLeft, deckY);
    ctx.lineTo(cRight, deckY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Sleek Vande Bharat Express Train gliding across the 359m deck!
    const trainX = lerp(cLeft + 20, cRight - 140, clamp(trainProgress, 0, 1));
    roundRectPath(ctx, trainX, deckY - 18, 122, 13, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.fillStyle = '#F97316';
    ctx.fillRect(trainX + 6, deckY - 12, 110, 3);

    // +35m TALLER golden caliper bracket between Eiffel (324m) and Chenab (359m)!
    if (chenabProgress > 0.7) {
      const calX = cLeft + 8;
      ctx.strokeStyle = '#FFFDF2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(calX - 10, deckY); ctx.lineTo(calX + 10, deckY);
      ctx.moveTo(calX, deckY); ctx.lineTo(calX, eTopY);
      ctx.moveTo(calX - 10, eTopY); ctx.lineTo(calX + 10, eTopY);
      ctx.stroke();

      drawFrostedCard(ctx, calX - 105, (deckY + eTopY) / 2 - 26, 210, 52, {
        radius: 26, fill: 'rgba(255, 248, 215, 0.24)', borderTop: '#FFFDF2'
      });
      drawTrackedCaps(ctx, '+35M TALLER!', calX, (deckY + eTopY) / 2 + 1, {
        fontSize: 17, tracking: 2.4, align: 'center', color: '#FFFDF2'
      });
    }

    drawOdometer(ctx, {
      startValue: 120, value: 359, suffix: 'm',
      progress: chenabProgress,
      x: cMid + 20, y: deckY - 42, fontSize: 132, weight: 300, color: '#FFFFFF', suffixColor: '#FFF7D6'
    });
    drawTrackedCaps(ctx, 'CHENAB BRIDGE • JAMMU & KASHMIR', cMid, riverY + 42, {
      fontSize: 17, tracking: 2.6, align: 'center', color: '#FFFDF2'
    });
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 3D CAD BLUEPRINT X-RAY OF CHENAB ARCH + 63MM DRDO BLAST-PROOF PIERS (S06)
// ============================================================================
export function drawChenabBlueprintXRay(ctx, opts = {}) {
  const {
    cx = 540,
    cy = 780,
    stepActive = 1, // 1: 63mm Blast Steel, 2: Concrete Piers, 3: Redundant Load Path, 4: Live Sensors
    tSec = 0
  } = opts;

  const spanW = 860, archH = 380;
  const leftX = cx - spanW / 2, rightX = cx + spanW / 2;
  const deckY = cy - 150;
  const footY = deckY + archH;

  ctx.save();
  // Canyon wireframe contours
  ctx.strokeStyle = 'rgba(91, 192, 255, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftX - 50, deckY - 20);
  ctx.lineTo(leftX + 110, footY + 90);
  ctx.lineTo(rightX - 110, footY + 90);
  ctx.lineTo(rightX + 50, deckY - 20);
  ctx.stroke();

  // Twin-chord CAD Steel Arch Truss with diagonal triangulated web members!
  const samples = 24;
  const upperPts = [], lowerPts = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const x = lerp(leftX + 45, rightX - 45, u);
    const para = 4 * u * (1 - u);
    const uy = lerp(footY - 25, deckY + 12, para);
    const ly = uy + lerp(38, 22, para);
    upperPts.push([x, uy]);
    lowerPts.push([x, ly]);
  }

  // Triangulated truss web
  ctx.strokeStyle = 'rgba(91, 192, 255, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < samples; i++) {
    ctx.moveTo(upperPts[i][0], upperPts[i][1]);
    ctx.lineTo(lowerPts[i][0], lowerPts[i][1]);
    ctx.lineTo(upperPts[i + 1][0], upperPts[i + 1][1]);
  }
  ctx.stroke();

  // Main upper & lower chords
  ctx.strokeStyle = stepActive === 1 ? '#F7C948' : '#5BC0FF';
  ctx.lineWidth = 4.2;
  ctx.shadowColor = stepActive === 1 ? 'rgba(247, 201, 72, 0.7)' : 'rgba(91, 192, 255, 0.6)';
  ctx.shadowBlur = 18;
  for (const arr of [upperPts, lowerPts]) {
    ctx.beginPath();
    arr.forEach(([x, y], idx) => idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Vertical concrete-filled steel piers + S40 main inclined pylon!
  const pierIndices = [1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 23];
  for (let k = 0; k < pierIndices.length; k++) {
    const pi = pierIndices[k];
    const [px, py] = upperPts[pi];
    const isBlastFocus = (k === 2); // Left tall pier for DRDO blast simulation!

    ctx.strokeStyle = isBlastFocus && stepActive <= 2 ? '#F7C948' : 'rgba(147, 197, 253, 0.82)';
    ctx.lineWidth = isBlastFocus ? 5.5 : 3.0;
    ctx.beginPath();
    ctx.moveTo(px, deckY);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Simulated DRDO Blast Shockwave Ring around Pier #2 (exact match to a.mp4 00:21 mine-blast glow!)
    if (isBlastFocus) {
      const pulse = (tSec * 1.35) % 1;
      const blastY = (deckY + py) * 0.55;
      const bg = ctx.createRadialGradient(px, blastY, 4, px, blastY, 95);
      bg.addColorStop(0, 'rgba(251, 146, 60, 0.75)');
      bg.addColorStop(0.5, 'rgba(245, 158, 11, 0.28)');
      bg.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(px, blastY, 95, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = `rgba(253, 224, 71, ${(1 - pulse).toFixed(2)})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(px, blastY, 18 + pulse * 68, 0, Math.PI * 2); ctx.stroke();

      // Target reticle brackets around blast-proof joint
      ctx.strokeStyle = '#F7C948';
      ctx.lineWidth = 2.5;
      for (const [dx, dy] of [[-28, -28], [28, -28], [-28, 28], [28, 28]]) {
        ctx.beginPath();
        ctx.moveTo(px + dx, blastY + dy * 0.6);
        ctx.lineTo(px + dx, blastY + dy);
        ctx.lineTo(px + dx * 0.6, blastY + dy);
        ctx.stroke();
      }
    }
  }

  // Horizontal Rail Deck + Live Optical Fiber Sensor Nodes
  ctx.strokeStyle = '#E0F2FE';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(leftX, deckY); ctx.lineTo(rightX, deckY); ctx.stroke();

  for (let s = 0; s <= 8; s++) {
    const sx = lerp(leftX + 40, rightX - 40, s / 8);
    ctx.fillStyle = stepActive >= 3 ? '#FACC15' : '#38BDF8';
    ctx.beginPath(); ctx.arc(sx, deckY, 5.5, 0, Math.PI * 2); ctx.fill();
  }

  // Callout Badges anchored cleanly around the arch
  const badges = [
    { x: 78, y: deckY + 210, title: '01 • 63MM DRDO BLAST STEEL', active: stepActive === 1 },
    { x: 642, y: deckY + 210, title: '02 • CONCRETE-FILLED RIBS', active: stepActive === 2 },
    { x: 642, y: deckY - 108, title: '03 • 100+ LIVE WIND SENSORS', active: stepActive >= 3 }
  ];
  for (const b of badges) {
    drawFrostedCard(ctx, b.x, b.y, 356, 58, {
      radius: 16,
      fill: b.active ? 'rgba(247, 201, 72, 0.18)' : 'rgba(8, 25, 58, 0.88)',
      borderTop: b.active ? '#F7C948' : 'rgba(91, 192, 255, 0.65)'
    });
    drawTrackedCaps(ctx, b.title, b.x + 178, b.y + 30, {
      fontSize: 14.5, tracking: 2.0, align: 'center', color: b.active ? '#FFFBEB' : '#93C5FD'
    });
  }

  ctx.restore();
}

// Poll & DM Widgets
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

    // Bridge/Tunnel vector icon badge
    const bx = startX + 34, by = y + 29;
    roundRectPath(ctx, bx, by, 84, 84, 22);
    ctx.fillStyle = isSel ? 'rgba(250, 204, 21, 0.24)' : 'rgba(255, 255, 255, 0.10)';
    ctx.fill();
    ctx.strokeStyle = isSel ? '#FDE68A' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2; ctx.stroke();

    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (i === 0) {
      ctx.moveTo(bx + 14, by + 34); ctx.lineTo(bx + 70, by + 34);
      ctx.moveTo(bx + 16, by + 62); ctx.quadraticCurveTo(bx + 42, by + 22, bx + 68, by + 62);
    } else if (i === 1) {
      ctx.arc(bx + 42, by + 56, 22, Math.PI, 0, false);
      ctx.moveTo(bx + 14, by + 56); ctx.lineTo(bx + 70, by + 56);
    } else {
      ctx.moveTo(bx + 42, by + 20); ctx.lineTo(bx + 42, by + 64);
      ctx.moveTo(bx + 14, by + 52); ctx.lineTo(bx + 42, by + 24); ctx.lineTo(bx + 70, by + 52);
    }
    ctx.stroke();

    ctx.font = 'italic 400 64px InstrumentSerif';
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
  ctx.fillText('Kashmir Trip Buddy', cx + 114, cy + 62);
  drawTrackedCaps(ctx, 'ACTIVE NOW', cx + 114, cy + 86, { fontSize: 15, tracking: 2.5, color: '#FDE68A' });

  roundRectPath(ctx, cx + 42, cy + 132, 560, 84, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.11)'; ctx.fill();
  ctx.font = '400 29px PlusJakarta'; ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Vande Bharat to Srinagar when?!', cx + 70, cy + 183);

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
    ctx.fillText('359m Arch', pcx, thumbY + thumbH - 48);
    ctx.font = '600 14px PlusJakarta'; ctx.fillStyle = '#FDE68A';
    ctx.fillText('HIGHEST ON EARTH', pcx, thumbY + thumbH - 22);
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
