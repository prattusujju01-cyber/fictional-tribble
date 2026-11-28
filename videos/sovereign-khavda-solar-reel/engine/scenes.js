// engine/scenes.js
// Sovereign Data-Cinema v3.0 — 12-Scene High-Velocity Camera Choreography for Topic #4:
// "Visible From Space: How India Built a 30 GW Clean Power Plant 5x Larger Than Paris (Khavda, Kutch)"

import {
  W, H, clamp, lerp,
  easeOutCubic, easeOutQuart, easeInOutCubic,
  expoInOut, snapOutSpring, expScale,
  withCameraPlane, renderWithShutterBlur,
  drawStudioBackdrop, compositeV3Transition, roundRectPath
} from './camera_v3.js';
import { drawOpticalMarkup, drawTrackedCaps, drawOdometer } from './typography.js';
import { SovereignMapStage } from './geo_map.js';
import {
  drawFrostedCard,
  drawChapterRail,
  drawCuriosityLockWidget,
  drawSurge38xSolarMonument,
  drawWindTurbineGraphic,
  drawKhavdaSolarBlueprintXRay,
  drawParisVsKhavdaFootprint,
  drawPollWidget,
  drawDMShareCard
} from './solar_models.js';

const TRANS_DURATION = {
  none: 0.0,
  circular_portal_dive: 0.56,
  planetary_horizon_wipe: 0.52,
  radial_iris_punch: 0.48,
  snap_zoom_portal: 0.44,
  laser_blueprint_scan: 0.46,
  snap_zoomout_dof: 0.46,
  whip_pan_left: 0.40,
  whip_pan_up: 0.40
};

const KHAVDA = [69.72, 24.12]; // Great Rann of Kutch, Gujarat

function evalGeoKeyframes(t, stops) {
  if (!stops || !stops.length) return { lon: 79.0, lat: 22.8, scale: 1700, cx: 540, cy: 760, speed: 0 };
  if (t <= stops[0].t) return { ...stops[0], speed: 0 };
  const last = stops[stops.length - 1];
  if (t >= last.t) return { ...last, speed: 0 };

  let idx = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t < stops[i + 1].t) { idx = i; break; }
  }
  const a = stops[idx], b = stops[idx + 1];
  const dt = Math.max(0.001, b.t - a.t);
  const ease = (r) => (b.curve === 'spring' ? snapOutSpring(r) : b.curve === 'drift' ? easeInOutCubic(r) : expoInOut(r));
  const u = ease(clamp((t - a.t) / dt, 0, 1));

  const lon = lerp(a.lon, b.lon, u);
  const lat = lerp(a.lat, b.lat, u);
  const scale = expScale(a.scale, b.scale, u);
  const cx = lerp(a.cx ?? 540, b.cx ?? 540, u);
  const cy = lerp(a.cy ?? 760, b.cy ?? 760, u);

  const eps = 0.008;
  const u2 = ease(clamp((t + eps - a.t) / dt, 0, 1));
  const dLonPx = Math.abs(lerp(a.lon, b.lon, u2) - lon) * (Math.PI / 180) * scale / eps;
  const dLatPx = Math.abs(lerp(a.lat, b.lat, u2) - lat) * (Math.PI / 180) * scale / eps;
  const dZoomPx = Math.abs(Math.log(expScale(a.scale, b.scale, u2) / scale)) * 980 / eps;
  return { lon, lat, scale, cx, cy, speed: Math.hypot(dLonPx, dLatPx) + dZoomPx };
}

let geoScratch = null;
function renderGeoWithShutter(ctx, localTimeSec, geoStops, drawGeoAt) {
  const gNow = evalGeoKeyframes(localTimeSec, geoStops);
  if (gNow.speed < 520) {
    drawGeoAt(ctx, localTimeSec, gNow);
    return gNow;
  }
  if (!geoScratch) {
    geoScratch = document.createElement('canvas');
    geoScratch.width = W; geoScratch.height = H;
  }
  const sctx = geoScratch.getContext('2d');
  const samples = [
    { dt: -0.018, w: 0.16 },
    { dt: -0.012, w: 0.22 },
    { dt: -0.006, w: 0.28 },
    { dt:  0.000, w: 0.34 }
  ];
  let acc = 0;
  for (let i = 0; i < samples.length; i++) {
    const st = Math.max(0, localTimeSec + samples[i].dt);
    const sg = evalGeoKeyframes(st, geoStops);
    sctx.clearRect(0, 0, W, H);
    drawGeoAt(sctx, st, sg);
    acc += samples[i].w;
    ctx.save();
    ctx.globalAlpha = i === 0 ? 1.0 : samples[i].w / acc;
    ctx.drawImage(geoScratch, 0, 0);
    ctx.restore();
  }
  return gNow;
}

function drawPinBeacon(ctx, x, y, label, pulseT = 0, color = '#FACC15') {
  const ring = (pulseT * 1.4) % 1;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = (1 - ring) * 0.78;
  ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.arc(x, y, 10 + ring * 34, 0, Math.PI * 2); ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(x, y, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (label) {
    const tw = Math.max(160, label.length * 11.5 + 42);
    drawFrostedCard(ctx, x - tw / 2, y - 62, tw, 42, {
      radius: 21, fill: 'rgba(6, 14, 72, 0.88)', borderTop: 'rgba(255, 236, 153, 0.88)'
    });
    drawTrackedCaps(ctx, label, x, y - 41, { fontSize: 14, tracking: 2.2, align: 'center', color: '#FFFBEB' });
  }
  ctx.restore();
}

export function createDirector({ canvas, script, geo, clipBank }) {
  const mainCtx = canvas.getContext('2d');
  const mapStage = new SovereignMapStage(geo);

  const stageA = document.createElement('canvas');
  stageA.width = W; stageA.height = H;
  const stageB = document.createElement('canvas');
  stageB.width = W; stageB.height = H;

  const scenes = script.scenes;
  const chapters = script.chapters;
  const fps = script.fps || 30;

  const SOLAR_PARKS_ROUTE = [
    [69.72, 24.12], // Khavda, Gujarat (30 GW)
    [71.92, 27.53], // Bhadla, Rajasthan (2.25 GW)
    [81.30, 24.53], // Rewa, Madhya Pradesh
    [77.28, 14.10]  // Pavagada, Karnataka (2.05 GW)
  ];

  const SCRIM_RGB = {
    royalCobalt: [2, 1, 62],
    deepIndigo: [2, 1, 36],
    crimsonAmber: [50, 8, 59],
    blueprintDark: [1, 3, 11],
    patrioticDusk: [39, 10, 78]
  };

  function drawTopHudScrim(ctx, paletteName, strength = 0.72) {
    const [r, g, b] = SCRIM_RGB[paletteName] || SCRIM_RGB.royalCobalt;
    const grad = ctx.createLinearGradient(0, 0, 0, 200);
    grad.addColorStop(0.00, `rgba(${r}, ${g}, ${b}, ${(0.92 * strength).toFixed(3)})`);
    grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${(0.68 * strength).toFixed(3)})`);
    grad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 200);
    ctx.restore();
  }

  function drawBottomCaptionScrim(ctx, paletteName, strength = 0.92) {
    const [r, g, b] = SCRIM_RGB[paletteName] || SCRIM_RGB.royalCobalt;
    const grad = ctx.createLinearGradient(0, 1250, 0, H);
    grad.addColorStop(0.00, `rgba(${r}, ${g}, ${b}, 0)`);
    grad.addColorStop(0.22, `rgba(${r}, ${g}, ${b}, ${(0.88 * strength).toFixed(3)})`);
    grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${(0.96 * strength).toFixed(3)})`);
    grad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, ${(0.99 * strength).toFixed(3)})`);
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 1250, W, H - 1250);
    ctx.restore();
  }

  function caption(ctx, markup, localSec, opts = {}) {
    const { y = 1440, delay = 0.15, span = 3.8, alpha = 1, fontSize = 51 } = opts;
    drawOpticalMarkup(ctx, markup, {
      x: 540, y, maxWidth: 920, fontSize,
      progress: clamp((localSec - delay) / span, 0, 1),
      alpha
    });
  }

  function renderSingleScene(ctx, sc, localSec, frameIdx) {
    const dur = sc.endSec - sc.startSec;
    const p = clamp(localSec / dur, 0, 1);

    drawStudioBackdrop(ctx, sc.palette || 'royalCobalt', sc.startSec + localSec);

    // =====================================================================
    // S01 (0.0–5.5s): Rann of Kutch Salt Desert -> Snap Pull-Back onto India
    // =====================================================================
    if (sc.id === 'S01_SALT_DESERT_HOOK') {
      const geoStops = [
        { t: 0.00, lon: 70.1, lat: 23.9, scale: 7200, cx: 540, cy: 760, curve: 'spring' },
        { t: 0.58, lon: 79.0, lat: 22.8, scale: 1720, cx: 540, cy: 760, curve: 'spring' },
        { t: 4.82, lon: 78.6, lat: 23.2, scale: 1820, cx: 540, cy: 760, curve: 'drift' },
        { t: 5.50, lon: 71.2, lat: 24.0, scale: 3600, cx: 540, cy: 700, curve: 'whip' }
      ];

      const gCam = renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const velDof = clamp((gc.speed - 700) / 380, 0, 7);
        mapStage.draw(gctx, gc, { indiaFillMode: 'gold', indiaGlow: 1.0, dofBlur: velDof });
        const [kx, ky] = mapStage.project(KHAVDA[0], KHAVDA[1], gc);
        drawPinBeacon(gctx, kx, ky, 'RANN OF KUTCH', st, '#FACC15');
      });

      const [kx, ky] = mapStage.project(KHAVDA[0], KHAVDA[1], gCam);
      const exitWhip = expoInOut(clamp((localSec - 4.85) / 0.62, 0, 1));

      const cards = [
        { name: 'rann_of_kutch_salt', title: 'White Salt', tag: 'ZERO CROPS', x: 64, y: 205, w: 440, h: 246, tIn: 0.70, dir: -1 },
        { name: 'india_solar_grid',   title: 'Solar Sea',  tag: '30 GW PLAN', x: 576, y: 295, w: 440, h: 246, tIn: 1.50, dir: 1 },
        { name: 'bhadla_solar_india', title: 'From Space', tag: 'GUJARAT BORDER', x: 68, y: 955, w: 448, h: 252, tIn: 2.30, dir: -1 }
      ];
      for (const c of cards) {
        const enter = snapOutSpring(clamp((localSec - c.tIn) / 0.44, 0, 1));
        const alpha = clamp((localSec - c.tIn) / 0.24, 0, 1) * (1 - exitWhip);
        if (alpha <= 0.01) continue;
        const cx = c.x + (1 - enter) * c.dir * 240 + exitWhip * c.dir * 420;
        const cy = c.y + (1 - enter) * 40;
        ctx.save();
        ctx.globalAlpha = alpha * 0.72;
        ctx.strokeStyle = '#FDE68A';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + c.w / 2, cy + c.h / 2); ctx.lineTo(kx, ky); ctx.stroke();
        ctx.restore();
        clipBank.drawClipCard(ctx, c.name, frameIdx, cx, cy, c.w, c.h, { titleItalic: c.title, tagCaps: c.tag, alpha, zoom: 1.06 });
      }

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.78);
      caption(ctx, sc.captionMarkup, localSec, { y: 1445, span: 3.4, alpha: 1 - exitWhip * 0.85, fontSize: 52 });
    }

    // =====================================================================
    // S02 (5.5–13.0s): Portal Dive into Khavda 538 sq km Grid -> Curiosity Lock
    // =====================================================================
    else if (sc.id === 'S02_KHAVDA_PORTAL_DIVE') {
      const beatSplit = 3.8;
      const geoStops = [
        { t: 0.00, lon: 71.0,  lat: 24.0,  scale: 3800,  cx: 540, cy: 820, curve: 'whip' },
        { t: 0.62, lon: 69.85, lat: 24.08, scale: 16500, cx: 540, cy: 930, curve: 'spring' },
        { t: 3.70, lon: 69.85, lat: 24.08, scale: 18000, cx: 540, cy: 930, curve: 'drift' },
        { t: 4.14, lon: 79.0,  lat: 22.8,  scale: 1780,  cx: 540, cy: 760, curve: 'whip' },
        { t: 7.50, lon: 79.0,  lat: 22.8,  scale: 1720,  cx: 540, cy: 760, curve: 'drift' }
      ];

      const snapOutP = easeInOutCubic(clamp((localSec - 3.70) / 0.46, 0, 1));
      renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const pulseBlur = Math.sin(clamp((st - 3.70) / 0.46, 0, 1) * Math.PI) * 14;
        const steadyBlur = st >= 4.10 ? 12 : 0;
        mapStage.draw(gctx, gc, {
          indiaFillMode: st < 3.92 ? 'cobaltTerrain' : 'gold',
          showKhavdaFootprint: st < 4.05,
          pulseSec: st,
          indiaGlow: 1.0,
          dofBlur: Math.max(pulseBlur, steadyBlur)
        });
        if (st < 3.85) {
          const [bx, by] = mapStage.project(KHAVDA[0], KHAVDA[1], gc);
          drawPinBeacon(gctx, bx, by + 95, 'KHAVDA • VISIBLE FROM SPACE', st, '#FACC15');
        }
      });

      if (localSec < 4.05) {
        const cardA = clamp((localSec - 0.45) / 0.30, 0, 1) * (1 - snapOutP);
        const cardS = lerp(0.86, 1.0, snapOutSpring(clamp((localSec - 0.45) / 0.45, 0, 1)));
        ctx.save();
        ctx.translate(540, 455); ctx.scale(cardS, cardS); ctx.translate(-540, -455);
        clipBank.drawClipCard(ctx, 'bhadla_solar_india', frameIdx, 96, 225, 888, 465, {
          titleItalic: 'Visible From Orbit', tagCaps: 'DESERT MEGA SOLAR ARRAYS', alpha: cardA,
          borderColor: 'rgba(253, 230, 138, 0.92)'
        });
        ctx.restore();
        drawBottomCaptionScrim(ctx, 'royalCobalt', 0.84 * (1 - snapOutP));
        caption(ctx, sc.beatACaption, localSec, { y: 1440, delay: 0.2, span: 2.6, alpha: 1 - snapOutP, fontSize: 52 });
      }

      if (localSec >= beatSplit) {
        const bSec = localSec - beatSplit;
        const bDur = dur - beatSplit;
        drawTrackedCaps(ctx, 'ONE LOCKED MEGACITY SCALE', 540, 340, {
          fontSize: 22, tracking: 4.0, align: 'center', color: '#FDE68A',
          alpha: clamp(bSec / 0.35, 0, 1) * (1 - clamp((bSec - 2.8) / 0.5, 0, 1))
        });
        drawCuriosityLockWidget(ctx, 'plant', clamp(bSec / bDur, 0, 1));
        caption(ctx, sc.beatBCaption, bSec, { y: 1445, delay: 0.12, span: 2.5, fontSize: 52 });
      }
    }

    // =====================================================================
    // S03 (13.0–19.5s): 2014 2.8 GW Baseline + Foreign Panel Import Dependency
    // =====================================================================
    else if (sc.id === 'S03_INDIA_2014_BASELINE') {
      const camKeys = [
        { t: 0.00, x: 0,    y: 0,   zoom: 1.30, roll: 0.008,  curve: 'spring' },
        { t: 0.44, x: 0,    y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 2.00, x: 0,    y: 0,   zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 2.38, x: -220, y: -55, zoom: 1.76, roll: -0.010, curve: 'whip' },
        { t: 3.80, x: -210, y: -55, zoom: 1.80, roll: -0.008, curve: 'drift' },
        { t: 4.18, x: 220,  y: -55, zoom: 1.76, roll: 0.010,  curve: 'whip' },
        { t: 5.25, x: 215,  y: -55, zoom: 1.78, roll: 0.008,  curve: 'drift' },
        { t: 5.65, x: 0,    y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 6.50, x: 0,    y: -10, zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'INDIA\'S SOLAR STARTING LINE • 2014', 540, 238, {
            fontSize: 19, tracking: 3.6, align: 'center', color: '#93C5FD'
          });

          // Left Card: 2.8 GW Total Capacity
          const lA = snapOutSpring(clamp((st - 0.30) / 0.45, 0, 1));
          drawFrostedCard(sctx, 70, 325, 450, 650, {
            radius: 30, fill: 'rgba(255, 255, 255, 0.09)', borderTop: 'rgba(255, 255, 255, 0.58)', alpha: lA
          });
          drawTrackedCaps(sctx, 'YEAR 2014 TOTAL', 295, 415, { fontSize: 17, tracking: 2.8, align: 'center', color: '#BAE6FD', alpha: lA });
          drawOdometer(sctx, {
            startValue: 0.2, value: 2.8, decimals: 1, suffix: 'GW', suffixItalicSerif: true,
            progress: clamp((st - 0.45) / 1.6, 0, 1),
            x: 295, y: 645, fontSize: 112, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A', alpha: lA
          });
          drawTrackedCaps(sctx, 'LESS THAN ONE MODERN PARK', 295, 785, { fontSize: 14.5, tracking: 2.2, align: 'center', color: '#E2E8F0', alpha: lA });

          // Right Card: ~90% Imported Solar Modules
          const rA = snapOutSpring(clamp((st - 0.75) / 0.45, 0, 1));
          drawFrostedCard(sctx, 560, 325, 450, 650, {
            radius: 30, fill: 'rgba(220, 38, 38, 0.16)', borderTop: 'rgba(252, 165, 165, 0.85)',
            glowColor: 'rgba(239, 68, 68, 0.32)', glowBlur: 22, alpha: rA
          });
          drawTrackedCaps(sctx, 'FOREIGN HARDWARE', 785, 415, { fontSize: 17, tracking: 2.8, align: 'center', color: '#FEE2E2', alpha: rA });
          drawOdometer(sctx, {
            startValue: 20, value: 90, suffix: '%+',
            progress: clamp((st - 0.95) / 1.6, 0, 1),
            x: 785, y: 645, fontSize: 112, weight: 300, color: '#FCA5A5', suffixColor: '#FECACA', alpha: rA
          });
          drawTrackedCaps(sctx, 'SOLAR PANELS IMPORTED', 785, 785, { fontSize: 15, tracking: 2.4, align: 'center', color: '#FCA5A5', alpha: rA });

          clipBank.drawClipCard(sctx, 'rann_of_kutch_salt', frameIdx, 70, 1015, 940, 245, {
            titleItalic: 'Empty Salt Flats', tagCaps: 'UNTAPPED INDIAN SUNLIGHT',
            borderColor: 'rgba(147, 197, 253, 0.85)'
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.86);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 3.8 });
    }

    // =====================================================================
    // S04 (19.5–26.5s): 3-Beat 2.8 GW -> 100+ GW (38x Surge!) Whip-Zoom
    // =====================================================================
    else if (sc.id === 'S04_SURGE_100GW_AMBER') {
      const camKeys = [
        { t: 0.00, x: -245, y: 150, zoom: 1.72, roll: -0.014, curve: 'spring' },
        { t: 1.70, x: -235, y: 140, zoom: 1.76, roll: -0.010, curve: 'drift' },
        { t: 2.10, x: 185,  y: -95, zoom: 1.80, roll: 0.012,  curve: 'whip' },
        { t: 3.65, x: 195,  y: -105, zoom: 1.84, roll: 0.010, curve: 'drift' },
        { t: 4.08, x: 0,    y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.00, x: 0,    y: -14, zoom: 1.04, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'crimsonAmber', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.35, () => {
          clipBank.drawFullBleedClip(sctx, 'india_solar_grid', frameIdx, {
            alpha: 0.24, blurPx: 8,
            tintTop: 'rgba(120, 26, 62, 0.72)', tintMid: 'rgba(189, 67, 56, 0.55)', tintBot: 'rgba(50, 8, 59, 0.88)'
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          clipBank.drawClipCard(sctx, 'india_solar_grid', frameIdx, 76, 212, 376, 212, {
            titleItalic: '100+ GW', tagCaps: 'INDIA SOLAR', borderColor: 'rgba(255, 255, 255, 0.82)'
          });
          drawFrostedCard(sctx, 486, 218, 518, 68, {
            radius: 34, fill: 'rgba(255, 244, 184, 0.18)', borderTop: '#FFFBEB',
            glowColor: 'rgba(250, 204, 21, 0.42)', glowBlur: 24
          });
          drawTrackedCaps(sctx, '2014 TO TODAY • 38× CLEAN SURGE', 745, 252, {
            fontSize: 16.5, tracking: 2.4, align: 'center', color: '#FFFDF2'
          });
          drawSurge38xSolarMonument(sctx, {
            baseY: 1290,
            oldProgress: clamp(st / 1.4, 0, 1),
            newProgress: clamp((st - 1.5) / 1.6, 0, 1),
            tSec: st
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'crimsonAmber', 0.86);
      caption(ctx, sc.captionMarkup, localSec, { y: 1460, span: 4.0, fontSize: 52 });
    }

    // =====================================================================
    // S05 (26.5–34.0s): Khavda 30 GW Hybrid + 5.2 MW Turbines + 16M Homes
    // =====================================================================
    else if (sc.id === 'S05_KHAVDA_30GW_HYBRID') {
      const camKeys = [
        { t: 0.00, x: 0,    y: -220, zoom: 1.54, roll: 0,      curve: 'spring' },
        { t: 0.46, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 2.05, x: 0,    y: 0,    zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 2.43, x: -200, y: 40,   zoom: 1.68, roll: -0.010, curve: 'whip' },
        { t: 4.30, x: 185,  y: 90,   zoom: 1.68, roll: 0.010,  curve: 'whip' },
        { t: 4.74, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.50, x: 0,    y: -10,  zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'KHAVDA ULTRA-MEGA HYBRID RENEWABLE PARK', 540, 228, {
            fontSize: 18, tracking: 3.2, align: 'center', color: '#93C5FD'
          });
          drawOdometer(sctx, {
            startValue: 2, value: 30, suffix: 'GW', suffixItalicSerif: true,
            progress: clamp(st / 2.0, 0, 1),
            x: 540, y: 392, fontSize: 148, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
          });

          // Left: Animated 200m 5.2 MW Wind Turbine Card + Right: Real Wind Turbine Drone Clip!
          drawFrostedCard(sctx, 76, 455, 452, 355, {
            radius: 26, fill: 'rgba(10, 24, 118, 0.74)', borderTop: 'rgba(125, 211, 252, 0.85)'
          });
          drawWindTurbineGraphic(sctx, 215, 775, 225, st);
          drawTrackedCaps(sctx, '5.2 MW', 385, 585, { fontSize: 28, tracking: 2, align: 'center', color: '#FDE68A' });
          drawTrackedCaps(sctx, '200M ROTOR', 385, 625, { fontSize: 15, tracking: 2.2, align: 'center', color: '#BAE6FD' });
          drawTrackedCaps(sctx, 'INDIA\'S LARGEST', 385, 655, { fontSize: 14, tracking: 2.0, align: 'center', color: '#FFFFFF' });

          clipBank.drawClipCard(sctx, 'wind_turbine_drone', frameIdx, 552, 455, 452, 355, {
            titleItalic: 'Hybrid Wind', tagCaps: 'DESERT GALES', borderColor: 'rgba(253, 230, 138, 0.88)'
          });

          // Bottom: 16 Million Indian Homes Illuminated Grid
          drawFrostedCard(sctx, 76, 845, 928, 395, {
            radius: 30, fill: 'rgba(10, 22, 112, 0.72)', borderTop: 'rgba(255, 240, 175, 0.78)'
          });
          drawTrackedCaps(sctx, 'CLEAN ELECTRICITY FOR OVER 16 MILLION INDIAN HOMES', 540, 896, {
            fontSize: 16.5, tracking: 2.6, align: 'center', color: '#FDE68A'
          });

          const cols = 10, rows = 4, total = cols * rows;
          const lit = Math.round(easeOutQuart(clamp((st - 0.7) / 3.4, 0, 1)) * total);
          const gx0 = 128, gy0 = 942, cw = 72, ch = 54, gapX = 12, gapY = 14;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const idx = r * cols + c;
              const isLit = idx < lit;
              const bx = gx0 + c * (cw + gapX), by = gy0 + r * (ch + gapY);
              roundRectPath(sctx, bx, by, cw, ch, 10);
              sctx.fillStyle = isLit ? 'rgba(250, 204, 21, 0.88)' : 'rgba(255, 255, 255, 0.09)';
              sctx.fill();
            }
          }
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.86);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 4.2 });
    }

    // =====================================================================
    // S06 (34.0–41.5s): 4-Beat Waterless Robot & Bifacial Salt-Albedo CAD X-Ray
    // =====================================================================
    else if (sc.id === 'S06_ROBOTIC_SOLAR_XRAY') {
      const camKeys = [
        { t: 0.00, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'drift' },
        { t: 1.45, x: 0,    y: 0,    zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 1.83, x: -75,  y: -290, zoom: 1.78, roll: -0.012, curve: 'whip' },  // punch onto Waterless Cleaning Robot!
        { t: 3.25, x: -60,  y: -285, zoom: 1.82, roll: -0.009, curve: 'drift' },
        { t: 3.63, x: 45,   y: -60,  zoom: 1.74, roll: 0.012,  curve: 'whip' },  // whip down to Salt-Crust Albedo Rays!
        { t: 4.95, x: 50,   y: -55,  zoom: 1.78, roll: 0.009,  curve: 'drift' },
        { t: 5.35, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.50, x: 0,    y: -10,  zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'blueprintDark', sc.startSec + st);
        const stepActive = st < 3.45 ? (st < 1.75 ? 1 : 2) : 3;
        withCameraPlane(sctx, cam, 1.0, () => {
          drawKhavdaSolarBlueprintXRay(sctx, { cx: 540, cy: 615, stepActive, tSec: st });
        });
      });

      drawTopHudScrim(ctx, 'blueprintDark', 0.92);
      drawTrackedCaps(ctx, 'ARID SALT-DESERT ENGINEERING X-RAY • ZERO WATER', 540, 212, {
        fontSize: 16.5, tracking: 2.8, align: 'center', color: '#7DD3FC'
      });

      const cardIn = snapOutSpring(clamp((localSec - 5.30) / 0.45, 0, 1));
      const cardA = clamp((localSec - 5.30) / 0.25, 0, 1);
      if (cardA > 0.01) {
        clipBank.drawClipCard(ctx, 'solar_clean_robot', frameIdx, 82, 1025 + (1 - cardIn) * 80, 442, 248, {
          titleItalic: 'Dry Robotics', tagCaps: 'NIGHT SWEEP', alpha: cardA, borderColor: 'rgba(247, 201, 72, 0.88)'
        });
        clipBank.drawClipCard(ctx, 'india_solar_grid', frameIdx, 556, 1025 + (1 - cardIn) * 80, 442, 248, {
          titleItalic: 'Bifacial PV', tagCaps: '+15% SALT ALBEDO', alpha: cardA, borderColor: 'rgba(91, 192, 255, 0.88)'
        });
      }

      drawBottomCaptionScrim(ctx, 'blueprintDark', 0.94);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 4.4 });
    }

    // =====================================================================
    // S07 (41.5–48.5s): Unlock 5x Paris (538 sq km) + Footprint Overlay!
    // =====================================================================
    else if (sc.id === 'S07_UNLOCK_5X_PARIS') {
      const camKeys = [
        { t: 0.00, x: 0, y: 0,   zoom: 1.00, roll: 0,      curve: 'drift' },
        { t: 1.18, x: 0, y: -30, zoom: 1.00, roll: 0,      curve: 'drift' },
        { t: 1.38, x: 0, y: -80, zoom: 1.16, roll: -0.008, curve: 'whip' },
        { t: 1.75, x: 0, y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 3.35, x: 0, y: 0,  zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 3.73, x: 0, y: 90, zoom: 1.14, roll: 0.005,  curve: 'whip' },
        { t: 5.15, x: 0, y: 95, zoom: 1.15, roll: 0.004,  curve: 'drift' },
        { t: 5.55, x: 0, y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.00, x: 0, y: -12, zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.45, () => {
          clipBank.drawFullBleedClip(sctx, 'paris_city_aerial', frameIdx, {
            alpha: 0.36, blurPx: 5,
            tintTop: 'rgba(6, 14, 92, 0.74)', tintMid: 'rgba(8, 22, 110, 0.52)', tintBot: 'rgba(3, 6, 48, 0.90)'
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'MEGACITY FOOTPRINT UNLOCKED', 540, 242, {
            fontSize: 20, tracking: 3.8, align: 'center', color: '#FDE68A'
          });
          drawCuriosityLockWidget(sctx, 'unlock', clamp(st / dur, 0, 1));

          const fpAlpha = clamp((st - 2.15) / 0.35, 0, 1);
          drawParisVsKhavdaFootprint(sctx, clamp((st - 2.25) / 2.2, 0, 1), fpAlpha);
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.88);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 4.0 });
    }

    // =====================================================================
    // S08 (48.5–55.5s): All-India Mega Solar Park Whip-Hops (Khavda -> Bhadla -> Rewa -> Pavagada)
    // =====================================================================
    else if (sc.id === 'S08_GREEN_CORRIDOR_WHIPS') {
      const geoStops = [
        { t: 0.00, lon: 69.72, lat: 24.12, scale: 8200, cx: 540, cy: 900, curve: 'spring' }, // Khavda, Gujarat
        { t: 1.15, lon: 69.72, lat: 24.12, scale: 8400, cx: 540, cy: 900, curve: 'drift' },
        { t: 1.52, lon: 71.92, lat: 27.53, scale: 8200, cx: 540, cy: 900, curve: 'whip' },   // Bhadla, Rajasthan
        { t: 2.60, lon: 71.92, lat: 27.53, scale: 8400, cx: 540, cy: 900, curve: 'drift' },
        { t: 2.98, lon: 81.30, lat: 24.53, scale: 8000, cx: 540, cy: 900, curve: 'whip' },   // Rewa, MP
        { t: 4.08, lon: 81.30, lat: 24.53, scale: 8200, cx: 540, cy: 900, curve: 'drift' },
        { t: 4.46, lon: 77.28, lat: 14.10, scale: 8000, cx: 540, cy: 900, curve: 'whip' },   // Pavagada, Karnataka
        { t: 5.42, lon: 77.28, lat: 14.10, scale: 8000, cx: 540, cy: 900, curve: 'drift' },
        { t: 5.86, lon: 78.20, lat: 22.00, scale: 1850, cx: 540, cy: 830, curve: 'spring' }, // National Grid Pull-Back!
        { t: 7.00, lon: 78.20, lat: 22.00, scale: 1800, cx: 540, cy: 830, curve: 'drift' }
      ];

      renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        mapStage.draw(gctx, gc, {
          indiaFillMode: 'cobaltTerrain',
          showKhavdaFootprint: true,
          pulseSec: st,
          indiaGlow: 1.0
        });
        mapStage.drawGreenPowerCorridor(gctx, SOLAR_PARKS_ROUTE, gc, clamp(st / 5.1, 0.08, 1.0));

        const parks = [
          { lon: 69.72, lat: 24.12, name: 'KHAVDA • 30 GW',   tIn: 0.05 },
          { lon: 71.92, lat: 27.53, name: 'BHADLA • 2.25 GW', tIn: 1.40 },
          { lon: 81.30, lat: 24.53, name: 'REWA SOLAR',       tIn: 2.85 },
          { lon: 77.28, lat: 14.10, name: 'PAVAGADA • 2 GW',  tIn: 4.35 }
        ];
        for (const pk of parks) {
          if (st >= pk.tIn) {
            const [px, py] = mapStage.project(pk.lon, pk.lat, gc);
            if (px > -80 && px < W + 80 && py > 150 && py < 1400) {
              drawPinBeacon(gctx, px, py, pk.name, st, '#FACC15');
            }
          }
        }
      });

      drawFrostedCard(ctx, 84, 208, 430, 195, {
        radius: 26, fill: 'rgba(8, 20, 108, 0.84)', borderTop: 'rgba(253, 230, 138, 0.85)'
      });
      drawTrackedCaps(ctx, 'GREEN ENERGY CORRIDOR', 299, 248, { fontSize: 14.5, tracking: 2.2, align: 'center', color: '#93C5FD' });
      drawOdometer(ctx, {
        startValue: 100, value: 765, suffix: 'kV', suffixItalicSerif: true,
        progress: clamp(localSec / 4.8, 0, 1),
        x: 299, y: 360, fontSize: 90, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
      });

      const activeClip = localSec < 2.8 ? 'bhadla_solar_india' : localSec < 4.3 ? 'khavda_from_space' : 'india_solar_grid';
      const activeTitle = localSec < 2.8 ? 'Bhadla Park' : localSec < 4.3 ? 'Rewa Ultra' : 'Pavagada';
      clipBank.drawClipCard(ctx, activeClip, frameIdx, 540, 208, 456, 256, {
        titleItalic: activeTitle, tagCaps: 'MEGA SOLAR GRID', borderColor: 'rgba(253, 230, 138, 0.90)'
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.88);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, delay: 0.12, span: 4.2 });
    }

    // =====================================================================
    // S09 (55.5–61.5s): Honest Part — Sunset Drop & Polysilicon Wafer Imports
    // =====================================================================
    else if (sc.id === 'S09_HONEST_STORAGE_GAP') {
      const camKeys = [
        { t: 0.00, x: 90, y: 0,   zoom: 1.30, roll: 0.008,  curve: 'spring' },
        { t: 0.42, x: 0,  y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 2.35, x: 0,  y: 0,   zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 2.72, x: 0,  y: 145, zoom: 1.36, roll: -0.006, curve: 'whip' },
        { t: 4.35, x: 0,  y: 150, zoom: 1.38, roll: -0.005, curve: 'drift' },
        { t: 4.74, x: 0,  y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 6.00, x: 0,  y: -10, zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'deepIndigo', sc.startSec + st);
        withCameraPlane(sctx, cam, 1.0, () => {
          drawOpticalMarkup(sctx, 'Now, the *honest* part.', {
            x: 540, y: 262, maxWidth: 880, fontSize: 56, progress: clamp(st / 0.65, 0, 1)
          });

          // Real Sunset Skyline Clip Card ("Solar drops at sunset")
          clipBank.drawClipCard(sctx, 'india_solar_rows', frameIdx, 88, 325, 904, 360, {
            titleItalic: '6:30 PM Sunset', tagCaps: 'PEAK EVENING DEMAND NEEDS STORAGE',
            borderColor: 'rgba(196, 181, 253, 0.85)'
          });

          // Card 1: Solar Generation Curve Dropping to 0% at Night
          drawFrostedCard(sctx, 88, 720, 904, 235, {
            radius: 28, fill: 'rgba(30, 27, 115, 0.74)', borderTop: 'rgba(196, 181, 253, 0.68)'
          });
          drawTrackedCaps(sctx, 'INTERMITTENCY • NIGHTTIME GRID GAP', 130, 768, { fontSize: 16, tracking: 2.4, color: '#C4B5FD' });
          // Bell curve of solar generation (6am -> noon -> 6pm -> 0%)
          sctx.save();
          sctx.strokeStyle = '#FACC15';
          sctx.lineWidth = 4.5;
          sctx.beginPath();
          const curveP = easeOutQuart(clamp((st - 0.5) / 1.8, 0, 1));
          for (let i = 0; i <= 40; i++) {
            const u = (i / 40) * curveP;
            const gx = 130 + u * 800;
            const bell = u < 0.68 ? Math.sin((u / 0.68) * Math.PI) : 0;
            const gy = 910 - bell * 95;
            if (i === 0) sctx.moveTo(gx, gy); else sctx.lineTo(gx, gy);
          }
          sctx.stroke();
          sctx.restore();
          drawTrackedCaps(ctx, '', 0, 0);
          drawTrackedCaps(sctx, 'NOON PEAK', 395, 795, { fontSize: 13.5, tracking: 2, align: 'center', color: '#FEF08A' });
          drawTrackedCaps(sctx, 'NIGHT = 0 MW', 835, 885, { fontSize: 14, tracking: 2, align: 'center', color: '#FCA5A5' });

          // Card 2: Upstream Polysilicon & Wafer Import Dependency
          drawFrostedCard(sctx, 88, 985, 904, 240, {
            radius: 28, fill: 'rgba(30, 27, 115, 0.80)', borderTop: 'rgba(253, 230, 138, 0.80)'
          });
          drawTrackedCaps(sctx, 'UPSTREAM RAW POLYSILICON & WAFER IMPORTS', 130, 1035, { fontSize: 16, tracking: 2.4, color: '#FDE68A' });
          drawOdometer(sctx, {
            startValue: 15, value: 80, suffix: '%+ imported', suffixItalicSerif: true,
            progress: clamp((st - 1.1) / 1.8, 0, 1),
            x: 130, y: 1170, align: 'left', fontSize: 98, weight: 300, color: '#FFFFFF', suffixColor: '#FCA5A5'
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'deepIndigo', 0.90);
      caption(ctx, sc.captionMarkup, localSec, { y: 1435, span: 3.8 });
    }

    // =====================================================================
    // S10 (61.5–70.0s): ₹24,000 Cr PLI & Grid Batteries -> Hostage vs Sovereign!
    // =====================================================================
    else if (sc.id === 'S10_PLI_ENERGY_SOVEREIGN') {
      const splitT = 3.85;
      const camKeys = [
        { t: 0.00, x: 0, y: -120, zoom: 1.42, roll: 0, curve: 'spring' },
        { t: 0.46, x: 0, y: 0,    zoom: 1.00, roll: 0, curve: 'spring' },
        { t: 3.65, x: 0, y: -30,  zoom: 1.12, roll: 0, curve: 'drift' },
        { t: 4.08, x: 0, y: 0,    zoom: 1.00, roll: 0, curve: 'whip' },
        { t: 8.50, x: 0, y: -18,  zoom: 1.05, roll: 0, curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        const rackT = expoInOut(clamp((st - 3.65) / 0.44, 0, 1));
        withCameraPlane(sctx, cam, 0.5, () => {
          mapStage.draw(sctx, { lon: 79.0, lat: 22.5, scale: 1800, cx: 540, cy: 780 }, {
            indiaFillMode: 'warm', indiaGlow: 1.0, dofBlur: lerp(4, 13, rackT), alpha: 0.85
          });
        });

        if (st < 4.08) {
          const aA = 1 - rackT;
          withCameraPlane(sctx, cam, 1.0, () => {
            clipBank.drawClipCard(sctx, 'india_solar_grid', frameIdx, 82, 232, 916, 515, {
              titleItalic: 'Make in India', tagCaps: 'SOLAR CELL FABS & RTC BATTERIES', alpha: aA, borderColor: 'rgba(253, 230, 138, 0.94)'
            });
            const tiles = [
              { k: 'SOLAR PLI', v: '₹24K', d: 'CRORE OUTLAY' },
              { k: 'DOMESTIC MODULES', v: '120', d: 'GW CAPACITY' },
              { k: 'ACC BATTERIES', v: '50', d: 'GWH STORAGE' }
            ];
            tiles.forEach((tl, i) => {
              const tIn = snapOutSpring(clamp((st - 0.55 - i * 0.32) / 0.45, 0, 1));
              const tA = clamp((st - 0.55 - i * 0.32) / 0.25, 0, 1) * aA;
              const tx = 82 + i * 312, ty = 785 + (1 - tIn) * 50;
              drawFrostedCard(sctx, tx, ty, 292, 420, { radius: 28, fill: 'rgba(10, 22, 118, 0.78)', borderTop: 'rgba(255, 240, 175, 0.82)', alpha: tA });
              drawTrackedCaps(sctx, tl.k, tx + 146, ty + 52, { fontSize: 13.5, tracking: 2.0, align: 'center', color: '#BAE6FD', alpha: tA });
              sctx.save();
              sctx.globalAlpha = tA;
              sctx.font = 'italic 400 94px InstrumentSerif';
              sctx.fillStyle = '#FDE68A';
              sctx.textAlign = 'center';
              sctx.fillText(tl.v, tx + 146, ty + 230);
              sctx.restore();
              drawTrackedCaps(sctx, tl.d, tx + 146, ty + 330, { fontSize: 13.5, tracking: 2.2, align: 'center', color: '#E0F2FE', alpha: tA });
            });
          });
        }

        if (st >= 3.65) {
          const bSec = Math.max(0, st - splitT);
          const bIn = snapOutSpring(clamp((st - 3.72) / 0.48, 0, 1));
          withCameraPlane(sctx, cam, 1.0, () => {
            drawFrostedCard(sctx, 86, 235 + (1 - bIn) * 60, 908, 325, {
              radius: 32, fill: 'rgba(255, 255, 255, 0.08)', borderTop: 'rgba(255, 255, 255, 0.36)', alpha: rackT
            });
            drawOpticalMarkup(sctx, 'A nation burning imported fuel is a *hostage.*', {
              x: 540, y: 382 + (1 - bIn) * 60, maxWidth: 810, fontSize: 50,
              progress: clamp(bSec / 1.3, 0, 1), alpha: rackT, italicColor: '#E2E8F0'
            });

            const c2A = clamp((bSec - 0.65) / 0.38, 0, 1);
            const c2S = lerp(0.90, 1.0, snapOutSpring(clamp((bSec - 0.65) / 0.52, 0, 1)));
            sctx.save();
            sctx.translate(540, 935); sctx.scale(c2S, c2S); sctx.translate(-540, -935);
            drawFrostedCard(sctx, 86, 600, 908, 670, {
              radius: 36, fill: 'rgba(14, 28, 138, 0.80)', borderTop: 'rgba(255, 238, 155, 0.96)', borderWidth: 2.4,
              glowColor: 'rgba(250, 204, 21, 0.45)', glowBlur: 40, alpha: c2A
            });
            drawTrackedCaps(sctx, 'A NATION HARVESTING ITS OWN SUN IS', 540, 675, {
              fontSize: 18.5, tracking: 3.0, align: 'center', color: '#DBEAFE', alpha: c2A
            });
            sctx.save();
            sctx.globalAlpha = c2A;
            sctx.shadowColor = 'rgba(250, 204, 21, 0.72)'; sctx.shadowBlur = 28;
            sctx.font = 'italic 400 124px InstrumentSerif';
            sctx.fillStyle = '#FDE68A';
            sctx.textAlign = 'center';
            sctx.fillText('sovereign.', 540, 820);
            sctx.restore();

            const minis = [
              { name: 'bhadla_solar_india', tag: '538 SQ KM' },
              { name: 'solar_clean_robot',  tag: 'ROBOTICS' },
              { name: 'wind_turbine_drone', tag: '30 GW HYBRID' }
            ];
            minis.forEach((m, i) => {
              clipBank.drawClipCard(sctx, m.name, frameIdx, 124 + i * 284, 895, 264, 325, {
                tagCaps: m.tag, alpha: c2A, radius: 20, borderColor: 'rgba(255, 244, 184, 0.82)'
              });
            });
            sctx.restore();
          });
        }
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.86);
      if (localSec < splitT) {
        caption(ctx, sc.beatACaption, localSec, { y: 1445, delay: 0.12, span: 2.6, alpha: 1 - clamp((localSec - 3.55) / 0.3, 0, 1), fontSize: 52 });
      } else {
        caption(ctx, sc.beatBCaption, localSec - splitT, { y: 1445, delay: 0.1, span: 3.0, fontSize: 52 });
      }
    }

    // =====================================================================
    // S11 (70.0–74.5s): Patriotic Dusk 3-Energy Poll CTA
    // =====================================================================
    else if (sc.id === 'S11_POLL_CTA') {
      const camKeys = [
        { t: 0.00, x: 0, y: 80,  zoom: 1.24, roll: 0, curve: 'spring' },
        { t: 0.44, x: 0, y: 0,   zoom: 1.00, roll: 0, curve: 'spring' },
        { t: 4.50, x: 0, y: -12, zoom: 1.03, roll: 0, curve: 'drift' }
      ];
      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'patrioticDusk', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.45, () => {
          clipBank.drawFullBleedClip(sctx, 'rann_of_kutch_salt', frameIdx, {
            alpha: 0.34, blurPx: 6,
            tintTop: 'rgba(106, 30, 130, 0.72)', tintMid: 'rgba(200, 90, 72, 0.50)', tintBot: 'rgba(39, 10, 78, 0.88)'
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'CLEAN ENERGY POLL • DROP ONE WORD', 540, 232, { fontSize: 19, tracking: 3.4, align: 'center', color: '#FDE68A' });
          drawOpticalMarkup(sctx, sc.captionMarkup, { x: 540, y: 345, maxWidth: 900, fontSize: 52, progress: clamp((st - 0.08) / 2.6, 0, 1) });
          const activeIdx = st < 2.1 ? 0 : st < 2.95 ? 1 : st < 3.65 ? 2 : 0;
          drawPollWidget(sctx, [{ label: 'Solar Power' }, { label: 'Nuclear' }, { label: 'Green Hydrogen' }], activeIdx, p);
        });
      });
    }

    // =====================================================================
    // S12 (74.5–78.0s): Share Outro
    // =====================================================================
    else if (sc.id === 'S12_SHARE_OUTRO') {
      const camKeys = [
        { t: 0.00, x: 0, y: 95,  zoom: 1.22, roll: 0, curve: 'spring' },
        { t: 0.42, x: 0, y: 0,   zoom: 1.00, roll: 0, curve: 'spring' },
        { t: 3.50, x: 0, y: -10, zoom: 1.03, roll: 0, curve: 'drift' }
      ];
      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.45, () => {
          clipBank.drawFullBleedClip(sctx, 'india_solar_grid', frameIdx, {
            alpha: 0.30, blurPx: 6,
            tintTop: 'rgba(8, 18, 120, 0.76)', tintMid: 'rgba(10, 24, 108, 0.56)', tintBot: 'rgba(2, 4, 48, 0.90)'
          });
          mapStage.draw(sctx, { lon: 79.0, lat: 22.5, scale: 1680, cx: 540, cy: 820 }, {
            indiaFillMode: 'gold', indiaGlow: 0.8, dofBlur: 8, alpha: 0.42
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'SHARE INDIA\'S CLEAN GIANT', 540, 245, { fontSize: 19, tracking: 3.6, align: 'center', color: '#FDE68A' });
          drawOpticalMarkup(sctx, sc.captionMarkup, { x: 540, y: 355, maxWidth: 900, fontSize: 54, progress: clamp((st - 0.08) / 2.1, 0, 1) });
          drawDMShareCard(sctx, p);
        });
      });
    }

    if (sc.showRail) {
      drawTopHudScrim(ctx, sc.palette || 'royalCobalt', 0.65);
      drawChapterRail(ctx, chapters, sc.chapter, 1.0);
    }
    if (sc.lockState === 'docked') drawCuriosityLockWidget(ctx, 'docked', 1.0);
  }

  function getTransitionOrigin(sc) {
    if (sc.id === 'S02_KHAVDA_PORTAL_DIVE') {
      return mapStage.project(KHAVDA[0], KHAVDA[1], { lon: 71.2, lat: 24.0, scale: 3600, cx: 540, cy: 700 });
    }
    if (sc.id === 'S04_SURGE_100GW_AMBER') return [540, 620];
    if (sc.id === 'S11_POLL_CTA') return [540, 960];
    return [540, 760];
  }

  function renderFrame(frameIdx) {
    const tSec = clamp(frameIdx / fps, 0, script.totalDurationSec - 0.001);
    let scIdx = scenes.length - 1;
    for (let i = 0; i < scenes.length; i++) {
      if (tSec >= scenes[i].startSec && tSec < scenes[i].endSec) { scIdx = i; break; }
    }
    const sc = scenes[scIdx];
    const localSec = tSec - sc.startSec;
    const tType = sc.transitionIn || 'none';
    const tDur = TRANS_DURATION[tType] || 0;

    mainCtx.clearRect(0, 0, W, H);
    if (scIdx > 0 && tType !== 'none' && localSec < tDur) {
      const prevSc = scenes[scIdx - 1];
      const prevLocal = (prevSc.endSec - prevSc.startSec) - 0.001;
      const ctxA = stageA.getContext('2d');
      const ctxB = stageB.getContext('2d');
      ctxA.clearRect(0, 0, W, H);
      ctxB.clearRect(0, 0, W, H);
      renderSingleScene(ctxA, prevSc, prevLocal, frameIdx);
      renderSingleScene(ctxB, sc, localSec, frameIdx);
      const [ox, oy] = getTransitionOrigin(sc);
      compositeV3Transition(mainCtx, stageA, stageB, tType, localSec / tDur, { x: ox, y: oy });
    } else {
      renderSingleScene(mainCtx, sc, localSec, frameIdx);
    }
  }

  return { renderFrame };
}
