// engine/widgets.js
// Signature UI, Frosted Glassmorphism, Progress Rail, Curiosity Lock, Isometric 3D Exploded Phone, Poll & DM Cards

import { W, H, clamp, lerp, easeOutCubic, easeOutQuart, easeOutBack, roundRectPath, mulberry32 } from './math_color.js';
import { drawTrackedCaps, drawOdometer } from './typography.js';

// 1. Frosted Glassmorphism Card (1:1 specular border & translucent fill from b.mp4 / c.mp4)
export function drawFrostedCard(ctx, x, y, w, h, opts = {}) {
  const {
    radius = 28,
    fill = 'rgba(255, 255, 255, 0.085)',
    borderTop = 'rgba(255, 255, 255, 0.56)',
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

  // Subtle top-inner specular sheen
  const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.55);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0.00)');
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = sheen;
  ctx.fill();

  // Directional 1.6px specular rim
  const strokeGrad = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
  strokeGrad.addColorStop(0, borderTop);
  strokeGrad.addColorStop(1, borderBot);
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.strokeStyle = strokeGrad;
  ctx.lineWidth = borderWidth;
  ctx.stroke();

  ctx.restore();
}

// 2. Top 7-Node Chapter Progress Rail (exact match to ref_c_top_rail_leaderboard.jpg)
export function drawChapterRail(ctx, chapters, activeIdx, alpha = 1) {
  if (alpha <= 0.01) return;
  const startX = 82;
  const y = 112;
  const stepX = 82;
  const count = 7; // chapters 1..7

  ctx.save();
  ctx.globalAlpha = alpha;

  // Completed gold line vs upcoming subtle line
  for (let i = 0; i < count - 1; i++) {
    const x1 = startX + i * stepX;
    const x2 = startX + (i + 1) * stepX;
    const done = (i + 1) <= activeIdx;
    ctx.strokeStyle = done ? '#FACC15' : 'rgba(255, 255, 255, 0.30)';
    ctx.lineWidth = done ? 2.6 : 1.6;
    ctx.beginPath();
    ctx.moveTo(x1 + 9, y);
    ctx.lineTo(x2 - 9, y);
    ctx.stroke();
  }

  for (let i = 0; i < count; i++) {
    const cx = startX + i * stepX;
    const chapNum = i + 1;
    const isCurrent = chapNum === activeIdx;
    const isPast = chapNum < activeIdx;

    if (isCurrent) {
      ctx.save();
      ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#FFE066';
      ctx.beginPath();
      ctx.arc(cx, y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const label = chapters[chapNum] ? chapters[chapNum].label : '';
      drawTrackedCaps(ctx, label, Math.max(82, cx - 28), y + 40, {
        fontSize: 19,
        tracking: 3.4,
        color: '#FFFFFF',
        weight: 600
      });
    } else if (isPast) {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(cx, y, 6.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, y, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Crisp Vector Padlock Icon (closed or unlocked!)
export function drawPadlockIcon(ctx, cx, cy, size = 44, unlockedProgress = 0, color = '#FACC15') {
  const s = size / 44;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  // Shackle
  ctx.save();
  const liftY = -unlockedProgress * 9;
  const rot = -unlockedProgress * 0.48;
  ctx.translate(11, -6 + liftY);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, 6);
  ctx.lineTo(-22, -6);
  ctx.arc(-11, -6, 11, Math.PI, 0, false);
  ctx.lineTo(0, unlockedProgress > 0.2 ? 0 : 6);
  ctx.stroke();
  ctx.restore();

  // Body
  roundRectPath(ctx, -18, -2, 36, 28, 7);
  ctx.fillStyle = color;
  ctx.fill();

  // Keyhole
  ctx.fillStyle = '#07106B';
  ctx.beginPath();
  ctx.arc(0, 9, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-1.8, 11, 3.6, 8);

  ctx.restore();
}

// 3. Curiosity Lock Pill / Center Card (c.mp4 00:10 -> top-right dock -> 01:02 unlock!)
export function drawCuriosityLockWidget(ctx, mode, p = 1) {
  // mode: 'plant' (center -> top-right), 'docked' (mini pill top-right), 'unlock' (top-right -> center open!)
  if (mode === 'docked') {
    const bx = 838, by = 82, bw = 166, bh = 60;
    drawFrostedCard(ctx, bx, by, bw, bh, {
      radius: 18,
      fill: 'rgba(18, 28, 145, 0.52)',
      borderTop: 'rgba(255, 255, 255, 0.50)'
    });
    drawPadlockIcon(ctx, bx + 42, by + 31, 26, 0, '#FACC15');
    ctx.save();
    ctx.filter = 'blur(7px)';
    ctx.font = '600 28px PlusJakarta';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('10+', bx + 80, by + 40);
    ctx.restore();
    return;
  }

  if (mode === 'plant') {
    // p in [0..1]: 0..0.25 appear center, 0.25..0.78 hold center, 0.78..1.00 fly to top-right dock!
    const appear = easeOutCubic(clamp(p / 0.22, 0, 1));
    const dockT = easeOutQuart(clamp((p - 0.78) / 0.22, 0, 1));

    const cx = lerp(540, 921, dockT);
    const cy = lerp(1110, 112, dockT);
    const bw = lerp(640, 166, dockT);
    const bh = lerp(240, 60, dockT);
    const bx = cx - bw / 2;
    const by = cy - bh / 2;

    drawFrostedCard(ctx, bx, by, bw, bh, {
      radius: lerp(32, 18, dockT),
      fill: 'rgba(14, 24, 142, 0.68)',
      borderTop: 'rgba(255, 240, 180, 0.65)',
      glowColor: 'rgba(250, 204, 21, 0.25)',
      glowBlur: 28 * (1 - dockT),
      alpha: appear
    });

    const iconScale = lerp(58, 26, dockT);
    drawPadlockIcon(ctx, bx + lerp(128, 42, dockT), cy - lerp(12, 0, dockT), iconScale, 0, '#FACC15');

    ctx.save();
    ctx.globalAlpha = appear;
    ctx.filter = `blur(${lerp(15, 7, dockT).toFixed(1)}px)`;
    ctx.font = `600 ${Math.round(lerp(116, 28, dockT))}px PlusJakarta`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('10+', bx + lerp(260, 80, dockT), cy + lerp(24, 9, dockT));
    ctx.restore();

    if (dockT < 0.45) {
      const subA = appear * (1 - dockT / 0.45);
      drawTrackedCaps(ctx, 'THE PACE', bx + 54, by + bh - 38, { fontSize: 19, color: 'rgba(255,255,255,0.85)', alpha: subA });
      drawTrackedCaps(ctx, 'LOCKED', bx + bw - 54, by + bh - 38, { fontSize: 19, color: '#FDE68A', align: 'right', alpha: subA });
    }
    return;
  }

  if (mode === 'unlock') {
    // p in [0..1]: 0..0.22 fly from top-right to center, 0.22..0.48 pop open padlock & unblur 10+!
    const flyT = easeOutBack(clamp(p / 0.24, 0, 1), 1.1);
    const openT = easeOutCubic(clamp((p - 0.22) / 0.26, 0, 1));

    const cx = lerp(921, 540, clamp(flyT, 0, 1.05));
    const cy = lerp(112, 1180, clamp(flyT, 0, 1.05));
    const bw = lerp(166, 740, clamp(flyT, 0, 1));
    const bh = lerp(60, 290, clamp(flyT, 0, 1));
    const bx = cx - bw / 2;
    const by = cy - bh / 2;

    drawFrostedCard(ctx, bx, by, bw, bh, {
      radius: lerp(18, 34, clamp(flyT, 0, 1)),
      fill: 'rgba(10, 18, 128, 0.78)',
      borderTop: 'rgba(255, 238, 160, 0.85)',
      glowColor: 'rgba(250, 204, 21, 0.45)',
      glowBlur: 42 * openT
    });

    drawPadlockIcon(ctx, bx + lerp(42, 145, clamp(flyT, 0, 1)), cy - lerp(0, 22, clamp(flyT, 0, 1)), lerp(26, 76, clamp(flyT, 0, 1)), openT, '#FACC15');

    if (openT < 0.25) {
      ctx.save();
      ctx.filter = `blur(${lerp(12, 2, openT / 0.25).toFixed(1)}px)`;
      ctx.font = `300 ${Math.round(lerp(28, 142, clamp(flyT, 0, 1)))}px PlusJakarta`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('10+', bx + lerp(80, 265, clamp(flyT, 0, 1)), cy + lerp(9, 28, clamp(flyT, 0, 1)));
      ctx.restore();
    } else {
      const odoP = clamp((p - 0.22) / 0.36, 0, 1);
      drawOdometer(ctx, {
        startValue: 1,
        value: 10,
        progress: odoP,
        suffix: '+',
        x: bx + 435,
        y: cy + 32,
        fontSize: 152,
        weight: 300,
        color: '#FFFFFF',
        suffixColor: '#FDE68A'
      });
    }

    if (flyT > 0.7) {
      drawTrackedCaps(ctx, 'SMARTPHONES BUILT EVERY SECOND', cx, by + bh - 44, {
        fontSize: 21,
        tracking: 3.4,
        align: 'center',
        color: '#FFFFFF',
        alpha: clamp((flyT - 0.7) / 0.3, 0, 1)
      });
    }
  }
}

// 4. Luminous Golden Bar Rocket + Dashed Ghost Target + Bokeh Sparkles (b.mp4 & d.mp4)
export function drawRocketBarComparison(ctx, opts = {}) {
  const {
    baselineY = 1360,
    leftX = 270,
    rightX = 760,
    barW = 205,
    leftBarH = 22,
    maxRightBarH = 740,
    rightProgress = 0, // 0 = dashed ghost only, 0..1 = rocket gold fill
    showGhost = true,
    tSec = 0
  } = opts;

  // Crisp horizontal axis rule
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(96, baselineY);
  ctx.lineTo(W - 96, baselineY);
  ctx.stroke();

  // Left tiny 2014 baseline bar
  ctx.save();
  ctx.shadowColor = 'rgba(250, 204, 21, 0.65)';
  ctx.shadowBlur = 18;
  roundRectPath(ctx, leftX - barW / 2, baselineY - leftBarH, barW, leftBarH, 10);
  ctx.fillStyle = '#FACC15';
  ctx.fill();
  ctx.restore();

  // Right dashed ghost outline
  if (showGhost) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    roundRectPath(ctx, rightX - barW / 2, baselineY - maxRightBarH, barW, maxRightBarH, 28);
    ctx.stroke();
    ctx.restore();
  }

  // Right luminous golden rocket bar
  if (rightProgress > 0.005) {
    const h = Math.max(24, easeOutQuart(rightProgress) * maxRightBarH);
    const bx = rightX - barW / 2;
    const by = baselineY - h;

    ctx.save();
    ctx.shadowColor = 'rgba(255, 220, 110, 0.72)';
    ctx.shadowBlur = 46;
    const g = ctx.createLinearGradient(bx, by, bx, baselineY);
    g.addColorStop(0.00, '#FFFDF2');
    g.addColorStop(0.32, '#FFE684');
    g.addColorStop(0.75, '#F6C249');
    g.addColorStop(1.00, '#EA9E28');
    roundRectPath(ctx, bx, by, barW, h, 28);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    // Rising golden bokeh sparkles inside & around column (exact match to d.mp4 00:15!)
    ctx.save();
    roundRectPath(ctx, bx - 20, by - 40, barW + 40, h + 40, 32);
    ctx.clip();
    const rng = mulberry32(4219);
    for (let i = 0; i < 36; i++) {
      const rx = rng();
      const speed = 65 + rng() * 110;
      const rSize = 2.5 + rng() * 5.5;
      const startOff = rng() * 800;
      const py = baselineY - ((startOff + tSec * speed) % (maxRightBarH + 60));
      if (py >= by - 10) {
        const px = bx + 16 + rx * (barW - 32);
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.35 + rng() * 0.55).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(px, py, rSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

// 5. Procedural 4-Layer 3D Isometric Exploded Smartphone Assembly (S06 Blueprint X-Ray!)
export function drawExplodedSmartphone3D(ctx, opts = {}) {
  const {
    cx = 540,
    cy = 1090,
    explodeProgress = 1.0, // 0 = assembled slab, 1 = 4-layer separated exploded cutaway
    yawDeg = -26,
    pitchDeg = 27,
    stepActive = 4 // 1..4 active layer callout highlight
  } = opts;

  const ep = easeOutQuart(clamp(explodeProgress, 0, 1));
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const sinP = Math.sin(pitch), cosP = Math.cos(pitch);

  // Project 3D local phone coordinates (lx, ly, lz) -> 2D canvas
  const proj = (lx, ly, lz) => {
    const rx = lx * cosY - ly * sinY;
    const ry = lx * sinY + ly * cosY;
    return [
      cx + rx,
      cy + ry * sinP - lz * cosP
    ];
  };

  // Draw an isometric rounded-corner slab at height z with thickness dz
  const drawIsoSlab = (w, d, z, dz, topFill, sideFill, strokeCol, glowCol = null) => {
    const hw = w / 2, hd = d / 2;
    const corners = [
      [-hw, -hd],
      [hw, -hd],
      [hw, hd],
      [-hw, hd]
    ];
    const topPts = corners.map(([x, y]) => proj(x, y, z + dz));
    const botPts = corners.map(([x, y]) => proj(x, y, z));

    ctx.save();
    if (glowCol) {
      ctx.shadowColor = glowCol;
      ctx.shadowBlur = 24;
    }

    // Front-left & front-right visible extruded faces
    for (const [i, j] of [[1, 2], [2, 3], [3, 0]]) {
      ctx.beginPath();
      ctx.moveTo(topPts[i][0], topPts[i][1]);
      ctx.lineTo(topPts[j][0], topPts[j][1]);
      ctx.lineTo(botPts[j][0], botPts[j][1]);
      ctx.lineTo(botPts[i][0], botPts[i][1]);
      ctx.closePath();
      ctx.fillStyle = sideFill;
      ctx.fill();
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Top face
    ctx.beginPath();
    ctx.moveTo(topPts[0][0], topPts[0][1]);
    for (let k = 1; k < 4; k++) ctx.lineTo(topPts[k][0], topPts[k][1]);
    ctx.closePath();
    ctx.fillStyle = topFill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();

    return { topPts, botPts, center: proj(0, 0, z + dz / 2) };
  };

  const pw = 300, pd = 560;
  const zOffsets = [
    lerp(-18, -280, ep), // Layer 4 (Bottom): CNC Metal Unibody Chassis + Li-Ion Battery
    lerp(-6, -90, ep),   // Layer 3: Multilayer SMT Logic PCB + Silicon Packages
    lerp(6, 110, ep),    // Layer 2: Triple-Optics Camera Module & Sensor Shield
    lerp(18, 305, ep)    // Layer 1 (Top): Corning Gorilla Glass OLED Display
  ];

  // Vertical dotted CAD alignment guide rails between corners
  if (ep > 0.08) {
    ctx.save();
    ctx.strokeStyle = `rgba(91, 192, 255, ${(0.36 * ep).toFixed(2)})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 6]);
    for (const [cxOff, cyOff] of [[-pw / 2, -pd / 2], [pw / 2, -pd / 2], [pw / 2, pd / 2], [-pw / 2, pd / 2]]) {
      const pBot = proj(cxOff, cyOff, zOffsets[0]);
      const pTop = proj(cxOff, cyOff, zOffsets[3] + 14);
      ctx.beginPath();
      ctx.moveTo(pBot[0], pBot[1]);
      ctx.lineTo(pTop[0], pTop[1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- LAYER 4 (BOTTOM): CNC MILLED CHASSIS & BATTERY CELL ---
  drawIsoSlab(
    pw, pd, zOffsets[0], 22,
    'rgba(22, 50, 92, 0.92)',
    'rgba(12, 28, 56, 0.96)',
    stepActive === 4 ? '#F7C948' : '#5BC0FF',
    stepActive === 4 ? 'rgba(247, 201, 72, 0.45)' : null
  );
  // Internal Battery Pack & Taptic Engine inside chassis
  drawIsoSlab(pw * 0.62, pd * 0.56, zOffsets[0] + 22, 6, 'rgba(247, 201, 72, 0.25)', 'rgba(247, 201, 72, 0.15)', '#F7C948');

  // --- LAYER 3: MULTILAYER SMT LOGIC PCB ---
  drawIsoSlab(
    pw * 0.84, pd * 0.78, zOffsets[1], 12,
    'rgba(10, 68, 76, 0.90)',
    'rgba(6, 40, 48, 0.95)',
    stepActive === 3 ? '#F7C948' : '#38BDF8',
    stepActive === 3 ? 'rgba(247, 201, 72, 0.45)' : null
  );
  // Golden copper PCB traces + central processor package
  ctx.save();
  ctx.strokeStyle = '#F7C948';
  ctx.lineWidth = 1.8;
  for (let t = -3; t <= 3; t++) {
    const a = proj(t * 24, -140, zOffsets[1] + 13);
    const b = proj(t * 24, 140, zOffsets[1] + 13);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  ctx.restore();
  drawIsoSlab(86, 86, zOffsets[1] + 12, 8, '#1E293B', '#0F172A', '#FDE047');

  // --- LAYER 2: TRIPLE-OPTICS CAMERA ARRAY ---
  const camBase = drawIsoSlab(
    132, 148, zOffsets[2], 16,
    'rgba(18, 38, 72, 0.94)',
    'rgba(9, 20, 44, 0.98)',
    '#F7C948',
    stepActive === 2 ? 'rgba(247, 201, 72, 0.55)' : 'rgba(91, 192, 255, 0.35)'
  );
  // 3 Isometric Sapphire Camera Lenses
  for (const [lx, ly] of [[-30, -34], [-30, 34], [32, 0]]) {
    const lp = proj(lx, ly, zOffsets[2] + 20);
    ctx.save();
    ctx.fillStyle = '#040B1A';
    ctx.strokeStyle = '#5BC0FF';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(lp[0], lp[1], 22, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F7C948';
    ctx.beginPath();
    ctx.arc(lp[0], lp[1], 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- LAYER 1 (TOP): CORNING OLED DISPLAY GLASS ---
  const topGlass = drawIsoSlab(
    pw, pd, zOffsets[3], 10,
    'rgba(91, 192, 255, 0.18)',
    'rgba(91, 192, 255, 0.32)',
    '#93C5FD',
    stepActive === 1 ? 'rgba(91, 192, 255, 0.55)' : null
  );
  // Dynamic Island pill on display glass
  const diL = proj(-34, -pd * 0.41, zOffsets[3] + 11);
  const diR = proj(34, -pd * 0.41, zOffsets[3] + 11);
  ctx.save();
  ctx.strokeStyle = '#E0F2FE';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(diL[0], diL[1]);
  ctx.lineTo(diR[0], diR[1]);
  ctx.stroke();
  ctx.restore();

  // Leader Callout Pills on Left & Right once exploded
  if (ep > 0.25) {
    const ca = clamp((ep - 0.25) / 0.45, 0, 1);
    const callouts = [
      { anchor: proj(pw * 0.45, -40, zOffsets[3] + 6), side: 'right', x: 745, y: 710, code: '01', title: 'OLED COVER GLASS' },
      { anchor: camBase.center, side: 'left', x: 74, y: 905, code: '02', title: 'OPTICS CAMERA MODULE' },
      { anchor: proj(pw * 0.40, 20, zOffsets[1] + 8), side: 'right', x: 725, y: 1120, code: '03', title: 'MULTILAYER SMT PCB' },
      { anchor: proj(-pw * 0.45, 60, zOffsets[0] + 12), side: 'left', x: 74, y: 1355, code: '04', title: 'CNC METAL CHASSIS' }
    ];

    ctx.save();
    ctx.globalAlpha = ca;
    for (const c of callouts) {
      const pillW = 278, pillH = 62;
      const targetX = c.side === 'left' ? c.x + pillW : c.x;
      const targetY = c.y + pillH / 2;

      ctx.strokeStyle = 'rgba(247, 201, 72, 0.78)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(c.anchor[0], c.anchor[1]);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      ctx.fillStyle = '#F7C948';
      ctx.beginPath();
      ctx.arc(c.anchor[0], c.anchor[1], 5, 0, Math.PI * 2);
      ctx.fill();

      drawFrostedCard(ctx, c.x, c.y, pillW, pillH, {
        radius: 16,
        fill: 'rgba(8, 25, 58, 0.85)',
        borderTop: 'rgba(91, 192, 255, 0.65)'
      });
      drawTrackedCaps(ctx, `${c.code} • ${c.title}`, c.x + 18, c.y + pillH / 2 + 1, {
        fontSize: 15,
        tracking: 2.1,
        color: '#FDE68A'
      });
    }
    ctx.restore();
  }
}

// 6. Interactive 3-Option Radio Poll Card (S11 — exact match to b.mp4 00:58 & d.mp4 01:02)
export function drawPollWidget(ctx, options, activeOptionIdx, progress = 1) {
  const appear = easeOutCubic(clamp(progress / 0.25, 0, 1));
  const cardW = 880, cardH = 142, gap = 24;
  const startX = (W - cardW) / 2;
  const startY = 740;

  ctx.save();
  ctx.globalAlpha = appear;

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const y = startY + i * (cardH + gap);
    const isSel = i === activeOptionIdx;

    drawFrostedCard(ctx, startX, y, cardW, cardH, {
      radius: 30,
      fill: isSel ? 'rgba(255, 244, 210, 0.19)' : 'rgba(255, 255, 255, 0.09)',
      borderTop: isSel ? 'rgba(255, 232, 130, 0.92)' : 'rgba(255, 255, 255, 0.38)',
      borderWidth: isSel ? 2.4 : 1.5,
      glowColor: isSel ? 'rgba(250, 204, 21, 0.35)' : null,
      glowBlur: isSel ? 26 : 0
    });

    // Sleek minimal vector phone-camera badge on left
    const bx = startX + 34, by = y + 29;
    roundRectPath(ctx, bx, by, 84, 84, 22);
    ctx.fillStyle = isSel ? 'rgba(250, 204, 21, 0.24)' : 'rgba(255, 255, 255, 0.10)';
    ctx.fill();
    ctx.strokeStyle = isSel ? '#FDE68A' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    //Distinct lens arrangement per brand
    ctx.fillStyle = '#FFFFFF';
    if (i === 0) {
      for (const [ox, oy] of [[28, 28], [28, 56], [56, 42]]) {
        ctx.beginPath(); ctx.arc(bx + ox, by + oy, 8, 0, Math.PI * 2); ctx.fill();
      }
    } else if (i === 1) {
      for (const oy of [22, 42, 62]) {
        ctx.beginPath(); ctx.arc(bx + 42, by + oy, 7, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.beginPath(); ctx.arc(bx + 42, by + 42, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx + 42, by + 42, 7, 0, Math.PI * 2); ctx.fill();
    }

    // Editorial italic brand title
    ctx.font = 'italic 400 66px InstrumentSerif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(opt.label, startX + 150, y + cardH / 2 + 4);

    // Right radio ring + golden active dot
    const rx = startX + cardW - 64, ry = y + cardH / 2;
    ctx.strokeStyle = isSel ? '#FDE68A' : 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(rx, ry, 18, 0, Math.PI * 2);
    ctx.stroke();
    if (isSel) {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(rx, ry, 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bottom "Your one word..." input bar + paper-plane button
  const iy = startY + 3 * (cardH + gap) + 18;
  drawFrostedCard(ctx, startX, iy, cardW, 92, {
    radius: 46,
    fill: 'rgba(255, 255, 255, 0.10)',
    borderTop: 'rgba(255, 255, 255, 0.45)'
  });
  ctx.font = 'italic 400 38px InstrumentSerif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.textBaseline = 'middle';
  ctx.fillText('Your one word...', startX + 44, iy + 48);

  // Gold circular send button + vector paper plane
  const sx = startX + cardW - 48, sy = iy + 46;
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(sx, sy, 32, 0, Math.PI * 2);
  ctx.fill();
  drawPaperPlaneIcon(ctx, sx - 2, sy + 1, 24, '#1E1B4B');

  ctx.restore();
}

export function drawPaperPlaneIcon(ctx, cx, cy, size, color) {
  const s = size / 24;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, -10);
  ctx.lineTo(-11, -1);
  ctx.lineTo(-2, 2);
  ctx.lineTo(10, -10);
  ctx.lineTo(2, 11);
  ctx.lineTo(-2, 2);
  ctx.stroke();
  ctx.restore();
}

// 7. Interactive DM Share Chat Card (S12 — exact match to b.mp4 01:02 & c.mp4 01:34!)
export function drawDMShareCard(ctx, progress = 1) {
  const appear = easeOutCubic(clamp(progress / 0.20, 0, 1));
  const sendP = easeOutQuart(clamp((progress - 0.34) / 0.34, 0, 1));
  const clickPulse = clamp(1 - Math.abs(progress - 0.36) / 0.09, 0, 1);

  const cw = 880, ch = 640;
  const cx = (W - cw) / 2, cy = 720;

  ctx.save();
  ctx.globalAlpha = appear;

  drawFrostedCard(ctx, cx, cy, cw, ch, {
    radius: 36,
    fill: 'rgba(18, 22, 110, 0.68)',
    borderTop: 'rgba(255, 255, 255, 0.50)',
    glowColor: 'rgba(15, 23, 95, 0.5)',
    glowBlur: 32
  });

  // Header avatar + "Tech & India Fan • ACTIVE NOW"
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  ctx.arc(cx + 66, cy + 68, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.arc(cx + 66, cy + 60, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 66, cy + 84, 16, Math.PI, 0, false);
  ctx.fill();

  ctx.font = '600 28px PlusJakarta';
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Tech & India Fan', cx + 114, cy + 62);
  drawTrackedCaps(ctx, 'ACTIVE NOW', cx + 114, cy + 86, { fontSize: 15, tracking: 2.5, color: '#FDE68A' });

  // Incoming left bubble
  roundRectPath(ctx, cx + 42, cy + 132, 540, 84, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.11)';
  ctx.fill();
  ctx.font = '400 29px PlusJakarta';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Wait — my phone was built in India?!', cx + 70, cy + 183);

  // Bottom message composer bar
  const barX = cx + 42, barY = cy + ch - 118, barW = cw - 178, barH = 80;
  roundRectPath(ctx, barX, barY, barW, barH, 40);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  if (sendP > 0.4) {
    ctx.font = '400 26px PlusJakarta';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
    ctx.fillText('Message...', barX + 34, barY + 49);
  }

  // Gold Send Button
  const btnX = cx + cw - 82, btnY = barY + 40;
  ctx.save();
  const btnScale = 1 - clickPulse * 0.14;
  ctx.translate(btnX, btnY);
  ctx.scale(btnScale, btnScale);
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();
  drawPaperPlaneIcon(ctx, -2, 1, 26, '#1E1B4B');
  ctx.restore();

  if (clickPulse > 0.05) {
    ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - clickPulse).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(btnX, btnY, 38 + (1 - clickPulse) * 28, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Mini 9:16 Reel Thumbnail Card animating from composer -> right "SENT" slot!
  const thumbW = lerp(110, 178, sendP);
  const thumbH = lerp(164, 262, sendP);
  const thumbX = lerp(barX + 26, cx + cw - thumbW - 56, sendP);
  const thumbY = lerp(barY - thumbH + 58, cy + 232, sendP);

  ctx.save();
  roundRectPath(ctx, thumbX, thumbY, thumbW, thumbH, 20);
  const tg = ctx.createLinearGradient(thumbX, thumbY, thumbX, thumbY + thumbH);
  tg.addColorStop(0, '#1D4ED8');
  tg.addColorStop(0.6, '#7C2D12');
  tg.addColorStop(1, '#F59E0B');
  ctx.fillStyle = tg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Play triangle + mini headline inside reel card
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  const pcx = thumbX + thumbW / 2, pcy = thumbY + thumbH * 0.42;
  ctx.moveTo(pcx - 10, pcy - 14);
  ctx.lineTo(pcx + 15, pcy);
  ctx.lineTo(pcx - 10, pcy + 14);
  ctx.closePath();
  ctx.fill();

  if (sendP > 0.5) {
    ctx.font = 'italic 400 28px InstrumentSerif';
    ctx.fillStyle = '#FFFBEB';
    ctx.textAlign = 'center';
    ctx.fillText('165× Surge', pcx, thumbY + thumbH - 48);
    ctx.font = '600 15px PlusJakarta';
    ctx.fillStyle = '#FDE68A';
    ctx.fillText('99.2% MADE IN INDIA', pcx, thumbY + thumbH - 22);
    ctx.textAlign = 'left';
  }
  ctx.restore();

  if (sendP > 0.85) {
    drawTrackedCaps(ctx, 'SENT ✓', thumbX + thumbW, thumbY + thumbH + 24, {
      fontSize: 15,
      tracking: 2.4,
      align: 'right',
      color: '#FDE68A',
      alpha: clamp((sendP - 0.85) / 0.15, 0, 1)
    });
  }

  // Animated Crisp Pointer Cursor clicking the send button
  const curP = easeOutCubic(clamp((progress - 0.12) / 0.24, 0, 1));
  const curX = lerp(cx + cw + 40, btnX + 12, curP);
  const curY = lerp(cy + ch + 40, btnY + 14, curP);
  ctx.save();
  ctx.translate(curX, curY);
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 34);
  ctx.lineTo(9, 26);
  ctx.lineTo(16, 40);
  ctx.lineTo(22, 37);
  ctx.lineTo(15, 23);
  ctx.lineTo(26, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}
