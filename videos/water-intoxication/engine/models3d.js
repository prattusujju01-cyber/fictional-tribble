// Modular Pure-Code Sculptural, Live-Morphing & Animated 3D Diorama Factory (v14.0 — Water Intoxication)
// 22 Bespoke 3D Assemblies: Live-Swelling Brain in Split 7mm Skull, Live-Ballooning Osmosis Cell,
// 2007 Broadcast Radio Studio, Anatomical Kidney Overflow, Sodium Y-Artery Gauge, Brainstem Switchboard & Hydration Rack!
import * as THREE from '../vendor/three.module.js';
import { getMaterials3D } from './materials3d.js';
import { clamp, lerp, mulberry32 } from './dossier.js';

function enableShadows(group) {
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

export function sculptOrganicGeo(geo, amp = 0.08, freq = 2.6, seed = 11) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n1 = Math.sin(x * freq + seed) * Math.cos(y * freq * 1.15 - seed * 0.7) * Math.sin(z * freq * 0.9 + seed * 1.3);
    const n2 = Math.sin(x * freq * 2.3 - y * freq * 1.9 + seed * 2.1) * 0.45;
    const d = 1 + (n1 + n2) * amp;
    pos.setXYZ(i, x * d, y * d, z * d);
  }
  geo.computeVertexNormals();
  geo.userData.basePos = new Float32Array(pos.array);
  return geo;
}

// Deterministic real-time radial swelling / compression morph (ZERO frame-to-frame drift!)
export function morphGeoSwelling(geo, swellFactor = 1.0, clampRadius = 999, wobbleT = 0) {
  const base = geo.userData.basePos;
  if (!base) return;
  const pos = geo.attributes.position;
  const arr = pos.array;
  for (let i = 0; i < pos.count; i++) {
    const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
    const pulse = 1 + (wobbleT ? Math.sin(bx * 4 + by * 3 + wobbleT * 5) * 0.018 : 0);
    let nx = bx * swellFactor * pulse;
    let ny = by * swellFactor * pulse;
    let nz = bz * swellFactor * pulse;
    const r = Math.hypot(nx, ny, nz);
    if (r > clampRadius) {
      const s = clampRadius / r;
      nx *= s; ny *= s; nz *= s;
    }
    arr[i * 3] = nx;
    arr[i * 3 + 1] = ny;
    arr[i * 3 + 2] = nz;
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// 1. Crystal Carafe Pouring Live Stream into Tumbler with Ripples & Micro-Bubbles (S01, S08)
export function buildPouringGlass3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Crystal heavy-base drinking tumbler
  const glassPts = [
    new THREE.Vector2(0.0, -1.15),
    new THREE.Vector2(0.66, -1.15),
    new THREE.Vector2(0.70, -0.96),
    new THREE.Vector2(0.80, 0.55),
    new THREE.Vector2(0.75, 0.57),
    new THREE.Vector2(0.64, -0.88),
    new THREE.Vector2(0.0, -0.88)
  ];
  const tumbler = new THREE.Mesh(new THREE.LatheGeometry(glassPts, 40), mats.glassClear);
  tumbler.position.set(0.15, -0.25, 0);
  root.add(tumbler);

  // Rising pure water column inside tumbler
  const waterCol = new THREE.Mesh(new THREE.CylinderGeometry(0.71, 0.63, 1.26, 36), mats.waterPure);
  waterCol.position.set(0.15, -0.52, 0);
  root.add(waterCol);

  // Concentric surface ripple torus rings
  const ripples = new THREE.Group();
  ripples.position.set(0.15, 0.12, 0);
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.18 + i * 0.16, 0.015, 8, 28), mats.aquaporinCyan);
    r.rotation.x = Math.PI / 2;
    ripples.add(r);
  }
  root.add(ripples);

  // Tilted glass carafe pouring from top-left
  const pitcher = new THREE.Group();
  pitcher.position.set(-0.92, 1.18, 0);
  pitcher.rotation.z = -0.92;
  const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 1.12, 32), mats.glassClear);
  const pWater = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.41, 0.68, 28), mats.waterPure);
  pWater.position.y = -0.14;
  pitcher.add(pBody); pitcher.add(pWater);
  root.add(pitcher);

  // Curved 3D pouring water stream + travelling cyan highlight beads
  const streamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.46, 0.94, 0),
    new THREE.Vector3(-0.08, 0.62, 0),
    new THREE.Vector3(0.12, 0.10, 0),
    new THREE.Vector3(0.15, -0.35, 0)
  ]);
  const stream = new THREE.Mesh(new THREE.TubeGeometry(streamCurve, 24, 0.075, 14, false), mats.waterPure);
  root.add(stream);

  const bubbles = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.045 + (i % 3) * 0.02, 10, 8), mats.aquaporinCyan);
    b.userData = { bx: 0.15 + ((i * 29) % 9 - 4) * 0.11, bz: ((i * 17) % 7 - 3) * 0.11, phase: i * 0.55 };
    bubbles.add(b);
  }
  root.add(bubbles);

  root.userData = { waterCol, ripples, bubbles, pitcher, stream };
  return enableShadows(root);
}

// 2. 2007 Sacramento FM Radio Studio Desk, ON AIR Lightbox, Boom Mic & 7 Draining Bottles (S02, S04)
export function buildRadioStudio3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Acoustic pyramid-foam studio wall
  const wall = new THREE.Mesh(new THREE.BoxGeometry(9.0, 7.5, 0.25), mats.acousticFoam);
  wall.position.set(0, 1.6, -2.1);
  root.add(wall);

  // Glowing crimson backlit "ON AIR" sign box (shifted right of top-left headline!)
  const signGroup = new THREE.Group();
  signGroup.position.set(0.68, 1.15, -1.88);
  const signCase = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.62, 0.18), mats.castIron);
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(1.50, 0.52), mats.onAirSignMat);
  signFace.position.z = 0.095;
  const onAirGlow = new THREE.PointLight(0xff2e24, 24, 7, 1.8);
  onAirGlow.position.set(0, 0, 0.45);
  signGroup.add(signCase); signGroup.add(signFace); signGroup.add(onAirGlow);
  root.add(signGroup);

  // Walnut broadcast console desk
  const desk = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.30, 3.2), mats.walnut);
  desk.position.set(0, -1.18, 0);
  root.add(desk);

  // Vintage chrome broadcast condenser microphone on boom arm
  const micGroup = new THREE.Group();
  micGroup.position.set(-1.12, -0.32, 0.35);
  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 24), mats.castIron);
  standBase.position.y = -0.68;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.92, 12), mats.steel);
  pole.position.y = -0.22;
  const micCapsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.26, 12, 20), mats.steel);
  micCapsule.position.set(0.18, 0.28, 0);
  micCapsule.rotation.z = -0.25;
  const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.022, 8, 20, Math.PI), mats.brass);
  yoke.position.set(0.18, 0.24, 0);
  yoke.rotation.z = Math.PI;
  micGroup.add(standBase); micGroup.add(pole); micGroup.add(micCapsule); micGroup.add(yoke);
  root.add(micGroup);

  // Row of 7 clear 1-liter contest water bottles that visibly drain one by one!
  const bottles = [];
  for (let i = 0; i < 7; i++) {
    const bg = new THREE.Group();
    const row = i < 4 ? 0 : 1;
    const col = row === 0 ? i : (i - 3.5);
    bg.position.set(-0.28 + col * 0.48, -0.58, row === 0 ? 0.32 : -0.22);

    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.84, 20), mats.glassClear);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.08, 14), mats.aquaporinCyan);
    cap.position.y = 0.46;
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.142, 0.74, 18), mats.waterPure);
    fill.position.y = -0.02;
    bg.add(shell); bg.add(cap); bg.add(fill);
    bg.userData = { fill };
    bottles.push(bg);
    root.add(bg);
  }

  root.userData = { bottles, onAirGlow, micGroup };
  return enableShadows(root);
}

// 3. 2007 Gaming Console Grand Prize Pedestal (S03)
export function buildGameConsolePrize3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.42, 0.24, 40), mats.walnut);
  plinth.position.y = -1.18;
  root.add(plinth);
  const brassRing = new THREE.Mesh(new THREE.TorusGeometry(1.30, 0.03, 10, 40), mats.brass);
  brassRing.rotation.x = Math.PI / 2;
  brassRing.position.y = -1.06;
  root.add(brassRing);

  // Sleek retail box + white console tower + glowing blue disc slot + remote
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.62, 0.42), mats.consoleBoxMat);
  box.position.set(-0.28, -0.24, -0.18);
  box.rotation.y = 0.22;
  root.add(box);

  const consoleUnit = new THREE.Group();
  consoleUnit.position.set(0.66, -0.42, 0.32);
  consoleUnit.rotation.y = -0.35;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.18, 0.86), mats.whitePlastic);
  tower.rotation.z = 0.08;
  const slotGlow = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.78, 0.04), mats.aquaporinCyan);
  slotGlow.position.set(-0.14, 0.06, 0.42);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 24), mats.steel);
  stand.position.y = -0.58;
  consoleUnit.add(tower); consoleUnit.add(slotGlow); consoleUnit.add(stand);
  root.add(consoleUnit);

  const remote = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.09, 0.74), mats.whitePlastic);
  remote.position.set(0.05, -1.01, 0.62);
  remote.rotation.y = 0.42;
  root.add(remote);

  return enableShadows(root);
}

// 4. Suburban Nightstand, Sweeping Brass Alarm Clock & Console Box (S05, S23)
export function buildBedroomCollapse3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const wall = new THREE.Mesh(new THREE.BoxGeometry(8.5, 7.5, 0.2), mats.wallpaperDark);
  wall.position.set(0, 1.6, -2.0);
  root.add(wall);

  const table = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.26, 2.8), mats.walnut);
  table.position.set(0, -1.22, 0);
  root.add(table);

  const clockGroup = new THREE.Group();
  clockGroup.position.set(-0.24, -0.24, 0.16);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.32, 42), mats.brass);
  body.rotation.x = Math.PI / 2;
  clockGroup.add(body);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.055, 14, 42), mats.brass);
  bezel.position.z = 0.16;
  clockGroup.add(bezel);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.70, 42), mats.alarmDialFace);
  dial.position.z = 0.17;
  clockGroup.add(dial);

  for (const s of [-1, 1]) {
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), mats.brass);
    bell.position.set(s * 0.50, 0.70, 0);
    bell.rotation.z = -s * 0.52;
    clockGroup.add(bell);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 10), mats.brass);
    foot.position.set(s * 0.44, -0.76, 0.04);
    clockGroup.add(foot);
  }
  const handGroup = new THREE.Group();
  handGroup.position.z = 0.20;
  const hHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.02), mats.castIron);
  hHand.position.y = 0.14;
  const mHand = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.50, 0.02), mats.mercuryRed);
  mHand.position.y = 0.22;
  handGroup.add(hHand); handGroup.add(mHand);
  clockGroup.add(handGroup);
  root.add(clockGroup);

  // Empty tipped water bottle on nightstand
  const emptyBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.88, 22), mats.glassClear);
  emptyBottle.rotation.z = Math.PI / 2;
  emptyBottle.rotation.y = 0.38;
  emptyBottle.position.set(0.95, -0.90, 0.38);
  root.add(emptyBottle);

  // Warm brass bedside lamp
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.50, 20), mats.brass);
  lampBase.position.set(1.32, -0.84, -0.72);
  root.add(lampBase);
  const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.50, 0.58, 24), new THREE.MeshBasicMaterial({ color: 0xffe0a3 }));
  lampShade.position.set(1.32, -0.28, -0.72);
  root.add(lampShade);
  const lampGlow = new THREE.PointLight(0xffb44c, 20, 7, 1.8);
  lampGlow.position.set(1.2, -0.15, -0.45);
  root.add(lampGlow);

  root.userData = { handGroup };
  return enableShadows(root);
}

// 5. Autopsy Toxicology Bottle — ZERO TOXINS / ONLY PURE WATER (S06)
export function buildAutopsyBottle3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const pts = [
    new THREE.Vector2(0.0, -1.18),
    new THREE.Vector2(0.76, -1.18),
    new THREE.Vector2(0.82, -1.04),
    new THREE.Vector2(0.82, 0.36),
    new THREE.Vector2(0.58, 0.72),
    new THREE.Vector2(0.32, 0.88),
    new THREE.Vector2(0.32, 1.22),
    new THREE.Vector2(0.37, 1.32),
    new THREE.Vector2(0.26, 1.32)
  ];
  root.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 44), mats.glassClear));

  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.18, 36), mats.waterPure);
  water.position.y = -0.50;
  root.add(water);

  const stopper = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.26, 0.28, 26), mats.oakLight);
  stopper.position.y = 1.42;
  root.add(stopper);
  const crimp = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 26), mats.steel);
  crimp.position.y = 1.28;
  root.add(crimp);

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.845, 0.845, 0.88, 36, 1, true, -0.95, 1.9),
    mats.autopsyLabelMat
  );
  label.position.y = -0.34;
  root.add(label);

  return enableShadows(root);
}

// 6. Macro 3D H2O Molecules Flooding Sparse Golden Na+ Ions (S07)
export function buildWaterSodiumCluster3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();
  const rnd = mulberry32(707);

  const h2oGroup = new THREE.Group();
  const oxGeo = new THREE.SphereGeometry(0.19, 18, 14);
  const hyGeo = new THREE.SphereGeometry(0.11, 14, 10);
  for (let i = 0; i < 18; i++) {
    const mol = new THREE.Group();
    mol.add(new THREE.Mesh(oxGeo, mats.waterPure));
    for (const ang of [-0.91, 0.91]) {
      const h = new THREE.Mesh(hyGeo, mats.whitePlastic);
      h.position.set(Math.sin(ang) * 0.22, Math.cos(ang) * 0.22, 0);
      mol.add(h);
    }
    const a = (i / 18) * Math.PI * 2;
    const rad = 0.55 + rnd() * 0.95;
    mol.userData = { a, rad, by: (rnd() - 0.5) * 1.6, phase: rnd() * 6.28 };
    h2oGroup.add(mol);
  }
  root.add(h2oGroup);

  const naGroup = new THREE.Group();
  const naGeo = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.24, 2), 0.08, 4.0, 33);
  for (let i = 0; i < 4; i++) {
    const na = new THREE.Mesh(naGeo, mats.sodiumGold);
    const a = (i / 4) * Math.PI * 2 + 0.4;
    na.position.set(Math.cos(a) * 0.48, (i % 2 === 0 ? 0.32 : -0.32), Math.sin(a) * 0.35);
    naGroup.add(na);
  }
  root.add(naGroup);

  root.userData = { h2oGroup, naGroup };
  return enableShadows(root);
}

// 7. Sculpted Anatomical Kidney Cutaway + 0.8 L/HR Valve & Overflow Stream (S09, S10, S11)
export function buildKidneyFilter3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Matte-black museum stand
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.66, 0.14, 36), mats.museumStand);
  base.position.y = -1.52;
  root.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.86, 16), mats.brass);
  pole.position.y = -1.04;
  root.add(pole);

  // Bean-shaped sculpted kidney body (upper + lower pole + indented hilum)
  const kidney = new THREE.Group();
  kidney.position.y = -0.04;
  const upper = new THREE.Mesh(sculptOrganicGeo(new THREE.SphereGeometry(0.76, 26, 20), 0.07, 3.2, 41), mats.kidneyTissue);
  upper.position.set(-0.14, 0.38, 0);
  upper.scale.set(0.92, 0.88, 0.65);
  const lower = new THREE.Mesh(sculptOrganicGeo(new THREE.SphereGeometry(0.74, 26, 20), 0.07, 3.4, 49), mats.kidneyTissue);
  lower.position.set(-0.12, -0.36, 0);
  lower.scale.set(0.90, 0.88, 0.65);
  kidney.add(upper); kidney.add(lower);

  // 5 pale fan-shaped renal pyramids on front cutaway plane
  for (let i = 0; i < 5; i++) {
    const ang = -0.88 + i * 0.44;
    const pyr = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 12), mats.arteryTissue);
    pyr.position.set(-0.22 - Math.cos(ang) * 0.32, Math.sin(ang) * 0.56, 0.38);
    pyr.rotation.z = -Math.PI / 2 + ang;
    kidney.add(pyr);
  }

  // Descending ureter tube (calm controlled 0.8 L/hr drip)
  const uCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.22, -0.05, 0.12),
    new THREE.Vector3(0.56, -0.45, 0.12),
    new THREE.Vector3(0.64, -1.28, 0.12)
  ]);
  const ureter = new THREE.Mesh(new THREE.TubeGeometry(uCurve, 20, 0.09, 12, false), mats.skullBone);
  kidney.add(ureter);
  root.add(kidney);

  // Top clear intake funnel + normal water vs violent blue overflow spill!
  const funnel = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.52, 28, 1, true), mats.glassClear);
  funnel.rotation.x = Math.PI;
  funnel.position.set(-0.12, 1.18, 0.12);
  root.add(funnel);

  const overflowGroup = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), mats.waterPure);
    drop.userData = { dir: i % 2 === 0 ? -1 : 1, phase: i / 18 };
    overflowGroup.add(drop);
  }
  overflowGroup.visible = false;
  root.add(overflowGroup);

  root.userData = { kidney, overflowGroup };
  return enableShadows(root);
}

// 8. Sculpted Crimson Y-Artery + Embedded SODIUM mmol/L Clinical Dial (S12, S14 — R09 S30 Class!)
export function buildArterySodiumGauge3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const makeBranch = (pts) => {
    const c = new THREE.CatmullRomCurve3(pts);
    return new THREE.Mesh(sculptOrganicGeo(new THREE.TubeGeometry(c, 28, 0.46, 18, false), 0.04, 4.2, 61), mats.arteryTissue);
  };
  root.add(makeBranch([new THREE.Vector3(0, -2.5, -0.12), new THREE.Vector3(0, -0.42, -0.12), new THREE.Vector3(-1.35, 2.05, -0.12)]));
  root.add(makeBranch([new THREE.Vector3(0, -2.5, -0.12), new THREE.Vector3(0, -0.42, -0.12), new THREE.Vector3(1.35, 2.05, -0.12)]));

  const gaugeGroup = new THREE.Group();
  gaugeGroup.position.set(0, -0.34, 0.48);
  gaugeGroup.add(new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.082, 16, 44), mats.brass));
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.65, 44), mats.sodiumGaugeFace);
  face.position.z = 0.02;
  gaugeGroup.add(face);

  const needle = new THREE.Group();
  needle.position.z = 0.06;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.50, 0.025), mats.mercuryRed);
  bar.position.y = 0.19;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16), mats.castIron);
  hub.rotation.x = Math.PI / 2;
  needle.add(bar); needle.add(hub);
  gaugeGroup.add(needle);
  root.add(gaugeGroup);

  // Flowing RBCs + Golden Na+ ions + Optional rushing Blue Water flood spheres
  const flowGroup = new THREE.Group();
  const rbcGeo = new THREE.TorusGeometry(0.105, 0.048, 10, 18);
  const naGeo = new THREE.SphereGeometry(0.085, 12, 10);
  for (let i = 0; i < 20; i++) {
    const isNa = i % 2 === 0;
    const m = new THREE.Mesh(isNa ? naGeo : rbcGeo, isNa ? mats.sodiumGold : mats.rbc);
    m.userData = { isNa, branch: i % 3 === 0 ? -1 : 1, offset: i / 20 };
    flowGroup.add(m);
  }
  root.add(flowGroup);

  const waterFlood = new THREE.Group();
  const wGeo = new THREE.SphereGeometry(0.12, 12, 10);
  for (let i = 0; i < 22; i++) {
    const w = new THREE.Mesh(wGeo, mats.waterPure);
    w.userData = { branch: i % 2 === 0 ? -1 : 1, offset: i / 22 };
    waterFlood.add(w);
  }
  waterFlood.visible = false;
  root.add(waterFlood);

  root.userData = { needle, flowGroup, waterFlood };
  return enableShadows(root);
}

// 9. Neural Axon Firing Cyan Electrical Sparks via Golden Na+ Channels (S13, S34)
export function buildNeuronSpark3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const soma = new THREE.Mesh(sculptOrganicGeo(new THREE.IcosahedronGeometry(0.56, 3), 0.14, 3.8, 72), mats.brainTissue);
  soma.position.set(-0.78, 0.08, 0);
  root.add(soma);

  // Dendrite branches
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const dCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.78, 0.08, 0),
      new THREE.Vector3(-1.12 + Math.cos(a) * 0.30, 0.08 + Math.sin(a) * 0.48, Math.sin(a * 2) * 0.22)
    ]);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(dCurve, 10, 0.05, 8, false), mats.brainTissue));
  }

  // Myelinated axon extending right
  const axCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.32, 0.08, 0),
    new THREE.Vector3(0.48, -0.05, 0.08),
    new THREE.Vector3(1.26, 0.04, 0)
  ]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(axCurve, 24, 0.11, 14, false), mats.skullBone));

  // Travelling cyan action-potential impulse rings + golden Na+ ions
  const sparks = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 10, 24), mats.aquaporinCyan);
    ring.rotation.y = Math.PI / 2;
    ring.userData = { offset: i / 4 };
    sparks.add(ring);
  }
  root.add(sparks);

  root.userData = { sparks, axCurve, soma };
  return enableShadows(root);
}

// 10. Glass U-Tube Osmometer with Semi-Permeable Membrane & Shifting Levels (S16)
export function buildOsmometerTube3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const stand = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.20, 1.4), mats.walnut);
  stand.position.y = -1.36;
  root.add(stand);

  // Clear U-tube glass outer shell
  const uCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.82, 1.18, 0),
    new THREE.Vector3(-0.82, -0.78, 0),
    new THREE.Vector3(0.0, -1.12, 0),
    new THREE.Vector3(0.82, -0.78, 0),
    new THREE.Vector3(0.82, 1.18, 0)
  ]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(uCurve, 44, 0.34, 22, false), mats.glassClear));

  // Central porous brass semi-permeable membrane flange
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.09, 28), mats.brass);
  flange.rotation.z = Math.PI / 2;
  flange.position.set(0, -1.10, 0);
  root.add(flange);

  // Left dilute water column (drops) & Right salty golden-emerald column (rises!)
  const leftCol = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.5, 24), mats.waterPure);
  leftCol.position.set(-0.82, 0.0, 0);
  root.add(leftCol);

  const rightCol = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.5, 24), mats.salineEmerald);
  rightCol.position.set(0.82, 0.0, 0);
  root.add(rightCol);

  // Golden Na+ salt spheres trapped on right salty side
  const saltGroup = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), mats.sodiumGold);
    s.position.set(0.82 + ((i % 3) - 1) * 0.11, -0.55 + i * 0.13, 0.12);
    saltGroup.add(s);
  }
  root.add(saltGroup);

  root.userData = { leftCol, rightCol, saltGroup };
  return enableShadows(root);
}

// 11. LIVE VERTEX-MORPHING Osmosis Cell + Aquaporin Channels (S17, S18)
export function buildOsmosisCell3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const cellGeo = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.82, 4), 0.08, 3.2, 84);
  const cellMesh = new THREE.Mesh(cellGeo, mats.cellMembrane);
  root.add(cellMesh);

  // Inner nucleus + intracellular golden salt ions
  const nucleus = new THREE.Mesh(sculptOrganicGeo(new THREE.SphereGeometry(0.32, 20, 16), 0.08, 4.0, 12), mats.kidneyTissue);
  root.add(nucleus);

  const innerSalts = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), mats.sodiumGold);
    s.position.set(Math.cos(a) * 0.48, Math.sin(a) * 0.48, (i % 2 === 0 ? 0.14 : -0.14));
    innerSalts.add(s);
  }
  root.add(innerSalts);

  // 8 Cyan Aquaporin pore rings mounted around membrane perimeter
  const pores = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const pore = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.036, 10, 20), mats.aquaporinCyan);
    pore.position.set(Math.cos(a) * 0.82, Math.sin(a) * 0.82, 0);
    pore.rotation.z = a + Math.PI / 2;
    pore.rotation.y = Math.PI / 2;
    pores.add(pore);
  }
  root.add(pores);

  // 20 Blue water droplets rushing inward through the Aquaporin channels!
  const waterInflux = new THREE.Group();
  for (let i = 0; i < 20; i++) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), mats.waterPure);
    w.userData = { ang: (i % 8) * (Math.PI / 4), offset: i / 20 };
    waterInflux.add(w);
  }
  root.add(waterInflux);

  root.userData = { cellGeo, cellMesh, pores, waterInflux, innerSalts };
  return enableShadows(root);
}

// 12. Centered Dual Pedestals — Soft Expanding Muscle vs Rigid Locked Bone Box (S19)
export function buildSoftVsSkullCompare3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  for (const x of [-0.92, 0.92]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.60, 0.14, 32), mats.museumStand);
    b.position.set(x, -1.42, 0);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.84, 16), mats.brass);
    p.position.set(x, -0.96, 0);
    root.add(b); root.add(p);
  }

  // Left: Soft pink muscle bundle freely expanding
  const softMuscle = new THREE.Mesh(
    sculptOrganicGeo(new THREE.CapsuleGeometry(0.36, 0.56, 14, 22), 0.07, 3.6, 51),
    mats.arteryTissue
  );
  softMuscle.rotation.z = Math.PI / 2;
  softMuscle.position.set(-0.92, -0.22, 0);
  root.add(softMuscle);

  // Right: Rigid ivory bone box clamping swelling pink tissue inside
  const boneCage = new THREE.Group();
  boneCage.position.set(0.92, -0.22, 0);
  const frameBars = [
    [0.92, 0.12, 0.82, 0, 0.42, 0],
    [0.92, 0.12, 0.82, 0, -0.42, 0],
    [0.12, 0.84, 0.82, -0.42, 0, 0],
    [0.12, 0.84, 0.82, 0.42, 0, 0]
  ];
  for (const [w, h, d, x, y, z] of frameBars) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.skullBone);
    m.position.set(x, y, z);
    boneCage.add(m);
  }
  const trapped = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), mats.brainEdema);
  boneCage.add(trapped);
  root.add(boneCage);

  root.userData = { softMuscle, trapped };
  return enableShadows(root);
}

// 13. HERO SHOWPIECE: Split 7mm Solid Skull Vault + Live-Swelling Gyri Brain & Herniating Brainstem (S20, S21, S24)
export function buildSkullBrain3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Outer 7mm solid ivory cranial dome cutaway (rear + top-arch shell with machined flat cross-section rim!)
  const skullGroup = new THREE.Group();
  const outerDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.36, 40, 32, Math.PI * 0.88, Math.PI * 1.24, 0.08, Math.PI * 0.76),
    mats.skullBone
  );
  const innerDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.20, 40, 32, Math.PI * 0.88, Math.PI * 1.24, 0.08, Math.PI * 0.76),
    mats.skullBone
  );
  // Thick 7mm cortical bone cross-section ring showing unyielding solid bone thickness!
  const cutRim = new THREE.Mesh(new THREE.RingGeometry(1.19, 1.36, 48, 1, 0.18, Math.PI * 1.64), mats.skullBone);
  cutRim.rotation.z = 0.08;
  cutRim.position.z = 0.02;
  skullGroup.add(outerDome); skullGroup.add(innerDome); skullGroup.add(cutRim);

  // Skull base floor with central Foramen Magnum circular opening (y = -0.92)!
  const baseRing = new THREE.Mesh(new THREE.RingGeometry(0.34, 1.16, 40), mats.skullBone);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = -0.92;
  skullGroup.add(baseRing);
  root.add(skullGroup);

  // Sculpted Gyri Left & Right Cerebral Hemispheres (with live morphGeoSwelling!)
  const brainGroup = new THREE.Group();
  const hemiGeoL = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.84, 4), 0.09, 3.8, 101);
  const hemiGeoR = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.84, 4), 0.09, 3.8, 202);
  const leftHemi = new THREE.Mesh(hemiGeoL, mats.brainTissue);
  leftHemi.scale.set(0.68, 0.96, 1.08);
  leftHemi.position.set(-0.36, 0.14, 0);
  const rightHemi = new THREE.Mesh(hemiGeoR, mats.brainTissue);
  rightHemi.scale.set(0.68, 0.96, 1.08);
  rightHemi.position.set(0.36, 0.14, 0);
  brainGroup.add(leftHemi); brainGroup.add(rightHemi);

  // Cerebellum at lower-back
  const cerebellum = new THREE.Mesh(
    sculptOrganicGeo(new THREE.SphereGeometry(0.42, 22, 16), 0.08, 6.0, 303),
    mats.brainTissue
  );
  cerebellum.scale.set(1.3, 0.72, 0.85);
  cerebellum.position.set(0, -0.58, -0.32);
  brainGroup.add(cerebellum);

  // Tapered Brainstem descending through the Foramen Magnum (extrudes downward during herniation S24!)
  const stemPts = [
    new THREE.Vector3(0, -0.36, 0),
    new THREE.Vector3(0, -0.88, 0.04),
    new THREE.Vector3(0, -1.48, 0.02)
  ];
  const brainstem = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stemPts), 20, 0.22, 16, false),
    mats.skullBone
  );
  brainGroup.add(brainstem);
  root.add(brainGroup);

  root.userData = { hemiGeoL, hemiGeoR, leftHemi, rightHemi, cerebellum, brainstem, mats };
  return enableShadows(root);
}

// 14. Heavy Brass Intracranial Pressure Manometer Dial (S22 — 10 -> 45 mmHg Spike!)
export function buildSkullPressureGauge3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 1.15, 28), mats.brass);
  pipe.position.y = -1.08;
  root.add(pipe);

  const dialGroup = new THREE.Group();
  dialGroup.position.y = 0.08;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, 0.28, 48), mats.brass);
  body.rotation.x = Math.PI / 2;
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.072, 16, 48), mats.brass);
  bezel.position.z = 0.14;
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.01, 48), mats.icpGaugeFace);
  face.position.z = 0.15;
  dialGroup.add(body); dialGroup.add(bezel); dialGroup.add(face);

  const needle = new THREE.Group();
  needle.position.z = 0.19;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.78, 0.025), mats.mercuryRed);
  bar.position.y = 0.30;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), mats.castIron);
  cap.rotation.x = Math.PI / 2;
  needle.add(bar); needle.add(cap);
  dialGroup.add(needle);
  root.add(dialGroup);

  root.userData = { needle };
  return enableShadows(root);
}

// 15. Brainstem Vital Control Switchboard — LUNGS & HEART Switched OFF (S25 — R08 S24 Homage!)
export function buildVitalSwitchboard3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.68, 2.24, 0.24), mats.museumStand);
  root.add(panel);
  const brassBorder = new THREE.Mesh(new THREE.BoxGeometry(2.80, 2.36, 0.18), mats.brass);
  brassBorder.position.z = -0.04;
  root.add(brassBorder);

  const switches = [];
  const bulbs = [];
  for (const s of [-0.66, 0.66]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.22, 0.04), mats.brass);
    plate.position.set(s, 0.96, 0.13);
    root.add(plate);

    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.04, 0.12), mats.steel);
    slot.position.set(s, -0.18, 0.12);
    root.add(slot);

    // Indicator bulb above each lever (green -> dead dark red!)
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14), bulbMat);
    bulb.position.set(s, 0.58, 0.18);
    root.add(bulb);
    bulbs.push(bulbMat);

    // Pivoting brass & crimson bakelite lever
    const pivot = new THREE.Group();
    pivot.position.set(s, -0.14, 0.18);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.62, 12), mats.brass);
    arm.position.y = 0.28;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.34, 16), mats.mercuryRed);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(0, 0.58, 0.08);
    pivot.add(arm); pivot.add(grip);
    root.add(pivot);
    switches.push(pivot);
  }

  root.userData = { switches, bulbs };
  return enableShadows(root);
}

// 16. Miniature Sunlit Asphalt Marathon Hydration Station (S26)
export function buildMarathonDiorama3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const road = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.24, 3.2), mats.asphalt);
  road.position.y = -1.16;
  root.add(road);

  // Wooden folding hydration station table + 10 paper water cups
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.12, 1.05), mats.oakLight);
  tableTop.position.set(0, -0.34, -0.12);
  root.add(tableTop);
  for (const lx of [-1.15, 1.15]) {
    for (const lz of [-0.42, 0.18]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.82, 10), mats.steel);
      leg.position.set(lx, -0.75, lz);
      root.add(leg);
    }
  }

  const cups = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const r = i < 5 ? 0 : 1;
    const c = i % 5;
    const cup = new THREE.Group();
    cup.position.set(-0.88 + c * 0.44, -0.10, r === 0 ? 0.12 : -0.28);
    cup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.085, 0.34, 18), mats.whitePlastic));
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.05, 16), mats.waterPure);
    w.position.y = 0.14;
    cup.add(w);
    cups.add(cup);
  }
  root.add(cups);

  // Orange race cone on foreground asphalt
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.62, 20), mats.mercuryRed);
  cone.position.set(-1.35, -0.74, 0.72);
  root.add(cone);
  const coneBase = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.56), mats.castIron);
  coneBase.position.set(-1.35, -1.02, 0.72);
  root.add(coneBase);

  return enableShadows(root);
}

// 17. Sweat Water + Salt Loss vs Plain Water Dilution Dual Pedestals (S27)
export function buildSweatElectrolyte3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  for (const x of [-0.92, 0.92]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.60, 0.14, 32), mats.museumStand);
    b.position.set(x, -1.42, 0);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.84, 16), mats.brass);
    p.position.set(x, -0.96, 0);
    root.add(b); root.add(p);
  }

  // Left: Glistening blue sweat droplet surrounded by escaping golden salt cubes
  const dropPts = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    const r = Math.sin(u * Math.PI) * (1 - u * 0.45) * 0.48;
    dropPts.push(new THREE.Vector2(Math.max(0.002, r), (u - 0.45) * 0.96));
  }
  const sweatDrop = new THREE.Mesh(new THREE.LatheGeometry(dropPts, 28), mats.waterPure);
  sweatDrop.position.set(-0.92, -0.18, 0);
  root.add(sweatDrop);

  const saltCubes = new THREE.Group();
  saltCubes.position.set(-0.92, -0.18, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), mats.sodiumGold);
    cube.position.set(Math.cos(a) * 0.56, Math.sin(a) * 0.46, 0.18);
    cube.rotation.set(i, i * 0.7, 0);
    saltCubes.add(cube);
  }
  root.add(saltCubes);

  // Right: Large plain water pitcher with ZERO golden salt ions
  const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.04, 28), mats.glassClear);
  jug.position.set(0.92, -0.14, 0);
  const jugFill = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.43, 0.86, 24), mats.waterPure);
  jugFill.position.set(0.92, -0.18, 0);
  root.add(jug); root.add(jugFill);

  root.userData = { saltCubes, sweatDrop };
  return enableShadows(root);
}

// 18. Infant Feeding Bottle Warning < 6 Months (S28)
export function buildBabyBottleWarning3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.58, 1.56, 36), mats.glassClear);
  body.position.y = -0.26;
  root.add(body);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.53, 1.15, 32), mats.waterPure);
  water.position.y = -0.42;
  root.add(water);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.60, 0.24, 32), mats.whitePlastic);
  collar.position.y = 0.62;
  root.add(collar);

  const nipple = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 0.32, 12, 20),
    new THREE.MeshPhysicalMaterial({ color: 0xf6c97a, roughness: 0.28, clearcoat: 0.6, transparent: true, opacity: 0.85 })
  );
  nipple.position.y = 0.92;
  root.add(nipple);

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.595, 0.595, 0.76, 36, 1, true, -0.95, 1.9),
    mats.babyLabelMat
  );
  label.position.y = -0.28;
  root.add(label);

  return enableShadows(root);
}

// 19. Hospital ICU 3% Hypertonic Saline IV Bag Rescue (S29)
export function buildSalineIVRescue3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Chrome IV stand pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.6, 16), mats.steel);
  pole.position.set(-0.98, 0.0, -0.2);
  root.add(pole);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.032, 10, 24, Math.PI), mats.steel);
  hook.position.set(-0.50, 1.52, -0.2);
  root.add(hook);

  // Translucent IV fluid pouch + 3% SALINE label
  const bagGroup = new THREE.Group();
  bagGroup.position.set(0.0, 0.46, 0);
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.54, 0.34), mats.glassClear);
  const fluid = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.18, 0.26), mats.salineEmerald);
  fluid.position.y = -0.10;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.52), mats.salineLabelMat);
  label.position.set(0, 0.08, 0.18);
  bagGroup.add(pouch); bagGroup.add(fluid); bagGroup.add(label);
  root.add(bagGroup);

  // Drip chamber + falling concentrated golden-emerald saline drops
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.52, 20), mats.glassClear);
  chamber.position.set(0, -0.62, 0);
  root.add(chamber);

  const dripDrops = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), mats.sodiumGold);
    d.userData = { offset: i / 4 };
    dripDrops.add(d);
  }
  root.add(dripDrops);

  const lineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.88, 0),
    new THREE.Vector3(0.18, -1.35, 0.12),
    new THREE.Vector3(0.68, -1.68, 0.22)
  ]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(lineCurve, 18, 0.035, 10, false), mats.salineEmerald));

  root.userData = { dripDrops, bagGroup };
  return enableShadows(root);
}

// 20. Graduated Borosilicate 1000mL Cylinder Filling to 800mL Safe Ceiling (S31)
export function buildMeasuringCylinder3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.86, 0.16, 6), mats.brass);
  base.position.y = -1.42;
  root.add(base);

  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 2.68, 36, 1, true), mats.glassClear);
  cyl.position.y = -0.02;
  root.add(cyl);

  // Graduation rings + glowing emerald 800 mL safe ceiling ring
  for (let i = 1; i <= 5; i++) {
    const y = -1.24 + i * 0.44;
    const is800 = i === 4;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.53, is800 ? 0.028 : 0.012, 8, 36),
      is800 ? mats.salineEmerald : mats.whitePlastic
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    root.add(ring);
  }

  const waterFill = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 2.2, 32), mats.waterPure);
  waterFill.position.y = -0.22;
  root.add(waterFill);

  root.userData = { waterFill };
  return enableShadows(root);
}

// 21. Effervescent Electrolyte / ORS Tablet Fizzing in Crystal Glass (S32)
export function buildElectrolyteFizzGlass3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.64, 1.88, 36, 1, true), mats.glassClear);
  glass.position.y = -0.18;
  root.add(glass);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.16, 36), mats.glassClear);
  bottom.position.y = -1.08;
  root.add(bottom);

  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.60, 1.42, 32), mats.waterPure);
  liquid.position.y = -0.32;
  root.add(liquid);

  // Plunging golden-orange ORS effervescent disc
  const tablet = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 28), mats.sodiumGold);
  tablet.rotation.x = 0.45;
  root.add(tablet);

  const fizz = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    const isGold = i % 2 === 0;
    const b = new THREE.Mesh(
      new THREE.SphereGeometry(0.052 + (i % 3) * 0.02, 10, 8),
      isGold ? mats.sodiumGold : mats.aquaporinCyan
    );
    b.userData = { bx: ((i * 31) % 13 - 6) * 0.085, bz: ((i * 19) % 11 - 5) * 0.08, phase: i * 0.42 };
    fizz.add(b);
  }
  root.add(fizz);

  root.userData = { tablet, fizz };
  return enableShadows(root);
}

// 22. Walnut Laboratory Rack with 5 Clinical Hydration Spectrum Test Tubes + Paracelsus Scale (S33, S35, S36)
export function buildUrineChartRack3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Walnut test-tube rack
  const botPlank = new THREE.Mesh(new THREE.BoxGeometry(2.88, 0.16, 0.78), mats.walnut);
  botPlank.position.y = -1.08;
  const topPlank = new THREE.Mesh(new THREE.BoxGeometry(2.88, 0.12, 0.78), mats.walnut);
  topPlank.position.y = 0.22;
  root.add(botPlank); root.add(topPlank);
  for (const sx of [-1.34, 1.34]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.32, 14), mats.brass);
    post.position.set(sx, -0.43, 0);
    root.add(post);
  }

  // 5 Hydration Spectrum colors: [0] Water-clear (Overhydrated!), [1-2] Pale Straw (Ideal!), [3-4] Dark Amber (Dehydrated)
  const tubeHexes = [0xdcf4ff, 0xf7eb9c, 0xf2d56b, 0xd9871e, 0x8f3908];
  const tubes = [];
  for (let i = 0; i < 5; i++) {
    const x = -1.0 + i * 0.50;
    const tg = new THREE.Group();
    tg.position.set(x, -0.18, 0);

    const glass = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.38, 12, 22), mats.glassClear);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 8, 22), mats.glassClear);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.72;

    const liqMat = new THREE.MeshPhysicalMaterial({
      color: tubeHexes[i], roughness: 0.10, clearcoat: 0.95, transparent: true, opacity: i === 0 ? 0.36 : 0.84
    });
    const liq = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.96, 10, 18), liqMat);
    liq.position.y = -0.16;

    tg.add(glass); tg.add(rim); tg.add(liq);
    tubes.push(tg);
    root.add(tg);
  }

  root.userData = { tubes };
  return enableShadows(root);
}

export function buildParacelsusScale3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 0.18, 36), mats.walnut);
  base.position.y = -1.36;
  root.add(base);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.09, 2.25, 20), mats.brass);
  pillar.position.y = -0.20;
  root.add(pillar);

  const beamGroup = new THREE.Group();
  beamGroup.position.y = 0.88;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.28, 16), mats.brass);
  beam.rotation.z = Math.PI / 2;
  beamGroup.add(beam);

  for (const s of [-1, 1]) {
    const panGroup = new THREE.Group();
    panGroup.position.set(s * 1.06, 0, 0);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.96, 8), mats.brass);
    rod.position.y = -0.48;
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 14, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), mats.brass);
    dish.position.y = -0.64;
    panGroup.add(rod); panGroup.add(dish);

    if (s === -1) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), mats.waterPure);
      drop.position.y = -0.78;
      panGroup.add(drop);
    } else {
      const salt = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), mats.sodiumGold);
      salt.position.y = -0.78;
      panGroup.add(salt);
    }
    beamGroup.add(panGroup);
  }
  root.add(beamGroup);

  root.userData = { beamGroup };
  return enableShadows(root);
}
