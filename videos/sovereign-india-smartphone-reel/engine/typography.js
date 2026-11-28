// engine/typography.js (v2.0 — ZERO-GLITCH EDITION)
// Offscreen-buffered Gaussian word reveals + Constant-Slot Feathered Drum Odometers

import { clamp, easeOutCubic, easeOutQuart } from './math_color.js';

// Reusable padded offscreen buffer so Gaussian word blur NEVER clips glyph edges or flickers main canvas
let wordScratch = null;
function getWordScratch() {
  if (wordScratch) return wordScratch;
  wordScratch = document.createElement('canvas');
  wordScratch.width = 640;
  wordScratch.height = 180;
  return wordScratch;
}

// Reusable feathered drum buffer for constant-slot odometer
let odoScratch = null;
function getOdoScratch() {
  if (odoScratch) return odoScratch;
  odoScratch = document.createElement('canvas');
  odoScratch.width = 1040;
  odoScratch.height = 300;
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

// Zero-Glitch Word-by-Word Optical Blur Reveal (1:1 synced to voiceover cadence!)
export function drawOpticalMarkup(ctx, markup, opts = {}) {
  const {
    x = 540,
    y = 320,
    maxWidth = 920,
    fontSize = 52,
    lineHeight = 1.32,
    align = 'center',
    progress = 1.0,   // [0..1] across spoken phrase
    alpha = 1.0,      // overall block opacity for silky crossfades
    color = '#FFFFFF',
    italicColor = '#FDE68A'
  } = opts;

  if (alpha <= 0.005 || !markup) return { bottomY: y };

  const tokens = parseMarkupTokens(markup);
  if (!tokens.length) return { bottomY: y };

  const spaceW = fontSize * 0.28;
  const serifSize = Math.round(fontSize * 1.15);

  // Measure every word once with zero filter state
  ctx.save();
  ctx.filter = 'none';
  const measured = tokens.map((tok, idx) => {
    ctx.font = tok.italic
      ? `italic 400 ${serifSize}px InstrumentSerif`
      : `400 ${fontSize}px PlusJakarta`;
    return { ...tok, w: ctx.measureText(tok.text).width, idx };
  });

  // Wrap cleanly into balanced lines
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
  const padX = 48, padBaseY = 116;

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
      // Deterministic monotonic stagger across [0 .. 0.76] of phrase progress
      const startP = (item.idx / Math.max(1, totalTokens)) * 0.72;
      const wp = easeOutCubic(clamp((progress - startP) / 0.22, 0, 1));
      const finalAlpha = wp * alpha;

      if (finalAlpha > 0.008) {
        const fontSpec = item.italic
          ? `italic 400 ${serifSize}px InstrumentSerif`
          : `400 ${fontSize}px PlusJakarta`;
        const fillCol = item.italic ? italicColor : color;

        if (wp >= 0.985) {
          // Crisp settled state — direct zero-filter rasterization
          ctx.globalAlpha = finalAlpha;
          ctx.font = fontSpec;
          ctx.fillStyle = fillCol;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(item.text, cursorX, baselineY);
        } else {
          // Smooth optical blur-in inside padded offscreen buffer (zero clipping, zero flicker!)
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

function formatIndianOrIntl(intStr, useCommas, indianGrouping) {
  if (!useCommas || intStr.length <= 3) return intStr;
  if (indianGrouping) {
    const last3 = intStr.slice(-3);
    const rem = intStr.slice(0, -3);
    return rem.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ZERO-GLITCH Constant-Slot Feathered Drum Odometer (v2.0)
// Guarantees: ZERO horizontal shaking on '1' vs '8', ZERO overlapping digits, silky vertical drum feathering!
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

  // Format TARGET string so total layout structure & comma positions NEVER jump mid-spin!
  const targetFixed = Math.abs(value).toFixed(decimals);
  const [targetInt, targetDec] = targetFixed.split('.');
  const targetGroupedInt = formatIndianOrIntl(targetInt, useCommas, indianGrouping);
  const templateStr = (value < 0 ? '-' : '') + targetGroupedInt + (decimals > 0 ? '.' + targetDec : '');

  ctx.save();
  ctx.filter = 'none';
  const digitFont = `${weight} ${fontSize}px PlusJakarta`;
  const prefixFont = `400 ${Math.round(fontSize * prefixSizeRatio)}px PlusJakarta`;
  const suffixFont = suffixItalicSerif
    ? `italic 400 ${Math.round(fontSize * suffixSizeRatio)}px InstrumentSerif`
    : `${weight} ${Math.round(fontSize * suffixSizeRatio)}px PlusJakarta`;

  // Constant tabular slot width across ALL digits 0-9 -> ZERO horizontal jitter!
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

  // Render rolling digit drum onto offscreen canvas with soft top/bottom feather mask
  const os = getOdoScratch();
  const octx = os.getContext('2d');
  const drumH = Math.min(os.height, Math.round(fontSize * 1.48));
  const drumDrawW = Math.min(os.width, Math.ceil(drumW + 24));
  const baseLineInDrum = Math.round(drumH * 0.74);
  const stepH = Math.round(fontSize * 1.28); // > 1.25x fontSize -> baseD and nextD NEVER overlap!

  octx.clearRect(0, 0, drumDrawW, drumH);
  octx.save();
  octx.font = digitFont;
  octx.fillStyle = color;
  octx.textBaseline = 'alphabetic';

  const totalDigits = [...templateStr].filter(c => c >= '0' && c <= '9').length;
  let seenDigits = 0;
  let dx = 12;

  // Determine highest active digit place so leading unreached places stay subtly dimmed or blank cleanly
  const absCur = Math.abs(curVal);

  for (let i = 0; i < templateStr.length; i++) {
    const ch = templateStr[i];
    if (ch >= '0' && ch <= '9') {
      const placeIdxFromRight = totalDigits - 1 - seenDigits;
      const placeScale = Math.pow(10, placeIdxFromRight - decimals);

      // Show leading place once curVal reaches 10% of its placeScale (or always for ones place)
      const placeActive = (placeIdxFromRight <= decimals) || (absCur >= placeScale * 0.85) || (eased > 0.88);
      if (placeActive) {
        const continuous = absCur / placeScale;
        const frac = eased >= 0.997 ? 0 : (continuous % 1);
        const d0 = Math.floor(continuous) % 10;
        const d1 = (d0 + 1) % 10;

        const s0 = String(d0);
        const off0 = (slotW - octx.measureText(s0).width) * 0.5;
        octx.fillText(s0, dx + off0, baseLineInDrum - frac * stepH);

        if (frac > 0.005) {
          const s1 = String(d1);
          const off1 = (slotW - octx.measureText(s1).width) * 0.5;
          octx.fillText(s1, dx + off1, baseLineInDrum + (1 - frac) * stepH);
        }
      }
      dx += slotW;
      seenDigits++;
    } else if (ch === ',') {
      // Show comma only once the digit immediately to its left is active
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

  // Apply silky top & bottom optical drum alpha feathering
  octx.globalCompositeOperation = 'destination-in';
  const maskG = octx.createLinearGradient(0, 0, 0, drumH);
  maskG.addColorStop(0.00, 'rgba(0,0,0,0)');
  maskG.addColorStop(0.15, 'rgba(0,0,0,1)');
  maskG.addColorStop(0.86, 'rgba(0,0,0,1)');
  maskG.addColorStop(1.00, 'rgba(0,0,0,0)');
  octx.fillStyle = maskG;
  octx.fillRect(0, 0, drumDrawW, drumH);
  octx.restore();

  // Draw Prefix + Drum + Suffix onto main canvas
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
