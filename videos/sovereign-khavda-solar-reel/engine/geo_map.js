// engine/geo_map.js (v3.0 — Sovereign India + Kutch Salt-Rann 538 sq km Solar Grid + 765kV Green Corridor)

import { W, H, clamp, easeOutCubic } from './camera_v3.js';

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
      indiaFillMode = 'gold', // 'gold' | 'cobaltTerrain' | 'warm'
      showKhavdaFootprint = false,
      showGraticule = true,
      pulseSec = 0
    } = opts;

    ctx.clearRect(0, 0, W, H);

    if (showGraticule) {
      ctx.save();
      ctx.strokeStyle = 'rgba(130, 175, 255, 0.09)';
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
      const iso = feat.iso || '';
      const hl = highlightedIsos[iso] || 0;
      ctx.beginPath();
      this.traceGeometry(ctx, feat.geometry, cam);
      if (hl > 0.01) {
        ctx.fillStyle = `rgba(250, 204, 21, ${(0.25 + 0.60 * hl).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 244, 184, ${(0.5 + 0.45 * hl).toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(32, 62, 178, 0.36)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(135, 180, 255, 0.28)';
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
          ? 'rgba(250, 204, 21, 0.58)'
          : 'rgba(248, 190, 52, 0.80)';
        ctx.shadowBlur = 36 * indiaGlow;
      }

      if (indiaFillMode === 'cobaltTerrain') {
        const tg = ctx.createRadialGradient(W * 0.5, H * 0.5, 40, W * 0.5, H * 0.5, 950);
        tg.addColorStop(0, '#1B3BA8');
        tg.addColorStop(1, '#081450');
        ctx.fillStyle = tg;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 3.2;
        ctx.stroke();
      } else {
        const grad = ctx.createLinearGradient(ix1, iy1, ix2, iy2);
        if (indiaFillMode === 'warm') {
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

    // Rann of Kutch Shimmering White Salt Flat + Glowing 538 sq km Khavda Solar Mega-Grid!
    if (showKhavdaFootprint) {
      ctx.save();
      // White Rann of Kutch salt basin contour (around 69.2E..70.9E, 23.8N..24.35N)
      const saltPoly = [
        [69.05, 24.18], [69.55, 24.32], [70.25, 24.28], [70.85, 24.05],
        [70.65, 23.78], [69.85, 23.75], [69.18, 23.92]
      ];
      ctx.beginPath();
      saltPoly.forEach(([lo, la], idx) => {
        const [sx, sy] = this.project(lo, la, cam);
        if (idx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(224, 242, 254, 0.24)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Khavda 538 sq km Solar Mega-Park Grid right at [69.72, 24.12] (visible from space!)
      const [kx, ky] = this.project(69.72, 24.12, cam);
      const gridW = clamp(cam.scale / 85, 28, 210);
      const gridH = gridW * 0.62;
      const gx0 = kx - gridW / 2, gy0 = ky - gridH / 2;

      ctx.shadowColor = 'rgba(250, 204, 21, 0.90)';
      ctx.shadowBlur = 24;
      ctx.fillStyle = 'rgba(250, 204, 21, 0.32)';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(gx0, gy0, gridW, gridH);
      ctx.fillRect(gx0, gy0, gridW, gridH);
      ctx.shadowBlur = 0;

      // Sub-blocks of solar arrays inside the 538 sq km park
      const cols = 6, rows = 4;
      const cw = (gridW - 14) / cols, ch = (gridH - 10) / rows;
      ctx.fillStyle = '#FACC15';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillRect(gx0 + 4 + c * (cw + 1.5), gy0 + 3 + r * (ch + 1.5), cw - 1.5, ch - 1.5);
        }
      }

      // Expanding golden solar-corona pulse rings
      for (let r = 1; r <= 2; r++) {
        const radPx = ((pulseSec * 52 + r * 65) % 160) + gridW * 0.55;
        const al = clamp(1 - (radPx - gridW * 0.55) / 160, 0, 1) * 0.60;
        ctx.strokeStyle = `rgba(253, 224, 71, ${al.toFixed(3)})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(kx, ky, radPx, 0, Math.PI * 2);
        ctx.stroke();
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
      showKhavdaFootprint = false,
      showGraticule = true,
      pulseSec = 0
    } = opts;

    if (alpha <= 0.005) return;

    if (dofBlur < 0.8) {
      const sctx = this.sharpCanvas.getContext('2d');
      this.renderMapToContext(sctx, cam, { highlightedIsos, indiaGlow, indiaFillMode, showKhavdaFootprint, showGraticule, pulseSec });
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.sharpCanvas, 0, 0);
      ctx.restore();
      return;
    }

    const key = `${Math.round(cam.lon * 10)}_${Math.round(cam.lat * 10)}_${Math.round(cam.scale)}_${Math.round(dofBlur)}_${indiaFillMode}_${showKhavdaFootprint ? 1 : 0}`;
    if (this.lastBlurKey !== key) {
      const sctx = this.sharpCanvas.getContext('2d');
      this.renderMapToContext(sctx, cam, { highlightedIsos, indiaGlow, indiaFillMode, showKhavdaFootprint, showGraticule: false, pulseSec });
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

  // 765 kV National Green Energy Transmission Corridor across India's Mega Solar Parks!
  drawGreenPowerCorridor(ctx, waypoints, cam, progress = 1.0) {
    const p = clamp(progress, 0, 1);
    if (p <= 0.005 || waypoints.length < 2) return;

    const pts = waypoints.map(([lo, la]) => this.project(lo, la, cam));
    ctx.save();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 5.2;
    ctx.shadowColor = 'rgba(250, 204, 21, 0.90)';
    ctx.shadowBlur = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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
        head = [
          pts[i][0] + (pts[i + 1][0] - pts[i][0]) * rem,
          pts[i][1] + (pts[i + 1][1] - pts[i][1]) * rem
        ];
        ctx.lineTo(head[0], head[1]);
        break;
      }
    }
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(head[0], head[1], 8.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return head;
  }
}
