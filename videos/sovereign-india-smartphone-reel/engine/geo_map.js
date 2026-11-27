// engine/geo_map.js
// Sovereign World & Complete Official India Map Renderer + Cached DOF Blur + Bezier Export Arcs

import { W, H, clamp, lerp, easeOutCubic } from './math_color.js';

export class SovereignMapStage {
  constructor(geoData) {
    this.worldFeatures = geoData.worldFeatures || [];
    this.indiaFeature = geoData.indiaFeature;
    this.sharpCanvas = document.createElement('canvas');
    this.sharpCanvas.width = W;
    this.sharpCanvas.height = H;
    this.blurCanvas = document.createElement('canvas');
    this.blurCanvas.width = 540; // half-res offscreen makes 14px Gaussian blur ultra-fast & silky
    this.blurCanvas.height = 960;
    this.lastBlurKey = '';
  }

  // Spherical Mercator projection centered at [centerLon, centerLat] with pixel scale
  project(lon, lat, cam) {
    const rad = Math.PI / 180;
    const clampedLat = clamp(lat, -82, 82);
    const x0 = cam.lon * rad;
    const y0 = Math.log(Math.tan(Math.PI / 4 + (clamp(cam.lat, -82, 82) * rad) / 2));
    const x = lon * rad;
    const y = Math.log(Math.tan(Math.PI / 4 + (clampedLat * rad) / 2));
    const px = (cam.cx ?? W / 2) + (x - x0) * cam.scale;
    const py = (cam.cy ?? H * 0.46) - (y - y0) * cam.scale;
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
        // Guard antimeridian jumps
        if (Math.abs(lon - prevLon) > 170) {
          started = false;
        }
        const [px, py] = this.project(lon, lat, cam);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
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
      highlightedIsos = {}, // { 'USA': 1.0, 'GBR': 0.8, ... }
      indiaGlow = 1.0,
      indiaFillMode = 'gold', // 'gold' | 'purple' | 'warm'
      showGraticule = true
    } = opts;

    ctx.clearRect(0, 0, W, H);

    // Subtle spherical latitude/longitude graticule lines (visible in b.mp4 & d.mp4!)
    if (showGraticule) {
      ctx.save();
      ctx.strokeStyle = 'rgba(130, 175, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let lon = -150; lon <= 180; lon += 30) {
        const [x1, y1] = this.project(lon, -70, cam);
        const [x2, y2] = this.project(lon, 75, cam);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      for (let lat = -60; lat <= 75; lat += 15) {
        const [x1, y1] = this.project(-175, lat, cam);
        const [x2, y2] = this.project(175, lat, cam);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 1. World countries (excluding India, since official sovereign India renders cleanly on top)
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
        ctx.fillStyle = 'rgba(42, 78, 205, 0.42)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(135, 180, 255, 0.34)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Official Complete Sovereign India Polygon with Golden Bloom
    if (this.indiaFeature) {
      const [ix1, iy1] = this.project(68, 37, cam);
      const [ix2, iy2] = this.project(97, 8, cam);

      ctx.save();
      ctx.beginPath();
      this.traceGeometry(ctx, this.indiaFeature.geometry, cam);

      if (indiaGlow > 0.02) {
        ctx.shadowColor = indiaFillMode === 'purple'
          ? 'rgba(192, 132, 252, 0.65)'
          : 'rgba(248, 190, 52, 0.78)';
        ctx.shadowBlur = 38 * indiaGlow;
      }

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
      ctx.strokeStyle = indiaFillMode === 'purple' ? '#E9D5FF' : '#FFF9DB';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Draw map onto main canvas in either crisp Hero Focus or Depth-of-Field Blur Ghost state
  draw(ctx, cam, opts = {}) {
    const {
      dofBlur = 0, // 0..16 px
      alpha = 1.0,
      highlightedIsos = {},
      indiaGlow = 1.0,
      indiaFillMode = 'gold',
      showGraticule = true
    } = opts;

    if (alpha <= 0.005) return;

    if (dofBlur < 0.8) {
      const sctx = this.sharpCanvas.getContext('2d');
      this.renderMapToContext(sctx, cam, { highlightedIsos, indiaGlow, indiaFillMode, showGraticule });
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.sharpCanvas, 0, 0);
      ctx.restore();
      return;
    }

    // Quantize cache key for blurred DOF ghost layer so repeated frames are near-free
    const key = `${Math.round(cam.lon * 10)}_${Math.round(cam.lat * 10)}_${Math.round(cam.scale)}_${Math.round(dofBlur)}_${indiaFillMode}`;
    if (this.lastBlurKey !== key) {
      const sctx = this.sharpCanvas.getContext('2d');
      this.renderMapToContext(sctx, cam, { highlightedIsos, indiaGlow, indiaFillMode, showGraticule: false });
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

  // Draw glowing quadratic Bezier trade/export arc between two [lon, lat] points or pixel coords
  drawExportArc(ctx, fromPt, toPt, progress, opts = {}) {
    const p = clamp(progress, 0, 1);
    if (p <= 0.005) return;

    const {
      color = '#FFE680',
      glowColor = 'rgba(250, 204, 21, 0.75)',
      lineWidth = 3.2,
      lift = 0.26,
      showSonarOnLand = true
    } = opts;

    const dx = toPt[0] - fromPt[0];
    const dy = toPt[1] - fromPt[1];
    const dist = Math.hypot(dx, dy);
    const mx = (fromPt[0] + toPt[0]) / 2;
    const my = (fromPt[1] + toPt[1]) / 2 - dist * lift;

    const e = easeOutCubic(Math.min(1, p / 0.72));
    const steps = 42;
    const maxStep = Math.max(1, Math.floor(e * steps));

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 16;

    ctx.beginPath();
    let tipX = fromPt[0], tipY = fromPt[1];
    for (let i = 0; i <= maxStep; i++) {
      const t = i / steps;
      const omt = 1 - t;
      const x = omt * omt * fromPt[0] + 2 * omt * t * mx + t * t * toPt[0];
      const y = omt * omt * fromPt[1] + 2 * omt * t * my + t * t * toPt[1];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      tipX = x;
      tipY = y;
    }
    ctx.stroke();

    // Glowing comet tip
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Destination sonar shockwave ripple once arc arrives
    if (showSonarOnLand && p > 0.68) {
      const sp = clamp((p - 0.68) / 0.32, 0, 1);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 232, 132, ${(1 - sp).toFixed(3)})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(toPt[0], toPt[1], 8 + sp * 44, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(toPt[0], toPt[1], 6.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
