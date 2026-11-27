// Procedural PBR Textures, 3x3 Sobel Normal Maps, 8 Crisp Instrument CanvasTextures & GLSL Fresnel Rim (v14.0)
// ZERO external image URLs — 100% pure-code math + single-pass SwiftShader speed.
import * as THREE from '../vendor/three.module.js';
import { clamp, lerp } from './dossier.js';

function hash2(x, y, seed = 1337) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise2(x, y, seed = 1337) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return lerp(
    lerp(hash2(xi, yi, seed), hash2(xi + 1, yi, seed), u),
    lerp(hash2(xi, yi + 1, seed), hash2(xi + 1, yi + 1, seed), u),
    v
  );
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

export function addFresnelRim(mat, rimHex = 0xffa858, power = 2.5, intensity = 0.62) {
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
  mat.customProgramCacheKey = () => `fresnel14_${rimHex.toString(16)}_${power.toFixed(1)}_${intensity.toFixed(2)}`;
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
        h = fbm2(u * 64, v * 6, 41, 3);
        r = lerp(168, 242, h); g = lerp(130, 198, h); b = lerp(52, 104, h);
      } else if (kind === 'steel') {
        strength = 1.9;
        h = fbm2(u * 56, v * 8, 53, 3);
        r = lerp(164, 232, h); g = lerp(172, 238, h); b = lerp(182, 246, h);
      } else if (kind === 'castIron') {
        strength = 4.5;
        h = fbm2(u * 32, v * 32, 67, 4);
        r = lerp(22, 48, h); g = lerp(24, 50, h); b = lerp(28, 56, h);
      } else if (kind === 'brainGyri') {
        // Sinuous folded cerebral gyri & sulci grooves!
        strength = 6.8;
        const warpX = fbm2(u * 5.5, v * 5.5, 91, 4) * 2.2;
        const warpY = fbm2(u * 5.5 + 3.1, v * 5.5 - 1.7, 97, 4) * 2.2;
        const fold = Math.abs(Math.sin((u * 4.2 + warpX) * Math.PI) * Math.cos((v * 4.2 + warpY) * Math.PI));
        const sulcus = Math.pow(fold, 0.48);
        h = sulcus;
        r = lerp(145, 242, h); g = lerp(64, 152, h); b = lerp(74, 148, h);
      } else if (kind === 'boneCortex') {
        strength = 3.8;
        const pore = fbm2(u * 26, v * 26, 109, 4);
        h = 0.35 + pore * 0.65;
        r = lerp(196, 244, h); g = lerp(184, 234, h); b = lerp(158, 212, h);
      } else if (kind === 'organTissue') {
        strength = 4.8;
        const lobule = fbm2(u * 14, v * 14, 113, 4);
        const vein = Math.exp(-Math.pow(Math.sin((u * 6 + fbm2(u * 4, v * 4, 127, 3) * 1.8) * Math.PI) * 6.5, 2));
        h = lobule * 0.72 + vein * 0.28;
        r = lerp(142, 234, clamp(h + vein * 0.22));
        g = lerp(26, 86, h * (1 - vein * 0.45));
        b = lerp(30, 74, h * (1 - vein * 0.45));
      } else if (kind === 'kidneyParenchyma') {
        strength = 4.4;
        const c = fbm2(u * 18, v * 18, 139, 4);
        h = c;
        r = lerp(104, 186, h); g = lerp(24, 54, h); b = lerp(30, 58, h);
      } else if (kind === 'acousticFoam') {
        // Pyramid radio-studio acoustic wall tiles!
        strength = 5.6;
        const gx = Math.abs(((u * 8) % 1) - 0.5) * 2;
        const gy = Math.abs(((v * 8) % 1) - 0.5) * 2;
        h = 1.0 - Math.max(gx, gy);
        r = lerp(18, 44, h); g = lerp(22, 52, h); b = lerp(32, 68, h);
      } else if (kind === 'asphalt') {
        strength = 4.8;
        const grit = fbm2(u * 48, v * 48, 181, 4);
        const isStripe = Math.abs(v - 0.78) < 0.035;
        h = isStripe ? 0.85 : grit;
        if (isStripe) {
          r = 242; g = 236; b = 216;
        } else {
          r = lerp(34, 68, grit); g = lerp(38, 72, grit); b = lerp(44, 80, grit);
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

// --- 8 CRISP PROCEDURAL INSTRUMENT & SIGNAGE CANVASTEXTURES ---
function makeClockFaceTex(subText = 'SACRAMENTO · 2007') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  const g = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
  g.addColorStop(0, '#FDF8EC');
  g.addColorStop(0.82, '#F2E7CF');
  g.addColorStop(1, '#D4C29E');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#2B2218';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(256, 256, 224, 0, Math.PI * 2); ctx.stroke();

  // Crimson 3-hour contest / 5-hour collapse arc
  ctx.fillStyle = 'rgba(216, 40, 24, 0.22)';
  ctx.beginPath();
  ctx.moveTo(256, 256);
  ctx.arc(256, 256, 218, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (5 / 12));
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isHr = i % 5 === 0;
    ctx.strokeStyle = '#1E1812';
    ctx.lineWidth = isHr ? 7 : 2.5;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * (isHr ? 186 : 204), 256 + Math.sin(a) * (isHr ? 186 : 204));
    ctx.lineTo(256 + Math.cos(a) * 220, 256 + Math.sin(a) * 220);
    ctx.stroke();
  }

  ctx.fillStyle = '#1B140C';
  ctx.font = '700 42px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let h = 1; h <= 12; h++) {
    const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(String(h), 256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150);
  }
  ctx.font = '700 20px monospace';
  ctx.fillStyle = '#9E1B14';
  ctx.fillText(subText, 256, 336);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeClinicalGaugeTex(title, unit, sub, reverseDanger = false) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.84, '#F5EFE2');
  g.addColorStop(1, '#CFC5B2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  const drawArc = (a0, a1, col) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 28;
    ctx.beginPath(); ctx.arc(256, 256, 188, a0, a1); ctx.stroke();
  };
  if (reverseDanger) {
    // Left = RED (<120 mmol/L critical!), Right = GREEN (140 mmol/L normal!)
    drawArc(Math.PI * 0.78, Math.PI * 1.28, '#DC2626');
    drawArc(Math.PI * 1.28, Math.PI * 1.68, '#F59E0B');
    drawArc(Math.PI * 1.68, Math.PI * 2.22, '#22C55E');
  } else {
    // Left = GREEN (normal pressure), Right = RED (45 mmHg skull crisis!)
    drawArc(Math.PI * 0.78, Math.PI * 1.32, '#22C55E');
    drawArc(Math.PI * 1.32, Math.PI * 1.74, '#F59E0B');
    drawArc(Math.PI * 1.74, Math.PI * 2.22, '#DC2626');
  }

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
  ctx.font = '700 32px sans-serif';
  ctx.fillText(title, 256, 178);
  ctx.fillStyle = '#DC2626';
  ctx.font = '700 28px monospace';
  ctx.fillText(unit, 256, 338);
  ctx.fillStyle = '#4A3F32';
  ctx.font = '700 21px monospace';
  ctx.fillText(sub, 256, 374);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeOnAirSignTex() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#B91C1C';
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = '#FCA5A5';
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 488, 168);
  ctx.fillStyle = '#FFF8F0';
  ctx.font = '700 88px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ON AIR', 256, 98);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeConsoleBoxTex() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(0, 0, 512, 92);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 32px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2007 RADIO GRAND PRIZE', 256, 48);
  ctx.fillStyle = '#0EA5E9';
  ctx.font = '700 132px sans-serif';
  ctx.fillText('Wii', 256, 238);
  ctx.fillStyle = '#475569';
  ctx.font = '700 28px sans-serif';
  ctx.fillText('HOME GAMING CONSOLE', 256, 344);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, 476, 476);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeLabelTex(topBanner, mainTxt, subTxt, bannerHex = '#9E1B14') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F4E8CE';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = bannerHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 484, 228);
  ctx.fillStyle = bannerHex;
  ctx.fillRect(14, 14, 484, 56);
  ctx.fillStyle = '#FFF8EB';
  ctx.font = '700 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(topBanner, 256, 44);
  ctx.fillStyle = '#1B140C';
  ctx.font = '700 54px sans-serif';
  ctx.fillText(mainTxt, 256, 134);
  ctx.fillStyle = '#5C4B32';
  ctx.font = '700 23px monospace';
  ctx.fillText(subTxt, 256, 198);
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
  const gyriTex = getProceduralTextures('brainGyri');
  gyriTex.map.repeat.set(2, 2); gyriTex.normalMap.repeat.set(2, 2);
  const boneTex = getProceduralTextures('boneCortex');
  const organTex = getProceduralTextures('organTissue');
  const kidneyTex = getProceduralTextures('kidneyParenchyma');
  const foamTex = getProceduralTextures('acousticFoam');
  foamTex.map.repeat.set(4, 3); foamTex.normalMap.repeat.set(4, 3);
  const asphaltTex = getProceduralTextures('asphalt');
  asphaltTex.map.repeat.set(2, 1); asphaltTex.normalMap.repeat.set(2, 1);
  const wallTex = getProceduralTextures('wallpaperDark');
  wallTex.map.repeat.set(3, 2); wallTex.normalMap.repeat.set(3, 2);

  _matCache = {
    walnut: new THREE.MeshPhysicalMaterial({
      map: walnutTex.map, normalMap: walnutTex.normalMap, normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 0.42, metalness: 0.04, clearcoat: 0.35
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
      map: ironTex.map, normalMap: ironTex.normalMap, normalScale: new THREE.Vector2(1.2, 1.2),
      roughness: 0.48, metalness: 0.62, clearcoat: 0.14
    }),
    museumStand: new THREE.MeshPhysicalMaterial({
      color: 0x16161b, roughness: 0.34, metalness: 0.32, clearcoat: 0.42
    }),
    acousticFoam: new THREE.MeshPhysicalMaterial({
      map: foamTex.map, normalMap: foamTex.normalMap, normalScale: new THREE.Vector2(1.4, 1.4),
      roughness: 0.85, metalness: 0.02
    }),
    asphalt: new THREE.MeshPhysicalMaterial({
      map: asphaltTex.map, normalMap: asphaltTex.normalMap, normalScale: new THREE.Vector2(1.1, 1.1),
      roughness: 0.82, metalness: 0.0
    }),
    wallpaperDark: new THREE.MeshPhysicalMaterial({
      map: wallTex.map, normalMap: wallTex.normalMap, normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.78, metalness: 0.0
    }),
    brainTissue: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: gyriTex.map, normalMap: gyriTex.normalMap, normalScale: new THREE.Vector2(1.65, 1.65),
      roughness: 0.28, metalness: 0.02, clearcoat: 0.78, sheen: 0.45, sheenColor: new THREE.Color(0xffb4a8)
    }), 0xff8a75, 2.2, 0.72),
    brainEdema: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: gyriTex.map, normalMap: gyriTex.normalMap, normalScale: new THREE.Vector2(1.1, 1.1),
      color: 0xff5a52, emissive: 0x5c0c10, emissiveIntensity: 0.36,
      roughness: 0.20, clearcoat: 0.90
    }), 0xffb86c, 2.0, 0.86),
    skullBone: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: boneTex.map, normalMap: boneTex.normalMap, normalScale: new THREE.Vector2(0.95, 0.95),
      roughness: 0.44, metalness: 0.02, clearcoat: 0.22, side: THREE.DoubleSide
    }), 0xfff2d6, 2.6, 0.35),
    arteryTissue: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: organTex.map, normalMap: organTex.normalMap, normalScale: new THREE.Vector2(1.3, 1.3),
      roughness: 0.26, clearcoat: 0.82, sheen: 0.55, sheenColor: new THREE.Color(0xff968a), side: THREE.DoubleSide
    }), 0xff8a78, 2.2, 0.72),
    kidneyTissue: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: kidneyTex.map, normalMap: kidneyTex.normalMap, normalScale: new THREE.Vector2(1.15, 1.15),
      roughness: 0.25, clearcoat: 0.84, sheen: 0.45, sheenColor: new THREE.Color(0xff7868)
    }), 0xff7a5c, 2.2, 0.68),
    cellMembrane: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: organTex.map, normalMap: organTex.normalMap, normalScale: new THREE.Vector2(0.85, 0.85),
      color: 0xe8685c, roughness: 0.22, clearcoat: 0.90, transparent: true, opacity: 0.64, depthWrite: false, side: THREE.DoubleSide
    }), 0xffbe78, 2.0, 0.85),
    aquaporinCyan: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 0.62, roughness: 0.16, clearcoat: 0.92
    }), 0xcffafe, 1.9, 0.90),
    sodiumGold: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.68, roughness: 0.16, metalness: 0.35, clearcoat: 0.92
    }), 0xfef08a, 1.9, 0.92),
    waterPure: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8, emissive: 0x0369a1, emissiveIntensity: 0.34,
      roughness: 0.06, clearcoat: 1.0, transparent: true, opacity: 0.68
    }), 0xe0f2fe, 2.0, 0.88),
    salineEmerald: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0x34d399, emissive: 0x065f46, emissiveIntensity: 0.55,
      roughness: 0.08, clearcoat: 1.0, transparent: true, opacity: 0.78
    }), 0xa7f3d0, 2.0, 0.84),
    rbc: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xd61e26, roughness: 0.22, clearcoat: 0.84, emissive: 0x3b0408, emissiveIntensity: 0.26
    }), 0xff887a, 2.4, 0.56),
    glassClear: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xeef8ff, roughness: 0.05, metalness: 0.04, clearcoat: 1.0, clearcoatRoughness: 0.02,
      reflectivity: 0.95, transparent: true, opacity: 0.30, depthWrite: false
    }), 0xdff6ff, 2.4, 0.52),
    amberGlass: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xc86416, roughness: 0.09, metalness: 0.06, clearcoat: 1.0, transparent: true, opacity: 0.82
    }), 0xffc864, 2.2, 0.64),
    whitePlastic: new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc, roughness: 0.18, metalness: 0.02, clearcoat: 0.88
    }),
    mercuryRed: new THREE.MeshPhysicalMaterial({
      color: 0xe81e18, emissive: 0x99120c, emissiveIntensity: 0.68, roughness: 0.12, clearcoat: 0.95
    }),
    // Crisp Procedural Instrument & Signage Textures
    alarmDialFace: new THREE.MeshBasicMaterial({ map: makeClockFaceTex('SACRAMENTO · 2007') }),
    sodiumGaugeFace: new THREE.MeshBasicMaterial({ map: makeClinicalGaugeTex('SODIUM Na+', 'mmol / L', '135–145 NORMAL', true) }),
    icpGaugeFace: new THREE.MeshBasicMaterial({ map: makeClinicalGaugeTex('SKULL ICP', 'mmHg', 'PRESSURE CRISIS', false) }),
    onAirSignMat: new THREE.MeshBasicMaterial({ map: makeOnAirSignTex() }),
    consoleBoxMat: new THREE.MeshPhysicalMaterial({ map: makeConsoleBoxTex(), roughness: 0.22, clearcoat: 0.65 }),
    autopsyLabelMat: new THREE.MeshBasicMaterial({ map: makeLabelTex('AUTOPSY · CASE 2007', 'ZERO TOXINS', 'ONLY PURE WATER FOUND', '#9E1B14') }),
    salineLabelMat: new THREE.MeshBasicMaterial({ map: makeLabelTex('ICU EMERGENCY IV', '3% SALINE', 'HYPERTONIC NaCl RESCUE', '#0F766E') }),
    babyLabelMat: new THREE.MeshBasicMaterial({ map: makeLabelTex('INFANT SAFETY < 6 MO', 'NO PLAIN H2O', 'BREASTMILK / FORMULA ONLY', '#B91C1C') }),
    shadowFloor: new THREE.ShadowMaterial({ opacity: 0.34 })
  };

  return _matCache;
}
