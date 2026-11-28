// engine/typography.js (v3.0 — Zero-Glitch Offscreen Optical Word Buffer + Constant-Slot Drum Odometer)

import { clamp, easeOutCubic, easeOutQuart } from './camera_v3.js';

let wordScratch = null;
function getWordScratch() {
  if (!wordScratch) {
    wordScratch = document.createElement('canvas');
    wordScratch.width = 680;
    wordScratch.height = 190;
  }
  return wordScratch;
}

let odoScratch = null;
function getOdoScratch() {
  if (!odoScratch) {
    odoScratch = document.createElement('canvas');
    odoScratch.width = 1040;
    odoScratch.height = 310;
  }
  return odoScratch;
}

export function parseMarkupTokens(markup) {
  const tokens = [];
  const regex = /\*([^*]+)\*|(\S+)/g;
  let m;
  while ((m = regex.exec(markup)) !== null) {
    if (m[1] !== undefined) {
      for (const sw of m[1].trim().split(/\s+/)) {
        if (sw) tokens.push({ text: sw, italic: true });
      }
    } else if (m[2] !== undefined) {
      tokens.push({ text: m[2], italic: false });
    }
  }
  return tokens;
}

export function drawOpticalMarkup(ctx, markup, opts = {}) {
  const {
    x = 540,
    y = 1400,
    maxWidth = 920,
    fontSize = 52,
    lineHeight = 1.32,
    align = 'center',
    progress = 1.0,
    alpha = 1.0,
    color = '#FFFFFF',
    italicColor = '#FDE68A'
  } = opts;

  if (alpha <= 0.005 || !markup) return { bottomY: y };
  const tokens = parseMarkupTokens(markup);
  if (!tokens.length) return { bottomY: y };

  const spaceW = fontSize * 0.28;
  const serifSize = Math.round(fontSize * 1.15);

  ctx.save();
  ctx.filter = 'none';
  const measured = tokens.map((tok, idx) => {
    ctx.font = tok.italic
      ? `italic 400 ${serifSize}px InstrumentSerif`
      : `400 ${fontSize}px PlusJakarta`;
    return { ...tok, w: ctx.measureText(tok.text).width, idx };
  });

  const lines = [];
  let curLine = [];
  let curW = 0;
  for (const item of measured) {
    const addW = curLine.length === 0 ? item.w : spaceW + item.w;
    if (curLine.length > 0 && curW + addW > maxWidth) {
      lines.push({ items: curLine, width: curW });
      curLine = [item];
      curW = item.w;
    } else {
      curLine.push(item);
      curW += addW;
    }
  }
  if (curLine.length > 0) lines.push({ items: curLine, width: curW });

  const totalTokens = measured.length;
  const lineStep = fontSize * lineHeight;
  const ws = getWordScratch();
  const wctx = ws.getContext('2d');
  const padX = 48, padBaseY = 122;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const baselineY = y + li * lineStep;
    let cursorX = align === 'center'
      ? x - line.width / 2
      : align === 'right'
        ? x - line.width
        : x;

    for (let ti = 0; ti < line.items.length; ti++) {
      const item = line.items[ti];
      const startP = (item.idx / Math.max(1, totalTokens)) * 0.72;
      const wp = easeOutCubic(clamp((progress - startP) / 0.22, 0, 1));
      const finalAlpha = wp * alpha;

      if (finalAlpha > 0.008) {
        const fontSpec = item.italic
          ? `italic 400 ${serifSize}px InstrumentSerif`
          : `400 ${fontSize}px PlusJakarta`;
        const fillCol = item.italic ? italicColor : color;

        if (wp >= 0.985) {
          ctx.globalAlpha = finalAlpha;
          ctx.font = fontSpec;
          ctx.fillStyle = fillCol;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(item.text, cursorX, baselineY);
        } else {
          const blurPx = (1 - wp) * 9.5;
          const yOff = (1 - wp) * 7.5;
          const drawW = Math.min(ws.width, Math.ceil(item.w + padX * 2));

          wctx.clearRect(0, 0, drawW, ws.height);
          wctx.save();
          wctx.filter = blurPx > 0.35 ? `blur(${blurPx.toFixed(1)}px)` : 'none';
          wctx.font = fontSpec;
          wctx.fillStyle = fillCol;
          wctx.textBaseline = 'alphabetic';
          wctx.fillText(item.text, padX, padBaseY);
          wctx.restore();

          ctx.globalAlpha = finalAlpha;
          ctx.drawImage(ws, 0, 0, drawW, ws.height, cursorX - padX, baselineY + yOff - padBaseY, drawW, ws.height);
        }
      }
      cursorX += item.w + spaceW;
    }
  }

  ctx.restore();
  return { bottomY: y + lines.length * lineStep };
}

export function drawTrackedCaps(ctx, text, x, y, opts = {}) {
  const {
    fontSize = 20,
    tracking = 3.2,
    color = 'rgba(255, 255, 255, 0.88)',
    align = 'left',
    weight = 600,
    alpha = 1
  } = opts;

  if (alpha <= 0.005) return 0;
  const upper = String(text).toUpperCase();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${fontSize}px PlusJakarta`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';

  const chars = [...upper];
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + Math.max(0, chars.length - 1) * tracking;

  let cx = align === 'center' ? x - totalW / 2 : align === 'right' ? x - totalW : x;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cx, y);
    cx += widths[i] + tracking;
  }
  ctx.restore();
  return totalW;
}

function formatGrouped(intStr, useCommas, indianGrouping) {
  if (!useCommas || intStr.length <= 3) return intStr;
  if (indianGrouping) {
    const last3 = intStr.slice(-3);
    const rem = intStr.slice(0, -3);
    return rem.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function drawOdometer(ctx, opts = {}) {
  const {
    value = 0,
    startValue = 0,
    progress = 1,
    prefix = '',
    suffix = '',
    decimals = 0,
    useCommas = true,
    indianGrouping = false,
    x = 540,
    y = 500,
    fontSize = 140,
    weight = 300,
    color = '#FFFFFF',
    prefixSizeRatio = 0.56,
    suffixSizeRatio = 0.54,
    suffixColor = null,
    suffixItalicSerif = false,
    align = 'center',
    alpha = 1
  } = opts;

  if (alpha <= 0.005) return;

  const eased = easeOutQuart(clamp(progress, 0, 1));
  const curVal = startValue + (value - startValue) * eased;

  const targetFixed = Math.abs(value).toFixed(decimals);
  const [targetInt, targetDec] = targetFixed.split('.');
  const targetGrouped = formatGrouped(targetInt, useCommas, indianGrouping);
  const templateStr = (value < 0 ? '-' : '') + targetGrouped + (decimals > 0 ? '.' + targetDec : '');

  ctx.save();
  ctx.filter = 'none';
  const digitFont = `${weight} ${fontSize}px PlusJakarta`;
  const prefixFont = `400 ${Math.round(fontSize * prefixSizeRatio)}px PlusJakarta`;
  const suffixFont = suffixItalicSerif
    ? `italic 400 ${Math.round(fontSize * suffixSizeRatio)}px InstrumentSerif`
    : `${weight} ${Math.round(fontSize * suffixSizeRatio)}px PlusJakarta`;

  ctx.font = digitFont;
  const slotW = Math.ceil(ctx.measureText('8').width * 1.02);
  const commaW = Math.ceil(ctx.measureText(',').width * 1.05);
  const dotW = Math.ceil(ctx.measureText('.').width * 1.05);

  ctx.font = prefixFont;
  const prefW = prefix ? ctx.measureText(prefix).width + fontSize * 0.08 : 0;

  ctx.font = suffixFont;
  const suffW = suffix ? ctx.measureText(suffix).width + fontSize * 0.12 : 0;

  let drumW = 0;
  for (const ch of templateStr) {
    if (ch >= '0' && ch <= '9') drumW += slotW;
    else if (ch === ',') drumW += commaW;
    else if (ch === '.') drumW += dotW;
    else drumW += ctx.measureText(ch).width;
  }

  const totalW = prefW + drumW + suffW;
  const startX = align === 'center' ? x - totalW / 2 : align === 'right' ? x - totalW : x;

  const os = getOdoScratch();
  const octx = os.getContext('2d');
  const drumH = Math.min(os.height, Math.round(fontSize * 1.48));
  const drumDrawW = Math.min(os.width, Math.ceil(drumW + 24));
  const baseLineInDrum = Math.round(drumH * 0.74);
  const stepH = Math.round(fontSize * 1.28);

  octx.clearRect(0, 0, drumDrawW, drumH);
  octx.save();
  octx.font = digitFont;
  octx.fillStyle = color;
  octx.textBaseline = 'alphabetic';

  const totalDigits = [...templateStr].filter(c => c >= '0' && c <= '9').length;
  let seenDigits = 0;
  let dx = 12;
  const absCur = Math.abs(curVal);

  for (let i = 0; i < templateStr.length; i++) {
    const ch = templateStr[i];
    if (ch >= '0' && ch <= '9') {
      const placeIdxFromRight = totalDigits - 1 - seenDigits;
      const placeScale = Math.pow(10, placeIdxFromRight - decimals);
      const placeActive = (placeIdxFromRight <= decimals) || (absCur >= placeScale * 0.85) || (eased > 0.88);
      if (placeActive) {
        const continuous = (absCur + (eased >= 0.997 ? placeScale * 1e-5 : 0)) / placeScale;
        const frac = eased >= 0.997 ? 0 : (continuous % 1);
        const d0 = Math.floor(continuous) % 10;
        const d1 = (d0 + 1) % 10;

        const s0 = String(d0);
        octx.fillText(s0, dx + (slotW - octx.measureText(s0).width) * 0.5, baseLineInDrum - frac * stepH);
        if (frac > 0.005) {
          const s1 = String(d1);
          octx.fillText(s1, dx + (slotW - octx.measureText(s1).width) * 0.5, baseLineInDrum + (1 - frac) * stepH);
        }
      }
      dx += slotW;
      seenDigits++;
    } else if (ch === ',') {
      const prevPlaceIdx = totalDigits - seenDigits;
      const prevScale = Math.pow(10, prevPlaceIdx - decimals);
      if (absCur >= prevScale * 0.85 || eased > 0.88) {
        octx.fillText(',', dx, baseLineInDrum);
      }
      dx += commaW;
    } else if (ch === '.') {
      octx.fillText('.', dx, baseLineInDrum);
      dx += dotW;
    } else {
      octx.fillText(ch, dx, baseLineInDrum);
      dx += octx.measureText(ch).width;
    }
  }

  octx.globalCompositeOperation = 'destination-in';
  const maskG = octx.createLinearGradient(0, 0, 0, drumH);
  maskG.addColorStop(0.00, 'rgba(0,0,0,0)');
  maskG.addColorStop(0.15, 'rgba(0,0,0,1)');
  maskG.addColorStop(0.86, 'rgba(0,0,0,1)');
  maskG.addColorStop(1.00, 'rgba(0,0,0,0)');
  octx.fillStyle = maskG;
  octx.fillRect(0, 0, drumDrawW, drumH);
  octx.restore();

  ctx.globalAlpha = alpha;
  ctx.textBaseline = 'alphabetic';
  let cx = startX;

  if (prefix) {
    ctx.font = prefixFont;
    ctx.fillStyle = color;
    ctx.fillText(prefix, cx, y - fontSize * 0.06);
    cx += prefW;
  }

  ctx.drawImage(os, 0, 0, drumDrawW, drumH, cx - 12, y - baseLineInDrum, drumDrawW, drumH);
  cx += drumW;

  if (suffix) {
    cx += fontSize * 0.12;
    ctx.font = suffixFont;
    ctx.fillStyle = suffixColor || color;
    ctx.fillText(suffix, cx, y - (suffixItalicSerif ? 0 : fontSize * 0.14));
  }

  ctx.restore();
}
