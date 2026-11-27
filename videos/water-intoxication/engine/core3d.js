// Pure-Code Era-2 Supersampled 648x1152 WebGL2 Studio, Volumetric Beam, Crisis Pulse & Camera Rig (v14.0)
import * as THREE from '../vendor/three.module.js';
import { W, H, clamp, lerp, mulberry32 } from './dossier.js';
import { getMaterials3D } from './materials3d.js';

let _engine = null;
const WEBGL_W = 648;
const WEBGL_H = 1152;

export function smoothstep5(x) {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function makeRadialBackdropTex(centerHex, midHex, edgeHex) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 248, 18, 128, 256, 316);
  g.addColorStop(0.0, centerHex);
  g.addColorStop(0.58, midHex);
  g.addColorStop(1.0, edgeHex);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function bakeSoftboxEnv(renderer, pmrem, bgHex, keyHex, rimHex, fillHex) {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(bgHex);
  const panels = [
    { pos: [6, 11, 7], size: [14, 14], col: keyHex },
    { pos: [-10, 4, -5], size: [6, 18], col: rimHex },
    { pos: [9, -2, 5], size: [10, 10], col: fillHex }
  ];
  for (const p of panels) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(p.size[0], p.size[1]),
      new THREE.MeshBasicMaterial({ color: p.col, side: THREE.DoubleSide })
    );
    m.position.set(p.pos[0], p.pos[1], p.pos[2]);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  }
  return pmrem.fromScene(envScene, 0.04).texture;
}

export function getCore3D() {
  if (_engine) return _engine;

  const webglCanvas = document.createElement('canvas');
  webglCanvas.width = WEBGL_W;
  webglCanvas.height = WEBGL_H;

  const renderer = new THREE.WebGLRenderer({
    canvas: webglCanvas,
    antialias: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
    alpha: false
  });
  renderer.setSize(WEBGL_W, WEBGL_H, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envs = {
    goldenOchre:    bakeSoftboxEnv(renderer, pmrem, 0xb87614, 0xfff8e4, 0xffc642, 0xd49222),
    warmKraft:      bakeSoftboxEnv(renderer, pmrem, 0x8e7248, 0xfff6e5, 0xe8b96a, 0xa88a5e),
    velvetCrimson:  bakeSoftboxEnv(renderer, pmrem, 0x260509, 0xffece6, 0xff4b32, 0xf7b838),
    midnightIndigo: bakeSoftboxEnv(renderer, pmrem, 0x0b1224, 0xdbeafe, 0x48b8ff, 0xf59e0b),
    volcanicAmber:  bakeSoftboxEnv(renderer, pmrem, 0x240a03, 0xfff0d4, 0xff6b24, 0xfbbf24),
    emeraldLab:     bakeSoftboxEnv(renderer, pmrem, 0x061b18, 0xe6fff8, 0x34d399, 0x38bdf8)
  };

  const backdrops = {
    goldenOchre:    makeRadialBackdropTex('#E8AE30', '#C98718', '#7D4A08'),
    warmKraft:      makeRadialBackdropTex('#D2BA8F', '#B39667', '#6E5532'),
    velvetCrimson:  makeRadialBackdropTex('#841B27', '#4B0C14', '#180306'),
    midnightIndigo: makeRadialBackdropTex('#213562', '#121E3A', '#070C18'),
    volcanicAmber:  makeRadialBackdropTex('#7C2D12', '#431407', '#160602'),
    emeraldLab:     makeRadialBackdropTex('#17584E', '#0C332E', '#051513')
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
  const mats = getMaterials3D();

  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), mats.shadowFloor);
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -1.75;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  const hemiLight = new THREE.HemisphereLight(0xfff5e0, 0x241608, 0.56);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff3dc, 2.75);
  keyLight.position.set(4.6, 7.6, 5.4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(768, 768);
  keyLight.shadow.camera.left = -5.5;
  keyLight.shadow.camera.right = 5.5;
  keyLight.shadow.camera.top = 5.5;
  keyLight.shadow.camera.bottom = -5.5;
  keyLight.shadow.camera.near = 1.0;
  keyLight.shadow.camera.far = 22.0;
  keyLight.shadow.normalBias = 0.02;
  keyLight.shadow.bias = -0.0002;
  scene.add(keyLight);

  const rimLight = new THREE.SpotLight(0xffb848, 185, 24, Math.PI * 0.30, 0.6, 1.8);
  rimLight.position.set(-5.2, 3.6, -3.2);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x60a5fa, 55, 20, 1.8);
  fillLight.position.set(4.2, -0.8, 4.0);
  scene.add(fillLight);

  // v14.0 Dynamic Practical Crisis/Rescue Pulse Light
  const crisisLight = new THREE.PointLight(0xff3824, 0, 9, 1.8);
  crisisLight.position.set(0, 0.8, 2.2);
  scene.add(crisisLight);

  // v14.0 Subtle Additive Volumetric Studio Light Shaft
  const volBeamMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c8,
    transparent: true,
    opacity: 0.048,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const volBeam = new THREE.Mesh(new THREE.ConeGeometry(3.6, 10.5, 28, 1, true), volBeamMat);
  volBeam.position.set(1.1, 2.8, -0.8);
  volBeam.rotation.z = 0.28;
  scene.add(volBeam);

  // Floating atmospheric bokeh motes
  const rnd = mulberry32(77312);
  const dustCount = 150;
  const dustBase = new Float32Array(dustCount * 3);
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustBase[i * 3] = (rnd() - 0.5) * 7.6;
    dustBase[i * 3 + 1] = -1.6 + rnd() * 4.8;
    dustBase[i * 3 + 2] = -2.2 + rnd() * 4.6;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xffe8b0, size: 0.048, transparent: true, opacity: 0.38, depthWrite: false
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);

  const stageGroup = new THREE.Group();
  scene.add(stageGroup);

  _engine = {
    webglCanvas, renderer, scene, camera, stageGroup, shadowCatcher,
    hemiLight, keyLight, rimLight, fillLight, crisisLight, volBeam,
    dustPoints, dustBase, dustPos, envs, backdrops, mats, lastPal: null
  };
  return _engine;
}

export function configureStageMood(palKey, globalT, showShadowFloor = true, crisisPulse = 0, crisisHex = 0xff3020) {
  const eng = getCore3D();
  const {
    scene, shadowCatcher, hemiLight, keyLight, rimLight, fillLight,
    crisisLight, volBeam, dustPoints, dustBase, dustPos, envs, backdrops
  } = eng;
  shadowCatcher.visible = showShadowFloor;

  crisisLight.color.setHex(crisisHex);
  crisisLight.intensity = crisisPulse * 48;

  if (eng.lastPal !== palKey) {
    eng.lastPal = palKey;
    scene.environment = envs[palKey] || envs.goldenOchre;
    scene.background = backdrops[palKey] || backdrops.goldenOchre;

    if (palKey === 'goldenOchre' || palKey === 'warmKraft') {
      hemiLight.color.setHex(0xfff5dc);
      hemiLight.groundColor.setHex(0x4a2c0a);
      hemiLight.intensity = 0.56;
      keyLight.color.setHex(0xfff4dd);
      keyLight.intensity = 2.65;
      rimLight.color.setHex(0xffc048);
      rimLight.intensity = 155;
      fillLight.color.setHex(0xffdfa8);
      fillLight.intensity = 42;
      volBeam.material.color.setHex(0xfff4d2);
      volBeam.material.opacity = 0.038;
      dustPoints.material.color.setHex(0xfff0b8);
      dustPoints.material.opacity = 0.30;
    } else if (palKey === 'velvetCrimson') {
      hemiLight.color.setHex(0xffc8c0);
      hemiLight.groundColor.setHex(0x280408);
      hemiLight.intensity = 0.48;
      keyLight.color.setHex(0xffece4);
      keyLight.intensity = 2.85;
      rimLight.color.setHex(0xff5838);
      rimLight.intensity = 220;
      fillLight.color.setHex(0xffbe42);
      fillLight.intensity = 60;
      volBeam.material.color.setHex(0xff7858);
      volBeam.material.opacity = 0.052;
      dustPoints.material.color.setHex(0xffaa68);
      dustPoints.material.opacity = 0.46;
    } else if (palKey === 'volcanicAmber') {
      hemiLight.color.setHex(0xffddb8);
      hemiLight.groundColor.setHex(0x280c02);
      hemiLight.intensity = 0.50;
      keyLight.color.setHex(0xfff2dc);
      keyLight.intensity = 2.90;
      rimLight.color.setHex(0xff7224);
      rimLight.intensity = 225;
      fillLight.color.setHex(0xfbbf24);
      fillLight.intensity = 65;
      volBeam.material.color.setHex(0xffa84c);
      volBeam.material.opacity = 0.055;
      dustPoints.material.color.setHex(0xffc852);
      dustPoints.material.opacity = 0.50;
    } else if (palKey === 'emeraldLab') {
      hemiLight.color.setHex(0xd4fff2);
      hemiLight.groundColor.setHex(0x041e1a);
      hemiLight.intensity = 0.54;
      keyLight.color.setHex(0xf0fffa);
      keyLight.intensity = 2.75;
      rimLight.color.setHex(0x34d399);
      rimLight.intensity = 195;
      fillLight.color.setHex(0x38bdf8);
      fillLight.intensity = 55;
      volBeam.material.color.setHex(0x7ef7d4);
      volBeam.material.opacity = 0.050;
      dustPoints.material.color.setHex(0x7ef7d4);
      dustPoints.material.opacity = 0.42;
    } else {
      // midnightIndigo
      hemiLight.color.setHex(0xc8deff);
      hemiLight.groundColor.setHex(0x0a1020);
      hemiLight.intensity = 0.48;
      keyLight.color.setHex(0xe8f2ff);
      keyLight.intensity = 2.45;
      rimLight.color.setHex(0x38bdf8);
      rimLight.intensity = 185;
      fillLight.color.setHex(0xffb44c);
      fillLight.intensity = 64;
      volBeam.material.color.setHex(0x93c5fd);
      volBeam.material.opacity = 0.054;
      dustPoints.material.color.setHex(0xbae6fd);
      dustPoints.material.opacity = 0.40;
    }
  }

  volBeam.position.x = 1.0 + Math.sin(globalT * 0.45) * 0.35;
  const count = dustBase.length / 3;
  for (let i = 0; i < count; i++) {
    dustPos[i * 3] = dustBase[i * 3] + Math.sin(globalT * 0.75 + i * 1.3) * 0.24;
    dustPos[i * 3 + 1] = -1.6 + (((dustBase[i * 3 + 1] + 1.6 + globalT * 0.22 + i * 0.17) % 4.8 + 4.8) % 4.8);
    dustPos[i * 3 + 2] = dustBase[i * 3 + 2] + Math.cos(globalT * 0.65 + i * 0.9) * 0.20;
  }
  dustPoints.geometry.attributes.position.needsUpdate = true;
}

export function evalCamera3D(camKeyframes, localP, globalT, impactOpts = null, transMod = null) {
  const { camera } = getCore3D();
  const kfs = camKeyframes && camKeyframes.length ? camKeyframes : [
    { p: 0.0, pos: [0, 0.5, 5.4], look: [0, 0.0, 0], fov: 39, roll: 0 },
    { p: 1.0, pos: [0, 0.3, 4.4], look: [0, 0.0, 0], fov: 35, roll: 0 }
  ];
  let k0 = kfs[0], k1 = kfs[kfs.length - 1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (localP >= kfs[i].p && localP <= kfs[i + 1].p) { k0 = kfs[i]; k1 = kfs[i + 1]; break; }
  }
  const span = Math.max(0.0001, k1.p - k0.p);
  const rawU = clamp((localP - k0.p) / span, 0, 1);
  const u = smoothstep5(rawU);

  const bx = Math.sin(globalT * 1.8) * 0.028 + Math.cos(globalT * 3.3) * 0.01;
  const by = Math.cos(globalT * 1.5) * 0.024;
  const bz = Math.sin(globalT * 1.1) * 0.028;

  let sx = 0, sy = 0, sRoll = 0;
  if (impactOpts && localP >= impactOpts.at && localP < impactOpts.at + 0.28) {
    const dt = localP - impactOpts.at;
    const mag = (impactOpts.mag || 0.24) * Math.exp(-dt * 18);
    sx = Math.sin(globalT * 75) * mag;
    sy = Math.cos(globalT * 92) * mag;
    sRoll = Math.sin(globalT * 64) * mag * 0.1;
  }

  const panX = transMod ? (transMod.panOffsetX || 0) : 0;
  const zScale = transMod ? (transMod.zoomScale || 1.0) : 1.0;

  const lx = lerp(k0.look[0], k1.look[0], u) + sx * 0.4 + panX * 0.65;
  const ly = lerp(k0.look[1], k1.look[1], u) + 0.18 + sy * 0.4;
  const lz = lerp(k0.look[2], k1.look[2], u);

  const rawPx = lerp(k0.pos[0], k1.pos[0], u) + bx + sx + panX;
  const rawPy = lerp(k0.pos[1], k1.pos[1], u) + by + sy;
  const rawPz = lerp(k0.pos[2], k1.pos[2], u) + bz;

  const px = lx + (rawPx - lx) * 1.56 * zScale;
  const py = ly + (rawPy - ly) * 1.42 * zScale;
  const pz = lz + (rawPz - lz) * 1.66 * zScale;

  const fov = clamp(lerp(k0.fov || 40, k1.fov || 40, u) * 1.18 * zScale, 26, 58);
  const roll = lerp(k0.roll || 0, k1.roll || 0, u) + sRoll;

  camera.position.set(px, py, pz);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(lx, ly, lz);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

export function renderWebGLTo2D(ctx) {
  const { renderer, scene, camera, webglCanvas } = getCore3D();
  renderer.render(scene, camera);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(webglCanvas, 0, 0, W, H);
  ctx.restore();
}
