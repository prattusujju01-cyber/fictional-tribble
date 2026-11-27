// Sovereign v15.0 — Tactile Archival Evidence Props (Used ONLY on the 6 Specific Archival Beats)
// Direct homage to strip_09.jpg (f450 date flip + Tribune clipping, f1275..1350 twin myth sticky notes)
// & strip_08.jpg (f1875..2025 CDC clinical excerpt under digital analyzer).
// ZERO generic bottom pill tags!

import { clamp, easeOutCubic, easeOutBack } from './dossier.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// S06: Mechanical Split-Flap Date Counter + Sacramento Coroner Newspaper Clipping (strip_09.jpg f450 homage)
export function drawCoronerArchivalSet(ctx, localSec) {
  const enter = easeOutCubic(localSec / 0.45);
  const hiProg = clamp((localSec - 0.95) / 0.55);

  ctx.save();
  ctx.translate(0, (1 - enter) * 26);
  ctx.globalAlpha = enter;

  // 1. Mechanical Split-Flap Date Tiles: [1][2] [JANUARY] [2][0][0][7]
  const groups = [
    { x: 146, w: 62, txt: '1' },
    { x: 214, w: 62, txt: '2' },
    { x: 300, w: 336, txt: 'JANUARY' },
    { x: 660, w: 62, txt: '2' },
    { x: 728, w: 62, txt: '0' },
    { x: 796, w: 62, txt: '0' },
    { x: 864, w: 62, txt: '7' }
  ];
  const fy = 470;
  const fh = 86;

  // Brass frame backing
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, 126, fy - 16, 822, fh + 32, 10);
  ctx.fillStyle = '#3B2814';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#9C7336';
  ctx.stroke();
  ctx.restore();

  for (const g of groups) {
    roundRect(ctx, g.x, fy, g.w, fh, 6);
    const tg = ctx.createLinearGradient(0, fy, 0, fy + fh);
    tg.addColorStop(0, '#262320');
    tg.addColorStop(0.49, '#171513');
    tg.addColorStop(0.51, '#2D2926');
    tg.addColorStop(1, '#181614');
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#5C4B37';
    ctx.stroke();

    ctx.fillStyle = '#F7EFE0';
    ctx.font = '700 48px "OswaldBold"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.txt, g.x + g.w / 2, fy + fh / 2 + 2);

    // Split-flap center hinge line
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(g.x + 2, fy + fh / 2 - 1, g.w - 4, 2.5);
  }

  // 2. Torn Newsprint Coroner Report Card below
  ctx.save();
  ctx.translate(540, 1015);
  ctx.rotate(-0.018);

  ctx.shadowColor = 'rgba(0,0,0,0.46)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 20;

  ctx.beginPath();
  ctx.moveTo(-400, -330);
  ctx.lineTo(400, -330);
  ctx.lineTo(400, 320);
  for (let x = 400; x >= -400; x -= 32) {
    const jag = ((Math.abs(x) * 13) % 14) - 6;
    ctx.lineTo(x, 326 + jag);
  }
  ctx.closePath();
  ctx.fillStyle = '#EFE6D2';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#C5B698';
  ctx.stroke();

  // Masthead
  ctx.fillStyle = '#1C1915';
  ctx.textAlign = 'center';
  ctx.font = '700 42px "LibreBaskerville"';
  ctx.fillText('The Sacramento Chronicle', 0, -258);

  ctx.fillStyle = '#2B2620';
  ctx.fillRect(-355, -226, 710, 3);
  ctx.fillRect(-355, -218, 710, 1);

  ctx.font = '700 19px "SpaceMonoBold"';
  ctx.fillStyle = '#5A5043';
  ctx.fillText('SACRAMENTO COUNTY CORONER  •  AUTOPSY CASE #07-00419', 0, -192);
  ctx.fillRect(-355, -174, 710, 1.2);

  // Headline
  ctx.textAlign = 'left';
  ctx.fillStyle = '#181512';
  ctx.font = '700 40px "LibreBaskerville"';
  ctx.fillText('Mother of 3 Dies Hours After', -350, -116);
  ctx.fillText('Radio Water-Drinking Contest', -350, -64);

  // Yellow highlighter sweep over coroner finding
  if (hiProg > 0) {
    ctx.fillStyle = 'rgba(255, 214, 38, 0.56)';
    ctx.fillRect(-356, -8, 712 * hiProg, 94);
  }

  ctx.fillStyle = '#B01C18';
  ctx.font = '700 26px "SpaceMonoBold"';
  ctx.fillText('CORONER FINDING: ZERO TOXINS OR TRAUMA', -346, 26);
  ctx.fillStyle = '#171411';
  ctx.font = '700 28px "SpaceMonoBold"';
  ctx.fillText('CAUSE: ACUTE WATER INTOXICATION', -346, 68);

  // Two-column newsprint body lines
  ctx.fillStyle = '#4B4338';
  ctx.font = '400 21px "LibreBaskerville"';
  const leftCol = [
    'Autopsy confirmed fatal',
    'cerebral edema triggered',
    'by rapid consumption of',
    'approximately 7.5 liters',
    'of plain drinking water.'
  ];
  const rightCol = [
    'Toxicology screens came',
    'back 100% negative for',
    'alcohol, medication, or',
    'foul play, stunning both',
    'listeners and physicians.'
  ];
  leftCol.forEach((ln, i) => ctx.fillText(ln, -348, 134 + i * 32));
  rightCol.forEach((ln, i) => ctx.fillText(ln, 24, 134 + i * 32));
  ctx.fillStyle = '#BFB196';
  ctx.fillRect(-2, 112, 1.5, 165);

  // Red stamped seal
  const stampP = easeOutBack((localSec - 1.35) / 0.35, 1.6);
  if (stampP > 0.01) {
    ctx.save();
    ctx.translate(230, 225);
    ctx.rotate(-0.16);
    ctx.scale(1.3 - 0.3 * stampP, 1.3 - 0.3 * stampP);
    ctx.globalAlpha = clamp(stampP) * 0.88;
    roundRect(ctx, -118, -34, 236, 68, 8);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#C6221E';
    ctx.stroke();
    ctx.fillStyle = '#C6221E';
    ctx.textAlign = 'center';
    ctx.font = '700 27px "OswaldBold"';
    ctx.fillText('VERIFIED CASE', 0, 10);
    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
}

// S07: Twin Pinned Cream Sticky Notes with Red Ink Slash (strip_09.jpg f1275..1350 direct homage)
export function drawMythStickyNotes(ctx, localSec) {
  const n1 = easeOutBack(localSec / 0.38, 1.25);
  const n2 = easeOutBack((localSec - 0.25) / 0.38, 1.25);
  const slash1 = clamp((localSec - 1.05) / 0.35);
  const slash2 = clamp((localSec - 1.45) / 0.35);

  const drawNote = (cx, cy, rot, prog, lineA, lineB, sub, slashProg) => {
    if (prog <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy + (1 - prog) * 40);
    ctx.rotate(rot);
    ctx.globalAlpha = clamp(prog);

    ctx.shadowColor = 'rgba(0,0,0,0.42)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 18;
    roundRect(ctx, -350, -175, 700, 350, 8);
    ctx.fillStyle = '#F7EFC9';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#DFCFA0';
    ctx.stroke();

    // Top adhesive darker strip
    ctx.fillStyle = 'rgba(210, 190, 132, 0.38)';
    ctx.fillRect(-348, -173, 696, 46);

    // Brass push-pin
    const pg = ctx.createRadialGradient(-4, -142, 2, 0, -138, 16);
    pg.addColorStop(0, '#FFF2B8');
    pg.addColorStop(0.5, '#C88D2A');
    pg.addColorStop(1, '#5E3B08');
    ctx.beginPath();
    ctx.arc(0, -138, 15, 0, Math.PI * 2);
    ctx.fillStyle = pg;
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#241F19';
    ctx.font = '700 62px "CaveatBold"';
    ctx.fillText(lineA, 0, -34);
    ctx.fillStyle = '#1B5E3A';
    ctx.font = '700 68px "CaveatBold"';
    ctx.fillText(lineB, 0, 44);
    ctx.fillStyle = '#6A5E49';
    ctx.font = '700 22px "SpaceMonoBold"';
    ctx.fillText(sub, 0, 118);

    // Hand-drawn red marker X slash
    if (slashProg > 0) {
      ctx.lineCap = 'round';
      ctx.lineWidth = 14;
      ctx.strokeStyle = 'rgba(214, 30, 26, 0.90)';
      const pA = clamp(slashProg * 1.8);
      ctx.beginPath();
      ctx.moveTo(-270, -85);
      ctx.lineTo(-270 + 540 * pA, -85 + 185 * pA);
      ctx.stroke();

      const pB = clamp((slashProg - 0.35) * 1.8);
      if (pB > 0) {
        ctx.beginPath();
        ctx.moveTo(270, -85);
        ctx.lineTo(270 - 540 * pB, -85 + 185 * pB);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  drawNote(515, 760, -0.045, n1, 'PAANI = 100% SAFE', 'KOI OVERDOSE NAHI?', 'COMMON BELIEF #1', slash1);
  drawNote(565, 1295, 0.038, n2, 'ZYADA PAANI PIYO', '= FAST BODY DETOX!', 'COMMON BELIEF #2', slash2);
}

// S15: Clinical Pathology Excerpt Card Below the 3D Digital Electrolyte Analyzer (strip_08.jpg f1950 homage)
export function drawElectrolytePathologyCard(ctx, localSec) {
  const p = easeOutCubic((localSec - 0.20) / 0.45);
  if (p <= 0.01) return;
  const hi = clamp((localSec - 0.95) / 0.55);

  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(540, 1465 + (1 - p) * 24);

  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, -400, -195, 800, 390, 10);
  ctx.fillStyle = '#F2EAD7';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#C5B79B';
  ctx.stroke();

  // Clinical header badge
  ctx.fillStyle = '#183C5E';
  ctx.fillRect(-400, -195, 800, 54);
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.font = '700 23px "SpaceMonoBold"';
  ctx.fillText('CLINICAL SERUM SODIUM REFERENCE  (mmol/L)', -368, -160);

  const rows = [
    { range: '135 – 145 mmol/L', status: 'NORMAL HOMEOSTASIS', col: '#1D6F42', bg: null },
    { range: '125 – 134 mmol/L', status: 'NAUSEA & HEADACHE', col: '#B86B11', bg: null },
    { range: '< 120 mmol/L', status: 'SEVERE CEREBRAL EDEMA & SEIZURES', col: '#B81D18', bg: 'rgba(255, 208, 46, 0.55)' }
  ];

  rows.forEach((r, idx) => {
    const ry = -95 + idx * 92;
    if (r.bg && hi > 0) {
      ctx.fillStyle = r.bg;
      ctx.fillRect(-372, ry - 26, 744 * hi, 68);
    }
    ctx.fillStyle = '#1E1B18';
    ctx.font = '700 28px "OswaldBold"';
    ctx.fillText(r.range, -358, ry + 16);

    ctx.fillStyle = r.col;
    ctx.font = '700 24px "SpaceMonoBold"';
    ctx.fillText(r.status, -92, ry + 15);

    if (idx < 2) {
      ctx.fillStyle = '#D8CCB4';
      ctx.fillRect(-368, ry + 48, 736, 1.5);
    }
  });

  ctx.restore();
}

// S25: New England Journal of Medicine Boston Marathon Excerpt Card
export function drawMarathonExcerptCard(ctx, localSec) {
  const p = easeOutCubic((localSec - 0.25) / 0.45);
  if (p <= 0.01) return;
  const hi = clamp((localSec - 0.90) / 0.55);

  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(540, 1515 + (1 - p) * 22);

  ctx.shadowColor = 'rgba(0,0,0,0.48)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, -405, -155, 810, 310, 8);
  ctx.fillStyle = '#F4ECD9';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#C8BA9E';
  ctx.stroke();

  ctx.fillStyle = '#7A1C1C';
  ctx.fillRect(-405, -155, 810, 48);
  ctx.fillStyle = '#FFF9EE';
  ctx.textAlign = 'left';
  ctx.font = '700 21px "SpaceMonoBold"';
  ctx.fillText('NEW ENGLAND JOURNAL OF MEDICINE  •  BOSTON MARATHON', -376, -124);

  if (hi > 0) {
    ctx.fillStyle = 'rgba(255, 212, 52, 0.54)';
    ctx.fillRect(-376, -74, 752 * hi, 62);
  }

  ctx.fillStyle = '#1A1714';
  ctx.font = '700 33px "LibreBaskerville"';
  ctx.fillText('62 of 488 Runners (13%) Tested Hyponatremic', -366, -32);

  ctx.fillStyle = '#4B4338';
  ctx.font = '400 23px "LibreBaskerville"';
  ctx.fillText('Primary cause: drinking fluids at every mile station faster', -366, 30);
  ctx.fillText('than sweat and kidney excretion could clear excess water.', -366, 66);

  ctx.fillStyle = '#8B201D';
  ctx.font = '700 21px "SpaceMonoBold"';
  ctx.fillText('ALMOND ET AL., NEJM 352:1550-1556', -366, 118);
  ctx.restore();
}

// S32: Final Pinned 3-Rule Hydration Pocket Reference Card
export function drawPocketSummaryCard(ctx, localSec) {
  const p = easeOutCubic(localSec / 0.42);
  ctx.save();
  ctx.globalAlpha = p;
  ctx.translate(540, 1085 + (1 - p) * 26);

  ctx.shadowColor = 'rgba(0,0,0,0.46)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 18;
  roundRect(ctx, -415, -365, 830, 730, 14);
  ctx.fillStyle = '#F6EFE0';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#C6B38E';
  ctx.stroke();

  // Top brass clipboard clip
  roundRect(ctx, -135, -395, 270, 56, 10);
  const cg = ctx.createLinearGradient(0, -395, 0, -339);
  cg.addColorStop(0, '#E8C067');
  cg.addColorStop(0.5, '#B6822A');
  cg.addColorStop(1, '#6E4A10');
  ctx.fillStyle = cg;
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1E1A16';
  ctx.font = '700 40px "OswaldBold"';
  ctx.fillText('SAFE HYDRATION FIELD CARD', 0, -280);
  ctx.fillStyle = '#C9B896';
  ctx.fillRect(-355, -252, 710, 2);

  const items = [
    { num: '01', title: 'PACE YOUR INTAKE', desc: 'Stay at or below 800 mL of water per hour', col: '#18648C' },
    { num: '02', title: 'MATCH SWEAT WITH SALT', desc: 'Add electrolytes / ORS during intense heat or runs', col: '#B86614' },
    { num: '03', title: 'CHECK PALE STRAW TONE', desc: 'Crystal-clear urine = pause chugging immediately', col: '#1B6B45' }
  ];

  items.forEach((it, idx) => {
    const y = -165 + idx * 175;
    roundRect(ctx, -360, y - 48, 92, 92, 12);
    ctx.fillStyle = it.col;
    ctx.fill();

    ctx.fillStyle = '#FFFDF8';
    ctx.textAlign = 'center';
    ctx.font = '700 42px "Anton"';
    ctx.fillText(it.num, -314, y + 14);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#1A1714';
    ctx.font = '700 34px "OswaldBold"';
    ctx.fillText(it.title, -242, y - 6);

    ctx.fillStyle = '#51483C';
    ctx.font = '400 24px "LibreBaskerville"';
    ctx.fillText(it.desc, -242, y + 34);
  });

  ctx.restore();
}
