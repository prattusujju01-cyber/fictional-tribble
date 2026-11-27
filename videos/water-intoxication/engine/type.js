// Floating Dual-Beat Era-2 Kinetic Typography (Mid-Shot Vertical Shutter Swap!) + Spring Paper Tags & Calipers (v14.0)
import { W, clamp, easeOutCubic, easeOutExpo, easeOutBack, lerp } from './dossier.js';

export function drawEra2Headline(ctx, tier1, tier2, localT, dur, pal, opts = {}) {
  if (!tier1 && !tier2) return;
  const lead = opts.lead ?? 0.06;
  if (localT < lead) return;

  const t1P = easeOutCubic((localT - lead) / 0.14);
  const t2P = easeOutExpo((localT - (lead + 0.08)) / 0.16);

  const baseX = opts.x ?? 62;
  const topY = opts.topY ?? 94;
  const tier1Size = opts.tier1Size ?? 42;
  const tier2Size = opts.tier2Size ?? 94;
  const tier1Color = opts.tier1Color || pal.ink;
  const accentColor = opts.accentColor || pal.accent;
  const tier2Alt = opts.tier2Alt || '';
  const swapAt = (opts.swapAt ?? 0.50) * dur;
  const swapDur = 0.15;
  const swapP = tier2Alt ? clamp((localT - swapAt) / swapDur) : 0;

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Tier 1 Setup Clause
  if (tier1 && t1P > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(t1P);
    const dy = lerp(14, 0, t1P);
    ctx.font = `700 ${tier1Size}px "OswaldBold", "Anton", sans-serif`;
    ctx.shadowColor = pal.isDark ? 'rgba(0,0,0,0.78)' : 'rgba(255,244,210,0.55)';
    ctx.shadowBlur = pal.isDark ? 14 : 6;
    ctx.shadowOffsetY = pal.isDark ? 3 : 2;
    ctx.fillStyle = tier1Color;
    ctx.fillText(tier1.toUpperCase(), baseX, topY + dy);
    ctx.restore();
  }

  // Tier 2 Punch Clause (with Mid-Shot Vertical Slot-Shutter Swap tier2 -> tier2Alt!)
  if (tier2 && t2P > 0.01) {
    const punchY = topY + (tier1 ? tier1Size + 4 : 0);
    const strikeP = opts.strikeP || 0;

    const drawPunchLine = (rawTxt, yOffset, alphaMult, allowStrike = false) => {
      if (alphaMult <= 0.01 || !rawTxt) return;
      ctx.save();
      let fSize = tier2Size;
      ctx.font = `700 ${fSize}px "Anton", "OswaldBold", sans-serif`;
      const txt = rawTxt.toUpperCase();
      const mw = ctx.measureText(txt).width;
      if (mw > W - 124) {
        fSize = Math.floor(fSize * (W - 124) / mw);
        ctx.font = `700 ${fSize}px "Anton", "OswaldBold", sans-serif`;
      }

      ctx.beginPath();
      ctx.rect(0, punchY - 10, W, (tier2Size + 28) * clamp(t2P));
      ctx.clip();

      ctx.globalAlpha = clamp(alphaMult);
      const sc = lerp(1.06, 1.0, t2P);
      const dyEntry = lerp(20, 0, t2P);
      ctx.translate(baseX, punchY + fSize * 0.5 + dyEntry + yOffset);
      ctx.scale(sc, sc);
      ctx.translate(-baseX, -(punchY + fSize * 0.5));

      ctx.shadowColor = pal.isDark ? 'rgba(0,0,0,0.82)' : 'rgba(42,16,2,0.34)';
      ctx.shadowBlur = pal.isDark ? 18 : 8;
      ctx.shadowOffsetY = 4;
      if (!pal.isDark && (!allowStrike || strikeP <= 0.55)) {
        ctx.strokeStyle = 'rgba(255,246,220,0.46)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.strokeText(txt, baseX, punchY);
      }
      ctx.fillStyle = (allowStrike && strikeP > 0.55)
        ? (pal.isDark ? 'rgba(246,240,228,0.42)' : 'rgba(28,20,10,0.38)')
        : accentColor;
      ctx.fillText(txt, baseX, punchY);
      ctx.restore();

      if (allowStrike && strikeP > 0.02) {
        ctx.save();
        ctx.font = `700 ${fSize}px "Anton", "OswaldBold", sans-serif`;
        const tw = ctx.measureText(txt).width;
        const sy = punchY + fSize * 0.48 + yOffset;
        ctx.strokeStyle = '#D92418';
        ctx.lineWidth = 13;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(baseX - 8, sy + 10);
        ctx.lineTo(baseX - 8 + (tw + 20) * clamp(strikeP), sy - 10 * clamp(strikeP));
        ctx.stroke();
        ctx.restore();
      }
    };

    if (swapP <= 0.001) {
      drawPunchLine(tier2, 0, 1.0, true);
    } else if (swapP >= 0.999) {
      drawPunchLine(tier2Alt, 0, 1.0, false);
    } else {
      const e = easeOutCubic(swapP);
      // Outgoing slides upward out of clip mask; incoming snaps upward from below with subtle motion ghost!
      drawPunchLine(tier2, -e * (tier2Size + 18), 1 - e, true);
      drawPunchLine(tier2Alt, (1 - e) * (tier2Size + 18), e, false);
    }
  }
  ctx.restore();
}

// Spring-Damped Physical Pinned Cream Specimen Paper Tag (R03/R09/R10 Tactile Standard)
export function drawPaperTag(ctx, x, y, title, sub = '', rotDeg = -2, appearP = 1) {
  const p = clamp(appearP);
  if (p <= 0.02) return;
  const sp = easeOutBack(p, 1.5);
  ctx.save();
  ctx.globalAlpha = clamp(p * 2.2);
  ctx.translate(x, y + lerp(22, 0, easeOutCubic(p)));
  ctx.rotate((rotDeg + (1 - sp) * 6) * Math.PI / 180);
  ctx.scale(lerp(0.76, 1.0, sp), lerp(0.76, 1.0, sp));

  ctx.font = '700 38px "Anton", "OswaldBold", sans-serif';
  const m1 = ctx.measureText(title.toUpperCase()).width;
  ctx.font = '700 20px "SpaceMonoBold", monospace';
  const m2 = sub ? ctx.measureText(sub.toUpperCase()).width : 0;
  const bw = Math.max(m1, m2) + 54;
  const bh = sub ? 96 : 64;

  ctx.shadowColor = 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#F5E9CE';
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = '#C82818';
  ctx.beginPath();
  ctx.arc(0, -bh / 2 + 11, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (sub) {
    ctx.font = '700 18px "SpaceMonoBold", monospace';
    ctx.fillStyle = '#5A482F';
    ctx.fillText(sub.toUpperCase(), 0, -11);
    ctx.font = '700 38px "Anton", "OswaldBold", sans-serif';
    ctx.fillStyle = '#1B140C';
    ctx.fillText(title.toUpperCase(), 0, 22);
  } else {
    ctx.font = '700 38px "Anton", "OswaldBold", sans-serif';
    ctx.fillStyle = '#1B140C';
    ctx.fillText(title.toUpperCase(), 0, 5);
  }
  ctx.restore();
}

export function drawDimensionCaliper(ctx, x1, y1, x2, y2, label, isDark = false, appearP = 1) {
  const p = clamp(appearP);
  if (p <= 0.02) return;
  const ex = lerp(x1, x2, easeOutCubic(p));
  const ey = lerp(y1, y2, easeOutCubic(p));
  const ink = isDark ? 'rgba(248,240,224,0.88)' : 'rgba(28,18,8,0.85)';

  ctx.save();
  ctx.globalAlpha = easeOutCubic(p);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(ex, ey);
  ctx.moveTo(x1, y1 - 14); ctx.lineTo(x1, y1 + 14);
  ctx.moveTo(ex, ey - 14); ctx.lineTo(ex, ey + 14);
  ctx.stroke();

  ctx.font = '700 24px "SpaceMonoBold", monospace';
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label.toUpperCase(), (x1 + ex) / 2, (y1 + ey) / 2 - 10);
  ctx.restore();
}
