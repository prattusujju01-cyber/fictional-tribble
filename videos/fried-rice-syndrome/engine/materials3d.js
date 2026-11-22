// Procedural PBR Textures, 3x3 Sobel Normal Maps, Crisp Instrument CanvasTextures & GLSL Fresnel Rim (v13.2)
// ZERO external image URLs — 100% pure-code math + single-pass SwiftShader speed.
import * as THREE from '../vendor/three.module.js';
import { clamp, lerp } from './dossier.js';

function hash2(x, y, seed = 1337) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise2(x, y, seed = 1337) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

export function fbm2(x, y, seed = 1337, octaves = 4) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2(x * freq, y * freq, seed + i * 79);
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

export function addFresnelRim(mat, rimHex = 0xffa858, power = 2.6, intensity = 0.58) {
  const rimCol = new THREE.Color(rimHex);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: rimCol };
    shader.uniforms.uRimPower = { value: power };
    shader.uniforms.uRimIntensity = { value: intensity };
    shader.fragmentShader =
      `uniform vec3 uRimColor;\nuniform float uRimPower;\nuniform float uRimIntensity;\n` +
      shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        vec3 nView = normalize(vNormal);
        vec3 vDir = normalize(vViewPosition);
        float fRim = pow(1.0 - clamp(abs(dot(nView, vDir)), 0.0, 1.0), uRimPower);
        gl_FragColor.rgb += uRimColor * fRim * uRimIntensity;
        #include <dithering_fragment>
        `
      );
  };
  mat.customProgramCacheKey = () => `fresnel_${rimHex.toString(16)}_${power.toFixed(1)}_${intensity.toFixed(2)}`;
  return mat;
}

const _texCache = new Map();

export function getProceduralTextures(kind, size = 128) {
  const key = `${kind}_${size}`;
  if (_texCache.has(key)) return _texCache.get(key);

  const albedoC = document.createElement('canvas');
  albedoC.width = size; albedoC.height = size;
  const aCtx = albedoC.getContext('2d');
  const aImg = aCtx.createImageData(size, size);

  const normC = document.createElement('canvas');
  normC.width = size; normC.height = size;
  const nCtx = normC.getContext('2d');
  const nImg = nCtx.createImageData(size, size);

  const heights = new Float32Array(size * size);
  let strength = 3.0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const idx = y * size + x;
      let r = 180, g = 180, b = 180, h = 0.5;

      if (kind === 'walnut') {
        strength = 4.2;
        const grain = Math.sin((v * 15 + fbm2(u * 4, v * 4, 11, 3) * 2.1) * Math.PI * 2) * 0.5 + 0.5;
        const pore = fbm2(u * 48, v * 12, 23, 3);
        h = grain * 0.72 + pore * 0.28 - (pore > 0.72 ? 0.2 : 0);
        r = lerp(42, 108, h); g = lerp(22, 62, h); b = lerp(11, 32, h);
      } else if (kind === 'oakLight') {
        strength = 3.4;
        const grain = Math.sin((v * 18 + fbm2(u * 3, v * 3, 29, 3) * 1.6) * Math.PI * 2) * 0.5 + 0.5;
        const fine = fbm2(u * 40, v * 10, 31, 3);
        h = grain * 0.65 + fine * 0.35;
        r = lerp(148, 206, h); g = lerp(104, 158, h); b = lerp(58, 98, h);
      } else if (kind === 'brass') {
        strength = 2.0;
        const brush = fbm2(u * 64, v * 6, 41, 3);
        h = brush;
        r = lerp(168, 242, h); g = lerp(130, 198, h); b = lerp(52, 104, h);
      } else if (kind === 'steel') {
        strength = 1.9;
        const brush = fbm2(u * 56, v * 8, 53, 3);
        h = brush;
        r = lerp(162, 228, h); g = lerp(170, 234, h); b = lerp(180, 242, h);
      } else if (kind === 'castIron') {
        strength = 4.6;
        const pit = fbm2(u * 32, v * 32, 67, 4);
        h = pit;
        r = lerp(24, 52, h); g = lerp(26, 54, h); b = lerp(30, 58, h);
      } else if (kind === 'soil') {
        strength = 5.4;
        const clod = fbm2(u * 18, v * 18, 71, 4);
        const grit = fbm2(u * 44, v * 44, 79, 3);
        h = clod * 0.65 + grit * 0.35;
        r = lerp(42, 114, h); g = lerp(26, 74, h); b = lerp(14, 42, h);
      } else if (kind === 'riceStarch') {
        strength = 1.6;
        const sheen = fbm2(u * 14, v * 28, 83, 3);
        h = 0.45 + sheen * 0.45;
        r = lerp(236, 254, h); g = lerp(228, 249, h); b = lerp(208, 236, h);
      } else if (kind === 'sporeArmor') {
        strength = 6.2;
        const ridge = Math.abs(Math.sin((u * 10 + fbm2(u * 6, v * 6, 97, 3) * 1.4) * Math.PI));
        const bump = fbm2(u * 22, v * 22, 101, 4);
        h = ridge * 0.55 + bump * 0.45;
        r = lerp(118, 238, h); g = lerp(64, 174, h); b = lerp(14, 44, h);
      } else if (kind === 'organTissue') {
        strength = 4.8;
        const lobule = fbm2(u * 14, v * 14, 113, 4);
        const vein = Math.exp(-Math.pow(Math.sin((u * 6 + fbm2(u * 4, v * 4, 127, 3) * 1.8) * Math.PI) * 6.5, 2));
        h = lobule * 0.72 + vein * 0.28;
        r = lerp(142, 234, clamp(h + vein * 0.22));
        g = lerp(26, 86, h * (1 - vein * 0.45));
        b = lerp(30, 74, h * (1 - vein * 0.45));
      } else if (kind === 'liverLobule') {
        strength = 4.5;
        const cell = fbm2(u * 18, v * 18, 139, 4);
        const fiber = fbm2(u * 40, v * 40, 149, 3);
        h = cell * 0.7 + fiber * 0.3;
        r = lerp(96, 178, h); g = lerp(20, 48, h); b = lerp(24, 52, h);
      } else if (kind === 'ceramicBlue') {
        strength = 1.6;
        const glaze = fbm2(u * 12, v * 12, 163, 3);
        h = glaze;
        r = lerp(26, 48, h); g = lerp(74, 114, h); b = lerp(98, 142, h);
      } else if (kind === 'bacillusSkin') {
        strength = 3.6;
        const cell = fbm2(u * 20, v * 20, 173, 4);
        h = cell;
        r = lerp(52, 118, h); g = lerp(164, 238, h); b = lerp(92, 152, h);
      } else if (kind === 'kitchenTile') {
        strength = 3.2;
        const row = Math.floor(v * 6);
        const su = (u * 3 + (row % 2) * 0.5) % 1;
        const sv = (v * 6) % 1;
        const isGrout = su < 0.045 || sv < 0.065;
        const speckle = fbm2(u * 24, v * 24, 191, 3);
        h = isGrout ? 0.12 : (0.68 + speckle * 0.25);
        if (isGrout) {
          r = 14; g = 22; b = 36;
        } else {
          r = lerp(24, 42, speckle); g = lerp(38, 62, speckle); b = lerp(62, 92, speckle);
        }
      } else if (kind === 'wallpaperDark') {
        strength = 2.0;
        const stripe = Math.sin(u * Math.PI * 16) * 0.5 + 0.5;
        const weave = fbm2(u * 32, v * 32, 211, 3);
        h = weave * 0.7 + stripe * 0.3;
        r = lerp(16, 30, h); g = lerp(26, 48, h); b = lerp(46, 78, h);
      }

      heights[idx] = clamp(h);
      const p = idx * 4;
      aImg.data[p] = clamp(r, 0, 255);
      aImg.data[p + 1] = clamp(g, 0, 255);
      aImg.data[p + 2] = clamp(b, 0, 255);
      aImg.data[p + 3] = 255;
    }
  }
  aCtx.putImageData(aImg, 0, 0);

  const mask = size - 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xm = (x - 1) & mask, xp = (x + 1) & mask;
      const ym = (y - 1) & mask, yp = (y + 1) & mask;
      const tl = heights[ym * size + xm], tc = heights[ym * size + x], tr = heights[ym * size + xp];
      const ml = heights[y * size + xm],                                mr = heights[y * size + xp];
      const bl = heights[yp * size + xm], bc = heights[yp * size + x], br = heights[yp * size + xp];
      const dx = ((tr + 2 * mr + br) - (tl + 2 * ml + bl)) * 0.25 * strength;
      const dy = ((bl + 2 * bc + br) - (tl + 2 * tc + tr)) * 0.25 * strength;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const p = (y * size + x) * 4;
      nImg.data[p] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      nImg.data[p + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      nImg.data[p + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      nImg.data[p + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);

  const map = new THREE.CanvasTexture(albedoC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  const normalMap = new THREE.CanvasTexture(normC);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

  const out = { map, normalMap };
  _texCache.set(key, out);
  return out;
}

// Crisp high-res CanvasTextures for real clock faces, clinical gauges, thermometers & product labels!
function makeClockFaceTex(variant = 'alarm') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  // Warm parchment-enamel dial radial gradient
  const g = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
  g.addColorStop(0, '#FDF8EC');
  g.addColorStop(0.82, '#F2E7CF');
  g.addColorStop(1, '#D4C29E');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle chapter ring
  ctx.strokeStyle = '#2B2218';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 224, 0, Math.PI * 2);
  ctx.stroke();

  if (variant === 'stopwatch') {
    // Crimson 1-5 hour danger wedge (12 to 5 o'clock)
    ctx.fillStyle = 'rgba(216, 40, 24, 0.24)';
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.arc(256, 256, 218, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (5 / 12));
    ctx.closePath();
    ctx.fill();
  }

  // 60 minute ticks + 12 bold hour ticks
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isHr = i % 5 === 0;
    const r0 = isHr ? 186 : 204;
    const r1 = 220;
    ctx.strokeStyle = (variant === 'stopwatch' && i <= 25 && isHr) ? '#C82214' : '#1E1812';
    ctx.lineWidth = isHr ? 7 : 2.5;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0);
    ctx.lineTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1);
    ctx.stroke();
  }

  // Crisp numerals
  ctx.fillStyle = '#1B140C';
  ctx.font = '700 42px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let h = 1; h <= 12; h++) {
    const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(String(h), 256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150);
  }

  ctx.font = '700 20px monospace';
  ctx.fillStyle = variant === 'stopwatch' ? '#B91C1C' : '#5A4A32';
  ctx.fillText(variant === 'stopwatch' ? 'ONSET · HOURS' : 'BRUSSELS · 2008', 256, 336);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeArteryGaugeTex() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.84, '#F5EFE2');
  g.addColorStop(1, '#CFC5B2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  // Colored risk arc sectors (Green safe -> Amber warning -> Crimson lethal, exact R09 S30 clinical gauge DNA!)
  const drawArc = (a0, a1, col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.arc(256, 256, 188, a0, a1);
    ctx.stroke();
  };
  drawArc(Math.PI * 0.78, Math.PI * 1.32, '#22C55E');
  drawArc(Math.PI * 1.32, Math.PI * 1.78, '#F59E0B');
  drawArc(Math.PI * 1.78, Math.PI * 2.22, '#DC2626');

  // Fine dial ticks
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI * 0.78 + (i / 24) * (Math.PI * 1.44);
    const maj = i % 4 === 0;
    ctx.strokeStyle = '#1E1915';
    ctx.lineWidth = maj ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * (maj ? 148 : 162), 256 + Math.sin(a) * (maj ? 148 : 162));
    ctx.lineTo(256 + Math.cos(a) * 176, 256 + Math.sin(a) * 176);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#181410';
  ctx.font = '700 34px sans-serif';
  ctx.fillText('TOXIN', 256, 190);
  ctx.fillStyle = '#DC2626';
  ctx.font = '700 28px monospace';
  ctx.fillText('CEREULIDE', 256, 336);
  ctx.fillStyle = '#4A3F32';
  ctx.font = '700 22px monospace';
  ctx.fillText('BLOOD LOAD', 256, 372);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeThermometerScaleTex() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 1024;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#F7F0DE';
  ctx.fillRect(0, 0, 256, 1024);

  // Red danger-zone vertical tint band (4°C to 60°C on 0..100°C scale)
  // Scale goes y=840 (0°C) up to y=120 (100°C)
  const yOfTemp = (deg) => 840 - (deg / 100) * 720;
  const y60 = yOfTemp(60);
  const y4 = yOfTemp(4);
  ctx.fillStyle = 'rgba(220, 38, 38, 0.22)';
  ctx.fillRect(14, y60, 228, y4 - y60);
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, y60, 228, y4 - y60);

  // Subtle safe-cold blue zone below 4°C
  ctx.fillStyle = 'rgba(56, 189, 248, 0.26)';
  ctx.fillRect(14, y4, 228, 860 - y4);

  // Tick marks left & right of central glass bore
  ctx.font = '700 24px monospace';
  ctx.textBaseline = 'middle';
  for (let deg = 0; deg <= 100; deg += 5) {
    const y = yOfTemp(deg);
    const maj = deg % 20 === 0;
    const inDanger = deg >= 4 && deg <= 60;
    ctx.strokeStyle = inDanger ? '#B91C1C' : '#1E160E';
    ctx.lineWidth = maj ? 4 : 2;
    // Left ticks
    ctx.beginPath();
    ctx.moveTo(maj ? 72 : 84, y);
    ctx.lineTo(104, y);
    ctx.stroke();
    // Right ticks
    ctx.beginPath();
    ctx.moveTo(152, y);
    ctx.lineTo(maj ? 184 : 172, y);
    ctx.stroke();

    if (maj) {
      ctx.fillStyle = inDanger ? '#B91C1C' : '#1E160E';
      ctx.textAlign = 'right';
      ctx.fillText(`${deg}°`, 68, y);
      ctx.textAlign = 'left';
      ctx.fillText(`${deg}°`, 188, y);
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1E160E';
  ctx.font = '700 28px sans-serif';
  ctx.fillText('CELSIUS °C', 128, 62);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBottleLabelTex() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F4E8CE';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#9E1B14';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 484, 228);
  ctx.fillStyle = '#9E1B14';
  ctx.fillRect(14, 14, 484, 56);
  ctx.fillStyle = '#FFF8EB';
  ctx.font = '700 30px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOXICOLOGY · CASE 2008', 256, 44);
  ctx.fillStyle = '#1B140C';
  ctx.font = '700 58px sans-serif';
  ctx.fillText('NO POISON?', 256, 134);
  ctx.fillStyle = '#5C4B32';
  ctx.font = '700 24px monospace';
  ctx.fillText('5-DAY PASTA · NEGATIVE CHEMICALS', 256, 198);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let _matCache = null;

export function getMaterials3D() {
  if (_matCache) return _matCache;

  const walnutTex = getProceduralTextures('walnut');
  const oakTex = getProceduralTextures('oakLight');
  const brassTex = getProceduralTextures('brass');
  const steelTex = getProceduralTextures('steel');
  const ironTex = getProceduralTextures('castIron');
  const soilTex = getProceduralTextures('soil');
  const riceTex = getProceduralTextures('riceStarch');
  const sporeTex = getProceduralTextures('sporeArmor');
  const organTex = getProceduralTextures('organTissue');
  const liverTex = getProceduralTextures('liverLobule');
  const ceramicTex = getProceduralTextures('ceramicBlue');
  const bacillusTex = getProceduralTextures('bacillusSkin');
  const tileTex = getProceduralTextures('kitchenTile');
  tileTex.map.repeat.set(3, 2);
  tileTex.normalMap.repeat.set(3, 2);
  const wallTex = getProceduralTextures('wallpaperDark');
  wallTex.map.repeat.set(3, 2);
  wallTex.normalMap.repeat.set(3, 2);

  _matCache = {
    walnut: new THREE.MeshPhysicalMaterial({
      map: walnutTex.map, normalMap: walnutTex.normalMap, normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 0.42, metalness: 0.04, clearcoat: 0.35, clearcoatRoughness: 0.32
    }),
    oakLight: new THREE.MeshPhysicalMaterial({
      map: oakTex.map, normalMap: oakTex.normalMap, normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.48, metalness: 0.02, clearcoat: 0.25
    }),
    brass: new THREE.MeshPhysicalMaterial({
      map: brassTex.map, normalMap: brassTex.normalMap, normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.22, metalness: 0.88, clearcoat: 0.35
    }),
    steel: new THREE.MeshPhysicalMaterial({
      map: steelTex.map, normalMap: steelTex.normalMap, normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.16, metalness: 0.92, clearcoat: 0.45
    }),
    castIron: new THREE.MeshPhysicalMaterial({
      map: ironTex.map, normalMap: ironTex.normalMap, normalScale: new THREE.Vector2(1.25, 1.25),
      roughness: 0.48, metalness: 0.62, clearcoat: 0.14
    }),
    museumStand: new THREE.MeshPhysicalMaterial({
      color: 0x16161b, roughness: 0.34, metalness: 0.32, clearcoat: 0.42
    }),
    kitchenTile: new THREE.MeshPhysicalMaterial({
      map: tileTex.map, normalMap: tileTex.normalMap, normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.24, metalness: 0.04, clearcoat: 0.72
    }),
    wallpaperDark: new THREE.MeshPhysicalMaterial({
      map: wallTex.map, normalMap: wallTex.normalMap, normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.78, metalness: 0.0
    }),
    ceramicBlue: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: ceramicTex.map, normalMap: ceramicTex.normalMap, normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.18, metalness: 0.04, clearcoat: 0.92, clearcoatRoughness: 0.08
    }), 0x8be0ff, 2.8, 0.38),
    ceramicCream: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xf4ecdc, roughness: 0.2, metalness: 0.02, clearcoat: 0.85, clearcoatRoughness: 0.1
    }), 0xfff6e0, 2.8, 0.25),
    riceGrain: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: riceTex.map, normalMap: riceTex.normalMap, normalScale: new THREE.Vector2(0.32, 0.32),
      roughness: 0.28, metalness: 0.0, clearcoat: 0.62, clearcoatRoughness: 0.20, sheen: 0.42, sheenColor: new THREE.Color(0xfff4d8)
    }), 0xffe4a8, 2.5, 0.44),
    riceToasted: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xf5d48a, map: riceTex.map, roughness: 0.30, clearcoat: 0.55
    }), 0xffc652, 2.5, 0.42),
    soil: new THREE.MeshPhysicalMaterial({
      map: soilTex.map, normalMap: soilTex.normalMap, normalScale: new THREE.Vector2(1.4, 1.4),
      roughness: 0.88, metalness: 0.0
    }),
    paddyGreen: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0x4ca642, roughness: 0.44, metalness: 0.02, sheen: 0.45, sheenColor: new THREE.Color(0xb8f078)
    }), 0xd8ff88, 2.8, 0.38),
    sporeArmor: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: sporeTex.map, normalMap: sporeTex.normalMap, normalScale: new THREE.Vector2(1.45, 1.45),
      roughness: 0.28, metalness: 0.24, clearcoat: 0.72, emissive: 0x3b1804, emissiveIntensity: 0.28
    }), 0xffcf4a, 2.2, 0.72),
    bacillusGreen: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: bacillusTex.map, normalMap: bacillusTex.normalMap, normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.24, metalness: 0.04, clearcoat: 0.82, emissive: 0x0c4a26, emissiveIntensity: 0.38
    }), 0x9ef788, 2.2, 0.74),
    flagellaMat: new THREE.MeshPhysicalMaterial({
      color: 0xb8f7b0, emissive: 0x4ade80, emissiveIntensity: 0.42,
      roughness: 0.22, transparent: true, opacity: 0.78
    }),
    cereulideCoral: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: organTex.map, normalMap: organTex.normalMap, normalScale: new THREE.Vector2(1.15, 1.15),
      color: 0xff5a38, roughness: 0.22, metalness: 0.05, clearcoat: 0.88, emissive: 0x7c1208, emissiveIntensity: 0.48
    }), 0xffc452, 2.0, 0.92),
    cereulideGold: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xf7b932, roughness: 0.20, metalness: 0.28, clearcoat: 0.88, emissive: 0x7a3e04, emissiveIntensity: 0.45
    }), 0xfff099, 2.1, 0.85),
    arteryTissue: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: organTex.map, normalMap: organTex.normalMap, normalScale: new THREE.Vector2(1.3, 1.3),
      roughness: 0.26, metalness: 0.02, clearcoat: 0.82, sheen: 0.55, sheenColor: new THREE.Color(0xff968a),
      side: THREE.DoubleSide
    }), 0xff8a78, 2.2, 0.72),
    stomachWall: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: organTex.map, normalMap: organTex.normalMap, normalScale: new THREE.Vector2(0.9, 0.9),
      color: 0xe68478, roughness: 0.28, clearcoat: 0.75, side: THREE.DoubleSide
    }), 0xffb8a4, 2.4, 0.56),
    liverTissue: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: liverTex.map, normalMap: liverTex.normalMap, normalScale: new THREE.Vector2(1.15, 1.15),
      roughness: 0.24, metalness: 0.03, clearcoat: 0.86, clearcoatRoughness: 0.14, sheen: 0.45, sheenColor: new THREE.Color(0xff7868)
    }), 0xff7a5c, 2.2, 0.68),
    mitoOuter: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: organTex.map, normalMap: organTex.normalMap, normalScale: new THREE.Vector2(1.0, 1.0),
      color: 0xd94832, roughness: 0.26, clearcoat: 0.82, side: THREE.DoubleSide
    }), 0xffaa68, 2.2, 0.76),
    mitoCristae: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xf8b26a, roughness: 0.28, clearcoat: 0.68, emissive: 0x6c2808, emissiveIntensity: 0.36
    }), 0xffe49e, 2.2, 0.66),
    rbc: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xd61e26, roughness: 0.22, clearcoat: 0.84, emissive: 0x3b0408, emissiveIntensity: 0.26
    }), 0xff887a, 2.4, 0.56),
    potassiumIon: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xc084fc, emissive: 0x7e22ce, emissiveIntensity: 0.85, roughness: 0.14, clearcoat: 0.95
    }), 0xf3e8ff, 1.8, 0.92),
    atpSpark: new THREE.MeshBasicMaterial({ color: 0x67e8f9 }),
    glassClear: new THREE.MeshPhysicalMaterial({
      color: 0xeef8ff, roughness: 0.05, metalness: 0.04, clearcoat: 1.0, clearcoatRoughness: 0.02,
      reflectivity: 0.95, transparent: true, opacity: 0.30, depthWrite: false
    }),
    amberGlass: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xc86416, roughness: 0.09, metalness: 0.06, clearcoat: 1.0, clearcoatRoughness: 0.04,
      transparent: true, opacity: 0.82
    }), 0xffc864, 2.2, 0.64),
    acidFluid: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xa3e635, emissive: 0x3f6212, emissiveIntensity: 0.55,
      roughness: 0.12, clearcoat: 0.95, transparent: true, opacity: 0.78
    }), 0xd9f99d, 2.0, 0.76),
    flameBlue: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 }),
    flameAmber: new THREE.MeshBasicMaterial({ color: 0xff7b24, transparent: true, opacity: 0.92 }),
    coldGlow: new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.78 }),
    mercuryRed: new THREE.MeshPhysicalMaterial({
      color: 0xe81e18, emissive: 0x99120c, emissiveIntensity: 0.65, roughness: 0.12, clearcoat: 0.95
    }),
    creamPaper: new THREE.MeshPhysicalMaterial({
      color: 0xf4ebd8, roughness: 0.72, metalness: 0.0
    }),
    pastaGold: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xf2c95e, roughness: 0.34, clearcoat: 0.42
    }), 0xfff0a8, 2.6, 0.38),
    fridgeInterior: new THREE.MeshPhysicalMaterial({
      color: 0xdbeeff, roughness: 0.22, metalness: 0.06, clearcoat: 0.72
    }),
    fridgeShell: new THREE.MeshPhysicalMaterial({
      color: 0x243447, roughness: 0.26, metalness: 0.64, clearcoat: 0.55
    }),
    // Crisp Procedural Instrument Textures
    alarmDialFace: new THREE.MeshBasicMaterial({ map: makeClockFaceTex('alarm') }),
    stopwatchDialFace: new THREE.MeshBasicMaterial({ map: makeClockFaceTex('stopwatch') }),
    arteryGaugeFace: new THREE.MeshBasicMaterial({ map: makeArteryGaugeTex() }),
    thermoScaleMat: new THREE.MeshBasicMaterial({ map: makeThermometerScaleTex() }),
    bottleLabelMat: new THREE.MeshBasicMaterial({ map: makeBottleLabelTex() }),
    shadowFloor: new THREE.ShadowMaterial({ opacity: 0.34 })
  };

  return _matCache;
}
