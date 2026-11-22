// Modular Pure-Code Organic Sculptural 3D Diorama Factory (v13.2 — Exact @meanwhilemayank Era-2 Visual Parity)
// Features: Smooth Lathed Basmati Rice Grains (InstancedMesh), Crisp Procedural Instrument Dials,
// Anatomical J-Stomach Cutaway, Stocked Refrigerator Diorama, Moonlit Kitchen Interior & FBM Sculpted Organs.
import * as THREE from '../vendor/three.module.js';
import { getMaterials3D } from './materials3d.js';
import { mulberry32 } from './dossier.js';

function enableShadows(group) {
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return group;
}

// Smooth 3D deterministic organic FBM vertex displacement (NO blocky primitives!)
export function sculptOrganicGeo(geo, amp = 0.08, freq = 2.4, seed = 11) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n1 = Math.sin(x * freq + seed) * Math.cos(y * freq * 1.15 - seed * 0.7) * Math.sin(z * freq * 0.9 + seed * 1.3);
    const n2 = Math.sin(x * freq * 2.3 - y * freq * 1.9 + seed * 2.1) * 0.45;
    const d = 1 + (n1 + n2) * amp;
    pos.setXYZ(i, x * d, y * d, z * d);
  }
  geo.computeVertexNormals();
  return geo;
}

// High-resolution smooth elongated Basmati rice grain geometry (ZERO angular origami facets!)
let _sharedBasmatiGeo = null;
function getBasmatiGrainGeo() {
  if (_sharedBasmatiGeo) return _sharedBasmatiGeo;
  const pts = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps; // 0..1 along length
    const y = (u - 0.5) * 0.68;
    // Smooth tapered pearlescent Basmati silhouette (plump middle, gently pointed ends)
    const r = Math.pow(Math.sin(u * Math.PI), 0.72) * 0.145;
    pts.push(new THREE.Vector2(Math.max(0.002, r), y));
  }
  const g = new THREE.LatheGeometry(pts, 18);
  // Subtle natural grain curve along X
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const bend = (1 - (y / 0.34) * (y / 0.34)) * 0.025;
    pos.setX(i, pos.getX(i) + bend);
  }
  g.computeVertexNormals();
  _sharedBasmatiGeo = g;
  return g;
}

// Reusable InstancedMesh pile of sculpted Basmati grains
function createRicePileInstanced(count, radiusX, radiusZ, height, yBase, mat, seed = 42, scaleMult = 0.42) {
  const geo = getBasmatiGrainGeo();
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const rad = Math.sqrt(rnd());
    const x = Math.cos(a) * rad * radiusX;
    const z = Math.sin(a) * rad * radiusZ;
    const domeY = yBase + Math.cos(rad * Math.PI * 0.5) * height + (rnd() - 0.5) * 0.04;
    dummy.position.set(x, domeY, z);
    dummy.rotation.set(
      Math.PI / 2 + (rnd() - 0.5) * 0.7,
      rnd() * Math.PI * 2,
      (rnd() - 0.5) * 0.8
    );
    const sc = scaleMult * (0.85 + rnd() * 0.3);
    dummy.scale.set(sc, sc * 1.15, sc);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = true;
  inst.receiveShadow = true;
  return inst;
}

function createBowlMesh(mats, radius = 1.25) {
  const pts = [
    new THREE.Vector2(0.0, -0.78),
    new THREE.Vector2(radius * 0.46, -0.78),
    new THREE.Vector2(radius * 0.50, -0.66),
    new THREE.Vector2(radius * 0.86, -0.34),
    new THREE.Vector2(radius, 0.14),
    new THREE.Vector2(radius * 0.94, 0.18),
    new THREE.Vector2(radius * 0.82, -0.26),
    new THREE.Vector2(radius * 0.42, -0.60),
    new THREE.Vector2(0.0, -0.60)
  ];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 44), mats.ceramicBlue);
  // Subtle brass ceramic rim accent
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.97, 0.022, 10, 44), mats.brass);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.16;
  bowl.add(rim);
  return bowl;
}

// 1. Atmospheric Moonlit Kitchen Counter & Steaming Rice Bowl Diorama (S01, S14, S29, S33)
export function buildKitchenCounterDiorama3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Rich dark walnut kitchen countertop
  const counter = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.36, 4.2), mats.walnut);
  counter.position.set(0, -1.55, 0.0);
  root.add(counter);

  // Deep midnight glazed subway-tile kitchen backsplash (high contrast behind white headline!)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(9.0, 7.6, 0.25), mats.kitchenTile);
  wall.position.set(0, 1.9, -2.0);
  root.add(wall);

  // Moonlit kitchen window inset on left-back wall (exact @meanwhilemayank R09 S1 environmental depth!)
  const winGroup = new THREE.Group();
  winGroup.position.set(-1.35, 1.05, -1.84);
  const nightSky = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 2.15),
    new THREE.MeshBasicMaterial({ color: 0x0c1b3a })
  );
  winGroup.add(nightSky);
  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff0c4 })
  );
  moon.position.set(0.35, 0.52, 0.02);
  winGroup.add(moon);
  // Window wooden mullions
  const frameBar = (w, h, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), mats.walnut);
    m.position.set(x, y, 0.05);
    winGroup.add(m);
  };
  frameBar(1.9, 0.12, 0, 1.08); frameBar(1.9, 0.12, 0, -1.08);
  frameBar(0.12, 2.25, -0.9, 0); frameBar(0.12, 2.25, 0.9, 0);
  frameBar(0.08, 2.15, 0, 0); frameBar(1.75, 0.08, 0, 0.05);
  root.add(winGroup);

  // Brass hanging pendant lamp casting warm golden pool onto the rice bowl
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.7, 8), mats.castIron);
  cord.position.set(0.25, 2.75, -0.2);
  root.add(cord);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.62, 0.42, 28, 1, true),
    mats.brass
  );
  shade.position.set(0.25, 1.85, -0.2);
  root.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe49e })
  );
  bulb.position.set(0.25, 1.70, -0.2);
  root.add(bulb);
  const lampLight = new THREE.PointLight(0xffbe5c, 22, 8, 1.8);
  lampLight.position.set(0.25, 1.45, -0.1);
  root.add(lampLight);

  // Ceramic stoneware bowl + sculpted dome + 165 distinct instanced Basmati rice grains!
  const bowlGroup = new THREE.Group();
  bowlGroup.position.set(0, -0.58, 0.25);
  bowlGroup.add(createBowlMesh(mats, 1.18));

  const riceCore = new THREE.Mesh(
    sculptOrganicGeo(new THREE.SphereGeometry(0.96, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), 0.03, 3.2, 7),
    mats.riceGrain
  );
  riceCore.position.y = -0.02;
  riceCore.scale.set(1.0, 0.62, 1.0);
  bowlGroup.add(riceCore);

  // Coat top dome with 165 sculpted individual Basmati rice grains
  const grainsPile = createRicePileInstanced(165, 0.94, 0.94, 0.56, 0.04, mats.riceGrain, 404, 0.44);
  bowlGroup.add(grainsPile);

  // Pair of polished walnut chopsticks resting naturally across the rim
  for (let i = 0; i < 2; i++) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.036, 2.35, 10), mats.oakLight);
    stick.rotation.z = Math.PI / 2 - 0.14 + i * 0.07;
    stick.rotation.y = 0.22 + i * 0.12;
    stick.position.set(0.22, 0.24 + i * 0.02, 0.52 + i * 0.14);
    bowlGroup.add(stick);
  }
  root.add(bowlGroup);

  // Soft rising steam wisps
  const steamGroup = new THREE.Group();
  const steamMat = new THREE.MeshBasicMaterial({ color: 0xfff8eb, transparent: true, opacity: 0.18, depthWrite: false });
  for (let i = 0; i < 9; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.16 + (i % 3) * 0.06, 12, 10), steamMat);
    puff.userData = { phase: i * 0.72, bx: (i % 3 - 1) * 0.34, bz: ((i * 19) % 5 - 2) * 0.14 };
    steamGroup.add(puff);
  }
  root.add(steamGroup);

  // Crisp numbered wall clock on right kitchen backsplash
  const clockGroup = new THREE.Group();
  clockGroup.position.set(1.32, 1.02, -1.82);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.055, 12, 32), mats.brass);
  clockGroup.add(rim);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.54, 32), mats.alarmDialFace);
  face.position.z = 0.02;
  clockGroup.add(face);
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.28, 0.02), mats.castIron);
  hourHand.position.set(0, 0.12, 0.05);
  const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.40, 0.02), mats.mercuryRed);
  minHand.position.set(0, 0.18, 0.06);
  const handPivot = new THREE.Group();
  handPivot.add(hourHand);
  handPivot.add(minHand);
  clockGroup.add(handPivot);
  root.add(clockGroup);

  root.userData = { steamGroup, handPivot, bowlGroup, lampLight };
  return enableShadows(root);
}

// 2. Cast-Iron Wok on Gas Burner with Blue-Orange Flames & Tossing Fried Rice (S02, S07)
export function buildWokReheat3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Matte-black cast-iron gas burner ring & 4 grate prongs underneath
  const stoveTop = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.75, 0.16, 40), mats.museumStand);
  stoveTop.position.y = -1.32;
  root.add(stoveTop);
  const burnerRing = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.075, 12, 32), mats.castIron);
  burnerRing.rotation.x = Math.PI / 2;
  burnerRing.position.y = -1.16;
  root.add(burnerRing);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const prong = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.08), mats.castIron);
    prong.position.set(Math.cos(a) * 1.05, -1.04, Math.sin(a) * 1.05);
    prong.rotation.y = -a;
    root.add(prong);
  }

  // Hammered cast-iron wok body
  const wokPts = [
    new THREE.Vector2(0.0, -0.84),
    new THREE.Vector2(0.54, -0.82),
    new THREE.Vector2(1.12, -0.44),
    new THREE.Vector2(1.48, 0.18),
    new THREE.Vector2(1.41, 0.21),
    new THREE.Vector2(1.04, -0.38),
    new THREE.Vector2(0.48, -0.74),
    new THREE.Vector2(0.0, -0.74)
  ];
  const wok = new THREE.Mesh(new THREE.LatheGeometry(wokPts, 44), mats.castIron);
  wok.position.y = -0.08;
  root.add(wok);

  // Turned wooden wok handle angled cleanly right
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.105, 1.25, 16), mats.walnut);
  handle.rotation.z = -1.18;
  handle.position.set(1.88, 0.36, 0);
  root.add(handle);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.18, 16), mats.brass);
  collar.rotation.z = -1.18;
  collar.position.set(1.42, 0.17, 0);
  root.add(collar);

  // Base mound of toasted fried rice inside the wok
  const bed = createRicePileInstanced(110, 1.02, 1.02, 0.28, -0.42, mats.riceToasted, 707, 0.42);
  root.add(bed);

  // Tossing golden Basmati grains + green scallion slivers arcing gracefully upward
  const tossGroup = new THREE.Group();
  const rnd = mulberry32(2026);
  const grainGeo = getBasmatiGrainGeo();
  const scallionGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.06, 10);
  for (let i = 0; i < 42; i++) {
    const isScallion = i % 6 === 0;
    const g = new THREE.Mesh(isScallion ? scallionGeo : grainGeo, isScallion ? mats.paddyGreen : (i % 2 === 0 ? mats.riceGrain : mats.riceToasted));
    if (!isScallion) g.scale.set(0.48, 0.56, 0.48);
    g.userData = {
      bx: (rnd() - 0.5) * 1.45,
      bz: (rnd() - 0.5) * 0.95,
      hMax: 0.55 + rnd() * 0.85,
      phase: rnd() * Math.PI * 2,
      spin: 1.5 + rnd() * 3.0
    };
    tossGroup.add(g);
  }
  root.add(tossGroup);

  // Layered glowing cyan-blue gas flame ring + warm amber flame tips
  const flameGroup = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const fBlue = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.36, 10), mats.flameBlue);
    fBlue.position.set(Math.cos(a) * 0.82, -0.96, Math.sin(a) * 0.82);
    fBlue.rotation.z = -Math.cos(a) * 0.28;
    fBlue.rotation.x = Math.sin(a) * 0.28;
    flameGroup.add(fBlue);
    if (i % 2 === 0) {
      const fTip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 8), mats.flameAmber);
      fTip.position.set(Math.cos(a) * 0.86, -0.84, Math.sin(a) * 0.86);
      flameGroup.add(fTip);
    }
  }
  const stoveGlow = new THREE.PointLight(0x38bdf8, 18, 6, 1.8);
  stoveGlow.position.set(0, -0.85, 0.6);
  flameGroup.add(stoveGlow);
  root.add(flameGroup);

  root.userData = { tossGroup, flameGroup };
  return enableShadows(root);
}

// 3. Brussels Bedroom Nightstand, Numbered Vintage Alarm Clock & Water Glass (S03, S04)
export function buildBedroomNightstand3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Moody striped bedroom wall backdrop
  const wall = new THREE.Mesh(new THREE.BoxGeometry(8.5, 7.5, 0.2), mats.wallpaperDark);
  wall.position.set(0, 1.6, -2.0);
  root.add(wall);

  // Beveled dark walnut nightstand top
  const table = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.26, 2.8), mats.walnut);
  table.position.set(0, -1.25, 0);
  root.add(table);

  // Vintage double-bell brass alarm clock (scaled cleanly so it NEVER clips edges!)
  const clockGroup = new THREE.Group();
  clockGroup.position.set(-0.22, -0.26, 0.15);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.34, 42), mats.brass);
  body.rotation.x = Math.PI / 2;
  clockGroup.add(body);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.055, 14, 42), mats.brass);
  bezel.position.z = 0.17;
  clockGroup.add(bezel);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.71, 42), mats.alarmDialFace);
  dial.position.z = 0.18;
  clockGroup.add(dial);

  // Twin brass bells + hammer + feet
  for (const s of [-1, 1]) {
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), mats.brass);
    bell.position.set(s * 0.52, 0.72, 0);
    bell.rotation.z = -s * 0.52;
    clockGroup.add(bell);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), mats.brass);
    foot.position.set(s * 0.46, -0.78, 0.04);
    clockGroup.add(foot);
  }
  const hammer = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.30, 8), mats.steel);
  hammer.position.set(0, 0.82, 0);
  clockGroup.add(hammer);
  const hammerHead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mats.brass);
  hammerHead.position.set(0, 0.96, 0);
  clockGroup.add(hammerHead);

  const handGroup = new THREE.Group();
  handGroup.position.z = 0.21;
  const hHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.02), mats.castIron);
  hHand.position.y = 0.14;
  const mHand = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.52, 0.02), mats.mercuryRed);
  mHand.position.y = 0.22;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), mats.brass);
  cap.rotation.x = Math.PI / 2;
  handGroup.add(hHand); handGroup.add(mHand); handGroup.add(cap);
  clockGroup.add(handGroup);
  root.add(clockGroup);

  // Clear glass tumbler of water beside clock
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.25, 0.76, 28, 1, true), mats.glassClear);
  glass.position.set(1.05, -0.72, 0.32);
  root.add(glass);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.23, 0.46, 24),
    new THREE.MeshPhysicalMaterial({ color: 0xb8e6ff, roughness: 0.06, clearcoat: 1.0, transparent: true, opacity: 0.48 })
  );
  water.position.set(1.05, -0.84, 0.32);
  root.add(water);

  // Warm brass bedside lamp glowing softly on right-back
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.52, 20), mats.brass);
  lampBase.position.set(1.35, -0.86, -0.75);
  root.add(lampBase);
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.30, 0.52, 0.62, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe0a3 })
  );
  lampShade.position.set(1.35, -0.28, -0.75);
  root.add(lampShade);
  const lampGlow = new THREE.PointLight(0xffb44c, 20, 7, 1.8);
  lampGlow.position.set(1.2, -0.15, -0.5);
  root.add(lampGlow);

  root.userData = { handGroup, clockGroup };
  return enableShadows(root);
}

// 4. Amber Toxicology Bottle with High-Res Label (S05 — exact R10 S28 style!)
export function buildClinicalBottle3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const pts = [
    new THREE.Vector2(0.0, -1.20),
    new THREE.Vector2(0.76, -1.20),
    new THREE.Vector2(0.82, -1.06),
    new THREE.Vector2(0.82, 0.36),
    new THREE.Vector2(0.60, 0.72),
    new THREE.Vector2(0.32, 0.88),
    new THREE.Vector2(0.32, 1.24),
    new THREE.Vector2(0.38, 1.30),
    new THREE.Vector2(0.38, 1.38),
    new THREE.Vector2(0.26, 1.38)
  ];
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(pts, 44), mats.amberGlass);
  root.add(bottle);

  // Dark amber fluid meniscus inside
  const fluid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.74, 0.74, 1.15, 36),
    new THREE.MeshPhysicalMaterial({ color: 0x7c2d08, roughness: 0.14, clearcoat: 0.9, transparent: true, opacity: 0.84 })
  );
  fluid.position.y = -0.54;
  root.add(fluid);

  // Textured cork/rubber medical stopper + aluminum crimp ring
  const stopper = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.27, 0.30, 28), mats.oakLight);
  stopper.position.y = 1.48;
  root.add(stopper);
  const crimp = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.14, 28), mats.steel);
  crimp.position.y = 1.34;
  root.add(crimp);

  // Curved toxicology label wrapping cleanly around front of bottle
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.845, 0.845, 0.88, 36, 1, true, -0.95, 1.9),
    mats.bottleLabelMat
  );
  label.position.y = -0.36;
  root.add(label);

  return enableShadows(root);
}

// 5. Macro Smooth Pearlescent Basmati Rice Grain Cluster + Golden Endospores (S06, S17, S18)
export function buildRiceGrainMacro3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();
  const rnd = mulberry32(609);

  const grainGeo = getBasmatiGrainGeo();
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(grainGeo, i % 3 === 0 ? mats.riceToasted : mats.riceGrain);
    const a = (i / 12) * Math.PI * 2;
    const rad = i < 3 ? 0.34 : 0.78 + rnd() * 0.28;
    m.position.set(Math.cos(a) * rad, (rnd() - 0.5) * 0.75, Math.sin(a) * rad * 0.65);
    m.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    const sc = 1.45 + rnd() * 0.35;
    m.scale.set(sc, sc * 1.12, sc);
    root.add(m);
  }

  // Sculpted armored golden endospores nestled gently on the grain surfaces
  const sporeGroup = new THREE.Group();
  const sporeGeo = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.15, 2), 0.14, 5.2, 19);
  for (let i = 0; i < 10; i++) {
    const sp = new THREE.Mesh(sporeGeo, mats.sporeArmor);
    const a = (i / 10) * Math.PI * 2 + 0.3;
    sp.position.set(Math.cos(a) * 0.78, (rnd() - 0.5) * 0.68, 0.44 + (rnd() - 0.5) * 0.35);
    sp.userData = { baseScale: 0.72 + rnd() * 0.45, phase: i * 0.65 };
    sporeGroup.add(sp);
  }
  root.add(sporeGroup);
  root.userData = { sporeGroup };
  return enableShadows(root);
}

// 6. Sculpted Emerald Bacillus cereus Colony with Delicate Translucent Flagella (S08, S16)
export function buildBacillusColony3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();
  const rodGeo = sculptOrganicGeo(new THREE.CapsuleGeometry(0.24, 0.76, 12, 20), 0.04, 3.6, 55);

  const rods = [];
  for (let i = 0; i < 14; i++) {
    const cell = new THREE.Group();
    const body = new THREE.Mesh(rodGeo, mats.bacillusGreen);
    cell.add(body);

    // Delicate waving translucent hair-like flagella (radius 0.018 — NOT stiff thick pipes!)
    for (let f = 0; f < 3; f++) {
      const side = f === 0 ? -1 : (f === 1 ? 1 : 0);
      const pts = [];
      for (let k = 0; k < 7; k++) {
        const u = k / 6;
        pts.push(new THREE.Vector3(
          side * 0.18 + Math.sin(u * Math.PI * 2.5 + f * 1.9) * 0.16,
          -0.46 - u * 0.72,
          Math.cos(u * Math.PI * 2.0 + f) * 0.12
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const flag = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.017, 6, false), mats.flagellaMat);
      cell.add(flag);
    }

    const row = Math.floor(i / 4) - 1.5;
    const col = (i % 4) - 1.5;
    cell.position.set(col * 0.82, row * 0.74, ((i * 29) % 5 - 2) * 0.24);
    cell.rotation.set(((i * 13) % 7 - 3) * 0.18, ((i * 17) % 7 - 3) * 0.22, ((i * 23) % 7 - 3) * 0.26);
    cell.scale.setScalar(0.84);
    cell.userData = { idx: i, basePos: cell.position.clone() };
    rods.push(cell);
    root.add(cell);
  }

  root.userData = { rods };
  return enableShadows(root);
}

// 7. Paddy Field Soil & Lowered Rice Stalk Cutaway (S09 — stalks stay cleanly below y=340 headline!)
export function buildPaddyFieldCutaway3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const soilSlab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.45, 1.85), mats.soil);
  soilSlab.position.set(0, -0.96, 0);
  root.add(soilSlab);

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(3.42, 0.16, 1.87),
    new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.06, clearcoat: 1.0, transparent: true, opacity: 0.44 })
  );
  water.position.set(0, -0.16, 0);
  root.add(water);

  // Graceful green paddy stalks with drooping golden rice panicles (height capped so ZERO headline clash!)
  const stalks = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const x = -1.25 + i * 0.36;
    const z = ((i % 3) - 1) * 0.34;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, -0.22, z),
      new THREE.Vector3(x + 0.06, 0.42, z),
      new THREE.Vector3(x + 0.24, 0.92, z + 0.05)
    ]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.042, 8, false), mats.paddyGreen);
    stalks.add(stem);

    // Drooping golden paddy panicle grain clusters
    for (let g = 0; g < 6; g++) {
      const grain = new THREE.Mesh(getBasmatiGrainGeo(), mats.riceToasted);
      grain.scale.set(0.28, 0.34, 0.28);
      grain.position.set(x + 0.20 + g * 0.04, 0.90 - g * 0.04, z + 0.05 + (g % 2 === 0 ? 0.04 : -0.04));
      grain.rotation.z = -0.6 - g * 0.12;
      stalks.add(grain);
    }
  }
  root.add(stalks);

  // Dormant golden endospores glowing softly inside the cross-section earth
  const sporeGeo = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.14, 2), 0.14, 4.8, 31);
  for (let i = 0; i < 9; i++) {
    const sp = new THREE.Mesh(sporeGeo, mats.sporeArmor);
    sp.position.set(-1.15 + (i % 4) * 0.76, -0.68 - Math.floor(i / 4) * 0.38, 0.96);
    root.add(sp);
  }

  root.userData = { stalks };
  return enableShadows(root);
}

// 8. Clear Apothecary Glass Jar Filled with 240 Real Instanced Raw Basmati Grains (S10)
export function buildRawRiceJar3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Clear cylindrical glass jar
  const jarPts = [
    new THREE.Vector2(0.0, -1.25),
    new THREE.Vector2(0.96, -1.25),
    new THREE.Vector2(1.04, -1.12),
    new THREE.Vector2(1.04, 0.68),
    new THREE.Vector2(0.84, 0.98),
    new THREE.Vector2(0.84, 1.18),
    new THREE.Vector2(0.90, 1.24)
  ];
  const jar = new THREE.Mesh(new THREE.LatheGeometry(jarPts, 40), mats.glassClear);
  root.add(jar);

  // Inner cream rice mass + 240 individual visible grains clinging around the glass perimeter!
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 1.62, 28), mats.riceGrain);
  core.position.y = -0.34;
  root.add(core);

  const grainGeo = getBasmatiGrainGeo();
  const inst = new THREE.InstancedMesh(grainGeo, mats.riceGrain, 240);
  const dummy = new THREE.Object3D();
  const rnd = mulberry32(1010);
  for (let i = 0; i < 240; i++) {
    const a = rnd() * Math.PI * 2;
    const isTop = i < 65;
    const r = isTop ? Math.sqrt(rnd()) * 0.88 : 0.86 + rnd() * 0.08;
    const y = isTop ? (0.48 + (rnd() - 0.5) * 0.08) : (-1.12 + rnd() * 1.60);
    dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    dummy.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    const sc = 0.38 + rnd() * 0.14;
    dummy.scale.set(sc, sc * 1.18, sc);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  root.add(inst);

  // Hidden microscopic golden spores nestled visibly among the raw rice grains
  const spGeo = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.085, 2), 0.14, 5.2, 88);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 1.4 - 0.7;
    const sp = new THREE.Mesh(spGeo, mats.sporeArmor);
    sp.position.set(Math.sin(a) * 0.94, -0.82 + (i % 5) * 0.30, Math.cos(a) * 0.94);
    root.add(sp);
  }

  // Polished wooden cork lid + brass wire bail clasp
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.84, 0.28, 32), mats.oakLight);
  lid.position.y = 1.28;
  root.add(lid);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.03, 10, 36), mats.brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.06;
  root.add(ring);

  return enableShadows(root);
}

// 9. Armored Endospore Shell Cutaway (S11, S13)
export function buildEndosporeCutaway3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const leftGeo = sculptOrganicGeo(new THREE.IcosahedronGeometry(1.12, 3), 0.13, 4.2, 77);
  const leftShell = new THREE.Mesh(leftGeo, mats.sporeArmor);
  leftShell.scale.set(0.88, 1.04, 0.88);
  root.add(leftShell);

  const rightShell = new THREE.Mesh(
    sculptOrganicGeo(new THREE.SphereGeometry(1.06, 26, 22, -Math.PI * 0.5, Math.PI), 0.10, 4.0, 99),
    mats.sporeArmor
  );
  root.add(rightShell);

  const emergingRod = new THREE.Mesh(
    sculptOrganicGeo(new THREE.CapsuleGeometry(0.32, 0.86, 12, 18), 0.04, 3.8, 12),
    mats.bacillusGreen
  );
  emergingRod.rotation.z = -0.35;
  emergingRod.scale.setScalar(0.01);
  root.add(emergingRod);

  const coreGlow = new THREE.PointLight(0xffbe3b, 14, 6, 1.8);
  root.add(coreGlow);

  root.userData = { leftShell, rightShell, emergingRod };
  return enableShadows(root);
}

// 10. Boiling Steel Stockpot with Blue Gas Ring, Rising Bubbles & Surviving Golden Spores (S12)
export function buildBoilingPot3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Blue gas burner ring below pot (exact R08 S9 reference visual!)
  const burner = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.06, 10, 32), mats.castIron);
  burner.rotation.x = Math.PI / 2;
  burner.position.y = -1.24;
  root.add(burner);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.30, 8), mats.flameBlue);
    fl.position.set(Math.cos(a) * 0.84, -1.06, Math.sin(a) * 0.84);
    root.add(fl);
  }

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.18, 1.48, 44), mats.steel);
  pot.position.y = -0.24;
  root.add(pot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.048, 12, 44), mats.steel);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.50;
  root.add(rim);

  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.042, 10, 20, Math.PI), mats.steel);
    h.position.set(s * 1.24, 0.16, 0);
    h.rotation.z = s * -Math.PI / 2;
    root.add(h);
  }

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1.18, 36),
    new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.08, clearcoat: 1.0, transparent: true, opacity: 0.72 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.44;
  root.add(water);

  const bubbleGroup = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (i % 3) * 0.04, 12, 10), mats.glassClear);
    b.userData = { bx: ((i * 37) % 15 - 7) * 0.13, bz: ((i * 23) % 13 - 6) * 0.12, phase: i * 0.48 };
    bubbleGroup.add(b);
  }
  root.add(bubbleGroup);

  const spores = new THREE.Group();
  const sGeo = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.18, 2), 0.14, 4.8, 44);
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Mesh(sGeo, mats.sporeArmor);
    sp.position.set((i - 1) * 0.58, 0.92 + (i === 1 ? 0.22 : 0), 0.15);
    spores.add(sp);
  }
  root.add(spores);

  root.userData = { bubbleGroup, spores };
  return enableShadows(root);
}

// 11. Oak-Mounted Brass Laboratory Thermometer with Real 0°C-100°C Scale & Danger Zone (S15, S32)
export function buildThermometer3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Warm beveled oak wooden backplate (R09 S7 tactile physical wall thermometer!)
  const wood = new THREE.Mesh(new THREE.BoxGeometry(1.18, 3.45, 0.16), mats.oakLight);
  root.add(wood);
  const brassTrim = new THREE.Mesh(new THREE.BoxGeometry(1.24, 3.51, 0.12), mats.brass);
  brassTrim.position.z = -0.02;
  root.add(brassTrim);

  // High-res painted Celsius scale plate
  const scalePlate = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 3.16), mats.thermoScaleMat);
  scalePlate.position.z = 0.086;
  root.add(scalePlate);

  // Outer clear glass bore tube
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 2.38, 20), mats.glassClear);
  tube.position.set(0, 0.14, 0.15);
  root.add(tube);

  // Ruby-red mercury reservoir bulb + animated column
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), mats.mercuryRed);
  bulb.position.set(0, -1.12, 0.16);
  root.add(bulb);

  const mercuryCol = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 2.25, 16), mats.mercuryRed);
  mercuryCol.position.set(0, 0.02, 0.15);
  root.add(mercuryCol);

  // Brass mounting clasps holding the glass bore
  for (const cy of [-0.65, 0.88]) {
    const clasp = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.024, 8, 20, Math.PI), mats.brass);
    clasp.position.set(0, cy, 0.15);
    root.add(clasp);
  }

  root.userData = { mercuryCol, bulb };
  return enableShadows(root);
}

// 12. Cyclic Dodecadepsipeptide Cereulide Toxin Ring + Golden Bond Bridges + K+ Core (S19, S20, S34)
export function buildCereulideRing3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const ringGroup = new THREE.Group();
  const R = 1.24;
  const lobeGeo = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.32, 3), 0.14, 4.6, 88);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const isAlt = i % 2 === 0;
    const lobe = new THREE.Mesh(lobeGeo, isAlt ? mats.cereulideCoral : mats.cereulideGold);
    lobe.position.set(Math.cos(a) * R, Math.sin(a) * R, (isAlt ? 0.14 : -0.14));
    lobe.scale.setScalar(isAlt ? 1.04 : 0.88);
    ringGroup.add(lobe);

    // Glowing covalent golden peptide bond bridge linking lobe i -> i+1
    const aNext = ((i + 1) / 12) * Math.PI * 2;
    const p1 = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, isAlt ? 0.14 : -0.14);
    const p2 = new THREE.Vector3(Math.cos(aNext) * R, Math.sin(aNext) * R, !isAlt ? 0.14 : -0.14);
    const bondCurve = new THREE.LineCurve3(p1, p2);
    const bond = new THREE.Mesh(new THREE.TubeGeometry(bondCurve, 4, 0.055, 8, false), mats.brass);
    ringGroup.add(bond);

    // Inner cyan carbonyl oxygen spheres coordinating the trapped potassium ion
    const ox = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), mats.atpSpark);
    ox.position.set(Math.cos(a) * (R * 0.62), Math.sin(a) * (R * 0.62), 0);
    ringGroup.add(ox);
  }

  // Trapped glowing violet K+ Potassium ion core
  const kIon = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 20), mats.potassiumIon);
  ringGroup.add(kIon);
  const coreLight = new THREE.PointLight(0xff7838, 20, 7, 1.8);
  ringGroup.add(coreLight);
  root.add(ringGroup);

  // Roaring 121°C heat-wave flames underneath (activated only in S20)
  const flameJet = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const f = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 1.05, 10),
      i % 2 === 0 ? mats.flameAmber : mats.flameBlue
    );
    f.position.set(Math.cos(a) * 0.92, -1.58, Math.sin(a) * 0.68);
    flameJet.add(f);
  }
  flameJet.visible = false;
  root.add(flameJet);

  root.userData = { ringGroup, kIon, flameJet };
  return enableShadows(root);
}

// 13. Dual Museum Pedestals — Centered Tightly for Zero Clipping (S21)
export function buildSplitReheatPedestals3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const makePedestal = (x) => {
    const g = new THREE.Group();
    g.position.set(x, -1.46, 0);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.62, 0.14, 32), mats.museumStand);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.88, 16), mats.brass);
    stem.position.y = 0.48;
    g.add(base); g.add(stem);
    return g;
  };
  root.add(makePedestal(-0.92));
  root.add(makePedestal(0.92));

  // Left: Broken charred dead bacteria halves
  const deadGroup = new THREE.Group();
  deadGroup.position.set(-0.92, -0.22, 0);
  const deadMat = new THREE.MeshPhysicalMaterial({ color: 0x5c6470, roughness: 0.78 });
  const h1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.36, 8, 14), deadMat);
  h1.position.set(-0.18, 0.08, 0); h1.rotation.z = 0.68;
  const h2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.36, 8, 14), deadMat);
  h2.position.set(0.18, -0.06, 0.08); h2.rotation.z = -0.82;
  deadGroup.add(h1); deadGroup.add(h2);
  root.add(deadGroup);

  // Right: Unharmed glowing mini Cereulide crown
  const aliveToxin = buildCereulideRing3D();
  aliveToxin.scale.setScalar(0.46);
  aliveToxin.position.set(0.92, -0.18, 0);
  root.add(aliveToxin);

  root.userData = { deadGroup, aliveToxin };
  return enableShadows(root);
}

// 14. Anatomical Translucent J-Shaped Stomach Cutaway + Acid + Intact Toxin Rings (S22)
export function buildStomachFlask3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Sculpted J-shaped stomach outer translucent cutaway shell (built from progressive radius spheres along anatomical spine!)
  const stomachPts = [
    { p: [-0.62, 1.38, 0],   r: 0.24 }, // esophagus inlet
    { p: [-0.68, 0.96, 0],   r: 0.42 },
    { p: [-0.72, 0.44, 0],   r: 0.68 }, // bulbous gastric fundus
    { p: [-0.62, -0.14, 0],  r: 0.72 }, // gastric body
    { p: [-0.30, -0.72, 0],  r: 0.64 }, // antrum bend
    { p: [0.32, -0.86, 0],   r: 0.48 },
    { p: [0.88, -0.62, 0],   r: 0.32 }, // pylorus outlet
    { p: [1.18, -0.44, 0],   r: 0.24 }
  ];

  // Outer pink stomach mucosa cutaway (open front half so interior HCl acid & intact toxin rings shine clearly!)
  const curve = new THREE.CatmullRomCurve3(stomachPts.map(s => new THREE.Vector3(...s.p)));
  const tubularSegs = 40;
  const radialSegs = 20;
  const tubeGeo = new THREE.TubeGeometry(curve, tubularSegs, 0.54, radialSegs, false);
  // Modulate radius along anatomical profile!
  const pos = tubeGeo.attributes.position;
  for (let i = 0; i <= tubularSegs; i++) {
    const u = i / tubularSegs;
    const center = curve.getPointAt(u);
    // Smooth radius envelope: narrow inlet -> fat body -> narrow outlet
    const rScale = 0.45 + 0.92 * Math.sin(Math.pow(u, 0.78) * Math.PI);
    for (let j = 0; j <= radialSegs; j++) {
      const idx = i * (radialSegs + 1) + j;
      const vx = pos.getX(idx) - center.x;
      const vy = pos.getY(idx) - center.y;
      const vz = pos.getZ(idx) - center.z;
      // Flatten front slightly for open cutaway feel
      pos.setXYZ(idx, center.x + vx * rScale, center.y + vy * rScale, center.z + vz * rScale);
    }
  }
  tubeGeo.computeVertexNormals();
  const outerShell = new THREE.Mesh(
    tubeGeo,
    new THREE.MeshPhysicalMaterial({
      color: 0xe87b70, roughness: 0.22, clearcoat: 0.92, transparent: true, opacity: 0.44, depthWrite: false, side: THREE.DoubleSide
    })
  );
  root.add(outerShell);

  // Glowing lime-green HCl gastric acid pool resting inside the lower J-bend
  const acidPool = new THREE.Mesh(
    sculptOrganicGeo(new THREE.SphereGeometry(0.68, 24, 18), 0.06, 4.2, 52),
    mats.acidFluid
  );
  acidPool.scale.set(1.25, 0.65, 0.68);
  acidPool.position.set(-0.08, -0.68, 0.02);
  root.add(acidPool);

  // Rising acid fizz bubbles
  const bubbles = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06 + (i % 3) * 0.028, 10, 8), mats.acidFluid);
    b.userData = { bx: -0.45 + (i % 5) * 0.24, phase: i * 0.62 };
    bubbles.add(b);
  }
  root.add(bubbles);

  // 2 glowing unharmed Cereulide rings floating calmly right inside the boiling stomach acid!
  const toxins = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const t = buildCereulideRing3D();
    t.scale.setScalar(0.28);
    t.position.set(-0.28 + i * 0.66, -0.48 + i * 0.16, 0.24);
    toxins.add(t);
  }
  root.add(toxins);

  root.userData = { toxins, bubbles };
  return enableShadows(root);
}

// 15. Y-Artery Bloodstream with Full Clinical Dial Texture & Flowing RBCs (S23 — exact R09 S30!)
export function buildArteryGauge3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const makeBranch = (pts) => {
    const c = new THREE.CatmullRomCurve3(pts);
    return new THREE.Mesh(sculptOrganicGeo(new THREE.TubeGeometry(c, 28, 0.46, 18, false), 0.04, 4.2, 61), mats.arteryTissue);
  };
  root.add(makeBranch([new THREE.Vector3(0, -2.5, -0.12), new THREE.Vector3(0, -0.42, -0.12), new THREE.Vector3(-1.35, 2.1, -0.12)]));
  root.add(makeBranch([new THREE.Vector3(0, -2.5, -0.12), new THREE.Vector3(0, -0.42, -0.12), new THREE.Vector3(1.35, 2.1, -0.12)]));

  // Embedded brass-bezel clinical dial right at the Y-fork (crisp green/amber/red CanvasTexture!)
  const gaugeGroup = new THREE.Group();
  gaugeGroup.position.set(0, -0.18, 0.48);
  const caseRing = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.088, 16, 44), mats.brass);
  gaugeGroup.add(caseRing);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.71, 44), mats.arteryGaugeFace);
  face.position.z = 0.02;
  gaugeGroup.add(face);
  const needle = new THREE.Group();
  needle.position.z = 0.06;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.56, 0.025), mats.mercuryRed);
  bar.position.y = 0.22;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), mats.castIron);
  hub.rotation.x = Math.PI / 2;
  needle.add(bar); needle.add(hub);
  gaugeGroup.add(needle);
  root.add(gaugeGroup);

  // Flowing RBCs & glowing golden toxin sparks coursing up both branches
  const flowGroup = new THREE.Group();
  const rbcGeo = new THREE.TorusGeometry(0.11, 0.052, 10, 18);
  const sparkGeo = new THREE.IcosahedronGeometry(0.085, 1);
  for (let i = 0; i < 18; i++) {
    const isToxin = i % 3 === 0;
    const m = new THREE.Mesh(isToxin ? sparkGeo : rbcGeo, isToxin ? mats.cereulideGold : mats.rbc);
    m.userData = { branch: i % 2 === 0 ? -1 : 1, offset: i / 18 };
    flowGroup.add(m);
  }
  root.add(flowGroup);

  root.userData = { needle, flowGroup };
  return enableShadows(root);
}

// 16. Sculpted Mitochondrion Cutaway with Cristae, ATP Sparks & Violet K+ Flood (S24, S25)
export function buildMitochondrion3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const outerGeo = sculptOrganicGeo(new THREE.CapsuleGeometry(0.84, 1.38, 16, 28), 0.05, 3.0, 24);
  const outer = new THREE.Mesh(outerGeo, mats.mitoOuter);
  outer.rotation.z = Math.PI / 2;
  outer.scale.set(1, 1, 0.56);
  outer.position.z = -0.34;
  root.add(outer);

  const cristaePts = [];
  for (let i = 0; i < 11; i++) {
    const x = -0.96 + i * 0.192;
    const y = (i % 2 === 0 ? 1 : -1) * 0.42;
    cristaePts.push(new THREE.Vector3(x, y, 0.08));
  }
  const cCurve = new THREE.CatmullRomCurve3(cristaePts);
  const cristae = new THREE.Mesh(new THREE.TubeGeometry(cCurve, 64, 0.11, 14, false), mats.mitoCristae);
  root.add(cristae);

  const atpGroup = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), mats.atpSpark);
    s.userData = { bx: -0.82 + (i % 6) * 0.34, by: (i < 6 ? 0.28 : -0.28), phase: i * 0.72 };
    atpGroup.add(s);
  }
  root.add(atpGroup);

  const kFlood = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), mats.potassiumIon);
    k.userData = { bx: -0.78 + i * 0.22, phase: i * 0.55 };
    kFlood.add(k);
  }
  root.add(kFlood);

  root.userData = { atpGroup, kFlood, cristae };
  return enableShadows(root);
}

// 17. Precision Brass Pocket Stopwatch with Crisp Numbered Dial & Red 1-5 Hr Sector (S26)
export function buildStopwatch3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.10, 1.10, 0.28, 48), mats.brass);
  body.rotation.x = Math.PI / 2;
  root.add(body);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.10, 0.068, 16, 48), mats.brass);
  bezel.position.z = 0.14;
  root.add(bezel);

  const dial = new THREE.Mesh(new THREE.CircleGeometry(1.04, 48), mats.stopwatchDialFace);
  dial.position.z = 0.15;
  root.add(dial);

  // Crown + hanging bow ring
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.26, 20), mats.brass);
  crown.position.y = 1.24;
  root.add(crown);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 12, 24), mats.brass);
  bow.position.y = 1.48;
  root.add(bow);

  const handGroup = new THREE.Group();
  handGroup.position.z = 0.19;
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.80, 0.025), mats.mercuryRed);
  hand.position.y = 0.34;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 16), mats.castIron);
  pin.rotation.x = Math.PI / 2;
  handGroup.add(hand); handGroup.add(pin);
  root.add(handGroup);

  root.userData = { handGroup };
  return enableShadows(root);
}

// 18. Anatomical Sculpted Liver Specimen on Matte-Black Museum Stand (S27 — exact R10 S22 style!)
export function buildLiverSpecimen3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.66, 0.14, 36), mats.museumStand);
  base.position.y = -1.52;
  root.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 1.05, 16), mats.brass);
  pole.position.y = -0.96;
  root.add(pole);

  const liverGroup = new THREE.Group();
  liverGroup.position.y = 0.06;
  const rightLobe = new THREE.Mesh(sculptOrganicGeo(new THREE.IcosahedronGeometry(0.96, 3), 0.10, 2.5, 27), mats.liverTissue);
  rightLobe.scale.set(1.16, 0.86, 0.72);
  rightLobe.position.set(-0.32, 0.05, 0);
  liverGroup.add(rightLobe);

  const leftLobe = new THREE.Mesh(sculptOrganicGeo(new THREE.IcosahedronGeometry(0.68, 3), 0.09, 2.8, 39), mats.liverTissue);
  leftLobe.scale.set(1.18, 0.64, 0.60);
  leftLobe.position.set(0.62, 0.14, 0.06);
  leftLobe.rotation.z = -0.26;
  liverGroup.add(leftLobe);

  const gall = new THREE.Mesh(
    new THREE.SphereGeometry(0.20, 18, 14),
    new THREE.MeshPhysicalMaterial({ color: 0x2f855a, roughness: 0.24, clearcoat: 0.82 })
  );
  gall.scale.set(0.8, 1.3, 0.8);
  gall.position.set(-0.14, -0.58, 0.26);
  liverGroup.add(gall);

  const lesions = new THREE.Group();
  const lesionMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b090e, roughness: 0.68, emissive: 0x6b121a, emissiveIntensity: 0.35
  });
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(sculptOrganicGeo(new THREE.IcosahedronGeometry(0.19, 2), 0.16, 5.2, 60 + i), lesionMat);
    l.position.set(-0.72 + i * 0.28, (i % 2 === 0 ? 0.24 : -0.14), 0.56);
    lesions.add(l);
  }
  liverGroup.add(lesions);
  root.add(liverGroup);

  root.userData = { liverGroup, lesions };
  return enableShadows(root);
}

// 19. Centered Starchy Foods Trio: Rice Bowl + Coiled Spaghetti Plate + Noodle Takeout Box (S28)
export function buildStarchTrio3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const board = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.20, 2.1), mats.walnut);
  board.position.y = -0.96;
  root.add(board);

  // Left: Miniature ceramic bowl filled with instanced Basmati rice
  const bowl = createBowlMesh(mats, 0.54);
  bowl.position.set(-1.12, -0.48, 0.06);
  bowl.add(createRicePileInstanced(55, 0.42, 0.42, 0.24, 0.02, mats.riceGrain, 281, 0.26));
  root.add(bowl);

  // Center: Warm porcelain plate with coiled golden spaghetti + marinara & green basil leaf
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.52, 0.10, 32), mats.ceramicCream);
  plate.position.set(0.02, -0.78, 0.10);
  root.add(plate);
  const pastaNest = new THREE.Group();
  pastaNest.position.set(0.02, -0.64, 0.10);
  for (let i = 0; i < 6; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.32 - i * 0.032, 0.036, 10, 28), mats.pastaGold);
    coil.rotation.x = Math.PI / 2 + (i % 2 === 0 ? 0.14 : -0.12);
    coil.rotation.z = i * 0.7;
    coil.position.y = i * 0.042;
    pastaNest.add(coil);
  }
  const marinara = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), mats.mercuryRed);
  marinara.scale.set(1.2, 0.5, 1.2);
  marinara.position.y = 0.24;
  pastaNest.add(marinara);
  const basil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mats.paddyGreen);
  basil.scale.set(1.4, 0.25, 0.8);
  basil.position.set(0.08, 0.32, 0.04);
  pastaNest.add(basil);
  root.add(pastaNest);

  // Right: Iconic white folded Asian takeout noodle box with crimson accent & chopsticks
  const boxGroup = new THREE.Group();
  boxGroup.position.set(1.16, -0.44, 0.04);
  const box = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.34, 0.82, 4), mats.ceramicCream);
  box.rotation.y = Math.PI / 4;
  boxGroup.add(box);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.39, 0.16, 4), mats.mercuryRed);
  stripe.rotation.y = Math.PI / 4;
  stripe.position.y = 0.04;
  boxGroup.add(stripe);
  for (let i = 0; i < 4; i++) {
    const nood = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 8, 16), mats.pastaGold);
    nood.position.set((i - 1.5) * 0.09, 0.44, (i % 2) * 0.06);
    nood.rotation.x = 0.4;
    boxGroup.add(nood);
  }
  for (let i = 0; i < 2; i++) {
    const cs = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 1.15, 8), mats.oakLight);
    cs.position.set(0.08 + i * 0.07, 0.58, 0.02);
    cs.rotation.z = -0.35 - i * 0.08;
    boxGroup.add(cs);
  }
  root.add(boxGroup);

  return enableShadows(root);
}

// 20. Centered Side-by-Side Deep Hot Pot vs Wide Shallow Cooling Tray (S30)
export function buildShallowVsDeep3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  const table = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 2.2), mats.museumStand);
  table.position.y = -1.04;
  root.add(table);

  // Left: Tall deep pot retaining glowing red heat inside (centered at x = -0.96 so zero edge clipping!)
  const deepGroup = new THREE.Group();
  deepGroup.position.set(-0.96, -0.22, 0);
  const deepPot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.56, 1.38, 32), mats.ceramicBlue);
  deepGroup.add(deepPot);
  const hotCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xff5a28, transparent: true, opacity: 0.82 })
  );
  hotCore.position.y = 0.34;
  deepGroup.add(hotCore);
  const hotGlow = new THREE.PointLight(0xff4a18, 14, 4.5, 1.8);
  hotGlow.position.y = 0.55;
  deepGroup.add(hotGlow);
  root.add(deepGroup);

  // Right: Wide shallow brushed-steel cooling tray packed with 90 instanced grains & cool cyan mist!
  const shallowGroup = new THREE.Group();
  shallowGroup.position.set(0.84, -0.78, 0);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.24, 1.24), mats.steel);
  shallowGroup.add(tray);
  const riceLayer = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.16, 1.08), mats.riceGrain);
  riceLayer.position.y = 0.10;
  shallowGroup.add(riceLayer);
  shallowGroup.add(createRicePileInstanced(80, 0.72, 0.48, 0.08, 0.18, mats.riceGrain, 303, 0.28));

  const coolMist = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mats.coldGlow);
    c.userData = { bx: -0.58 + (i % 4) * 0.38, bz: (i < 4 ? -0.24 : 0.24), phase: i * 0.75 };
    coolMist.add(c);
  }
  shallowGroup.add(coolMist);
  root.add(shallowGroup);

  root.userData = { hotCore, coolMist };
  return enableShadows(root);
}

// 21. Architectural Stocked Refrigerator Interior with Milk, Rice Container & Cool 3°C LED Bar (S31, S35)
export function buildRefrigerator3D() {
  const mats = getMaterials3D();
  const root = new THREE.Group();

  // Sleek dark brushed-steel fridge cabinet shell
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.72, 3.45, 0.18), mats.fridgeInterior);
  back.position.set(0, 0, -0.82);
  root.add(back);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.45, 1.62), mats.fridgeShell);
    side.position.set(s * 1.38, 0, -0.06);
    root.add(side);
  }
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(2.92, 0.24, 1.66), mats.fridgeShell);
  topCap.position.set(0, 1.72, -0.06);
  root.add(topCap);
  const botCap = new THREE.Mesh(new THREE.BoxGeometry(2.92, 0.20, 1.66), mats.fridgeShell);
  botCap.position.set(0, -1.72, -0.06);
  root.add(botCap);

  // Cool cyan LED light bar inside top ceiling
  const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 0.18), mats.atpSpark);
  ledStrip.position.set(0, 1.54, -0.15);
  root.add(ledStrip);
  const coolLight = new THREE.PointLight(0x67e8f9, 20, 7, 1.8);
  coolLight.position.set(0, 0.9, 0.35);
  root.add(coolLight);

  // 3 clear tempered glass shelves with silver front trim
  for (const sy of [-0.88, -0.04, 0.78]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.06, 1.32), mats.glassClear);
    shelf.position.set(0, sy, -0.12);
    root.add(shelf);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.055, 0.055), mats.steel);
    trim.position.set(0, sy, 0.54);
    root.add(trim);
  }

  // Hero shallow sealed glass rice container sliding onto the middle shelf!
  const container = new THREE.Group();
  container.position.set(-0.08, 0.14, 0.04);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.30, 0.92), mats.glassClear);
  const rice = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.18, 0.78), mats.riceGrain);
  rice.position.y = -0.04;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.07, 0.98), mats.ceramicBlue);
  lid.position.y = 0.17;
  container.add(box); container.add(rice); container.add(lid);
  root.add(container);

  // Real stocked fridge props on top & bottom shelves (milk carafe, amber jar, green produce crisper!)
  const milk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.64, 20), mats.ceramicCream);
  milk.position.set(-0.78, 1.14, -0.15);
  root.add(milk);
  const milkCap = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.09, 16), mats.ceramicBlue);
  milkCap.position.set(-0.78, 1.48, -0.15);
  root.add(milkCap);

  const jar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.46, 20), mats.amberGlass);
  jar2.position.set(0.72, 1.05, -0.12);
  root.add(jar2);
  const jarCap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 20), mats.brass);
  jarCap.position.set(0.72, 1.30, -0.12);
  root.add(jarCap);

  // Bottom green veggie crisper drawer + emerald fruit accents
  const crisper = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.58, 1.16), mats.glassClear);
  crisper.position.set(0, -1.28, -0.10);
  root.add(crisper);
  for (let i = 0; i < 4; i++) {
    const veg = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), i % 2 === 0 ? mats.paddyGreen : mats.cereulideGold);
    veg.position.set(-0.68 + i * 0.46, -1.32, -0.04);
    root.add(veg);
  }

  root.userData = { container };
  return enableShadows(root);
}
