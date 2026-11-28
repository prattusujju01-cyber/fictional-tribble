// engine/scenes.js
// Sovereign Data-Cinema v3.0 — 12-Scene High-Velocity Camera Choreography for Topic #5:
// "Pharmacy of the World: Why 4 in 10 American Pills Come From India"

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
  drawCapsuleIcon,
  drawPriceCrashCiplaMonument,
  drawPharmaCapsuleBlueprintXRay,
  drawUSCabinet10PillsGrid,
  drawPollWidget,
  drawDMShareCard
} from './pharma_models.js';

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

const HYDERABAD = [78.48, 17.38];
const PUNE = [73.85, 18.52];

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
    // S01 (0.0–5.5s): US Medicine Cabinet -> Snap Pull-Back onto Sovereign India
    // =====================================================================
    if (sc.id === 'S01_CABINET_HOOK') {
      const geoStops = [
        { t: 0.00, lon: 78.48, lat: 17.38, scale: 7200, cx: 540, cy: 760, curve: 'spring' },
        { t: 0.58, lon: 79.0,  lat: 21.8,  scale: 1720, cx: 540, cy: 760, curve: 'spring' },
        { t: 4.82, lon: 78.6,  lat: 21.2,  scale: 1820, cx: 540, cy: 760, curve: 'drift' },
        { t: 5.50, lon: 76.8,  lat: 18.2,  scale: 3500, cx: 540, cy: 700, curve: 'whip' }
      ];

      const gCam = renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const velDof = clamp((gc.speed - 700) / 380, 0, 7);
        mapStage.draw(gctx, gc, { indiaFillMode: 'gold', indiaGlow: 1.0, dofBlur: velDof });
        const [hx, hy] = mapStage.project(HYDERABAD[0], HYDERABAD[1], gc);
        drawPinBeacon(gctx, hx, hy, 'HYDERABAD • GENOME VALLEY', st, '#FACC15');
        if (st > 1.4) {
          const [px, py] = mapStage.project(PUNE[0], PUNE[1], gc);
          drawPinBeacon(gctx, px, py, 'PUNE • VACCINE HUB', st + 0.4, '#38BDF8');
        }
      });

      const [hx, hy] = mapStage.project(HYDERABAD[0], HYDERABAD[1], gCam);
      const exitWhip = expoInOut(clamp((localSec - 4.85) / 0.62, 0, 1));

      const cards = [
        { name: 'rotary_tablet_press',   title: '4 in 10 Pills', tag: 'US CABINETS', x: 64, y: 205, w: 440, h: 246, tIn: 0.70, dir: -1 },
        { name: 'india_vaccine_vials',   title: '60% Vaccines',  tag: 'WORLD SUPPLY', x: 576, y: 295, w: 440, h: 246, tIn: 1.50, dir: 1 },
        { name: 'hyderabad_biotech_hub', title: 'Pharma Hubs',   tag: 'MADE IN INDIA', x: 68, y: 955, w: 448, h: 252, tIn: 2.30, dir: -1 }
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
        ctx.beginPath(); ctx.moveTo(cx + c.w / 2, cy + c.h / 2); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.restore();
        clipBank.drawClipCard(ctx, c.name, frameIdx, cx, cy, c.w, c.h, { titleItalic: c.title, tagCaps: c.tag, alpha, zoom: 1.06 });
      }

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.80);
      caption(ctx, sc.captionMarkup, localSec, { y: 1445, span: 3.4, alpha: 1 - exitWhip * 0.85, fontSize: 52 });
    }

    // =====================================================================
    // S02 (5.5–13.0s): Portal Dive into Biotech Diamond -> Curiosity Lock 650+
    // =====================================================================
    else if (sc.id === 'S02_BIOTECH_PORTAL_DIVE') {
      const beatSplit = 3.8;
      const geoStops = [
        { t: 0.00, lon: 76.8, lat: 18.2, scale: 3600, cx: 540, cy: 820, curve: 'whip' },
        { t: 0.62, lon: 76.8, lat: 19.2, scale: 6800, cx: 540, cy: 960, curve: 'spring' },
        { t: 3.70, lon: 76.8, lat: 19.2, scale: 7200, cx: 540, cy: 960, curve: 'drift' },
        { t: 4.14, lon: 79.0, lat: 21.8, scale: 1780, cx: 540, cy: 760, curve: 'whip' },
        { t: 7.50, lon: 79.0, lat: 21.8, scale: 1720, cx: 540, cy: 760, curve: 'drift' }
      ];

      const snapOutP = easeInOutCubic(clamp((localSec - 3.70) / 0.46, 0, 1));
      renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const pulseBlur = Math.sin(clamp((st - 3.70) / 0.46, 0, 1) * Math.PI) * 14;
        const steadyBlur = st >= 4.10 ? 12 : 0;
        mapStage.draw(gctx, gc, {
          indiaFillMode: st < 3.92 ? 'cobaltTerrain' : 'gold',
          showBiotechCorridor: st < 4.05,
          pulseSec: st,
          indiaGlow: 1.0,
          dofBlur: Math.max(pulseBlur, steadyBlur)
        });
        if (st < 3.85) {
          const [hx, hy] = mapStage.project(HYDERABAD[0], HYDERABAD[1], gc);
          const [px, py] = mapStage.project(PUNE[0], PUNE[1], gc);
          drawPinBeacon(gctx, hx, hy, 'HYDERABAD', st, '#FACC15');
          drawPinBeacon(gctx, px, py, 'SERUM PUNE', st + 0.3, '#38BDF8');
        }
      });

      if (localSec < 4.05) {
        const cardA = clamp((localSec - 0.45) / 0.30, 0, 1) * (1 - snapOutP);
        const cardS = lerp(0.86, 1.0, snapOutSpring(clamp((localSec - 0.45) / 0.45, 0, 1)));
        ctx.save();
        ctx.translate(540, 455); ctx.scale(cardS, cardS); ctx.translate(-540, -455);
        clipBank.drawClipCard(ctx, 'india_vaccine_vials', frameIdx, 96, 225, 888, 465, {
          titleItalic: 'World\'s Pharmacy', tagCaps: '25% UK MEDS • 60% GLOBAL VACCINES', alpha: cardA,
          borderColor: 'rgba(253, 230, 138, 0.92)'
        });
        ctx.restore();
        drawBottomCaptionScrim(ctx, 'royalCobalt', 0.84 * (1 - snapOutP));
        caption(ctx, sc.beatACaption, localSec, { y: 1440, delay: 0.2, span: 2.6, alpha: 1 - snapOutP, fontSize: 52 });
      }

      if (localSec >= beatSplit) {
        const bSec = localSec - beatSplit;
        const bDur = dur - beatSplit;
        drawTrackedCaps(ctx, 'ONE LOCKED FACTORY NUMBER', 540, 340, {
          fontSize: 22, tracking: 4.0, align: 'center', color: '#FDE68A',
          alpha: clamp(bSec / 0.35, 0, 1) * (1 - clamp((bSec - 2.8) / 0.5, 0, 1))
        });
        drawCuriosityLockWidget(ctx, 'plant', clamp(bSec / bDur, 0, 1));
        caption(ctx, sc.beatBCaption, bSec, { y: 1445, delay: 0.12, span: 2.5, fontSize: 52 });
      }
    }

    // =====================================================================
    // S03 (13.0–19.5s): Pre-1970 Foreign Monopoly + $10,000/yr HIV Drug Baseline
    // =====================================================================
    else if (sc.id === 'S03_MONOPOLY_BASELINE') {
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
          drawTrackedCaps(sctx, 'THE FOREIGN PATENT MONOPOLY ERA', 540, 238, {
            fontSize: 19, tracking: 3.6, align: 'center', color: '#93C5FD'
          });

          // Left: Pre-1970 Foreign Control (85%+ Foreign Multinationals)
          const lA = snapOutSpring(clamp((st - 0.30) / 0.45, 0, 1));
          drawFrostedCard(sctx, 70, 325, 450, 650, {
            radius: 30, fill: 'rgba(255, 255, 255, 0.09)', borderTop: 'rgba(255, 255, 255, 0.58)', alpha: lA
          });
          drawTrackedCaps(sctx, 'BEFORE 1970 IN INDIA', 295, 415, { fontSize: 17, tracking: 2.6, align: 'center', color: '#BAE6FD', alpha: lA });
          drawOdometer(sctx, {
            startValue: 15, value: 85, suffix: '%',
            progress: clamp((st - 0.45) / 1.6, 0, 1),
            x: 295, y: 645, fontSize: 118, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A', alpha: lA
          });
          drawTrackedCaps(sctx, 'CONTROLLED BY FOREIGN FIRMS', 295, 785, { fontSize: 14.5, tracking: 2.0, align: 'center', color: '#E2E8F0', alpha: lA });

          // Right: $10,000 / Year HIV Drug Price Tag
          const rA = snapOutSpring(clamp((st - 0.75) / 0.45, 0, 1));
          drawFrostedCard(sctx, 560, 325, 450, 650, {
            radius: 30, fill: 'rgba(220, 38, 38, 0.16)', borderTop: 'rgba(252, 165, 165, 0.85)',
            glowColor: 'rgba(239, 68, 68, 0.32)', glowBlur: 22, alpha: rA
          });
          drawTrackedCaps(sctx, 'HIV THERAPY • YEAR 2000', 785, 415, { fontSize: 16.5, tracking: 2.4, align: 'center', color: '#FEE2E2', alpha: rA });
          drawOdometer(sctx, {
            prefix: '$', startValue: 1200, value: 10000,
            progress: clamp((st - 0.95) / 1.6, 0, 1),
            x: 785, y: 645, fontSize: 94, weight: 300, color: '#FCA5A5', alpha: rA
          });
          drawTrackedCaps(ctx, '', 0, 0);
          drawTrackedCaps(sctx, 'PER PATIENT EVERY YEAR', 785, 785, { fontSize: 15, tracking: 2.4, align: 'center', color: '#FCA5A5', alpha: rA });

          clipBank.drawClipCard(sctx, 'pill_die_stamp', frameIdx, 70, 1015, 940, 245, {
            titleItalic: 'Priced Out', tagCaps: 'MILLIONS DENIED ESSENTIAL MEDICINE',
            borderColor: 'rgba(147, 197, 253, 0.85)'
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.88);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 3.8 });
    }

    // =====================================================================
    // S04 (19.5–26.5s): 3-Beat $10,000/yr -> $1/day Cipla Revolution Whip-Zoom!
    // =====================================================================
    else if (sc.id === 'S04_ONE_DOLLAR_REVOLUTION') {
      const camKeys = [
        { t: 0.00, x: -245, y: 40,  zoom: 1.70, roll: -0.014, curve: 'spring' },
        { t: 1.70, x: -235, y: 30,  zoom: 1.74, roll: -0.010, curve: 'drift' },
        { t: 2.10, x: 195,  y: 95,  zoom: 1.78, roll: 0.012,  curve: 'whip' },
        { t: 3.65, x: 200,  y: 90,  zoom: 1.82, roll: 0.010,  curve: 'drift' },
        { t: 4.08, x: 0,    y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.00, x: 0,    y: -14, zoom: 1.04, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'crimsonAmber', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.35, () => {
          clipBank.drawFullBleedClip(sctx, 'rotary_tablet_press', frameIdx, {
            alpha: 0.22, blurPx: 8,
            tintTop: 'rgba(120, 26, 62, 0.72)', tintMid: 'rgba(189, 67, 56, 0.55)', tintBot: 'rgba(50, 8, 59, 0.88)'
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          clipBank.drawClipCard(sctx, 'rotary_tablet_press', frameIdx, 76, 212, 376, 212, {
            titleItalic: 'Cipla 2001', tagCaps: 'GENERIC DISRUPTION', borderColor: 'rgba(255, 255, 255, 0.82)'
          });
          drawFrostedCard(sctx, 486, 218, 518, 68, {
            radius: 34, fill: 'rgba(255, 244, 184, 0.18)', borderTop: '#FFFBEB',
            glowColor: 'rgba(250, 204, 21, 0.42)', glowBlur: 24
          });
          drawTrackedCaps(sctx, '$10,000 CRUSHED TO UNDER $1 A DAY', 745, 252, {
            fontSize: 16, tracking: 2.2, align: 'center', color: '#FFFDF2'
          });
          drawPriceCrashCiplaMonument(sctx, {
            baseY: 1290,
            monopolyProgress: clamp(st / 1.4, 0, 1),
            indiaProgress: clamp((st - 1.5) / 1.55, 0, 1),
            tSec: st
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'crimsonAmber', 0.88);
      caption(ctx, sc.captionMarkup, localSec, { y: 1460, span: 4.0, fontSize: 52 });
    }

    // =====================================================================
    // S05 (26.5–34.0s): 1970 Process-Patent Law + ₹2.46 Lakh Crore Exports
    // =====================================================================
    else if (sc.id === 'S05_PATENT_LAW_EXPORTS') {
      const camKeys = [
        { t: 0.00, x: 0,    y: -220, zoom: 1.54, roll: 0,      curve: 'spring' },
        { t: 0.46, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 2.10, x: 0,    y: 0,    zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 2.48, x: -120, y: 70,   zoom: 1.64, roll: -0.010, curve: 'whip' },
        { t: 4.35, x: 120,  y: 85,   zoom: 1.64, roll: 0.010,  curve: 'whip' },
        { t: 4.78, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.50, x: 0,    y: -10,  zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'ANNUAL INDIAN PHARMACEUTICAL EXPORTS (FY25)', 540, 228, {
            fontSize: 17.5, tracking: 3.0, align: 'center', color: '#93C5FD'
          });
          drawOdometer(sctx, {
            prefix: '₹', startValue: 0.25, value: 2.46, decimals: 2, suffix: 'L Cr', suffixItalicSerif: true,
            progress: clamp(st / 2.1, 0, 1),
            x: 540, y: 392, fontSize: 138, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
          });

          // Policy Toggle Card (1970 Patent Act: Product Monopoly OFF -> Process Innovation ON!)
          drawFrostedCard(sctx, 76, 460, 452, 345, {
            radius: 26, fill: 'rgba(10, 24, 118, 0.76)', borderTop: 'rgba(253, 230, 138, 0.85)'
          });
          drawTrackedCaps(sctx, '1970 INDIAN PATENTS ACT', 302, 515, { fontSize: 15.5, tracking: 2.2, align: 'center', color: '#FDE68A' });
          const sw = easeOutCubic(clamp((st - 0.8) / 0.8, 0, 1));
          roundRectPath(sctx, 212, 565, 180, 74, 37);
          sctx.fillStyle = sw > 0.5 ? 'rgba(250, 204, 21, 0.30)' : 'rgba(255,255,255,0.12)';
          sctx.fill();
          sctx.strokeStyle = '#FACC15'; sctx.lineWidth = 2.5; sctx.stroke();
          sctx.fillStyle = '#FFFFFF';
          sctx.beginPath(); sctx.arc(lerp(252, 352, sw), 602, 28, 0, Math.PI * 2); sctx.fill();
          drawTrackedCaps(sctx, 'PROCESS PATENTS UNLOCKED', 302, 695, { fontSize: 14.5, tracking: 2.0, align: 'center', color: '#BAE6FD' });
          drawTrackedCaps(sctx, '3,000+ DRUG COMPANIES', 302, 735, { fontSize: 14.5, tracking: 2.0, align: 'center', color: '#FFFFFF' });

          clipBank.drawClipCard(sctx, 'pill_die_stamp', frameIdx, 552, 460, 452, 345, {
            titleItalic: '$30.5 Billion', tagCaps: '3RD LARGEST BY VOLUME',
            borderColor: 'rgba(147, 197, 253, 0.88)'
          });

          // 10x4 Capsule Matrix
          drawFrostedCard(sctx, 76, 840, 928, 395, {
            radius: 30, fill: 'rgba(10, 22, 112, 0.72)', borderTop: 'rgba(255, 240, 175, 0.78)'
          });
          drawTrackedCaps(sctx, '10,500+ MANUFACTURING UNITS ACROSS INDIA', 540, 892, {
            fontSize: 16.5, tracking: 2.6, align: 'center', color: '#FDE68A'
          });
          const cols = 10, rows = 4, total = cols * rows;
          const lit = Math.round(easeOutQuart(clamp((st - 0.7) / 3.4, 0, 1)) * total);
          const gx0 = 128, gy0 = 938, cw = 72, ch = 54, gapX = 12, gapY = 14;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const idx = r * cols + c;
              roundRectPath(sctx, gx0 + c * (cw + gapX), gy0 + r * (ch + gapY), cw, ch, 24);
              sctx.fillStyle = idx < lit ? 'rgba(250, 204, 21, 0.88)' : 'rgba(255, 255, 255, 0.09)';
              sctx.fill();
            }
          }
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.88);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 4.2 });
    }

    // =====================================================================
    // S06 (34.0–41.5s): 4-Beat Exploded Capsule & 10,000L Bioreactor CAD X-Ray
    // =====================================================================
    else if (sc.id === 'S06_CAPSULE_BIOREACTOR_XRAY') {
      const camKeys = [
        { t: 0.00, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'drift' },
        { t: 1.45, x: 0,    y: 0,    zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 1.83, x: -195, y: -270, zoom: 1.76, roll: -0.012, curve: 'whip' },  // punch onto Exploded API Capsule!
        { t: 3.25, x: -185, y: -265, zoom: 1.80, roll: -0.009, curve: 'drift' },
        { t: 3.63, x: 195,  y: -270, zoom: 1.76, roll: 0.012,  curve: 'whip' },  // whip across to 10,000L Bioreactor!
        { t: 4.95, x: 200,  y: -265, zoom: 1.80, roll: 0.009,  curve: 'drift' },
        { t: 5.35, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.50, x: 0,    y: -10,  zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'blueprintDark', sc.startSec + st);
        const stepActive = st < 3.45 ? (st < 1.75 ? 1 : 2) : 3;
        withCameraPlane(sctx, cam, 1.0, () => {
          drawPharmaCapsuleBlueprintXRay(sctx, { cy: 615, stepActive, tSec: st });
        });
      });

      drawTopHudScrim(ctx, 'blueprintDark', 0.92);
      drawTrackedCaps(ctx, 'WHO-GMP & US-FDA CLEANROOM ENGINEERING X-RAY', 540, 212, {
        fontSize: 16.5, tracking: 2.8, align: 'center', color: '#7DD3FC'
      });

      const cardIn = snapOutSpring(clamp((localSec - 5.30) / 0.45, 0, 1));
      const cardA = clamp((localSec - 5.30) / 0.25, 0, 1);
      if (cardA > 0.01) {
        clipBank.drawClipCard(ctx, 'api_chem_reactor', frameIdx, 82, 1025 + (1 - cardIn) * 80, 442, 248, {
          titleItalic: 'API Synthesis', tagCaps: 'MOLECULAR GRADE', alpha: cardA, borderColor: 'rgba(247, 201, 72, 0.88)'
        });
        clipBank.drawClipCard(ctx, 'serum_pune_vials', frameIdx, 556, 1025 + (1 - cardIn) * 80, 442, 248, {
          titleItalic: 'Serum Pune', tagCaps: 'VACCINE SCALE', alpha: cardA, borderColor: 'rgba(91, 192, 255, 0.88)'
        });
      }

      drawBottomCaptionScrim(ctx, 'blueprintDark', 0.94);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 4.4 });
    }

    // =====================================================================
    // S07 (41.5–48.5s): Unlock 650+ US-FDA Plants + 4-in-10 US Pills Shelf
    // =====================================================================
    else if (sc.id === 'S07_UNLOCK_650_FDA') {
      const camKeys = [
        { t: 0.00, x: 0, y: 0,  zoom: 1.00, roll: 0,      curve: 'drift' },
        { t: 1.18, x: 0, y: -30,zoom: 1.00, roll: 0,      curve: 'drift' },
        { t: 1.38, x: 0, y: -80,zoom: 1.16, roll: -0.008, curve: 'whip' },
        { t: 1.75, x: 0, y: 0,  zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 3.35, x: 0, y: 0,  zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 3.73, x: 0, y: 90, zoom: 1.14, roll: 0.005,  curve: 'whip' },
        { t: 5.15, x: 0, y: 95, zoom: 1.15, roll: 0.004,  curve: 'drift' },
        { t: 5.55, x: 0, y: 0,  zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.00, x: 0, y: -12,zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.45, () => {
          clipBank.drawFullBleedClip(sctx, 'rotary_tablet_press', frameIdx, {
            alpha: 0.36, blurPx: 5,
            tintTop: 'rgba(6, 14, 92, 0.74)', tintMid: 'rgba(8, 22, 110, 0.52)', tintBot: 'rgba(3, 6, 48, 0.90)'
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'LOCKED FACTORY NUMBER UNLOCKED', 540, 242, {
            fontSize: 20, tracking: 3.8, align: 'center', color: '#FDE68A'
          });
          drawCuriosityLockWidget(sctx, 'unlock', clamp(st / dur, 0, 1));

          const gridA = clamp((st - 2.15) / 0.35, 0, 1);
          drawUSCabinet10PillsGrid(sctx, clamp((st - 2.25) / 2.2, 0, 1), gridA);
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.88);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 4.0 });
    }

    // =====================================================================
    // S08 (48.5–55.5s): Rapid Global Lifeline Whip-Hops (India -> UK -> Africa -> USA -> 200+ Nations)
    // =====================================================================
    else if (sc.id === 'S08_GLOBAL_LIFELINE_WHIPS') {
      const geoStops = [
        { t: 0.00, lon: 76.8,  lat: 18.0, scale: 2600, cx: 540, cy: 860, curve: 'spring' },
        { t: 1.10, lon: 76.8,  lat: 18.0, scale: 2700, cx: 540, cy: 860, curve: 'drift' },
        { t: 1.48, lon: -2.0,  lat: 53.5, scale: 2500, cx: 540, cy: 860, curve: 'whip' },   // UK (25% NHS Meds)
        { t: 2.58, lon: -2.0,  lat: 53.5, scale: 2600, cx: 540, cy: 860, curve: 'drift' },
        { t: 2.96, lon: 22.0,  lat: -1.5, scale: 1350, cx: 540, cy: 860, curve: 'whip' },   // Africa (70% HIV ARVs)
        { t: 4.08, lon: 22.0,  lat: -1.5, scale: 1400, cx: 540, cy: 860, curve: 'drift' },
        { t: 4.48, lon: -98.5, lat: 39.5, scale: 1600, cx: 540, cy: 860, curve: 'whip' },   // USA (40% Generics)
        { t: 5.40, lon: -98.5, lat: 39.5, scale: 1650, cx: 540, cy: 860, curve: 'drift' },
        { t: 5.86, lon: 25.0,  lat: 18.0, scale: 340,  cx: 540, cy: 860, curve: 'spring' }, // 200+ Nations World Pull-Back!
        { t: 7.00, lon: 25.0,  lat: 18.0, scale: 330,  cx: 540, cy: 860, curve: 'drift' }
      ];

      const recipients = [
        { lon: -2.0,  lat: 53.5,  name: 'UK • 25% NHS MEDS',   iso: 'GBR', tIn: 1.35, delay: 0.08 },
        { lon: 24.0,  lat: -2.0,  name: 'AFRICA • 70% HIV ARV',iso: 'ZAF', tIn: 2.85, delay: 0.18 },
        { lon: 7.5,   lat: 9.0,   name: '',                    iso: 'NGA', tIn: 2.90, delay: 0.22 },
        { lon: 37.9,  lat: 0.0,   name: '',                    iso: 'KEN', tIn: 2.92, delay: 0.24 },
        { lon: -98.5, lat: 39.5,  name: 'USA • 40% GENERICS',  iso: 'USA', tIn: 4.35, delay: 0.32 },
        { lon: -51.9, lat: -14.2, name: '',                    iso: 'BRA', tIn: 5.60, delay: 0.52 },
        { lon: 10.4,  lat: 51.1,  name: '',                    iso: 'DEU', tIn: 5.60, delay: 0.56 },
        { lon: 138.2, lat: 36.2,  name: '',                    iso: 'JPN', tIn: 5.60, delay: 0.60 },
        { lon: 133.8, lat: -25.2, name: '',                    iso: 'AUS', tIn: 5.60, delay: 0.64 }
      ];

      renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const hl = {};
        for (const r of recipients) if (st >= r.tIn) hl[r.iso] = clamp((st - r.tIn) / 0.4, 0, 1);
        mapStage.draw(gctx, gc, { indiaFillMode: 'gold', indiaGlow: 1.0, highlightedIsos: hl });
        mapStage.drawLifelineArcs(gctx, HYDERABAD, recipients, gc, clamp(st / 6.3, 0, 1));
        for (const r of recipients) {
          if (!r.name || st < r.tIn) continue;
          const [x, y] = mapStage.project(r.lon, r.lat, gc);
          if (x > -80 && x < W + 80 && y > 150 && y < 1400) drawPinBeacon(gctx, x, y, r.name, st, '#FACC15');
        }
        const [hx, hy] = mapStage.project(HYDERABAD[0], HYDERABAD[1], gc);
        if (hx > -80 && hx < W + 80) drawPinBeacon(gctx, hx, hy, st > 5.8 ? '' : 'INDIA BIOTECH', st, '#38BDF8');
      });

      drawFrostedCard(ctx, 84, 208, 430, 195, {
        radius: 26, fill: 'rgba(8, 20, 108, 0.84)', borderTop: 'rgba(253, 230, 138, 0.85)'
      });
      drawTrackedCaps(ctx, 'GLOBAL MEDICAL REACH', 299, 248, { fontSize: 14.5, tracking: 2.2, align: 'center', color: '#93C5FD' });
      drawOdometer(ctx, {
        startValue: 20, value: 200, suffix: '+ nations', suffixItalicSerif: true,
        progress: clamp(localSec / 5.6, 0, 1),
        x: 299, y: 360, fontSize: 84, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
      });

      const activeClip = localSec < 2.8 ? 'india_vaccine_vials' : localSec < 4.3 ? 'serum_pune_cleanroom' : 'rotary_tablet_press';
      const activeTitle = localSec < 2.8 ? 'UK NHS Supply' : localSec < 4.3 ? 'Africa ARVs' : 'US Generics';
      clipBank.drawClipCard(ctx, activeClip, frameIdx, 540, 208, 456, 256, {
        titleItalic: activeTitle, tagCaps: 'INDIAN LIFELINE', borderColor: 'rgba(253, 230, 138, 0.90)'
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.88);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, delay: 0.12, span: 4.2 });
    }

    // =====================================================================
    // S09 (55.5–61.5s): Honest Part — ~70% Raw Chemical API Import Reliance
    // =====================================================================
    else if (sc.id === 'S09_HONEST_API_GAP') {
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

          clipBank.drawClipCard(sctx, 'api_chem_reactor', frameIdx, 88, 325, 904, 360, {
            titleItalic: 'Raw Chemicals', tagCaps: 'KEY STARTING MATERIALS & BULK APIs',
            borderColor: 'rgba(196, 181, 253, 0.85)'
          });

          // Card 1: Bulk API & KSM Import Dependency (~70%)
          drawFrostedCard(sctx, 88, 720, 904, 240, {
            radius: 28, fill: 'rgba(30, 27, 115, 0.76)', borderTop: 'rgba(196, 181, 253, 0.68)'
          });
          drawTrackedCaps(sctx, 'RAW BULK APIs IMPORTED FROM CHINA', 130, 770, { fontSize: 16, tracking: 2.4, color: '#C4B5FD' });
          drawOdometer(sctx, {
            startValue: 10, value: 70, suffix: '%',
            progress: clamp((st - 0.55) / 1.7, 0, 1),
            x: 130, y: 905, align: 'left', fontSize: 108, weight: 300, color: '#FFFFFF', suffixColor: '#FCA5A5'
          });
          const bw1 = 420 * easeOutQuart(clamp((st - 0.65) / 1.7, 0, 1)) * 0.70;
          roundRectPath(sctx, 510, 855, 420, 28, 14);
          sctx.fillStyle = 'rgba(255,255,255,0.12)'; sctx.fill();
          if (bw1 > 8) { roundRectPath(sctx, 510, 855, bw1, 28, 14); sctx.fillStyle = '#F87171'; sctx.fill(); }

          // Card 2: Critical Antibiotics & Paracetamol Precursors (up to 90%)
          drawFrostedCard(sctx, 88, 990, 904, 235, {
            radius: 28, fill: 'rgba(30, 27, 115, 0.80)', borderTop: 'rgba(253, 230, 138, 0.80)'
          });
          drawTrackedCaps(sctx, 'CRITICAL FERMENTATION ANTIBIOTIC PRECURSORS', 130, 1040, { fontSize: 15.5, tracking: 2.2, color: '#FDE68A' });
          drawOdometer(sctx, {
            startValue: 15, value: 90, suffix: '% reliant', suffixItalicSerif: true,
            progress: clamp((st - 1.1) / 1.8, 0, 1),
            x: 130, y: 1170, align: 'left', fontSize: 98, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'deepIndigo', 0.90);
      caption(ctx, sc.captionMarkup, localSec, { y: 1435, span: 3.8 });
    }

    // =====================================================================
    // S10 (61.5–70.0s): ₹15,000 Cr Bulk-Drug PLI & Penicillin-G -> Business vs Lifeline!
    // =====================================================================
    else if (sc.id === 'S10_PLI_LIFELINE_REFRAME') {
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
          mapStage.draw(sctx, { lon: 79.0, lat: 21.8, scale: 1800, cx: 540, cy: 780 }, {
            indiaFillMode: 'warm', indiaGlow: 1.0, dofBlur: lerp(4, 13, rackT), alpha: 0.85
          });
        });

        if (st < 4.08) {
          const aA = 1 - rackT;
          withCameraPlane(sctx, cam, 1.0, () => {
            clipBank.drawClipCard(sctx, 'hyderabad_biotech_hub', frameIdx, 82, 232, 916, 515, {
              titleItalic: 'Kakinada & Hyderabad', tagCaps: 'PENICILLIN-G BACK IN INDIA AFTER 30 YRS',
              alpha: aA, borderColor: 'rgba(253, 230, 138, 0.94)'
            });
            const tiles = [
              { k: 'PHARMA PLI', v: '₹15K', d: 'CRORE OUTLAY' },
              { k: 'CRITICAL APIs', v: '41', d: 'LOCALIZED NOW' },
              { k: 'BULK PARKS', v: '3', d: 'MEGA CLUSTERS' }
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
            drawOpticalMarkup(sctx, 'Pricing medicine for billionaires is a *business.*', {
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
            drawTrackedCaps(sctx, 'HEALING BILLIONS FOR PENNIES IS A', 540, 675, {
              fontSize: 18.5, tracking: 3.0, align: 'center', color: '#DBEAFE', alpha: c2A
            });
            sctx.save();
            sctx.globalAlpha = c2A;
            sctx.shadowColor = 'rgba(250, 204, 21, 0.72)'; sctx.shadowBlur = 28;
            sctx.font = 'italic 400 128px InstrumentSerif';
            sctx.fillStyle = '#FDE68A';
            sctx.textAlign = 'center';
            sctx.fillText('lifeline.', 540, 822);
            sctx.restore();

            const minis = [
              { name: 'rotary_tablet_press', title: '', tag: '40% US PILLS' },
              { name: 'india_vaccine_vials', title: '', tag: '60% VACCINES' },
              { name: 'api_chem_reactor',    title: '', tag: 'LOCAL APIs' }
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

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.88);
      if (localSec < splitT) {
        caption(ctx, sc.beatACaption, localSec, { y: 1445, delay: 0.12, span: 2.6, alpha: 1 - clamp((localSec - 3.55) / 0.3, 0, 1), fontSize: 51 });
      } else {
        caption(ctx, sc.beatBCaption, localSec - splitT, { y: 1445, delay: 0.1, span: 3.0, fontSize: 52 });
      }
    }

    // =====================================================================
    // S11 (70.0–74.5s): Patriotic Dusk 3-Breakthrough Poll CTA
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
          clipBank.drawFullBleedClip(sctx, 'india_vaccine_vials', frameIdx, {
            alpha: 0.34, blurPx: 6,
            tintTop: 'rgba(106, 30, 130, 0.72)', tintMid: 'rgba(200, 90, 72, 0.50)', tintBot: 'rgba(39, 10, 78, 0.88)'
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'INDIA PHARMA POLL • DROP ONE WORD', 540, 232, { fontSize: 19, tracking: 3.4, align: 'center', color: '#FDE68A' });
          drawOpticalMarkup(sctx, sc.captionMarkup, { x: 540, y: 345, maxWidth: 900, fontSize: 52, progress: clamp((st - 0.08) / 2.6, 0, 1) });
          const activeIdx = st < 2.1 ? 0 : st < 2.95 ? 1 : st < 3.65 ? 2 : 0;
          drawPollWidget(sctx, [{ label: 'Cancer Generics' }, { label: 'Bulk APIs' }, { label: 'New Vaccines' }], activeIdx, p);
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
          clipBank.drawFullBleedClip(sctx, 'hyderabad_biotech_hub', frameIdx, {
            alpha: 0.30, blurPx: 6,
            tintTop: 'rgba(8, 18, 120, 0.76)', tintMid: 'rgba(10, 24, 108, 0.56)', tintBot: 'rgba(2, 4, 48, 0.90)'
          });
          mapStage.draw(sctx, { lon: 79.0, lat: 21.8, scale: 1680, cx: 540, cy: 820 }, {
            indiaFillMode: 'gold', indiaGlow: 0.8, dofBlur: 8, alpha: 0.42
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'SHARE WITH A DOCTOR OR PHARMACIST', 540, 245, { fontSize: 18, tracking: 3.2, align: 'center', color: '#FDE68A' });
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
    if (sc.id === 'S02_BIOTECH_PORTAL_DIVE') {
      return mapStage.project(HYDERABAD[0], HYDERABAD[1], { lon: 76.8, lat: 18.2, scale: 3500, cx: 540, cy: 700 });
    }
    if (sc.id === 'S04_ONE_DOLLAR_REVOLUTION') return [540, 620];
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
