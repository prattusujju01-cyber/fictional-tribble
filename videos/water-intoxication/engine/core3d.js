// Sovereign v15.0 — Native 1080x1920 Full-HD Three.js WebGL2 Studio (ZERO Low-Res Upscaling)
import * as THREE from '../vendor/three.module.js';

export { THREE };

export const WEBGL_W = 1080;
export const WEBGL_H = 1920;

let _studio = null;

function buildStudioEnvMap(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x161412);

  const mkPanel = (w, h, color, intensity, pos, look) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide
      })
    );
    m.position.set(...pos);
    m.lookAt(...look);
    envScene.add(m);
  };

  // 3-softbox museum & laboratory reflection setup
  mkPanel(14, 14, 0xFFF2DC, 2.35, [-7, 9, 8], [0, 0, 0]);
  mkPanel(12, 10, 0xB8E0FF, 1.45, [9, 4, 6], [0, 0, 0]);
  mkPanel(16, 6, 0xFFB86B, 1.65, [0, 7, -9], [0, 0, 0]);
  mkPanel(20, 20, 0x261F18, 0.55, [0, -10, 0], [0, 0, 0]);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return rt.texture;
}

export function getStudio() {
  if (_studio) return _studio;

  const glCanvas = document.createElement('canvas');
  glCanvas.width = WEBGL_W;
  glCanvas.height = WEBGL_H;

  const renderer = new THREE.WebGLRenderer({
    canvas: glCanvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
  });
  renderer.setSize(WEBGL_W, WEBGL_H, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const envTex = buildStudioEnvMap(renderer);
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(34, WEBGL_W / WEBGL_H, 0.1, 120);
  camera.position.set(0, 0.2, 8.5);
  camera.lookAt(0, 0, 0);

  const hemiLight = new THREE.HemisphereLight(0xFFF3DF, 0x241B14, 0.58);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xFFF3E0, 2.45);
  keyLight.position.set(-4.2, 6.8, 6.4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1.0;
  keyLight.shadow.camera.far = 26.0;
  keyLight.shadow.camera.left = -5.5;
  keyLight.shadow.camera.right = 5.5;
  keyLight.shadow.camera.top = 7.5;
  keyLight.shadow.camera.bottom = -7.5;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.018;
  scene.add(keyLight);
  scene.add(keyLight.target);

  const fillLight = new THREE.DirectionalLight(0xC9E2FF, 0.72);
  fillLight.position.set(5.2, 2.2, 5.0);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xFFC278, 1.35);
  rimLight.position.set(2.5, 4.8, -5.5);
  scene.add(rimLight);

  const practicalLight = new THREE.PointLight(0xFF5533, 0.0, 9.0, 1.8);
  practicalLight.position.set(0, 2.0, 2.0);
  scene.add(practicalLight);

  const worldRoot = new THREE.Group();
  scene.add(worldRoot);

  _studio = {
    glCanvas,
    renderer,
    scene,
    camera,
    hemiLight,
    keyLight,
    fillLight,
    rimLight,
    practicalLight,
    worldRoot
  };
  return _studio;
}

export function applyLightingPreset(studio, mode = 'warm_museum') {
  const { hemiLight, keyLight, fillLight, rimLight, practicalLight, renderer } = studio;
  practicalLight.intensity = 0;

  if (mode === 'radio_booth') {
    hemiLight.color.setHex(0xFFEBD2);
    hemiLight.groundColor.setHex(0x231A13);
    hemiLight.intensity = 0.56;
    keyLight.color.setHex(0xFFF0D6);
    keyLight.intensity = 2.40;
    keyLight.position.set(-3.8, 6.2, 6.2);
    fillLight.color.setHex(0xB8DCFF);
    fillLight.intensity = 0.68;
    rimLight.color.setHex(0xFF9E52);
    rimLight.intensity = 1.25;
    renderer.toneMappingExposure = 1.08;
  } else if (mode === 'night_bedroom') {
    hemiLight.color.setHex(0x8FB2FF);
    hemiLight.groundColor.setHex(0x121524);
    hemiLight.intensity = 0.44;
    keyLight.color.setHex(0x9BC0FF);
    keyLight.intensity = 1.55;
    keyLight.position.set(4.2, 5.5, 5.4);
    fillLight.color.setHex(0xFFE0B2);
    fillLight.intensity = 0.45;
    rimLight.color.setHex(0x7DA6FF);
    rimLight.intensity = 1.05;
    practicalLight.color.setHex(0xFFA84C);
    practicalLight.position.set(-1.55, 0.35, 1.65);
    practicalLight.intensity = 3.2;
    renderer.toneMappingExposure = 1.06;
  } else if (mode === 'crimson_bio') {
    hemiLight.color.setHex(0xFFD6D6);
    hemiLight.groundColor.setHex(0x2B080C);
    hemiLight.intensity = 0.52;
    keyLight.color.setHex(0xFFF0E8);
    keyLight.intensity = 2.35;
    keyLight.position.set(-3.4, 5.6, 6.0);
    fillLight.color.setHex(0x78D6FF);
    fillLight.intensity = 0.72;
    rimLight.color.setHex(0xFF6B6B);
    rimLight.intensity = 1.55;
    renderer.toneMappingExposure = 1.10;
  } else if (mode === 'anatomy_dramatic') {
    hemiLight.color.setHex(0xF6EDE2);
    hemiLight.groundColor.setHex(0x18141A);
    hemiLight.intensity = 0.52;
    keyLight.color.setHex(0xFFF3E4);
    keyLight.intensity = 2.55;
    keyLight.position.set(-3.6, 5.8, 6.5);
    fillLight.color.setHex(0xB8DAFF);
    fillLight.intensity = 0.66;
    rimLight.color.setHex(0xFF9F7A);
    rimLight.intensity = 1.35;
    renderer.toneMappingExposure = 1.09;
  } else if (mode === 'switchboard') {
    hemiLight.color.setHex(0xD8FFF0);
    hemiLight.groundColor.setHex(0x0B2119);
    hemiLight.intensity = 0.55;
    keyLight.color.setHex(0xFFF2D8);
    keyLight.intensity = 2.45;
    keyLight.position.set(-3.2, 5.8, 6.4);
    fillLight.color.setHex(0x9CE8D2);
    fillLight.intensity = 0.70;
    rimLight.color.setHex(0xFFB347);
    rimLight.intensity = 1.25;
    renderer.toneMappingExposure = 1.08;
  } else {
    // warm_museum / lab default
    hemiLight.color.setHex(0xFFF4E2);
    hemiLight.groundColor.setHex(0x2E2012);
    hemiLight.intensity = 0.60;
    keyLight.color.setHex(0xFFF4E4);
    keyLight.intensity = 2.45;
    keyLight.position.set(-4.0, 6.5, 6.4);
    fillLight.color.setHex(0xCAE4FF);
    fillLight.intensity = 0.74;
    rimLight.color.setHex(0xFFCA80);
    rimLight.intensity = 1.25;
    renderer.toneMappingExposure = 1.08;
  }
}
