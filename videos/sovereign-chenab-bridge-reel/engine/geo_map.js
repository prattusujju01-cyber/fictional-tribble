// engine/geo_map.js (v3.0 — Sovereign India + 3D Himalayan Peaks + Velocity DOF + Rail Track)

import { W, H, clamp, easeOutCubic, mulberry32 } from './camera_v3.js';

export class SovereignMapStage {
  constructor(geoData) {
    this.worldFeatures = geoData.worldFeatures || [];
    this.indiaFeature = geoData.indiaFeature;
    this.sharpCanvas = document.createElement('canvas');
    this.sharpCanvas.width = W;
    this.sharpCanvas.height = H;
    this.blurCanvas = document.createElement('canvas');
    this.blurCanvas.width = 540;
    this.blurCanvas.height = 960;
    this.lastBlurKey = '';

    // Pre-generate deterministic 3D Himalayan mountain ridges across J&K / Ladakh / Himachal (exact match to a.mp4 00:02!)
    const rng = mulberry32(3591315);
    this.himalayaPeaks = [];
    const ridges = [
      // Pir Panjal ridge (south of Srinagar)
      [73.9, 33.8], [74.2, 33.6], [74.5, 33.45], [74.75, 33.32], [75.1, 33.25], [75.4, 33.1], [75.8, 32.95], [76.2, 32.8],
      // Great Himalayan ridge (north/east of Chenab Gorge)
      [74.3, 34.45], [74.7, 34.3], [75.05, 34.15], [75.4, 33.95], [75.8, 33.75], [76.25, 33.55], [76.7, 33.35], [77.1, 33.1],
      // Karakoram / Ladakh northern crown
      [74.6, 35.4], [75.2, 35.25], [75.8, 35.05], [76.4, 34.85], [77.0, 34.65], [77.6, 34.4], [78.1, 34.1]
    ];
    for (const [baseLon, baseLat] of ridges) {
      for (let k = 0; k < 3; k++) {
        this.himalayaPeaks.push({
          lon: baseLon + (rng() - 0.5) * 0.42,
          lat: baseLat + (rng() - 0.5) * 0.32,
          size: 0.75 + rng() * 0.70
        });
      }
    }
    this.himalayaPeaks.sort((a, b) => b.lat - a.lat); // back-to-front painter's order!
  }

  project(lon, lat, cam) {
    const rad = Math.PI / 180;
    const clampedLat = clamp(lat, -82, 82);
    const x0 = cam.lon * rad;
    const y0 = Math.log(Math.tan(Math.PI / 4 + (clamp(cam.lat, -82, 82) * rad) / 2));
    const x = lon * rad;
    const y = Math.log(Math.tan(Math.PI / 4 + (clampedLat * rad) / 2));
    const px = (cam.cx ?? W / 2) + (x - x0) * cam.scale;
    const py = (cam.cy ?? H * 0.48) - (y - y0) * cam.scale;
    return [px, py];
  }

  traceGeometry(ctx, geom, cam) {
    if (!geom) return;
    const drawRing = (ring) => {
      if (!ring || ring.length < 3) return;
      let started = false;
      let prevLon = ring[0][0];
      for (let i = 0; i < ring.length; i++) {
        const [lon, lat] = ring[i];
        if (Math.abs(lon - prevLon) > 170) started = false;
        const [px, py] = this.project(lon, lat, cam);
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
        prevLon = lon;
      }
      ctx.closePath();
    };
    if (geom.type === 'Polygon') {
      for (const ring of geom.coordinates) drawRing(ring);
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        for (const ring of poly) drawRing(ring);
      }
    }
  }

  renderMapToContext(ctx, cam, opts = {}) {
    const {
      highlightedIsos = {},
      indiaGlow = 1.0,
      indiaFillMode = 'gold', // 'gold' | 'cobaltTerrain' | 'warm' | 'purple'
      showHimalayas = false,
      showGraticule = true
    } = opts;

    ctx.clearRect(0, 0, W, H);

    if (showGraticule) {
      ctx.save();
      ctx.strokeStyle = 'rgba(130, 175, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let lon = -150; lon <= 180; lon += 15) {
        const [x1, y1] = this.project(lon, -70, cam);
        const [x2, y2] = this.project(lon, 75, cam);
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }
      for (let lat = -60; lat <= 75; lat += 10) {
        const [x1, y1] = this.project(-175, lat, cam);
        const [x2, y2] = this.project(175, lat, cam);
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Neighbor countries
    ctx.save();
    for (const feat of this.worldFeatures) {
      const iso = feat.iso || feat.name || '';
      const hl = highlightedIsos[iso] || 0;
      ctx.beginPath();
      this.traceGeometry(ctx, feat.geometry, cam);
      if (hl > 0.01) {
        ctx.fillStyle = `rgba(246, 198, 78, ${(0.22 + 0.65 * hl).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 240, 175, ${(0.45 + 0.50 * hl).toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(32, 62, 178, 0.38)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(135, 180, 255, 0.30)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
    ctx.restore();

    // Sovereign India Polygon
    if (this.indiaFeature) {
      const [ix1, iy1] = this.project(68, 37, cam);
      const [ix2, iy2] = this.project(97, 8, cam);

      ctx.save();
      ctx.beginPath();
      this.traceGeometry(ctx, this.indiaFeature.geometry, cam);

      if (indiaGlow > 0.02) {
        ctx.shadowColor = indiaFillMode === 'cobaltTerrain'
          ? 'rgba(250, 204, 21, 0.55)'
          : 'rgba(248, 190, 52, 0.78)';
        ctx.shadowBlur = 36 * indiaGlow;
      }

      if (indiaFillMode === 'cobaltTerrain') {
        // Deep tactical cobalt terrain inside J&K with crisp golden sovereign border (exact match to cam_a_kashmir_dive.jpg!)
        const tg = ctx.createRadialGradient(W * 0.5, H * 0.5, 40, W * 0.5, H * 0.5, 950);
        tg.addColorStop(0, '#1D399E');
        tg.addColorStop(1, '#0A1658');
        ctx.fillStyle = tg;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 3.2;
        ctx.stroke();
      } else {
        const grad = ctx.createLinearGradient(ix1, iy1, ix2, iy2);
        if (indiaFillMode === 'purple') {
          grad.addColorStop(0, '#7C3AED');
          grad.addColorStop(1, '#4C1D95');
        } else if (indiaFillMode === 'warm') {
          grad.addColorStop(0, '#FFF4B8');
          grad.addColorStop(0.55, '#FACC15');
          grad.addColorStop(1, '#EA8D22');
        } else {
          grad.addColorStop(0, '#FFEB94');
          grad.addColorStop(0.55, '#F6C652');
          grad.addColorStop(1, '#E69D28');
        }
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FFF9DB';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3D Shaded Himalayan Mountain Peaks + Turquoise Chenab River Canyon (exact match to a.mp4 00:02!)
    if (showHimalayas) {
      ctx.save();
      // Turquoise Chenab River winding through Reasi gorge
      const riverCoords = [
        [76.8, 32.75], [76.1, 33.05], [75.5, 33.18], [74.88, 33.15], [74.55, 32.92], [74.1, 32.6]
      ];
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = clamp(cam.scale / 550, 3.5, 18);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      riverCoords.forEach(([lo, la], idx) => {
        const [rx, ry] = this.project(lo, la, cam);
        if (idx === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Isometric shaded 3D Himalayan peaks
      const baseSize = clamp(cam.scale / 110, 8, 34);
      for (const pk of this.himalayaPeaks) {
        const [px, py] = this.project(pk.lon, pk.lat, cam);
        if (px < -60 || px > W + 60 || py < -60 || py > H + 60) continue;
        const h = baseSize * pk.size;
        const w = h * 0.95;

        // Left shadowed face
        ctx.fillStyle = 'rgba(15, 28, 96, 0.92)';
        ctx.beginPath();
        ctx.moveTo(px, py - h);
        ctx.lineTo(px - w, py + h * 0.35);
        ctx.lineTo(px, py + h * 0.52);
        ctx.closePath();
        ctx.fill();

        // Right sunlit ice-cap face
        const snowG = ctx.createLinearGradient(px, py - h, px + w, py + h * 0.35);
        snowG.addColorStop(0, '#E0F2FE');
        snowG.addColorStop(0.45, '#7DD3FC');
        snowG.addColorStop(1, '#2563EB');
        ctx.fillStyle = snowG;
        ctx.beginPath();
        ctx.moveTo(px, py - h);
        ctx.lineTo(px + w, py + h * 0.35);
        ctx.lineTo(px, py + h * 0.52);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  draw(ctx, cam, opts = {}) {
    const {
      dofBlur = 0,
      alpha = 1.0,
      highlightedIsos = {},
      indiaGlow = 1.0,
      indiaFillMode = 'gold',
      showHimalayas = false,
      showGraticule = true
    } = opts;

    if (alpha <= 0.005) return;

    if (dofBlur < 0.8) {
      const sctx = this.sharpCanvas.getContext('2d');
      this.renderMapToContext(sctx, cam, { highlightedIsos, indiaGlow, indiaFillMode, showHimalayas, showGraticule });
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.sharpCanvas, 0, 0);
      ctx.restore();
      return;
    }

    const key = `${Math.round(cam.lon * 20)}_${Math.round(cam.lat * 20)}_${Math.round(cam.scale)}_${Math.round(dofBlur)}_${indiaFillMode}_${showHimalayas ? 1 : 0}`;
    if (this.lastBlurKey !== key) {
      const sctx = this.sharpCanvas.getContext('2d');
      this.renderMapToContext(sctx, cam, { highlightedIsos, indiaGlow, indiaFillMode, showHimalayas, showGraticule: false });
      const bctx = this.blurCanvas.getContext('2d');
      bctx.clearRect(0, 0, this.blurCanvas.width, this.blurCanvas.height);
      bctx.save();
      bctx.filter = `blur(${(dofBlur * 0.5).toFixed(1)}px)`;
      bctx.drawImage(this.sharpCanvas, 0, 0, this.blurCanvas.width, this.blurCanvas.height);
      bctx.restore();
      this.lastBlurKey = key;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.blurCanvas, 0, 0, W, H);
    ctx.restore();
  }

  drawRailTrack(ctx, waypoints, cam, progress = 1.0) {
    const p = clamp(progress, 0, 1);
    if (p <= 0.005 || waypoints.length < 2) return;

    const pts = waypoints.map(([lo, la]) => this.project(lo, la, cam));
    ctx.save();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 5;
    ctx.shadowColor = 'rgba(250, 204, 21, 0.88)';
    ctx.shadowBlur = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Interpolate along polyline up to p
    const segLens = [];
    let totalLen = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segLens.push(d);
      totalLen += d;
    }
    const targetLen = totalLen * easeOutCubic(p);

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    let acc = 0;
    let head = pts[0];
    for (let i = 0; i < segLens.length; i++) {
      if (acc + segLens[i] <= targetLen) {
        ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
        head = pts[i + 1];
        acc += segLens[i];
      } else {
        const rem = (targetLen - acc) / Math.max(0.001, segLens[i]);
        const hx = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * rem;
        const hy = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * rem;
        ctx.lineTo(hx, hy);
        head = [hx, hy];
        break;
      }
    }
    ctx.stroke();

    // Glowing train head comet
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(head[0], head[1], 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return head;
  }
}
