// engine/scenes.js
// Sovereign Data-Cinema v3.0 — 12-Scene High-Velocity Camera Choreography for Topic #2:
// "35m Taller Than the Eiffel Tower: How India Built the World's Highest Railway Bridge (Chenab Arch 359m)"
// Enforces:
//  - Exponential Snap-Zooms (expScale + expoInOut / snapOutSpring)
//  - Multi-Beat In-Scene Camera Keyframes & Focal Punches every 1.6s-2.4s
//  - Real 4-Tap 180-Degree Cinema Shutter Motion Blur during whips & zooms (renderWithShutterBlur)
//  - Velocity-Linked Optical DOF Map Blur Pulses
//  - 6 Reference Transitions (circular_portal_dive, planetary_horizon_wipe, radial_iris_punch, snap_zoom_portal, laser_blueprint_scan, snap_zoomout_dof, whip_pan_left, whip_pan_up)

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
  drawEiffelVsChenabMonument,
  drawChenabBlueprintXRay,
  drawPollWidget,
  drawDMShareCard
} from './chenab_models.js';

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

// Evaluate multi-stop geodesic map camera with logarithmic scale & velocity estimate
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
  const rawU = clamp((t - a.t) / dt, 0, 1);
  const curve = b.curve || 'whip';
  const u = curve === 'spring' ? snapOutSpring(rawU) : curve === 'drift' ? easeInOutCubic(rawU) : expoInOut(rawU);

  const lon = lerp(a.lon, b.lon, u);
  const lat = lerp(a.lat, b.lat, u);
  const scale = expScale(a.scale, b.scale, u);
  const cx = lerp(a.cx ?? 540, b.cx ?? 540, u);
  const cy = lerp(a.cy ?? 760, b.cy ?? 760, u);

  // Instantaneous velocity in screen px/sec + log-zoom px/sec
  const eps = 0.008;
  const rawU2 = clamp((t + eps - a.t) / dt, 0, 1);
  const u2 = curve === 'spring' ? snapOutSpring(rawU2) : curve === 'drift' ? easeInOutCubic(rawU2) : expoInOut(rawU2);
  const dLonPx = Math.abs(lerp(a.lon, b.lon, u2) - lon) * (Math.PI / 180) * scale / eps;
  const dLatPx = Math.abs(lerp(a.lat, b.lat, u2) - lat) * (Math.PI / 180) * scale / eps;
  const dZoomPx = Math.abs(Math.log(expScale(a.scale, b.scale, u2) / scale)) * 980 / eps;
  const speed = Math.hypot(dLonPx, dLatPx) + dZoomPx;

  return { lon, lat, scale, cx, cy, speed };
}

// 4-tap temporal map shutter blur for high-velocity geodesic whips & snap dives
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
  for (let i = 0; i < samples.length; i++) {
    const st = Math.max(0, localTimeSec + samples[i].dt);
    const sg = evalGeoKeyframes(st, geoStops);
    sctx.clearRect(0, 0, W, H);
    drawGeoAt(sctx, st, sg);
    ctx.save();
    const cumAlpha = i === 0 ? 1.0 : samples[i].w / samples.slice(0, i + 1).reduce((acc, s) => acc + s.w, 0);
    ctx.globalAlpha = cumAlpha;
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
  ctx.beginPath();
  ctx.arc(x, y, 10 + ring * 34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (label) {
    drawFrostedCard(ctx, x - 115, y - 62, 230, 42, {
      radius: 21, fill: 'rgba(6, 14, 72, 0.86)', borderTop: 'rgba(255, 236, 153, 0.85)'
    });
    drawTrackedCaps(ctx, label, x, y - 41, {
      fontSize: 14, tracking: 2.2, align: 'center', color: '#FFFBEB'
    });
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

  const USBRL_WAYPOINTS = [
    [74.86, 32.73], // Jammu
    [75.14, 32.92], // Udhampur
    [74.93, 33.08], // Anji Khad
    [74.88, 33.15], // Chenab Arch Gorge (359m)
    [75.18, 33.48], // Banihal / Pir Panjal Tunnel
    [74.80, 34.08]  // Srinagar
  ];

  const CAPTION_SCRIM_HEX = {
    royalCobalt: [2, 1, 62],
    deepIndigo: [2, 1, 36],
    crimsonAmber: [50, 8, 59],
    blueprintDark: [1, 3, 11],
    patrioticDusk: [39, 10, 78]
  };

  function drawBottomCaptionScrim(ctx, paletteName, strength = 0.88) {
    const [r, g, b] = CAPTION_SCRIM_HEX[paletteName] || CAPTION_SCRIM_HEX.royalCobalt;
    ctx.save();
    const grad = ctx.createLinearGradient(0, 1315, 0, H);
    grad.addColorStop(0.00, `rgba(${r}, ${g}, ${b}, 0.00)`);
    grad.addColorStop(0.24, `rgba(${r}, ${g}, ${b}, ${(0.76 * strength).toFixed(3)})`);
    grad.addColorStop(0.52, `rgba(${r}, ${g}, ${b}, ${(0.92 * strength).toFixed(3)})`);
    grad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, ${(0.97 * strength).toFixed(3)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 1315, W, H - 1315);
    ctx.restore();
  }

  function renderSingleScene(ctx, sc, localSec, globalFrameIdx) {
    const dur = sc.endSec - sc.startSec;
    const p = clamp(localSec / dur, 0, 1);

    drawStudioBackdrop(ctx, sc.palette || 'royalCobalt', sc.startSec + localSec);

    // =========================================================================
    // S01 (0.0s - 5.5s): FAST SNAP PULL-BACK ONTO SOVEREIGN INDIA + 3 REAL CLIPS
    // =========================================================================
    if (sc.id === 'S01_HOOK_ISOLATION') {
      const geoStops = [
        { t: 0.00, lon: 75.2, lat: 32.2, scale: 3900, cx: 540, cy: 690, curve: 'spring' },
        { t: 0.56, lon: 79.2, lat: 23.2, scale: 1700, cx: 540, cy: 760, curve: 'spring' },
        { t: 4.82, lon: 78.8, lat: 24.0, scale: 1820, cx: 540, cy: 750, curve: 'drift' },
        { t: 5.50, lon: 75.1, lat: 32.8, scale: 3600, cx: 540, cy: 640, curve: 'whip' }
      ];

      const gCam = renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const velDof = clamp((gc.speed - 700) / 380, 0, 7);
        mapStage.draw(gctx, gc, { indiaFillMode: 'gold', indiaGlow: 1.0, dofBlur: velDof });
        const [kx, ky] = mapStage.project(74.88, 33.25, gc);
        drawPinBeacon(gctx, kx, ky, 'KASHMIR VALLEY', st, '#FACC15');
      });

      const [kx, ky] = mapStage.project(74.88, 33.25, gCam);
      const exitWhip = expoInOut(clamp((localSec - 4.85) / 0.62, 0, 1));

      const cards = [
        { name: 'kashmir_snow_valley', title: 'Winter Snow', tag: 'CUT OFF', x: 64, y: 205, w: 430, h: 244, tIn: 0.72, dir: -1 },
        { name: 'chenab_arch_drone', title: 'Deep Canyon', tag: 'HIMALAYAS', x: 586, y: 295, w: 430, h: 244, tIn: 1.45, dir: 1 },
        { name: 'vande_bharat_kashmir', title: 'Missing Rail', tag: '75 YEARS', x: 68, y: 955, w: 448, h: 250, tIn: 2.25, dir: -1 }
      ];

      for (const c of cards) {
        const enter = snapOutSpring(clamp((localSec - c.tIn) / 0.44, 0, 1));
        const alpha = clamp((localSec - c.tIn) / 0.24, 0, 1) * (1 - exitWhip);
        if (alpha > 0.01) {
          const cx = c.x + (1 - enter) * c.dir * 240 + exitWhip * c.dir * 420;
          const cy = c.y + (1 - enter) * 40;

          // Golden telemetry ray connecting card to Kashmir beacon
          ctx.save();
          ctx.globalAlpha = alpha * 0.72;
          ctx.strokeStyle = '#FDE68A';
          ctx.setLineDash([6, 6]);
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(cx + c.w * 0.5, cy + c.h * 0.5);
          ctx.lineTo(kx, ky);
          ctx.stroke();
          ctx.restore();

          clipBank.drawClipCard(ctx, c.name, globalFrameIdx, cx, cy, c.w, c.h, {
            titleItalic: c.title, tagCaps: c.tag, alpha, zoom: 1.06
          });
        }
      }

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1445, maxWidth: 920, fontSize: 52,
        progress: clamp((localSec - 0.15) / 3.4, 0, 1),
        alpha: 1 - exitWhip * 0.85
      });
    }

    // =========================================================================
    // S02 (5.5s - 13.0s): PORTAL DIVE INTO 3D HIMALAYAS -> SNAP DOF CURIOSITY LOCK
    // =========================================================================
    else if (sc.id === 'S02_KASHMIR_PORTAL_DIVE') {
      const beatSplit = 3.75;
      const geoStops = [
        { t: 0.00, lon: 75.3, lat: 33.4, scale: 3800, cx: 540, cy: 840, curve: 'whip' },
        { t: 0.62, lon: 75.0, lat: 33.4, scale: 8600, cx: 540, cy: 960, curve: 'spring' },
        { t: 3.68, lon: 74.9, lat: 33.3, scale: 9400, cx: 540, cy: 960, curve: 'drift' },
        { t: 4.12, lon: 78.8, lat: 24.5, scale: 1850, cx: 540, cy: 760, curve: 'whip' },
        { t: 7.50, lon: 79.0, lat: 23.5, scale: 1740, cx: 540, cy: 760, curve: 'drift' }
      ];

      const snapOutP = easeInOutCubic(clamp((localSec - 3.68) / 0.46, 0, 1));
      renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        const steadyBlur = st >= 4.05 ? 12 : 0;
        const pulseBlur = Math.sin(clamp((st - 3.68) / 0.46, 0, 1) * Math.PI) * 14;
        mapStage.draw(gctx, gc, {
          indiaFillMode: st < 3.92 ? 'cobaltTerrain' : 'gold',
          showHimalayas: st < 4.05,
          indiaGlow: 1.0,
          dofBlur: Math.max(steadyBlur, pulseBlur)
        });
        if (st < 3.85) {
          const [bx, by] = mapStage.project(74.88, 33.15, gc);
          drawPinBeacon(gctx, bx, by, 'CHENAB ARCH • 359M', st, '#38BDF8');
        }
      });

      if (localSec < 4.05) {
        const cardA = clamp((localSec - 0.45) / 0.30, 0, 1) * (1 - snapOutP);
        const cardS = lerp(0.86, 1.0, snapOutSpring(clamp((localSec - 0.45) / 0.45, 0, 1)));
        ctx.save();
        ctx.translate(540, 455);
        ctx.scale(cardS, cardS);
        ctx.translate(-540, -455);
        clipBank.drawClipCard(ctx, 'chenab_arch_drone', globalFrameIdx, 96, 225, 888, 460, {
          titleItalic: 'Chenab Bridge', tagCaps: 'HIGHEST ARCH ON EARTH • 359M', alpha: cardA,
          borderColor: 'rgba(253, 230, 138, 0.90)'
        });
        ctx.restore();

        drawOpticalMarkup(ctx, sc.beatACaption, {
          x: 540, y: 1440, maxWidth: 920, fontSize: 52,
          progress: clamp((localSec - 0.2) / 2.6, 0, 1),
          alpha: 1 - snapOutP
        });
      }

      if (localSec >= beatSplit) {
        const bSec = localSec - beatSplit;
        const bDur = dur - beatSplit;
        drawTrackedCaps(ctx, 'ONE EXTREME SURVIVAL NUMBER', 540, 340, {
          fontSize: 22, tracking: 4.0, align: 'center', color: '#FDE68A',
          alpha: clamp(bSec / 0.35, 0, 1) * (1 - clamp((bSec - 2.8) / 0.5, 0, 1))
        });
        drawCuriosityLockWidget(ctx, 'plant', clamp(bSec / bDur, 0, 1));
        drawOpticalMarkup(ctx, sc.beatBCaption, {
          x: 540, y: 1445, maxWidth: 920, fontSize: 52,
          progress: clamp((bSec - 0.12) / 2.5, 0, 1)
        });
      }
    }

    // =========================================================================
    // S03 (13.0s - 19.5s): CANYON OVERVIEW -> 1.9X SNAP PUNCH INTO GORGE -> PULLBACK
    // =========================================================================
    else if (sc.id === 'S03_GORGE_CHALLENGE') {
      const camKeys = [
        { t: 0.00, x: 0, y: 0,    zoom: 1.32, roll: 0.008, curve: 'spring' },
        { t: 0.44, x: 0, y: 0,    zoom: 1.00, roll: 0.000, curve: 'spring' },
        { t: 2.05, x: 0, y: -10,  zoom: 1.03, roll: 0.000, curve: 'drift' },
        { t: 2.43, x: 0, y: -210, zoom: 1.78, roll: -0.010, curve: 'whip' },
        { t: 4.45, x: 24, y: -210, zoom: 1.84, roll: -0.008, curve: 'drift' },
        { t: 4.85, x: 0, y: 0,    zoom: 1.00, roll: 0.000, curve: 'spring' },
        { t: 6.50, x: 0, y: -12,  zoom: 1.04, roll: 0.000, curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.55, () => {
          mapStage.draw(sctx, { lon: 74.88, lat: 33.18, scale: 14500, cx: 540, cy: 940 }, {
            indiaFillMode: 'cobaltTerrain', showHimalayas: true, indiaGlow: 0.9
          });
        });

        withCameraPlane(sctx, cam, 1.0, () => {
          // Seismic Zone V Warning Pill
          drawFrostedCard(sctx, 210, 212, 660, 66, {
            radius: 33, fill: 'rgba(220, 38, 38, 0.26)', borderTop: 'rgba(252, 165, 165, 0.90)',
            glowColor: 'rgba(239, 68, 68, 0.45)', glowBlur: 24
          });
          drawTrackedCaps(sctx, 'SEISMIC ZONE V • HIGHEST QUAKE ZONE', 540, 245, {
            fontSize: 18, tracking: 3.0, align: 'center', color: '#FEE2E2'
          });

          // Hero Canyon Real-World Video Window
          clipBank.drawClipCard(sctx, 'chenab_arch_drone', globalFrameIdx, 88, 320, 904, 505, {
            titleItalic: 'Chenab Gorge', tagCaps: 'BAKKAL ↔ KAURI • REASI',
            borderColor: 'rgba(125, 211, 252, 0.88)'
          });

          // Bakkal & Kauri cliff-edge callout pills flanking the canyon
          drawFrostedCard(sctx, 88, 860, 434, 152, { radius: 24, fill: 'rgba(8, 22, 98, 0.78)' });
          drawTrackedCaps(sctx, 'WEST CLIFF', 124, 902, { fontSize: 15, color: '#93C5FD' });
          sctx.font = 'italic 400 54px InstrumentSerif'; sctx.fillStyle = '#FFFFFF';
          sctx.fillText('Bakkal', 124, 972);

          drawFrostedCard(sctx, 558, 860, 434, 152, { radius: 24, fill: 'rgba(8, 22, 98, 0.78)' });
          drawTrackedCaps(sctx, 'EAST CLIFF', 594, 902, { fontSize: 15, color: '#93C5FD' });
          sctx.font = 'italic 400 54px InstrumentSerif'; sctx.fillStyle = '#FFFFFF';
          sctx.fillText('Kauri', 594, 972);

          // Sheer 1,315m Canyon Span Telemetry Bar
          drawFrostedCard(sctx, 88, 1042, 904, 118, {
            radius: 24, fill: 'rgba(250, 204, 21, 0.14)', borderTop: 'rgba(253, 230, 138, 0.78)'
          });
          drawTrackedCaps(sctx, '1,315 METRE VIADUCT OVER ROARING RIVER', 540, 1101, {
            fontSize: 19, tracking: 3.0, align: 'center', color: '#FEF08A'
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.86);
      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1435, maxWidth: 920, fontSize: 51,
        progress: clamp((localSec - 0.15) / 3.8, 0, 1)
      });
    }

    // =========================================================================
    // S04 (19.5s - 26.5s): 3-BEAT EIFFEL 324M -> WHIP-ZOOM CHENAB 359M -> +35M!
    // =========================================================================
    else if (sc.id === 'S04_EIFFEL_VS_CHENAB') {
      const camKeys = [
        { t: 0.00, x: -235, y: 55,   zoom: 1.72, roll: -0.014, curve: 'spring' },
        { t: 1.70, x: -220, y: 45,   zoom: 1.76, roll: -0.010, curve: 'drift' },
        { t: 2.10, x: 175,  y: -140, zoom: 1.82, roll:  0.012, curve: 'whip' },
        { t: 3.65, x: 185,  y: -145, zoom: 1.86, roll:  0.010, curve: 'drift' },
        { t: 4.08, x: 0,    y: 0,    zoom: 1.00, roll:  0.000, curve: 'spring' },
        { t: 7.00, x: 0,    y: -14,  zoom: 1.04, roll:  0.000, curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'crimsonAmber', sc.startSec + st);

        withCameraPlane(sctx, cam, 0.35, () => {
          clipBank.drawFullBleedClip(sctx, 'eiffel_tower_paris', globalFrameIdx, {
            alpha: 0.22, blurPx: 9,
            tintTop: 'rgba(120, 26, 62, 0.72)',
            tintMid: 'rgba(189, 67, 56, 0.55)',
            tintBot: 'rgba(50, 8, 59, 0.88)'
          });
        });

        withCameraPlane(sctx, cam, 1.0, () => {
          // Real Eiffel Tower Paris drone inset card on top-left
          clipBank.drawClipCard(sctx, 'eiffel_tower_paris', globalFrameIdx, 76, 212, 356, 200, {
            titleItalic: 'Paris', tagCaps: '324M TOWER',
            borderColor: 'rgba(255, 255, 255, 0.78)'
          });

          // World Record Badge above Chenab
          drawFrostedCard(sctx, 466, 218, 524, 68, {
            radius: 34, fill: 'rgba(255, 244, 184, 0.18)', borderTop: '#FFFBEB',
            glowColor: 'rgba(250, 204, 21, 0.42)', glowBlur: 24
          });
          drawTrackedCaps(sctx, 'WORLD RECORD • +35M ABOVE EIFFEL', 728, 252, {
            fontSize: 16.5, tracking: 2.5, align: 'center', color: '#FFFDF2'
          });

          drawEiffelVsChenabMonument(sctx, {
            riverY: 1310,
            eiffelProgress: clamp(st / 1.45, 0, 1),
            chenabProgress: clamp((st - 1.55) / 1.55, 0, 1),
            trainProgress: clamp((st - 1.4) / 4.8, 0, 1)
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'crimsonAmber', 0.85);
      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1460, maxWidth: 920, fontSize: 52,
        progress: clamp((localSec - 0.15) / 4.0, 0, 1)
      });
    }

    // =========================================================================
    // S05 (26.5s - 34.0s): 28,660 TONNES ODOMETER + GIANT 915M CABLE CRANE CLIP
    // =========================================================================
    else if (sc.id === 'S05_STEEL_AND_TUNNELS') {
      const camKeys = [
        { t: 0.00, x: 0,   y: -260, zoom: 1.58, roll: 0.000,  curve: 'spring' },
        { t: 0.46, x: 0,   y: 0,    zoom: 1.00, roll: 0.000,  curve: 'spring' },
        { t: 2.20, x: 0,   y: 0,    zoom: 1.02, roll: 0.000,  curve: 'drift' },
        { t: 2.58, x: -95, y: 110,  zoom: 1.66, roll: -0.010, curve: 'whip' },
        { t: 4.55, x: 95,  y: 120,  zoom: 1.68, roll:  0.010, curve: 'whip' },
        { t: 4.98, x: 0,   y: 0,    zoom: 1.00, roll: 0.000,  curve: 'spring' },
        { t: 7.50, x: 0,   y: -10,  zoom: 1.03, roll: 0.000,  curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);

        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'BLAST-GRADE STRUCTURAL STEEL LIFTED IN MID-AIR', 540, 232, {
            fontSize: 18, tracking: 3.2, align: 'center', color: '#93C5FD'
          });

          drawOdometer(sctx, {
            startValue: 1200,
            value: 28660,
            suffix: 't',
            suffixItalicSerif: true,
            progress: clamp(st / 2.1, 0, 1),
            x: 540,
            y: 398,
            fontSize: 148,
            weight: 300,
            color: '#FFFFFF',
            suffixColor: '#FDE68A'
          });

          // Dual Real-World Construction Footage Cards: Real 915m Cable Crane + Mid-Air Crown Engineers!
          clipBank.drawClipCard(sctx, 'chenab_cable_crane', globalFrameIdx, 76, 465, 452, 340, {
            titleItalic: 'Cable Cranes', tagCaps: '915M SPAN',
            borderColor: 'rgba(253, 230, 138, 0.88)'
          });
          clipBank.drawClipCard(sctx, 'train_on_chenab', globalFrameIdx, 552, 465, 452, 340, {
            titleItalic: '467m Arch', tagCaps: 'MID-AIR BOLTS',
            borderColor: 'rgba(147, 197, 253, 0.88)'
          });

          // 10x4 Illuminated Steel Arch Segment Matrix + 467m Span Spec Card
          drawFrostedCard(sctx, 76, 840, 928, 395, {
            radius: 30, fill: 'rgba(10, 22, 112, 0.68)', borderTop: 'rgba(255, 255, 255, 0.52)'
          });
          drawTrackedCaps(sctx, '467-METRE ARCH SPAN • 8 MILLION CUBIC METRES EXCAVATED', 540, 892, {
            fontSize: 16.5, tracking: 2.6, align: 'center', color: '#FDE68A'
          });

          const cols = 10, rows = 4, totalSegs = cols * rows;
          const activeSegs = Math.round(easeOutQuart(clamp((st - 0.6) / 3.6, 0, 1)) * totalSegs);
          const gx0 = 128, gy0 = 936, cw = 72, ch = 54, gapX = 12, gapY = 14;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const idx = r * cols + c;
              const lit = idx < activeSegs;
              const bx = gx0 + c * (cw + gapX);
              const by = gy0 + r * (ch + gapY);
              roundRectPath(sctx, bx, by, cw, ch, 10);
              sctx.fillStyle = lit ? 'rgba(250, 204, 21, 0.88)' : 'rgba(255, 255, 255, 0.09)';
              sctx.fill();
              if (lit) {
                sctx.strokeStyle = '#FFFDF2';
                sctx.lineWidth = 1.4;
                sctx.stroke();
              }
            }
          }
        });
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1435, maxWidth: 920, fontSize: 52,
        progress: clamp((localSec - 0.15) / 4.2, 0, 1)
      });
    }

    // =========================================================================
    // S06 (34.0s - 41.5s): 4-BEAT TACTICAL CAD BLUEPRINT X-RAY WHIP INSPECTION!
    // =========================================================================
    else if (sc.id === 'S06_BLUEPRINT_BLAST_PROOF') {
      // Pier #2 blast reticle is around (315, 680) -> offset (-225, -280)
      // Wind sensors badge & crown deck are around (770, 500) -> offset (+230, -440)
      const camKeys = [
        { t: 0.00, x: 0,    y: 0,    zoom: 1.00, roll:  0.000, curve: 'drift' },
        { t: 1.50, x: 0,    y: 0,    zoom: 1.02, roll:  0.000, curve: 'drift' },
        { t: 1.88, x: -225, y: -275, zoom: 2.18, roll: -0.015, curve: 'whip' },
        { t: 3.25, x: -215, y: -270, zoom: 2.22, roll: -0.012, curve: 'drift' },
        { t: 3.63, x: 220,  y: -420, zoom: 2.04, roll:  0.014, curve: 'whip' },
        { t: 4.95, x: 225,  y: -415, zoom: 2.08, roll:  0.010, curve: 'drift' },
        { t: 5.35, x: 0,    y: 0,    zoom: 1.00, roll:  0.000, curve: 'spring' },
        { t: 7.50, x: 0,    y: -12,  zoom: 1.03, roll:  0.000, curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'blueprintDark', sc.startSec + st);

        const stepActive = st < 2.6 ? 1 : st < 3.45 ? 2 : 3;

        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'DRDO DEFENCE-GRADE STRUCTURAL X-RAY • REV 63MM', 540, 238, {
            fontSize: 17, tracking: 3.0, align: 'center', color: '#7DD3FC'
          });

          drawChenabBlueprintXRay(sctx, {
            cx: 540,
            cy: 700,
            stepActive,
            tSec: st
          });

          // Live Engineering Video Cards below CAD Arch
          clipBank.drawClipCard(sctx, 'train_on_chenab', globalFrameIdx, 82, 1050, 442, 240, {
            titleItalic: '63mm Steel', tagCaps: 'BLAST ARMOUR',
            borderColor: 'rgba(247, 201, 72, 0.85)'
          });
          clipBank.drawClipCard(sctx, 'chenab_arch_drone', globalFrameIdx, 556, 1050, 442, 240, {
            titleItalic: 'Pier Redundancy', tagCaps: 'SAFE AT 30 KM/H',
            borderColor: 'rgba(91, 192, 255, 0.85)'
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'blueprintDark', 0.94);
      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1435, maxWidth: 920, fontSize: 51,
        progress: clamp((localSec - 0.15) / 4.4, 0, 1)
      });
    }

    // =========================================================================
    // S07 (41.5s - 48.5s): CURIOSITY LOCK UNLOCK (266 KM/H!) + IMPACT PUNCH
    // =========================================================================
    else if (sc.id === 'S07_SECRET_266_KMH') {
      const camKeys = [
        { t: 0.00, x: 0, y: 0,   zoom: 1.00, roll: 0.000, curve: 'drift' },
        { t: 1.18, x: 0, y: -40, zoom: 1.00, roll: 0.000, curve: 'drift' },
        { t: 1.38, x: 0, y: -95, zoom: 1.16, roll: -0.008, curve: 'whip' },
        { t: 1.75, x: 0, y: 0,   zoom: 1.00, roll: 0.000, curve: 'spring' },
        { t: 7.00, x: 0, y: -15, zoom: 1.04, roll: 0.000, curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);

        withCameraPlane(sctx, cam, 0.45, () => {
          clipBank.drawFullBleedClip(sctx, 'chenab_arch_drone', globalFrameIdx, {
            alpha: 0.42, blurPx: 4.5,
            tintTop: 'rgba(6, 14, 92, 0.72)',
            tintMid: 'rgba(8, 22, 110, 0.48)',
            tintBot: 'rgba(3, 6, 48, 0.90)'
          });

          // High-altitude cyclonic Himalayan wind streamlines
          sctx.save();
          sctx.strokeStyle = 'rgba(186, 230, 253, 0.22)';
          sctx.lineWidth = 2;
          for (let w = 0; w < 9; w++) {
            const wy = 240 + w * 135;
            const wx = ((st * 980 + w * 230) % (W + 500)) - 350;
            sctx.beginPath();
            sctx.moveTo(wx, wy);
            sctx.lineTo(wx + 280, wy - 14);
            sctx.stroke();
          }
          sctx.restore();
        });

        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'SECRET SURVIVAL NUMBER UNLOCKED', 540, 245, {
            fontSize: 20, tracking: 3.8, align: 'center', color: '#FDE68A'
          });

          drawCuriosityLockWidget(sctx, 'unlock', clamp(st / dur, 0, 1));

          const specs = [
            { title: 'MAGNITUDE 8.0', sub: 'SEISMIC ZONE V QUAKE RATING', tIn: 1.85 },
            { title: '-20°C SUB-ZERO', sub: 'HIMALAYAN ARCTIC STEEL TOUGHNESS', tIn: 2.45 },
            { title: '120-YEAR LIFE', sub: 'AUTO-STOP SENSORS ABOVE 90 KM/H WIND', tIn: 3.05 }
          ];
          for (let i = 0; i < specs.length; i++) {
            const sp = specs[i];
            const ep = snapOutSpring(clamp((st - sp.tIn) / 0.42, 0, 1));
            const al = clamp((st - sp.tIn) / 0.24, 0, 1);
            if (al > 0.01) {
              const sy = 852 + i * 136 + (1 - ep) * 48;
              drawFrostedCard(sctx, 110, sy, 860, 114, {
                radius: 26, fill: 'rgba(12, 26, 128, 0.76)',
                borderTop: 'rgba(253, 230, 138, 0.80)', alpha: al
              });
              sctx.save();
              sctx.globalAlpha = al;
              sctx.font = 'italic 400 50px InstrumentSerif';
              sctx.fillStyle = '#FFFBEB';
              sctx.textBaseline = 'middle';
              sctx.fillText(sp.title, 152, sy + 58);
              sctx.restore();
              drawTrackedCaps(sctx, sp.sub, 930, sy + 58, {
                fontSize: 15, tracking: 2.0, align: 'right', color: '#BAE6FD', alpha: al
              });
            }
          }
        });
      });

      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1435, maxWidth: 920, fontSize: 51,
        progress: clamp((localSec - 0.15) / 4.0, 0, 1)
      });
    }

    // =========================================================================
    // S08 (48.5s - 55.5s): RAPID 0.36S EXPO-IN-OUT HIMALAYAN WHIP-HOP ROUTE!
    // =========================================================================
    else if (sc.id === 'S08_USBRL_WHIP_ROUTE') {
      const geoStops = [
        { t: 0.00, lon: 74.86, lat: 32.73, scale: 26000, cx: 540, cy: 900, curve: 'spring' }, // Jammu
        { t: 1.15, lon: 74.86, lat: 32.73, scale: 26500, cx: 540, cy: 900, curve: 'drift' },
        { t: 1.52, lon: 75.14, lat: 32.92, scale: 27000, cx: 540, cy: 900, curve: 'whip' },   // Udhampur
        { t: 2.60, lon: 75.14, lat: 32.92, scale: 27500, cx: 540, cy: 900, curve: 'drift' },
        { t: 2.97, lon: 74.89, lat: 33.13, scale: 29000, cx: 540, cy: 920, curve: 'whip' },   // Chenab & Anji Khad
        { t: 4.15, lon: 74.89, lat: 33.13, scale: 29500, cx: 540, cy: 920, curve: 'drift' },
        { t: 4.54, lon: 74.80, lat: 34.08, scale: 26000, cx: 540, cy: 900, curve: 'whip' },   // Srinagar!
        { t: 5.45, lon: 74.80, lat: 34.08, scale: 26000, cx: 540, cy: 900, curve: 'drift' },
        { t: 5.88, lon: 74.96, lat: 33.42, scale: 11200, cx: 540, cy: 860, curve: 'spring' }, // Full 272km Corridor!
        { t: 7.00, lon: 74.96, lat: 33.42, scale: 10800, cx: 540, cy: 860, curve: 'drift' }
      ];

      renderGeoWithShutter(ctx, localSec, geoStops, (gctx, st, gc) => {
        mapStage.draw(gctx, gc, {
          indiaFillMode: 'cobaltTerrain',
          showHimalayas: true,
          indiaGlow: 1.0
        });
        mapStage.drawRailTrack(gctx, USBRL_WAYPOINTS, gc, clamp(st / 5.2, 0.08, 1.0));

        const stations = [
          { lon: 74.86, lat: 32.73, name: 'JAMMU', tIn: 0.05 },
          { lon: 75.14, lat: 32.92, name: 'UDHAMPUR', tIn: 1.40 },
          { lon: 74.93, lat: 33.08, name: 'ANJI KHAD', tIn: 2.85 },
          { lon: 74.88, lat: 33.15, name: 'CHENAB 359M', tIn: 2.95 },
          { lon: 74.80, lat: 34.08, name: 'SRINAGAR', tIn: 4.45 }
        ];
        for (const s of stations) {
          if (st >= s.tIn) {
            const [sx, sy] = mapStage.project(s.lon, s.lat, gc);
            if (sx > -80 && sx < W + 80 && sy > 150 && sy < 1420) {
              drawPinBeacon(gctx, sx, sy, s.name, st, '#FACC15');
            }
          }
        }
      });

      // Top 272 KM Corridor Odometer Header + Dynamic Station Real-Clip Inset
      drawFrostedCard(ctx, 84, 208, 430, 195, {
        radius: 26, fill: 'rgba(8, 20, 108, 0.84)', borderTop: 'rgba(253, 230, 138, 0.85)'
      });
      drawTrackedCaps(ctx, 'USBRL HIMALAYAN LINK', 299, 248, {
        fontSize: 15, tracking: 2.4, align: 'center', color: '#93C5FD'
      });
      drawOdometer(ctx, {
        startValue: 40, value: 272, suffix: 'km', suffixItalicSerif: true,
        progress: clamp(localSec / 4.8, 0, 1),
        x: 299, y: 360, fontSize: 92, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
      });

      const activeClip = localSec < 2.8 ? 'anji_khad_rail'
        : localSec < 4.35 ? 'chenab_arch_drone'
          : 'vande_bharat_kashmir';
      const activeTitle = localSec < 2.8 ? 'Udhampur'
        : localSec < 4.35 ? 'Chenab & Anji'
          : 'Srinagar Link';
      clipBank.drawClipCard(ctx, activeClip, globalFrameIdx, 540, 208, 456, 256, {
        titleItalic: activeTitle, tagCaps: 'LIVE CORRIDOR',
        borderColor: 'rgba(253, 230, 138, 0.90)'
      });

      drawBottomCaptionScrim(ctx, 'royalCobalt', 0.88);
      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1440, maxWidth: 920, fontSize: 51,
        progress: clamp((localSec - 0.12) / 4.2, 0, 1)
      });
    }

    // =========================================================================
    // S09 (55.5s - 61.5s): HONEST PART — 38 TUNNELS, 20+ YEARS & ₹37,000 CRORE
    // =========================================================================
    else if (sc.id === 'S09_HONEST_PART') {
      const camKeys = [
        { t: 0.00, x: 90, y: 0,   zoom: 1.30, roll: 0.008,  curve: 'spring' },
        { t: 0.42, x: 0,  y: 0,   zoom: 1.00, roll: 0.000,  curve: 'spring' },
        { t: 2.35, x: 0,  y: 0,   zoom: 1.02, roll: 0.000,  curve: 'drift' },
        { t: 2.72, x: 0,  y: 135, zoom: 1.38, roll: -0.006, curve: 'whip' },
        { t: 4.35, x: 0,  y: 140, zoom: 1.40, roll: -0.005, curve: 'drift' },
        { t: 4.74, x: 0,  y: 0,   zoom: 1.00, roll: 0.000,  curve: 'spring' },
        { t: 6.00, x: 0,  y: -10, zoom: 1.03, roll: 0.000,  curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'deepIndigo', sc.startSec + st);

        withCameraPlane(sctx, cam, 1.0, () => {
          drawOpticalMarkup(sctx, 'Now, the *honest* part.', {
            x: 540, y: 262, maxWidth: 880, fontSize: 56, progress: clamp(st / 0.65, 0, 1)
          });

          clipBank.drawClipCard(sctx, 'anji_khad_rail', globalFrameIdx, 88, 325, 904, 380, {
            titleItalic: '38 Tunnels', tagCaps: '119 KM INSIDE YOUNG HIMALAYAN ROCK',
            borderColor: 'rgba(196, 181, 253, 0.85)'
          });

          // Card 1: 20+ Years Timeline Bar
          drawFrostedCard(sctx, 88, 742, 904, 218, {
            radius: 28, fill: 'rgba(30, 27, 115, 0.72)', borderTop: 'rgba(196, 181, 253, 0.68)'
          });
          drawTrackedCaps(sctx, 'SHIFTING FAULT LINES & HIMALAYAN GEOLOGY', 130, 792, {
            fontSize: 16, tracking: 2.4, color: '#C4B5FD'
          });
          drawOdometer(sctx, {
            startValue: 2, value: 20, suffix: '+ yrs', suffixItalicSerif: true,
            progress: clamp((st - 0.6) / 1.8, 0, 1),
            x: 130, y: 908, align: 'left', fontSize: 102, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
          });
          const bar1W = 390 * easeOutQuart(clamp((st - 0.7) / 1.8, 0, 1));
          roundRectPath(sctx, 540, 862, 405, 24, 12);
          sctx.fillStyle = 'rgba(255,255,255,0.12)'; sctx.fill();
          if (bar1W > 8) {
            roundRectPath(sctx, 540, 862, bar1W, 24, 12);
            sctx.fillStyle = '#A78BFA'; sctx.fill();
          }

          // Card 2: ₹37,000 Crore Investment Odometer
          drawFrostedCard(sctx, 88, 990, 904, 232, {
            radius: 28, fill: 'rgba(30, 27, 115, 0.78)', borderTop: 'rgba(253, 230, 138, 0.80)'
          });
          drawTrackedCaps(sctx, 'TOTAL HIMALAYAN RAIL CORRIDOR INVESTMENT', 130, 1040, {
            fontSize: 16, tracking: 2.4, color: '#FDE68A'
          });
          drawOdometer(sctx, {
            prefix: '₹', startValue: 4000, value: 37000, suffix: 'Cr', suffixItalicSerif: true,
            indianGrouping: true,
            progress: clamp((st - 1.25) / 2.1, 0, 1),
            x: 130, y: 1172, align: 'left', fontSize: 106, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A'
          });
        });
      });

      drawBottomCaptionScrim(ctx, 'deepIndigo', 0.90);
      drawOpticalMarkup(ctx, sc.captionMarkup, {
        x: 540, y: 1435, maxWidth: 920, fontSize: 51,
        progress: clamp((localSec - 0.15) / 3.8, 0, 1)
      });
    }

    // =========================================================================
    // S10 (61.5s - 70.0s): VANDE BHARAT 3 HRS -> SNAP RACK-FOCUS GLASS REFRAME!
    // =========================================================================
    else if (sc.id === 'S10_VANDE_BHARAT_REFRAME') {
      const splitT = 3.85;
      const camKeys = [
        { t: 0.00, x: 0, y: -120, zoom: 1.42, roll: 0.000, curve: 'spring' },
        { t: 0.46, x: 0, y: 0,    zoom: 1.00, roll: 0.000, curve: 'spring' },
        { t: 3.65, x: 0, y: -30,  zoom: 1.12, roll: 0.000, curve: 'drift' },
        { t: 4.08, x: 0, y: 0,    zoom: 1.00, roll: 0.000, curve: 'whip' },
        { t: 8.50, x: 0, y: -18,  zoom: 1.05, roll: 0.000, curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        const rackT = expoInOut(clamp((st - 3.65) / 0.44, 0, 1));

        withCameraPlane(sctx, cam, 0.5, () => {
          mapStage.draw(sctx, { lon: 78.8, lat: 24.5, scale: 1850, cx: 540, cy: 780 }, {
            indiaFillMode: 'warm', indiaGlow: 1.0, dofBlur: lerp(4, 13, rackT), alpha: 0.85
          });
        });

        if (st < 4.08) {
          const aAlpha = 1 - rackT;
          withCameraPlane(sctx, cam, 1.0, () => {
            clipBank.drawClipCard(sctx, 'vande_bharat_kashmir', globalFrameIdx, 82, 232, 916, 560, {
              titleItalic: 'Vande Bharat', tagCaps: 'ALL-WEATHER HIMALAYAN EXPRESS',
              alpha: aAlpha, borderColor: 'rgba(253, 230, 138, 0.94)'
            });

            drawFrostedCard(sctx, 82, 832, 916, 390, {
              radius: 32, fill: 'rgba(10, 22, 118, 0.74)', borderTop: 'rgba(255, 240, 175, 0.82)', alpha: aAlpha
            });
            drawTrackedCaps(sctx, 'JAMMU TO SRINAGAR • 365 DAYS A YEAR', 540, 892, {
              fontSize: 18, tracking: 3.2, align: 'center', color: '#BAE6FD', alpha: aAlpha
            });
            drawOdometer(sctx, {
              startValue: 12, value: 3, suffix: 'hours', suffixItalicSerif: true,
              progress: clamp(st / 1.9, 0, 1),
              x: 540, y: 1105, fontSize: 162, weight: 300, color: '#FFFFFF', suffixColor: '#FDE68A', alpha: aAlpha
            });
          });
        }

        if (st >= 3.65) {
          const bSec = Math.max(0, st - splitT);
          const bIn = snapOutSpring(clamp((st - 3.72) / 0.48, 0, 1));
          withCameraPlane(sctx, cam, 1.0, () => {
            // Card 1: Muted normal bridge
            drawFrostedCard(sctx, 86, 235 + (1 - bIn) * 60, 908, 325, {
              radius: 32, fill: 'rgba(255, 255, 255, 0.08)', borderTop: 'rgba(255, 255, 255, 0.36)', alpha: rackT
            });
            drawOpticalMarkup(sctx, 'A normal bridge connects two *riverbanks.*', {
              x: 540, y: 390 + (1 - bIn) * 60, maxWidth: 800, fontSize: 52,
              progress: clamp(bSec / 1.3, 0, 1), alpha: rackT, italicColor: '#E2E8F0'
            });

            // Card 2: Hero Golden Sovereign Reframe + 3 Live Real-India Video Windows!
            const c2A = clamp((bSec - 0.65) / 0.38, 0, 1);
            const c2S = lerp(0.90, 1.0, snapOutSpring(clamp((bSec - 0.65) / 0.52, 0, 1)));
            sctx.save();
            sctx.translate(540, 935);
            sctx.scale(c2S, c2S);
            sctx.translate(-540, -935);

            drawFrostedCard(sctx, 86, 600, 908, 670, {
              radius: 36, fill: 'rgba(14, 28, 138, 0.80)',
              borderTop: 'rgba(255, 238, 155, 0.96)', borderWidth: 2.4,
              glowColor: 'rgba(250, 204, 21, 0.45)', glowBlur: 40, alpha: c2A
            });
            drawTrackedCaps(sctx, 'A 359M HIMALAYAN ARCH UNITES A', 540, 675, {
              fontSize: 21, tracking: 3.8, align: 'center', color: '#DBEAFE', alpha: c2A
            });

            sctx.save();
            sctx.globalAlpha = c2A;
            sctx.shadowColor = 'rgba(250, 204, 21, 0.72)';
            sctx.shadowBlur = 28;
            sctx.font = 'italic 400 132px InstrumentSerif';
            sctx.fillStyle = '#FDE68A';
            sctx.textAlign = 'center';
            sctx.fillText('nation.', 540, 825);
            sctx.restore();

            const minis = [
              { name: 'chenab_arch_drone', tag: '359M ARCH' },
              { name: 'vande_bharat_kashmir', tag: 'VANDE BHARAT' },
              { name: 'kashmir_snow_valley', tag: 'ALL WINTER' }
            ];
            for (let m = 0; m < 3; m++) {
              clipBank.drawClipCard(sctx, minis[m].name, globalFrameIdx, 124 + m * 284, 895, 264, 325, {
                tagCaps: minis[m].tag, alpha: c2A, radius: 20, borderColor: 'rgba(255, 244, 184, 0.82)'
              });
            }
            sctx.restore();
          });
        }
      });

      if (localSec < splitT) {
        drawOpticalMarkup(ctx, sc.beatACaption, {
          x: 540, y: 1445, maxWidth: 920, fontSize: 52,
          progress: clamp((localSec - 0.12) / 2.6, 0, 1),
          alpha: 1 - clamp((localSec - 3.55) / 0.30, 0, 1)
        });
      } else {
        drawOpticalMarkup(ctx, sc.beatBCaption, {
          x: 540, y: 1445, maxWidth: 920, fontSize: 52,
          progress: clamp((localSec - splitT - 0.1) / 3.0, 0, 1)
        });
      }
    }

    // =========================================================================
    // S11 (70.0s - 74.5s): PATRIOTIC DUSK INTERACTIVE POLL CTA
    // =========================================================================
    else if (sc.id === 'S11_POLL_CTA') {
      const camKeys = [
        { t: 0.00, x: 0, y: 80, zoom: 1.24, roll: 0, curve: 'spring' },
        { t: 0.44, x: 0, y: 0,  zoom: 1.00, roll: 0, curve: 'spring' },
        { t: 4.50, x: 0, y: -12, zoom: 1.03, roll: 0, curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'patrioticDusk', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.45, () => {
          clipBank.drawFullBleedClip(sctx, 'kashmir_snow_valley', globalFrameIdx, {
            alpha: 0.34, blurPx: 6,
            tintTop: 'rgba(106, 30, 130, 0.72)',
            tintMid: 'rgba(200, 90, 72, 0.50)',
            tintBot: 'rgba(39, 10, 78, 0.88)'
          });
        });

        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'INDIA ENGINEERING POLL • DROP ONE WORD', 540, 232, {
            fontSize: 19, tracking: 3.4, align: 'center', color: '#FDE68A'
          });
          drawOpticalMarkup(sctx, sc.captionMarkup, {
            x: 540, y: 345, maxWidth: 900, fontSize: 54,
            progress: clamp((st - 0.08) / 2.6, 0, 1)
          });

          const activeIdx = st < 2.1 ? 0 : st < 2.95 ? 1 : st < 3.65 ? 2 : 0;
          drawPollWidget(sctx, [
            { label: 'Chenab Bridge' },
            { label: 'Atal Tunnel' },
            { label: 'Pamban Bridge' }
          ], activeIdx, p);
        });
      });
    }

    // =========================================================================
    // S12 (74.5s - 78.0s): WHIP-PAN SHARE OUTRO + ANIMATED DM CARD
    // =========================================================================
    else if (sc.id === 'S12_SHARE_OUTRO') {
      const camKeys = [
        { t: 0.00, x: 0, y: 95, zoom: 1.22, roll: 0, curve: 'spring' },
        { t: 0.42, x: 0, y: 0,  zoom: 1.00, roll: 0, curve: 'spring' },
        { t: 3.50, x: 0, y: -10, zoom: 1.03, roll: 0, curve: 'drift' }
      ];

      renderWithShutterBlur(ctx, localSec, camKeys, (sctx, st, cam) => {
        drawStudioBackdrop(sctx, 'royalCobalt', sc.startSec + st);
        withCameraPlane(sctx, cam, 0.45, () => {
          clipBank.drawFullBleedClip(sctx, 'vande_bharat_kashmir', globalFrameIdx, {
            alpha: 0.30, blurPx: 6,
            tintTop: 'rgba(8, 18, 120, 0.76)',
            tintMid: 'rgba(10, 24, 108, 0.56)',
            tintBot: 'rgba(2, 4, 48, 0.90)'
          });
          mapStage.draw(sctx, { lon: 79.0, lat: 23.2, scale: 1680, cx: 540, cy: 820 }, {
            indiaFillMode: 'gold', indiaGlow: 0.8, dofBlur: 8, alpha: 0.42
          });
        });

        withCameraPlane(sctx, cam, 1.0, () => {
          drawTrackedCaps(sctx, 'SHARE THIS HIMALAYAN MARVEL', 540, 245, {
            fontSize: 19, tracking: 3.6, align: 'center', color: '#FDE68A'
          });
          drawOpticalMarkup(sctx, sc.captionMarkup, {
            x: 540, y: 355, maxWidth: 900, fontSize: 54,
            progress: clamp((st - 0.08) / 2.1, 0, 1)
          });
          drawDMShareCard(sctx, p);
        });
      });
    }

    // Persistent Top Chapter Rail & Docked Curiosity Lock (screen-space crisp HUD)
    if (sc.showRail) {
      drawChapterRail(ctx, chapters, sc.chapter, 1.0);
    }
    if (sc.lockState === 'docked') {
      drawCuriosityLockWidget(ctx, 'docked', 1.0);
    }
  }

  function getTransitionOrigin(sc) {
    if (sc.id === 'S02_KASHMIR_PORTAL_DIVE') {
      // Exact Kashmir beacon coordinates at end of S01!
      return mapStage.project(74.88, 33.25, { lon: 75.1, lat: 32.8, scale: 3600, cx: 540, cy: 640 });
    }
    if (sc.id === 'S04_EIFFEL_VS_CHENAB') return [540, 620];
    if (sc.id === 'S11_POLL_CTA') return [540, 960];
    return [540, 760];
  }

  function renderFrame(frameIdx) {
    const tSec = clamp(frameIdx / fps, 0, script.totalDurationSec - 0.001);
    let scIdx = scenes.length - 1;
    for (let i = 0; i < scenes.length; i++) {
      if (tSec >= scenes[i].startSec && tSec < scenes[i].endSec) {
        scIdx = i;
        break;
      }
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
