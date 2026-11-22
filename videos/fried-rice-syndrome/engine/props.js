// Lean Era-2 Physical Archival 2D Props: Mechanical Flip-Boards, Sticky Notes, Clippings, Checklists & Stamps (v13.0)
import { clamp, lerp, easeOutCubic, easeOutExpo, mulberry32 } from './dossier.js';

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

export function drawSplitFlapBoard(ctx, cx, cy, cellsFrom, cellsTo, flipProgress, subLabel = '', tileW = 76, tileH = 108, gap = 9) {
  const n = Math.max(cellsFrom.length, cellsTo.length);
  const totalW = n * tileW + (n - 1) * gap;
  const x0 = cx - totalW / 2;
  const y0 = cy - tileH / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#1B1712';
  roundRectPath(ctx, x0 - 16, y0 - 14, totalW + 32, tileH + (subLabel ? 56 : 28), 12);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,244,210,0.18)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, x0 - 16, y0 - 14, totalW + 32, tileH + (subLabel ? 56 : 28), 12);
  ctx.stroke();

  const p = clamp(flipProgress);
  for (let i = 0; i < n; i++) {
    const chA = (cellsFrom[i] ?? ' ').toUpperCase();
    const chB = (cellsTo[i] ?? chA).toUpperCase();
    const changed = chA !== chB;
    const cellP = changed ? clamp((p - i * 0.05) / (1 - Math.min(0.4, (n - 1) * 0.05))) : 0;
    const tx = x0 + i * (tileW + gap);
    drawSingleFlap(ctx, tx, y0, tileW, tileH, chA, chB, cellP);
  }
  if (subLabel) {
    ctx.font = '700 20px "SpaceMonoBold", monospace';
    ctx.fillStyle = '#F2C14E';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(subLabel.toUpperCase(), cx, y0 + tileH + 22);
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
    ctx.font = `700 ${Math.round(h * 0.66)}px "Anton", "OswaldBold", sans-serif`;
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

export function drawTornNote(ctx, cx, cy, w, h, rotDeg, textLines, opts = {}) {
  const rnd = mulberry32((opts.seed || 771) + Math.round(w));
  const pts = [];
  const hw = w / 2, hh = h / 2;
  for (let x = -hw; x <= hw; x += 14) pts.push([x, -hh + (rnd() - 0.5) * 6]);
  for (let y = -hh; y <= hh; y += 16) pts.push([hw + (rnd() - 0.5) * 4, y]);
  for (let x = hw; x >= -hw; x -= 14) pts.push([x, hh + (rnd() - 0.5) * 7]);
  for (let y = hh; y >= -hh; y -= 16) pts.push([-hw + (rnd() - 0.5) * 4, y]);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotDeg || 0) * Math.PI / 180);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.36)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 12;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.fillStyle = opts.bg || '#F5E7B8';
  ctx.fill();
  ctx.restore();

  // Tape strip on top
  ctx.fillStyle = 'rgba(245,232,190,0.52)';
  ctx.fillRect(-38, -hh - 10, 76, 22);

  ctx.font = opts.font || '700 38px "CaveatBold", "OswaldBold", sans-serif';
  ctx.fillStyle = opts.ink || '#1E1710';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = opts.lineH || 46;
  const startY = -(textLines.length - 1) * lineH * 0.5;
  textLines.forEach((ln, idx) => ctx.fillText(ln, 0, startY + idx * lineH));

  if (opts.strikeP > 0.01) {
    const sp = clamp(opts.strikeP);
    ctx.strokeStyle = '#C82216';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-hw * 0.78, -hh * 0.25);
    ctx.lineTo(lerp(-hw * 0.78, hw * 0.78, sp), lerp(-hh * 0.25, hh * 0.25, sp));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRubberStamp(ctx, cx, cy, label, rotDeg = -6, progress = 1, color = '#D12618') {
  if (progress <= 0) return;
  const p = easeOutExpo(progress);
  const sc = lerp(1.5, 1.0, p);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotDeg * Math.PI / 180);
  ctx.scale(sc, sc);
  ctx.globalAlpha = clamp(p * 1.4, 0, 0.94);

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

  ctx.fillStyle = 'rgba(18,12,6,0.16)';
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

export function drawJournalCard(ctx, cx, cy, w, h, rotDeg, masthead, headline, bodyLines, hlIdx = 1, hlProgress = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotDeg || 0) * Math.PI / 180);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.36)';
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

  ctx.font = '700 32px "LibreBaskerville", Georgia, serif';
  ctx.fillStyle = '#18130E';
  ctx.fillText(headline, -w / 2 + pad, topY + 54);

  const bodyStartY = topY + 108;
  const lineSpacing = 38;
  if (hlIdx >= 0 && hlIdx < bodyLines.length && hlProgress > 0.01) {
    const hy = bodyStartY + hlIdx * lineSpacing;
    ctx.font = '400 23px "LibreBaskerville", Georgia, serif';
    const mw = ctx.measureText(bodyLines[hlIdx]).width + 18;
    const sweepW = mw * easeOutCubic(hlProgress);
    ctx.fillStyle = 'rgba(255, 214, 48, 0.80)';
    ctx.fillRect(-w / 2 + pad - 6, hy - 14, sweepW, 30);
  }
  ctx.font = '400 23px "LibreBaskerville", Georgia, serif';
  ctx.fillStyle = '#261F17';
  bodyLines.forEach((ln, i) => ctx.fillText(ln, -w / 2 + pad, bodyStartY + i * lineSpacing));
  ctx.restore();
}

export function drawChecklistBoard(ctx, cx, cy, w, h, title, items, p = 0) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.shadowColor = 'rgba(0,0,0,0.40)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#F4EAD0';
  ctx.strokeStyle = '#3A2814';
  ctx.lineWidth = 4;
  roundRectPath(ctx, -w / 2, -h / 2, w, h, 12);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  // Brass clipboard clip at top center
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
    const ap = clamp((p - (it.appearAt ?? 0)) / 0.18);
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
    ctx.font = '700 38px "OswaldBold", "Anton", sans-serif';
    ctx.fillStyle = '#1C1610';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(it.text.toUpperCase(), bx + 60, ry);
    ctx.restore();
  });
  ctx.restore();
}

export function drawFamilyShareCard(ctx, cx, cy, p = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  const sc = lerp(0.92, 1.0, easeOutExpo(clamp(p * 2)));
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
  ctx.fillStyle = '#4AE3B5';
  ctx.textAlign = 'center';
  ctx.fillText('FAMILY WHATSAPP GROUP', 0, -252);

  // Outgoing green message bubble
  ctx.fillStyle = '#165E46';
  roundRectPath(ctx, -172, -198, 344, 154, 18);
  ctx.fill();
  ctx.font = '700 30px "OswaldBold", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText('RAAT KA CHAWAL BAHAR', -148, -148);
  ctx.fillText('MAT CHHODNA!', -148, -110);
  ctx.font = '700 20px "SpaceMonoBold", monospace';
  ctx.fillStyle = '#A7F3D0';
  ctx.fillText('FRIDGE WITHIN 1-2 HOURS', -148, -70);

  // Incoming replies
  const replies = [
    { who: 'MAA', msg: 'Aaj se turant fridge mein!' },
    { who: 'BHAI', msg: '121°C par bhi toxin nahi marta?!' }
  ];
  replies.forEach((r, idx) => {
    const ry = -12 + idx * 104;
    ctx.fillStyle = '#26303B';
    roundRectPath(ctx, -172, ry, 344, 84, 14);
    ctx.fill();
    ctx.font = '700 16px "SpaceMonoBold", monospace';
    ctx.fillStyle = '#F7C137';
    ctx.fillText(r.who, -148, ry + 26);
    ctx.font = '400 20px "LibreBaskerville", serif';
    ctx.fillStyle = '#F4EFE4';
    ctx.fillText(r.msg, -148, ry + 58);
  });

  // Live typing pill
  ctx.fillStyle = '#10151A';
  ctx.strokeStyle = '#4AE3B5';
  ctx.lineWidth = 3;
  roundRectPath(ctx, -172, 206, 344, 68, 34);
  ctx.fill(); ctx.stroke();
  const fullTxt = 'Sending to everyone now...';
  const shown = fullTxt.slice(0, Math.floor(clamp((p - 0.1) * 1.4) * fullTxt.length));
  ctx.font = '700 20px "SpaceMonoBold", monospace';
  ctx.fillStyle = '#F7C137';
  ctx.fillText(shown + (Math.floor(p * 14) % 2 === 0 ? '|' : ''), -144, 246);
  ctx.restore();
}
