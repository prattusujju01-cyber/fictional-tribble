// engine/scenes.js (v2.0)
// Master 12-Scene Pure-Code + Real-Internet-Clips Choreographer with Continuous 2.5D/3D Camera Rig

import {
  W, H, clamp, lerp, easeOutCubic, easeOutQuart, easeInOutCubic, easeInOutQuart,
  withCameraPlane, drawStudioBackdrop, compositeTransition, roundRectPath
} from './math_color.js';
import { drawOpticalMarkup, drawTrackedCaps, drawOdometer } from './typography.js';
import { SovereignMapStage } from './geo_map.js';
import {
  drawFrostedCard, drawChapterRail, drawCuriosityLockWidget,
  drawRocketBarComparison, drawExplodedSmartphone3D, drawPollWidget, drawDMShareCard
} from './widgets.js';

export function createDirector({ canvas, script, geo, clipBank }) {
  const mainCtx = canvas.getContext('2d');
  const mapStage = new SovereignMapStage(geo);

  const bufA = document.createElement('canvas');
  bufA.width = W; bufA.height = H;
  const ctxA = bufA.getContext('2d');

  const bufB = document.createElement('canvas');
  bufB.width = W; bufB.height = H;
  const ctxB = bufB.getContext('2d');

  const scenesMeta = script.scenes.map((sc, idx) => ({
    ...sc,
    index: idx,
    durSec: Math.max(0.1, sc.endSec - sc.startSec)
  }));

  function renderSingleScene(ctx, sc, localTimeSec, globalFrameIdx, globalTimeSec) {
    const p = clamp(localTimeSec / sc.durSec, 0, 1);
    const id = sc.id;

    // Continuous 2.5D Virtual Camera motion on EVERY scene (zero dead static frames!)
    const sceneCam = {
      zoom: lerp(0.965, 1.045, easeInOutCubic(p)),
      panX: Math.sin(p * Math.PI) * 10,
      panY: lerp(12, -10, easeOutCubic(p)),
      roll: 0,
      pivotX: 540,
      pivotY: 900
    };

    // Layer 0: Studio radial atmosphere
    drawStudioBackdrop(ctx, sc.palette, globalTimeSec);

    // =========================================================================
    // S01: PARADOX IMPORT HOOK (Asia Map Push-In + 3 Live Real-Video Import Cards)
    // =========================================================================
    if (id === 'S01_HOOK_IMPORT') {
      const mapCam = {
        lon: lerp(85.5, 79.0, easeOutCubic(p)),
        lat: lerp(24.0, 20.5, easeOutCubic(p)),
        scale: lerp(480, 690, easeInOutCubic(p)),
        cx: 675,
        cy: 730
      };

      withCameraPlane(ctx, sceneCam, 0.75, () => {
        mapStage.draw(ctx, mapCam, { dofBlur: 0, alpha: 1, indiaGlow: 1.0, indiaFillMode: 'gold' });
      });

      withCameraPlane(ctx, sceneCam, 1.0, () => {
        const ports = [
          mapStage.project(69.7, 22.8, mapCam), // Mundra Port, Gujarat
          mapStage.project(72.9, 18.9, mapCam), // JNPT Mumbai
          mapStage.project(80.3, 13.1, mapCam)  // Chennai Port
        ];
        const cards = [
          { clip: 'mundra_port', title: '75%', tag: 'IMPORTED', delay: 0.04 },
          { clip: 'india_phone_factory', title: 'Only 2', tag: 'FACTORIES', delay: 0.18 },
          { clip: 'smt_robotics', title: '#153', tag: 'EXPORT RANK', delay: 0.32 }
        ];

        for (let i = 0; i < cards.length; i++) {
          const c = cards[i];
          const cp = easeOutCubic(clamp((p - c.delay) / 0.24, 0, 1));
          if (cp > 0.01) {
            const cx = 62 - (1 - cp) * 44;
            const cy = 220 + i * 242;
            const cw = 396, ch = 216;

            mapStage.drawExportArc(
              ctx,
              [cx + cw, cy + ch * 0.5],
              ports[i],
              clamp((p - c.delay - 0.05) / 0.32, 0, 1),
              { color: '#9EC5FF', glowColor: 'rgba(158, 197, 255, 0.78)', lift: 0.10 }
            );

            clipBank.drawClipCard(ctx, c.clip, globalFrameIdx + i * 17, cx, cy, cw, ch, {
              radius: 24,
              titleItalic: c.title,
              tagCaps: c.tag,
              alpha: cp,
              zoom: lerp(1.02, 1.12, p),
              borderColor: 'rgba(186, 218, 255, 0.78)'
            });
          }
        }
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1385, maxWidth: 920, fontSize: 56,
        progress: clamp(p / 0.82, 0, 1),
        italicColor: '#9EC5FF'
      });
    }

    // =========================================================================
    // S02: DEEP ZOOM INTO CHENNAI & BENGALURU CORRIDOR (99.2%) + CURIOSITY LOCK
    // =========================================================================
    else if (id === 'S02_HOOK_LOCK') {
      // Beat A (0..0.50): Macro zoom into South India Electronics Corridor (Chennai + Bengaluru real drone clips!)
      // Beat B (0.50..1.00): Pull back to All-India + plant Curiosity Lock 🔒 -> dock top-right!
      const lockPhase = clamp((p - 0.50) / 0.50, 0, 1);
      const diveT = p < 0.50
        ? easeInOutCubic(p / 0.50)
        : 1 - easeInOutCubic((p - 0.50) / 0.32);

      const mapCam = {
        lon: lerp(79.2, 79.0, clamp(diveT, 0, 1)),
        lat: lerp(21.8, 14.2, clamp(diveT, 0, 1)),
        scale: lerp(720, 1520, clamp(diveT, 0, 1)),
        cx: 540,
        cy: lerp(930, 980, clamp(diveT, 0, 1))
      };

      mapStage.draw(ctx, mapCam, {
        dofBlur: lockPhase * 12,
        alpha: lerp(1.0, 0.36, lockPhase),
        indiaGlow: 1.0,
        indiaFillMode: 'warm'
      });

      // Beat A: Live Real Aerial Clips of Chennai & Bengaluru Electronics Hubs anchored to exact coordinates!
      const beatAAlpha = 1 - clamp((p - 0.44) / 0.09, 0, 1);
      if (beatAAlpha > 0.01) {
        const chennaiPt = mapStage.project(80.27, 13.08, mapCam);
        const blrPt = mapStage.project(77.59, 12.97, mapCam);

        const cardAppear = easeOutCubic(clamp((p - 0.08) / 0.22, 0, 1)) * beatAAlpha;
        // Leader lines + glowing pins on Chennai & Bengaluru
        ctx.save();
        ctx.globalAlpha = cardAppear;
        for (const [pt, tx, ty] of [[blrPt, 260, 960], [chennaiPt, 820, 1180]]) {
          ctx.strokeStyle = '#FFFBEB';
          ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(pt[0], pt[1]); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.fillStyle = '#FACC15';
          ctx.shadowColor = '#FACC15'; ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.arc(pt[0], pt[1], 8, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();

        clipBank.drawClipCard(ctx, 'bengaluru_ecity', globalFrameIdx, 64, 760, 410, 232, {
          radius: 24, titleItalic: 'Bengaluru', tagCaps: 'KARNATAKA', alpha: cardAppear, zoom: 1 + p * 0.12
        });
        clipBank.drawClipCard(ctx, 'chennai_corridor', globalFrameIdx + 12, 606, 1055, 410, 232, {
          radius: 24, titleItalic: 'Chennai', tagCaps: 'TAMIL NADU', alpha: cardAppear, zoom: 1 + p * 0.12
        });

        // Constant-slot zero-glitch 99.2% drum odometer at top!
        drawOdometer(ctx, {
          startValue: 26.0,
          value: 99.2,
          decimals: 1,
          suffix: '%',
          progress: clamp(p / 0.34, 0, 1),
          x: 540, y: 345,
          fontSize: 162, weight: 300,
          color: '#FFFFFF', suffixColor: '#FDE68A',
          alpha: beatAAlpha
        });

        drawOpticalMarkup(ctx, sc.beatACaption, {
          x: 540, y: 465, maxWidth: 900, fontSize: 52,
          progress: clamp(p / 0.38, 0, 1),
          alpha: beatAAlpha,
          italicColor: '#FDE68A'
        });
      }

      // Beat B: Smooth crossfade into Curiosity Lock plant -> top-right dock
      const beatBAlpha = clamp((p - 0.47) / 0.09, 0, 1);
      if (beatBAlpha > 0.01) {
        drawOpticalMarkup(ctx, sc.beatBCaption, {
          x: 540, y: 420, maxWidth: 880, fontSize: 58,
          progress: clamp((p - 0.49) / 0.36, 0, 1),
          alpha: beatBAlpha,
          italicColor: '#FDE68A'
        });
        drawCuriosityLockWidget(ctx, 'plant', lockPhase);
      }
    }

    // =========================================================================
    // S03: 2014 BASELINE (DOF Map + Real Port Clip + ₹1,566 Cr + Ghost Target)
    // =========================================================================
    else if (id === 'S03_BASELINE_2014') {
      const mapCam = { lon: 79.5, lat: 22.5, scale: lerp(840, 920, p), cx: 540, cy: 960 };
      mapStage.draw(ctx, mapCam, { dofBlur: 14, alpha: 0.25, indiaGlow: 0.7 });

      withCameraPlane(ctx, sceneCam, 1.0, () => {
        const hp = easeOutCubic(clamp(p / 0.20, 0, 1));
        ctx.save();
        ctx.globalAlpha = hp;
        ctx.font = '300 148px PlusJakarta';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('2014', 92, 415);
        ctx.restore();
        drawTrackedCaps(ctx, 'MOBILE PHONE EXPORTS', 98, 468, {
          fontSize: 20, tracking: 3.5, color: '#9EC5FF', alpha: hp
        });

        // Live Mundra Port import dependence clip on upper-left
        clipBank.drawClipCard(ctx, 'mundra_port', globalFrameIdx, 92, 520, 390, 220, {
          radius: 22, titleItalic: 'Rank #153', tagCaps: '2014 EXPORTS',
          alpha: easeOutCubic(clamp((p - 0.10) / 0.24, 0, 1)),
          zoom: 1.0 + p * 0.10
        });

        drawOdometer(ctx, {
          startValue: 0,
          value: 1566,
          prefix: '₹',
          progress: clamp((p - 0.12) / 0.44, 0, 1),
          x: 285, y: 1155,
          fontSize: 88, weight: 300,
          color: '#FFFFFF',
          align: 'center'
        });
        ctx.save();
        ctx.font = 'italic 400 50px InstrumentSerif';
        ctx.fillStyle = '#FDE68A';
        ctx.textAlign = 'center';
        ctx.fillText('crore', 285, 1218);
        ctx.restore();

        drawRocketBarComparison(ctx, {
          baselineY: 1280,
          leftX: 285,
          rightX: 760,
          barW: 205,
          leftBarH: 20,
          maxRightBarH: 700,
          rightProgress: 0,
          showGhost: true,
          tSec: globalTimeSec
        });
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1445, maxWidth: 910, fontSize: 52,
        progress: clamp(p / 0.80, 0, 1),
        italicColor: '#FDE68A'
      });
    }

    // =========================================================================
    // S04: 165X EXPORT EXPLOSION (Crimson-Amber Radial Iris + Rocket Gold Column)
    // =========================================================================
    else if (id === 'S04_EXPLOSION_165X') {
      const mapCam = { lon: 79.5, lat: 22.5, scale: lerp(900, 990, p), cx: 540, cy: 940 };
      mapStage.draw(ctx, mapCam, { dofBlur: 15, alpha: 0.20, indiaFillMode: 'warm' });

      const barP = clamp((p - 0.04) / 0.44, 0, 1);

      withCameraPlane(ctx, sceneCam, 1.0, () => {
        drawRocketBarComparison(ctx, {
          baselineY: 1290,
          leftX: 265,
          rightX: 765,
          barW: 210,
          leftBarH: 20,
          maxRightBarH: 690,
          rightProgress: barP,
          showGhost: barP < 0.96,
          tSec: globalTimeSec
        });

        ctx.save();
        ctx.font = '300 64px PlusJakarta';
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.textAlign = 'center';
        ctx.fillText('₹1,566', 265, 1185);
        ctx.font = 'italic 400 42px InstrumentSerif';
        ctx.fillStyle = '#FFE484';
        ctx.fillText('crore', 265, 1234);
        ctx.restore();
        drawTrackedCaps(ctx, '2014', 265, 1336, { fontSize: 18, tracking: 3.2, align: 'center' });
        drawTrackedCaps(ctx, 'TODAY', 765, 1336, { fontSize: 20, tracking: 3.8, align: 'center', color: '#FFFDF2' });

        // Constant-slot zero-jitter ₹2,60,000 crore odometer!
        drawOdometer(ctx, {
          startValue: 1566,
          value: 260000,
          indianGrouping: true,
          prefix: '₹',
          progress: barP,
          x: 650, y: 435,
          fontSize: 124, weight: 300,
          color: '#FFFFFF',
          align: 'center'
        });
        ctx.save();
        ctx.font = 'italic 400 62px InstrumentSerif';
        ctx.fillStyle = '#FFF7D6';
        ctx.textAlign = 'center';
        ctx.fillText('crore', 765, 510);
        ctx.restore();

        if (p > 0.34) {
          const mp = clamp((p - 0.34) / 0.32, 0, 1);
          drawOdometer(ctx, {
            startValue: 1,
            value: 165,
            suffix: '×',
            progress: mp,
            x: 280, y: 825,
            fontSize: 142, weight: 300,
            color: '#FFFFFF',
            suffixColor: '#FFF7D6',
            align: 'center',
            alpha: easeOutCubic(mp)
          });
          ctx.save();
          ctx.globalAlpha = easeOutCubic(mp);
          ctx.font = 'italic 400 56px InstrumentSerif';
          ctx.fillStyle = '#FFE484';
          ctx.textAlign = 'center';
          ctx.fillText('times more', 280, 896);
          ctx.restore();
        }
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1455, maxWidth: 920, fontSize: 52,
        progress: clamp(p / 0.82, 0, 1),
        italicColor: '#FFF7D6'
      });
    }

    // =========================================================================
    // S05: PLI MISSION MODE + LIVE INDIAN FACTORY VIDEO + 300+ FACTORIES MATRIX
    // =========================================================================
    else if (id === 'S05_MECHANISM_PLI') {
      const mapCam = { lon: 79.5, lat: 22.5, scale: lerp(880, 960, p), cx: 540, cy: 960 };
      mapStage.draw(ctx, mapCam, { dofBlur: 14, alpha: 0.24 });

      withCameraPlane(ctx, sceneCam, 1.0, () => {
        const cardP = easeOutCubic(clamp(p / 0.18, 0, 1));
        const toggleP = easeOutQuart(clamp((p - 0.16) / 0.22, 0, 1));

        drawFrostedCard(ctx, 84, 225, 912, 255, {
          radius: 30,
          fill: 'rgba(18, 34, 150, 0.65)',
          borderTop: 'rgba(255, 255, 255, 0.58)',
          glowColor: toggleP > 0.5 ? 'rgba(250, 204, 21, 0.32)' : null,
          glowBlur: 32 * toggleP,
          alpha: cardP
        });

        drawTrackedCaps(ctx, '• PRODUCTION LINKED INCENTIVE (PLI)', 130, 276, {
          fontSize: 17, tracking: 2.8, color: '#FDE68A', alpha: cardP
        });

        ctx.save();
        ctx.globalAlpha = cardP;
        ctx.font = '400 52px PlusJakarta';
        ctx.fillStyle = '#FFFFFF';
        const m1 = 'Manufacturing ';
        ctx.fillText(m1, 130, 362);
        const m1W = ctx.measureText(m1).width;
        ctx.font = 'italic 400 64px InstrumentSerif';
        ctx.fillStyle = '#FDE68A';
        ctx.fillText('Mission Mode', 130 + m1W, 362);
        ctx.restore();

        drawTrackedCaps(ctx, 'POLICY SWITCH', 130, 430, { fontSize: 20, tracking: 3.4, alpha: cardP });
        drawTrackedCaps(ctx, toggleP > 0.5 ? 'ACTIVE' : 'OFF', 754, 430, { fontSize: 20, tracking: 3.0, align: 'right', color: '#FDE68A', alpha: cardP });

        const tx = 776, ty = 402, tw = 148, th = 56;
        roundRectPath(ctx, tx, ty, tw, th, 28);
        ctx.fillStyle = toggleP > 0.3 ? `rgba(250, 204, 21, ${(0.25 + 0.72 * toggleP).toFixed(2)})` : 'rgba(255,255,255,0.18)';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(lerp(tx + 30, tx + tw - 30, toggleP), ty + 28, 22, 0, Math.PI * 2); ctx.fill();

        // Left: Live Real Indian Phone Factory Floor Video Card | Right: 300+ Odometer & 8x8 Golden Matrix!
        const gridP = clamp((p - 0.30) / 0.46, 0, 1);
        clipBank.drawClipCard(ctx, 'india_phone_factory', globalFrameIdx, 84, 540, 430, 265, {
          radius: 24, titleItalic: 'Noida & Chennai', tagCaps: 'CLEANROOMS',
          alpha: easeOutCubic(clamp((p - 0.22) / 0.22, 0, 1)),
          zoom: 1.0 + p * 0.12
        });

        drawOdometer(ctx, {
          startValue: 2,
          value: 300,
          suffix: '+',
          progress: gridP,
          x: 760, y: 695,
          fontSize: 126, weight: 300,
          color: '#FFFFFF', suffixColor: '#FDE68A',
          align: 'center'
        });
        drawTrackedCaps(ctx, 'MOBILE FACTORIES IN INDIA', 760, 755, {
          fontSize: 18, tracking: 2.8, align: 'center', color: '#9EC5FF'
        });

        // 10x5 Crisp Rounded Glass Factory Tile Matrix (1 tile = 6 factories -> 300+!)
        const cols = 10, rows = 5, tileS = 72, gap = 12;
        const totalTiles = cols * rows;
        const lit = Math.max(1, Math.round(lerp(1, totalTiles, easeOutQuart(gridP))));
        const gw = cols * tileS + (cols - 1) * gap;
        const gx0 = (W - gw) / 2, gy0 = 855;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const x0 = gx0 + c * (tileS + gap);
            const y0 = gy0 + r * (tileS + gap);
            roundRectPath(ctx, x0, y0, tileS, tileS, 15);
            if (idx < lit) {
              ctx.fillStyle = '#FACC15';
              ctx.fill();
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
              ctx.fill();
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
              ctx.lineWidth = 1.3;
              ctx.stroke();
            }
          }
        }
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1385, maxWidth: 920, fontSize: 52,
        progress: clamp(p / 0.82, 0, 1),
        italicColor: '#FDE68A'
      });
    }

    // =========================================================================
    // S06: LASER BLUEPRINT X-RAY + 3D EXPLODED PHONE + REAL SMT & CHENNAI CLIPS
    // =========================================================================
    else if (id === 'S06_BLUEPRINT_XRAY') {
      const stepNum = Math.min(4, 1 + Math.floor(p * 4));
      ctx.save();
      ctx.font = '600 26px PlusJakarta';
      ctx.fillStyle = '#F7C948';
      ctx.fillText(`0${stepNum}`, 90, 268);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.fillText('04', 350, 268);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(146, 258, 184, 4);
      ctx.fillStyle = '#F7C948';
      ctx.fillRect(146, 258, 184 * (stepNum / 4), 4);
      ctx.restore();

      withCameraPlane(ctx, {
        zoom: lerp(0.94, 1.05, easeInOutCubic(p)),
        panX: 0, panY: lerp(15, -15, p), pivotX: 540, pivotY: 960
      }, 1.0, () => {
        drawExplodedSmartphone3D(ctx, {
          cx: 540,
          cy: 890,
          explodeProgress: clamp(p / 0.34, 0, 1),
          yawDeg: lerp(-34, -17, p),
          pitchDeg: lerp(24, 29, p),
          stepActive: stepNum
        });

        // Two live real-world footage windows below cutaway: SMT Robotics + Chennai Corridor!
        const clipA = easeOutCubic(clamp((p - 0.22) / 0.24, 0, 1));
        clipBank.drawClipCard(ctx, 'smt_robotics', globalFrameIdx, 82, 1280, 440, 210, {
          radius: 20, titleItalic: 'SMT Line', tagCaps: 'CIRCUIT BOARDS',
          alpha: clipA, borderColor: 'rgba(91, 192, 255, 0.75)', zoom: 1 + p * 0.1
        });
        clipBank.drawClipCard(ctx, 'chennai_corridor', globalFrameIdx + 20, 558, 1280, 440, 210, {
          radius: 20, titleItalic: 'Chennai', tagCaps: 'TAMIL NADU',
          alpha: clipA, borderColor: 'rgba(247, 201, 72, 0.78)', zoom: 1 + p * 0.1
        });
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1565, maxWidth: 930, fontSize: 48,
        progress: clamp(p / 0.82, 0, 1),
        italicColor: '#F7C948'
      });
    }

    // =========================================================================
    // S07: UNLOCKING SECRET NUMBER (🔓 10+/SEC) + FULL-BLEED REAL FACTORY TINT
    // =========================================================================
    else if (id === 'S07_SECRET_UNLOCKED') {
      clipBank.drawFullBleedClip(ctx, 'india_phone_factory', globalFrameIdx, {
        alpha: 0.26, zoom: lerp(1.04, 1.14, p),
        tintTop: 'rgba(8, 18, 130, 0.76)',
        tintMid: 'rgba(6, 12, 98, 0.68)',
        tintBot: 'rgba(3, 4, 58, 0.88)'
      });

      withCameraPlane(ctx, sceneCam, 1.0, () => {
        // 7-Flagship Row -> Phone #1 blazes Saffron-Gold ("1 IN 7 iPHONES ON EARTH")
        const rowP = easeOutCubic(clamp((p - 0.34) / 0.28, 0, 1));
        if (rowP > 0.01) {
          const count = 7, pw = 96, ph = 186, gap = 22;
          const totalW = count * pw + (count - 1) * gap;
          const sx0 = (W - totalW) / 2, sy0 = 420;

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
            ctx.fillStyle = isIndia ? '#FACC15' : 'rgba(255, 255, 255, 0.12)';
            ctx.fill();
            ctx.strokeStyle = isIndia ? '#FFFBEB' : 'rgba(255, 255, 255, 0.42)';
            ctx.lineWidth = isIndia ? 2.6 : 1.6;
            ctx.stroke();

            roundRectPath(ctx, px + pw * 0.30, sy0 + 12, pw * 0.40, 8, 4);
            ctx.fillStyle = isIndia ? '#1E1B4B' : 'rgba(255,255,255,0.45)';
            ctx.fill();
            ctx.restore();
          }
          ctx.restore();

          drawTrackedCaps(ctx, '1 IN EVERY 7 iPHONES ON EARTH IS NOW BUILT IN INDIA', 540, 660, {
            fontSize: 20, tracking: 3.0, align: 'center', color: '#FDE68A', alpha: rowP
          });
        }

        // Curiosity Lock flies to center & unlocks 10+ with constant-slot drum!
        ctx.save();
        ctx.translate(0, -160);
        drawCuriosityLockWidget(ctx, 'unlock', p);
        ctx.restore();
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1385, maxWidth: 920, fontSize: 52,
        progress: clamp(p / 0.82, 0, 1),
        italicColor: '#FDE68A'
      });
    }

    // =========================================================================
    // S08: KINETIC GLOBAL CAMERA FLIGHT (India -> UAE -> Europe -> UK -> US -> Japan)
    // =========================================================================
    else if (id === 'S08_GLOBAL_SHOCKWAVE') {
      // Dynamic camera flight starting zoomed on India (scale 460) and sweeping out to Global Panorama (scale 195)!
      const flight = easeInOutQuart(clamp(p / 0.68, 0, 1));
      const mapCam = {
        lon: lerp(76.0, 28.0, flight),
        lat: lerp(22.0, 28.0, flight),
        scale: lerp(460, 195, flight),
        cx: lerp(540, 560, flight),
        cy: 860
      };

      const destinations = [
        { iso: 'ARE', label: 'UAE', lon: 54.4, lat: 24.4, delay: 0.06 },
        { iso: 'NLD', label: 'EUROPE', lon: 5.5, lat: 52.2, delay: 0.18 },
        { iso: 'GBR', label: 'UK', lon: -2.0, lat: 54.0, delay: 0.30 },
        { iso: 'USA', label: 'USA • #1', lon: -92.0, lat: 38.5, delay: 0.42 },
        { iso: 'JPN', label: 'JAPAN', lon: 138.2, lat: 36.2, delay: 0.54 }
      ];

      const hl = {};
      for (const d of destinations) {
        hl[d.iso] = clamp((p - d.delay - 0.14) / 0.18, 0, 1);
      }

      mapStage.draw(ctx, mapCam, {
        dofBlur: 0,
        alpha: 1,
        highlightedIsos: hl,
        indiaGlow: 1.0,
        indiaFillMode: 'warm'
      });

      const indiaOrigin = mapStage.project(78.5, 20.5, mapCam);
      for (const d of destinations) {
        const dp = clamp((p - d.delay) / 0.30, 0, 1);
        const destPt = mapStage.project(d.lon, d.lat, mapCam);
        mapStage.drawExportArc(ctx, indiaOrigin, destPt, dp, {
          color: '#FFE680',
          glowColor: 'rgba(250, 204, 21, 0.85)',
          lift: 0.24
        });

        if (dp > 0.68) {
          const la = clamp((dp - 0.68) / 0.32, 0, 1);
          const pillW = d.label.length * 14 + 36;
          drawFrostedCard(ctx, destPt[0] - pillW / 2, destPt[1] - 54, pillW, 40, {
            radius: 20,
            fill: 'rgba(10, 22, 108, 0.88)',
            borderTop: 'rgba(255, 232, 130, 0.8)',
            alpha: la
          });
          drawTrackedCaps(ctx, d.label, destPt[0], destPt[1] - 33, {
            fontSize: 14, tracking: 2.2, align: 'center', color: '#FFFBEB', alpha: la
          });
        }
      }

      // Live Mundra Export Mega-Ship Card bottom-center above caption
      clipBank.drawClipCard(ctx, 'mundra_port', globalFrameIdx + 30, 310, 1105, 460, 225, {
        radius: 24, titleItalic: 'Export Hub', tagCaps: 'INDIA TO 80+ MARKETS',
        alpha: easeOutCubic(clamp((p - 0.24) / 0.24, 0, 1)),
        zoom: 1.02 + p * 0.10
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1415, maxWidth: 920, fontSize: 52,
        progress: clamp(p / 0.82, 0, 1),
        italicColor: '#FDE68A'
      });
    }

    // =========================================================================
    // S09: "NOW, THE HONEST PART" (Live Semiconductor Wafer Cleanroom + 3nm Die)
    // =========================================================================
    else if (id === 'S09_HONEST_PART') {
      const mapCam = { lon: 79.5, lat: 22.5, scale: 880, cx: 540, cy: 980 };
      mapStage.draw(ctx, mapCam, { dofBlur: 15, alpha: 0.20, indiaFillMode: 'purple' });

      withCameraPlane(ctx, sceneCam, 1.0, () => {
        const cp = easeOutCubic(clamp((p - 0.08) / 0.28, 0, 1));
        drawFrostedCard(ctx, 84, 300, 912, 960, {
          radius: 36,
          fill: 'rgba(14, 22, 86, 0.68)',
          borderTop: 'rgba(125, 211, 252, 0.60)',
          alpha: cp
        });

        // Live Real Semiconductor Wafer Cleanroom Video inside card!
        clipBank.drawClipCard(ctx, 'semicon_cleanroom', globalFrameIdx, 134, 355, 812, 430, {
          radius: 26, titleItalic: '3nm Silicon Wafer', tagCaps: 'STILL IMPORTED',
          alpha: cp, borderColor: 'rgba(125, 211, 252, 0.78)', zoom: 1.02 + p * 0.10
        });

        // Assembly vs Chip Fabrication progress comparison bars
        const bars = [
          { label: 'FINAL PHONE ASSEMBLY IN INDIA', pct: '99.2%', fillW: 0.992, col: '#FACC15', y: 885 },
          { label: 'CORE SILICON CHIP FABRICATION TODAY', pct: '< 5%', fillW: 0.08, col: '#7DD3FC', y: 1055 }
        ];
        ctx.save();
        ctx.globalAlpha = cp;
        for (const b of bars) {
          drawTrackedCaps(ctx, b.label, 140, b.y, { fontSize: 18, tracking: 2.8, color: 'rgba(255,255,255,0.88)' });
          drawTrackedCaps(ctx, b.pct, 940, b.y, { fontSize: 24, tracking: 2.0, align: 'right', color: b.col });

          roundRectPath(ctx, 140, b.y + 28, 800, 34, 17);
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          ctx.fill();

          const animW = Math.max(34, 800 * b.fillW * easeOutQuart(clamp((p - 0.18) / 0.45, 0, 1)));
          roundRectPath(ctx, 140, b.y + 28, animW, 34, 17);
          ctx.fillStyle = b.col;
          ctx.fill();
        }
        ctx.restore();
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1405, maxWidth: 900, fontSize: 54,
        progress: clamp(p / 0.80, 0, 1),
        italicColor: '#7DD3FC'
      });
    }

    // =========================================================================
    // S10: GUJARAT & ASSAM MACRO PAN -> FACTORY vs SUPERPOWER GLASS MONUMENT
    // =========================================================================
    else if (id === 'S10_SEMICON_SUPERPOWER') {
      const splitP = clamp((p - 0.44) / 0.10, 0, 1);

      // Beat A camera sweeps from Gujarat (Dholera/Sanand 72.3E) across India to Assam (Morigaon 92.3E)!
      const sweepE = easeInOutCubic(clamp(p / 0.42, 0, 1));
      const mapCam = {
        lon: lerp(74.0, 82.5, sweepE),
        lat: lerp(23.2, 24.5, sweepE),
        scale: lerp(1280, 940, sweepE),
        cx: 540,
        cy: 960
      };

      mapStage.draw(ctx, mapCam, {
        dofBlur: splitP * 15,
        alpha: lerp(1.0, 0.26, splitP),
        indiaGlow: 1.0,
        indiaFillMode: 'gold'
      });

      // Beat A: 5 Semiconductor Fabs in Gujarat & Assam + ₹1.52 Lakh Cr Odometer
      if (splitP < 0.99) {
        const fadeA = 1 - splitP;
        drawOdometer(ctx, {
          startValue: 0.10,
          value: 1.52,
          decimals: 2,
          prefix: '₹',
          suffix: 'Lakh Cr',
          suffixItalicSerif: true,
          progress: clamp(p / 0.28, 0, 1),
          x: 540, y: 345,
          fontSize: 118, weight: 300,
          color: '#FFFFFF', suffixColor: '#FDE68A',
          alpha: fadeA
        });
        drawTrackedCaps(ctx, '5 SEMICONDUCTOR FABS UNDER CONSTRUCTION', 540, 412, {
          fontSize: 19, tracking: 3.2, align: 'center', color: '#9EC5FF', alpha: fadeA
        });

        const fabs = [
          { name: 'DHOLERA & SANAND (×4) • GUJARAT', lon: 72.25, lat: 22.6, lx: 74, ly: 760 },
          { name: 'MORIGAON OSAT • ASSAM', lon: 92.35, lat: 26.25, lx: 560, ly: 660 }
        ];
        ctx.save();
        ctx.globalAlpha = fadeA;
        for (const f of fabs) {
          const pt = mapStage.project(f.lon, f.lat, mapCam);
          ctx.strokeStyle = '#FFFBEB'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(pt[0], pt[1]); ctx.lineTo(f.lx + 210, f.ly + 60); ctx.stroke();
          ctx.fillStyle = '#FACC15'; ctx.shadowColor = '#FACC15'; ctx.shadowBlur = 22;
          ctx.beginPath(); ctx.arc(pt[0], pt[1], 11, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;

          drawFrostedCard(ctx, f.lx, f.ly, 435, 64, {
            radius: 18, fill: 'rgba(10, 22, 112, 0.88)', borderTop: 'rgba(255, 232, 130, 0.85)'
          });
          drawTrackedCaps(ctx, f.name, f.lx + 217, f.ly + 33, {
            fontSize: 15, tracking: 2.0, align: 'center', color: '#FFFBEB'
          });
        }
        ctx.restore();

        drawOpticalMarkup(ctx, sc.beatACaption, {
          x: 540, y: 1410, maxWidth: 910, fontSize: 52,
          progress: clamp(p / 0.36, 0, 1),
          alpha: fadeA,
          italicColor: '#FDE68A'
        });
      }

      // Beat B: Dual Stacked Frosted Glass Cards with Real Live Clip Miniatures inside!
      if (p >= 0.44) {
        const card1P = easeOutCubic(clamp((p - 0.44) / 0.16, 0, 1));
        const card2P = easeOutCubic(clamp((p - 0.60) / 0.18, 0, 1));
        const dim1 = lerp(1.0, 0.42, card2P);

        withCameraPlane(ctx, sceneCam, 1.0, () => {
          drawFrostedCard(ctx, 86, 255, 908, 445, {
            radius: 34,
            fill: 'rgba(255, 255, 255, 0.08)',
            borderTop: 'rgba(255, 255, 255, 0.40)',
            alpha: card1P * dim1,
            blurPx: card2P * 4.5
          });
          ctx.save();
          ctx.globalAlpha = card1P * dim1;
          if (card2P > 0.1) ctx.filter = `blur(${(card2P * 4).toFixed(1)}px)`;
          drawTrackedCaps(ctx, 'A COUNTRY THAT ONLY ASSEMBLES PHONES', 138, 322, { fontSize: 19, tracking: 3.2 });
          ctx.font = 'italic 400 132px InstrumentSerif';
          ctx.fillStyle = '#C7D2FE';
          ctx.fillText('factory', 138, 468);
          for (const [k, lbl] of [[0, 'Imported Chips'], [1, 'Imported Glass'], [2, 'Thin Margins']]) {
            drawFrostedCard(ctx, 138 + k * 272, 522, 252, 134, { radius: 20, fill: 'rgba(15, 23, 95, 0.58)' });
            ctx.font = 'italic 400 34px InstrumentSerif';
            ctx.fillStyle = '#E2E8F0';
            ctx.fillText(lbl, 162 + k * 272, 602);
          }
          ctx.restore();

          if (card2P > 0.01) {
            drawFrostedCard(ctx, 86, 750, 908, 515, {
              radius: 34,
              fill: 'rgba(255, 244, 214, 0.16)',
              borderTop: 'rgba(255, 238, 165, 0.94)',
              borderWidth: 2.2,
              glowColor: 'rgba(250, 204, 21, 0.36)',
              glowBlur: 36,
              alpha: card2P
            });
            drawTrackedCaps(ctx, 'A COUNTRY THAT BUILDS THE CHIPS', 138, 818, {
              fontSize: 19, tracking: 3.4, color: '#FFFBEB', alpha: card2P
            });
            ctx.save();
            ctx.globalAlpha = card2P;
            ctx.font = 'italic 400 132px InstrumentSerif';
            ctx.fillStyle = '#FFE896';
            ctx.fillText('superpower', 138, 962);
            ctx.restore();

            // 3 Live Real Video Miniatures inside "superpower" card (exact match to ref_b_glass_comparison_cards.jpg!)
            const miniClips = [
              { clip: 'semicon_cleanroom', title: 'Dholera Fab' },
              { clip: 'smt_robotics', title: 'Sanand OSAT' },
              { clip: 'bengaluru_ecity', title: 'Chip Design' }
            ];
            for (let k = 0; k < 3; k++) {
              clipBank.drawClipCard(
                ctx, miniClips[k].clip, globalFrameIdx + k * 15,
                138 + k * 272, 1022, 254, 196,
                { radius: 20, titleItalic: miniClips[k].title, alpha: card2P, zoom: 1.06 }
              );
            }
          }
        });

        drawOpticalMarkup(ctx, sc.beatBCaption, {
          x: 540, y: 1385, maxWidth: 910, fontSize: 52,
          progress: clamp((p - 0.46) / 0.44, 0, 1),
          alpha: splitP,
          italicColor: '#FDE68A'
        });
      }
    }

    // =========================================================================
    // S11: INTERACTIVE 3-OPTION POLL OVER FULL-BLEED CHENNAI SUNSET AERIAL
    // =========================================================================
    else if (id === 'S11_POLL_CTA') {
      clipBank.drawFullBleedClip(ctx, 'chennai_corridor', globalFrameIdx, {
        alpha: 0.28, zoom: lerp(1.04, 1.14, p),
        tintTop: 'rgba(88, 24, 118, 0.78)',
        tintMid: 'rgba(168, 62, 58, 0.66)',
        tintBot: 'rgba(215, 128, 42, 0.80)'
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 365, maxWidth: 890, fontSize: 58,
        progress: clamp(p / 0.76, 0, 1),
        italicColor: '#FFF4B8'
      });

      withCameraPlane(ctx, sceneCam, 1.0, () => {
        const activeOpt = p < 0.42 ? 0 : p < 0.68 ? 1 : 2;
        drawPollWidget(ctx, [
          { label: 'iPhone' },
          { label: 'Samsung' },
          { label: 'OnePlus' }
        ], activeOpt, p);
      });
    }

    // =========================================================================
    // S12: INTERACTIVE DM SHARE CARD OVER BENGALURU AERIAL + INDIA GOLD HORIZON
    // =========================================================================
    else if (id === 'S12_SHARE_OUTRO') {
      clipBank.drawFullBleedClip(ctx, 'bengaluru_ecity', globalFrameIdx, {
        alpha: 0.24, zoom: lerp(1.04, 1.12, p),
        tintTop: 'rgba(10, 22, 130, 0.80)',
        tintMid: 'rgba(8, 16, 98, 0.72)',
        tintBot: 'rgba(4, 8, 56, 0.88)'
      });

      const mapCam = { lon: 79.5, lat: 22.0, scale: lerp(880, 940, p), cx: 540, cy: 1020 };
      mapStage.draw(ctx, mapCam, { dofBlur: 12, alpha: 0.28, indiaFillMode: 'warm' });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 390, maxWidth: 880, fontSize: 60,
        progress: clamp(p / 0.72, 0, 1),
        italicColor: '#FDE68A'
      });

      withCameraPlane(ctx, sceneCam, 1.0, () => {
        drawDMShareCard(ctx, p);
      });
    }

    // Persistent Top Chapter Rail & Docked Curiosity Lock Pill
    if (sc.showRail) {
      drawChapterRail(ctx, script.chapters, sc.chapter, 1.0);
    }
    if (sc.lockState === 'docked') {
      drawCuriosityLockWidget(ctx, 'docked', 1.0);
    }
  }

  function renderFrame(frameIdx) {
    const fps = script.fps || 30;
    const tSec = frameIdx / fps;

    let sIdx = scenesMeta.length - 1;
    for (let i = 0; i < scenesMeta.length; i++) {
      if (tSec < scenesMeta[i].endSec || i === scenesMeta.length - 1) {
        sIdx = i;
        break;
      }
    }

    const curScene = scenesMeta[sIdx];
    const localTime = Math.max(0, tSec - curScene.startSec);
    const transType = curScene.transitionIn || 'none';
    const transDur = transType === 'none' ? 0 : 0.56;

    if (sIdx > 0 && transDur > 0 && localTime < transDur) {
      const prevScene = scenesMeta[sIdx - 1];
      renderSingleScene(ctxA, prevScene, prevScene.durSec, frameIdx, tSec);
      renderSingleScene(ctxB, curScene, localTime, frameIdx, tSec);

      const origin = curScene.id === 'S04_EXPLOSION_165X'
        ? { x: 765, y: 1280 }
        : curScene.id === 'S02_HOOK_LOCK'
          ? { x: 675, y: 730 }
          : { x: 540, y: 920 };

      compositeTransition(mainCtx, bufA, bufB, transType, localTime / transDur, origin);
    } else {
      renderSingleScene(mainCtx, curScene, localTime, frameIdx, tSec);
    }
  }

  return { renderFrame };
}
