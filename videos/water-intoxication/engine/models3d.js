// Sovereign v15.0 — Grounded Architectural Rooms, Switchboard & Laboratory Instrument Worlds
import { THREE } from './core3d.js';
import {
  getWoodMat,
  getOchreBoardMat,
  getBrassMat,
  getDarkBrassMat,
  getBrushedSteelMat,
  getClearGlassMat,
  getWaterLiquidMat,
  getQuiltMat,
  getSwitchboardSteelMat,
  makeLabelTex
} from './materials3d.js';
import { buildBrassDialGauge } from './relief_anatomy.js';
import { clamp, lerp, easeOutCubic, easeInOutCubic } from './dossier.js';

// Helper: Contoured Spring-Water Bottle with Printed Label & Dynamic Fill Level
function createWaterBottle(capacityL = 0.5) {
  const grp = new THREE.Group();
  const h = capacityL > 0.7 ? 1.28 : 0.92;
  const r = capacityL > 0.7 ? 0.20 : 0.145;

  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(r * 0.94, 0),
    new THREE.Vector2(r, h * 0.08),
    new THREE.Vector2(r * 0.92, h * 0.42),
    new THREE.Vector2(r * 1.0, h * 0.68),
    new THREE.Vector2(r * 0.42, h * 0.88),
    new THREE.Vector2(r * 0.42, h * 0.98),
    new THREE.Vector2(r * 0.36, h * 0.98)
  ];
  const shell = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), getClearGlassMat(0.30, 0xDDF4FF));
  shell.castShadow = true;
  grp.add(shell);

  // Internal dynamic water column
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.88, r * 0.88, h * 0.74, 24),
    getWaterLiquidMat(0x45C8FF, 0.80)
  );
  liquid.position.y = h * 0.39;
  grp.add(liquid);

  // Printed wrap-around label band
  const { tex } = makeLabelTex(256, 96, (ctx, w, hh) => {
    ctx.fillStyle = '#0F4D8A';
    ctx.fillRect(0, 0, w, hh);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 6, w, 6);
    ctx.fillRect(0, hh - 12, w, 6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 30px "OswaldBold"';
    ctx.fillText(capacityL > 0.7 ? 'PURE 1.0L' : 'PURE 0.5L', w / 2, hh / 2 + 2);
  });
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.98, r * 0.98, h * 0.24, 28, 1, true),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 })
  );
  label.position.y = h * 0.44;
  grp.add(label);

  // Blue screw cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.45, r * 0.45, h * 0.09, 20),
    new THREE.MeshStandardMaterial({ color: 0x1668C4, roughness: 0.35 })
  );
  cap.position.y = h * 1.01;
  grp.add(cap);

  return {
    group: grp,
    cap,
    setFill(f) {
      const cf = clamp(f, 0.02, 1.0);
      liquid.visible = f > 0.03;
      liquid.scale.y = cf;
      liquid.position.y = h * 0.03 + (h * 0.74 * cf) * 0.5;
    }
  };
}

// ============================================================================
// WORLD 1: 2007 KDND RADIO BROADCAST STUDIO BOOTH (S01 - S04)
// ============================================================================
export function buildRadioStudioWorld() {
  const root = new THREE.Group();
  const oak = getWoodMat('oak');
  const walnut = getWoodMat('walnut');
  const brass = getBrassMat();
  const steel = getBrushedSteelMat();

  // Back Acoustic Studio Wall + Control-Room Window
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(11, 14, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x22303C, roughness: 0.85 })
  );
  backWall.position.set(0, 1.5, -2.6);
  backWall.receiveShadow = true;
  root.add(backWall);

  // Studio Window Frame on Back Wall (glass cleanly in front of walnut frame!)
  const winGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 1.65),
    new THREE.MeshStandardMaterial({ color: 0x102130, roughness: 0.16, metalness: 0.58 })
  );
  winGlass.position.set(-0.25, 0.32, -2.36);
  const winFrame = new THREE.Mesh(new THREE.BoxGeometry(4.05, 1.90, 0.12), walnut);
  winFrame.position.set(-0.25, 0.32, -2.44);
  root.add(winFrame, winGlass);

  // Glowing "ON AIR — 107.9 FM" Lightbox mounted cleanly below top caption zone!
  const onAirTexObj = makeLabelTex(512, 144, (ctx, w, h) => {
    ctx.fillStyle = '#B81418';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FF7A70';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#FFF7F2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 66px "OswaldBold"';
    ctx.fillText('ON AIR • 107.9', w / 2, h / 2 + 4);
  });
  const onAirMat = new THREE.MeshStandardMaterial({
    map: onAirTexObj.tex,
    emissive: 0xFF2218,
    emissiveMap: onAirTexObj.tex,
    emissiveIntensity: 0.95,
    roughness: 0.25
  });
  const onAirBox = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.48, 0.22), onAirMat);
  onAirBox.position.set(-0.42, 0.96, -2.34);
  root.add(onAirBox);

  // Studio Wall Clock on Right (sweeps 3 hours during S03!)
  const clockGroup = new THREE.Group();
  clockGroup.position.set(1.28, 0.96, -2.36);
  const clockRim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.10, 36), brass);
  clockRim.rotation.x = Math.PI / 2;
  const clockFaceTex = makeLabelTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#FAF3E3';
    ctx.beginPath(); ctx.arc(128, 128, 122, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.strokeStyle = '#1E1A16';
      ctx.lineWidth = i % 3 === 0 ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92);
      ctx.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112);
      ctx.stroke();
    }
  });
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.47, 36), new THREE.MeshBasicMaterial({ map: clockFaceTex.tex }));
  clockFace.position.z = 0.055;
  const minHand = new THREE.Group(); minHand.position.z = 0.065;
  const mhBar = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.36, 0.015), new THREE.MeshBasicMaterial({ color: 0x181512 }));
  mhBar.position.y = 0.15; minHand.add(mhBar);
  const hrHand = new THREE.Group(); hrHand.position.z = 0.07;
  const hhBar = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.25, 0.015), new THREE.MeshBasicMaterial({ color: 0xB01C18 }));
  hhBar.position.y = 0.10; hrHand.add(hhBar);
  clockGroup.add(clockRim, clockFace, minHand, hrHand);
  root.add(clockGroup);

  // Foreground Quarter-Sawn Oak Broadcast Desk
  const desk = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.42, 4.4), oak);
  desk.position.set(0, -1.32, 0.2);
  desk.receiveShadow = true;
  root.add(desk);

  // Analog Broadcast Mixing Console (left-rear of desk)
  const mixerGroup = new THREE.Group();
  mixerGroup.position.set(-1.35, -0.94, -0.45);
  mixerGroup.rotation.y = 0.22;
  const mixerBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.30, 1.15),
    new THREE.MeshStandardMaterial({ color: 0x1F242A, roughness: 0.42, metalness: 0.65 })
  );
  mixerBody.rotation.x = 0.20;
  mixerBody.castShadow = true;
  mixerGroup.add(mixerBody);
  // 8 fader sliders & dual glowing amber VU windows
  for (let i = 0; i < 8; i++) {
    const knob = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.10),
      new THREE.MeshStandardMaterial({ color: i === 2 ? 0xE53935 : 0xECEFF1, roughness: 0.3 })
    );
    knob.position.set(-0.62 + i * 0.18, 0.15, 0.22 + (i % 3) * 0.06);
    mixerGroup.add(knob);
  }
  for (const vx of [-0.36, 0.36]) {
    const vu = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 0.22),
      new THREE.MeshBasicMaterial({ color: 0xFFCA62 })
    );
    vu.position.set(vx, 0.22, -0.32);
    vu.rotation.x = -0.55;
    mixerGroup.add(vu);
  }
  root.add(mixerGroup);

  // Broadcast Condenser Microphone on Brass Articulated Boom Arm
  const micGroup = new THREE.Group();
  micGroup.position.set(-0.78, -1.10, 0.58);
  const micBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.08, 28), steel);
  const micStem = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.25, 16), brass);
  micStem.position.y = 0.62;
  const micCapsule = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.13, 0.28, 14, 24),
    new THREE.MeshStandardMaterial({ color: 0xD8B468, roughness: 0.26, metalness: 0.85, wireframe: false })
  );
  micCapsule.position.set(0.10, 1.22, 0);
  micCapsule.rotation.z = -0.18;
  const shockRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 12, 28), steel);
  shockRing.position.set(0.10, 1.18, 0);
  shockRing.rotation.x = Math.PI / 2;
  micGroup.add(micBase, micStem, micCapsule, shockRing);
  root.add(micGroup);

  // Crisp White Gaming Console Prize Box + Wireless Controller (S01 - S02 focal hero!)
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(1.05, -0.56, -0.22);
  consoleGroup.rotation.y = -0.30;

  const boxTex = makeLabelTex(384, 512, (ctx, w, h) => {
    ctx.fillStyle = '#F7F9FC';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#009BE5';
    ctx.fillRect(0, 0, w, 68);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 32px "OswaldBold"';
    ctx.textAlign = 'center';
    ctx.fillText('GRAND PRIZE', w / 2, 46);

    ctx.fillStyle = '#263238';
    ctx.font = '700 84px "Anton"';
    ctx.fillText('WII', w / 2, 215);
    ctx.fillStyle = '#009BE5';
    ctx.font = '700 30px "SpaceMonoBold"';
    ctx.fillText('HOME CONSOLE', w / 2, 268);

    ctx.strokeStyle = '#CFD8DC';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 315, w - 48, 145);
    ctx.fillStyle = '#455A64';
    ctx.font = '700 26px "OswaldBold"';
    ctx.fillText('INCLUDES MOTION', w / 2, 375);
    ctx.fillText('REMOTE CONTROLLER', w / 2, 418);
  });
  const prizeBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 1.48, 0.42),
    new THREE.MeshStandardMaterial({ map: boxTex.tex, roughness: 0.28 })
  );
  prizeBox.castShadow = true;
  consoleGroup.add(prizeBox);

  // Sleek white wireless motion remote in front of box
  const remote = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.09, 0.68),
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.20 })
  );
  remote.position.set(-0.22, -0.69, 0.46);
  remote.rotation.y = 0.35;
  const ledDot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.04), new THREE.MeshBasicMaterial({ color: 0x00D8FF }));
  ledDot.position.set(-0.22, -0.64, 0.68);
  consoleGroup.add(remote, ledDot);
  root.add(consoleGroup);

  // Row of 8 Spring-Water Bottles + 2 Tall 1L Jugs (= 7.5 Liters Total!) on Foreground Desk
  const bottles = [];
  const positions = [
    [-1.42, -1.11, 0.92, 0.5], [-1.06, -1.11, 1.02, 0.5], [-0.70, -1.11, 1.06, 0.5],
    [-0.34, -1.11, 1.08, 0.5], [0.02, -1.11, 1.08, 0.5],  [0.38, -1.11, 1.06, 0.5],
    [0.74, -1.11, 1.00, 0.5],  [1.10, -1.11, 0.92, 0.5],
    [1.46, -1.11, 0.62, 1.0],  [1.82, -1.11, 0.45, 1.0]
  ];
  for (const [bx, by, bz, capL] of positions) {
    const b = createWaterBottle(capL);
    b.group.position.set(bx, by, bz);
    root.add(b.group);
    bottles.push(b);
  }

  return {
    root,
    update(shotId, localSec, p) {
      if (shotId === 'S01' || shotId === 'S02') {
        onAirMat.emissiveIntensity = 0.85 + 0.2 * Math.sin(localSec * 4);
        bottles.forEach(b => { b.setFill(1.0); b.cap.visible = true; b.group.rotation.z = 0; });
        hrHand.rotation.z = -0.5;
        minHand.rotation.z = -0.2;
      } else if (shotId === 'S03') {
        // Sequential 7.5L draining across 3 hours!
        const sweep = clamp(localSec / 3.4);
        hrHand.rotation.z = -0.5 - sweep * (Math.PI * 0.5);
        minHand.rotation.z = -0.2 - sweep * (Math.PI * 6.0);
        bottles.forEach((b, idx) => {
          const localDrain = clamp((sweep * bottles.length) - idx);
          b.setFill(1.0 - localDrain);
          b.cap.visible = localDrain < 0.15;
          b.group.rotation.z = 0;
        });
      } else if (shotId === 'S04') {
        // Blinding head pain on live air: pulsing red ON AIR light + empty uncapped bottles
        onAirMat.emissiveIntensity = 1.1 + 0.55 * Math.sin(localSec * 12);
        bottles.forEach((b, idx) => {
          b.setFill(0.0);
          b.cap.visible = false;
          if (idx === 2) { b.group.rotation.z = Math.PI * 0.48; b.group.position.y = -0.98; }
          else { b.group.rotation.z = 0; b.group.position.y = -1.11; }
        });
      }
    }
  };
}

// ============================================================================
// WORLD 2A: MOONLIT SUBURBAN BEDROOM DIORAMA (S05 — strip_09.jpg f2475 homage)
// ============================================================================
export function buildBedroomNightWorld() {
  const root = new THREE.Group();
  const walnut = getWoodMat('walnut');
  const oak = getWoodMat('oak');

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 16),
    new THREE.MeshStandardMaterial({ color: 0x1A243B, roughness: 0.86 })
  );
  wall.position.set(0, 1.2, -2.2);
  wall.receiveShadow = true;
  root.add(wall);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 5.5), oak);
  floor.position.set(0, -2.15, 0.2);
  floor.receiveShadow = true;
  root.add(floor);

  // Recessed Window with Moonlight Slatted Blinds (positioned below top caption zone!)
  const winGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 1.95),
    new THREE.MeshBasicMaterial({ color: 0x5E82C4 })
  );
  winGlow.position.set(0.85, 0.72, -2.12);
  root.add(winGlow);
  for (let i = 0; i < 9; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.07, 0.08), walnut);
    slat.position.set(0.85, -0.12 + i * 0.21, -2.06);
    root.add(slat);
  }

  // Wooden Bed Frame, Headboard, Pillow & Patterned Stitched Crimson Quilt
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.95, 1.55, 0.18), walnut);
  headboard.position.set(0.35, -0.75, -1.65);
  root.add(headboard);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.55, 3.3),
    new THREE.MeshStandardMaterial({ color: 0xEDE6D8, roughness: 0.8 })
  );
  mattress.position.set(0.35, -1.58, -0.05);
  root.add(mattress);

  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.26, 0.72),
    new THREE.MeshStandardMaterial({ color: 0xF5F1E8, roughness: 0.75 })
  );
  pillow.position.set(0.35, -1.20, -1.12);
  root.add(pillow);

  // Still sleeping silhouette under patterned crimson quilt
  const headSil = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x3B2620, roughness: 0.85 })
  );
  headSil.position.set(0.35, -1.02, -1.05);
  root.add(headSil);

  const quilt = new THREE.Mesh(new THREE.BoxGeometry(2.88, 0.62, 2.45), getQuiltMat());
  quilt.position.set(0.35, -1.42, 0.38);
  quilt.castShadow = true;
  quilt.receiveShadow = true;
  root.add(quilt);

  // Left Nightstand + Warm Glowing Bedside Lamp + Twin-Bell Alarm Clock
  const stand = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.15, 0.95), walnut);
  stand.position.set(-1.55, -1.52, -0.75);
  root.add(stand);

  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.20, 0.42, 20), getBrassMat());
  lampBase.position.set(-1.62, -0.74, -0.82);
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.38, 0.48, 28, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xFFE3B3,
      emissive: 0xFF9636,
      emissiveIntensity: 0.85,
      roughness: 0.6,
      side: THREE.DoubleSide
    })
  );
  lampShade.position.set(-1.62, -0.36, -0.82);
  root.add(lampBase, lampShade);

  // Twin-bell bedside clock
  const alarmClock = new THREE.Group();
  alarmClock.position.set(-1.32, -0.76, -0.45);
  alarmClock.rotation.y = 0.35;
  const acBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 28), getBrushedSteelMat());
  acBody.rotation.x = Math.PI / 2;
  const acFace = new THREE.Mesh(new THREE.CircleGeometry(0.19, 28), new THREE.MeshBasicMaterial({ color: 0xFFF8E8 }));
  acFace.position.z = 0.065;
  const bellGeo = new THREE.SphereGeometry(0.085, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const bellL = new THREE.Mesh(bellGeo, getBrassMat()); bellL.position.set(-0.16, 0.20, 0); bellL.rotation.z = 0.55;
  const bellR = new THREE.Mesh(bellGeo, getBrassMat()); bellR.position.set(0.16, 0.20, 0); bellR.rotation.z = -0.55;
  const acHand = new THREE.Group(); acHand.position.z = 0.07;
  const hLine = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.14, 0.01), new THREE.MeshBasicMaterial({ color: 0x1A1714 }));
  hLine.position.y = 0.05; acHand.add(hLine);
  alarmClock.add(acBody, acFace, bellL, bellR, acHand);
  root.add(alarmClock);

  return {
    root,
    update(shotId, localSec, p) {
      acHand.rotation.z = -0.8 - localSec * 0.45;
      lampShade.material.emissiveIntensity = 0.80 + 0.06 * Math.sin(localSec * 3.0);
    }
  };
}

// ============================================================================
// WORLD 2B: OCHRE EVIDENCE & INFANT COMPARISON TABLETOP (S06, S07, S26, S32)
// ============================================================================
export function buildEvidenceBoardWorld() {
  const root = new THREE.Group();
  const ochreBg = new THREE.Mesh(new THREE.PlaneGeometry(11, 18), getOchreBoardMat());
  ochreBg.position.z = -1.05;
  ochreBg.receiveShadow = true;
  root.add(ochreBg);

  const deskLedge = new THREE.Mesh(new THREE.BoxGeometry(10, 0.55, 3.2), getWoodMat('walnut'));
  deskLedge.position.set(0, -2.62, 0);
  deskLedge.receiveShadow = true;
  root.add(deskLedge);

  // S26 Infant Feeding Bottle Comparison Group (Plain Water < 6 Mo Crossed Out vs. Milk Formula)
  const infantGroup = new THREE.Group();
  const mkBabyBottle = (x, liquidHex, liquidAlpha, labelTxt, badgeHex) => {
    const g = new THREE.Group();
    g.position.set(x, -0.65, 0.1);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 1.55, 32), getClearGlassMat(0.32));
    body.castShadow = true;
    const fill = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.40, 1.18, 28),
      liquidAlpha > 0.92
        ? new THREE.MeshStandardMaterial({ color: liquidHex, roughness: 0.35 })
        : getWaterLiquidMat(liquidHex, liquidAlpha)
    );
    fill.position.y = -0.14;
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.22, 28),
      new THREE.MeshStandardMaterial({ color: badgeHex, roughness: 0.35 })
    );
    collar.position.y = 0.86;
    const nipple = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.16, 0.28, 12, 20),
      new THREE.MeshStandardMaterial({ color: 0xF3D7AC, roughness: 0.45, transparent: true, opacity: 0.85 })
    );
    nipple.position.y = 1.15;

    const plaqueTex = makeLabelTex(340, 96, (ctx, w, h) => {
      ctx.fillStyle = '#241B12'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#D8A94B'; ctx.lineWidth = 6; ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#FFF5DE'; ctx.font = '700 30px "OswaldBold"';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(labelTxt, w / 2, h / 2 + 2);
    });
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.40, 0.08), new THREE.MeshStandardMaterial({ map: plaqueTex.tex }));
    plaque.position.set(0, -1.28, 0.25);

    g.add(body, fill, collar, nipple, plaque);
    return g;
  };

  const waterBaby = mkBabyBottle(-0.64, 0x5AD2FF, 0.78, 'PLAIN WATER: NO!', 0xD62824);
  // Bold 3D Red Prohibition Ring + Slash over Plain Water Infant Bottle
  const noRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.075, 18, 44),
    new THREE.MeshStandardMaterial({ color: 0xDC221E, roughness: 0.3 })
  );
  noRing.position.set(-0.64, -0.52, 0.62);
  const noSlash = new THREE.Mesh(
    new THREE.BoxGeometry(1.10, 0.12, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xDC221E, roughness: 0.3 })
  );
  noSlash.rotation.z = -Math.PI / 4;
  noSlash.position.set(-0.64, -0.52, 0.64);

  const milkBaby = mkBabyBottle(0.64, 0xFAF1DC, 0.98, 'MILK ONLY: SAFE', 0x228B4E);
  infantGroup.add(waterBaby, noRing, noSlash, milkBaby);
  root.add(infantGroup);

  return {
    root,
    update(shotId, localSec, p) {
      infantGroup.visible = shotId === 'S26';
      deskLedge.visible = shotId === 'S26';
      if (shotId === 'S26') {
        const pop = easeOutCubic(clamp(localSec / 0.5));
        noRing.scale.setScalar(pop);
        noSlash.scale.setScalar(pop);
      }
    }
  };
}

// ============================================================================
// WORLD 6B: INDUSTRIAL GREEN BRAINSTEM SWITCHBOARD & ICU MONITOR (S23 - S24)
// (Direct homage to strip_08.jpg f2250..2325 & f2925..3000)
// ============================================================================
export function buildSwitchboardIcuWorld() {
  const root = new THREE.Group();
  const brass = getBrassMat();
  const darkBrass = getDarkBrassMat();

  // --- S23: Riveted Green Steel Brainstem Switchboard ---
  const boardGroup = new THREE.Group();
  const steelWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 16), getSwitchboardSteelMat());
  steelWall.position.z = -0.55;
  steelWall.receiveShadow = true;
  boardGroup.add(steelWall);

  const channels = [
    { x: -0.92, name: 'BREATHING', delay: 0.45 },
    { x: 0.0,   name: 'HEARTBEAT', delay: 0.95 },
    { x: 0.92,  name: 'WAKE',      delay: 1.40 }
  ];
  const switches = [];

  for (const ch of channels) {
    const unit = new THREE.Group();
    unit.position.set(ch.x, 0.05, 0);

    // Recessed glass relay window with copper coils inside (strip_08.jpg f2250!)
    const boxFrame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.15, 0.24), darkBrass);
    boxFrame.position.y = 0.42;
    boxFrame.castShadow = true;
    const recess = new THREE.Mesh(
      new THREE.PlaneGeometry(0.66, 0.96),
      new THREE.MeshStandardMaterial({ color: 0x0C1E17, roughness: 0.7 })
    );
    recess.position.set(0, 0.42, 0.13);
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.055, 14, 32),
      new THREE.MeshStandardMaterial({ color: 0xC86D32, roughness: 0.28, metalness: 0.85 })
    );
    coil.position.set(0, 0.48, 0.15);
    const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.98), getClearGlassMat(0.24));
    glassPane.position.set(0, 0.42, 0.18);
    unit.add(boxFrame, recess, coil, glassPane);

    // Bolted White/Brass Nameplate mounted ABOVE relay window so levers NEVER obscure text!
    const plateTex = makeLabelTex(280, 88, (ctx, w, h) => {
      ctx.fillStyle = '#F5EFE0'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1B1815'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = '#141210'; ctx.font = '700 40px "OswaldBold"';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ch.name, w / 2, h / 2 + 2);
    });
    const nameplate = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.28, 0.10), new THREE.MeshStandardMaterial({ map: plateTex.tex }));
    nameplate.position.set(0, 1.22, 0.14);
    unit.add(nameplate);

    // Heavy Copper Knife-Switch Lever Pivot below window (flips from UP = ON to DOWN = OFF!)
    const leverPivot = new THREE.Group();
    leverPivot.position.set(0, -0.22, 0.24);
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.68, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xD9823B, roughness: 0.25, metalness: 0.88 })
    );
    blade.position.y = 0.30;
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.32, 20),
      new THREE.MeshStandardMaterial({ color: 0xD32F2F, roughness: 0.38 })
    );
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0.66, 0.06);
    leverPivot.add(blade, handle);
    unit.add(leverPivot);

    // Spark flash sphere
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xFFB838, transparent: true, opacity: 0 })
    );
    spark.position.set(0, -0.18, 0.32);
    unit.add(spark);

    // 5 Thick Colored Insulated Cables Hanging Downward (strip_08.jpg f2250!)
    const cableColors = [0xD92B2B, 0x246BCE, 0xE89B25, 0x209C7A, 0xC8382E];
    for (let c = 0; c < 5; c++) {
      const cx = (c - 2) * 0.145;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(cx, -0.32, 0.05),
        new THREE.Vector3(cx * 1.08, -1.55, 0.12 + (c % 2) * 0.06),
        new THREE.Vector3(cx * 0.96, -3.20, 0.08)
      ]);
      const cable = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 24, 0.046, 12, false),
        new THREE.MeshStandardMaterial({ color: cableColors[c], roughness: 0.42 })
      );
      cable.castShadow = true;
      unit.add(cable);
    }

    boardGroup.add(unit);
    switches.push({ leverPivot, spark, delay: ch.delay });
  }
  root.add(boardGroup);

  // --- S24: ICU Bedside Cardiac Monitor Flatlining ---
  const icuGroup = new THREE.Group();
  const wardWall = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 16),
    new THREE.MeshStandardMaterial({ color: 0x192C38, roughness: 0.82 })
  );
  wardWall.position.z = -1.4;
  icuGroup.add(wardWall);

  const monChassis = new THREE.Mesh(
    new THREE.BoxGeometry(3.45, 2.35, 0.45),
    new THREE.MeshStandardMaterial({ color: 0xD7DFE4, roughness: 0.38, metalness: 0.25 })
  );
  monChassis.position.set(0, 0.15, 0);
  monChassis.castShadow = true;
  icuGroup.add(monChassis);

  const ecgTexObj = makeLabelTex(640, 420, () => {});
  const monScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.05, 1.95),
    new THREE.MeshBasicMaterial({ map: ecgTexObj.tex })
  );
  monScreen.position.set(0, 0.15, 0.24);
  icuGroup.add(monScreen);

  // Lower hospital bed rail & teal sheet hint
  const bedSheet = new THREE.Mesh(
    new THREE.BoxGeometry(6.0, 0.9, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x1E6E76, roughness: 0.78 })
  );
  bedSheet.position.set(0, -2.25, 0.35);
  icuGroup.add(bedSheet);

  root.add(icuGroup);

  function renderEcgScreen(localSec) {
    const { ctx, canvas, tex } = ecgTexObj;
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#071014';
    ctx.fillRect(0, 0, w, h);

    // Subtle clinical grid
    ctx.strokeStyle = 'rgba(56, 128, 112, 0.20)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const flatProg = clamp((localSec - 1.05) / 0.85);
    const hrVal = flatProg > 0.75 ? '00' : String(Math.round(lerp(52, 0, flatProg))).padStart(2, '0');

    // ECG Green Waveform (top half)
    ctx.strokeStyle = flatProg > 0.75 ? '#FF3B36' : '#39FF88';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 5;
    ctx.beginPath();
    const sweepX = ((localSec * 240) % w);
    for (let x = 0; x < w; x += 3) {
      let amp = 0;
      if (x < w * 0.42 && flatProg < 0.85) {
        const ph = (x % 150) / 150;
        if (ph > 0.42 && ph < 0.46) amp = -68 * (1 - flatProg);
        else if (ph >= 0.46 && ph < 0.50) amp = 32 * (1 - flatProg);
        else if (ph > 0.62 && ph < 0.72) amp = -18 * Math.sin(((ph - 0.62) / 0.10) * Math.PI) * (1 - flatProg);
      }
      const y = 135 + amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Respiration Cyan Waveform (bottom half) -> Flatline
    ctx.strokeStyle = '#45D4FF';
    ctx.shadowColor = '#45D4FF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x < w; x += 4) {
      const respAmp = x < w * 0.38 ? Math.sin(x * 0.04) * 28 * (1 - flatProg) : 0;
      const y = 305 + respAmp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.textAlign = 'right';
    ctx.fillStyle = flatProg > 0.75 ? '#FF443E' : '#39FF88';
    ctx.font = '700 66px "SpaceMonoBold"';
    ctx.fillText(hrVal, w - 26, 95);
    ctx.font = '700 24px "OswaldBold"';
    ctx.fillText('HR BPM', w - 28, 36);

    ctx.fillStyle = '#45D4FF';
    ctx.font = '700 54px "SpaceMonoBold"';
    ctx.fillText(flatProg > 0.75 ? '00' : '04', w - 26, 285);
    ctx.font = '700 24px "OswaldBold"';
    ctx.fillText('RESP', w - 28, 232);

    // Cursor dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(Math.min(w - 10, sweepX), 135, 6, 0, Math.PI * 2); ctx.fill();
    tex.needsUpdate = true;
  }

  return {
    root,
    update(shotId, localSec, p) {
      boardGroup.visible = shotId === 'S23';
      icuGroup.visible = shotId === 'S24';

      if (shotId === 'S23') {
        for (const sw of switches) {
          const trip = easeOutCubic(clamp((localSec - sw.delay) / 0.28));
          // 0.15 rad (UP = ON) -> 2.65 rad (DOWN = OFF toward viewer!)
          sw.leverPivot.rotation.x = lerp(0.15, 2.55, trip);
          const sp = localSec >= sw.delay && localSec <= sw.delay + 0.26 ? Math.sin(((localSec - sw.delay) / 0.26) * Math.PI) : 0;
          sw.spark.material.opacity = sp;
          sw.spark.scale.setScalar(0.6 + sp * 1.4);
        }
      } else if (shotId === 'S24') {
        renderEcgScreen(localSec);
      }
    }
  };
}

// ============================================================================
// WORLD 7: MARATHON HYDRATION TABLE & ICU 3% HYPERTONIC SALINE DRIP (S25, S27)
// ============================================================================
export function buildRealCasesIcuWorld() {
  const root = new THREE.Group();
  const steel = getBrushedSteelMat();

  // --- S25: Marathon Road Hydration Station ---
  const marathonGroup = new THREE.Group();
  const asphalt = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.4, 6.0),
    new THREE.MeshStandardMaterial({ color: 0x262B31, roughness: 0.88 })
  );
  asphalt.position.set(0, -1.35, 0);
  asphalt.receiveShadow = true;
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.18), new THREE.MeshBasicMaterial({ color: 0xF5D042 }));
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, -1.14, 1.35);
  marathonGroup.add(asphalt, stripe);

  const raceTable = new THREE.Mesh(
    new THREE.BoxGeometry(3.85, 0.14, 1.45),
    new THREE.MeshStandardMaterial({ color: 0x165B9E, roughness: 0.55 })
  );
  raceTable.position.set(0, -0.05, 0.15);
  raceTable.castShadow = true;
  marathonGroup.add(raceTable);

  // 12 Paper Race Cups with Blue Band & Water Meniscus
  const cupTex = makeLabelTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#F7F9FB'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1877D2'; ctx.fillRect(0, 38, w, 34);
  });
  const cupMat = new THREE.MeshStandardMaterial({ map: cupTex.tex, roughness: 0.65 });
  const cups = [];
  for (let i = 0; i < 12; i++) {
    const cg = new THREE.Group();
    const row = Math.floor(i / 6);
    const col = i % 6;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.115, 0.42, 24), cupMat);
    body.castShadow = true;
    const wTop = new THREE.Mesh(new THREE.CircleGeometry(0.145, 20), getWaterLiquidMat(0x47CBFF, 0.85));
    wTop.rotation.x = -Math.PI / 2;
    wTop.position.y = 0.16;
    cg.add(body, wTop);
    cg.position.set(-1.35 + col * 0.54 + row * 0.12, 0.23, -0.15 + row * 0.46);
    if (i === 5 || i === 10) {
      cg.rotation.z = Math.PI * 0.46;
      cg.position.y = 0.14;
      wTop.visible = false;
    }
    marathonGroup.add(cg);
    cups.push(cg);
  }
  root.add(marathonGroup);

  // --- S27: Hospital ICU 3% Hypertonic Saline IV Bag & Drip Chamber ---
  const ivGroup = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5.5, 20), steel);
  pole.position.set(-1.15, 0, -0.25);
  const hookBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35, 16), steel);
  hookBar.rotation.z = Math.PI / 2;
  hookBar.position.set(-0.52, 2.05, -0.1);
  ivGroup.add(pole, hookBar);

  // Sculpted Clear IV Bag + Printed Medical Label ("3% NaCl HYPERTONIC SALINE")
  const bagShell = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.68, 0.95, 18, 32),
    getClearGlassMat(0.36, 0xE6F7FF)
  );
  bagShell.scale.set(1.05, 1.0, 0.36);
  bagShell.position.set(0.08, 0.82, 0.1);
  ivGroup.add(bagShell);

  const bagLiquid = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.62, 0.72, 16, 28),
    getWaterLiquidMat(0xF5C249, 0.72)
  );
  bagLiquid.scale.set(1.02, 0.92, 0.32);
  bagLiquid.position.set(0.08, 0.72, 0.1);
  ivGroup.add(bagLiquid);

  const ivLabel = makeLabelTex(384, 448, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(250, 252, 255, 0.94)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(0, 0, w, 68);
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = '700 30px "OswaldBold"';
    ctx.fillText('ICU EMERGENCY BOLUS', w / 2, 45);

    ctx.fillStyle = '#102027';
    ctx.font = '700 92px "Anton"';
    ctx.fillText('3% NaCl', w / 2, 185);

    ctx.fillStyle = '#0277BD';
    ctx.font = '700 34px "OswaldBold"';
    ctx.fillText('HYPERTONIC SALINE', w / 2, 248);

    ctx.fillStyle = '#37474F';
    ctx.font = '700 24px "SpaceMonoBold"';
    ctx.fillText('513 mmol/L SODIUM', w / 2, 315);
    ctx.fillText('100 mL IV INFUSION', w / 2, 355);
    ctx.fillStyle = '#1B5E20';
    ctx.fillText('PULLS BRAIN FLUID OUT', w / 2, 410);
  });
  const labelPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.08, 1.26),
    new THREE.MeshStandardMaterial({ map: ivLabel.tex, roughness: 0.35 })
  );
  labelPlane.position.set(0.08, 0.82, 0.36);
  ivGroup.add(labelPlane);

  // Drip Chamber + Falling Saline Drop + IV Tubing
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.62, 24), getClearGlassMat(0.38));
  chamber.position.set(0.08, -0.58, 0.1);
  const fallingDrop = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), getWaterLiquidMat(0xFFCA4B, 0.95));
  ivGroup.add(chamber, fallingDrop);

  const ivTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 1.85, 14),
    getClearGlassMat(0.48, 0xFFF2C8)
  );
  ivTube.position.set(0.08, -1.75, 0.1);
  ivGroup.add(ivTube);

  root.add(ivGroup);

  return {
    root,
    update(shotId, localSec, p) {
      marathonGroup.visible = shotId === 'S25';
      ivGroup.visible = shotId === 'S27';
      if (shotId === 'S27') {
        const dy = ((localSec * 1.8) % 1.0);
        fallingDrop.position.set(0.08, lerp(-0.32, -0.82, dy), 0.1);
      }
    }
  };
}

// ============================================================================
// WORLD 8: THE 3 GOLDEN HYDRATION RULES & BRASS BALANCE SCALE (S28 - S31)
// ============================================================================
export function buildHydrationRulesWorld() {
  const root = new THREE.Group();
  const walnut = getWoodMat('walnut');
  const oak = getWoodMat('oak');
  const brass = getBrassMat();
  const glass = getClearGlassMat(0.34);

  const bench = new THREE.Mesh(new THREE.BoxGeometry(10, 0.55, 4.2), walnut);
  bench.position.set(0, -1.95, 0);
  bench.receiveShadow = true;
  root.add(bench);

  // --- S28: 1000 mL Etched Graduated Cylinder Stopping at "MAX 800 mL / HR" + Brass Stopwatch ---
  const rule1Group = new THREE.Group();
  const cylBase = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.74, 0.14, 36), glass);
  cylBase.position.set(-0.38, -1.60, 0.1);
  const cylBody = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 2.75, 36, 1, true), glass);
  cylBody.position.set(-0.38, -0.18, 0.1);

  const scaleTex = makeLabelTex(256, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 26px "SpaceMonoBold"';
    ctx.textAlign = 'left';
    for (let ml = 200; ml <= 1000; ml += 100) {
      const y = h - (ml / 1100) * h;
      ctx.lineWidth = ml % 200 === 0 ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(ml % 200 === 0 ? 105 : 78, y); ctx.stroke();
      if (ml % 200 === 0) ctx.fillText(`${ml}`, 114, y + 8);
    }
    // Glowing green MAX 800 mL line
    const y800 = h - (800 / 1100) * h;
    ctx.strokeStyle = '#35FF96';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(15, y800); ctx.lineTo(240, y800); ctx.stroke();
  });
  const scaleWrap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.47, 2.55, 32, 1, true, -0.7, 1.4),
    new THREE.MeshBasicMaterial({ map: scaleTex.tex, transparent: true, depthWrite: false })
  );
  scaleWrap.position.set(-0.38, -0.18, 0.1);

  const cylWater = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 28), getWaterLiquidMat(0x46CBFF, 0.82));
  const ring800 = new THREE.Mesh(
    new THREE.TorusGeometry(0.49, 0.032, 14, 36),
    new THREE.MeshStandardMaterial({ color: 0x2CE68B, emissive: 0x109955, emissiveIntensity: 0.65 })
  );
  ring800.rotation.x = Math.PI / 2;
  ring800.position.set(-0.38, 0.36, 0.1);

  // Brass Pocket Stopwatch beside Cylinder
  const watch = buildBrassDialGauge({ radius: 0.54, title: '1 HOUR', subLeft: 'SAFE', subRight: '60m' });
  watch.group.position.set(0.96, -1.05, 0.25);
  rule1Group.add(cylBase, cylBody, scaleWrap, cylWater, ring800, watch.group);
  root.add(rule1Group);

  // --- S29: Crystal Tumbler + Dropping Effervescent ORS Tablet + Fizz Bubbles ---
  const rule2Group = new THREE.Group();
  const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.46, 1.65, 32, 1, true), glass);
  tumbler.position.set(-0.52, -0.82, 0.15);
  const tumblerWater = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.43, 1.30, 28), getWaterLiquidMat(0x5BD4FF, 0.76));
  tumblerWater.position.set(-0.52, -0.96, 0.15);

  const orsTab = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.11, 28),
    new THREE.MeshStandardMaterial({ color: 0xFFA726, emissive: 0xAA5500, emissiveIntensity: 0.35, roughness: 0.4 })
  );
  orsTab.rotation.x = 0.5;

  const fizzBubbles = [];
  const fizzGeo = new THREE.SphereGeometry(0.042, 12, 12);
  const fizzMat = new THREE.MeshStandardMaterial({ color: 0xFFE58F, emissive: 0xFFAA22, emissiveIntensity: 0.45 });
  for (let i = 0; i < 26; i++) {
    const b = new THREE.Mesh(fizzGeo, fizzMat);
    rule2Group.add(b);
    fizzBubbles.push({ mesh: b, off: i / 26, ang: i * 1.7, r: 0.08 + (i % 5) * 0.06 });
  }

  // Printed ORS Electrolyte Packet beside glass
  const pktTex = makeLabelTex(256, 340, (ctx, w, h) => {
    ctx.fillStyle = '#F57C00'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#E65100'; ctx.textAlign = 'center';
    ctx.font = '700 68px "Anton"'; ctx.fillText('ORS', w / 2, 125);
    ctx.fillStyle = '#1E272C'; ctx.font = '700 28px "OswaldBold"';
    ctx.fillText('SODIUM +', w / 2, 195);
    ctx.fillText('POTASSIUM', w / 2, 235);
    ctx.fillStyle = '#1565C0'; ctx.font = '700 24px "SpaceMonoBold"';
    ctx.fillText('ELECTROLYTES', w / 2, 292);
  });
  const orsPacket = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 1.14, 0.12),
    new THREE.MeshStandardMaterial({ map: pktTex.tex, roughness: 0.35 })
  );
  orsPacket.position.set(0.56, -1.06, 0.25);
  orsPacket.rotation.y = -0.22;
  orsPacket.rotation.z = -0.06;
  rule2Group.add(tumbler, tumblerWater, orsTab, orsPacket);
  root.add(rule2Group);

  // --- S30: Walnut 5-Test-Tube Clinical Hydration Spectrum Rack ---
  const rule3Group = new THREE.Group();
  const rackBottom = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.18, 0.72), oak);
  rackBottom.position.set(0, -1.58, 0.15);
  const rackMid = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.12, 0.72), oak);
  rackMid.position.set(0, -0.35, 0.15);
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.35, 16), brass);
  postL.position.set(-1.58, -0.96, 0.15);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.35, 16), brass);
  postR.position.set(1.58, -0.96, 0.15);
  rule3Group.add(rackBottom, rackMid, postL, postR);

  const tubeSpecs = [
    { x: -1.16, hex: 0xE6F9FF, alpha: 0.45, tag: 'CLEAR' },
    { x: -0.58, hex: 0xF7EEA6, alpha: 0.82, tag: 'IDEAL' },
    { x:  0.00, hex: 0xF2DC74, alpha: 0.86, tag: 'IDEAL' },
    { x:  0.58, hex: 0xD99424, alpha: 0.90, tag: 'LOW' },
    { x:  1.16, hex: 0x9C4F0E, alpha: 0.94, tag: 'DRY' }
  ];
  for (const sp of tubeSpecs) {
    const tGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 1.75, 24), glass);
    tGlass.position.set(sp.x, -0.62, 0.15);
    const tLiq = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 1.32, 20), getWaterLiquidMat(sp.hex, sp.alpha));
    tLiq.position.set(sp.x, -0.80, 0.15);
    rule3Group.add(tGlass, tLiq);
  }

  // Brass "IDEAL PALE STRAW" Bracket framing Tubes 2 & 3!
  const idealBracket = new THREE.Mesh(
    new THREE.BoxGeometry(1.16, 1.98, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x35E88A, emissive: 0x128848, emissiveIntensity: 0.55, wireframe: true })
  );
  idealBracket.position.set(-0.29, -0.60, 0.42);
  rule3Group.add(idealBracket);
  root.add(rule3Group);

  // --- S31: Turned Brass Apothecaries' Balance Scale (Water Carafe == Salt Crystals) ---
  const scaleGroup = new THREE.Group();
  const ochreBack = new THREE.Mesh(new THREE.PlaneGeometry(11, 18), getOchreBoardMat());
  ochreBack.position.z = -1.1;
  scaleGroup.add(ochreBack);

  const scaleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.08, 0.22, 40), brass);
  scaleBase.position.set(0, -1.56, 0.1);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 2.35, 24), brass);
  pillar.position.set(0, -0.35, 0.1);
  scaleGroup.add(scaleBase, pillar);

  const beamPivot = new THREE.Group();
  beamPivot.position.set(0, 0.72, 0.1);
  const beamBar = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 1.92, 20), brass);
  beamBar.rotation.z = Math.PI / 2;
  beamPivot.add(beamBar);

  // Left Pan (Water Vessel) & Right Pan (White Salt Crystals)
  const makePan = (x, isWater) => {
    const pg = new THREE.Group();
    pg.position.set(x, 0, 0);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.15, 10), brass);
    cord.position.y = -0.58;
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.40, 0.10, 32), brass);
    dish.position.y = -1.16;
    pg.add(cord, dish);

    if (isWater) {
      const carafe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 0.65, 24), glass);
      carafe.position.y = -0.78;
      const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.26, 0.50, 20), getWaterLiquidMat(0x45C9FF, 0.85));
      cw.position.y = -0.84;
      pg.add(carafe, cw);
    } else {
      const saltMat = new THREE.MeshStandardMaterial({ color: 0xFAF8F2, roughness: 0.22, metalness: 0.1 });
      for (const [sx, sy, sz, sr] of [[0, -0.96, 0, 0.22], [-0.18, -1.02, 0.1, 0.16], [0.18, -1.01, -0.06, 0.17], [0.04, -0.80, 0.04, 0.15]]) {
        const cube = new THREE.Mesh(new THREE.BoxGeometry(sr, sr, sr), saltMat);
        cube.position.set(sx, sy, sz);
        cube.rotation.set(0.3, 0.5, 0.2);
        pg.add(cube);
      }
    }
    return pg;
  };
  const leftPan = makePan(-0.88, true);
  const rightPan = makePan(0.88, false);
  beamPivot.add(leftPan, rightPan);
  scaleGroup.add(beamPivot);
  root.add(scaleGroup);

  return {
    root,
    update(shotId, localSec, p) {
      bench.visible = shotId !== 'S32';
      rule1Group.visible = shotId === 'S28';
      rule2Group.visible = shotId === 'S29';
      rule3Group.visible = shotId === 'S30';
      scaleGroup.visible = shotId === 'S31';

      if (shotId === 'S28') {
        // Rises smoothly to 800 mL green ring and stops cleanly!
        const k = easeOutCubic(clamp(localSec / 1.8));
        const hVal = lerp(0.45, 1.90, k);
        cylWater.scale.y = hVal;
        cylWater.position.set(-0.38, -1.52 + hVal * 0.5, 0.1);
        watch.needlePivot.rotation.z = -localSec * 1.1;
      } else if (shotId === 'S29') {
        const drop = clamp(localSec / 0.65);
        orsTab.position.set(-0.52, lerp(0.55, -1.42, easeOutCubic(drop)), 0.15);
        const s = clamp(1.0 - Math.max(0, localSec - 0.65) * 0.22, 0.35, 1.0);
        orsTab.scale.setScalar(s);
        tumblerWater.material.color.setHex(localSec > 0.7 ? 0x62DEEE : 0x5BD4FF);

        for (const fb of fizzBubbles) {
          fb.mesh.visible = localSec > 0.55;
          const u = ((localSec - 0.55) * 0.85 + fb.off) % 1.0;
          fb.mesh.position.set(
            -0.52 + Math.cos(fb.ang + u * 5) * fb.r,
            lerp(-1.45, -0.28, u),
            0.15 + Math.sin(fb.ang + u * 5) * fb.r
          );
        }
      } else if (shotId === 'S30') {
        idealBracket.position.y = -0.60 + Math.sin(localSec * 5) * 0.025;
      } else if (shotId === 'S31') {
        // Damped harmonic oscillation settling into dead-level 0.0 equilibrium!
        const tilt = Math.exp(-localSec * 1.45) * Math.sin(localSec * 4.2) * 0.24;
        beamPivot.rotation.z = tilt;
        leftPan.rotation.z = -tilt;
        rightPan.rotation.z = -tilt;
      }
    }
  };
}
