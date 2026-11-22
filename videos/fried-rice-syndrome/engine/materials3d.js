// Pure-Code Era-2 Procedural PBR Texture, Sobel Normal Map & GLSL Fresnel Subsurface Rim Library (v13.0)
// ZERO double-pass transmission stalls — single-pass clearcoat + GLSL Fresnel subsurface rim glow!
import * as THREE from '../vendor/three.module.js';
import { clamp, lerp } from './dossier.js';

const _texCache = new Map();
let _mats = null;

function hash2(x, y, seed = 1337) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
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

function fbm2(x, y, octaves = 4, seed = 1337) {
  let val = 0, amp = 0.5, freq = 1.0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2(x * freq, y * freq, seed + i * 97);
    norm += amp;
    amp *= 0.5;
    freq *= 2.02;
  }
  return val / norm;
}

function buildNormalTex(heights, size, strength = 3.6) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) & (size - 1);
    const yp = (y + 1) & (size - 1);
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) & (size - 1);
      const xp = (x + 1) & (size - 1);
      const tl = heights[ym * size + xm], tc = heights[ym * size + x], tr = heights[ym * size + xp];
      const ml = heights[y * size + xm], mr = heights[y * size + xp];
      const bl = heights[yp * size + xm], bc = heights[yp * size + x], br = heights[yp * size + xp];
      const dx = ((tr + 2 * mr + br) - (tl + 2 * ml + bl)) * 0.25 * strength;
      const dy = ((bl + 2 * bc + br) - (tl + 2 * tc + tr)) * 0.25 * strength;
      const inv = 1.0 / Math.hypot(dx, dy, 1.0);
      const idx = (y * size + x) * 4;
      d[idx] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      d[idx + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      d[idx + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// GLSL Fresnel Subsurface Rim-Scattering Injector (gives biological molecules & organs cinema warmth!)
export function addFresnelRim(mat, rimHex = 0xff7b42, power = 2.4, intensity = 0.68) {
  const rimCol = new THREE.Color(rimHex);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: rimCol };
    shader.uniforms.uRimPower = { value: power };
    shader.uniforms.uRimIntensity = { value: intensity };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `
        #include <common>
        uniform vec3 uRimColor;
        uniform float uRimPower;
        uniform float uRimIntensity;
      `)
      .replace('#include <dithering_fragment>', `
        vec3 rimV = normalize(vViewPosition);
        float rimNdotV = clamp(dot(normalize(normal), rimV), 0.0, 1.0);
        gl_FragColor.rgb += uRimColor * pow(1.0 - rimNdotV, uRimPower) * uRimIntensity;
        #include <dithering_fragment>
      `);
  };
  return mat;
}

export function getTextures(kind) {
  if (_texCache.has(kind)) return _texCache.get(kind);
  const size = 128;
  const colC = document.createElement('canvas');
  colC.width = colC.height = size;
  const cCtx = colC.getContext('2d');
  const cImg = cCtx.createImageData(size, size);
  const heights = new Float32Array(size * size);
  let strength = 3.5;

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const i = y * size + x;
      const idx = i * 4;
      let r = 200, g = 200, b = 200, h = 0.5;

      if (kind === 'walnut') {
        const w = fbm2(u * 4, v * 4, 3, 101) * 0.25;
        const ring = Math.sin((v * 14 + w * 8) * Math.PI * 2) * 0.5 + 0.5;
        h = clamp(ring * 0.6 + fbm2(u * 28, v * 8, 3, 202) * 0.4);
        r = lerp(46, 112, h); g = lerp(24, 64, h); b = lerp(12, 34, h);
        strength = 4.2;
      } else if (kind === 'terracotta') {
        const grit = fbm2(u * 26, v * 26, 4, 303);
        h = clamp(grit);
        r = lerp(142, 206, h); g = lerp(66, 108, h); b = lerp(36, 62, h);
        strength = 4.6;
      } else if (kind === 'soil') {
        const clod = fbm2(u * 20, v * 20, 4, 355);
        h = clamp(clod);
        r = lerp(48, 106, h); g = lerp(32, 70, h); b = lerp(18, 42, h);
        strength = 5.4;
      } else if (kind === 'rice') {
        const grain = fbm2(u * 18, v * 8, 3, 404);
        h = clamp(0.45 + grain * 0.55);
        r = lerp(234, 252, h); g = lerp(226, 246, h); b = lerp(206, 232, h);
        strength = 2.4;
      } else if (kind === 'brass') {
        const br = fbm2(u * 56, v * 6, 3, 505);
        h = clamp(br * 0.7 + fbm2(u * 8, v * 8, 2, 511) * 0.3);
        r = lerp(170, 244, h); g = lerp(126, 198, h); b = lerp(42, 92, h);
        strength = 2.2;
      } else if (kind === 'steel') {
        h = clamp(fbm2(u * 8, v * 56, 3, 606));
        r = lerp(148, 218, h); g = lerp(156, 226, h); b = lerp(168, 236, h);
        strength = 2.2;
      } else if (kind === 'organicRed') {
        const cell = fbm2(u * 22, v * 22, 4, 707);
        h = clamp(cell);
        r = lerp(138, 232, h); g = lerp(22, 64, h); b = lerp(28, 56, h);
        strength = 5.2;
      } else if (kind === 'organicGold') {
        const cell = fbm2(u * 24, v * 24, 4, 808);
        h = clamp(cell);
        r = lerp(195, 255, h); g = lerp(112, 206, h); b = lerp(18, 68, h);
        strength = 5.0;
      } else if (kind === 'sporeArmor') {
        const plate = Math.abs(Math.sin(u * Math.PI * 10) * Math.cos(v * Math.PI * 10));
        h = clamp(plate * 0.65 + fbm2(u * 20, v * 20, 3, 888) * 0.35);
        r = lerp(112, 214, h); g = lerp(82, 162, h); b = lerp(34, 72, h);
        strength = 5.8;
      } else if (kind === 'liver') {
        const lob = fbm2(u * 18, v * 18, 4, 912);
        h = clamp(lob);
        r = lerp(96, 168, h); g = lerp(24, 48, h); b = lerp(28, 48, h);
        strength = 4.6;
      } else {
        // ceramic tile / plaster
        h = clamp(fbm2(u * 14, v * 14, 3, 999));
        r = lerp(218, 244, h); g = lerp(214, 238, h); b = lerp(202, 228, h);
        strength = 1.6;
      }

      heights[i] = h;
      cImg.data[idx] = clamp(Math.round(r), 0, 255);
      cImg.data[idx + 1] = clamp(Math.round(g), 0, 255);
      cImg.data[idx + 2] = clamp(Math.round(b), 0, 255);
      cImg.data[idx + 3] = 255;
    }
  }
  cCtx.putImageData(cImg, 0, 0);
  const map = new THREE.CanvasTexture(colC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const normalMap = buildNormalTex(heights, size, strength);
  const bundle = { map, normalMap };
  _texCache.set(kind, bundle);
  return bundle;
}

export function getMaterials3D() {
  if (_mats) return _mats;

  const tWalnut = getTextures('walnut');
  const tTerra = getTextures('terracotta');
  const tSoil = getTextures('soil');
  const tRice = getTextures('rice');
  const tBrass = getTextures('brass');
  const tSteel = getTextures('steel');
  const tOrgRed = getTextures('organicRed');
  const tOrgGold = getTextures('organicGold');
  const tSpore = getTextures('sporeArmor');
  const tLiver = getTextures('liver');
  const tCeramic = getTextures('ceramic');

  _mats = {
    walnut: new THREE.MeshStandardMaterial({
      map: tWalnut.map, normalMap: tWalnut.normalMap, normalScale: new THREE.Vector2(0.75, 0.75),
      roughness: 0.48, metalness: 0.04
    }),
    terracotta: new THREE.MeshStandardMaterial({
      map: tTerra.map, normalMap: tTerra.normalMap, normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.78, metalness: 0.02
    }),
    soil: new THREE.MeshStandardMaterial({
      map: tSoil.map, normalMap: tSoil.normalMap, normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 0.92, metalness: 0.0
    }),
    ceramic: new THREE.MeshPhysicalMaterial({
      map: tCeramic.map, normalMap: tCeramic.normalMap, normalScale: new THREE.Vector2(0.25, 0.25),
      roughness: 0.16, metalness: 0.04, clearcoat: 0.92, clearcoatRoughness: 0.08
    }),
    ceramicBlue: new THREE.MeshPhysicalMaterial({
      color: 0x24567c, normalMap: tCeramic.normalMap, normalScale: new THREE.Vector2(0.22, 0.22),
      roughness: 0.18, metalness: 0.05, clearcoat: 0.90, clearcoatRoughness: 0.10
    }),
    riceGrain: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: tRice.map, normalMap: tRice.normalMap, normalScale: new THREE.Vector2(0.42, 0.42),
      roughness: 0.34, metalness: 0.02, clearcoat: 0.55, clearcoatRoughness: 0.22
    }), 0xfff0c4, 2.8, 0.45),
    brass: new THREE.MeshPhysicalMaterial({
      map: tBrass.map, normalMap: tBrass.normalMap, normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.22, metalness: 0.88, clearcoat: 0.32
    }),
    steel: new THREE.MeshPhysicalMaterial({
      map: tSteel.map, normalMap: tSteel.normalMap, normalScale: new THREE.Vector2(0.28, 0.28),
      roughness: 0.18, metalness: 0.92, clearcoat: 0.38
    }),
    castIron: new THREE.MeshStandardMaterial({
      color: 0x1b1d22, normalMap: tSoil.normalMap, normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.55, metalness: 0.72
    }),
    museumBlack: new THREE.MeshPhysicalMaterial({
      color: 0x141518, roughness: 0.34, metalness: 0.18, clearcoat: 0.45
    }),
    clearGlass: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xeef9ff, roughness: 0.04, metalness: 0.06,
      clearcoat: 1.0, clearcoatRoughness: 0.02, transparent: true, opacity: 0.30, depthWrite: false
    }), 0xdcf4ff, 2.0, 0.85),
    amberGlass: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xb85a14, roughness: 0.08, metalness: 0.05,
      clearcoat: 1.0, clearcoatRoughness: 0.04, transparent: true, opacity: 0.68
    }), 0xffb84d, 2.2, 0.65),
    bacteriaRod: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0x2ecc71, normalMap: tOrgGold.normalMap, normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.28, metalness: 0.06, clearcoat: 0.78,
      emissive: new THREE.Color(0x0b4a26), emissiveIntensity: 0.35
    }), 0x8ef9b8, 2.2, 0.72),
    bacteriaDead: new THREE.MeshStandardMaterial({
      color: 0x6b7280, normalMap: tSoil.normalMap, normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.88, metalness: 0.05
    }),
    sporeArmor: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: tSpore.map, normalMap: tSpore.normalMap, normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 0.28, metalness: 0.35, clearcoat: 0.65,
      emissive: new THREE.Color(0x4a2400), emissiveIntensity: 0.32
    }), 0xffcc52, 2.3, 0.75),
    cereulideGold: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: tOrgGold.map, normalMap: tOrgGold.normalMap, normalScale: new THREE.Vector2(0.95, 0.95),
      roughness: 0.22, metalness: 0.22, clearcoat: 0.88,
      emissive: new THREE.Color(0xb44104), emissiveIntensity: 0.62
    }), 0xffe46b, 2.0, 0.95),
    crimsonOrganic: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: tOrgRed.map, normalMap: tOrgRed.normalMap, normalScale: new THREE.Vector2(0.95, 0.95),
      roughness: 0.28, metalness: 0.04, clearcoat: 0.75,
      emissive: new THREE.Color(0x52080d), emissiveIntensity: 0.42
    }), 0xff6e52, 2.2, 0.82),
    mitoCristae: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xe86c2c, normalMap: tOrgGold.normalMap, normalScale: new THREE.Vector2(0.75, 0.75),
      roughness: 0.30, metalness: 0.05, clearcoat: 0.68,
      emissive: new THREE.Color(0x5a1c06), emissiveIntensity: 0.38
    }), 0xffb454, 2.4, 0.70),
    atpCyan: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0x38e8ff, roughness: 0.14, metalness: 0.15, clearcoat: 0.95,
      emissive: new THREE.Color(0x0284c7), emissiveIntensity: 0.95
    }), 0xc4f6ff, 1.8, 0.95),
    potassiumViolet: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xc048ff, roughness: 0.16, metalness: 0.12, clearcoat: 0.90,
      emissive: new THREE.Color(0x6b21a8), emissiveIntensity: 0.85
    }), 0xf0abfc, 1.9, 0.90),
    liverHealthy: addFresnelRim(new THREE.MeshPhysicalMaterial({
      map: tLiver.map, normalMap: tLiver.normalMap, normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.28, metalness: 0.04, clearcoat: 0.80,
      emissive: new THREE.Color(0x2d070a), emissiveIntensity: 0.25
    }), 0xff7060, 2.4, 0.68),
    liverNecrotic: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0x4b1d1c, normalMap: tSoil.normalMap, normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 0.58, metalness: 0.05, clearcoat: 0.35,
      emissive: new THREE.Color(0x3a0c04), emissiveIntensity: 0.35
    }), 0xff5a26, 2.2, 0.60),
    iceBlue: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0x6ee7ff, roughness: 0.12, metalness: 0.1, clearcoat: 1.0,
      emissive: new THREE.Color(0x0369a1), emissiveIntensity: 0.55, transparent: true, opacity: 0.78
    }), 0xe0f8ff, 2.0, 0.92),
    acidGreen: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0x84cc16, roughness: 0.14, metalness: 0.05, clearcoat: 0.92,
      emissive: new THREE.Color(0x3f6212), emissiveIntensity: 0.65, transparent: true, opacity: 0.75
    }), 0xd9f99d, 2.0, 0.85),
    flameCore: new THREE.MeshBasicMaterial({ color: 0xffb824, transparent: true, opacity: 0.92 }),
    flameBlue: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.82 }),
    paperCream: new THREE.MeshStandardMaterial({
      map: tCeramic.map, color: 0xf4e8c8, roughness: 0.84, metalness: 0.0
    }),
    paddyGreen: new THREE.MeshStandardMaterial({
      color: 0x4d8c38, normalMap: tSoil.normalMap, normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.72, metalness: 0.02
    }),
    pastaGold: addFresnelRim(new THREE.MeshPhysicalMaterial({
      color: 0xeab64c, normalMap: tRice.normalMap, normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.38, metalness: 0.02, clearcoat: 0.45
    }), 0xffe49e, 2.6, 0.45),
    shadowFloor: new THREE.ShadowMaterial({ opacity: 0.38 })
  };
  return _mats;
}
