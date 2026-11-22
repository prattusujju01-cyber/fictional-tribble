// All 35 Bespoke Pure-Code Era-2 3D Diorama Scenes for "Fried Rice Syndrome" (v13.0)
// ZERO dark sci-fi HUD boxes, ZERO washed-out beige, ZERO blocky primitives!
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
  { id: 2,  t0: 3.80,   t1: 6.80,   pal: 'goldenOchre',    tier1: 'NEXT MORNING',      tier2: 'JUST REHEAT IT',    accent: '#C82818' },
  { id: 3,  t0: 6.80,   t1: 10.20,  pal: 'warmKraft',      tier1: 'OCTOBER 2008',      tier2: 'BRUSSELS',          accent: '#C82818' },
  { id: 4,  t0: 10.20,  t1: 13.40,  pal: 'midnightIndigo', tier1: 'WITHIN 10 HOURS',   tier2: 'HE NEVER WOKE UP',  accent: '#F05232' },
  { id: 5,  t0: 13.40,  t1: 16.60,  pal: 'goldenOchre',    tier1: 'THE CAUSE?',        tier2: 'NOT POISON',        accent: '#C82818' },
  { id: 6,  t0: 16.60,  t1: 19.60,  pal: 'velvetCrimson',  tier1: 'FRIED RICE',        tier2: 'SYNDROME',          accent: '#F7C137' },
  { id: 7,  t0: 19.60,  t1: 22.80,  pal: 'warmKraft',      tier1: 'EVERYONE THINKS',   tier2: 'HEAT KILLS GERMS',  accent: '#C82818' },
  { id: 8,  t0: 22.80,  t1: 26.00,  pal: 'goldenOchre',    tier1: 'MEET THE CULPRIT',  tier2: 'BACILLUS CEREUS',   accent: '#C82818' },
  { id: 9,  t0: 26.00,  t1: 29.40,  pal: 'warmKraft',      tier1: 'IT LIVES IN',       tier2: 'THE SOIL',          accent: '#1E6B48' },
  { id: 10, t0: 29.40,  t1: 32.60,  pal: 'goldenOchre',    tier1: 'EVEN INSIDE',       tier2: 'DRY RAW RICE',      accent: '#C82818' },
  { id: 11, t0: 32.60,  t1: 36.20,  pal: 'volcanicAmber',  tier1: 'ARMORED SHELLS',    tier2: 'ENDOSPORES',        accent: '#F7C137' },
  { id: 12, t0: 36.20,  t1: 39.80,  pal: 'volcanicAmber',  tier1: 'BOILING AT 100°C',  tier2: 'STILL ALIVE!',      accent: '#FF6A38' },
  { id: 13, t0: 39.80,  t1: 43.20,  pal: 'goldenOchre',    tier1: 'HEAT ACTUALLY',     tier2: 'WAKES THEM UP',     accent: '#C82818' },
  { id: 14, t0: 43.20,  t1: 46.80,  pal: 'midnightIndigo', tier1: 'YOU LEAVE RICE',    tier2: 'OUT TO COOL',       accent: '#F7C137' },
  { id: 15, t0: 46.80,  t1: 50.60,  pal: 'volcanicAmber',  tier1: '4°C TO 60°C',       tier2: 'DANGER ZONE',       accent: '#FF5A36' },
  { id: 16, t0: 50.60,  t1: 54.20,  pal: 'velvetCrimson',  tier1: 'EVERY 20 MINUTES',  tier2: 'THEY DOUBLE',       accent: '#F7C137' },
  { id: 17, t0: 54.20,  t1: 57.60,  pal: 'goldenOchre',    tier1: 'IN JUST 6 HOURS',   tier2: 'MILLIONS!',         accent: '#C82818' },
  { id: 18, t0: 57.60,  t1: 61.00,  pal: 'velvetCrimson',  tier1: 'NO BAD SMELL',      tier2: 'LOOKS NORMAL',      accent: '#F7C137' },
  { id: 19, t0: 61.00,  t1: 65.20,  pal: 'velvetCrimson',  tier1: 'THE REAL WEAPON',   tier2: 'CEREULIDE TOXIN',   accent: '#F7C137' },
  { id: 20, t0: 65.20,  t1: 68.80,  pal: 'volcanicAmber',  tier1: 'SURVIVES 121°C',    tier2: 'UNBREAKABLE RING',  accent: '#FF6A38' },
  { id: 21, t0: 68.80,  t1: 72.20,  pal: 'goldenOchre',    tier1: 'REHEATING KILLS',   tier2: 'ONLY BACTERIA',     accent: '#C82818' },
  { id: 22, t0: 72.20,  t1: 75.40,  pal: 'velvetCrimson',  tier1: 'STOMACH ACID',      tier2: "CAN'T BREAK IT",    accent: '#F7C137' },
  { id: 23, t0: 75.40,  t1: 79.20,  pal: 'velvetCrimson',  tier1: 'STRAIGHT INTO',     tier2: 'YOUR BLOODSTREAM',  accent: '#52D1F0' },
  { id: 24, t0: 79.20,  t1: 83.60,  pal: 'velvetCrimson',  tier1: 'IT ATTACKS',        tier2: 'MITOCHONDRIA',      accent: '#F7C137' },
  { id: 25, t0: 83.60,  t1: 87.20,  pal: 'volcanicAmber',  tier1: 'POTASSIUM FLOOD',   tier2: 'POWER SHUTDOWN',    accent: '#FF5A36' },
  { id: 26, t0: 87.20,  t1: 90.40,  pal: 'goldenOchre',    tier1: 'MOST CASES',        tier2: '1 TO 5 HOURS',      accent: '#C82818' },
  { id: 27, t0: 90.40,  t1: 93.80,  pal: 'velvetCrimson',  tier1: 'HIGH DOSE',         tier2: 'LIVER FAILURE',     accent: '#FF5A36' },
  { id: 28, t0: 93.80,  t1: 96.80,  pal: 'goldenOchre',    tier1: 'NOT JUST RICE',     tier2: 'PASTA & NOODLES',   accent: '#C82818' },
  { id: 29, t0: 96.80,  t1: 99.80,  pal: 'warmKraft',      tier1: 'BACHNE KE',         tier2: '3 SIMPLE RULES',    accent: '#1E6B48' },
  { id: 30, t0: 99.80,  t1: 103.20, pal: 'emeraldLab',     tier1: 'RULE 1',            tier2: 'COOL SHALLOW',      accent: '#4AE3B5' },
  { id: 31, t0: 103.20, t1: 106.80, pal: 'emeraldLab',     tier1: 'RULE 2',            tier2: 'FRIDGE IN 2 HRS',   accent: '#52D1F0' },
  { id: 32, t0: 106.80, t1: 110.20, pal: 'emeraldLab',     tier1: 'BELOW 4°C',         tier2: 'SPORES SLEEP',      accent: '#52D1F0' },
  { id: 33, t0: 110.20, t1: 113.40, pal: 'goldenOchre',    tier1: 'RULE 3',            tier2: 'OVER 2 HRS? TOSS!', accent: '#C82818' },
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

  // Whisper-clean Era-2 paper grain + center fold + vignette
  drawEra2Chrome(ctx, pal);

  // Clean floating condensed Era-2 headline (ZERO dark scrim!)
  drawEra2Headline(ctx, shot.tier1, shot.tier2, localT, pal, {
    accentColor: shot.accent,
    ...(spec.headlineOpts || {})
  });
}

function stageShot3D(pool, id, { t, localT, dur, p, pal }) {
  switch (id) {
    // S01: Midnight Indian Kitchen Counter + Ceramic Bowl of Leftover Rice
    case 1: {
      pool.kitchen.visible = true;
      const { bowl, minBar, hrBar, steamGroup } = pool.kitchen.userData;
      bowl.position.set(-0.2, -0.98, 0.25);
      minBar.rotation.z = -p * Math.PI * 1.2;
      hrBar.rotation.z = -0.8 - p * 0.4;
      steamGroup.visible = true;
      steamGroup.position.y = Math.sin(t * 2.4) * 0.08;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-1.4, 0.7, 5.2], look: [-0.1, -0.2, 0.0], fov: 40, roll: -0.01 },
          { p: 0.5, pos: [0.3, 0.4, 4.1],  look: [-0.1, -0.3, 0.2], fov: 35, roll: 0.01 },
          { p: 1.0, pos: [0.8, 0.2, 3.6],  look: [-0.2, -0.4, 0.25], fov: 32, roll: 0 }
        ]
      };
    }

    // S02: Next Morning — Sizzling Kadhai / Wok Reheating Tossed Rice Grains
    case 2: {
      pool.wok.visible = true;
      const { flames, grains } = pool.wok.userData;
      flames.forEach((fl, i) => { fl.scale.y = 0.75 + 0.4 * Math.sin(t * 22 + i); });
      grains.forEach((g) => {
        const arc = Math.abs(Math.sin(t * 4.5 + g.userData.ph));
        g.position.set(g.userData.bx, g.userData.by + arc * 0.45, g.userData.bz);
        g.rotation.x = t * 5 + g.userData.ph;
      });
      return {
        cam: [
          { p: 0.0, pos: [-1.5, 1.2, 4.8], look: [0, 0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [1.2, 0.8, 4.0],  look: [0, 0.2, 0], fov: 34, roll: 0.02 }
        ]
      };
    }

    // S03: October 2008 Brussels — Vintage Flip-Board 2008 + Clinical Newspaper Clipping
    case 3: {
      pool.bedroom.visible = true;
      pool.bedroom.rotation.y = lerp(-0.18, 0.12, p);
      return {
        cam: [
          { p: 0.0, pos: [0.0, 0.8, 5.6], look: [0, -0.4, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.6, 0.6, 4.8], look: [0, -0.4, 0], fov: 37, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 560, ['2','0','0','0'], ['2','0','0','8'], clamp(p * 1.6), 'OCTOBER 2008 · BRUSSELS', 88, 120, 12);
          drawJournalCard(ctx, 540, 1420, 820, 260, -1.2, 'JOURNAL OF CLINICAL MICROBIOLOGY', 'Fatal Food Poisoning — Age 20', [
            'Healthy student reheated 5-day room-temp pasta.',
            'Died from acute liver necrosis within 10 hours.'
          ], 1, clamp((p - 0.25) * 2.2));
        }
      };
    }

    // S04: Within 10 Hours — Quiet Blue Student Nightstand & Sweeping Twin-Bell Alarm Clock
    case 4: {
      pool.bedroom.visible = true;
      pool.bedroom.rotation.y = 0;
      pool.bedroom.userData.handGroup.rotation.z = -p * Math.PI * 1.65;
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.5, 4.6], look: [0, -0.2, 0.1], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.3, 0.2, 3.2],  look: [-0.2, -0.1, 0.2], fov: 30, roll: 0.01 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 790, 1480, '10 HOURS', 'LATER', 3, (p - 0.22) * 3);
        }
      };
    }

    // S05: The Cause? NOT POISON — Vintage Amber Apothecary Glass Bottle + Red Strikethrough
    case 5: {
      pool.bottle.visible = true;
      pool.bottle.rotation.y = lerp(-0.35, 0.35, p);
      return {
        cam: [
          { p: 0.0, pos: [-1.1, 0.4, 4.8], look: [0, -0.1, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.9, 0.2, 4.0],  look: [0, -0.1, 0], fov: 34, roll: 0 }
        ],
        headlineOpts: { strikeP: clamp((p - 0.42) * 2.5) },
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1080, 'POISON?', 'NO CHEMICALS ADDED', -3, (p - 0.15) * 3);
        }
      };
    }

    // S06: Fried Rice Syndrome — Macro Sculptural Rice Grains Dusted with Golden Spores
    case 6: {
      pool.riceMacro.visible = true;
      pool.riceMacro.rotation.y = lerp(-0.3, 0.45, p);
      pool.riceMacro.userData.spores.forEach((sp, i) => {
        sp.scale.setScalar(0.85 + 0.35 * Math.sin(t * 5 + i));
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.2, 4.8], look: [0, 0, 0], fov: 38, roll: -0.02 },
          { p: 1.0, pos: [0.6, -0.1, 3.4], look: [0, 0, 0.2], fov: 30, roll: 0.02 }
        ]
      };
    }

    // S07: Myth Bust — Sizzling Wok Behind Handwritten Yellow Sticky Note ("GARAM KAR DIYA = SAFE" -> STRUCK!)
    case 7: {
      pool.wok.visible = true;
      const { flames } = pool.wok.userData;
      flames.forEach((fl, i) => { fl.scale.y = 0.8 + 0.35 * Math.sin(t * 20 + i); });
      const sp = clamp((p - 0.48) * 3.0);
      return {
        cam: [
          { p: 0.0, pos: [0, 0.9, 5.2], look: [0, 0, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.4, 0.7, 4.5], look: [0, 0, 0], fov: 36, roll: 0 }
        ],
        headlineOpts: { strikeP: sp },
        hudDraw: (ctx) => {
          drawTornNote(ctx, 540, 1460, 740, 210, -2.5, ['"GARAM KAR DIYA = SAFE"', 'NO MORE BACTERIA!'], { strikeP: sp });
          if (sp > 0.1) drawRubberStamp(ctx, 540, 1690, 'COMPLETELY FALSE!', 3, sp, '#C82818');
        }
      };
    }

    // S08: Meet The Culprit — Sculptural Bacillus cereus Rod Chain + 3 μM Brass Caliper
    case 8: {
      pool.bacillus.visible = true;
      pool.bacillus.userData.rods.forEach((r, i) => {
        r.visible = i < 4;
        if (i < 4) {
          r.position.set(r.userData.bx, r.userData.by + Math.sin(t * 3 + i) * 0.12, r.userData.bz);
          r.rotation.y = Math.sin(t * 2 + i) * 0.4;
        }
      });
      return {
        cam: [
          { p: 0.0, pos: [-1.0, 0.5, 4.8], look: [0, 0, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.8, 0.2, 3.6],  look: [0, 0, 0], fov: 32, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawDimensionCaliper(ctx, 290, 1390, 790, 1390, '~3 TO 5 MICRONS', false, (p - 0.2) * 3);
        }
      };
    }

    // S09: It Lives in The Soil — Miniature Sunlit Rice Paddy Cutaway Block
    case 9: {
      pool.paddy.visible = true;
      pool.paddy.rotation.y = lerp(-0.32, 0.28, p);
      return {
        cam: [
          { p: 0.0, pos: [-1.4, 1.0, 5.2], look: [0, 0.1, 0], fov: 39, roll: 0 },
          { p: 0.5, pos: [0.0, 0.2, 4.4],  look: [0, -0.3, 0.4], fov: 35, roll: 0 },
          { p: 1.0, pos: [0.8, -0.3, 3.6], look: [0, -0.6, 0.8], fov: 30, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 790, 1480, 'SOIL SPORES', 'NATURAL HABITAT', 2, (p - 0.35) * 3);
        }
      };
    }

    // S10: Even Inside Dry Raw Rice — Turned Clear Glass Pantry Jar & Wooden Scoop
    case 10: {
      pool.rawJar.visible = true;
      pool.rawJar.rotation.y = lerp(-0.28, 0.32, p);
      return {
        cam: [
          { p: 0.0, pos: [-1.2, 0.6, 5.0], look: [0.1, -0.1, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.9, 0.2, 4.0],  look: [0.0, -0.2, 0], fov: 34, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 780, 1440, 'UNCOOKED', 'ALREADY PRESENT', -2.5, (p - 0.22) * 3);
        }
      };
    }

    // S11: Armored Shells — Macro 3D Armored Endospore Cutaway
    case 11: {
      pool.endospore.visible = true;
      const { leftShell, rightShell, sprout } = pool.endospore.userData;
      leftShell.position.x = -0.04;
      rightShell.position.x = 0.04;
      sprout.scale.setScalar(0.75);
      pool.endospore.rotation.y = lerp(-0.5, 0.5, p);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.3, 4.6], look: [0, 0, 0], fov: 36, roll: 0 },
          { p: 1.0, pos: [0.5, 0.1, 3.2], look: [0, 0, 0], fov: 29, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1520, 'HEAT-PROOF ARMOR', 'DORMANT ENDOSPORE', -1.5, (p - 0.2) * 3);
        }
      };
    }

    // S12: Boiling at 100°C — Still Alive! Stainless Pot + Bubbling Water + Undamaged Spores
    case 12: {
      pool.boilingPot.visible = true;
      pool.boilingPot.userData.bubbles.forEach((b, i) => {
        const yOff = ((t * b.userData.sp + i * 0.35) % 1.9);
        b.position.set(b.userData.bx, -0.65 + yOff, b.userData.bz);
      });
      return {
        cam: [
          { p: 0.0, pos: [-1.2, 1.0, 5.0], look: [0, -0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.8, 0.6, 3.8],  look: [0, 0.1, 0],  fov: 33, roll: 0.01 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1580, ['0','6','0','°','C'], ['1','0','0','°','C'], clamp(p * 1.8), 'SPORES SURVIVE BOILING WATER', 82, 112, 10);
        }
      };
    }

    // S13: Heat Actually Wakes Them Up — Armored Endospore Cracks Open & Sprouts Living Rod!
    case 13: {
      pool.endospore.visible = true;
      const { leftShell, rightShell, sprout } = pool.endospore.userData;
      const crackP = easeInOutCubic(clamp((p - 0.15) / 0.65));
      leftShell.position.x = -0.04 - crackP * 0.88;
      leftShell.rotation.z = crackP * 0.45;
      rightShell.position.x = 0.04 + crackP * 0.88;
      rightShell.rotation.z = -crackP * 0.45;
      sprout.scale.setScalar(0.5 + crackP * 0.78);
      sprout.position.y = crackP * 0.35;
      pool.endospore.rotation.y = lerp(-0.2, 0.35, p);
      return {
        impact: { at: 0.22, mag: 0.20 },
        cam: [
          { p: 0.0, pos: [0, 0.3, 4.8], look: [0, 0, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.3, 0.2, 3.5], look: [0, 0.15, 0], fov: 31, roll: 0 }
        ]
      };
    }

    // S14: You Leave Rice Out to Cool — Dark Kitchen Counter + Wall Clock Spinning Hours
    case 14: {
      pool.kitchen.visible = true;
      const { minBar, hrBar, steamGroup } = pool.kitchen.userData;
      steamGroup.visible = false;
      minBar.rotation.z = -p * Math.PI * 10;
      hrBar.rotation.z = -p * Math.PI * 1.2;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0.8, 0.8, 4.8], look: [0.5, 0.2, -0.5], fov: 38, roll: 0 },
          { p: 1.0, pos: [-0.6, 0.4, 3.8], look: [-0.2, -0.3, 0.2], fov: 33, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1580, ['0','1',' ','H','R'], ['0','6',' ','H','R'], clamp(p * 1.5), 'ROOM TEMPERATURE COUNTER', 82, 112, 10);
        }
      };
    }

    // S15: 4°C to 60°C Danger Zone — Giant Clinical Glass Thermometer
    case 15: {
      pool.thermometer.visible = true;
      pool.thermometer.rotation.y = lerp(-0.32, 0.32, p);
      const { mercuryCol, dangerBand } = pool.thermometer.userData;
      const fillFrac = lerp(0.88, 0.48, easeInOutCubic(p));
      mercuryCol.scale.y = fillFrac;
      mercuryCol.position.y = -1.22 + (2.35 * fillFrac) * 0.5;
      dangerBand.material.opacity = 0.28 + 0.22 * Math.sin(t * 7);
      return {
        cam: [
          { p: 0.0, pos: [-1.1, 0.3, 5.0], look: [0, 0, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.8, 0.0, 3.9],  look: [0, -0.05, 0], fov: 33, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 810, 950, '4°C – 60°C', 'RAPID GROWTH', 3, (p - 0.15) * 3);
        }
      };
    }

    // S16: Every 20 Minutes They Double — Exponential 3D Colony Mitosis Explosion
    case 16: {
      pool.bacillus.visible = true;
      const shown = Math.floor(lerp(2, 22, easeOutCubic(p)));
      pool.bacillus.userData.rods.forEach((r, i) => {
        r.visible = i < shown;
        r.position.set(
          r.userData.bx + Math.sin(t * 2.6 + i) * 0.08,
          r.userData.by + Math.cos(t * 2.2 + i) * 0.08,
          r.userData.bz
        );
        r.rotation.y = t * 0.8 + i;
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.1, 4.0], look: [0, 0, 0], fov: 35, roll: 0 },
          { p: 1.0, pos: [0.4, 0.2, 5.2], look: [0, 0, 0], fov: 40, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1580, ['2','0',' ','M','I','N'], ['2','X',' ','F','A','S','T'], clamp((p - 0.4) * 2.5), 'DOUBLING TIME IN WARM RICE', 76, 108, 9);
        }
      };
    }

    // S17: In Just 6 Hours — Millions! Mechanical Flip Odometer Rolling to 1,000,000+
    case 17: {
      pool.riceMacro.visible = true;
      pool.riceMacro.rotation.y = t * 0.45;
      return {
        cam: [
          { p: 0.0, pos: [-0.8, 0.4, 5.4], look: [0, 0.1, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.8, 0.2, 4.6],  look: [0, 0.1, 0], fov: 37, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1540, ['0','0','0','0','1','0','0'], ['1','0','0','0','0','0','0'], clamp(p * 1.4), 'COLONY COUNT AFTER 6 HOURS', 82, 118, 9);
        }
      };
    }

    // S18: No Bad Smell / Looks Normal — Clean White Rice Mound
    case 18: {
      pool.riceMacro.visible = true;
      pool.riceMacro.userData.spores.forEach(sp => { sp.visible = false; });
      pool.riceMacro.rotation.y = lerp(0.3, -0.3, p);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.2, 4.4], look: [0, 0, 0], fov: 36, roll: 0 },
          { p: 1.0, pos: [-0.5, 0.0, 3.4], look: [0, 0, 0], fov: 30, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1500, 'NO SMELL · NO TASTE', 'TOTALLY INVISIBLE', -2, (p - 0.18) * 3);
        }
      };
    }

    // S19: HERO SHOWPIECE #1 — Sculptural 12-Lobe Cereulide Cyclic Peptide Crown Molecule!
    case 19: {
      pool.cereulide.visible = true;
      pool.cereulide.userData.flameRing.visible = false;
      pool.cereulide.rotation.y = lerp(-0.6, 0.9, p);
      pool.cereulide.rotation.x = Math.sin(t * 1.1) * 0.24;
      pool.cereulide.userData.kIon.scale.setScalar(0.88 + 0.22 * Math.sin(t * 7));
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.8, 0.5, 5.2], look: [0, 0, 0], fov: 39, roll: -0.02 },
          { p: 0.5, pos: [0.0, 0.1, 3.8],  look: [0, 0, 0], fov: 32, roll: 0 },
          { p: 1.0, pos: [0.7, -0.1, 3.2], look: [0, 0, 0], fov: 28, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1560, 'CEREULIDE', 'HEAT-STABLE CYCLIC RING', 1.5, (p - 0.2) * 3);
        }
      };
    }

    // S20: Survives 121°C — Unbreakable Ring Blasted by Stove Flames!
    case 20: {
      pool.cereulide.visible = true;
      pool.cereulide.userData.flameRing.visible = true;
      pool.cereulide.userData.flameRing.children.forEach((f, i) => {
        f.scale.y = 0.75 + 0.45 * Math.sin(t * 26 + i * 1.3);
      });
      pool.cereulide.rotation.y = t * 1.1;
      pool.cereulide.rotation.x = 0.22;
      return {
        shadowFloor: false,
        impact: { at: 0.25, mag: 0.16 },
        cam: [
          { p: 0.0, pos: [0, -0.2, 5.0], look: [0, -0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.4, 0.2, 3.7], look: [0, 0.0, 0], fov: 32, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1600, ['1','0','0','°','C'], ['1','2','1','°','C'], clamp(p * 1.8), 'STILL 100% INTACT AFTER 90 MIN', 80, 110, 10);
        }
      };
    }

    // S21: Reheating Kills ONLY Bacteria — Dual Museum Pedestals (Dead Dust vs Blazing Toxin Ring)
    case 21: {
      pool.splitReheat.visible = true;
      pool.splitReheat.userData.crown.rotation.y = t * 1.4;
      return {
        cam: [
          { p: 0.0, pos: [-1.0, 0.6, 5.4], look: [-0.5, -0.4, 0], fov: 38, roll: 0 },
          { p: 0.5, pos: [0.0, 0.5, 5.2],  look: [0.0, -0.4, 0],  fov: 38, roll: 0 },
          { p: 1.0, pos: [1.2, 0.3, 4.0],  look: [1.1, -0.2, 0],  fov: 32, roll: 0.01 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 270, 1480, 'BACTERIA', 'KILLED BY HEAT', -2, (p - 0.12) * 3);
          drawPaperTag(ctx, 810, 1480, 'TOXIN RING', 'STILL DEADLY!', 2, (p - 0.45) * 3);
        }
      };
    }

    // S22: Stomach Acid Can't Break It — Translucent Stomach Acid Flask with Intact Rings
    case 22: {
      pool.stomach.visible = true;
      const { sCurve, rings } = pool.stomach.userData;
      rings.forEach((r, i) => {
        const u = ((t * 0.28 + i / rings.length) % 1);
        r.position.copy(sCurve.getPointAt(u));
        r.rotation.set(t * 2 + i, t * 1.6, 0);
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.8, 0.5, 5.0], look: [0.1, 0.1, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.7, -0.1, 4.0], look: [0.2, -0.2, 0], fov: 33, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 790, 1490, 'pH 1.5 ACID', 'ZERO EFFECT', 3, (p - 0.2) * 3);
        }
      };
    }

    // S23: Straight Into Your Bloodstream — R09 S30-Style Y-Artery + Embedded Brass Dial!
    case 23: {
      pool.arteryGauge.visible = true;
      const { needle, flowItems } = pool.arteryGauge.userData;
      needle.rotation.z = lerp(0.8, -1.5, easeInOutCubic(p));
      flowItems.forEach((it) => {
        const u = ((t * 0.45 + it.offset) % 1);
        const pt = it.branch.getPointAt(u);
        it.mesh.position.set(pt.x, pt.y, pt.z + 0.18);
        it.mesh.rotation.set(t * 2.5, t * 1.8, 0);
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.5, 5.2], look: [0, 0.1, 0.2], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.4, 0.2, 3.6], look: [0, 0.2, 0.4], fov: 30, roll: 0.01 }
        ]
      };
    }

    // S24: HERO SHOWPIECE #2 — Sculptural 3D Mitochondrion Cutaway + Glowing Cyan ATP!
    case 24: {
      pool.mitochondria.visible = true;
      pool.mitochondria.userData.kFlood.visible = false;
      pool.mitochondria.rotation.y = lerp(-0.35, 0.35, p);
      pool.mitochondria.userData.atpSparks.forEach((sp, i) => {
        sp.visible = true;
        sp.scale.setScalar(0.8 + 0.4 * Math.sin(t * 7 + i));
        sp.rotation.y = t * 3 + i;
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-1.1, 0.6, 4.9], look: [0, 0, 0], fov: 38, roll: -0.02 },
          { p: 1.0, pos: [0.6, 0.2, 3.4],  look: [0, 0, 0.1], fov: 30, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1540, 'CELL POWER PLANT', 'ATP ENERGY ENGINE', -1.5, (p - 0.18) * 3);
        }
      };
    }

    // S25: Potassium Flood — Power Shutdown! Violet K+ Floods Mitochondria, ATP Flickers Out!
    case 25: {
      pool.mitochondria.visible = true;
      const { atpSparks, kFlood } = pool.mitochondria.userData;
      kFlood.visible = true;
      kFlood.children.forEach((child, i) => {
        if (i < 10) {
          const drop = easeInOutCubic(clamp((p * 1.4) - i * 0.06, 0, 1));
          child.position.set(child.userData.bx, lerp(child.userData.by, -0.1, drop), child.userData.bz);
        }
      });
      atpSparks.forEach((sp) => {
        sp.scale.setScalar(Math.max(0.05, 1.0 - p * 1.15));
      });
      return {
        shadowFloor: false,
        impact: { at: 0.35, mag: 0.22 },
        cam: [
          { p: 0.0, pos: [0.4, 0.4, 4.2], look: [0, 0.1, 0.1], fov: 34, roll: 0 },
          { p: 1.0, pos: [-0.3, 0.1, 3.2], look: [0, 0, 0.2], fov: 28, roll: -0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1540, 'ATP SHUTDOWN', 'K+ IONOPHORE COLLAPSE', 2, (p - 0.3) * 3);
        }
      };
    }

    // S26: Most Cases — 1 to 5 Hours (Antique Brass Pocket Watch + Split-Flap)
    case 26: {
      pool.stopwatch.visible = true;
      pool.stopwatch.rotation.y = lerp(-0.3, 0.3, p);
      pool.stopwatch.userData.handGroup.rotation.z = -p * Math.PI * 0.9;
      return {
        cam: [
          { p: 0.0, pos: [-1.0, 0.5, 4.8], look: [0, 0.1, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.8, 0.2, 3.8],  look: [0, 0.1, 0], fov: 32, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1580, ['0','1',' ','H','R'], ['0','5',' ','H','R'], clamp(p * 1.6), 'SUDDEN VOMITING & NAUSEA', 84, 114, 10);
        }
      };
    }

    // S27: High Dose — Acute Liver Failure (3D Sculpted Liver on Black Museum Pedestal!)
    case 27: {
      pool.liver.visible = true;
      pool.liver.rotation.y = lerp(-0.35, 0.35, p);
      const spread = easeInOutCubic(clamp((p - 0.18) / 0.72));
      pool.liver.userData.necrosisGroup.children.forEach((sp, i) => {
        sp.scale.setScalar(0.1 + spread * (0.95 + i * 0.1));
      });
      return {
        cam: [
          { p: 0.0, pos: [-1.0, 0.5, 5.0], look: [0, 0.0, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.8, 0.2, 3.7],  look: [0, 0.1, 0], fov: 31, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 790, 1510, 'LIVER NECROSIS', 'SEVERE CEREULIDE DOSE', -2, (p - 0.3) * 3);
        }
      };
    }

    // S28: Not Just Rice — Pasta, Noodles & Biryani Trio
    case 28: {
      pool.starchTrio.visible = true;
      pool.starchTrio.rotation.y = lerp(-0.24, 0.24, p);
      return {
        cam: [
          { p: 0.0, pos: [-1.3, 0.9, 5.4], look: [-0.2, -0.5, 0.1], fov: 40, roll: 0 },
          { p: 1.0, pos: [1.3, 0.7, 4.6],  look: [0.2, -0.5, 0.1],  fov: 36, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1520, 'ANY STARCHY FOOD', 'RICE · PASTA · NOODLES · BIRYANI', 1, (p - 0.18) * 3);
        }
      };
    }

    // S29: 3 Simple Kitchen Rules Clipboard
    case 29: {
      pool.kitchen.visible = true;
      pool.kitchen.userData.steamGroup.visible = false;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.6, 5.8], look: [0, -0.2, 0], fov: 42, roll: 0 },
          { p: 1.0, pos: [0.4, 0.5, 5.4], look: [0, -0.2, 0], fov: 40, roll: 0 }
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

    // S30: Rule 1 — Cool Shallow & Fast (Tall Hot Pot vs Flat Wide Stainless Cooling Tray)
    case 30: {
      pool.shallowDeep.visible = true;
      return {
        cam: [
          { p: 0.0, pos: [-1.2, 0.9, 5.4], look: [-0.4, -0.6, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [1.3, 0.7, 4.2],  look: [0.9, -0.9, 0.1], fov: 33, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 270, 1480, 'DEEP POT', 'TRAPS HEAT', -3, (p - 0.1) * 3);
          drawPaperTag(ctx, 790, 1480, 'SHALLOW TRAY', 'COOLS FAST ✓', 2, (p - 0.4) * 3);
        }
      };
    }

    // S31: Rule 2 — Fridge Within 1–2 Hours (Cool Ice-Blue Illuminated Fridge Interior!)
    case 31: {
      pool.fridge.visible = true;
      const { containerGroup } = pool.fridge.userData;
      containerGroup.position.z = lerp(1.65, -0.05, easeOutCubic(clamp(p * 1.4)));
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.8, 0.5, 5.2], look: [0, 0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.4, 0.4, 4.0],  look: [0, 0.3, 0], fov: 33, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1540, 'WITHIN 1–2 HOURS', 'SEALED CONTAINER', -1.5, (p - 0.25) * 3);
        }
      };
    }

    // S32: Below 4°C — Spores Stay Asleep (Glass Thermometer Dropping into Ice-Blue Safe Zone!)
    case 32: {
      pool.thermometer.visible = true;
      pool.thermometer.rotation.y = lerp(0.28, -0.28, p);
      const { mercuryCol, dangerBand } = pool.thermometer.userData;
      const fillFrac = lerp(0.52, 0.14, easeInOutCubic(p));
      mercuryCol.scale.y = fillFrac;
      mercuryCol.position.y = -1.22 + (2.35 * fillFrac) * 0.5;
      dangerBand.material.opacity = 0.14;
      return {
        cam: [
          { p: 0.0, pos: [0.9, 0.2, 4.8], look: [0, -0.2, 0], fov: 37, roll: 0 },
          { p: 1.0, pos: [-0.6, -0.5, 3.6], look: [0, -0.8, 0], fov: 31, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1580, ['3','0','°','C'], ['0','3','°','C'], clamp(p * 1.6), 'SAFE ZONE — ZERO TOXIN GROWTH', 84, 114, 10);
        }
      };
    }

    // S33: Rule 3 — Over 2 Hours / Left Overnight? Throw It Out!
    case 33: {
      pool.kitchen.visible = true;
      pool.kitchen.userData.steamGroup.visible = false;
      const stampP = clamp((p - 0.38) * 3.0);
      return {
        shadowFloor: false,
        impact: { at: 0.40, mag: 0.20 },
        cam: [
          { p: 0.0, pos: [-0.8, 0.6, 4.6], look: [-0.2, -0.3, 0.2], fov: 37, roll: 0 },
          { p: 1.0, pos: [0.4, 0.4, 3.9],  look: [-0.2, -0.3, 0.2], fov: 34, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawRubberStamp(ctx, 540, 1540, 'THROW IT OUT!', -5, stampP, '#C82818');
        }
      };
    }

    // S34: Next Time You Leave Rice Out — Remember This Ring! (Glowing Cereulide Hovering Over Midnight Counter)
    case 34: {
      pool.cereulide.visible = true;
      pool.cereulide.userData.flameRing.visible = false;
      pool.cereulide.rotation.y = t * 0.9;
      pool.cereulide.rotation.x = 0.18;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.2, 4.6], look: [0, 0, 0], fov: 37, roll: 0 },
          { p: 1.0, pos: [0, 0.0, 3.5], look: [0, 0, 0], fov: 30, roll: 0 }
        ]
      };
    }

    // S35: Share This With Your Family!
    default: {
      pool.fridge.visible = true;
      pool.fridge.rotation.y = lerp(-0.2, 0.2, p);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.4, 5.4], look: [0, 0, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.4, 0.3, 5.0], look: [0, 0, 0], fov: 38, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawFamilyShareCard(ctx, 540, 1180, p);
        }
      };
    }
  }
}
