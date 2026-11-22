// All 35 Bespoke Pure-Code Era-2 3D Diorama Scenes for "Fried Rice Syndrome" (v13.2 — Reference Parity Polish)
// ZERO dark sci-fi HUD boxes, ZERO edge-clipped heroes, ZERO low-poly origami rice, crisp procedural instrument dials!
import {
  W, H, clamp, lerp, easeOutCubic, easeOutExpo, easeInOutCubic,
  PALETTES, drawEra2Chrome
} from './dossier.js';
import { drawEra2Headline, drawPaperTag, drawDimensionCaliper } from './type.js';
import {
  drawSplitFlapBoard, drawTornNote, drawRubberStamp, drawJournalCard,
  drawChecklistBoard, drawFamilyShareCard
} from './props.js';
import { getCore3D, configureStageMood, evalCamera3D, renderWebGLTo2D } from './core3d.js';
import {
  buildKitchenCounterDiorama3D, buildWokReheat3D, buildBedroomNightstand3D,
  buildClinicalBottle3D, buildRiceGrainMacro3D, buildBacillusColony3D,
  buildPaddyFieldCutaway3D, buildRawRiceJar3D, buildEndosporeCutaway3D,
  buildBoilingPot3D, buildThermometer3D, buildCereulideRing3D,
  buildSplitReheatPedestals3D, buildStomachFlask3D, buildArteryGauge3D,
  buildMitochondrion3D, buildStopwatch3D, buildLiverSpecimen3D,
  buildStarchTrio3D, buildShallowVsDeep3D, buildRefrigerator3D
} from './models3d.js';

let _pool = null;

function getPool3D() {
  if (_pool) return _pool;
  const { stageGroup } = getCore3D();

  const pool = {
    kitchen:      buildKitchenCounterDiorama3D(),
    wok:          buildWokReheat3D(),
    bedroom:      buildBedroomNightstand3D(),
    bottle:       buildClinicalBottle3D(),
    riceMacro:    buildRiceGrainMacro3D(),
    bacillus:     buildBacillusColony3D(),
    paddy:        buildPaddyFieldCutaway3D(),
    rawJar:       buildRawRiceJar3D(),
    endospore:    buildEndosporeCutaway3D(),
    boilingPot:   buildBoilingPot3D(),
    thermometer:  buildThermometer3D(),
    cereulide:    buildCereulideRing3D(),
    splitReheat:  buildSplitReheatPedestals3D(),
    stomach:      buildStomachFlask3D(),
    arteryGauge:  buildArteryGauge3D(),
    mitochondria: buildMitochondrion3D(),
    stopwatch:    buildStopwatch3D(),
    liver:        buildLiverSpecimen3D(),
    starchTrio:   buildStarchTrio3D(),
    shallowDeep:  buildShallowVsDeep3D(),
    fridge:       buildRefrigerator3D()
  };

  Object.values(pool).forEach((g) => {
    g.visible = false;
    stageGroup.add(g);
  });
  _pool = pool;
  return _pool;
}

export const SHOTS = [
  { id: 1,  t0: 0.00,   t1: 3.80,   pal: 'midnightIndigo', tier1: 'LEFTOVER RICE',     tier2: 'ON THE COUNTER',    accent: '#F7C137' },
  { id: 2,  t0: 3.80,   t1: 6.80,   pal: 'goldenOchre',    tier1: 'NEXT MORNING',      tier2: 'JUST REHEAT IT',    accent: '#B81B10' },
  { id: 3,  t0: 6.80,   t1: 10.20,  pal: 'midnightIndigo', tier1: 'OCTOBER 2008',      tier2: 'BRUSSELS',          accent: '#F7C137' },
  { id: 4,  t0: 10.20,  t1: 13.40,  pal: 'midnightIndigo', tier1: 'WITHIN 10 HOURS',   tier2: 'HE NEVER WOKE UP',  accent: '#FF5A36' },
  { id: 5,  t0: 13.40,  t1: 16.60,  pal: 'goldenOchre',    tier1: 'THE CAUSE?',        tier2: 'NOT POISON',        accent: '#B81B10' },
  { id: 6,  t0: 16.60,  t1: 19.60,  pal: 'velvetCrimson',  tier1: 'FRIED RICE',        tier2: 'SYNDROME',          accent: '#F7C137' },
  { id: 7,  t0: 19.60,  t1: 22.80,  pal: 'warmKraft',      tier1: 'EVERYONE THINKS',   tier2: 'HEAT KILLS GERMS',  accent: '#B81B10' },
  { id: 8,  t0: 22.80,  t1: 26.00,  pal: 'goldenOchre',    tier1: 'MEET THE CULPRIT',  tier2: 'BACILLUS CEREUS',   accent: '#B81B10' },
  { id: 9,  t0: 26.00,  t1: 29.40,  pal: 'warmKraft',      tier1: 'IT LIVES IN',       tier2: 'THE SOIL',          accent: '#185A3B' },
  { id: 10, t0: 29.40,  t1: 32.60,  pal: 'goldenOchre',    tier1: 'EVEN INSIDE',       tier2: 'DRY RAW RICE',      accent: '#B81B10' },
  { id: 11, t0: 32.60,  t1: 36.20,  pal: 'volcanicAmber',  tier1: 'ARMORED SHELLS',    tier2: 'ENDOSPORES',        accent: '#F7C137' },
  { id: 12, t0: 36.20,  t1: 39.80,  pal: 'volcanicAmber',  tier1: 'BOILING AT 100°C',  tier2: 'STILL ALIVE!',      accent: '#FF7038' },
  { id: 13, t0: 39.80,  t1: 43.20,  pal: 'goldenOchre',    tier1: 'HEAT ACTUALLY',     tier2: 'WAKES THEM UP',     accent: '#B81B10' },
  { id: 14, t0: 43.20,  t1: 46.80,  pal: 'midnightIndigo', tier1: 'YOU LEAVE RICE',    tier2: 'OUT TO COOL',       accent: '#F7C137' },
  { id: 15, t0: 46.80,  t1: 50.60,  pal: 'volcanicAmber',  tier1: '4°C TO 60°C',       tier2: 'DANGER ZONE',       accent: '#FF5A36' },
  { id: 16, t0: 50.60,  t1: 54.20,  pal: 'velvetCrimson',  tier1: 'EVERY 20 MINUTES',  tier2: 'THEY DOUBLE',       accent: '#F7C137' },
  { id: 17, t0: 54.20,  t1: 57.60,  pal: 'goldenOchre',    tier1: 'IN JUST 6 HOURS',   tier2: 'MILLIONS!',         accent: '#B81B10' },
  { id: 18, t0: 57.60,  t1: 61.00,  pal: 'velvetCrimson',  tier1: 'NO BAD SMELL',      tier2: 'LOOKS NORMAL',      accent: '#F7C137' },
  { id: 19, t0: 61.00,  t1: 65.20,  pal: 'velvetCrimson',  tier1: 'THE REAL WEAPON',   tier2: 'CEREULIDE TOXIN',   accent: '#F7C137' },
  { id: 20, t0: 65.20,  t1: 68.80,  pal: 'volcanicAmber',  tier1: 'SURVIVES 121°C',    tier2: 'UNBREAKABLE RING',  accent: '#FF7038' },
  { id: 21, t0: 68.80,  t1: 72.20,  pal: 'goldenOchre',    tier1: 'REHEATING KILLS',   tier2: 'ONLY BACTERIA',     accent: '#B81B10' },
  { id: 22, t0: 72.20,  t1: 75.40,  pal: 'velvetCrimson',  tier1: 'STOMACH ACID',      tier2: "CAN'T BREAK IT",    accent: '#F7C137' },
  { id: 23, t0: 75.40,  t1: 79.20,  pal: 'velvetCrimson',  tier1: 'STRAIGHT INTO',     tier2: 'YOUR BLOODSTREAM',  accent: '#52D1F0' },
  { id: 24, t0: 79.20,  t1: 83.60,  pal: 'velvetCrimson',  tier1: 'IT ATTACKS',        tier2: 'MITOCHONDRIA',      accent: '#F7C137' },
  { id: 25, t0: 83.60,  t1: 87.20,  pal: 'volcanicAmber',  tier1: 'POTASSIUM FLOOD',   tier2: 'POWER SHUTDOWN',    accent: '#FF5A36' },
  { id: 26, t0: 87.20,  t1: 90.40,  pal: 'goldenOchre',    tier1: 'MOST CASES',        tier2: '1 TO 5 HOURS',      accent: '#B81B10' },
  { id: 27, t0: 90.40,  t1: 93.80,  pal: 'velvetCrimson',  tier1: 'HIGH DOSE',         tier2: 'LIVER FAILURE',     accent: '#FF5A36' },
  { id: 28, t0: 93.80,  t1: 96.80,  pal: 'goldenOchre',    tier1: 'NOT JUST RICE',     tier2: 'PASTA & NOODLES',   accent: '#B81B10' },
  { id: 29, t0: 96.80,  t1: 99.80,  pal: 'midnightIndigo', tier1: 'BACHNE KE',         tier2: '3 SIMPLE RULES',    accent: '#4AE3B5' },
  { id: 30, t0: 99.80,  t1: 103.20, pal: 'emeraldLab',     tier1: 'RULE 1',            tier2: 'COOL SHALLOW',      accent: '#4AE3B5' },
  { id: 31, t0: 103.20, t1: 106.80, pal: 'emeraldLab',     tier1: 'RULE 2',            tier2: 'FRIDGE IN 2 HRS',   accent: '#52D1F0' },
  { id: 32, t0: 106.80, t1: 110.20, pal: 'emeraldLab',     tier1: 'BELOW 4°C',         tier2: 'SPORES SLEEP',      accent: '#52D1F0' },
  { id: 33, t0: 110.20, t1: 113.40, pal: 'midnightIndigo', tier1: 'RULE 3',            tier2: 'OVER 2 HRS? TOSS!', accent: '#FF5A36' },
  { id: 34, t0: 113.40, t1: 116.80, pal: 'midnightIndigo', tier1: 'NEXT TIME YOU',     tier2: 'LEAVE RICE OUT',    accent: '#F7C137' },
  { id: 35, t0: 116.80, t1: 120.00, pal: 'emeraldLab',     tier1: 'SEND THIS TO',      tier2: 'YOUR FAMILY!',      accent: '#F7C137' }
];

export function renderAtTime(ctx, t) {
  const ct = clamp(t, 0, 119.999);
  const shot = SHOTS.find(s => ct >= s.t0 && ct < s.t1) || SHOTS[SHOTS.length - 1];
  const localT = ct - shot.t0;
  const dur = shot.t1 - shot.t0;
  const p = clamp(localT / dur);
  const pal = PALETTES[shot.pal] || PALETTES.goldenOchre;

  const pool = getPool3D();
  Object.values(pool).forEach(g => { g.visible = false; });

  const spec = stageShot3D(pool, shot.id, { t: ct, localT, dur, p, pal, shot });
  configureStageMood(shot.pal, ct, spec.shadowFloor !== false);

  const camState = evalCamera3D(spec.cam, p, ct, spec.impact);
  renderWebGLTo2D(ctx, camState);

  if (spec.hudDraw) {
    ctx.save();
    spec.hudDraw(ctx, { t: ct, localT, dur, p, pal, shot });
    ctx.restore();
  }

  drawEra2Chrome(ctx, pal);

  drawEra2Headline(ctx, shot.tier1, shot.tier2, localT, pal, {
    accentColor: shot.accent,
    ...(spec.headlineOpts || {})
  });
}

function stageShot3D(pool, id, { t, p }) {
  switch (id) {
    // S01: Atmospheric Moonlit Kitchen Counter + Ceramic Bowl of 165 Sculpted Basmati Rice Grains
    case 1: {
      pool.kitchen.visible = true;
      const { steamGroup, handPivot } = pool.kitchen.userData;
      steamGroup.visible = true;
      steamGroup.children.forEach((pf) => {
        const u = ((t * 0.45 + pf.userData.phase) % 1);
        pf.position.set(pf.userData.bx + Math.sin(u * 4 + pf.userData.phase) * 0.14, 0.12 + u * 1.15, pf.userData.bz);
        pf.scale.setScalar(0.55 + u * 0.85);
      });
      handPivot.rotation.z = -p * 0.7;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-1.1, 0.7, 5.2], look: [0.0, -0.1, 0.0], fov: 40, roll: -0.01 },
          { p: 0.5, pos: [0.2, 0.4, 4.3],  look: [0.0, -0.2, 0.2], fov: 36, roll: 0.01 },
          { p: 1.0, pos: [0.7, 0.2, 3.8],  look: [0.0, -0.3, 0.25], fov: 33, roll: 0 }
        ]
      };
    }

    // S02: Next Morning — Cast-Iron Wok on Gas Burner Tossing Golden Basmati & Scallions
    case 2: {
      pool.wok.visible = true;
      const { tossGroup, flameGroup } = pool.wok.userData;
      flameGroup.children.forEach((fl, i) => {
        if (fl.isMesh) fl.scale.y = 0.78 + 0.36 * Math.sin(t * 22 + i);
      });
      tossGroup.children.forEach((g) => {
        const arc = Math.abs(Math.sin(t * 3.8 + g.userData.phase));
        g.position.set(g.userData.bx, -0.18 + arc * g.userData.hMax, g.userData.bz);
        g.rotation.set(t * g.userData.spin, g.userData.phase, t * 1.4);
      });
      return {
        cam: [
          { p: 0.0, pos: [-1.2, 1.1, 4.8], look: [0.1, -0.1, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [1.0, 0.8, 4.2],  look: [0.1, 0.0, 0],  fov: 36, roll: 0.02 }
        ]
      };
    }

    // S03: October 2008 Brussels — Vintage Flip-Board 2008 ABOVE Clock + Clinical Journal Clipping BELOW
    case 3: {
      pool.bedroom.visible = true;
      pool.bedroom.rotation.y = lerp(-0.12, 0.10, p);
      pool.bedroom.userData.handGroup.rotation.z = -0.5;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.2, 0.5, 5.2], look: [0.0, -0.35, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.3, 0.3, 4.6],  look: [0.0, -0.35, 0], fov: 37, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 395, ['2','0','0','0'], ['2','0','0','8'], clamp(p * 2.2), 'OCTOBER 2008 · BRUSSELS', 86, 114, 11);
          drawJournalCard(ctx, 540, 1520, 840, 260, -1.2, 'JOURNAL OF CLINICAL MICROBIOLOGY', 'Fatal Food Poisoning — Age 20', [
            'Healthy student reheated 5-day room-temp pasta.',
            'Died from acute liver necrosis within 10 hours.'
          ], 1, clamp((p - 0.22) * 2.4));
        }
      };
    }

    // S04: Within 10 Hours — Quiet Midnight Nightstand & Sweeping Numbered Twin-Bell Alarm Clock
    case 4: {
      pool.bedroom.visible = true;
      pool.bedroom.rotation.y = 0;
      pool.bedroom.userData.handGroup.rotation.z = -p * Math.PI * 1.65;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.7, 0.4, 4.6], look: [0.05, -0.35, 0.1], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.2, 0.1, 3.8],  look: [-0.08, -0.30, 0.15], fov: 34, roll: 0.01 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 760, 1520, '10 HOURS', 'LATER', 3, (p - 0.2) * 3);
        }
      };
    }

    // S05: The Cause? NOT POISON — Amber Toxicology Bottle with Crisp Label + Red Strikethrough
    case 5: {
      pool.bottle.visible = true;
      pool.bottle.rotation.y = lerp(-0.28, 0.28, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.3, 4.8], look: [0, -0.05, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.7, 0.15, 4.2], look: [0, -0.05, 0], fov: 35, roll: 0 }
        ],
        headlineOpts: { strikeP: clamp((p - 0.42) * 2.5) },
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1520, 'ZERO POISON', 'NO CHEMICALS FOUND', -2.5, (p - 0.18) * 3);
        }
      };
    }

    // S06: Fried Rice Syndrome — Macro Smooth Pearlescent Basmati Cluster + Pulsing Golden Spores
    case 6: {
      pool.riceMacro.visible = true;
      pool.riceMacro.rotation.y = lerp(-0.28, 0.42, p);
      const { sporeGroup } = pool.riceMacro.userData;
      sporeGroup.visible = true;
      sporeGroup.children.forEach((sp, i) => {
        sp.scale.setScalar(sp.userData.baseScale * (0.88 + 0.28 * Math.sin(t * 5 + i)));
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.2, 4.8], look: [0, 0, 0], fov: 38, roll: -0.02 },
          { p: 1.0, pos: [0.5, -0.1, 3.8], look: [0, 0, 0.1], fov: 33, roll: 0.02 }
        ]
      };
    }

    // S07: Myth Bust — Sizzling Wok + Handwritten Yellow Sticky Note + COMPLETELY FALSE Stamp
    case 7: {
      pool.wok.visible = true;
      const { flameGroup, tossGroup } = pool.wok.userData;
      flameGroup.children.forEach((fl, i) => {
        if (fl.isMesh) fl.scale.y = 0.8 + 0.35 * Math.sin(t * 20 + i);
      });
      tossGroup.children.forEach((g) => {
        const arc = Math.abs(Math.sin(t * 3.2 + g.userData.phase));
        g.position.set(g.userData.bx, -0.18 + arc * g.userData.hMax * 0.75, g.userData.bz);
      });
      const sp = clamp((p - 0.45) * 3.0);
      return {
        cam: [
          { p: 0.0, pos: [0, 0.8, 5.2], look: [0.1, -0.15, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.4, 0.6, 4.6], look: [0.1, -0.15, 0], fov: 37, roll: 0 }
        ],
        headlineOpts: { strikeP: sp },
        hudDraw: (ctx) => {
          drawTornNote(ctx, 540, 1340, 740, 200, -2.5, ['"GARAM KAR DIYA = SAFE"', 'NO MORE BACTERIA!'], { strikeP: sp });
          if (sp > 0.08) drawRubberStamp(ctx, 540, 1590, 'COMPLETELY FALSE!', 3, sp, '#C82818');
        }
      };
    }

    // S08: Meet The Culprit — Organic Emerald Bacillus cereus + Delicate Flagella + Caliper
    case 8: {
      pool.bacillus.visible = true;
      pool.bacillus.userData.rods.forEach((r, i) => {
        r.visible = i < 4;
        if (i < 4) {
          r.position.set(
            (i - 1.5) * 0.78,
            Math.sin(t * 2.8 + i) * 0.14,
            (i % 2 === 0 ? 0.18 : -0.18)
          );
          r.rotation.set(0.15, Math.sin(t * 1.8 + i) * 0.38, -0.25 + (i % 2) * 0.42);
        }
      });
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.4, 4.9], look: [0, -0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.7, 0.2, 4.1],  look: [0, -0.1, 0], fov: 35, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawDimensionCaliper(ctx, 270, 1440, 810, 1440, '~3 TO 5 MICRONS', false, (p - 0.18) * 3);
        }
      };
    }

    // S09: It Lives in The Soil — Sunlit Rice Paddy Cutaway (Stalks Framed Cleanly Below Headline!)
    case 9: {
      pool.paddy.visible = true;
      pool.paddy.rotation.y = lerp(-0.26, 0.24, p);
      return {
        cam: [
          { p: 0.0, pos: [-1.1, 0.9, 5.4], look: [0, -0.15, 0], fov: 40, roll: 0 },
          { p: 0.5, pos: [0.0, 0.35, 4.7], look: [0, -0.35, 0.2], fov: 37, roll: 0 },
          { p: 1.0, pos: [0.7, -0.1, 4.1], look: [0, -0.55, 0.4], fov: 34, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 740, 1520, 'SOIL SPORES', 'NATURAL HABITAT', 2, (p - 0.3) * 3);
        }
      };
    }

    // S10: Even Inside Dry Raw Rice — Clear Apothecary Jar with 240 Real Basmati Grains & Hidden Spores
    case 10: {
      pool.rawJar.visible = true;
      pool.rawJar.rotation.y = lerp(-0.24, 0.28, p);
      return {
        cam: [
          { p: 0.0, pos: [-1.0, 0.5, 5.0], look: [0, -0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.8, 0.2, 4.3],  look: [0, -0.15, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 740, 1510, 'UNCOOKED', 'ALREADY PRESENT', -2.5, (p - 0.2) * 3);
        }
      };
    }

    // S11: Armored Shells — Macro Sculpted Golden Endospore with Generous Studio Margins
    case 11: {
      pool.endospore.visible = true;
      const { leftShell, rightShell, emergingRod } = pool.endospore.userData;
      leftShell.position.set(0, 0, 0);
      leftShell.rotation.set(0, 0, 0);
      rightShell.position.set(0, 0, 0);
      rightShell.rotation.set(0, 0, 0);
      emergingRod.scale.setScalar(0.01);
      pool.endospore.rotation.y = lerp(-0.45, 0.45, p);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.25, 4.9], look: [0, 0, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.4, 0.1, 4.1], look: [0, 0, 0], fov: 34, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1540, 'HEAT-PROOF ARMOR', 'DORMANT ENDOSPORE', -1.5, (p - 0.18) * 3);
        }
      };
    }

    // S12: Boiling at 100°C — Steel Pot on Blue Gas Flame with Rising Bubbles & Surviving Golden Spores
    case 12: {
      pool.boilingPot.visible = true;
      const { bubbleGroup, spores } = pool.boilingPot.userData;
      bubbleGroup.children.forEach((b, i) => {
        const yOff = ((t * 1.15 + b.userData.phase) % 1.35);
        b.position.set(b.userData.bx, 0.45 + yOff * 0.72, b.userData.bz);
      });
      spores.children.forEach((sp, i) => {
        sp.position.y = 0.92 + (i === 1 ? 0.22 : 0) + Math.sin(t * 3.2 + i * 1.4) * 0.12;
        sp.rotation.y = t * 1.4 + i;
      });
      return {
        cam: [
          { p: 0.0, pos: [-1.0, 0.9, 5.2], look: [0, -0.05, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.7, 0.6, 4.3],  look: [0, 0.05, 0],  fov: 35, roll: 0.01 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1590, ['0','6','0','°','C'], ['1','0','0','°','C'], clamp(p * 2.2), 'SPORES SURVIVE BOILING WATER', 82, 112, 10);
        }
      };
    }

    // S13: Heat Actually Wakes Them Up — Armored Shell Cracks Open & Living Emerald Rod Sprouts!
    case 13: {
      pool.endospore.visible = true;
      const { leftShell, rightShell, emergingRod } = pool.endospore.userData;
      const crackP = easeInOutCubic(clamp((p - 0.14) / 0.62));
      leftShell.position.set(-crackP * 0.68, 0, 0);
      leftShell.rotation.z = crackP * 0.38;
      rightShell.position.set(crackP * 0.68, 0, 0);
      rightShell.rotation.z = -crackP * 0.38;
      emergingRod.scale.setScalar(0.18 + crackP * 0.92);
      emergingRod.position.set(0, crackP * 0.38, 0.22);
      pool.endospore.rotation.y = lerp(-0.18, 0.28, p);
      return {
        impact: { at: 0.20, mag: 0.18 },
        cam: [
          { p: 0.0, pos: [0, 0.25, 5.2], look: [0, 0.05, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.3, 0.15, 4.3], look: [0, 0.15, 0], fov: 35, roll: 0 }
        ]
      };
    }

    // S14: You Leave Rice Out to Cool — Moonlit Kitchen Counter + Wall Clock Spinning 6 Hours
    case 14: {
      pool.kitchen.visible = true;
      const { steamGroup, handPivot } = pool.kitchen.userData;
      steamGroup.visible = false;
      handPivot.rotation.z = -p * Math.PI * 6;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0.8, 0.7, 5.0], look: [0.3, 0.1, -0.4], fov: 39, roll: 0 },
          { p: 1.0, pos: [-0.5, 0.35, 4.1], look: [0.0, -0.25, 0.2], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1590, ['0','1',' ','H','R'], ['0','6',' ','H','R'], clamp(p * 2.2), 'ROOM TEMPERATURE COUNTER', 82, 112, 10);
        }
      };
    }

    // S15: 4°C to 60°C Danger Zone — Oak-Mounted Brass Wall Thermometer with Real Degree Scale
    case 15: {
      pool.thermometer.visible = true;
      pool.thermometer.rotation.y = lerp(-0.26, 0.26, p);
      const { mercuryCol } = pool.thermometer.userData;
      const fillFrac = lerp(0.86, 0.44, easeInOutCubic(p));
      mercuryCol.scale.y = fillFrac;
      mercuryCol.position.y = -1.10 + (2.25 * fillFrac) * 0.5;
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.2, 5.2], look: [0, -0.05, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.7, 0.0, 4.4],  look: [0, -0.05, 0], fov: 36, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 760, 1020, '4°C – 60°C', 'RAPID GROWTH', 3, (p - 0.16) * 3);
        }
      };
    }

    // S16: Every 20 Minutes They Double — Exponential 3D Bacillus Colony Mitosis
    case 16: {
      pool.bacillus.visible = true;
      const shown = Math.floor(lerp(2, 14, easeOutCubic(p)));
      pool.bacillus.userData.rods.forEach((r, i) => {
        r.visible = i < shown;
        const bp = r.userData.basePos;
        r.position.set(bp.x + Math.sin(t * 2.4 + i) * 0.08, bp.y + Math.cos(t * 2.1 + i) * 0.08, bp.z);
        r.rotation.y = t * 0.7 + i;
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.1, 4.6], look: [0, -0.1, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.3, 0.15, 5.4], look: [0, -0.1, 0], fov: 41, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1590, ['0','1',' ','M','I','N'], ['2','0',' ','M','I','N'], clamp(p * 2.3), 'DOUBLING TIME IN WARM RICE', 78, 108, 10);
        }
      };
    }

    // S17: In Just 6 Hours — Millions! Mechanical Flip Odometer Rolling to 1,000,000
    case 17: {
      pool.riceMacro.visible = true;
      pool.riceMacro.userData.sporeGroup.visible = true;
      pool.riceMacro.rotation.y = t * 0.4;
      return {
        cam: [
          { p: 0.0, pos: [-0.7, 0.35, 5.4], look: [0, 0.05, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.7, 0.2, 4.7],   look: [0, 0.05, 0], fov: 37, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1560, ['0','0','0','0','1','0','0'], ['1','0','0','0','0','0','0'], clamp(p * 2.1), 'COLONY COUNT AFTER 6 HOURS', 82, 114, 9);
        }
      };
    }

    // S18: No Bad Smell / Looks Normal — Pristine Macro Pearlescent Basmati Grains (Zero Visible Spores!)
    case 18: {
      pool.riceMacro.visible = true;
      pool.riceMacro.userData.sporeGroup.visible = false;
      pool.riceMacro.rotation.y = lerp(0.28, -0.28, p);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.2, 4.8], look: [0, 0, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [-0.4, 0.0, 4.0], look: [0, 0, 0], fov: 34, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1520, 'NO SMELL · NO TASTE', 'TOTALLY INVISIBLE', -2, (p - 0.16) * 3);
        }
      };
    }

    // S19: HERO SHOWPIECE #1 — Sculptural 12-Lobe Cereulide Cyclic Crown + Covalent Bridges + K+ Core
    case 19: {
      pool.cereulide.visible = true;
      const { ringGroup, kIon, flameJet } = pool.cereulide.userData;
      flameJet.visible = false;
      ringGroup.rotation.set(Math.sin(t * 1.0) * 0.18, lerp(-0.42, 0.48, p), t * 0.45);
      kIon.scale.setScalar(0.90 + 0.20 * Math.sin(t * 7));
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.6, 0.35, 5.4], look: [0, 0, 0], fov: 39, roll: -0.02 },
          { p: 0.5, pos: [0.0, 0.1, 4.6],   look: [0, 0, 0], fov: 36, roll: 0 },
          { p: 1.0, pos: [0.5, -0.1, 4.2],  look: [0, 0, 0], fov: 34, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1560, 'CEREULIDE', 'HEAT-STABLE CYCLIC RING', 1.5, (p - 0.18) * 3);
        }
      };
    }

    // S20: Survives 121°C — Heroic 3/4 Frontal Cereulide Ring Hovering Impervious Over Roaring Flames!
    case 20: {
      pool.cereulide.visible = true;
      const { ringGroup, flameJet } = pool.cereulide.userData;
      flameJet.visible = true;
      flameJet.children.forEach((f, i) => {
        f.scale.y = 0.78 + 0.42 * Math.sin(t * 24 + i * 1.3);
      });
      // Stay near 3/4 frontal angle so viewer sees the unmistakable glowing cyclic ring!
      ringGroup.rotation.set(0.24, lerp(-0.38, 0.38, p), t * 0.65);
      return {
        shadowFloor: false,
        impact: { at: 0.24, mag: 0.14 },
        cam: [
          { p: 0.0, pos: [0, -0.1, 5.4], look: [0, -0.15, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.35, 0.15, 4.6], look: [0, -0.10, 0], fov: 36, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1610, ['1','0','0','°','C'], ['1','2','1','°','C'], clamp(p * 2.2), 'STILL 100% INTACT AFTER 90 MIN', 80, 110, 10);
        }
      };
    }

    // S21: Reheating Kills ONLY Bacteria — Centered Dual Museum Pedestals (Dead Dust vs Glowing Ring)
    case 21: {
      pool.splitReheat.visible = true;
      const { aliveToxin } = pool.splitReheat.userData;
      aliveToxin.userData.ringGroup.rotation.set(0.18, t * 0.9, t * 0.5);
      return {
        cam: [
          { p: 0.0, pos: [-0.5, 0.5, 5.2], look: [0.0, -0.45, 0], fov: 39, roll: 0 },
          { p: 0.5, pos: [0.0, 0.4, 4.9],  look: [0.0, -0.45, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.5, 0.3, 4.5],  look: [0.15, -0.40, 0], fov: 36, roll: 0.01 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 290, 1500, 'BACTERIA', 'KILLED BY HEAT', -2, (p - 0.12) * 3);
          drawPaperTag(ctx, 790, 1500, 'TOXIN RING', 'STILL DEADLY!', 2, (p - 0.42) * 3);
        }
      };
    }

    // S22: Stomach Acid Can't Break It — Anatomical Translucent J-Stomach + HCl Acid + Intact Rings
    case 22: {
      pool.stomach.visible = true;
      const { toxins, bubbles } = pool.stomach.userData;
      toxins.children.forEach((tx, i) => {
        tx.position.y = -0.48 + i * 0.16 + Math.sin(t * 2.6 + i * 2) * 0.12;
        tx.rotation.set(0.2, t * 0.8 + i, t * 0.5);
      });
      bubbles.children.forEach((b, i) => {
        const u = ((t * 0.9 + b.userData.phase) % 1);
        b.position.set(b.userData.bx + Math.sin(u * 6) * 0.06, -0.82 + u * 0.85, 0.18);
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.6, 0.4, 5.0], look: [0.05, 0.05, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.5, -0.05, 4.3], look: [0.1, -0.1, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 750, 1520, 'pH 1.5 ACID', 'ZERO EFFECT', 3, (p - 0.18) * 3);
        }
      };
    }

    // S23: Straight Into Your Bloodstream — R09 S30-Style Y-Artery + Detailed Clinical Gauge Dial!
    case 23: {
      pool.arteryGauge.visible = true;
      const { needle, flowGroup } = pool.arteryGauge.userData;
      // Needle sweeps cleanly from green zone (+1.6 rad) across amber into crimson red (-1.5 rad)!
      needle.rotation.z = lerp(1.5, -1.45, easeInOutCubic(p));
      flowGroup.children.forEach((m) => {
        const u = ((t * 0.36 + m.userData.offset) % 1);
        const br = m.userData.branch;
        let x, y;
        if (u < 0.42) {
          const s = u / 0.42;
          x = Math.sin(s * 6 + br) * 0.12;
          y = lerp(-2.3, -0.42, s);
        } else {
          const s = (u - 0.42) / 0.58;
          x = lerp(0, br * 1.32, s);
          y = lerp(-0.42, 2.05, s);
        }
        m.position.set(x, y, 0.18);
        m.rotation.set(t * 2.2, t * 1.6, 0);
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.35, 5.0], look: [0, -0.05, 0.2], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.25, 0.1, 4.0], look: [0, -0.05, 0.35], fov: 33, roll: 0.01 }
        ]
      };
    }

    // S24: HERO SHOWPIECE #2 — Sculpted 3D Mitochondrion Cutaway + Glowing Cyan ATP Sparks!
    case 24: {
      pool.mitochondria.visible = true;
      const { atpGroup, kFlood } = pool.mitochondria.userData;
      kFlood.visible = false;
      pool.mitochondria.rotation.y = lerp(-0.28, 0.28, p);
      atpGroup.children.forEach((sp, i) => {
        sp.visible = true;
        sp.position.set(sp.userData.bx, sp.userData.by + Math.sin(t * 4 + sp.userData.phase) * 0.08, 0.22);
        sp.scale.setScalar(0.82 + 0.32 * Math.sin(t * 7 + i));
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.8, 0.4, 5.2], look: [0, 0, 0], fov: 39, roll: -0.02 },
          { p: 1.0, pos: [0.5, 0.15, 4.2], look: [0, 0, 0.1], fov: 34, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1550, 'CELL POWER PLANT', 'ATP ENERGY ENGINE', -1.5, (p - 0.16) * 3);
        }
      };
    }

    // S25: Potassium Flood — Power Shutdown! Violet K+ Floods Mitochondria, ATP Flickers Out!
    case 25: {
      pool.mitochondria.visible = true;
      const { atpGroup, kFlood } = pool.mitochondria.userData;
      kFlood.visible = true;
      kFlood.children.forEach((k, i) => {
        const drop = easeInOutCubic(clamp(p * 1.45 - i * 0.05, 0, 1));
        k.position.set(k.userData.bx, lerp(1.35, -0.05 + Math.sin(i * 1.7) * 0.28, drop), 0.26);
      });
      atpGroup.children.forEach((sp) => {
        sp.scale.setScalar(Math.max(0.04, 1.0 - p * 1.25));
      });
      return {
        shadowFloor: false,
        impact: { at: 0.34, mag: 0.20 },
        cam: [
          { p: 0.0, pos: [0.3, 0.3, 4.9], look: [0, 0.05, 0.1], fov: 37, roll: 0 },
          { p: 1.0, pos: [-0.3, 0.1, 4.2], look: [0, 0, 0.15], fov: 34, roll: -0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1550, 'ATP SHUTDOWN', 'K+ IONOPHORE COLLAPSE', 2, (p - 0.28) * 3);
        }
      };
    }

    // S26: Most Cases — 1 to 5 Hours (Numbered Brass Pocket Watch + Red Danger Sector)
    case 26: {
      pool.stopwatch.visible = true;
      pool.stopwatch.rotation.y = lerp(-0.24, 0.24, p);
      pool.stopwatch.userData.handGroup.rotation.z = -p * Math.PI * 0.84;
      return {
        cam: [
          { p: 0.0, pos: [-0.8, 0.35, 5.1], look: [0, 0.05, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.6, 0.15, 4.4],  look: [0, 0.05, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1590, ['0','1',' ','H','R'], ['0','5',' ','H','R'], clamp(p * 2.2), 'SUDDEN VOMITING & NAUSEA', 84, 114, 10);
        }
      };
    }

    // S27: High Dose — Acute Liver Failure (Anatomical Sculpted Liver on Black Museum Stand!)
    case 27: {
      pool.liver.visible = true;
      pool.liver.rotation.y = lerp(-0.28, 0.28, p);
      const spread = easeInOutCubic(clamp((p - 0.16) / 0.70));
      pool.liver.userData.lesions.children.forEach((sp, i) => {
        sp.scale.setScalar(0.12 + spread * (0.95 + i * 0.08));
      });
      return {
        cam: [
          { p: 0.0, pos: [-0.8, 0.4, 5.2], look: [0, -0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.6, 0.15, 4.3], look: [0, -0.05, 0], fov: 35, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 730, 1530, 'LIVER NECROSIS', 'SEVERE CEREULIDE DOSE', -2, (p - 0.28) * 3);
        }
      };
    }

    // S28: Not Just Rice — Centered Rice Bowl + Coiled Spaghetti Plate + Noodle Takeout Box
    case 28: {
      pool.starchTrio.visible = true;
      pool.starchTrio.rotation.y = lerp(-0.18, 0.18, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.7, 0.9, 5.5], look: [0.0, -0.45, 0.05], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.7, 0.7, 4.9],  look: [0.0, -0.45, 0.05], fov: 37, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1530, 'ANY STARCHY FOOD', 'RICE · PASTA · NOODLES · BIRYANI', 1, (p - 0.16) * 3);
        }
      };
    }

    // S29: 3 Simple Kitchen Rules Clipboard Over Moody Moonlit Kitchen
    case 29: {
      pool.kitchen.visible = true;
      pool.kitchen.userData.steamGroup.visible = false;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.5, 5.6], look: [0, -0.2, 0], fov: 41, roll: 0 },
          { p: 1.0, pos: [0.3, 0.4, 5.2], look: [0, -0.2, 0], fov: 39, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawChecklistBoard(ctx, 540, 1080, 820, 480, 'SAFE KITCHEN PROTOCOL', [
            { text: '1. COOL IN SHALLOW TRAY', checked: true, appearAt: 0.08 },
            { text: '2. FRIDGE WITHIN 1–2 HRS', checked: true, appearAt: 0.32 },
            { text: '3. KEEP FRIDGE BELOW 4°C', checked: true, appearAt: 0.55 }
          ], p);
        }
      };
    }

    // S30: Rule 1 — Centered Side-by-Side Deep Hot Pot vs Wide Shallow Brushed-Steel Cooling Tray
    case 30: {
      pool.shallowDeep.visible = true;
      const { hotCore, coolMist } = pool.shallowDeep.userData;
      hotCore.scale.setScalar(0.92 + 0.14 * Math.sin(t * 6));
      coolMist.children.forEach((c) => {
        const u = ((t * 0.7 + c.userData.phase) % 1);
        c.position.set(c.userData.bx, 0.28 + u * 0.72, c.userData.bz);
        c.scale.setScalar(0.55 + u * 0.6);
      });
      return {
        cam: [
          { p: 0.0, pos: [-0.6, 0.85, 5.5], look: [0.0, -0.45, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.6, 0.70, 4.9],  look: [0.0, -0.45, 0], fov: 37, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 290, 1510, 'DEEP POT', 'TRAPS HEAT', -3, (p - 0.1) * 3);
          drawPaperTag(ctx, 790, 1510, 'SHALLOW TRAY', 'COOLS FAST ✓', 2, (p - 0.38) * 3);
        }
      };
    }

    // S31: Rule 2 — Fridge Within 1–2 Hours (Architectural Stocked Refrigerator Cutaway!)
    case 31: {
      pool.fridge.visible = true;
      pool.fridge.rotation.y = lerp(-0.14, 0.12, p);
      const { container } = pool.fridge.userData;
      container.position.z = lerp(1.35, 0.04, easeOutCubic(clamp(p * 1.45)));
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.6, 0.35, 5.4], look: [0, 0.0, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.35, 0.25, 4.6], look: [0, 0.05, 0], fov: 36, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1560, 'WITHIN 1–2 HOURS', 'SEALED CONTAINER', -1.5, (p - 0.22) * 3);
        }
      };
    }

    // S32: Below 4°C — Spores Stay Asleep (Oak Wall Thermometer Dropping into Safe Ice-Blue Zone!)
    case 32: {
      pool.thermometer.visible = true;
      pool.thermometer.rotation.y = lerp(0.24, -0.24, p);
      const { mercuryCol } = pool.thermometer.userData;
      const fillFrac = lerp(0.46, 0.14, easeInOutCubic(p));
      mercuryCol.scale.y = fillFrac;
      mercuryCol.position.y = -1.10 + (2.25 * fillFrac) * 0.5;
      return {
        cam: [
          { p: 0.0, pos: [0.8, 0.15, 5.1], look: [0, -0.15, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [-0.5, -0.35, 4.3], look: [0, -0.45, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1590, ['3','0','°','C'], ['0','3','°','C'], clamp(p * 2.2), 'SAFE ZONE — ZERO TOXIN GROWTH', 84, 114, 10);
        }
      };
    }

    // S33: Rule 3 — Over 2 Hours / Left Overnight? Throw It Out!
    case 33: {
      pool.kitchen.visible = true;
      pool.kitchen.userData.steamGroup.visible = false;
      const stampP = clamp((p - 0.35) * 3.0);
      return {
        shadowFloor: false,
        impact: { at: 0.38, mag: 0.18 },
        cam: [
          { p: 0.0, pos: [-0.7, 0.5, 4.8], look: [0.0, -0.25, 0.2], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.35, 0.35, 4.2], look: [0.0, -0.25, 0.2], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawRubberStamp(ctx, 540, 1540, 'THROW IT OUT!', -5, stampP, '#FF4536');
        }
      };
    }

    // S34: Next Time You Leave Rice Out — Remember This Ring! (Glowing Cereulide Crown Centered!)
    case 34: {
      pool.cereulide.visible = true;
      const { ringGroup, flameJet } = pool.cereulide.userData;
      flameJet.visible = false;
      ringGroup.rotation.set(0.18, lerp(-0.35, 0.35, p), t * 0.55);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.15, 5.2], look: [0, 0, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0, 0.0, 4.4],  look: [0, 0, 0], fov: 34, roll: 0 }
        ]
      };
    }

    // S35: Share This With Your Family!
    default: {
      pool.fridge.visible = true;
      pool.fridge.rotation.y = lerp(-0.18, 0.18, p);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.3, 5.6], look: [0, 0, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.35, 0.2, 5.2], look: [0, 0, 0], fov: 38, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawFamilyShareCard(ctx, 540, 1180, p);
        }
      };
    }
  }
}
