// engine/scenes.js
// Master 12-Scene Pure-Code Choreographer for Topic #1: India's 165x Smartphone Megafactory Revolution

import {
  W, H, clamp, lerp, easeOutCubic, easeOutQuart, easeInOutCubic,
  drawStudioBackdrop, compositeTransition, roundRectPath
} from './math_color.js';
import { drawOpticalMarkup, drawTrackedCaps, drawOdometer } from './typography.js';
import { SovereignMapStage } from './geo_map.js';
import {
  drawFrostedCard, drawChapterRail, drawCuriosityLockWidget,
  drawRocketBarComparison, drawExplodedSmartphone3D, drawPollWidget, drawDMShareCard
} from './widgets.js';

export function createDirector({ canvas, script, timeline, geo }) {
  const mainCtx = canvas.getContext('2d');
  const mapStage = new SovereignMapStage(geo);

  // Offscreen buffers for seamless optical / iris / laser / radar transitions
  const bufA = document.createElement('canvas');
  bufA.width = W; bufA.height = H;
  const ctxA = bufA.getContext('2d');

  const bufB = document.createElement('canvas');
  bufB.width = W; bufB.height = H;
  const ctxB = bufB.getContext('2d');

  const scenesMeta = script.scenes.map((sc, idx) => {
    const tlScene = timeline.scenes[idx];
    return {
      ...sc,
      index: idx,
      startSec: tlScene.startSec,
      endSec: tlScene.endSec,
      durSec: Math.max(0.1, tlScene.endSec - tlScene.startSec),
      words: tlScene.words || []
    };
  });

  // Render an individual scene at local progress p in [0..1] and localTimeSec
  function renderSingleScene(ctx, sc, localTimeSec, globalTimeSec) {
    const p = clamp(localTimeSec / sc.durSec, 0, 1);
    const id = sc.id;

    // 0. Studio radial atmosphere
    const palOverride = id === 'S09_HONEST_PART' ? 'deepIndigo' : sc.palette;
    drawStudioBackdrop(ctx, palOverride, globalTimeSec);

    // =========================================================================
    // S01: PARADOX IMPORT HOOK (Asia Map + 3 Frosted Import Cards + Rays)
    // =========================================================================
    if (id === 'S01_HOOK_IMPORT') {
      const cam = {
        lon: lerp(83, 79, easeOutCubic(p)),
        lat: lerp(23, 21, easeOutCubic(p)),
        scale: lerp(510, 640, easeOutCubic(p)),
        cx: 650,
        cy: 740
      };
      mapStage.draw(ctx, cam, { dofBlur: 0, alpha: 1, indiaGlow: 1.0, indiaFillMode: 'gold' });

      // 3 stacked frosted import cards on left + converging pale-blue import rays into India
      const indiaHub = mapStage.project(79.0, 22.5, cam);
      const importCards = [
        { title: '75%', sub: 'PHONES IMPORTED', tag: '2014 DEPENDENCE', delay: 0.08 },
        { title: 'Only 2', sub: 'MOBILE FACTORIES', tag: 'ENTIRE COUNTRY', delay: 0.24 },
        { title: '#153', sub: 'EXPORT RANKING', tag: 'BARELY VISIBLE', delay: 0.40 }
      ];

      for (let i = 0; i < importCards.length; i++) {
        const ic = importCards[i];
        const cp = easeOutCubic(clamp((p - ic.delay) / 0.24, 0, 1));
        if (cp > 0.01) {
          const cx = 64 - (1 - cp) * 36;
          const cy = 290 + i * 232;
          const cw = 395, ch = 204;

          // Ray from card right edge into India
          mapStage.drawExportArc(
            ctx,
            [cx + cw, cy + ch / 2],
            [indiaHub[0] - 10 + i * 16, indiaHub[1] - 40 + i * 42],
            clamp((p - ic.delay - 0.06) / 0.34, 0, 1),
            { color: '#9EC5FF', glowColor: 'rgba(158, 197, 255, 0.7)', lift: 0.08 }
          );

          drawFrostedCard(ctx, cx, cy, cw, ch, {
            radius: 26,
            fill: 'rgba(16, 32, 130, 0.72)',
            borderTop: 'rgba(186, 218, 255, 0.65)',
            alpha: cp,
            blurPx: (1 - cp) * 8
          });
          drawTrackedCaps(ctx, ic.tag, cx + 28, cy + 40, { fontSize: 15, tracking: 2.5, color: '#9EC5FF', alpha: cp });
          ctx.save();
          ctx.globalAlpha = cp;
          ctx.font = 'italic 400 72px InstrumentSerif';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(ic.title, cx + 28, cy + 122);
          ctx.restore();
          drawTrackedCaps(ctx, ic.sub, cx + 28, cy + 168, { fontSize: 17, tracking: 2.8, color: '#FDE68A', alpha: cp });
        }
      }

      // Bottom optical word-blur narration
      drawOpticalMarkup(ctx, sc.displayMarkup, {
        x: 540, y: 1320, maxWidth: 920, fontSize: 58,
        wordTimings: sc.words, localTimeSec, progress: p,
        italicColor: '#9EC5FF'
      });
    }

    // =========================================================================
    // S02: 99.2% MADE IN INDIA FLIP + CURIOSITY LOCK PLANTED
    // =========================================================================
    else if (id === 'S02_HOOK_LOCK') {
      const lockPhase = clamp((p - 0.48) / 0.52, 0, 1);
      const cam = {
        lon: 80.0,
        lat: 22.0,
        scale: lerp(640, 860, easeOutCubic(p)),
        cx: 540,
        cy: 900
      };
      mapStage.draw(ctx, cam, {
        dofBlur: lockPhase * 10,
        alpha: lerp(1.0, 0.42, lockPhase),
        indiaGlow: 1.0,
        indiaFillMode: 'warm'
      });

      // Glowing internal manufacturing hub network across India (Chennai, Bengaluru, Noida, Sri City)
      if (lockPhase < 0.75) {
        const hubs = [
          [77.4, 28.5], // Noida
          [72.6, 23.0], // Gujarat
          [77.6, 13.0], // Bengaluru
          [80.0, 13.0], // Sriperumbudur / Chennai
          [79.9, 13.6]  // Sri City
        ];
        const pts = hubs.map(([lo, la]) => mapStage.project(lo, la, cam));
        for (let i = 0; i < pts.length - 1; i++) {
          mapStage.drawExportArc(ctx, pts[i], pts[i + 1], clamp(p / 0.42, 0, 1), {
            color: '#FFFBEB', glowColor: 'rgba(255,240,150,0.8)', lift: 0.14
          });
        }
      }

      // Top Headline + 99.2% Odometer during Beat A
      if (p < 0.56) {
        const fadeOut = 1 - clamp((p - 0.44) / 0.12, 0, 1);
        drawTrackedCaps(ctx, 'PHONES SOLD IN INDIA TODAY', 540, 230, {
          fontSize: 21, tracking: 3.6, align: 'center', color: '#9EC5FF', alpha: fadeOut
        });
        drawOdometer(ctx, {
          startValue: 26.0,
          value: 99.2,
          decimals: 1,
          suffix: '%',
          progress: clamp(p / 0.36, 0, 1),
          x: 540, y: 415,
          fontSize: 176, weight: 300,
          color: '#FFFFFF', suffixColor: '#FDE68A',
          alpha: fadeOut
        });
        ctx.save();
        ctx.globalAlpha = fadeOut * easeOutCubic(clamp((p - 0.12) / 0.2, 0, 1));
        ctx.font = 'italic 400 66px InstrumentSerif';
        ctx.fillStyle = '#FDE68A';
        ctx.textAlign = 'center';
        ctx.fillText('Made right here in India', 540, 505);
        ctx.restore();
      } else {
        // Beat B: "Stay with me, because one number in this video explains everything."
        drawOpticalMarkup(ctx, 'Stay with me, because *one number* in this video explains *everything.*', {
          x: 540, y: 430, maxWidth: 880, fontSize: 60,
          progress: clamp((p - 0.50) / 0.36, 0, 1),
          italicColor: '#FDE68A'
        });
      }

      if (p >= 0.48) {
        drawCuriosityLockWidget(ctx, 'plant', lockPhase);
      }
    }

    // =========================================================================
    // S03: 2014 BASELINE (DOF Map + Giant 2014 + ₹1,566 Cr + Ghost Target Bar)
    // =========================================================================
    else if (id === 'S03_BASELINE_2014') {
      const cam = { lon: 79.5, lat: 22.5, scale: 860 + p * 35, cx: 540, cy: 960 };
      mapStage.draw(ctx, cam, { dofBlur: 14, alpha: 0.24, indiaGlow: 0.6 });

      // Giant 2014 top-left (exact layout of b.mp4 00:09!)
      const headerP = easeOutCubic(clamp(p / 0.22, 0, 1));
      ctx.save();
      ctx.globalAlpha = headerP;
      ctx.font = '300 156px PlusJakarta';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('2014', 102, 520);
      ctx.restore();
      drawTrackedCaps(ctx, 'MOBILE PHONE EXPORTS', 108, 578, {
        fontSize: 21, tracking: 3.6, color: '#9EC5FF', alpha: headerP
      });

      // Left odometer ₹1,566 crore above tiny gold bar + Right dashed ghost bar
      const odoP = clamp((p - 0.14) / 0.45, 0, 1);
      drawOdometer(ctx, {
        startValue: 120,
        value: 1566,
        prefix: '₹',
        progress: odoP,
        x: 270, y: 1230,
        fontSize: 92, weight: 300,
        color: '#FFFFFF',
        align: 'center'
      });
      ctx.save();
      ctx.font = 'italic 400 54px InstrumentSerif';
      ctx.fillStyle = '#FDE68A';
      ctx.textAlign = 'center';
      ctx.fillText('crore', 270, 1296);
      ctx.restore();

      drawRocketBarComparison(ctx, {
        baselineY: 1360,
        leftX: 270,
        rightX: 760,
        barW: 205,
        leftBarH: 20,
        maxRightBarH: 730,
        rightProgress: 0,
        showGhost: true,
        tSec: globalTimeSec
      });

      drawTrackedCaps(ctx, 'RANKED #153 IN INDIA EXPORTS', 540, 1510, {
        fontSize: 20, tracking: 3.4, align: 'center', color: 'rgba(255,255,255,0.72)',
        alpha: easeOutCubic(clamp((p - 0.55) / 0.25, 0, 1))
      });
    }

    // =========================================================================
    // S04: 165X EXPORT EXPLOSION (Crimson-Amber Radial Iris + Rocket Gold Bar!)
    // =========================================================================
    else if (id === 'S04_EXPLOSION_165X') {
      const cam = { lon: 79.5, lat: 22.5, scale: 900 + p * 40, cx: 540, cy: 960 };
      mapStage.draw(ctx, cam, { dofBlur: 15, alpha: 0.18, indiaFillMode: 'warm' });

      const barP = clamp((p - 0.04) / 0.44, 0, 1);
      drawRocketBarComparison(ctx, {
        baselineY: 1380,
        leftX: 260,
        rightX: 765,
        barW: 210,
        leftBarH: 20,
        maxRightBarH: 740,
        rightProgress: barP,
        showGhost: barP < 0.95,
        tSec: globalTimeSec
      });

      // Left baseline reference (₹1,566 crore • 2014)
      ctx.save();
      ctx.font = '300 68px PlusJakarta';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.textAlign = 'center';
      ctx.fillText('₹1,566', 260, 1268);
      ctx.font = 'italic 400 44px InstrumentSerif';
      ctx.fillStyle = '#FFE484';
      ctx.fillText('crore', 260, 1320);
      ctx.restore();
      drawTrackedCaps(ctx, '2014', 260, 1432, { fontSize: 19, tracking: 3.2, align: 'center' });
      drawTrackedCaps(ctx, 'TODAY', 765, 1432, { fontSize: 21, tracking: 3.8, align: 'center', color: '#FFFDF2' });

      // Giant ₹2,60,000 crore odometer above towering golden column
      drawOdometer(ctx, {
        startValue: 1566,
        value: 260000,
        indianGrouping: true,
        prefix: '₹',
        progress: barP,
        x: 685, y: 495,
        fontSize: 132, weight: 300,
        color: '#FFFFFF',
        align: 'center'
      });
      ctx.save();
      ctx.font = 'italic 400 66px InstrumentSerif';
      ctx.fillStyle = '#FFF7D6';
      ctx.textAlign = 'center';
      ctx.fillText('crore', 765, 578);
      ctx.restore();

      // Monumental 165x multiplier on left (exact match to b.mp4 00:17 "56x times more"!)
      if (p > 0.42) {
        const mp = clamp((p - 0.42) / 0.30, 0, 1);
        drawOdometer(ctx, {
          startValue: 10,
          value: 165,
          suffix: '×',
          progress: mp,
          x: 280, y: 895,
          fontSize: 146, weight: 300,
          color: '#FFFFFF',
          suffixColor: '#FFF7D6',
          align: 'center',
          alpha: easeOutCubic(mp)
        });
        ctx.save();
        ctx.globalAlpha = easeOutCubic(mp);
        ctx.font = 'italic 400 58px InstrumentSerif';
        ctx.fillStyle = '#FFE484';
        ctx.textAlign = 'center';
        ctx.fillText('times more', 280, 968);
        ctx.restore();

        // "#1 TECH EXPORT" pill badge at bottom
        const bp = easeOutCubic(clamp((p - 0.62) / 0.22, 0, 1));
        if (bp > 0.02) {
          drawFrostedCard(ctx, 210, 1525, 660, 88, {
            radius: 44,
            fill: 'rgba(255, 248, 220, 0.16)',
            borderTop: 'rgba(255, 240, 180, 0.78)',
            alpha: bp
          });
          drawTrackedCaps(ctx, 'NOW INDIA’S #1 TECH EXPORT ITEM', 540, 1570, {
            fontSize: 21, tracking: 3.2, align: 'center', color: '#FFFDF2', alpha: bp
          });
        }
      }
    }

    // =========================================================================
    // S05: PLI MISSION MODE TOGGLE + 10x10 FACTORY TILE MATRIX (2 -> 300+)
    // =========================================================================
    else if (id === 'S05_MECHANISM_PLI') {
      const cam = { lon: 79.5, lat: 22.5, scale: 880, cx: 540, cy: 980 };
      mapStage.draw(ctx, cam, { dofBlur: 14, alpha: 0.25 });

      // Top Frosted PLI Decision Card with animated iOS Toggle Switch (c.mp4 00:52)
      const cardP = easeOutCubic(clamp(p / 0.20, 0, 1));
      const toggleP = easeOutQuart(clamp((p - 0.18) / 0.22, 0, 1));

      drawFrostedCard(ctx, 90, 250, 900, 290, {
        radius: 32,
        fill: 'rgba(18, 34, 150, 0.62)',
        borderTop: 'rgba(255, 255, 255, 0.56)',
        glowColor: toggleP > 0.5 ? 'rgba(250, 204, 21, 0.30)' : null,
        glowBlur: 32 * toggleP,
        alpha: cardP
      });

      // Pill badge "• POLICY SHIFT"
      drawFrostedCard(ctx, 134, 286, 236, 48, {
        radius: 24,
        fill: 'rgba(255, 255, 255, 0.10)',
        alpha: cardP
      });
      drawTrackedCaps(ctx, '• POLICY SHIFT', 252, 311, { fontSize: 16, tracking: 2.6, align: 'center', color: '#FDE68A', alpha: cardP });

      ctx.save();
      ctx.globalAlpha = cardP;
      ctx.font = '400 54px PlusJakarta';
      ctx.fillStyle = '#FFFFFF';
      const plText = 'Production Linked ';
      ctx.fillText(plText, 136, 412);
      const plW = ctx.measureText(plText).width;
      ctx.font = 'italic 400 66px InstrumentSerif';
      ctx.fillStyle = '#FDE68A';
      ctx.fillText('Incentive', 136 + plW + 6, 412);
      ctx.restore();

      drawTrackedCaps(ctx, 'MISSION MODE', 136, 486, { fontSize: 22, tracking: 3.6, color: 'rgba(255,255,255,0.85)', alpha: cardP });
      drawTrackedCaps(ctx, toggleP > 0.5 ? 'ON' : 'OFF', 748, 486, { fontSize: 22, tracking: 3.0, align: 'right', color: '#FDE68A', alpha: cardP });

      // Animated Toggle Pill
      const tx = 774, ty = 456, tw = 152, th = 60;
      roundRectPath(ctx, tx, ty, tw, th, 30);
      ctx.fillStyle = toggleP > 0.3 ? `rgba(250, 204, 21, ${(0.25 + 0.70 * toggleP).toFixed(2)})` : 'rgba(255,255,255,0.18)';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(lerp(tx + 32, tx + tw - 32, toggleP), ty + 30, 24, 0, Math.PI * 2);
      ctx.fill();

      // Shockwave ring when toggle snaps ON
      if (p > 0.28 && p < 0.56) {
        const rp = (p - 0.28) / 0.28;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 232, 130, ${(0.55 * (1 - rp)).toFixed(2)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(540, 395, 180 + rp * 540, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 10x10 Factory Tile Matrix below (2 tiles -> all 100 tiles = 300+ Factories!)
      const gridP = clamp((p - 0.42) / 0.44, 0, 1);
      const litTiles = Math.max(2, Math.round(lerp(2, 100, easeOutQuart(gridP))));
      const cols = 10, rows = 10, tileS = 62, gap = 10;
      const gridW = cols * tileS + (cols - 1) * gap;
      const gx0 = (W - gridW) / 2;
      const gy0 = 780;

      drawOdometer(ctx, {
        startValue: 2,
        value: 300,
        suffix: '+ factories',
        suffixItalicSerif: true,
        progress: gridP,
        x: 540, y: 720,
        fontSize: 108, weight: 300,
        color: '#FFFFFF', suffixColor: '#FDE68A'
      });

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const tx0 = gx0 + c * (tileS + gap);
          const ty0 = gy0 + r * (tileS + gap);
          const isLit = idx < litTiles;
          roundRectPath(ctx, tx0, ty0, tileS, tileS, 13);
          if (isLit) {
            ctx.fillStyle = idx < 2 && gridP < 0.05 ? '#9EC5FF' : '#FACC15';
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      drawTrackedCaps(ctx, '1 TILE = 3 MANUFACTURING UNITS • UP FROM JUST 2 IN 2014', 540, 1555, {
        fontSize: 18, tracking: 3.0, align: 'center', color: 'rgba(255,255,255,0.82)'
      });
    }

    // =========================================================================
    // S06: LASER BLUEPRINT X-RAY + 4-LAYER 3D ISOMETRIC EXPLODED SMARTPHONE
    // =========================================================================
    else if (id === 'S06_BLUEPRINT_XRAY') {
      // CAD Step indicator top-left (exact match to a.mp4 00:21 "02 —— 04"!)
      const stepNum = Math.min(4, 1 + Math.floor(p * 4));
      ctx.save();
      ctx.font = '600 28px PlusJakarta';
      ctx.fillStyle = '#F7C948';
      ctx.fillText(`0${stepNum}`, 92, 290);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.fillText('04', 360, 290);

      // Step progress bar
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(150, 280, 190, 4);
      ctx.fillStyle = '#F7C948';
      ctx.fillRect(150, 280, 190 * (stepNum / 4), 4);
      ctx.restore();

      drawOpticalMarkup(ctx, sc.displayMarkup, {
        x: 92, y: 368, maxWidth: 890, fontSize: 52, align: 'left',
        wordTimings: sc.words, localTimeSec, progress: p,
        italicColor: '#F7C948'
      });

      // 3D Isometric Exploded Smartphone Assembly
      drawExplodedSmartphone3D(ctx, {
        cx: 540,
        cy: 1125,
        explodeProgress: clamp(p / 0.38, 0, 1),
        yawDeg: lerp(-31, -21, p),
        pitchDeg: 27,
        stepActive: stepNum
      });

      drawTrackedCaps(ctx, 'TAMIL NADU • KARNATAKA • UTTAR PRADESH • GUJARAT', 540, 1630, {
        fontSize: 19, tracking: 3.2, align: 'center', color: '#5BC0FF'
      });
    }

    // =========================================================================
    // S07: UNLOCKING THE SECRET NUMBER (🔓 10+ PHONES/SEC + 1 IN 7 iPHONES)
    // =========================================================================
    else if (id === 'S07_SECRET_UNLOCKED') {
      const cam = { lon: 79.5, lat: 22.5, scale: 880, cx: 540, cy: 980 };
      mapStage.draw(ctx, cam, { dofBlur: 14, alpha: 0.25 });

      drawOpticalMarkup(ctx, 'Every. Single. *Second.*', {
        x: 540, y: 310, maxWidth: 900, fontSize: 68,
        progress: clamp(p / 0.30, 0, 1),
        italicColor: '#FDE68A'
      });

      // Row of 7 Flagship Smartphones -> Phone #1 blazes Saffron-Gold ("1 IN EVERY 7 iPHONES ON EARTH")
      const rowP = easeOutCubic(clamp((p - 0.44) / 0.30, 0, 1));
      if (rowP > 0.01) {
        const count = 7, pw = 96, ph = 186, gap = 22;
        const totalW = count * pw + (count - 1) * gap;
        const sx0 = (W - totalW) / 2;
        const sy0 = 640;

        ctx.save();
        ctx.globalAlpha = rowP;
        for (let i = 0; i < count; i++) {
          const px = sx0 + i * (pw + gap);
          const isIndia = i === 0;
          ctx.save();
          if (isIndia) {
            ctx.shadowColor = 'rgba(250, 204, 21, 0.85)';
            ctx.shadowBlur = 28;
          }
          roundRectPath(ctx, px, sy0, pw, ph, 20);
          ctx.fillStyle = isIndia ? '#FACC15' : 'rgba(255, 255, 255, 0.10)';
          ctx.fill();
          ctx.strokeStyle = isIndia ? '#FFFBEB' : 'rgba(255, 255, 255, 0.38)';
          ctx.lineWidth = isIndia ? 2.6 : 1.6;
          ctx.stroke();

          // Dynamic notch
          roundRectPath(ctx, px + pw * 0.30, sy0 + 12, pw * 0.40, 8, 4);
          ctx.fillStyle = isIndia ? '#1E1B4B' : 'rgba(255,255,255,0.45)';
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        drawTrackedCaps(ctx, '1 IN EVERY 7 iPHONES ON EARTH IS NOW BUILT IN INDIA', 540, 885, {
          fontSize: 20, tracking: 3.0, align: 'center', color: '#FDE68A', alpha: rowP
        });
      }

      // Unlocking the Curiosity Lock Widget at y = 1180!
      drawCuriosityLockWidget(ctx, 'unlock', p);
    }

    // =========================================================================
    // S08: GLOBAL EXPORT SHOCKWAVE (World Map + 5 Glowing Bezier Export Arcs)
    // =========================================================================
    else if (id === 'S08_GLOBAL_SHOCKWAVE') {
      const cam = {
        lon: lerp(52, 34, easeOutCubic(p)),
        lat: 26,
        scale: lerp(215, 195, easeOutCubic(p)),
        cx: 560,
        cy: 930
      };

      const destinations = [
        { iso: 'USA', label: 'USA • #1 BUYER', lon: -92, lat: 38, delay: 0.08 },
        { iso: 'GBR', label: 'UK', lon: -2, lat: 54, delay: 0.20 },
        { iso: 'NLD', label: 'NETHERLANDS', lon: 5.5, lat: 52.2, delay: 0.32 },
        { iso: 'ARE', label: 'UAE', lon: 54.4, lat: 24.4, delay: 0.44 },
        { iso: 'JPN', label: 'JAPAN', lon: 138.2, lat: 36.2, delay: 0.56 }
      ];

      const hl = {};
      for (const d of destinations) {
        hl[d.iso] = clamp((p - d.delay - 0.16) / 0.18, 0, 1);
      }

      mapStage.draw(ctx, cam, {
        dofBlur: 0,
        alpha: 1,
        highlightedIsos: hl,
        indiaGlow: 1.0,
        indiaFillMode: 'warm'
      });

      const indiaOrigin = mapStage.project(78.5, 20.5, cam);
      for (const d of destinations) {
        const dp = clamp((p - d.delay) / 0.32, 0, 1);
        const destPt = mapStage.project(d.lon, d.lat, cam);
        mapStage.drawExportArc(ctx, indiaOrigin, destPt, dp, {
          color: '#FFE680',
          glowColor: 'rgba(250, 204, 21, 0.85)',
          lift: 0.24
        });

        if (dp > 0.65) {
          const la = clamp((dp - 0.65) / 0.35, 0, 1);
          const pillW = d.label.length * 14 + 34;
          drawFrostedCard(ctx, destPt[0] - pillW / 2, destPt[1] - 56, pillW, 42, {
            radius: 21,
            fill: 'rgba(10, 22, 108, 0.86)',
            borderTop: 'rgba(255, 232, 130, 0.75)',
            alpha: la
          });
          drawTrackedCaps(ctx, d.label, destPt[0], destPt[1] - 34, {
            fontSize: 15, tracking: 2.2, align: 'center', color: '#FFFBEB', alpha: la
          });
        }
      }

      drawOpticalMarkup(ctx, sc.displayMarkup, {
        x: 540, y: 315, maxWidth: 900, fontSize: 56,
        wordTimings: sc.words, localTimeSec, progress: p,
        italicColor: '#FDE68A'
      });
    }

    // =========================================================================
    // S09: "NOW, THE HONEST PART" (99.2% Assembly vs Silicon Chips Imported)
    // =========================================================================
    else if (id === 'S09_HONEST_PART') {
      const cam = { lon: 79.5, lat: 22.5, scale: 860, cx: 540, cy: 980 };
      mapStage.draw(ctx, cam, { dofBlur: 14, alpha: 0.22, indiaFillMode: 'purple' });

      drawOpticalMarkup(ctx, sc.displayMarkup, {
        x: 540, y: 325, maxWidth: 880, fontSize: 58,
        wordTimings: sc.words, localTimeSec, progress: p,
        italicColor: '#7DD3FC'
      });

      // Left vs Right Honest Breakdown Card
      const cp = easeOutCubic(clamp((p - 0.14) / 0.34, 0, 1));
      drawFrostedCard(ctx, 86, 650, 908, 760, {
        radius: 36,
        fill: 'rgba(15, 23, 88, 0.66)',
        borderTop: 'rgba(125, 211, 252, 0.55)',
        alpha: cp
      });

      // Circular Silicon Wafer & 3nm Die Diagram
      const wcx = 540, wcy = 985, wr = 185;
      ctx.save();
      ctx.globalAlpha = cp;
      ctx.strokeStyle = '#7DD3FC';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(125, 211, 252, 0.55)';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(wcx, wcy, wr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Wafer silicon die grid
      ctx.save();
      ctx.beginPath();
      ctx.arc(wcx, wcy, wr - 8, 0, Math.PI * 2);
      ctx.clip();
      const step = 34;
      for (let gx = wcx - wr; gx <= wcx + wr; gx += step) {
        for (let gy = wcy - wr; gy <= wcy + wr; gy += step) {
          ctx.fillStyle = ((gx + gy) % 68 === 0) ? 'rgba(56, 189, 248, 0.28)' : 'rgba(30, 58, 138, 0.45)';
          ctx.fillRect(gx + 2, gy + 2, step - 4, step - 4);
        }
      }
      ctx.restore();

      // Central glowing processor die
      roundRectPath(ctx, wcx - 64, wcy - 64, 128, 128, 18);
      ctx.fillStyle = '#09113A';
      ctx.fill();
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3;
      ctx.stroke();
      drawTrackedCaps(ctx, '3NM CHIP', wcx, wcy + 2, { fontSize: 18, tracking: 2.2, align: 'center', color: '#FDE68A' });
      ctx.restore();

      drawTrackedCaps(ctx, 'PHONE ASSEMBLY: 99.2% LOCAL', 540, 1265, {
        fontSize: 21, tracking: 3.0, align: 'center', color: '#FDE68A', alpha: cp
      });
      drawTrackedCaps(ctx, 'CORE SILICON WAFERS: STILL IMPORTED', 540, 1325, {
        fontSize: 21, tracking: 3.0, align: 'center', color: '#7DD3FC', alpha: cp
      });
    }

    // =========================================================================
    // S10: 5 CHIP FABS (₹1.52L CR) + DUAL FROSTED GLASS REFRAME (FACTORY vs SUPERPOWER)
    // =========================================================================
    else if (id === 'S10_SEMICON_SUPERPOWER') {
      const splitP = clamp((p - 0.44) / 0.14, 0, 1);

      const cam = {
        lon: 80.5,
        lat: 23.0,
        scale: 920,
        cx: 540,
        cy: 960
      };
      mapStage.draw(ctx, cam, {
        dofBlur: splitP * 15,
        alpha: lerp(1.0, 0.26, splitP),
        indiaGlow: 1.0,
        indiaFillMode: 'gold'
      });

      if (p < 0.50) {
        const fade = 1 - splitP;
        drawOdometer(ctx, {
          startValue: 0.2,
          value: 1.52,
          decimals: 2,
          prefix: '₹',
          suffix: 'Lakh Cr',
          suffixItalicSerif: true,
          progress: clamp(p / 0.30, 0, 1),
          x: 540, y: 365,
          fontSize: 122, weight: 300,
          color: '#FFFFFF', suffixColor: '#FDE68A',
          alpha: fade
        });
        drawTrackedCaps(ctx, '5 SEMICONDUCTOR FABS RISING IN INDIA', 540, 435, {
          fontSize: 21, tracking: 3.4, align: 'center', color: '#9EC5FF', alpha: fade
        });

        // Gujarat (Dholera, Sanand x3) & Assam (Morigaon) Fab Pins!
        const fabs = [
          { name: 'DHOLERA FAB • GUJARAT', lon: 72.2, lat: 22.25, lx: 82, ly: 860 },
          { name: 'SANAND OSAT (×3) • GUJARAT', lon: 72.38, lat: 23.0, lx: 82, ly: 755 },
          { name: 'MORIGAON • ASSAM', lon: 92.35, lat: 26.25, lx: 605, ly: 770 }
        ];
        ctx.save();
        ctx.globalAlpha = fade;
        for (const f of fabs) {
          const pt = mapStage.project(f.lon, f.lat, cam);
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#FACC15';
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          drawFrostedCard(ctx, f.lx, f.ly, 390, 62, {
            radius: 18,
            fill: 'rgba(10, 22, 112, 0.85)',
            borderTop: 'rgba(255, 232, 130, 0.8)'
          });
          drawTrackedCaps(ctx, f.name, f.lx + 22, f.ly + 32, { fontSize: 16, tracking: 2.2, color: '#FFFBEB' });
        }
        ctx.restore();
      }

      // Beat B: Dual Stacked Frosted Glass Cards (1:1 match to ref_b_glass_comparison_cards.jpg!)
      if (p >= 0.44) {
        const card1P = easeOutCubic(clamp((p - 0.44) / 0.18, 0, 1));
        const card2P = easeOutCubic(clamp((p - 0.66) / 0.20, 0, 1));

        // Card 1 (Top): "A COUNTRY THAT ONLY ASSEMBLES PHONES" -> *factory* (dims & blurs once Card 2 arrives!)
        const dim1 = lerp(1.0, 0.44, card2P);
        drawFrostedCard(ctx, 90, 290, 900, 460, {
          radius: 34,
          fill: 'rgba(255, 255, 255, 0.08)',
          borderTop: 'rgba(255, 255, 255, 0.40)',
          alpha: card1P * dim1,
          blurPx: card2P * 4.5
        });
        ctx.save();
        ctx.globalAlpha = card1P * dim1;
        if (card2P > 0.1) ctx.filter = `blur(${(card2P * 4).toFixed(1)}px)`;
        drawTrackedCaps(ctx, 'A COUNTRY THAT ONLY ASSEMBLES PHONES', 142, 360, { fontSize: 20, tracking: 3.2 });
        ctx.font = 'italic 400 138px InstrumentSerif';
        ctx.fillStyle = '#C7D2FE';
        ctx.fillText('factory', 142, 515);

        const sub1 = ['Imported Chips', 'Imported Glass', 'Thin Margins'];
        for (let k = 0; k < 3; k++) {
          drawFrostedCard(ctx, 142 + k * 272, 575, 252, 118, { radius: 20, fill: 'rgba(15, 23, 95, 0.55)' });
          ctx.font = 'italic 400 34px InstrumentSerif';
          ctx.fillStyle = '#E2E8F0';
          ctx.fillText(sub1[k], 166 + k * 272, 646);
        }
        ctx.restore();

        // Card 2 (Bottom): "A COUNTRY THAT BUILDS THE CHIPS" -> *superpower* (crisp warm gold!)
        if (card2P > 0.01) {
          drawFrostedCard(ctx, 90, 810, 900, 480, {
            radius: 34,
            fill: 'rgba(255, 244, 214, 0.15)',
            borderTop: 'rgba(255, 238, 165, 0.92)',
            borderWidth: 2.2,
            glowColor: 'rgba(250, 204, 21, 0.35)',
            glowBlur: 36,
            alpha: card2P,
            blurPx: (1 - card2P) * 8
          });
          ctx.save();
          ctx.globalAlpha = card2P;
          drawTrackedCaps(ctx, 'A COUNTRY THAT BUILDS THE CHIPS', 142, 882, { fontSize: 20, tracking: 3.4, color: '#FFFBEB' });
          ctx.font = 'italic 400 138px InstrumentSerif';
          ctx.fillStyle = '#FFE896';
          ctx.fillText('superpower', 142, 1038);

          const sub2 = ['Dholera Fab', 'Sanand OSAT', 'Morigaon Assam'];
          for (let k = 0; k < 3; k++) {
            drawFrostedCard(ctx, 142 + k * 272, 1105, 252, 126, {
              radius: 20,
              fill: 'rgba(250, 204, 21, 0.18)',
              borderTop: 'rgba(255, 238, 165, 0.75)'
            });
            ctx.font = 'italic 400 34px InstrumentSerif';
            ctx.fillStyle = '#FFFDF2';
            ctx.fillText(sub2[k], 166 + k * 272, 1180);
          }
          ctx.restore();
        }

        drawOpticalMarkup(ctx, sc.displayMarkup, {
          x: 540, y: 1410, maxWidth: 900, fontSize: 52,
          progress: clamp((p - 0.45) / 0.50, 0, 1),
          italicColor: '#FDE68A'
        });
      }
    }

    // =========================================================================
    // S11: INTERACTIVE 3-OPTION POLL CTA (Patriotic Dusk + Cycling Radio Dot)
    // =========================================================================
    else if (id === 'S11_POLL_CTA') {
      const cam = { lon: 79.5, lat: 22.5, scale: 900, cx: 540, cy: 980 };
      mapStage.draw(ctx, cam, { dofBlur: 14, alpha: 0.24, indiaFillMode: 'warm' });

      drawOpticalMarkup(ctx, sc.displayMarkup, {
        x: 540, y: 420, maxWidth: 880, fontSize: 60,
        wordTimings: sc.words, localTimeSec, progress: p,
        italicColor: '#FFF4B8'
      });

      const activeOpt = p < 0.46 ? 0 : p < 0.70 ? 1 : 2;
      drawPollWidget(ctx, [
        { label: 'iPhone' },
        { label: 'Samsung' },
        { label: 'OnePlus / Android' }
      ], activeOpt, p);
    }

    // =========================================================================
    // S12: INTERACTIVE DM SHARE CARD FINALE
    // =========================================================================
    else if (id === 'S12_SHARE_OUTRO') {
      const cam = { lon: 79.5, lat: 22.0, scale: 880 + p * 40, cx: 540, cy: 1020 };
      mapStage.draw(ctx, cam, { dofBlur: 12, alpha: 0.30, indiaFillMode: 'warm' });

      drawOpticalMarkup(ctx, sc.displayMarkup, {
        x: 540, y: 430, maxWidth: 860, fontSize: 62,
        wordTimings: sc.words, localTimeSec, progress: p,
        italicColor: '#FDE68A'
      });

      drawDMShareCard(ctx, p);
    }

    // =========================================================================
    // PERSISTENT TOP HUD: CHAPTER PROGRESS RAIL + DOCKED CURIOSITY LOCK PILL
    // =========================================================================
    if (sc.showRail) {
      drawChapterRail(ctx, script.chapters, sc.chapter, 1.0);
    }
    if (sc.lockState === 'docked') {
      drawCuriosityLockWidget(ctx, 'docked', 1.0);
    }
  }

  // Master frame entry point (0 .. totalFrames - 1)
  function renderFrame(frameIdx) {
    const fps = script.fps || 30;
    const tSec = frameIdx / fps;

    // Locate active scene index
    let sIdx = scenesMeta.length - 1;
    for (let i = 0; i < scenesMeta.length; i++) {
      if (tSec < scenesMeta[i].endSec || i === scenesMeta.length - 1) {
        sIdx = i;
        break;
      }
    }

    const curScene = scenesMeta[sIdx];
    const localTime = Math.max(0, tSec - curScene.startSec);

    // Transition window at start of scene (0.55s for radial/laser/radar, 0.38s for dof_rack)
    const transType = curScene.transitionIn || 'none';
    const transDur = (transType === 'radial_iris' || transType === 'laser_scan' || transType === 'radar_sweep')
      ? 0.56
      : transType === 'none'
        ? 0
        : 0.38;

    if (sIdx > 0 && transDur > 0 && localTime < transDur) {
      const prevScene = scenesMeta[sIdx - 1];
      renderSingleScene(ctxA, prevScene, prevScene.durSec, tSec);
      renderSingleScene(ctxB, curScene, localTime, tSec);

      const origin = curScene.id === 'S04_EXPLOSION_165X'
        ? { x: 765, y: 1280 }
        : { x: 540, y: 960 };

      compositeTransition(mainCtx, bufA, bufB, transType, localTime / transDur, origin);
    } else {
      renderSingleScene(mainCtx, curScene, localTime, tSec);
    }
  }

  return { renderFrame };
}
