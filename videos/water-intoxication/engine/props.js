// Spring-Animated Physical Archival 2D Props + Hand-Drawn Red Circles & Live Clinical Curve Charts (v14.0)
import { clamp, lerp, easeOutCubic, easeOutExpo, easeOutBack, mulberry32 } from './dossier.js';

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function drawSplitFlapBoard(ctx, cx, cy, cellsFrom, cellsTo, flipProgress, subLabel = '', tileW = 86, tileH = 110, gap = 10, enterP = 1) {
  const ep = clamp(enterP);
  if (ep <= 0.01) return;
  const sp = easeOutBack(ep, 1.35);

  const n = Math.max(cellsFrom.length, cellsTo.length);
  const totalW = n * tileW + (n - 1) * gap;
  const x0 = -totalW / 2;
  const y0 = -tileH / 2;

  ctx.save();
  ctx.globalAlpha = clamp(ep * 2.2);
  ctx.translate(cx, cy + lerp(32, 0, easeOutCubic(ep)));
  ctx.scale(lerp(0.86, 1.0, sp), lerp(0.86, 1.0, sp));

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.44)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#1B1712';
  roundRectPath(ctx, x0 - 16, y0 - 14, totalW + 32, tileH + (subLabel ? 56 : 28), 12);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,244,210,0.20)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, x0 - 16, y0 - 14, totalW + 32, tileH + (subLabel ? 56 : 28), 12);
  ctx.stroke();

  const p = clamp(flipProgress);
  for (let i = 0; i < n; i++) {
    const chA = (cellsFrom[i] ?? ' ').toUpperCase();
    const chB = (cellsTo[i] ?? chA).toUpperCase();
    const changed = chA !== chB;
    const cellP = changed ? clamp((p - i * 0.04) / (1 - Math.min(0.36, (n - 1) * 0.04))) : 0;
    const tx = x0 + i * (tileW + gap);
    drawSingleFlap(ctx, tx, y0, tileW, tileH, chA, chB, cellP);
  }
  if (subLabel) {
    ctx.font = '700 20px "SpaceMonoBold", monospace';
    ctx.fillStyle = '#F2C14E';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(subLabel.toUpperCase(), 0, y0 + tileH + 22);
  }
  ctx.restore();
}

function drawSingleFlap(ctx, x, y, w, h, chFrom, chTo, p) {
  const half = h / 2;
  const drawHalf = (ch, topSide) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, topSide ? y : y + half + 1.5, w, half - 1.5);
    ctx.clip();
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#332C24');
    g.addColorStop(0.5, '#201B16');
    g.addColorStop(1, '#120F0C');
    ctx.fillStyle = g;
    roundRectPath(ctx, x, y, w, h, 7);
    ctx.fill();
    ctx.font = `700 ${Math.round(h * 0.62)}px "Anton", "OswaldBold", sans-serif`;
    ctx.fillStyle = '#F7EFE0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, x + w / 2, y + h / 2 + 2);
    ctx.restore();
  };
  if (p <= 0 || chFrom === chTo) {
    drawHalf(chFrom, true); drawHalf(chFrom, false);
  } else if (p < 0.5) {
    drawHalf(chTo, true); drawHalf(chFrom, false);
    ctx.save();
    ctx.translate(x + w / 2, y + half);
    ctx.scale(1, Math.max(0.02, Math.cos(p * Math.PI)));
    ctx.translate(-(x + w / 2), -(y + half));
    drawHalf(chFrom, true);
    ctx.restore();
  } else {
    drawHalf(chTo, true); drawHalf(chFrom, false);
    ctx.save();
    ctx.translate(x + w / 2, y + half);
    ctx.scale(1, Math.max(0.02, -Math.cos(p * Math.PI)));
    ctx.translate(-(x + w / 2), -(y + half));
    drawHalf(chTo, false);
    ctx.restore();
  }
  ctx.fillStyle = '#080706';
  ctx.fillRect(x, y + half - 1.5, w, 3);
  ctx.fillStyle = '#B89242';
  ctx.fillRect(x - 2, y + half - 5, 4, 10);
  ctx.fillRect(x + w - 2, y + half - 5, 4, 10);
}

// Hand-drawn organic double-loop crimson marker circle (@meanwhilemayank R09/R10 signature!)
export function drawHandCircle(ctx, cx, cy, rx, ry, drawP = 1, color = '#D92418') {
  const p = clamp(drawP);
  if (p <= 0.02) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 7.5;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  const maxSteps = Math.floor(64 * easeOutCubic(p));
  for (let i = 0; i <= maxSteps; i++) {
    const u = (i / 64) * Math.PI * 2.25 - 0.5;
    const wobble = 1 + Math.sin(u * 3.1) * 0.045 + Math.cos(u * 2.2) * 0.03;
    const px = cx + Math.cos(u) * rx * wobble;
    const py = cy + Math.sin(u) * ry * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

// Live Ink-Drawn Archival Clinical Chart Card (Blood Na+ Crash vs Skull Pressure Spike!)
export function drawLiveChartCard(ctx, cx, cy, w, h, title, yTopLabel, yBotLabel, pointsNorm, drawP = 1, enterP = 1) {
  const ep = clamp(enterP);
  if (ep <= 0.02) return;
  const sp = easeOutBack(ep, 1.3);

  ctx.save();
  ctx.globalAlpha = clamp(ep * 2);
  ctx.translate(cx, cy + lerp(28, 0, easeOutCubic(ep)));
  ctx.scale(lerp(0.88, 1.0, sp), lerp(0.88, 1.0, sp));

  ctx.shadowColor = 'rgba(0,0,0,0.38)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#F5EAD0';
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Millimeter graph grid lines
  const gx0 = -w / 2 + 88, gy0 = -h / 2 + 84;
  const gw = w - 130, gh = h - 140;
  ctx.strokeStyle = 'rgba(180, 145, 95, 0.28)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 6; i++) {
    const x = gx0 + (i / 6) * gw;
    ctx.beginPath(); ctx.moveTo(x, gy0); ctx.lineTo(x, gy0 + gh); ctx.stroke();
  }
  for (let j = 0; j <= 4; j++) {
    const y = gy0 + (j / 4) * gh;
    ctx.beginPath(); ctx.moveTo(gx0, y); ctx.lineTo(gx0 + gw, y); ctx.stroke();
  }

  // Crimson danger zone band at bottom half
  ctx.fillStyle = 'rgba(216, 36, 24, 0.15)';
  ctx.fillRect(gx0, gy0 + gh * 0.52, gw, gh * 0.48);

  // Title & Y-axis labels
  ctx.fillStyle = '#1E160E';
  ctx.font = '700 22px "SpaceMonoBold", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), gx0, -h / 2 + 48);

  ctx.font = '700 18px "SpaceMonoBold", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#186A42';
  ctx.fillText(yTopLabel, gx0 - 12, gy0 + 14);
  ctx.fillStyle = '#C82216';
  ctx.fillText(yBotLabel, gx0 - 12, gy0 + gh - 4);

  // Animated curve stroke
  const cp = easeOutCubic(clamp(drawP));
  const totalSegs = pointsNorm.length - 1;
  const maxFloat = cp * totalSegs;
  ctx.strokeStyle = '#C82216';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let tipX = gx0, tipY = gy0;
  for (let i = 0; i <= Math.floor(maxFloat); i++) {
    const [ux, uy] = pointsNorm[i];
    const px = gx0 + ux * gw;
    const py = gy0 + (1 - uy) * gh;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
    tipX = px; tipY = py;
  }
  const idx = Math.floor(maxFloat);
  if (idx < totalSegs) {
    const frac = maxFloat - idx;
    const [xA, yA] = pointsNorm[idx];
    const [xB, yB] = pointsNorm[idx + 1];
    tipX = gx0 + lerp(xA, xB, frac) * gw;
    tipY = gy0 + (1 - lerp(yA, yB, frac)) * gh;
    ctx.lineTo(tipX, tipY);
  }
  ctx.stroke();

  // Pulsing live marker dot at curve tip
  ctx.fillStyle = '#C82216';
  ctx.beginPath();
  ctx.arc(tipX, tipY, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawTornNote(ctx, cx, cy, w, h, rotDeg, textLines, opts = {}) {
  const rnd = mulberry32((opts.seed || 771) + Math.round(w));
  const pts = [];
  const hw = w / 2, hh = h / 2;
  for (let x = -hw; x <= hw; x += 14) pts.push([x, -hh + (rnd() - 0.5) * 6]);
  for (let y = -hh; y <= hh; y += 16) pts.push([hw + (rnd() - 0.5) * 4, y]);
  for (let x = hw; x >= -hw; x -= 14) pts.push([x, hh + (rnd() - 0.5) * 7]);
  for (let y = hh; y >= -hh; y -= 16) pts.push([-hw + (rnd() - 0.5) * 4, y]);

  const ep = clamp(opts.enterP ?? 1);
  const sp = easeOutBack(ep, 1.35);

  ctx.save();
  ctx.globalAlpha = clamp(ep * 2);
  ctx.translate(cx, cy + lerp(26, 0, easeOutCubic(ep)));
  ctx.rotate((rotDeg || 0) * Math.PI / 180);
  ctx.scale(lerp(0.85, 1.0, sp), lerp(0.85, 1.0, sp));

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.38)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 12;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.fillStyle = opts.bg || '#F5E7B8';
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(245,232,190,0.55)';
  ctx.fillRect(-38, -hh - 10, 76, 22);

  ctx.font = opts.font || '700 38px "CaveatBold", "OswaldBold", sans-serif';
  ctx.fillStyle = opts.ink || '#1E1710';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = opts.lineH || 46;
  const startY = -(textLines.length - 1) * lineH * 0.5;
  textLines.forEach((ln, idx) => ctx.fillText(ln, 0, startY + idx * lineH));

  if (opts.strikeP > 0.01) {
    const s = clamp(opts.strikeP);
    ctx.strokeStyle = '#C82216';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-hw * 0.78, -hh * 0.25);
    ctx.lineTo(lerp(-hw * 0.78, hw * 0.78, s), lerp(-hh * 0.25, hh * 0.25, s));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRubberStamp(ctx, cx, cy, label, rotDeg = -6, progress = 1, color = '#D12618') {
  if (progress <= 0) return;
  const p = easeOutExpo(progress);
  const sc = lerp(1.55, 1.0, p);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotDeg * Math.PI / 180);
  ctx.scale(sc, sc);
  ctx.globalAlpha = clamp(p * 1.4, 0, 0.95);

  let fontSize = 56;
  ctx.font = `700 ${fontSize}px "Anton", "OswaldBold", sans-serif`;
  let tw = ctx.measureText(label).width;
  if (tw + 64 > 800) {
    fontSize = Math.max(28, Math.floor(fontSize * 736 / Math.max(1, tw)));
    ctx.font = `700 ${fontSize}px "Anton", "OswaldBold", sans-serif`;
    tw = ctx.measureText(label).width;
  }
  const bw = tw + 60;
  const bh = Math.round(fontSize * 1.52);

  ctx.fillStyle = 'rgba(18,12,6,0.18)';
  roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 8);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, 8);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  roundRectPath(ctx, -bw / 2 + 10, -bh / 2 + 10, bw - 20, bh - 20, 4);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 2);
  ctx.restore();
}

export function drawJournalCard(ctx, cx, cy, w, h, rotDeg, masthead, headline, bodyLines, hlIdx = 1, hlProgress = 1, enterP = 1) {
  const ep = clamp(enterP);
  if (ep <= 0.02) return;
  const sp = easeOutBack(ep, 1.3);

  ctx.save();
  ctx.globalAlpha = clamp(ep * 2);
  ctx.translate(cx, cy + lerp(28, 0, easeOutCubic(ep)));
  ctx.rotate((rotDeg || 0) * Math.PI / 180);
  ctx.scale(lerp(0.88, 1.0, sp), lerp(0.88, 1.0, sp));

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.38)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#F2E7CC';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.restore();

  const pad = 34;
  const topY = -h / 2 + 34;
  ctx.fillStyle = '#241D14';
  ctx.font = '700 18px "SpaceMonoBold", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(masthead.toUpperCase(), -w / 2 + pad, topY);
  ctx.strokeStyle = '#241D14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + pad, topY + 14);
  ctx.lineTo(w / 2 - pad, topY + 14);
  ctx.stroke();

  ctx.font = '700 31px "LibreBaskerville", Georgia, serif';
  ctx.fillStyle = '#18130E';
  ctx.fillText(headline, -w / 2 + pad, topY + 54);

  const bodyStartY = topY + 108;
  const lineSpacing = 38;
  if (hlIdx >= 0 && hlIdx < bodyLines.length && hlProgress > 0.01) {
    const hy = bodyStartY + hlIdx * lineSpacing;
    ctx.font = '400 22px "LibreBaskerville", Georgia, serif';
    const mw = ctx.measureText(bodyLines[hlIdx]).width + 18;
    const sweepW = mw * easeOutCubic(hlProgress);
    ctx.fillStyle = 'rgba(255, 214, 48, 0.82)';
    ctx.fillRect(-w / 2 + pad - 6, hy - 14, sweepW, 30);
  }
  ctx.font = '400 22px "LibreBaskerville", Georgia, serif';
  ctx.fillStyle = '#261F17';
  bodyLines.forEach((ln, i) => ctx.fillText(ln, -w / 2 + pad, bodyStartY + i * lineSpacing));
  ctx.restore();
}

export function drawChecklistBoard(ctx, cx, cy, w, h, title, items, p = 0) {
  const ep = clamp(p * 4);
  const sp = easeOutBack(ep, 1.25);

  ctx.save();
  ctx.translate(cx, cy + lerp(28, 0, easeOutCubic(ep)));
  ctx.scale(lerp(0.88, 1.0, sp), lerp(0.88, 1.0, sp));

  ctx.shadowColor = 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#F4EAD0';
  ctx.strokeStyle = '#3A2814';
  ctx.lineWidth = 4;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 12);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  ctx.fillStyle = '#B88C34';
  roundRectPath(ctx, -95, -h / 2 - 22, 190, 44, 10);
  ctx.fill();
  ctx.strokeStyle = '#4A320C';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '700 22px "SpaceMonoBold", monospace';
  ctx.fillStyle = '#755B38';
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), -w / 2 + 38, -h / 2 + 54);

  const startY = -h / 2 + 124;
  const rowH = (h - 150) / Math.max(1, items.length);
  items.forEach((it, idx) => {
    const ry = startY + idx * rowH;
    const bx = -w / 2 + 44;
    const ap = clamp((p - (it.appearAt ?? 0)) / 0.16);
    if (ap <= 0) return;
    ctx.save();
    ctx.globalAlpha = ap;
    ctx.strokeStyle = '#221A12';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(bx, ry - 20, 38, 38);
    if (it.checked) {
      ctx.strokeStyle = '#1B7346';
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx + 7, ry - 1); ctx.lineTo(bx + 16, ry + 11); ctx.lineTo(bx + 34, ry - 13);
      ctx.stroke();
    }
    ctx.font = '700 36px "OswaldBold", "Anton", sans-serif';
    ctx.fillStyle = '#1C1610';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(it.text.toUpperCase(), bx + 60, ry);
    ctx.restore();
  });
  ctx.restore();
}

export function drawSharePhoneCard(ctx, cx, cy, p = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  const sc = lerp(0.88, 1.0, easeOutBack(clamp(p * 2.2), 1.35));
  ctx.scale(sc, sc);

  ctx.shadowColor = 'rgba(0,0,0,0.48)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#13171D';
  ctx.strokeStyle = '#4B5563';
  ctx.lineWidth = 5;
  roundRectPath(ctx, -230, -340, 460, 680, 42);
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#1D242C';
  roundRectPath(ctx, -208, -304, 416, 608, 26);
  ctx.fill();

  ctx.fillStyle = '#0D1014';
  roundRectPath(ctx, -54, -326, 108, 14, 7);
  ctx.fill();

  ctx.font = '700 22px "SpaceMonoBold", monospace';
  ctx.fillStyle = '#52D1F0';
  ctx.textAlign = 'center';
  ctx.fillText('GYM & RUNNERS SQUAD', 0, -252);

  ctx.fillStyle = '#165E46';
  roundRectPath(ctx, -172, -198, 344, 154, 18);
  ctx.fill();
  ctx.font = '700 29px "OswaldBold", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText('EK SAATH 3 LITER PAANI', -148, -148);
  ctx.fillText('KABHI MAT PEENA!', -148, -110);
  ctx.font = '700 19px "SpaceMonoBold", monospace';
  ctx.fillStyle = '#A7F3D0';
  ctx.fillText('MAX 800 ML/HR + ELECTROLYTES', -148, -70);

  const replies = [
    { who: 'ROHAN (MARATHON)', msg: 'Bhai main toh 2L gatak jaata tha!' },
    { who: 'PRIYA', msg: 'Aaj se gym bottle mein ORS zaroor!' }
  ];
  replies.forEach((r, idx) => {
    const ry = -12 + idx * 104;
    ctx.fillStyle = '#26303B';
    roundRectPath(ctx, -172, ry, 344, 84, 14);
    ctx.fill();
    ctx.font = '700 15px "SpaceMonoBold", monospace';
    ctx.fillStyle = '#F7C137';
    ctx.fillText(r.who, -148, ry + 26);
    ctx.font = '400 19px "LibreBaskerville", serif';
    ctx.fillStyle = '#F4EFE4';
    ctx.fillText(r.msg, -148, ry + 58);
  });

  ctx.fillStyle = '#10151A';
  ctx.strokeStyle = '#52D1F0';
  ctx.lineWidth = 3;
  roundRectPath(ctx, -172, 206, 344, 68, 34);
  ctx.fill(); ctx.stroke();
  const fullTxt = 'Sharing with family now...';
  const shown = fullTxt.slice(0, Math.floor(clamp((p - 0.08) * 1.45) * fullTxt.length));
  ctx.font = '700 20px "SpaceMonoBold", monospace';
  ctx.fillStyle = '#F7C137';
  ctx.fillText(shown + (Math.floor(p * 14) % 2 === 0 ? '|' : ''), -144, 246);
  ctx.restore();
}
