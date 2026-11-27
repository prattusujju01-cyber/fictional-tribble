// engine/typography.js
// Optical Gaussian word-blur reveals (Instrument Serif Italic + Plus Jakarta Sans) & Slot-Machine Odometers

import { clamp, easeOutCubic, easeOutQuart } from './math_color.js';

// Parse "Ten years ago, *smartphones* were *imported.*" into word tokens
export function parseMarkupTokens(markup) {
  const tokens = [];
  const regex = /\*([^*]+)\*|(\S+)/g;
  let m;
  while ((m = regex.exec(markup)) !== null) {
    if (m[1] !== undefined) {
      const subWords = m[1].trim().split(/\s+/);
      for (const sw of subWords) {
        if (sw) tokens.push({ text: sw, italic: true });
      }
    } else if (m[2] !== undefined) {
      tokens.push({ text: m[2], italic: false });
    }
  }
  return tokens;
}

// Draw multi-line optical word-blur phrase synced to spoken progress [0..1] or word timings
export function drawOpticalMarkup(ctx, markup, opts = {}) {
  const {
    x = 540,
    y = 320,
    maxWidth = 920,
    fontSize = 54,
    lineHeight = 1.30,
    align = 'center',
    progress = 1.0, // [0..1] across spoken phrase
    wordTimings = null, // optional array of { startLocal, endLocal } + localTimeSec
    localTimeSec = 0,
    color = '#FFFFFF',
    italicColor = '#FDE68A',
    revealWindow = 0.24 // seconds per word blur-in
  } = opts;

  const tokens = parseMarkupTokens(markup);
  if (!tokens.length) return { bottomY: y };

  const spaceW = fontSize * 0.27;
  const serifSize = Math.round(fontSize * 1.16);

  // Measure each token width
  const measured = tokens.map((tok, idx) => {
    ctx.font = tok.italic
      ? `italic 400 ${serifSize}px InstrumentSerif`
      : `400 ${fontSize}px PlusJakarta`;
    const w = ctx.measureText(tok.text).width;
    return { ...tok, w, idx };
  });

  // Wrap into lines
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

  ctx.save();
  ctx.textBaseline = 'alphabetic';

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

      // Compute word reveal progress wp in [0..1]
      let wp = 1;
      if (wordTimings && wordTimings.length > 0) {
        const mappedIdx = Math.min(
          wordTimings.length - 1,
          Math.floor((item.idx / Math.max(1, totalTokens)) * wordTimings.length)
        );
        const wt = wordTimings[mappedIdx];
        wp = easeOutCubic(clamp((localTimeSec * 1.06 - wt.startLocal + 0.06) / revealWindow, 0, 1));
      } else {
        const wordStartP = (item.idx / Math.max(1, totalTokens)) * 0.72;
        wp = easeOutCubic(clamp((progress - wordStartP) / 0.20, 0, 1));
      }

      if (wp > 0.005) {
        ctx.save();
        ctx.globalAlpha = wp;
        const blurPx = (1 - wp) * 14;
        if (blurPx > 0.35) {
          ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
        }
        const yOff = (1 - wp) * 9;
        ctx.font = item.italic
          ? `italic 400 ${serifSize}px InstrumentSerif`
          : `400 ${fontSize}px PlusJakarta`;
        ctx.fillStyle = item.italic ? italicColor : color;
        ctx.fillText(item.text, cursorX, baselineY + yOff);
        ctx.restore();
      }

      cursorX += item.w + spaceW;
    }
  }

  ctx.restore();
  return { bottomY: y + lines.length * lineStep };
}

// Draw tracked uppercase micro-telemetry label (e.g. "THE WORLD", "TODAY", "SHARE OF EXPORTS")
export function drawTrackedCaps(ctx, text, x, y, opts = {}) {
  const {
    fontSize = 20,
    tracking = 3.2,
    color = 'rgba(255, 255, 255, 0.86)',
    align = 'left',
    weight = 600,
    alpha = 1
  } = opts;

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

// Vertical Slot-Machine Digit-Wheel Odometer (1:1 match to a-d.mp4 rolling blurred digits!)
export function drawOdometer(ctx, opts = {}) {
  const {
    value = 0,
    startValue = 0,
    progress = 1, // [0..1]
    prefix = '',
    suffix = '',
    decimals = 0,
    useCommas = true,
    indianGrouping = false,
    x = 540,
    y = 500,
    fontSize = 148,
    weight = 300,
    color = '#FFFFFF',
    prefixSizeRatio = 0.56,
    suffixSizeRatio = 0.58,
    suffixColor = null,
    suffixItalicSerif = false,
    align = 'center',
    alpha = 1
  } = opts;

  const eased = easeOutQuart(clamp(progress, 0, 1));
  const curVal = startValue + (value - startValue) * eased;
  const speed = Math.abs(value - startValue) * (1 - eased);

  // Format target string structure and rolling per-digit continuous phase
  const fixedStr = Math.abs(curVal).toFixed(decimals);
  const [intPart, decPart] = fixedStr.split('.');

  let groupedInt = intPart;
  if (useCommas && intPart.length > 3) {
    if (indianGrouping) {
      const last3 = intPart.slice(-3);
      const rem = intPart.slice(0, -3);
      groupedInt = rem.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    } else {
      groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }
  const formatted = (curVal < 0 ? '-' : '') + groupedInt + (decimals > 0 ? '.' + decPart : '');

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textBaseline = 'alphabetic';

  const digitFont = `${weight} ${fontSize}px PlusJakarta`;
  const prefixFont = `400 ${Math.round(fontSize * prefixSizeRatio)}px PlusJakarta`;
  const suffixFont = suffixItalicSerif
    ? `italic 400 ${Math.round(fontSize * suffixSizeRatio)}px InstrumentSerif`
    : `${weight} ${Math.round(fontSize * suffixSizeRatio)}px PlusJakarta`;

  ctx.font = digitFont;
  const sampleDigitW = ctx.measureText('8').width;
  const commaW = ctx.measureText(',').width;
  const dotW = ctx.measureText('.').width;

  ctx.font = prefixFont;
  const prefW = prefix ? ctx.measureText(prefix).width + fontSize * 0.08 : 0;

  ctx.font = suffixFont;
  const suffW = suffix ? ctx.measureText(suffix).width + fontSize * 0.10 : 0;

  let bodyW = 0;
  const colWidths = [];
  for (const ch of formatted) {
    if (ch >= '0' && ch <= '9') {
      const cw = ch === '1' ? sampleDigitW * 0.74 : sampleDigitW * 0.96;
      colWidths.push(cw);
      bodyW += cw;
    } else if (ch === ',') {
      colWidths.push(commaW);
      bodyW += commaW;
    } else if (ch === '.') {
      colWidths.push(dotW);
      bodyW += dotW;
    } else {
      const w = ctx.measureText(ch).width;
      colWidths.push(w);
      bodyW += w;
    }
  }

  const totalW = prefW + bodyW + suffW;
  let cx = align === 'center' ? x - totalW / 2 : align === 'right' ? x - totalW : x;

  // Prefix (e.g. ₹, +, #)
  if (prefix) {
    ctx.font = prefixFont;
    ctx.fillStyle = color;
    ctx.fillText(prefix, cx, y - fontSize * 0.06);
    cx += prefW;
  }

  // Rolling digit columns clipped vertically
  const slotTop = y - fontSize * 0.92;
  const slotH = fontSize * 1.12;
  ctx.font = digitFont;
  ctx.fillStyle = color;

  const totalDigits = [...formatted].filter(c => c >= '0' && c <= '9').length;
  let seenDigits = 0;

  for (let ci = 0; ci < formatted.length; ci++) {
    const ch = formatted[ci];
    const colW = colWidths[ci];
    if (ch >= '0' && ch <= '9') {
      const placeIdxFromRight = totalDigits - 1 - seenDigits;
      const placeScale = Math.pow(10, placeIdxFromRight - decimals);
      const continuousDigit = Math.abs(curVal) / placeScale;
      const frac = progress < 0.995 ? (continuousDigit % 1) : 0;
      const baseD = Math.floor(continuousDigit) % 10;
      const nextD = (baseD + 1) % 10;

      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - 6, slotTop, colW + 12, slotH);
      ctx.clip();

      // Subtle vertical blur when wheel is spinning fast
      const wheelVel = clamp((speed / Math.max(1, placeScale)) * 0.08, 0, 1);
      if (wheelVel > 0.12 && progress < 0.96) {
        ctx.filter = `blur(${(wheelVel * 4.5).toFixed(1)}px)`;
      }

      const rollShift = frac * fontSize * 0.88;
      const d0Str = String(baseD);
      const d0Off = (colW - ctx.measureText(d0Str).width) * 0.5;
      ctx.fillText(d0Str, cx + d0Off, y - rollShift);
      if (frac > 0.01) {
        const d1Str = String(nextD);
        const d1Off = (colW - ctx.measureText(d1Str).width) * 0.5;
        ctx.fillText(d1Str, cx + d1Off, y + fontSize * 0.88 - rollShift);
      }
      ctx.restore();

      cx += colW;
      seenDigits++;
    } else {
      ctx.fillText(ch, cx, y);
      cx += colW;
    }
  }

  if (suffix) {
    cx += fontSize * 0.10;
    ctx.font = suffixFont;
    ctx.fillStyle = suffixColor || color;
    ctx.fillText(suffix, cx, y - (suffixItalicSerif ? 0 : fontSize * 0.16));
  }

  ctx.restore();
  return { totalW, leftX: align === 'center' ? x - totalW / 2 : cx - totalW };
}
