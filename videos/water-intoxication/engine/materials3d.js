// Sovereign v15.0 — 1024x1024 Procedural Illustrated Textures, Sobel Normal Maps & Beveled 3D Relief Slab Factory
import { THREE } from './core3d.js';
import { mulberry32, clamp } from './dossier.js';

const _cache = new Map();
function cached(key, fn) {
  if (_cache.has(key)) return _cache.get(key);
  const v = fn();
  _cache.set(key, v);
  return v;
}

// 3x3 Sobel Heightfield -> Tangent-Space Normal Map CanvasTexture
export function heightToNormalTex(heightCanvas, strength = 2.6) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d').getImageData(0, 0, w, h).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const octx = outCanvas.getContext('2d');
  const outImg = octx.createImageData(w, h);
  const dst = outImg.data;

  const lumAt = (x, y) => {
    const cx = (x + w) % w;
    const cy = Math.max(0, Math.min(h - 1, y));
    return src[(cy * w + cx) * 4] / 255.0;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = lumAt(x - 1, y - 1), tc = lumAt(x, y - 1), tr = lumAt(x + 1, y - 1);
      const ml = lumAt(x - 1, y),                             mr = lumAt(x + 1, y);
      const bl = lumAt(x - 1, y + 1), bc = lumAt(x, y + 1), br = lumAt(x + 1, y + 1);

      const dx = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
      const dy = (bl + 2 * bc + br) - (tl + 2 * tc + tr);

      let nx = -dx * strength;
      let ny = dy * strength;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1.0;
      nx /= len; ny /= len; nz /= len;

      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  octx.putImageData(outImg, 0, 0);
  const tex = new THREE.CanvasTexture(outCanvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// GLSL Subsurface Fresnel Rim Injection
export function addFresnelRim(mat, rimHex = 0xFFD9B8, power = 2.6, strength = 0.42) {
  const c = new THREE.Color(rimHex);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimCol = { value: c };
    shader.uniforms.uRimPow = { value: power };
    shader.uniforms.uRimStr = { value: strength };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uRimCol;
         uniform float uRimPow;
         uniform float uRimStr;`
      )
      .replace(
        '#include <dithering_fragment>',
        `float fres = pow(1.0 - clamp( abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.0, 1.0 ), uRimPow);
         gl_FragColor.rgb += uRimCol * fres * uRimStr;
         #include <dithering_fragment>`
      );
  };
  mat.customProgramCacheKey = () => `fresnel_${rimHex}_${power}_${strength}`;
  return mat;
}

// Pixel-exact UV-mapped 3D Extruded Relief Slab Builder!
// outlinePts: array of [u, v] in [0..1]x[0..1] image space (top-left = 0,0, bottom-right = 1,1).
// paintFn(ctx, hCtx, size): draws color & height onto size x size canvases.
export function buildMappedRelief({
  key,
  width = 3.2,
  height = 3.2,
  depth = 0.22,
  bevel = 0.045,
  size = 1024,
  outlinePts,
  sideColor = 0x5A3D31,
  roughness = 0.48,
  metalness = 0.04,
  bumpStrength = 2.4,
  rimHex = 0xFFE6CF,
  rimStrength = 0.28,
  paintFn
}) {
  const assets = cached(`relief_${key}`, () => {
    const colCanvas = document.createElement('canvas');
    colCanvas.width = size;
    colCanvas.height = size;
    const ctx = colCanvas.getContext('2d');

    const hCanvas = document.createElement('canvas');
    hCanvas.width = size;
    hCanvas.height = size;
    const hCtx = hCanvas.getContext('2d');
    hCtx.fillStyle = '#808080';
    hCtx.fillRect(0, 0, size, size);

    paintFn(ctx, hCtx, size);

    const map = new THREE.CanvasTexture(colCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;

    const normalMap = heightToNormalTex(hCanvas, bumpStrength);

    // Smooth closed spline or polygon in centered 3D XY
    const pts2d = outlinePts.map(([u, v]) => new THREE.Vector2((u - 0.5) * width, (0.5 - v) * height));
    const shape = new THREE.Shape();
    shape.moveTo(pts2d[0].x, pts2d[0].y);
    for (let i = 1; i < pts2d.length; i++) {
      const curr = pts2d[i];
      const next = pts2d[(i + 1) % pts2d.length];
      const midX = (curr.x + next.x) * 0.5;
      const midY = (curr.y + next.y) * 0.5;
      shape.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 20
    });
    geo.translate(0, 0, -depth * 0.5);
    geo.computeVertexNormals();

    // Normalize UVs [0..1] across width x height so front face aligns 1:1 with colCanvas!
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const u = clamp(pos.getX(i) / width + 0.5, 0.002, 0.998);
      const v = clamp(pos.getY(i) / height + 0.5, 0.002, 0.998);
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;

    const frontMat = addFresnelRim(
      new THREE.MeshStandardMaterial({
        map,
        normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness,
        metalness
      }),
      rimHex,
      2.6,
      rimStrength
    );
    const sideMat = new THREE.MeshStandardMaterial({
      color: sideColor,
      normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: Math.min(0.85, roughness + 0.16),
      metalness
    });

    return { geo, mats: [frontMat, sideMat] };
  });

  const mesh = new THREE.Mesh(assets.geo, assets.mats);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ================= STANDARD ARCHITECTURAL & INSTRUMENT MATERIALS =================

export function getWoodMat(variant = 'oak') {
  return cached(`wood_${variant}`, () => {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const hc = document.createElement('canvas');
    hc.width = S; hc.height = S;
    const hctx = hc.getContext('2d');

    const base = variant === 'walnut' ? [74, 46, 28] : [148, 98, 54];
    const dark = variant === 'walnut' ? [42, 24, 14] : [96, 58, 28];
    const rng = mulberry32(variant === 'walnut' ? 4011 : 2089);

    ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
    ctx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#808080';
    hctx.fillRect(0, 0, S, S);

    for (let y = 0; y < S; y += 2) {
      const wave = Math.sin(y * 0.045) * 12 + Math.sin(y * 0.13) * 4;
      const t = 0.5 + 0.5 * Math.sin((y + wave) * 0.19 + rng() * 0.4);
      const r = Math.round(base[0] * (1 - t * 0.32) + dark[0] * (t * 0.32));
      const g = Math.round(base[1] * (1 - t * 0.32) + dark[1] * (t * 0.32));
      const b = Math.round(base[2] * (1 - t * 0.32) + dark[2] * (t * 0.32));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y, S, 2);

      const hl = Math.round(112 + t * 34);
      hctx.fillStyle = `rgb(${hl},${hl},${hl})`;
      hctx.fillRect(0, y, S, 2);
    }

    // Plank grooves
    for (const py of [128, 256, 384]) {
      ctx.fillStyle = 'rgba(20,10,4,0.48)';
      ctx.fillRect(0, py, S, 3);
      hctx.fillStyle = '#303030';
      hctx.fillRect(0, py, S, 4);
    }

    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    const normalMap = heightToNormalTex(hc, 2.0);
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

    return new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: variant === 'walnut' ? 0.38 : 0.44,
      metalness: 0.06
    });
  });
}

export function getOchreBoardMat() {
  return cached('ochre_board_mat', () => {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const hc = document.createElement('canvas');
    hc.width = S; hc.height = S;
    const hctx = hc.getContext('2d');

    const g = ctx.createRadialGradient(256, 230, 30, 256, 256, 360);
    g.addColorStop(0, '#D49E3A');
    g.addColorStop(0.65, '#B78124');
    g.addColorStop(1, '#845913');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    hctx.fillStyle = '#808080';
    hctx.fillRect(0, 0, S, S);
    const rng = mulberry32(77123);
    for (let i = 0; i < 4500; i++) {
      const x = rng() * S, y = rng() * S;
      const v = rng() > 0.5 ? 'rgba(255,238,190,0.06)' : 'rgba(60,36,8,0.06)';
      ctx.fillStyle = v;
      ctx.fillRect(x, y, 3, 2);
      const hv = Math.round(116 + rng() * 24);
      hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
      hctx.fillRect(x, y, 3, 2);
    }

    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map,
      normalMap: heightToNormalTex(hc, 1.3),
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.74,
      metalness: 0.02
    });
  });
}

export function getBrassMat() {
  return cached('brass_mat', () => new THREE.MeshStandardMaterial({
    color: 0xD6A648,
    roughness: 0.24,
    metalness: 0.88
  }));
}

export function getDarkBrassMat() {
  return cached('dark_brass_mat', () => new THREE.MeshStandardMaterial({
    color: 0x7E5C22,
    roughness: 0.36,
    metalness: 0.82
  }));
}

export function getBrushedSteelMat() {
  return cached('brushed_steel', () => new THREE.MeshStandardMaterial({
    color: 0xC9D2DA,
    roughness: 0.26,
    metalness: 0.86
  }));
}

export function getClearGlassMat(opacity = 0.32, tint = 0xE8F7FF) {
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    transparent: true,
    opacity,
    roughness: 0.08,
    metalness: 0.05,
    reflectivity: 0.92,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    depthWrite: false
  });
}

export function getWaterLiquidMat(hex = 0x45C9FF, opacity = 0.82) {
  return addFresnelRim(
    new THREE.MeshPhysicalMaterial({
      color: hex,
      transparent: true,
      opacity,
      roughness: 0.12,
      metalness: 0.04,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08
    }),
    0xC8F4FF,
    2.2,
    0.42
  );
}

// Patterned Crimson & Gold Stitched Bedroom Quilt Material (strip_09.jpg f0..375 homage)
export function getQuiltMat() {
  return cached('bedroom_quilt_mat', () => {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const hc = document.createElement('canvas');
    hc.width = S; hc.height = S;
    const hctx = hc.getContext('2d');

    ctx.fillStyle = '#9E1F34';
    ctx.fillRect(0, 0, S, S);
    hctx.fillStyle = '#9A9A9A';
    hctx.fillRect(0, 0, S, S);

    // Diamond quilt stitching
    const step = 48;
    ctx.strokeStyle = '#731223';
    ctx.lineWidth = 2;
    hctx.strokeStyle = '#4A4A4A';
    hctx.lineWidth = 4;
    for (let k = -S; k < S * 2; k += step) {
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + S, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(k, S); ctx.lineTo(k + S, 0); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(k, 0); hctx.lineTo(k + S, S); hctx.stroke();
      hctx.beginPath(); hctx.moveTo(k, S); hctx.lineTo(k + S, 0); hctx.stroke();
    }

    // Warm cream & gold block-printed floral medallions inside diamonds
    for (let y = 24; y < S; y += step) {
      for (let x = 24; x < S; x += step) {
        ctx.fillStyle = '#F3D289';
        for (let a = 0; a < 4; a++) {
          const ang = (a * Math.PI) / 2;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(ang) * 7, y + Math.sin(ang) * 7, 5, 3, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FFF5DC';
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map,
      normalMap: heightToNormalTex(hc, 2.2),
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.78,
      metalness: 0.0
    });
  });
}

// Industrial Riveted Green Switchboard Steel Material (strip_08.jpg f2250 homage)
export function getSwitchboardSteelMat() {
  return cached('switchboard_steel_mat', () => {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const hc = document.createElement('canvas');
    hc.width = S; hc.height = S;
    const hctx = hc.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#1C634C');
    g.addColorStop(0.5, '#15503D');
    g.addColorStop(1, '#0E392B');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    hctx.fillStyle = '#808080';
    hctx.fillRect(0, 0, S, S);

    // Panel seam lines & rivets
    ctx.strokeStyle = '#0A291E';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, S - 24, S - 24);
    hctx.strokeStyle = '#383838';
    hctx.lineWidth = 5;
    hctx.strokeRect(12, 12, S - 24, S - 24);

    for (let i = 36; i < S - 24; i += 64) {
      for (const [rx, ry] of [[i, 28], [i, S - 28], [28, i], [S - 28, i]]) {
        ctx.fillStyle = '#2A7D62';
        ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI * 2); ctx.fill();
        hctx.fillStyle = '#DFDFDF';
        hctx.beginPath(); hctx.arc(rx, ry, 5, 0, Math.PI * 2); hctx.fill();
      }
    }

    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map,
      normalMap: heightToNormalTex(hc, 2.5),
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.42,
      metalness: 0.48
    });
  });
}

// Helper for crisp engraved/printed CanvasTexture plaques, gauges, bottle labels & LED displays
export function makeLabelTex(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { canvas: c, ctx, tex };
}
