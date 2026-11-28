// engine/scenes.js
// Sovereign Data-Cinema v3.0 — 12-Scene High-Velocity Camera Choreography for Topic #3:
// "ISRO's Impossible Space Economics: How India Landed on the Moon's South Pole for ₹615 Crore"
// Every scene drives multi-beat keyframed cameras with 4-tap shutter blur, logarithmic snap-zooms,
// velocity DOF pulses, geodesic whip-hops, and the reference transition set.

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
  drawHollywoodVsISROMonument,
  drawEarthMoonSlingshot,
  drawLVM3BlueprintXRay,
  drawPollWidget,
  drawDMShareCard
} from './isro_models.js';

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

const SRIHARIKOTA = [80.23, 13.72];

// --------------------------------------------------------------------------
// Geodesic map camera (logarithmic scale + velocity estimate)
// --------------------------------------------------------------------------
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
    ctx.font = '600 14px PlusJakarta';
    const tw = Math.max(150, label.length * 11.5 + 40);
    drawFrostedCard(ctx, x - tw / 2, y - 62, tw, 42, {
      radius: 21, fill: 'rgba(6, 14, 72, 0.86)', borderTop: 'rgba(255, 236, 153, 0.85)'
    });
    drawTrackedCaps(ctx, label, x, y - 41, { fontSize: 14, tracking: 2.2, align: 'center', color: '#FFFBEB' });
  }
  ctx.restore();
}

// Procedural starfield for space scenes (deterministic)
let starCache = null;
function getStars() {
  if (starCache) return starCache;
  let s = 7734;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  starCache = Array.from({ length: 220 }, () => ({ x: rnd() * W, y: rnd() * H, r: 0.6 + rnd() * 1.8, tw: rnd() * Math.PI * 2 }));
  return starCache;
}
function drawStarfield(ctx, tSec, alpha = 1) {
  ctx.save();
  for (const st of getStars()) {
    ctx.globalAlpha = alpha * (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(tSec * 2.2 + st.tw)));
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
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
  function drawBottomCaptionScrim(ctx, paletteName, strength = 0.88) {
    const [r, g, b] = SCRIM_RGB[paletteName] || SCRIM_RGB.royalCobalt;
    const grad = ctx.createLinearGradient(0, 1315, 0, H);
    grad.addColorStop(0.00, `rgba(${r}, ${g}, ${b}, 0)`);
    grad.addColorStop(0.24, `rgba(${r}, ${g}, ${b}, ${(0.76 * strength).toFixed(3)})`);
    grad.addColorStop(0.52, `rgba(${r}, ${g}, ${b}, ${(0.92 * strength).toFixed(3)})`);
    grad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, ${(0.97 * strength).toFixed(3)})`);
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 1315, W, H - 1315);
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
    // S01 (0.0–5.5s): 1963 Thumba bicycle -> snap pull-back onto India
    // =====================================================================
    if (sc.id === 'S01_BICYCLE_TO_SPACE') {
      const geoStops = [
        { t: 0.00, lon: 76.87, lat: 8.53, scale: 9800, cx: 540, cy: 760, curve: 'spring' },  // Thumba, Kerala
        { t: 0.58, lon: 78.9, lat: 21.5, scale: 1720, cx: 540, cy: 760, curve: 'spring' },
        { t: 4.82, lon: 79.2, lat: 20.6, scale: 1820, cx: 540, cy: 760, curve: 'drift' },
        { t: 5.50, lon: 80.0, lat: 14.6, scale: 3400, cx: 540, cy: 700, curve: 'whip' }     // anticipating Sriharikota dive
      ];

      const gCam = renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const velDof = clamp((gc.speed - 700) / 380, 0, 7);
        mapStage.draw(gctx, gc, { indiaFillMode: 'gold', indiaGlow: 1.0, dofBlur: velDof });
        const [tx, ty] = mapStage.project(76.87, 8.53, gc);
        drawPinBeacon(gctx, tx, ty, 'THUMBA • 1963', st, '#FACC15');
        if (st > 1.6) {
          const [sx, sy] = mapStage.project(SRIHARIKOTA[0], SRIHARIKOTA[1], gc);
          drawPinBeacon(gctx, sx, sy, 'SRIHARIKOTA', st + 0.4, '#38BDF8');
        }
      });

      const [kx, ky] = mapStage.project(76.87, 8.53, gCam);
      const exitWhip = expoInOut(clamp((localSec - 4.85) / 0.62, 0, 1));

      const cards = [
        { name: 'pslv_liftoff', title: 'Rocket Dream', tag: 'KERALA 1963', x: 64, y: 210, w: 440, h: 248, tIn: 0.70, dir: -1 },
        { name: 'lvm3_liftoff', title: 'Sriharikota', tag: 'TODAY', x: 576, y: 300, w: 440, h: 248, tIn: 1.50, dir: 1 },
        { name: 'pragyan_rampdown', title: 'The Moon', tag: 'SOUTH POLE', x: 68, y: 960, w: 448, h: 252, tIn: 2.30, dir: -1 }
      ];
      for (const c of cards) {
        const enter = snapOutSpring(clamp((localSec - c.tIn) / 0.44, 0, 1));
        const alpha = clamp((localSec - c.tIn) / 0.24, 0, 1) * (1 - exitWhip);
        if (alpha <= 0.01) continue;
        const cx = c.x + (1 - enter) * c.dir * 240 + exitWhip * c.dir * 420;
        const cy = c.y + (1 - enter) * 40;
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = '#FDE68A';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + c.w / 2, cy + c.h / 2); ctx.lineTo(kx, ky); ctx.stroke();
        ctx.restore();
        clipBank.drawClipCard(ctx, c.name, frameIdx, cx, cy, c.w, c.h, { titleItalic: c.title, tagCaps: c.tag, alpha, zoom: 1.06 });
      }

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.7);
      caption(ctx, sc.captionMarkup, localSec, { y: 1445, span: 3.4, alpha: 1 - exitWhip * 0.85, fontSize: 52 });
    }

    // =====================================================================
    // S02 (5.5–13.0s): portal dive to Sriharikota -> lunar south pole -> lock
    // =====================================================================
    else if (sc.id === 'S02_SOUTH_POLE_PORTAL') {
      const beatSplit = 3.8;
      const geoStops = [
        { t: 0.00, lon: 80.10, lat: 14.2, scale: 3600, cx: 540, cy: 820, curve: 'whip' },
        { t: 0.62, lon: 80.23, lat: 13.72, scale: 26000, cx: 540, cy: 900, curve: 'spring' },
        { t: 3.70, lon: 80.23, lat: 13.72, scale: 28500, cx: 540, cy: 900, curve: 'drift' },
        { t: 4.14, lon: 79.0, lat: 21.0, scale: 1780, cx: 540, cy: 760, curve: 'whip' },
        { t: 7.50, lon: 79.0, lat: 21.0, scale: 1720, cx: 540, cy: 760, curve: 'drift' }
      ];

      const snapOutP = easeInOutCubic(clamp((localSec - 3.70) / 0.46, 0, 1));
      renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const pulseBlur = Math.sin(clamp((st - 3.70) / 0.46, 0, 1) * Math.PI) * 14;
        const steadyBlur = st >= 4.10 ? 12 : 0;
        mapStage.draw(gctx, gc, {
          indiaFillMode: st < 3.92 ? 'cobaltTerrain' : 'gold',
          showSpaceportRadar: st < 4.05,
          pulseSec: st,
          indiaGlow: 1.0,
          dofBlur: Math.max(pulseBlur, steadyBlur)
        });
        if (st < 3.85) {
          const [bx, by] = mapStage.project(SRIHARIKOTA[0], SRIHARIKOTA[1], gc);
          drawPinBeacon(gctx, bx, by, 'SDSC SHAR • SRIHARIKOTA', st, '#38BDF8');
        }
      });

      if (localSec < 4.05) {
        const cardA = clamp((localSec - 0.45) / 0.30, 0, 1) * (1 - snapOutP);
        const cardS = lerp(0.86, 1.0, snapOutSpring(clamp((localSec - 0.45) / 0.45, 0, 1)));
        ctx.save();
        ctx.translate(540, 455); ctx.scale(cardS, cardS); ctx.translate(-540, -455);
        clipBank.drawClipCard(ctx, 'vikram_landing', frameIdx, 96, 225, 888, 470, {
          titleItalic: 'Vikram Lands', tagCaps: 'MOON SOUTH POLE • 23 AUG 2023', alpha: cardA,
          borderColor: 'rgba(253, 230, 138, 0.90)'
        });
        ctx.restore();
        drawBottomCaptionScrim(ctx, 'royalCobalt', 0.8 * (1 - snapOutP));
        caption(ctx, sc.beatACaption, localSec, { y: 1440, delay: 0.2, span: 2.6, alpha: 1 - snapOutP, fontSize: 52 });
      }

      if (localSec >= beatSplit) {
        const bSec = localSec - beatSplit;
        const bDur = dur - beatSplit;
        drawTrackedCaps(ctx, 'ONE LOCKED NUMBER', 540, 340, {
          fontSize: 22, tracking: 4.0, align: 'center', color: '#FDE68A',
          alpha: clamp(bSec / 0.35, 0, 1) * (1 - clamp((bSec - 2.8) / 0.5, 0, 1))
        });
        drawCuriosityLockWidget(ctx, 'plant', clamp(bSec / bDur, 0, 1));
        caption(ctx, sc.beatBCaption, bSec, { y: 1445, delay: 0.12, span: 2.5, fontSize: 52 });
      }
    }

    // =====================================================================
    // S03 (13.0–19.5s): Hollywood ₹1,350 Cr vs Luna-25 crash baseline
    // =====================================================================
    else if (sc.id === 'S03_HOLLYWOOD_BASELINE') {
      const camKeys = [
        { t: 0.00, x: 0,   y: 0,    zoom: 1.30, roll: 0.008,  curve: 'spring' },
        { t: 0.44, x: 0,   y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 2.05, x: 0,   y: 0,    zoom: 1.03, roll: 0,      curve: 'drift' },
        { t: 2.43, x: -230, y: -40, zoom: 1.82, roll: -0.010, curve: 'whip' },   // punch onto Hollywood card
        { t: 3.85, x: -220, y: -40, zoom: 1.86, roll: -0.008, curve: 'drift' },
        { t: 4.22, x: 230,  y: -40, zoom: 1.82, roll: 0.010,  curve: 'whip' },   // whip to Luna-25 crash card
        { t: 5.30, x: 225,  y: -40, zoom: 1.84, roll: 0.008,  curve: 'drift' },
        { t: 5.70, x: 0,    y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 6.50, x: 0,    y: -10, zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.4, () => drawStarfield(sctx, st, 0.8));

        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'THE GLOBAL BASELINE', 540, 238, { fontSize: 20, tracking: 4, align: 'center', color: '#93C5FD' });

          // LEFT: Hollywood film budget card (procedural cinema clapper + film strip)
          const lA = snapOutSpring(clamp((st - 0.35) / 0.45, 0, 1));
          drawFrostedCard(sctx, 70, 330 + (1 - lA) * 60, 450, 660, {
            radius: 30, fill: 'rgba(255, 255, 255, 0.09)', borderTop: 'rgba(255, 255, 255, 0.6)', alpha: lA
          });
          sctx.save();
          sctx.globalAlpha = lA;
          // Clapperboard icon
          const ccx = 295, ccy = 470 + (1 - lA) * 60;
          sctx.strokeStyle = '#FFFFFF'; sctx.lineWidth = 4;
          roundRectPath(sctx, ccx - 80, ccy - 20, 160, 100, 10); sctx.stroke();
          sctx.save();
          sctx.translate(ccx - 80, ccy - 20);
          sctx.rotate(-0.22 + Math.sin(st * 3) * 0.04);
          roundRectPath(sctx, 0, -34, 160, 30, 6); sctx.stroke();
          for (let k = 0; k < 5; k++) {
            sctx.beginPath(); sctx.moveTo(14 + k * 30, -34); sctx.lineTo(34 + k * 30, -4); sctx.stroke();
          }
          sctx.restore();
          sctx.restore();
          drawTrackedCaps(sctx, 'INTERSTELLAR • 2014', 295, 640 + (1 - lA) * 60, { fontSize: 17, tracking: 3, align: 'center', color: '#E2E8F0', alpha: lA });
          drawOdometer(sctx, {
            prefix: '₹', startValue: 200, value: 1350, suffix: 'Cr', indianGrouping: true, suffixItalicSerif: true,
            progress: clamp((st - 0.5) / 1.8, 0, 1),
            x: 295, y: 790 + (1 - lA) * 60, fontSize: 104, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A', alpha: lA
          });
          drawTrackedCaps(sctx, 'JUST TO FILM SPACE', 295, 900 + (1 - lA) * 60, { fontSize: 15, tracking: 2.6, align: 'center', color: '#93C5FD', alpha: lA });

          // RIGHT: Luna-25 crash card (red alert + crater)
          const rA = snapOutSpring(clamp((st - 0.85) / 0.45, 0, 1));
          drawFrostedCard(sctx, 560, 330 + (1 - rA) * 60, 450, 660, {
            radius: 30, fill: 'rgba(220, 38, 38, 0.16)', borderTop: 'rgba(252, 165, 165, 0.85)',
            glowColor: 'rgba(239, 68, 68, 0.35)', glowBlur: 22, alpha: rA
          });
          sctx.save();
          sctx.globalAlpha = rA;
          const mx = 785, my = 500 + (1 - rA) * 60;
          const mg = sctx.createRadialGradient(mx - 12, my - 12, 6, mx, my, 74);
          mg.addColorStop(0, '#F1F5F9'); mg.addColorStop(1, '#64748B');
          sctx.fillStyle = mg;
          sctx.beginPath(); sctx.arc(mx, my, 72, 0, Math.PI * 2); sctx.fill();
          // impact flash + crater
          const flash = Math.max(0, Math.sin(clamp((st - 1.4) / 0.6, 0, 1) * Math.PI));
          sctx.fillStyle = `rgba(239, 68, 68, ${(0.35 + 0.5 * flash).toFixed(3)})`;
          sctx.beginPath(); sctx.arc(mx + 26, my + 30, 18 + flash * 22, 0, Math.PI * 2); sctx.fill();
          sctx.strokeStyle = '#FCA5A5'; sctx.lineWidth = 3;
          sctx.beginPath(); sctx.moveTo(mx - 120, my - 120); sctx.lineTo(mx + 24, my + 28); sctx.stroke();
          sctx.restore();
          drawTrackedCaps(sctx, 'RUSSIA • LUNA-25', 785, 640 + (1 - rA) * 60, { fontSize: 17, tracking: 3, align: 'center', color: '#FEE2E2', alpha: rA });
          sctx.save();
          sctx.globalAlpha = rA;
          sctx.font = 'italic 400 96px InstrumentSerif';
          sctx.fillStyle = '#FCA5A5';
          sctx.textAlign = 'center';
          sctx.fillText('Crashed.', 785, 790 + (1 - rA) * 60);
          sctx.restore();
          drawTrackedCaps(sctx, '19 AUG 2023 • 4 DAYS EARLIER', 785, 900 + (1 - rA) * 60, { fontSize: 15, tracking: 2.4, align: 'center', color: '#FCA5A5', alpha: rA });

          // Bottom: real lander imagery strip
          clipBank.drawClipCard(sctx, 'lander_moon_view', frameIdx, 70, 1030, 940, 230, {
            titleItalic: 'South Pole', tagCaps: 'WHERE NO ONE HAD LANDED', borderColor: 'rgba(147, 197, 253, 0.85)'
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.86);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 3.8 });
    }

    // =====================================================================
    // S04 (19.5–26.5s): 3-beat whip-zoom Hollywood bar -> ₹615 Cr LVM3 -> pull-back
    // =====================================================================
    else if (sc.id === 'S04_CHANDRAYAAN_615CR') {
      const camKeys = [
        { t: 0.00, x: -255, y: 40,   zoom: 1.70, roll: -0.014, curve: 'spring' },
        { t: 1.70, x: -240, y: 30,   zoom: 1.74, roll: -0.010, curve: 'drift' },
        { t: 2.10, x: 200,  y: -60,  zoom: 1.80, roll: 0.012,  curve: 'whip' },
        { t: 3.65, x: 205,  y: -70,  zoom: 1.84, roll: 0.010,  curve: 'drift' },
        { t: 4.08, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.00, x: 0,    y: -14,  zoom: 1.04, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'crimsonAmber', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.35, () => {
          clipBank.drawFullBleedClip(sctx, 'lvm3_liftoff', frameIdx, {
            alpha: 0.24, blurPx: 9,
            tintTop: 'rgba(120, 26, 62, 0.72)', tintMid: 'rgba(189, 67, 56, 0.55)', tintBot: 'rgba(50, 8, 59, 0.88)'
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          clipBank.drawClipCard(sctx, 'lvm3_onboard', frameIdx, 76, 212, 380, 214, {
            titleItalic: 'LVM3-M4', tagCaps: 'REAL LAUNCH', borderColor: 'rgba(255, 255, 255, 0.8)'
          });
          drawFrostedCard(sctx, 490, 218, 514, 68, {
            radius: 34, fill: 'rgba(255, 244, 184, 0.18)', borderTop: '#FFFBEB',
            glowColor: 'rgba(250, 204, 21, 0.42)', glowBlur: 24
          });
          drawTrackedCaps(sctx, 'MOVIE VS ACTUAL MOON MISSION', 747, 252, {
            fontSize: 16.5, tracking: 2.4, align: 'center', color: '#FFFDF2'
          });
          drawHollywoodVsISROMonument(sctx, {
            baseY: 1290,
            hollywoodProgress: clamp(st / 1.45, 0, 1),
            isroProgress: clamp((st - 1.55) / 1.55, 0, 1),
            tSec: st
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'crimsonAmber', 0.85);
      caption(ctx, sc.captionMarkup, localSec, { y: 1460, span: 4.0, fontSize: 52 });
    }

    // =====================================================================
    // S05 (26.5–34.0s): 5 slingshots + 90% homegrown / 400 firms
    // =====================================================================
    else if (sc.id === 'S05_ORBITAL_SLINGSHOT') {
      const camKeys = [
        { t: 0.00, x: 0,    y: -220, zoom: 1.55, roll: 0,      curve: 'spring' },
        { t: 0.46, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 1.95, x: 0,    y: 0,    zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 2.33, x: -230, y: -210, zoom: 1.85, roll: -0.010, curve: 'whip' },  // punch onto Earth orbits
        { t: 3.60, x: -220, y: -205, zoom: 1.88, roll: -0.008, curve: 'drift' },
        { t: 3.98, x: 280,  y: -400, zoom: 1.92, roll: 0.012,  curve: 'whip' },  // whip along TLI to south pole
        { t: 5.00, x: 285,  y: -405, zoom: 1.94, roll: 0.010,  curve: 'drift' },
        { t: 5.42, x: 0,    y: 0,    zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.50, x: 0,    y: -10,  zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.4, () => drawStarfield(sctx, st, 1.0));
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'THE FUEL-SAVING TRICK • OBERTH SLINGSHOTS', 540, 238, {
            fontSize: 17, tracking: 3.0, align: 'center', color: '#93C5FD'
          });
          drawEarthMoonSlingshot(sctx, { progress: clamp(st / 4.6, 0, 1), tSec: st });

          // Homegrown stats bar
          drawFrostedCard(sctx, 70, 960, 940, 300, {
            radius: 30, fill: 'rgba(10, 22, 112, 0.70)', borderTop: 'rgba(253, 230, 138, 0.75)'
          });
          drawTrackedCaps(sctx, 'INDIGENOUS CONTENT', 110, 1008, { fontSize: 15, tracking: 2.6, color: '#FDE68A' });
          drawOdometer(sctx, {
            startValue: 10, value: 90, suffix: '%', progress: clamp((st - 1.2) / 2.0, 0, 1),
            x: 110, y: 1130, align: 'left', fontSize: 120, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
          });
          drawTrackedCaps(sctx, 'INDIAN SUPPLIERS', 600, 1008, { fontSize: 15, tracking: 2.6, color: '#FDE68A' });
          drawOdometer(sctx, {
            startValue: 20, value: 400, suffix: '+', progress: clamp((st - 1.6) / 2.2, 0, 1),
            x: 600, y: 1130, align: 'left', fontSize: 120, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
          });
          // 20x2 supplier dot matrix lighting up
          const lit = Math.round(easeOutQuart(clamp((st - 1.6) / 2.6, 0, 1)) * 40);
          for (let i = 0; i < 40; i++) {
            const dx = 110 + (i % 20) * 44, dy = 1178 + Math.floor(i / 20) * 34;
            sctx.fillStyle = i < lit ? '#FACC15' : 'rgba(255,255,255,0.12)';
            sctx.beginPath(); sctx.arc(dx, dy, 9, 0, Math.PI * 2); sctx.fill();
          }
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.86);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 4.2 });
    }

    // =====================================================================
    // S06 (34.0–41.5s): 4-beat LVM3 CAD X-ray inspection
    // CE-20 reticle at ~(540, 610) -> offset (0, -350) ; Vikram at ~(540, 408) -> offset (0, -552)
    // =====================================================================
    else if (sc.id === 'S06_LVM3_BLUEPRINT_XRAY') {
      const camKeys = [
        { t: 0.00, x: 0,   y: -150, zoom: 1.00, roll: 0,      curve: 'drift' },
        { t: 1.50, x: 0,   y: -150, zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 1.88, x: -40, y: -350, zoom: 2.15, roll: -0.014, curve: 'whip' },  // CE-20 cryogenic punch
        { t: 3.30, x: -35, y: -345, zoom: 2.20, roll: -0.010, curve: 'drift' },
        { t: 3.68, x: 40,  y: -545, zoom: 2.10, roll: 0.012,  curve: 'whip' },  // whip up to Vikram lander
        { t: 5.00, x: 45,  y: -540, zoom: 2.14, roll: 0.010,  curve: 'drift' },
        { t: 5.40, x: 0,   y: -150, zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.50, x: 0,   y: -160, zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'blueprintDark', sc.startSec + st);
        const stepActive = st < 3.5 ? (st < 1.9 ? 1 : 2) : 3;
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'LVM3 STRUCTURAL X-RAY • 43.5M • 640 TONNES', 540, 238, {
            fontSize: 17, tracking: 3.0, align: 'center', color: '#7DD3FC'
          });
          drawLVM3BlueprintXRay(sctx, { cx: 540, topY: 300, totalH: 690, stepActive, tSec: st });
        });
      });

      // Screen-space real-footage cards (stay crisp, outside camera)
      const cardIn = snapOutSpring(clamp((localSec - 5.45) / 0.45, 0, 1));
      const cardA = clamp((localSec - 5.45) / 0.25, 0, 1);
      if (cardA > 0.01) {
        clipBank.drawClipCard(ctx, 'lvm3_onboard', frameIdx, 82, 1030 + (1 - cardIn) * 80, 442, 250, {
          titleItalic: 'CE-20 Stage', tagCaps: '-253°C', alpha: cardA, borderColor: 'rgba(247, 201, 72, 0.85)'
        });
        clipBank.drawClipCard(ctx, 'vikram_hop', frameIdx, 556, 1030 + (1 - cardIn) * 80, 442, 250, {
          titleItalic: 'Vikram', tagCaps: 'LASER DOPPLER', alpha: cardA, borderColor: 'rgba(91, 192, 255, 0.85)'
        });
      }

      drawBottomCaptionScrim(ctx, 'blueprintDark', 0.94);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 4.4 });
    }

    // =====================================================================
    // S07 (41.5–48.5s): unlock 434 sats + 104-in-one record
    // =====================================================================
    else if (sc.id === 'S07_UNLOCK_434_SATS') {
      const camKeys = [
        { t: 0.00, x: 0, y: 0,   zoom: 1.00, roll: 0,      curve: 'drift' },
        { t: 1.18, x: 0, y: -40, zoom: 1.00, roll: 0,      curve: 'drift' },
        { t: 1.38, x: 0, y: -95, zoom: 1.16, roll: -0.008, curve: 'whip' },   // unlock impact punch
        { t: 1.75, x: 0, y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 3.40, x: 0, y: 0,   zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 3.78, x: 0, y: 330, zoom: 1.40, roll: 0.006,  curve: 'whip' },   // punch onto 104 record
        { t: 5.40, x: 0, y: 335, zoom: 1.42, roll: 0.004,  curve: 'drift' },
        { t: 5.80, x: 0, y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 7.00, x: 0, y: -12, zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.45, () => {
          clipBank.drawFullBleedClip(sctx, 'pslv_liftoff', frameIdx, {
            alpha: 0.40, blurPx: 4.5,
            tintTop: 'rgba(6, 14, 92, 0.72)', tintMid: 'rgba(8, 22, 110, 0.50)', tintBot: 'rgba(3, 6, 48, 0.90)'
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'THE LOCKED NUMBER • UNLOCKED', 540, 245, { fontSize: 20, tracking: 3.8, align: 'center', color: '#FDE68A' });
          drawCuriosityLockWidget(sctx, 'unlock', clamp(st / dur, 0, 1));

          // 104 satellites in one launch — dot burst
          const recA = clamp((st - 2.6) / 0.35, 0, 1);
          if (recA > 0.01) {
            drawFrostedCard(sctx, 90, 860, 900, 400, {
              radius: 30, fill: 'rgba(12, 26, 128, 0.78)', borderTop: 'rgba(253, 230, 138, 0.85)', alpha: recA
            });
            drawTrackedCaps(sctx, 'WORLD RECORD • PSLV-C37 • FEB 2017', 540, 905, { fontSize: 16, tracking: 2.6, align: 'center', color: '#FDE68A', alpha: recA });
            drawOdometer(sctx, {
              startValue: 1, value: 104, suffix: 'in one rocket', suffixItalicSerif: true,
              progress: clamp((st - 2.75) / 1.6, 0, 1),
              x: 540, y: 1030, fontSize: 118, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A', alpha: recA
            });
            const burst = easeOutCubic(clamp((st - 3.0) / 2.0, 0, 1));
            for (let i = 0; i < 104; i++) {
              const ang = (i / 104) * Math.PI * 2 + i * 0.37;
              const rr = burst * (40 + (i % 7) * 26);
              const dx = 540 + Math.cos(ang) * rr * 1.9;
              const dy = 1165 + Math.sin(ang) * rr * 0.32;
              sctx.globalAlpha = recA * (0.5 + 0.5 * burst);
              sctx.fillStyle = i % 9 === 0 ? '#FACC15' : '#E0F2FE';
              sctx.beginPath(); sctx.arc(dx, dy, 3.4, 0, Math.PI * 2); sctx.fill();
            }
            sctx.globalAlpha = 1;
          }
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.86);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, span: 4.0 });
    }

    // =====================================================================
    // S08 (48.5–55.5s): global geodesic whip-hops Sriharikota -> UK -> Singapore -> USA
    // =====================================================================
    else if (sc.id === 'S08_GLOBAL_ORBIT_WHIPS') {
      const geoStops = [
        { t: 0.00, lon: 80.23, lat: 13.72, scale: 2600, cx: 540, cy: 860, curve: 'spring' },
        { t: 1.10, lon: 80.23, lat: 13.72, scale: 2700, cx: 540, cy: 860, curve: 'drift' },
        { t: 1.48, lon: -2.5,  lat: 53.5,  scale: 2500, cx: 540, cy: 860, curve: 'whip' },   // UK
        { t: 2.58, lon: -2.5,  lat: 53.5,  scale: 2600, cx: 540, cy: 860, curve: 'drift' },
        { t: 2.96, lon: 103.8, lat: 1.35,  scale: 2900, cx: 540, cy: 860, curve: 'whip' },   // Singapore
        { t: 4.08, lon: 103.8, lat: 1.35,  scale: 3000, cx: 540, cy: 860, curve: 'drift' },
        { t: 4.48, lon: -98.5, lat: 39.5,  scale: 1600, cx: 540, cy: 860, curve: 'whip' },   // USA
        { t: 5.40, lon: -98.5, lat: 39.5,  scale: 1650, cx: 540, cy: 860, curve: 'drift' },
        { t: 5.86, lon: 40.0,  lat: 22.0,  scale: 340,  cx: 540, cy: 860, curve: 'spring' }, // global pull-back
        { t: 7.00, lon: 40.0,  lat: 22.0,  scale: 330,  cx: 540, cy: 860, curve: 'drift' }
      ];
      const clients = [
        { lon: -2.5,  lat: 53.5,  name: 'UNITED KINGDOM', iso: 'GBR', tIn: 1.35, delay: 0.10 },
        { lon: 103.8, lat: 1.35,  name: 'SINGAPORE',      iso: 'SGP', tIn: 2.85, delay: 0.20 },
        { lon: -98.5, lat: 39.5,  name: 'USA • 230+ SATS', iso: 'USA', tIn: 4.35, delay: 0.32 },
        { lon: 10.4,  lat: 51.1,  name: '', iso: 'DEU', tIn: 5.6, delay: 0.55 },
        { lon: 138.2, lat: 36.2,  name: '', iso: 'JPN', tIn: 5.6, delay: 0.60 },
        { lon: -106.3, lat: 56.1, name: '', iso: 'CAN', tIn: 5.6, delay: 0.62 },
        { lon: 34.8,  lat: 31.0,  name: '', iso: 'ISR', tIn: 5.6, delay: 0.66 },
        { lon: 127.8, lat: 35.9,  name: '', iso: 'KOR', tIn: 5.6, delay: 0.70 },
        { lon: 2.2,   lat: 46.2,  name: '', iso: 'FRA', tIn: 5.6, delay: 0.74 }
      ];

      renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const hl = {};
        for (const c of clients) if (st >= c.tIn) hl[c.iso] = clamp((st - c.tIn) / 0.4, 0, 1);
        mapStage.draw(gctx, gc, { indiaFillMode: 'gold', indiaGlow: 1.0, highlightedIsos: hl });
        mapStage.drawOrbitalArcs(gctx, SRIHARIKOTA, clients, gc, clamp(st / 6.4, 0, 1));
        for (const c of clients) {
          if (!c.name || st < c.tIn) continue;
          const [x, y] = mapStage.project(c.lon, c.lat, gc);
          if (x > -80 && x < W + 80 && y > 150 && y < 1400) drawPinBeacon(gctx, x, y, c.name, st, '#FACC15');
        }
        const [sx, sy] = mapStage.project(SRIHARIKOTA[0], SRIHARIKOTA[1], gc);
        if (sx > -80 && sx < W + 80) drawPinBeacon(gctx, sx, sy, st > 5.8 ? '' : 'SRIHARIKOTA', st, '#38BDF8');
      });

      drawFrostedCard(ctx, 84, 208, 430, 195, { radius: 26, fill: 'rgba(8, 20, 108, 0.84)', borderTop: 'rgba(253, 230, 138, 0.85)' });
      drawTrackedCaps(ctx, 'CLIENT NATIONS', 299, 248, { fontSize: 15, tracking: 2.4, align: 'center', color: '#93C5FD' });
      drawOdometer(ctx, {
        startValue: 1, value: 36, suffix: 'countries', suffixItalicSerif: true,
        progress: clamp(localSec / 5.8, 0, 1),
        x: 299, y: 360, fontSize: 88, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
      });
      const activeClip = localSec < 2.8 ? 'pslv_liftoff' : localSec < 4.3 ? 'lvm3_onboard' : 'lvm3_liftoff';
      const activeTitle = localSec < 2.8 ? 'For the UK' : localSec < 4.3 ? 'For Singapore' : 'For America';
      clipBank.drawClipCard(ctx, activeClip, frameIdx, 540, 208, 456, 256, {
        titleItalic: activeTitle, tagCaps: 'NSIL LAUNCH', borderColor: 'rgba(253, 230, 138, 0.9)'
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.88);
      caption(ctx, sc.captionMarkup, localSec, { y: 1440, delay: 0.12, span: 4.2 });
    }

    // =====================================================================
    // S09 (55.5–61.5s): honest part — 2% market, no reusable boosters
    // =====================================================================
    else if (sc.id === 'S09_HONEST_SPACE_GAP') {
      const camKeys = [
        { t: 0.00, x: 90, y: 0,   zoom: 1.30, roll: 0.008,  curve: 'spring' },
        { t: 0.42, x: 0,  y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 2.35, x: 0,  y: 0,   zoom: 1.02, roll: 0,      curve: 'drift' },
        { t: 2.72, x: 0,  y: 160, zoom: 1.38, roll: -0.006, curve: 'whip' },
        { t: 4.35, x: 0,  y: 165, zoom: 1.40, roll: -0.005, curve: 'drift' },
        { t: 4.74, x: 0,  y: 0,   zoom: 1.00, roll: 0,      curve: 'spring' },
        { t: 6.00, x: 0,  y: -10, zoom: 1.03, roll: 0,      curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'deepIndigo', sc.startSec + st);
        withCameraPlane(sctx, cam, 1.0, () => {
          drawOpticalMarkup(sctx, 'Now, the *honest* part.', { x: 540, y: 262, maxWidth: 880, fontSize: 56, progress: clamp(st / 0.65, 0, 1) });

          // Global space economy donut: India 2%
          drawFrostedCard(sctx, 88, 320, 904, 470, { radius: 30, fill: 'rgba(30, 27, 115, 0.72)', borderTop: 'rgba(196, 181, 253, 0.7)' });
          drawTrackedCaps(sctx, 'GLOBAL SPACE ECONOMY SHARE', 540, 368, { fontSize: 16, tracking: 2.6, align: 'center', color: '#C4B5FD' });
          const dcx = 330, dcy = 575, R = 150;
          const sweep = easeOutQuart(clamp((st - 0.4) / 1.6, 0, 1));
          sctx.lineWidth = 46;
          sctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          sctx.beginPath(); sctx.arc(dcx, dcy, R, 0, Math.PI * 2); sctx.stroke();
          sctx.strokeStyle = '#A78BFA';
          sctx.beginPath(); sctx.arc(dcx, dcy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.98 * sweep); sctx.stroke();
          sctx.strokeStyle = '#FACC15';
          sctx.shadowColor = 'rgba(250, 204, 21, 0.8)'; sctx.shadowBlur = 16;
          sctx.beginPath(); sctx.arc(dcx, dcy, R, -Math.PI / 2 - Math.PI * 2 * 0.02 * sweep, -Math.PI / 2); sctx.stroke();
          sctx.shadowBlur = 0;
          drawOdometer(sctx, {
            startValue: 0, value: 2, suffix: '%', progress: clamp((st - 0.6) / 1.4, 0, 1),
            x: dcx, y: dcy + 30, fontSize: 96, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
          });
          drawTrackedCaps(sctx, 'INDIA', 680, 520, { fontSize: 17, tracking: 3, color: '#FDE68A' });
          drawTrackedCaps(sctx, '~2% OF A $630B MARKET', 680, 560, { fontSize: 15, tracking: 2.2, color: '#E9D5FF' });
          drawTrackedCaps(sctx, 'REST OF WORLD', 680, 630, { fontSize: 17, tracking: 3, color: '#C4B5FD' });
          drawTrackedCaps(sctx, '~98% SHARE', 680, 670, { fontSize: 15, tracking: 2.2, color: '#E9D5FF' });

          // Reusability gap card
          drawFrostedCard(sctx, 88, 820, 904, 420, { radius: 30, fill: 'rgba(30, 27, 115, 0.78)', borderTop: 'rgba(253, 230, 138, 0.8)' });
          drawTrackedCaps(sctx, 'REUSABLE BOOSTER LANDINGS', 540, 868, { fontSize: 16, tracking: 2.6, align: 'center', color: '#FDE68A' });
          const rows = [
            { label: 'USA', val: 'ROUTINE', w: 1.0, col: '#A78BFA' },
            { label: 'CHINA', val: 'TESTING', w: 0.45, col: '#A78BFA' },
            { label: 'INDIA', val: 'NOT YET', w: 0.06, col: '#FACC15' }
          ];
          rows.forEach((r, i) => {
            const ry = 930 + i * 96;
            const bw = 520 * easeOutQuart(clamp((st - 1.0 - i * 0.25) / 1.4, 0, 1)) * r.w;
            drawTrackedCaps(sctx, r.label, 130, ry + 22, { fontSize: 18, tracking: 2.6, color: '#FFFFFF' });
            roundRectPath(sctx, 300, ry, 520, 44, 22);
            sctx.fillStyle = 'rgba(255,255,255,0.10)'; sctx.fill();
            if (bw > 6) { roundRectPath(sctx, 300, ry, Math.max(22, bw), 44, 22); sctx.fillStyle = r.col; sctx.fill(); }
            drawTrackedCaps(sctx, r.val, 950, ry + 22, { fontSize: 14, tracking: 2, align: 'right', color: r.label === 'INDIA' ? '#FDE68A' : '#E9D5FF' });
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'deepIndigo', 0.9);
      caption(ctx, sc.captionMarkup, localSec, { y: 1435, span: 3.8 });
    }

    // =====================================================================
    // S10 (61.5–70.0s): Gaganyaan / Soorya / 300+ startups -> passenger vs navigator
    // =====================================================================
    else if (sc.id === 'S10_GAGANYAAN_NAVIGATOR') {
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
          mapStage.draw(sctx, { lon: 79.0, lat: 21.5, scale: 1800, cx: 540, cy: 780 }, {
            indiaFillMode: 'warm', indiaGlow: 1.0, dofBlur: lerp(4, 13, rackT), alpha: 0.85
          });
        });

        if (st < 4.08) {
          const aA = 1 - rackT;
          withCameraPlane(sctx, cam, 1.0, () => {
            clipBank.drawClipCard(sctx, 'gaganyaan_launch', frameIdx, 82, 232, 916, 520, {
              titleItalic: 'Gaganyaan', tagCaps: 'HUMAN SPACEFLIGHT PROGRAMME', alpha: aA, borderColor: 'rgba(253, 230, 138, 0.94)'
            });
            const tiles = [
              { k: 'GAGANYAAN', v: 'CREW', d: 'HUMAN-RATED' },
              { k: 'SOORYA NGLV', v: 'REUSE', d: 'LOX-METHANE' },
              { k: 'SPACE STARTUPS', v: '300+', d: 'SINCE 2020' }
            ];
            tiles.forEach((tl, i) => {
              const tIn = snapOutSpring(clamp((st - 0.6 - i * 0.35) / 0.45, 0, 1));
              const tA = clamp((st - 0.6 - i * 0.35) / 0.25, 0, 1) * aA;
              const tx = 82 + i * 312, ty = 790 + (1 - tIn) * 50;
              drawFrostedCard(sctx, tx, ty, 292, 420, { radius: 28, fill: 'rgba(10, 22, 118, 0.76)', borderTop: 'rgba(255, 240, 175, 0.82)', alpha: tA });
              drawTrackedCaps(sctx, tl.k, tx + 146, ty + 52, { fontSize: 14, tracking: 2.2, align: 'center', color: '#BAE6FD', alpha: tA });
              sctx.save();
              sctx.globalAlpha = tA;
              sctx.font = 'italic 400 92px InstrumentSerif';
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
            drawOpticalMarkup(sctx, 'A country that rents orbit is a *passenger.*', {
              x: 540, y: 380 + (1 - bIn) * 60, maxWidth: 800, fontSize: 50,
              progress: clamp(bSec / 1.3, 0, 1), alpha: rackT, italicColor: '#E2E8F0'
            });

            const c2A = clamp((bSec - 0.65) / 0.38, 0, 1);
            const c2S = lerp(0.9, 1.0, snapOutSpring(clamp((bSec - 0.65) / 0.52, 0, 1)));
            sctx.save();
            sctx.translate(540, 935); sctx.scale(c2S, c2S); sctx.translate(-540, -935);
            drawFrostedCard(sctx, 86, 600, 908, 670, {
              radius: 36, fill: 'rgba(14, 28, 138, 0.80)', borderTop: 'rgba(255, 238, 155, 0.96)', borderWidth: 2.4,
              glowColor: 'rgba(250, 204, 21, 0.45)', glowBlur: 40, alpha: c2A
            });
            drawTrackedCaps(sctx, 'A COUNTRY THAT LAUNCHES THE WORLD IS A', 540, 675, {
              fontSize: 18, tracking: 3.0, align: 'center', color: '#DBEAFE', alpha: c2A
            });
            sctx.save();
            sctx.globalAlpha = c2A;
            sctx.shadowColor = 'rgba(250, 204, 21, 0.72)'; sctx.shadowBlur = 28;
            sctx.font = 'italic 400 124px InstrumentSerif';
            sctx.fillStyle = '#FDE68A';
            sctx.textAlign = 'center';
            sctx.fillText('navigator.', 540, 820);
            sctx.restore();
            const minis = [
              { name: 'pragyan_rampdown', tag: 'MOON' },
              { name: 'pslv_liftoff', tag: '434 SATS' },
              { name: 'gaganyaan_launch', tag: 'CREW NEXT' }
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
    // S11 (70.0–74.5s): poll CTA
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
          clipBank.drawFullBleedClip(sctx, 'lander_moon_view', frameIdx, {
            alpha: 0.34, blurPx: 6,
            tintTop: 'rgba(106, 30, 130, 0.72)', tintMid: 'rgba(200, 90, 72, 0.50)', tintBot: 'rgba(39, 10, 78, 0.88)'
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'ISRO MISSION POLL • DROP ONE WORD', 540, 232, { fontSize: 19, tracking: 3.4, align: 'center', color: '#FDE68A' });
          drawOpticalMarkup(sctx, sc.captionMarkup, { x: 540, y: 345, maxWidth: 900, fontSize: 52, progress: clamp((st - 0.08) / 2.6, 0, 1) });
          const activeIdx = st < 2.1 ? 0 : st < 2.95 ? 1 : st < 3.65 ? 2 : 0;
          drawPollWidget(sctx, [{ label: 'Chandrayaan-3' }, { label: 'Mangalyaan' }, { label: 'Gaganyaan' }], activeIdx, p);
        });
      });
    }

    // =====================================================================
    // S12 (74.5–78.0s): share outro
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
          clipBank.drawFullBleedClip(sctx, 'vikram_landing', frameIdx, {
            alpha: 0.30, blurPx: 6,
            tintTop: 'rgba(8, 18, 120, 0.76)', tintMid: 'rgba(10, 24, 108, 0.56)', tintBot: 'rgba(2, 4, 48, 0.90)'
          });
          mapStage.draw(sctx, { lon: 79.0, lat: 21.5, scale: 1680, cx: 540, cy: 820 }, {
            indiaFillMode: 'gold', indiaGlow: 0.8, dofBlur: 8, alpha: 0.42
          });
        });
        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'SHARE THIS MOONSHOT', 540, 245, { fontSize: 19, tracking: 3.6, align: 'center', color: '#FDE68A' });
          drawOpticalMarkup(sctx, sc.captionMarkup, { x: 540, y: 355, maxWidth: 900, fontSize: 54, progress: clamp((st - 0.08) / 2.1, 0, 1) });
          drawDMShareCard(sctx, p);
        });
      });
    }

    // Screen-space HUD
    if (sc.showRail) drawChapterRail(ctx, chapters, sc.chapter, 1.0);
    if (sc.lockState === 'docked') drawCuriosityLockWidget(ctx, 'docked', 1.0);
  }

  function getTransitionOrigin(sc) {
    if (sc.id === 'S02_SOUTH_POLE_PORTAL') {
      return mapStage.project(SRIHARIKOTA[0], SRIHARIKOTA[1], { lon: 80.0, lat: 14.6, scale: 3400, cx: 540, cy: 700 });
    }
    if (sc.id === 'S04_CHANDRAYAAN_615CR') return [540, 620];
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
