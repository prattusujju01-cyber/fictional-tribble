// engine/geo_map.js (v3.0 — Sovereign India + World Continents + Sriharikota Spaceport Radar + Orbital Launch Arcs)

import { W, H, clamp, lerp, easeOutCubic } from './camera_v3.js';

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
      showSpaceportRadar = false,
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

    // World Continents & Highlighted Satellite Client Nations
    ctx.save();
    for (const feat of this.worldFeatures) {
      const iso = feat.iso || '';
      const name = feat.name || '';
      const hl = highlightedIsos[iso] || highlightedIsos[name] || 0;
      ctx.beginPath();
      this.traceGeometry(ctx, feat.geometry, cam);
      if (hl > 0.01) {
        ctx.fillStyle = `rgba(250, 204, 21, ${(0.28 + 0.58 * hl).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 244, 184, ${(0.55 + 0.42 * hl).toFixed(3)})`;
        ctx.lineWidth = 2.0;
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

    // Sovereign Complete India Polygon
    if (this.indiaFeature) {
      const [ix1, iy1] = this.project(68, 37, cam);
      const [ix2, iy2] = this.project(97, 8, cam);

      ctx.save();
      ctx.beginPath();
      this.traceGeometry(ctx, this.indiaFeature.geometry, cam);

      if (indiaGlow > 0.02) {
        ctx.shadowColor = indiaFillMode === 'cobaltTerrain'
          ? 'rgba(56, 189, 248, 0.65)'
          : 'rgba(248, 190, 52, 0.80)';
        ctx.shadowBlur = 36 * indiaGlow;
      }

      if (indiaFillMode === 'cobaltTerrain') {
        const tg = ctx.createRadialGradient(W * 0.5, H * 0.5, 40, W * 0.5, H * 0.5, 950);
        tg.addColorStop(0, '#1B3BA8');
        tg.addColorStop(1, '#091552');
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

    // Sriharikota SDSC SHAR Spaceport Telemetry Rings & Equatorial Launch Corridor
    if (showSpaceportRadar) {
      const [sx, sy] = this.project(80.23, 13.72, cam);
      ctx.save();
      for (let r = 1; r <= 3; r++) {
        const radPx = ((pulseSec * 55 + r * 68) % 210) + 18;
        const al = clamp(1 - radPx / 228, 0, 1) * 0.58;
        ctx.strokeStyle = `rgba(56, 189, 248, ${al.toFixed(3)})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(sx, sy, radPx, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Inclined Polar / Lunar Launch Azimuth Corridor out over Bay of Bengal
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.78)';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const [ox, oy] = this.project(85.5, 4.5, cam);
      ctx.lineTo(ox, oy);
      ctx.stroke();
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
      showSpaceportRadar = false,
      showGraticule = true,
      pulseSec = 0
    } = opts;

    if (alpha <= 0.005) return;

    if (dofBlur < 0.8) {
      const sctx = this.sharpCanvas.getContext('2d');
      this.renderMapToContext(sctx, cam, { highlightedIsos, indiaGlow, indiaFillMode, showSpaceportRadar, showGraticule, pulseSec });
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.sharpCanvas, 0, 0);
      ctx.restore();
      return;
    }

    const isoKey = Object.keys(highlightedIsos).join(',');
    const key = `${Math.round(cam.lon * 10)}_${Math.round(cam.lat * 10)}_${Math.round(cam.scale)}_${Math.round(dofBlur)}_${indiaFillMode}_${isoKey}`;
    if (this.lastBlurKey !== key) {
      const sctx = this.sharpCanvas.getContext('2d');
      this.renderMapToContext(sctx, cam, { highlightedIsos, indiaGlow, indiaFillMode, showSpaceportRadar: false, showGraticule: false });
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

  // Curved Parabolic Orbital Satellite Launch Trajectories from Sriharikota to Client Nations!
  drawOrbitalArcs(ctx, originLonLat, targets, cam, progress = 1.0) {
    const [ox, oy] = this.project(originLonLat[0], originLonLat[1], cam);
    ctx.save();
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const delay = (t.delay ?? i * 0.08);
      const lp = easeOutCubic(clamp((progress - delay) / Math.max(0.2, 1 - delay), 0, 1));
      if (lp <= 0.01) continue;

      const [tx, ty] = this.project(t.lon, t.lat, cam);
      const dist = Math.hypot(tx - ox, ty - oy);
      const lift = clamp(dist * 0.34, 65, 360);
      const cpx = (ox + tx) * 0.5;
      const cpy = Math.min(oy, ty) - lift;

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
      ctx.lineWidth = 3.2;
      ctx.shadowColor = 'rgba(250, 204, 21, 0.78)';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      const steps = 28;
      let headX = ox, headY = oy;
      for (let s = 0; s <= steps; s++) {
        const u = (s / steps) * lp;
        const inv = 1 - u;
        const px = inv * inv * ox + 2 * inv * u * cpx + u * u * tx;
        const py = inv * inv * oy + 2 * inv * u * cpy + u * u * ty;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        headX = px; headY = py;
      }
      ctx.stroke();

      // Glowing Satellite Payload Comet Head
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(headX, headY, 6.0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
