// Organic FBM-Sculpted Pure-Code Three.js 3D Diorama Assemblies for Fried Rice Syndrome (v13.0 Era-2 Standard)
// ZERO blocky primitives: uses FBM vertex displacement (sculptOrganicGeo), LatheGeometry, TubeGeometry & museum stands.
import * as THREE from '../vendor/three.module.js';
import { getMaterials3D } from './materials3d.js';
import { mulberry32 } from './dossier.js';

export function enableShadows(obj, cast = true, receive = true) {
  obj.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = cast;
      c.receiveShadow = receive;
    }
  });
  return obj;
}

// Multi-octave deterministic 3D FBM vertex sculptor so organic molecules, organs & rocks have real tactile relief
export function sculptOrganicGeo(baseGeo, amp = 0.14, freq = 3.2, seed = 11) {
  const pos = baseGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const len = v.length() || 1;
    const nx = v.x / len, ny = v.y / len, nz = v.z / len;
    const n1 = Math.sin(nx * freq + seed) * Math.cos(ny * freq * 1.17 - seed * 0.7) * Math.sin(nz * freq * 0.91 + seed * 1.3);
    const n2 = Math.sin(nx * freq * 2.3 + ny * 3.1) * Math.cos(nz * freq * 2.1 - seed) * 0.42;
    const n3 = Math.cos((nx + ny + nz) * freq * 4.1 + seed) * 0.16;
    const d = 1.0 + (n1 + n2 + n3) * amp;
    pos.setXYZ(i, v.x * d, v.y * d, v.z * d);
  }
  baseGeo.computeVertexNormals();
  return baseGeo;
}

function makeMuseumStand(height = 1.0, baseR = 0.72) {
  const mats = getMaterials3D();
  const g = new THREE.Group();
  const basePts = [
    [0, 0], [baseR, 0], [baseR * 0.96, 0.12], [baseR * 0.65, 0.22], [0.16, 0.30], [0.09, 0.36]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const base = new THREE.Mesh(new THREE.LatheGeometry(basePts, 36), mats.museumBlack);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, height, 20), mats.brass);
  rod.position.y = 0.30 + height * 0.5;
  g.add(base, rod);
  return g;
}

function makeRiceBowl(scale = 1.0, seed = 101) {
  const mats = getMaterials3D();
  const g = new THREE.Group();
  const bowlPts = [
    [0.0, 0.0], [0.58, 0.0], [0.64, 0.12], [0.95, 0.42], [1.14, 0.85], [1.16, 0.96],
    [1.06, 0.96], [1.02, 0.82], [0.82, 0.42], [0.50, 0.12], [0.0, 0.10]
  ].map(([r, y]) => new THREE.Vector2(r * scale, y * scale));
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 44), mats.ceramicBlue);
  g.add(bowl);

  // Mound of sculpted individual 3D rice grains
  const mound = new THREE.Mesh(
    sculptOrganicGeo(new THREE.SphereGeometry(0.96 * scale, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), 0.08, 6.0, seed),
    mats.riceGrain
  );
  mound.position.y = 0.68 * scale;
  g.add(mound);

  const rnd = mulberry32(seed);
  const grainGeo = new THREE.CapsuleGeometry(0.042 * scale, 0.14 * scale, 6, 10);
  for (let i = 0; i < 42; i++) {
    const gr = new THREE.Mesh(grainGeo, mats.riceGrain);
    const a = rnd() * Math.PI * 2;
    const rad = Math.sqrt(rnd()) * 0.82 * scale;
    const domeY = Math.sqrt(Math.max(0.01, 1 - (rad / (0.98 * scale)) ** 2)) * 0.58 * scale;
    gr.position.set(Math.cos(a) * rad, 0.72 * scale + domeY, Math.sin(a) * rad);
    gr.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    g.add(gr);
  }
  return g;
}

// 1. Miniature Midnight Indian Kitchen Counter + Ceramic Rice Bowl + Wall Clock + Hanging Bulb (S01, S14, S33, S34)
export function buildKitchenCounterDiorama3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Polished dark stone / walnut kitchen slab
  const counter = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.24, 3.0), mats.walnut);
  counter.position.set(0, -1.12, 0);
  group.add(counter);

  // Tiled kitchen backsplash wall
  const wall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.8, 0.18), mats.ceramic);
  wall.position.set(0, 0.85, -1.45);
  group.add(wall);

  // Hanging warm brass kitchen lamp overhead
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.4, 8), mats.museumBlack);
  cord.position.set(0, 2.35, 0.1);
  const shadePts = [[0.14, 0.42], [0.22, 0.36], [0.58, 0.04], [0.62, 0.0]].map(([r, y]) => new THREE.Vector2(r, y));
  const shade = new THREE.Mesh(new THREE.LatheGeometry(shadePts, 32), mats.brass);
  shade.position.set(0, 1.35, 0.1);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), mats.flameCore);
  bulb.position.set(0, 1.36, 0.1);
  const lampLight = new THREE.PointLight(0xffb84d, 55, 10, 1.8);
  lampLight.position.set(0, 1.25, 0.1);
  group.add(cord, shade, bulb, lampLight);

  // Wall clock on kitchen wall (top-right)
  const clockFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.10, 32), mats.brass);
  clockFrame.rotation.x = Math.PI / 2;
  clockFrame.position.set(1.45, 0.95, -1.32);
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.47, 32), mats.paperCream);
  clockFace.position.set(1.45, 0.95, -1.26);
  const clockHand = new THREE.Group();
  clockHand.position.set(1.45, 0.95, -1.24);
  const minBar = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.36, 0.02), mats.museumBlack);
  minBar.position.y = 0.14;
  const hrBar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.02), mats.crimsonOrganic);
  hrBar.position.y = 0.09;
  clockHand.add(minBar, hrBar);
  group.add(clockFrame, clockFace, clockHand);

  // Ceramic bowl brimming with cooked white rice
  const bowl = makeRiceBowl(1.0, 202);
  bowl.position.set(-0.2, -0.98, 0.25);
  group.add(bowl);

  // Rising curved translucent steam ribbons
  const steamGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const sc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.45 + i * 0.32, 0.15, 0.25),
      new THREE.Vector3(-0.35 + i * 0.28, 0.65, 0.30),
      new THREE.Vector3(-0.50 + i * 0.34, 1.15, 0.20)
    ]);
    const st = new THREE.Mesh(new THREE.TubeGeometry(sc, 18, 0.035, 8, false), mats.clearGlass);
    steamGroup.add(st);
  }
  group.add(steamGroup);

  group.userData = { bowl, clockHand, minBar, hrBar, steamGroup, lampLight };
  return enableShadows(group);
}

// 2. Sizzling Cast-Iron Indian Kadhai/Wok over Gas Burner Tossing 3D Rice Grains (S02, S07)
export function buildWokReheat3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Curved iron kadhai
  const wokPts = [
    [0.0, 0.0], [0.75, 0.04], [1.32, 0.34], [1.65, 0.78], [1.72, 0.82],
    [1.64, 0.84], [1.26, 0.40], [0.72, 0.11], [0.0, 0.08]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const wok = new THREE.Mesh(new THREE.LatheGeometry(wokPts, 48), mats.castIron);
  wok.position.y = -0.35;
  group.add(wok);

  // Side brass loop handles
  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 12, 24, Math.PI), mats.brass);
    h.position.set(side * 1.72, 0.42, 0);
    h.rotation.z = side * -Math.PI * 0.45;
    group.add(h);
  }

  // Stove burner ring & 12 glowing blue/orange flame tongues underneath
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.96, 0.18, 32), mats.castIron);
  burner.position.y = -0.78;
  group.add(burner);

  const flames = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.46, 12), i % 2 ? mats.flameCore : mats.flameBlue);
    fl.position.set(Math.cos(a) * 0.78, -0.52, Math.sin(a) * 0.78);
    fl.rotation.z = -Math.cos(a) * 0.35;
    fl.rotation.x = Math.sin(a) * 0.35;
    group.add(fl);
    flames.push(fl);
  }

  // Tossing airborne 3D rice grains above the wok
  const grains = [];
  const gGeo = new THREE.CapsuleGeometry(0.055, 0.18, 6, 12);
  const rnd = mulberry32(404);
  for (let i = 0; i < 38; i++) {
    const g = new THREE.Mesh(gGeo, mats.riceGrain);
    g.userData = {
      bx: (rnd() - 0.5) * 2.1,
      by: 0.15 + rnd() * 1.1,
      bz: (rnd() - 0.5) * 1.6,
      ph: rnd() * Math.PI * 2
    };
    g.position.set(g.userData.bx, g.userData.by, g.userData.bz);
    group.add(g);
    grains.push(g);
  }

  group.userData = { wok, flames, grains };
  return enableShadows(group);
}

// 3. Quiet Blue Midnight Student Nightstand + Sweeping Twin-Bell Alarm Clock (S04)
export function buildBedroomNightstand3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  const table = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 2.2), mats.walnut);
  table.position.set(0, -1.05, 0);
  group.add(table);

  // Vintage twin-bell bedside alarm clock
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.38, 40), mats.brass);
  body.rotation.x = Math.PI / 2;
  body.position.set(-0.25, -0.05, 0.1);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.72, 40), mats.paperCream);
  dial.position.set(-0.25, -0.05, 0.30);
  const handGroup = new THREE.Group();
  handGroup.position.set(-0.25, -0.05, 0.33);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.56, 0.02), mats.crimsonOrganic);
  hand.position.y = 0.22;
  handGroup.add(hand);

  for (const s of [-1, 1]) {
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), mats.brass);
    bell.position.set(-0.25 + s * 0.58, 0.65, 0.1);
    bell.rotation.z = s * -0.52;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.25, 16), mats.brass);
    foot.position.set(-0.25 + s * 0.45, -0.82, 0.1);
    foot.rotation.z = s * 0.35;
    group.add(bell, foot);
  }
  group.add(body, dial, handGroup);

  // Half-full glass tumbler of water beside clock
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.92, 32, 1, true), mats.clearGlass);
  glass.position.set(1.15, -0.48, 0.25);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.26, 0.45, 32), mats.iceBlue);
  water.position.set(1.15, -0.70, 0.25);
  group.add(glass, water);

  group.userData = { handGroup };
  return enableShadows(group);
}

// 4. Vintage Amber Apothecary Glass Bottle ("NOT POISON": S05)
export function buildClinicalBottle3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  const pts = [
    [0.0, 0.0], [0.76, 0.0], [0.80, 0.12], [0.80, 1.48], [0.42, 1.85],
    [0.34, 2.25], [0.42, 2.32], [0.42, 2.45], [0.0, 2.45]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bottle = new THREE.Mesh(new THREE.LatheGeometry(pts, 44), mats.amberGlass);
  bottle.position.y = -1.25;
  group.add(bottle);

  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.25, 0.42, 24), mats.terracotta);
  cork.position.y = 1.32;
  group.add(cork);

  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.815, 0.815, 0.88, 36, 1, true, -Math.PI * 0.35, Math.PI * 0.7),
    mats.paperCream
  );
  label.position.y = -0.45;
  group.add(label);

  return enableShadows(group);
}

// 5. Macro Sculptural White Rice Grains Dusted with Golden Spores (S06, S18)
export function buildRiceGrainMacro3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();
  const rnd = mulberry32(606);

  const grainBase = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.45, 3), 0.08, 4.0, 19);
  grainBase.scale(0.52, 1.45, 0.46);

  for (let i = 0; i < 14; i++) {
    const gr = new THREE.Mesh(grainBase, mats.riceGrain);
    const a = (i / 14) * Math.PI * 2;
    const rad = i < 4 ? 0.38 : 1.05;
    gr.position.set(Math.cos(a) * rad, (rnd() - 0.5) * 1.15, Math.sin(a) * rad * 0.75);
    gr.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    group.add(gr);
  }

  // Tiny shimmering golden endospores clinging to rice surfaces
  const spores = [];
  const spGeo = sculptOrganicGeo(new THREE.IcosahedronGeometry(0.085, 2), 0.14, 5.0, 29);
  for (let i = 0; i < 24; i++) {
    const sp = new THREE.Mesh(spGeo, mats.sporeArmor);
    sp.position.set((rnd() - 0.5) * 2.2, (rnd() - 0.5) * 1.4, 0.25 + rnd() * 0.85);
    group.add(sp);
    spores.push(sp);
  }

  group.userData = { spores };
  return enableShadows(group);
}

// 6. Sculptural Bacillus cereus Rod Chain & Exponential Mitosis Colony (S08, S16)
export function buildBacillusColony3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();
  const rods = [];

  function makeOneRod(scale = 1.0, seed = 1) {
    const rg = new THREE.Group();
    const body = new THREE.Mesh(
      sculptOrganicGeo(new THREE.CapsuleGeometry(0.19 * scale, 0.62 * scale, 10, 20), 0.07, 5.2, seed),
      mats.bacteriaRod
    );
    rg.add(body);

    // 4 undulating flagella hairs
    for (let f = 0; f < 4; f++) {
      const side = f < 2 ? -1 : 1;
      const fc = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.16 * scale, (f % 2 ? 0.22 : -0.22) * scale, 0),
        new THREE.Vector3(side * 0.45 * scale, (f % 2 ? 0.35 : -0.35) * scale, 0.14 * scale),
        new THREE.Vector3(side * 0.72 * scale, (f % 2 ? 0.12 : -0.12) * scale, -0.10 * scale)
      ]);
      const fl = new THREE.Mesh(new THREE.TubeGeometry(fc, 14, 0.016 * scale, 6, false), mats.atpCyan);
      rg.add(fl);
    }
    return rg;
  }

  const rnd = mulberry32(808);
  for (let i = 0; i < 22; i++) {
    const rod = makeOneRod(i < 4 ? 1.05 : 0.72, i * 17 + 3);
    const a = (i / 22) * Math.PI * 2;
    const rad = i < 4 ? (i - 1.5) * 0.85 : (0.65 + rnd() * 1.45);
    const bx = i < 4 ? rad : Math.cos(a) * rad;
    const by = i < 4 ? Math.sin(i * 1.2) * 0.25 : Math.sin(a) * rad * 0.82;
    const bz = (rnd() - 0.5) * 0.9;
    rod.userData = { bx, by, bz, rotZ: (rnd() - 0.5) * 1.6, idx: i };
    rod.position.set(bx, by, bz);
    rod.rotation.z = rod.userData.rotZ;
    group.add(rod);
    rods.push(rod);
  }
  group.userData = { rods };
  return enableShadows(group);
}

// 7. Miniature Sunlit Rice Paddy Soil Cutaway Block (S09)
export function buildPaddyFieldCutaway3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Deep organic rich soil slab
  const soilBlock = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.35, 2.2), mats.soil);
  soilBlock.position.y = -0.95;
  group.add(soilBlock);

  // Glossy shallow paddy water layer on top of soil
  const waterLayer = new THREE.Mesh(new THREE.BoxGeometry(3.58, 0.12, 2.18), mats.iceBlue);
  waterLayer.position.y = -0.22;
  group.add(waterLayer);

  // 18 curved green paddy rice stalks with golden grain tassels
  const stalks = [];
  const rnd = mulberry32(909);
  for (let i = 0; i < 18; i++) {
    const sx = -1.4 + (i % 6) * 0.56 + (rnd() - 0.5) * 0.18;
    const sz = -0.65 + Math.floor(i / 6) * 0.65;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, -0.25, sz),
      new THREE.Vector3(sx + 0.08, 0.65, sz + 0.05),
      new THREE.Vector3(sx + 0.32, 1.35, sz + 0.12)
    ]);
    const st = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.036, 8, false), mats.paddyGreen);
    const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.24, 6, 10), mats.cereulideGold);
    head.position.set(sx + 0.36, 1.32, sz + 0.14);
    head.rotation.z = -0.78;
    group.add(st, head);
    stalks.push(st);
  }

  // Dormant golden endospores shining inside front soil cutaway face
  for (let i = 0; i < 12; i++) {
    const sp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.095, 2), mats.sporeArmor);
    sp.position.set(-1.3 + i * 0.24, -0.55 - (i % 3) * 0.34, 1.12);
    group.add(sp);
  }
  return enableShadows(group);
}

// 8. Turned Clear Glass Pantry Jar Filled with Raw Uncooked Rice & Wooden Scoop (S10)
export function buildRawRiceJar3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  const jarPts = [
    [0.0, 0.0], [1.05, 0.0], [1.14, 0.14], [1.14, 1.95], [0.86, 2.28], [0.86, 2.48], [0.92, 2.52]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const jar = new THREE.Mesh(new THREE.LatheGeometry(jarPts, 44), mats.clearGlass);
  jar.position.y = -1.28;
  group.add(jar);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.22, 40), mats.brass);
  lid.position.y = 1.32;
  group.add(lid);

  const riceFill = new THREE.Mesh(
    sculptOrganicGeo(new THREE.CylinderGeometry(1.04, 1.02, 1.55, 32, 8), 0.04, 7.0, 77),
    mats.riceGrain
  );
  riceFill.position.y = -0.45;
  group.add(riceFill);

  // Wooden scoop leaning beside jar
  const scoopHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 1.1, 16), mats.walnut);
  scoopHandle.position.set(1.38, -0.48, 0.28);
  scoopHandle.rotation.z = -0.52;
  const scoopCup = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.42, 20), mats.walnut);
  scoopCup.position.set(1.08, -0.98, 0.28);
  scoopCup.rotation.z = -0.52;
  group.add(scoopHandle, scoopCup);

  return enableShadows(group);
}

// 9. Multi-Layered Armored Endospore Cutaway that Cracks Open to Sprout Bacterium (S11, S13)
export function buildEndosporeCutaway3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Left & Right Armored Exosporium Shell Halves (separate cleanly in S13!)
  const leftShell = new THREE.Mesh(
    sculptOrganicGeo(new THREE.SphereGeometry(1.12, 36, 28, 0, Math.PI), 0.14, 5.0, 101),
    mats.sporeArmor
  );
  const rightShell = new THREE.Mesh(
    sculptOrganicGeo(new THREE.SphereGeometry(1.12, 36, 28, Math.PI, Math.PI), 0.14, 5.0, 102),
    mats.sporeArmor
  );
  group.add(leftShell, rightShell);

  // Inner Golden Peptidoglycan Cortex & Core
  const cortex = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.16, 18, 40), mats.brass);
  group.add(cortex);

  // Emerging Living Emerald Bacillus Rod inside core!
  const sprout = new THREE.Mesh(
    sculptOrganicGeo(new THREE.CapsuleGeometry(0.28, 0.85, 10, 20), 0.08, 4.5, 44),
    mats.bacteriaRod
  );
  sprout.rotation.z = -0.32;
  group.add(sprout);

  group.userData = { leftShell, rightShell, cortex, sprout };
  return enableShadows(group);
}

// 10. Boiling Stainless Pot + Clinical Mercury Glass Thermometer (S12, S15, S32)
export function buildBoilingPot3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  const potPts = [
    [0, 0], [1.18, 0], [1.24, 0.12], [1.26, 1.55], [1.36, 1.62], [1.20, 1.62], [1.18, 0.12], [0, 0.12]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potPts, 48), mats.steel);
  pot.position.y = -1.15;
  group.add(pot);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 1.12, 36), mats.iceBlue);
  water.position.y = -0.48;
  group.add(water);

  // Rising bubbles & bouncing armored endospores
  const bubbles = [];
  const rnd = mulberry32(1212);
  for (let i = 0; i < 16; i++) {
    const isSpore = i < 6;
    const m = new THREE.Mesh(
      isSpore ? sculptOrganicGeo(new THREE.IcosahedronGeometry(0.16, 2), 0.14, 5.0, i) : new THREE.SphereGeometry(0.09 + rnd() * 0.08, 16, 12),
      isSpore ? mats.sporeArmor : mats.clearGlass
    );
    m.userData = { bx: (rnd() - 0.5) * 1.6, by: -0.6 + rnd() * 1.8, bz: (rnd() - 0.5) * 1.4, sp: 0.8 + rnd() * 1.2 };
    group.add(m);
    bubbles.push(m);
  }

  // Stove flames below pot
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 10), mats.flameCore);
    fl.position.set(Math.cos(a) * 0.88, -1.28, Math.sin(a) * 0.88);
    group.add(fl);
  }

  group.userData = { bubbles };
  return enableShadows(group);
}

export function buildThermometer3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Cream enameled clinical backing board with beveled brass trim
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.95, 3.35, 0.14), mats.paperCream);
  group.add(back);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.04, 3.44, 0.08), mats.brass);
  trim.position.z = -0.04;
  group.add(trim);

  // Highlighted 4C-60C Red Danger Band along middle section
  const dangerBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 1.35, 0.15),
    new THREE.MeshBasicMaterial({ color: 0xd92b1c, transparent: true, opacity: 0.35 })
  );
  dangerBand.position.set(0, -0.05, 0.02);
  group.add(dangerBand);

  // Glass stem & lower mercury bulb
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 20), mats.crimsonOrganic);
  bulb.position.set(0, -1.28, 0.14);
  const stemGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 2.55, 24), mats.clearGlass);
  stemGlass.position.set(0, 0.05, 0.14);
  const mercuryCol = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 2.35, 20), mats.crimsonOrganic);
  mercuryCol.position.set(0, -1.15, 0.14);
  group.add(bulb, stemGlass, mercuryCol);

  // Brass tick marks along both sides
  for (let i = 0; i < 11; i++) {
    const ty = -1.0 + i * 0.24;
    const tickL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.026, 0.03), mats.museumBlack);
    tickL.position.set(-0.28, ty, 0.09);
    const tickR = tickL.clone();
    tickR.position.x = 0.28;
    group.add(tickL, tickR);
  }

  group.userData = { mercuryCol, bulb, dangerBand };
  return enableShadows(group);
}

// 11. HERO SHOWPIECE #1: Sculptural 12-Lobe Cyclic Cereulide Toxin Crown Molecule (R09 Hemoglobin caliber! S19, S20, S21)
export function buildCereulideRing3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Inner metallic cyclic dodecadepsipeptide backbone ring
  const backbone = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.11, 18, 64), mats.brass);
  group.add(backbone);

  // 12 Alternating Sculpted Organic Lobe Clusters (D-O-Leu, D-Ala, L-O-Val, L-Val x 3!)
  const lobes = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const alt = i % 2 === 0;
    const lobe = new THREE.Mesh(
      sculptOrganicGeo(new THREE.IcosahedronGeometry(alt ? 0.39 : 0.31, 3), 0.18, 4.2, i * 13 + 7),
      alt ? mats.cereulideGold : mats.crimsonOrganic
    );
    lobe.position.set(Math.cos(a) * 1.18, Math.sin(a) * 1.18, Math.sin(a * 3) * 0.16);
    group.add(lobe);
    lobes.push(lobe);

    // Side carbonyl oxygen knobs facing inward toward central potassium pore
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mats.atpCyan);
    knob.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0);
    group.add(knob);
  }

  // Central Captured Glowing Potassium Ion (K+) trapped inside the crown pore!
  const kIon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 3), mats.potassiumViolet);
  group.add(kIon);

  // Flame ring underneath (toggled ON in S20: "SURVIVES 121°C"!)
  const flameRing = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.95, 12), i % 2 ? mats.flameCore : mats.flameBlue);
    f.position.set(Math.cos(a) * 1.15, -1.65, Math.sin(a) * 0.85);
    flameRing.add(f);
  }
  flameRing.visible = false;
  group.add(flameRing);

  group.userData = { lobes, kIon, flameRing };
  return enableShadows(group);
}

// 12. Dual Museum Pedestals: Dead Grey Bacteria vs Untouched Blazing Cereulide Crown (S21)
export function buildSplitReheatPedestals3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  const stL = makeMuseumStand(0.8, 0.68);
  stL.position.set(-1.35, -1.72, 0);
  const stR = makeMuseumStand(0.8, 0.68);
  stR.position.set(1.35, -1.72, 0);
  group.add(stL, stR);

  // Left: Crumbled Dead Grey Bacteria
  const deadGroup = new THREE.Group();
  deadGroup.position.set(-1.35, -0.25, 0);
  for (let i = 0; i < 5; i++) {
    const d = new THREE.Mesh(
      sculptOrganicGeo(new THREE.CapsuleGeometry(0.14, 0.42, 6, 12), 0.14, 5.0, i + 4),
      mats.bacteriaDead
    );
    d.position.set((i - 2) * 0.18, (i % 2) * 0.18, (i - 2) * 0.10);
    d.rotation.z = i * 0.7;
    deadGroup.add(d);
  }
  group.add(deadGroup);

  // Right: Blazing Untouched Mini Cereulide Crown Ring
  const crown = buildCereulideRing3D();
  crown.scale.setScalar(0.56);
  crown.position.set(1.35, -0.05, 0);
  group.add(crown);

  group.userData = { deadGroup, crown };
  return enableShadows(group);
}

// 13. Translucent Anatomical Stomach Acid Flask with Intact Cereulide Rings (S22)
export function buildStomachFlask3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  const sCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, 1.45, 0),
    new THREE.Vector3(-0.65, 0.45, 0.1),
    new THREE.Vector3(-0.25, -0.65, 0.15),
    new THREE.Vector3(0.65, -0.82, 0.05),
    new THREE.Vector3(1.25, -0.45, -0.1)
  ]);
  const shell = new THREE.Mesh(new THREE.TubeGeometry(sCurve, 36, 0.56, 20, false), mats.clearGlass);
  const acid = new THREE.Mesh(new THREE.TubeGeometry(sCurve, 32, 0.42, 18, false), mats.acidGreen);
  group.add(shell, acid);

  const rings = [];
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.065, 12, 24), mats.cereulideGold);
    group.add(r);
    rings.push(r);
  }

  group.userData = { sCurve, rings };
  return enableShadows(group);
}

// 14. R09 S30-Style Bifurcating Y-Shaped Crimson Artery Cutaway + Embedded Brass Flow Dial (S23)
export function buildArteryGauge3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Y-shaped vascular cutaway pipes
  const branchL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.35, 1.55, 0),
    new THREE.Vector3(-0.55, 0.35, 0),
    new THREE.Vector3(0.0, -1.55, 0)
  ]);
  const branchR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.35, 1.55, 0),
    new THREE.Vector3(0.55, 0.35, 0),
    new THREE.Vector3(0.0, -1.55, 0)
  ]);
  const matWall = mats.crimsonOrganic.clone();
  matWall.side = THREE.DoubleSide;
  const tubeL = new THREE.Mesh(new THREE.TubeGeometry(branchL, 32, 0.52, 20, false), matWall);
  const tubeR = new THREE.Mesh(new THREE.TubeGeometry(branchR, 32, 0.52, 20, false), matWall);
  group.add(tubeL, tubeR);

  // Embedded Brass Pressure/Toxin Dial mounted right at the Y bifurcation!
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.24, 36), mats.brass);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.set(0, 0.25, 0.42);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.58, 36), mats.paperCream);
  dial.position.set(0, 0.25, 0.55);
  const needle = new THREE.Group();
  needle.position.set(0, 0.25, 0.58);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 0.02), mats.crimsonOrganic);
  bar.position.y = 0.16;
  needle.add(bar);
  group.add(bezel, dial, needle);

  // Flowing golden Cereulide rings & biconcave RBCs
  const rbcPts = [
    [0, 0.04], [0.09, 0.05], [0.16, 0.10], [0.22, 0.06], [0.22, -0.06], [0.16, -0.10], [0.09, -0.05], [0, -0.04]
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const rbcGeo = new THREE.LatheGeometry(rbcPts, 20);
  const flowItems = [];
  for (let i = 0; i < 12; i++) {
    const isTox = i % 3 === 0;
    const m = new THREE.Mesh(
      isTox ? new THREE.TorusGeometry(0.14, 0.055, 10, 20) : rbcGeo,
      isTox ? mats.cereulideGold : mats.crimsonOrganic
    );
    group.add(m);
    flowItems.push({ mesh: m, branch: i % 2 === 0 ? branchL : branchR, offset: i / 12 });
  }

  group.userData = { needle, flowItems };
  return enableShadows(group);
}

// 15. HERO SHOWPIECE #2: Sculptural 3D Mitochondrion Cutaway with Folded Cristae + ATP Sparks + K+ Flood (S24, S25)
export function buildMitochondrion3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Outer sculpted peanut-shaped mitochondrial bowl (sliced open in front!)
  const outerGeo = sculptOrganicGeo(new THREE.SphereGeometry(1.38, 44, 32, Math.PI * 0.15, Math.PI * 1.42), 0.10, 3.2, 51);
  outerGeo.scale(1.32, 0.78, 0.85);
  const outerMat = mats.crimsonOrganic.clone();
  outerMat.side = THREE.DoubleSide;
  const outerShell = new THREE.Mesh(outerGeo, outerMat);
  outerShell.rotation.y = Math.PI * 0.85;
  group.add(outerShell);

  // Serpentine folded inner cristae ridges inside cavity
  const cristaePts = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const x = -1.25 + u * 2.50;
    const y = Math.sin(u * Math.PI * 7) * 0.42;
    const z = Math.cos(u * Math.PI * 3.5) * 0.18;
    cristaePts.push(new THREE.Vector3(x, y, z));
  }
  const cristaeCurve = new THREE.CatmullRomCurve3(cristaePts);
  const cristae = new THREE.Mesh(new THREE.TubeGeometry(cristaeCurve, 96, 0.11, 14, false), mats.mitoCristae);
  group.add(cristae);

  // Glowing cyan ATP energy sparks pulsing inside cristae
  const atpSparks = [];
  for (let i = 0; i < 12; i++) {
    const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), mats.atpCyan);
    sp.position.set(-1.0 + i * 0.18, Math.sin(i * 1.5) * 0.32, 0.35);
    group.add(sp);
    atpSparks.push(sp);
  }

  // Attacking Cereulide rings + flooding violet Potassium K+ ions (active in S25!)
  const kFlood = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const ion = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 2), mats.potassiumViolet);
    ion.userData = { bx: -1.1 + i * 0.24, by: 1.4 + (i % 3) * 0.35, bz: 0.4 };
    kFlood.add(ion);
  }
  for (let i = 0; i < 3; i++) {
    const dockRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.08, 12, 24), mats.cereulideGold);
    dockRing.position.set(-0.7 + i * 0.7, 0.85, 0.42);
    kFlood.add(dockRing);
  }
  kFlood.visible = false;
  group.add(kFlood);

  group.userData = { outerShell, cristae, atpSparks, kFlood };
  return enableShadows(group);
}

// 16. Antique Brass Pocket Stopwatch (S26)
export function buildStopwatch3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.28, 56), mats.brass);
  body.rotation.x = Math.PI / 2;
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.30, 0.10, 18, 56), mats.brass);
  bezel.position.z = 0.14;
  const dial = new THREE.Mesh(new THREE.CircleGeometry(1.20, 56), mats.paperCream);
  dial.position.z = 0.15;
  const wedge = new THREE.Mesh(
    new THREE.CircleGeometry(1.12, 32, Math.PI * 0.08, Math.PI * 0.42),
    new THREE.MeshBasicMaterial({ color: 0xd92b1c, transparent: true, opacity: 0.42 })
  );
  wedge.position.z = 0.16;
  group.add(body, bezel, dial, wedge);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.03), mats.museumBlack);
    t.position.set(Math.sin(a) * 0.98, Math.cos(a) * 0.98, 0.17);
    t.rotation.z = -a;
    group.add(t);
  }
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.30, 20), mats.brass);
  crown.position.y = 1.48;
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 14, 32), mats.brass);
  bow.position.y = 1.72;
  const handGroup = new THREE.Group();
  handGroup.position.z = 0.20;
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.88, 0.03), mats.crimsonOrganic);
  hand.position.y = 0.36;
  handGroup.add(hand);
  group.add(crown, bow, handGroup);

  group.userData = { handGroup };
  return enableShadows(group);
}

// 17. Anatomical 3D Human Liver Mounted on Matte-Black Museum Pedestal (R10 S22 style! S27)
export function buildLiverSpecimen3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  const stand = makeMuseumStand(1.05, 0.78);
  stand.position.y = -1.72;
  group.add(stand);

  // Right Hepatic Lobe (large sculptural wedge) + Left Hepatic Lobe
  const lobeR = new THREE.Mesh(
    sculptOrganicGeo(new THREE.IcosahedronGeometry(1.05, 4), 0.14, 2.8, 71),
    mats.liverHealthy
  );
  lobeR.scale.set(1.22, 0.82, 0.72);
  lobeR.position.set(-0.42, 0.22, 0.0);

  const lobeL = new THREE.Mesh(
    sculptOrganicGeo(new THREE.IcosahedronGeometry(0.72, 4), 0.14, 3.1, 79),
    mats.liverHealthy
  );
  lobeL.scale.set(1.25, 0.62, 0.58);
  lobeL.position.set(0.75, 0.42, 0.08);
  lobeL.rotation.z = -0.22;

  // Emerald Gallbladder tucked underneath right lobe
  const gall = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.34, 8, 16), mats.bacteriaRod);
  gall.position.set(-0.18, -0.45, 0.35);
  gall.rotation.z = 0.55;

  // Necrotic Failure Patches (emerge dynamically across S27!)
  const necrosisGroup = new THREE.Group();
  const spots = [[-0.55, 0.32, 0.68], [-0.15, 0.10, 0.72], [0.55, 0.40, 0.48], [-0.88, 0.05, 0.55]];
  for (let i = 0; i < spots.length; i++) {
    const sp = new THREE.Mesh(
      sculptOrganicGeo(new THREE.IcosahedronGeometry(0.28, 3), 0.18, 4.5, i + 10),
      mats.liverNecrotic
    );
    sp.position.set(spots[i][0], spots[i][1], spots[i][2]);
    necrosisGroup.add(sp);
  }

  group.add(lobeR, lobeL, gall, necrosisGroup);
  group.userData = { lobeR, lobeL, necrosisGroup };
  return enableShadows(group);
}

// 18. Culinary Starch Culprits Trio (Rice Bowl + Spiral Pasta + Noodle Box: S28)
export function buildStarchTrio3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  const bowl = makeRiceBowl(0.68, 88);
  bowl.position.set(-1.35, -1.15, 0.15);
  group.add(bowl);

  // Coiled 3D Golden Fusilli/Macaroni Pasta Mound (Center)
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.68, 0.12, 36), mats.ceramic);
  plate.position.set(0.0, -1.12, 0.35);
  group.add(plate);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.TorusKnotGeometry(0.16, 0.055, 32, 8, 2, 3), mats.pastaGold);
    p.position.set(Math.cos(a) * 0.35, -0.88 + (i % 3) * 0.12, 0.35 + Math.sin(a) * 0.32);
    p.rotation.set(i, i * 0.7, 0);
    group.add(p);
  }

  // Takeout Noodle Box + Chopsticks (Right)
  const box = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.45, 0.98, 4), mats.paperCream);
  box.rotation.y = Math.PI / 4;
  box.position.set(1.38, -0.68, 0.12);
  const noodles = new THREE.Mesh(new THREE.TorusKnotGeometry(0.32, 0.06, 44, 10, 3, 5), mats.pastaGold);
  noodles.position.set(1.38, -0.10, 0.12);
  const stick1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.014, 1.65, 10), mats.walnut);
  stick1.position.set(1.58, 0.18, 0.25);
  stick1.rotation.z = -0.35;
  group.add(box, noodles, stick1);

  return enableShadows(group);
}

// 19. Shallow Stainless Cooling Tray vs Deep Hot Stockpot (Rule 1: S30)
export function buildShallowVsDeep3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Left: Tall Deep Hot Stockpot (Red danger heat retained!)
  const tallPot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.72, 1.85, 36), mats.castIron);
  tallPot.position.set(-1.25, -0.55, 0);
  const hotCore = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.25, 32), mats.flameCore);
  hotCore.position.set(-1.25, 0.32, 0);
  group.add(tallPot, hotCore);

  // Right: Wide Flat Shallow Stainless Cooling Tray (Fast safe cooling!)
  const tray = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.18, 1.45), mats.steel);
  tray.position.set(1.05, -1.25, 0.15);
  const riceLayer = new THREE.Mesh(
    sculptOrganicGeo(new THREE.BoxGeometry(1.98, 0.14, 1.28, 12, 2, 12), 0.04, 8.0, 99),
    mats.riceGrain
  );
  riceLayer.position.set(1.05, -1.12, 0.15);
  group.add(tray, riceLayer);

  return enableShadows(group);
}

// 20. Miniature Cool-Blue Illuminated Refrigerator Chamber (Rule 2: S31)
export function buildRefrigerator3D() {
  const mats = getMaterials3D();
  const group = new THREE.Group();

  // Outer sleek stainless cabinet housing
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.4, 0.16), mats.ceramic);
  back.position.set(0, 0, -0.95);
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.4, 1.9), mats.steel);
  sideL.position.set(-1.4, 0, 0);
  const sideR = sideL.clone();
  sideR.position.x = 1.4;
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.18, 1.9), mats.steel);
  top.position.set(0, 1.68, 0);
  const bot = top.clone();
  bot.position.y = -1.68;
  group.add(back, sideL, sideR, top, bot);

  // 2 Frosted Glass Fridge Shelves + Interior Cool Blue LED Strip
  for (const sy of [-0.45, 0.55]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.65), mats.iceBlue);
    sh.position.set(0, sy, -0.05);
    group.add(sh);
  }
  const coldLight = new THREE.PointLight(0x6ee7ff, 70, 9, 1.6);
  coldLight.position.set(0, 1.25, 0.2);
  group.add(coldLight);

  // Sealed Glass Meal-Prep Container with Cooked Rice sliding onto Top Shelf!
  const containerGroup = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 0.95), mats.clearGlass);
  const rice = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.28, 0.84), mats.riceGrain);
  rice.position.y = -0.04;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.08, 1.00), mats.iceBlue);
  lid.position.y = 0.23;
  containerGroup.add(box, rice, lid);
  containerGroup.position.set(0, 0.82, 0.2);
  group.add(containerGroup);

  group.userData = { containerGroup, coldLight };
  return enableShadows(group);
}
