// All 36 Bespoke Dual-Beat Pure-Code Era-2 3D Diorama Scenes for "Water Intoxication" (v14.0)
// Features: Choreographed Transitions (whip/zoom_dive/film_flash/paper_wipe), Mid-Shot Vertical Shutter Headline Swaps,
// Live Vertex-Swelling Brain & Cell Morphing, Dynamic Crisis Lighting & Spring-Overshoot Archival Props!
import {
  W, H, clamp, lerp, easeOutCubic, easeOutExpo, easeInOutCubic, easeOutBack, springDamped,
  PALETTES, drawEra2Chrome
} from './dossier.js';
import { drawEra2Headline, drawPaperTag, drawDimensionCaliper } from './type.js';
import {
  drawSplitFlapBoard, drawTornNote, drawRubberStamp, drawJournalCard,
  drawChecklistBoard, drawHandCircle, drawLiveChartCard, drawSharePhoneCard
} from './props.js';
import { computeShotTransitionCamMod, renderTransitionPostFX } from './transitions.js';
import { getCore3D, configureStageMood, evalCamera3D, renderWebGLTo2D } from './core3d.js';
import {
  morphGeoSwelling,
  buildPouringGlass3D, buildRadioStudio3D, buildGameConsolePrize3D,
  buildBedroomCollapse3D, buildAutopsyBottle3D, buildWaterSodiumCluster3D,
  buildKidneyFilter3D, buildArterySodiumGauge3D, buildNeuronSpark3D,
  buildOsmometerTube3D, buildOsmosisCell3D, buildSoftVsSkullCompare3D,
  buildSkullBrain3D, buildSkullPressureGauge3D, buildVitalSwitchboard3D,
  buildMarathonDiorama3D, buildSweatElectrolyte3D, buildBabyBottleWarning3D,
  buildSalineIVRescue3D, buildMeasuringCylinder3D, buildElectrolyteFizzGlass3D,
  buildUrineChartRack3D, buildParacelsusScale3D
} from './models3d.js';

let _pool = null;

function getPool3D() {
  if (_pool) return _pool;
  const { stageGroup } = getCore3D();

  const pool = {
    pouringGlass:   buildPouringGlass3D(),
    radioStudio:    buildRadioStudio3D(),
    consolePrize:   buildGameConsolePrize3D(),
    bedroom:        buildBedroomCollapse3D(),
    autopsyBottle:  buildAutopsyBottle3D(),
    waterSodium:    buildWaterSodiumCluster3D(),
    kidney:         buildKidneyFilter3D(),
    arterySodium:   buildArterySodiumGauge3D(),
    neuron:         buildNeuronSpark3D(),
    osmometer:      buildOsmometerTube3D(),
    osmosisCell:    buildOsmosisCell3D(),
    softVsSkull:    buildSoftVsSkullCompare3D(),
    skullBrain:     buildSkullBrain3D(),
    icpGauge:       buildSkullPressureGauge3D(),
    switchboard:    buildVitalSwitchboard3D(),
    marathon:       buildMarathonDiorama3D(),
    sweatSalt:      buildSweatElectrolyte3D(),
    babyBottle:     buildBabyBottleWarning3D(),
    salineIV:       buildSalineIVRescue3D(),
    measureCyl:     buildMeasuringCylinder3D(),
    fizzGlass:      buildElectrolyteFizzGlass3D(),
    urineRack:      buildUrineChartRack3D(),
    scale:          buildParacelsusScale3D()
  };

  Object.values(pool).forEach((g) => {
    g.visible = false;
    stageGroup.add(g);
  });
  _pool = pool;
  return _pool;
}

export const SHOTS = [
  { id: 1,  t0: 0.00,   t1: 3.20,   pal: 'emeraldLab',     trans: 'cut',        tier1: 'CRYSTAL CLEAR',      tier2: 'PURE WATER',        tier2Alt: 'LIFE ITSELF',        accent: '#52D1F0' },
  { id: 2,  t0: 3.20,   t1: 6.50,   pal: 'midnightIndigo', trans: 'whip_left',  tier1: 'JANUARY 2007',       tier2: 'CALIFORNIA',        tier2Alt: 'LIVE ON RADIO',      accent: '#F7C137' },
  { id: 3,  t0: 6.50,   t1: 10.00,  pal: 'goldenOchre',    trans: 'paper_wipe', tier1: 'HOLD YOUR WEE',      tier2: 'FOR A WII!',        tier2Alt: 'FREE CONSOLE!',      accent: '#B81B10' },
  { id: 4,  t0: 10.00,  t1: 13.50,  pal: 'midnightIndigo', trans: 'whip_right', tier1: 'JENNIFER, AGE 28',   tier2: 'DRANK 7.5 LITERS',  tier2Alt: 'IN JUST 3 HOURS!',   accent: '#52D1F0' },
  { id: 5,  t0: 13.50,  t1: 16.80,  pal: 'midnightIndigo', trans: 'film_flash', tier1: '5 HOURS LATER',      tier2: 'SHE COLLAPSED',     tier2Alt: 'NEVER WOKE UP',      accent: '#FF5A36' },
  { id: 6,  t0: 16.80,  t1: 19.80,  pal: 'goldenOchre',    trans: 'whip_left',  tier1: 'AUTOPSY REPORT',     tier2: 'NOT POISON',        tier2Alt: 'ONLY PURE WATER!',   accent: '#B81B10' },
  { id: 7,  t0: 19.80,  t1: 23.00,  pal: 'velvetCrimson',  trans: 'zoom_dive',  tier1: 'DOCTORS CALL IT',    tier2: 'HYPONATREMIA',      tier2Alt: 'WATER OVERDOSE',     accent: '#F7C137' },
  { id: 8,  t0: 23.00,  t1: 26.20,  pal: 'warmKraft',      trans: 'paper_wipe', tier1: 'EVERYONE HEARS',     tier2: 'MORE = HEALTHIER',  tier2Alt: 'DEADLY IN EXCESS!',  accent: '#B81B10' },
  { id: 9,  t0: 26.20,  t1: 29.40,  pal: 'goldenOchre',    trans: 'whip_right', tier1: "YOUR BODY'S FILTER", tier2: 'THE KIDNEYS',       tier2Alt: 'BUILT-IN LIMIT',     accent: '#B81B10' },
  { id: 10, t0: 29.40,  t1: 32.80,  pal: 'emeraldLab',     trans: 'cut',        tier1: 'MAX FILTER SPEED',   tier2: '0.8 TO 1.0 L/HR',   tier2Alt: 'STRICT CEILING',     accent: '#4AE3B5' },
  { id: 11, t0: 32.80,  t1: 36.20,  pal: 'volcanicAmber',  trans: 'cut',        tier1: 'CHUG 2.5 LITERS?',   tier2: 'KIDNEYS OVERFLOW',  tier2Alt: 'FLOODS THE BLOOD!',  accent: '#FF6A38' },
  { id: 12, t0: 36.20,  t1: 39.60,  pal: 'velvetCrimson',  trans: 'zoom_dive',  tier1: 'INSIDE YOUR BLOOD',  tier2: 'SODIUM BALANCE',    tier2Alt: '135–145 mmol/L',     accent: '#F7C137' },
  { id: 13, t0: 39.60,  t1: 42.80,  pal: 'goldenOchre',    trans: 'whip_left',  tier1: 'WHY SODIUM?',        tier2: 'HOLDS FLUID',       tier2Alt: 'FIRES NERVES!',      accent: '#B81B10' },
  { id: 14, t0: 42.80,  t1: 46.20,  pal: 'velvetCrimson',  trans: 'cut',        tier1: 'FLOOD OF WATER',     tier2: 'DILUTES BLOOD',     tier2Alt: 'SODIUM CRASHES!',    accent: '#52D1F0' },
  { id: 15, t0: 46.20,  t1: 49.40,  pal: 'warmKraft',      trans: 'paper_wipe', tier1: 'BELOW 135 mmol/L',   tier2: 'DANGER STARTS',     tier2Alt: '118 = CRITICAL!',    accent: '#B81B10' },
  { id: 16, t0: 49.40,  t1: 52.80,  pal: 'midnightIndigo', trans: 'whip_right', tier1: 'PHYSICS TAKES OVER', tier2: 'OSMOSIS LAW',       tier2Alt: 'WATER CHASES SALT',  accent: '#52D1F0' },
  { id: 17, t0: 52.80,  t1: 56.20,  pal: 'velvetCrimson',  trans: 'zoom_dive',  tier1: 'BLOOD IS WATERY',    tier2: 'CELLS ARE SALTY',   tier2Alt: 'WATER RUSHES IN!',   accent: '#52D1F0' },
  { id: 18, t0: 56.20,  t1: 59.40,  pal: 'velvetCrimson',  trans: 'cut',        tier1: 'MILLIONS OF CELLS',  tier2: 'SWELL UP FAST',     tier2Alt: 'LIKE BALLOONS!',     accent: '#F7C137' },
  { id: 19, t0: 59.40,  t1: 62.60,  pal: 'goldenOchre',    trans: 'whip_left',  tier1: 'MUSCLES & SKIN?',    tier2: 'CAN STRETCH OUT',   tier2Alt: 'ROOM TO EXPAND',     accent: '#185A3B' },
  { id: 20, t0: 62.60,  t1: 66.20,  pal: 'volcanicAmber',  trans: 'zoom_dive',  tier1: 'YOUR BRAIN SITS IN', tier2: 'SOLID 7MM SKULL',   tier2Alt: 'ZERO SPACE!',        accent: '#F7C137' },
  { id: 21, t0: 66.20,  t1: 70.00,  pal: 'velvetCrimson',  trans: 'cut',        tier1: 'BRAIN CELLS SWELL',  tier2: 'CEREBRAL EDEMA',    tier2Alt: 'CRUSHED ON BONE!',   accent: '#FF5A36' },
  { id: 22, t0: 70.00,  t1: 73.20,  pal: 'volcanicAmber',  trans: 'cut',        tier1: 'SKULL PRESSURE',     tier2: 'SPIKES 4X HIGH',    tier2Alt: '45 mmHg CRISIS!',    accent: '#FF7038' },
  { id: 23, t0: 73.20,  t1: 76.60,  pal: 'midnightIndigo', trans: 'paper_wipe', tier1: 'FIRST SYMPTOMS',     tier2: 'SEVERE HEADACHE',   tier2Alt: 'NAUSEA & BLUR',      accent: '#F7C137' },
  { id: 24, t0: 76.60,  t1: 80.40,  pal: 'velvetCrimson',  trans: 'zoom_dive',  tier1: 'NOWHERE TO GO',      tier2: 'FORCED DOWNWARD',   tier2Alt: 'SKULL BASE TRAP!',   accent: '#FF5A36' },
  { id: 25, t0: 80.40,  t1: 84.00,  pal: 'volcanicAmber',  trans: 'cut',        tier1: 'BRAINSTEM CRUSHED',  tier2: 'BREATHING STOPS',   tier2Alt: 'COMA & ARREST',      accent: '#FF5A36' },
  { id: 26, t0: 84.00,  t1: 87.60,  pal: 'goldenOchre',    trans: 'film_flash', tier1: 'NOT JUST CONTESTS',  tier2: 'MARATHON RUNNERS',  tier2Alt: '1 IN 8 AFFECTED!',   accent: '#B81B10' },
  { id: 27, t0: 87.60,  t1: 90.80,  pal: 'warmKraft',      trans: 'whip_right', tier1: 'SWEAT LOSES BOTH',   tier2: 'WATER + SALT',      tier2Alt: 'PLAIN H2O DROPS Na+',accent: '#B81B10' },
  { id: 28, t0: 90.80,  t1: 94.00,  pal: 'volcanicAmber',  trans: 'whip_left',  tier1: 'BABIES UNDER 6 MO',  tier2: 'NO PLAIN WATER!',   tier2Alt: 'TINY KIDNEYS',       accent: '#F7C137' },
  { id: 29, t0: 94.00,  t1: 97.40,  pal: 'emeraldLab',     trans: 'film_flash', tier1: 'ICU EMERGENCY CURE', tier2: '3% SALINE IV',      tier2Alt: 'DRAWS WATER OUT!',   accent: '#4AE3B5' },
  { id: 30, t0: 97.40,  t1: 100.40, pal: 'midnightIndigo', trans: 'paper_wipe', tier1: 'STAY PROTECTED',     tier2: '3 SIMPLE RULES',    tier2Alt: 'HYDRATION GUIDE',    accent: '#4AE3B5' },
  { id: 31, t0: 100.40, t1: 103.80, pal: 'emeraldLab',     trans: 'whip_right', tier1: 'RULE 1: PACE IT',    tier2: "SIP, DON'T CHUG",   tier2Alt: 'MAX 800 ML / HR',    accent: '#52D1F0' },
  { id: 32, t0: 103.80, t1: 107.20, pal: 'goldenOchre',    trans: 'cut',        tier1: 'RULE 2: IN SWEAT',   tier2: 'ADD ELECTROLYTES',  tier2Alt: 'SODIUM + ORS!',      accent: '#B81B10' },
  { id: 33, t0: 107.20, t1: 110.60, pal: 'warmKraft',      trans: 'whip_left',  tier1: 'RULE 3: EASY CHECK', tier2: 'PALE STRAW COLOR',  tier2Alt: 'NOT WATER-CLEAR!',   accent: '#185A3B' },
  { id: 34, t0: 110.60, t1: 113.80, pal: 'emeraldLab',     trans: 'cut',        tier1: 'TRUST YOUR BODY',    tier2: 'DRINK TO THIRST',   tier2Alt: 'BUILT-IN SENSOR',    accent: '#4AE3B5' },
  { id: 35, t0: 113.80, t1: 116.90, pal: 'midnightIndigo', trans: 'zoom_dive',  tier1: 'ANCIENT MEDICAL LAW',tier2: 'DOSE = POISON',     tier2Alt: 'EVEN PURE H2O!',     accent: '#F7C137' },
  { id: 36, t0: 116.90, t1: 120.00, pal: 'emeraldLab',     trans: 'film_flash', tier1: 'SEND THIS TO YOUR',  tier2: 'GYM & RUN FRIENDS', tier2Alt: 'SHARE & SAVE!',      accent: '#F7C137' }
];

export function renderAtTime(ctx, t) {
  const ct = clamp(t, 0, 119.999);
  const idx = SHOTS.findIndex(s => ct >= s.t0 && ct < s.t1);
  const shotIdx = idx >= 0 ? idx : SHOTS.length - 1;
  const shot = SHOTS[shotIdx];
  const nextShot = SHOTS[shotIdx + 1] || null;

  const localT = ct - shot.t0;
  const dur = shot.t1 - shot.t0;
  const p = clamp(localT / dur);
  const pal = PALETTES[shot.pal] || PALETTES.goldenOchre;

  const pool = getPool3D();
  Object.values(pool).forEach(g => { g.visible = false; });

  const spec = stageShot3D(pool, shot.id, { t: ct, localT, dur, p, pal, shot });
  configureStageMood(
    shot.pal,
    ct,
    spec.shadowFloor !== false,
    spec.crisisPulse || 0,
    spec.crisisHex || 0xff3020
  );

  const transMod = computeShotTransitionCamMod(shot, nextShot, localT, dur);
  evalCamera3D(spec.cam, p, ct, spec.impact, transMod);
  renderWebGLTo2D(ctx);

  if (spec.hudDraw) {
    ctx.save();
    spec.hudDraw(ctx, { t: ct, localT, dur, p, pal, shot });
    ctx.restore();
  }

  drawEra2Chrome(ctx, pal);

  drawEra2Headline(ctx, shot.tier1, shot.tier2, localT, dur, pal, {
    accentColor: shot.accent,
    tier2Alt: shot.tier2Alt,
    swapAt: 0.48,
    ...(spec.headlineOpts || {})
  });

  renderTransitionPostFX(ctx, shot, nextShot, localT, dur, transMod);
}

function stageShot3D(pool, id, { t, p }) {
  switch (id) {
    // S01: Crystal Carafe Pouring Live Stream into Tumbler + Ripples & Rising Bubbles
    case 1: {
      pool.pouringGlass.visible = true;
      const { waterCol, ripples, bubbles, pitcher } = pool.pouringGlass.userData;
      const fill = lerp(0.55, 1.0, easeOutCubic(p));
      waterCol.scale.y = fill;
      waterCol.position.y = -0.95 + (1.26 * fill) * 0.5;
      ripples.position.y = waterCol.position.y + (1.26 * fill) * 0.5 + 0.02;
      ripples.children.forEach((r, i) => {
        const u = ((t * 1.4 + i * 0.33) % 1);
        r.scale.setScalar(0.55 + u * 0.9);
      });
      bubbles.children.forEach((b) => {
        const u = ((t * 1.1 + b.userData.phase) % 1);
        b.position.set(b.userData.bx, -0.9 + u * 0.95 * fill, b.userData.bz);
      });
      pitcher.rotation.z = -0.82 - p * 0.16;
      return {
        cam: [
          { p: 0.0, pos: [-1.0, 0.5, 5.2], look: [0.0, 0.0, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.5, 0.25, 4.3], look: [0.1, -0.05, 0], fov: 35, roll: 0.01 }
        ]
      };
    }

    // S02: January 2007 Sacramento FM Radio Studio + Glowing ON AIR Sign + Condenser Mic
    case 2: {
      pool.radioStudio.visible = true;
      const { bottles, onAirGlow } = pool.radioStudio.userData;
      bottles.forEach(b => { b.userData.fill.scale.y = 1.0; b.userData.fill.position.y = -0.02; });
      onAirGlow.intensity = 20 + 10 * Math.sin(t * 7);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-1.2, 0.6, 5.2], look: [0.0, -0.1, 0], fov: 40, roll: -0.01 },
          { p: 1.0, pos: [0.6, 0.35, 4.3], look: [-0.1, -0.15, 0.1], fov: 35, roll: 0.01 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1570, ['2','0','0','0'], ['2','0','0','7'], clamp(p * 2.2), 'JANUARY 12 · SACRAMENTO, CA', 88, 112, 11, p * 4);
        }
      };
    }

    // S03: "Hold Your Wee for a Wii!" — Gaming Console Grand Prize Pedestal
    case 3: {
      pool.consolePrize.visible = true;
      pool.consolePrize.rotation.y = lerp(-0.28, 0.32, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.4, 5.1], look: [0.1, -0.25, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.7, 0.2, 4.3],  look: [0.1, -0.25, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1520, 'GRAND PRIZE', 'NO BATHROOM BREAKS ALLOWED', -2, (p - 0.14) * 3);
        }
      };
    }

    // S04: Jennifer Strange Drank ~7.5 Liters in 3 Hours — 7 Contest Bottles Draining Rapidly!
    case 4: {
      pool.radioStudio.visible = true;
      const { bottles } = pool.radioStudio.userData;
      const drainedFloat = p * 7.2;
      bottles.forEach((b, idx) => {
        const rem = clamp(1 - (drainedFloat - idx * 0.85), 0.05, 1.0);
        b.userData.fill.scale.y = rem;
        b.userData.fill.position.y = -0.38 + (0.74 * rem) * 0.5;
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0.9, 0.4, 4.8], look: [0.2, -0.35, 0.1], fov: 38, roll: 0 },
          { p: 1.0, pos: [-0.3, 0.2, 4.0], look: [0.2, -0.42, 0.1], fov: 34, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1570, ['0','.','5',' ','L'], ['7','.','5',' ','L'], clamp(p * 1.9), 'CONSUMED IN JUST 3 HOURS', 88, 112, 11, p * 4);
        }
      };
    }

    // S05: 5 Hours Later — Bedroom Nightstand, Sweeping Clock & Medical Examiner Clipping
    case 5: {
      pool.bedroom.visible = true;
      pool.bedroom.userData.handGroup.rotation.z = -p * Math.PI * 1.45;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.7, 0.45, 5.1], look: [0.0, -0.35, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.3, 0.25, 4.4],  look: [0.0, -0.35, 0], fov: 36, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawJournalCard(ctx, 540, 1520, 840, 260, -1.2, 'SACRAMENTO CORONER REPORT · 2007', 'Mother of 3 Dies After Radio Stunt', [
            'Drank nearly 2 gallons of plain water in 3 hours.',
            'Cause of death: Acute Water Intoxication.'
          ], 1, clamp((p - 0.22) * 2.4), p * 3.5);
        }
      };
    }

    // S06: Autopsy Report — NOT POISON / ONLY PURE WATER!
    case 6: {
      pool.autopsyBottle.visible = true;
      pool.autopsyBottle.rotation.y = lerp(-0.28, 0.28, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.3, 4.9], look: [0, -0.05, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.7, 0.15, 4.2], look: [0, -0.05, 0], fov: 35, roll: 0 }
        ],
        headlineOpts: { strikeP: clamp((p - 0.16) * 3.5), swapAt: 0.56 },
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1520, '100% PURE H2O', 'ZERO DRUGS · ZERO TOXINS', -2.5, (p - 0.16) * 3);
        }
      };
    }

    // S07: Acute Hyponatremia — Macro 3D H2O Molecules Flooding Sparse Golden Na+ Ions
    case 7: {
      pool.waterSodium.visible = true;
      const { h2oGroup, naGroup } = pool.waterSodium.userData;
      h2oGroup.children.forEach((m) => {
        const a = m.userData.a + t * 0.65;
        const r = lerp(m.userData.rad * 1.25, m.userData.rad * 0.78, p);
        m.position.set(Math.cos(a) * r, m.userData.by * 0.72 + Math.sin(t * 2.2 + m.userData.phase) * 0.14, Math.sin(a) * r * 0.75);
        m.rotation.set(t * 1.4, a, m.userData.phase);
      });
      naGroup.rotation.y = -t * 0.8;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.2, 5.1], look: [0, 0, 0], fov: 39, roll: -0.02 },
          { p: 1.0, pos: [0.4, -0.05, 4.1], look: [0, 0, 0], fov: 34, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1540, 'HYPONATREMIA', '"LOW BLOOD SALT"', 1.5, (p - 0.18) * 3);
        }
      };
    }

    // S08: Myth Debunked — "More Water = Healthier" Sticky Note Slashed + DEADLY IN EXCESS Stamp!
    case 8: {
      pool.pouringGlass.visible = true;
      const { waterCol } = pool.pouringGlass.userData;
      waterCol.scale.y = 1.08;
      waterCol.position.y = -0.32;
      const sp = clamp((p - 0.20) * 3.0);
      return {
        cam: [
          { p: 0.0, pos: [0, 0.5, 5.3], look: [0.05, -0.15, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.4, 0.35, 4.7], look: [0.05, -0.15, 0], fov: 37, roll: 0 }
        ],
        headlineOpts: { strikeP: sp, swapAt: 0.54 },
        hudDraw: (ctx) => {
          drawTornNote(ctx, 540, 1330, 760, 200, -2.5, ['"JITNA ZYADA PAANI = HEALTHY"', 'UNLIMITED DETOX!'], { strikeP: sp, enterP: p * 4 });
          if (sp > 0.1) drawRubberStamp(ctx, 540, 1580, 'DEADLY IN EXCESS!', 3, sp, '#C82818');
        }
      };
    }

    // S09: Meet Your Body's Smart Filter — Sculpted Anatomical Kidney Cutaway on Museum Stand
    case 9: {
      pool.kidney.visible = true;
      pool.kidney.userData.overflowGroup.visible = false;
      pool.kidney.rotation.y = lerp(-0.30, 0.30, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.35, 5.1], look: [0, -0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.7, 0.15, 4.2],  look: [0, -0.05, 0], fov: 35, roll: 0.01 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 730, 1520, 'RENAL FILTER', '1 MILLION NEPHRONS', -2, (p - 0.18) * 3);
        }
      };
    }

    // S10: Max Filter Speed — 0.8 to 1.0 Liter Per Hour Ceiling + Hand-Drawn Red Circle!
    case 10: {
      pool.kidney.visible = true;
      pool.kidney.userData.overflowGroup.visible = false;
      pool.kidney.rotation.y = lerp(0.18, -0.18, p);
      return {
        cam: [
          { p: 0.0, pos: [0.6, 0.25, 4.8], look: [0, -0.1, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [-0.4, 0.10, 4.1], look: [0, -0.1, 0], fov: 34, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1570, ['0','.','2',' ','L','/','H'], ['0','.','8',' ','L','/','H'], clamp(p * 2.2), 'MAXIMUM SAFE EXCRETION RATE', 80, 108, 9, p * 4);
          drawHandCircle(ctx, 540, 1575, 365, 86, (p - 0.45) * 2.4, '#4AE3B5');
        }
      };
    }

    // S11: Chug 2.5 Liters? Kidneys Overflow! Excess Blue Water Spills Out Over Funnel!
    case 11: {
      pool.kidney.visible = true;
      const { overflowGroup } = pool.kidney.userData;
      overflowGroup.visible = true;
      overflowGroup.children.forEach((d) => {
        const u = ((t * 1.35 + d.userData.phase) % 1);
        const x = -0.12 + d.userData.dir * (0.28 + u * 0.95);
        const y = 1.24 + Math.sin(u * Math.PI) * 0.35 - u * 1.95;
        d.position.set(x, y, 0.22);
      });
      return {
        crisisPulse: 0.55 + 0.35 * Math.sin(t * 9),
        impact: { at: 0.18, mag: 0.18 },
        cam: [
          { p: 0.0, pos: [-0.6, 0.5, 5.1], look: [0, 0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.5, 0.3, 4.3],  look: [0, 0.0, 0], fov: 35, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1530, '2.5 L / HR INTAKE', 'BACKS UP INTO BLOOD!', 2, (p - 0.16) * 3);
        }
      };
    }

    // S12: Inside Your Blood — Balanced Sodium 135–145 mmol/L (Needle in Safe Right Green Zone!)
    case 12: {
      pool.arterySodium.visible = true;
      const { needle, flowGroup, waterFlood } = pool.arterySodium.userData;
      waterFlood.visible = false;
      // Right side = green normal (~ -1.25 rad)
      needle.rotation.z = -1.22 + Math.sin(t * 3) * 0.05;
      flowGroup.children.forEach((m) => {
        m.visible = true;
        const u = ((t * 0.34 + m.userData.offset) % 1);
        const br = m.userData.branch;
        const x = u < 0.42 ? Math.sin(u * 12 + br) * 0.12 : lerp(0, br * 1.30, (u - 0.42) / 0.58);
        const y = u < 0.42 ? lerp(-2.3, -0.42, u / 0.42) : lerp(-0.42, 2.0, (u - 0.42) / 0.58);
        m.position.set(x, y, 0.18);
        m.rotation.set(t * 2, t * 1.5, 0);
      });
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.55, 5.2], look: [0, 0.15, 0.2], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.25, 0.30, 4.3], look: [0, 0.10, 0.35], fov: 34, roll: 0.01 }
        ]
      };
    }

    // S13: Why Sodium? Holds Fluid & Fires Electric Nerve Signals!
    case 13: {
      pool.neuron.visible = true;
      const { sparks, axCurve } = pool.neuron.userData;
      sparks.children.forEach((ring) => {
        const u = ((t * 0.85 + ring.userData.offset) % 1);
        ring.position.copy(axCurve.getPointAt(u));
        ring.scale.setScalar(0.85 + Math.sin(u * Math.PI) * 0.45);
      });
      pool.neuron.rotation.y = lerp(-0.22, 0.22, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.8, 0.35, 5.0], look: [0, 0.0, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.7, 0.15, 4.2],  look: [0.1, 0.0, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1520, 'SODIUM (Na+)', 'NERVE IMPULSE DRIVER', -1.5, (p - 0.16) * 3);
        }
      };
    }

    // S14: Flood of Water Dilutes Your Blood — Clinical Dial Plummets from Green 140 into Red 118!
    case 14: {
      pool.arterySodium.visible = true;
      const { needle, flowGroup, waterFlood } = pool.arterySodium.userData;
      waterFlood.visible = true;
      // Plunge needle from right green (-1.22) all the way to left crimson (+1.48)!
      needle.rotation.z = lerp(-1.22, 1.48, easeInOutCubic(p));
      flowGroup.children.forEach((m, i) => {
        // Hide most golden Na+ ions as dilution worsens!
        m.visible = !m.userData.isNa || (i % 6 === 0);
        const u = ((t * 0.42 + m.userData.offset) % 1);
        const br = m.userData.branch;
        const x = u < 0.42 ? 0 : lerp(0, br * 1.30, (u - 0.42) / 0.58);
        const y = u < 0.42 ? lerp(-2.3, -0.42, u / 0.42) : lerp(-0.42, 2.0, (u - 0.42) / 0.58);
        m.position.set(x, y, 0.18);
      });
      waterFlood.children.forEach((w) => {
        const u = ((t * 0.72 + w.userData.offset) % 1);
        const br = w.userData.branch;
        const x = u < 0.42 ? Math.sin(u * 15 + br) * 0.16 : lerp(0, br * 1.32, (u - 0.42) / 0.58);
        const y = u < 0.42 ? lerp(-2.3, -0.42, u / 0.42) : lerp(-0.42, 2.0, (u - 0.42) / 0.58);
        w.position.set(x, y, 0.22);
      });
      return {
        shadowFloor: false,
        crisisPulse: p * 0.7,
        cam: [
          { p: 0.0, pos: [-0.2, 0.50, 5.0], look: [0, 0.10, 0.2], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.15, 0.25, 4.1], look: [0, 0.05, 0.35], fov: 33, roll: 0.01 }
        ]
      };
    }

    // S15: Below 135 mmol/L Danger Starts — Live Ink-Drawn Clinical Sodium Crash Chart + Red Circle!
    case 15: {
      pool.waterSodium.visible = true;
      pool.waterSodium.rotation.y = t * 0.35;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.4, 5.6], look: [0, -0.2, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.3, 0.3, 5.2], look: [0, -0.2, 0], fov: 38, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawLiveChartCard(
            ctx, 540, 1080, 840, 480,
            'SERUM SODIUM (mmol/L) OVER 3 HOURS',
            '140', '115',
            [[0.0, 0.88], [0.22, 0.82], [0.45, 0.62], [0.68, 0.38], [0.85, 0.20], [1.0, 0.12]],
            clamp(p * 1.35),
            p * 4
          );
          if (p > 0.58) {
            drawHandCircle(ctx, 845, 1218, 72, 48, (p - 0.58) * 3.0, '#D92418');
          }
          drawSplitFlapBoard(ctx, 540, 1580, ['1','4','0',' ','N','a'], ['1','1','8',' ','N','a'], clamp(p * 2.0), 'CRITICAL HYPONATREMIA (< 120)', 84, 108, 10, p * 4);
        }
      };
    }

    // S16: Osmosis Law — U-Tube Osmometer: Dilute Left Water Pushes Into Salty Right Column!
    case 16: {
      pool.osmometer.visible = true;
      const { leftCol, rightCol } = pool.osmometer.userData;
      const shift = easeInOutCubic(p);
      const lFrac = lerp(0.95, 0.52, shift);
      const rFrac = lerp(0.62, 1.16, shift);
      leftCol.scale.y = lFrac;
      leftCol.position.y = -0.78 + (1.5 * lFrac) * 0.5;
      rightCol.scale.y = rFrac;
      rightCol.position.y = -0.78 + (1.5 * rFrac) * 0.5;
      pool.osmometer.rotation.y = lerp(-0.24, 0.24, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.8, 0.4, 5.1], look: [0, -0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.6, 0.2, 4.3],  look: [0.1, -0.05, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 290, 1510, 'LOW SALT', 'WATER LEAVES', -2, (p - 0.12) * 3);
          drawPaperTag(ctx, 790, 1510, 'HIGH SALT', 'WATER SURGES ↑', 2, (p - 0.35) * 3);
        }
      };
    }

    // S17: Blood Is Watery, Cells Are Salty — Water Rushes In Through Cyan Aquaporin Pores!
    case 17: {
      pool.osmosisCell.visible = true;
      const { cellGeo, pores, waterInflux } = pool.osmosisCell.userData;
      const swell = lerp(1.0, 1.24, easeInOutCubic(p));
      morphGeoSwelling(cellGeo, swell, 99, t);
      pores.scale.setScalar(swell);
      waterInflux.children.forEach((w) => {
        const u = ((t * 0.95 + w.userData.offset) % 1);
        const r = lerp(1.85, 0.35, u);
        w.position.set(Math.cos(w.userData.ang) * r, Math.sin(w.userData.ang) * r, Math.sin(u * 6) * 0.12);
      });
      pool.osmosisCell.rotation.y = lerp(-0.25, 0.25, p);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.7, 0.35, 5.2], look: [0, 0, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.5, 0.15, 4.3],  look: [0, 0, 0], fov: 35, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1540, 'AQUAPORIN PORES', 'RAPID H2O INFLUX', -1.5, (p - 0.18) * 3);
        }
      };
    }

    // S18: Millions of Cells Swell Like Balloons! (LIVE REAL-TIME 1.68X VERTEX SWELLING!)
    case 18: {
      pool.osmosisCell.visible = true;
      const { cellGeo, pores, waterInflux } = pool.osmosisCell.userData;
      const swell = lerp(1.18, 1.66, springDamped(p, 8, 5));
      morphGeoSwelling(cellGeo, swell, 99, t * 1.4);
      pores.scale.setScalar(swell);
      waterInflux.children.forEach((w, i) => {
        const a = (i / 20) * Math.PI * 2 + t;
        w.position.set(Math.cos(a) * 0.55 * swell, Math.sin(a) * 0.55 * swell, 0.18);
      });
      return {
        shadowFloor: false,
        crisisPulse: 0.45 + 0.35 * Math.sin(t * 8),
        cam: [
          { p: 0.0, pos: [0, 0.2, 5.0], look: [0, 0, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.3, 0.1, 4.4], look: [0, 0, 0], fov: 36, roll: -0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1540, 'CELLULAR EDEMA', 'MEMBRANE STRETCHED TAUT', 2, (p - 0.2) * 3);
        }
      };
    }

    // S19: Muscles & Skin Can Stretch Out — Soft Muscle Expands vs Rigid Bone Box
    case 19: {
      pool.softVsSkull.visible = true;
      const { softMuscle, trapped } = pool.softVsSkull.userData;
      softMuscle.scale.setScalar(1.0 + 0.36 * easeInOutCubic(p));
      trapped.scale.setScalar(1.0 + 0.12 * Math.sin(t * 8));
      return {
        cam: [
          { p: 0.0, pos: [-0.6, 0.45, 5.2], look: [0, -0.35, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.6, 0.30, 4.6],  look: [0, -0.35, 0], fov: 36, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 290, 1500, 'SOFT MUSCLE', 'STRETCHES SAFELY ✓', -2, (p - 0.12) * 3);
          drawPaperTag(ctx, 790, 1500, 'RIGID SKULL', 'LOCKED CAGE!', 2, (p - 0.38) * 3);
        }
      };
    }

    // S20: HERO SHOWPIECE #1 — Your Brain Sits Inside a Solid 7mm Ivory Skull Vault!
    case 20: {
      pool.skullBrain.visible = true;
      const { hemiGeoL, hemiGeoR, leftHemi, rightHemi, brainstem, mats } = pool.skullBrain.userData;
      leftHemi.material = mats.brainTissue;
      rightHemi.material = mats.brainTissue;
      morphGeoSwelling(hemiGeoL, 1.0, 1.15, 0);
      morphGeoSwelling(hemiGeoR, 1.0, 1.15, 0);
      brainstem.position.y = 0;
      pool.skullBrain.rotation.y = lerp(-0.34, 0.28, p);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [-0.8, 0.35, 5.2], look: [0, -0.05, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.5, 0.15, 4.3],  look: [0, -0.05, 0], fov: 35, roll: 0.01 }
        ],
        hudDraw: (ctx) => {
          drawDimensionCaliper(ctx, 260, 1510, 820, 1510, '7 MM SOLID CORTICAL BONE · ZERO GIVE', true, (p - 0.18) * 3);
        }
      };
    }

    // S21: Cerebral Edema — Live Brain Hemispheres Swell & Crush Tightly Against Inner Skull Bone!
    case 21: {
      pool.skullBrain.visible = true;
      const { hemiGeoL, hemiGeoR, leftHemi, rightHemi, brainstem, mats } = pool.skullBrain.userData;
      leftHemi.material = mats.brainEdema;
      rightHemi.material = mats.brainEdema;
      // Swell brain gyri until clamped flat against the unyielding 1.16 inner skull radius!
      const swell = lerp(1.02, 1.38, easeInOutCubic(p));
      morphGeoSwelling(hemiGeoL, swell, 1.10, t * 1.5);
      morphGeoSwelling(hemiGeoR, swell, 1.10, t * 1.5);
      brainstem.position.y = -p * 0.12;
      pool.skullBrain.rotation.y = lerp(0.18, -0.18, p);
      return {
        shadowFloor: false,
        crisisPulse: 0.65 + 0.35 * Math.sin(t * 11),
        impact: { at: 0.32, mag: 0.22 },
        cam: [
          { p: 0.0, pos: [0.4, 0.25, 4.9], look: [0, 0.0, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [-0.3, 0.10, 4.1], look: [0, 0.05, 0.1], fov: 34, roll: -0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1550, 'CEREBRAL EDEMA', 'BRAIN CRUSHED AGAINST SKULL', 2, (p - 0.22) * 3);
        }
      };
    }

    // S22: Skull Pressure Spikes 4x High — Intracranial Manometer Slamming 10 -> 45 mmHg!
    case 22: {
      pool.icpGauge.visible = true;
      pool.icpGauge.rotation.y = lerp(-0.22, 0.22, p);
      // Left green (+1.45) -> Right blazing red (-1.48)
      pool.icpGauge.userData.needle.rotation.z = lerp(1.42, -1.48, easeInOutCubic(p));
      return {
        crisisPulse: 0.6 + 0.4 * Math.sin(t * 12),
        impact: { at: 0.45, mag: 0.18 },
        cam: [
          { p: 0.0, pos: [-0.8, 0.35, 5.1], look: [0, 0.0, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.6, 0.15, 4.3],  look: [0, 0.0, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1580, ['1','0',' ','m','m','H','g'], ['4','5',' ','m','m','H','g'], clamp(p * 2.1), 'INTRACRANIAL PRESSURE CRISIS', 76, 108, 9, p * 4);
        }
      };
    }

    // S23: Early Warnings — Severe Headache, Nausea & Confusion (Often Mistaken for Heatstroke!)
    case 23: {
      pool.bedroom.visible = true;
      pool.bedroom.userData.handGroup.rotation.z = -1.8;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.5, 5.6], look: [0, -0.2, 0], fov: 41, roll: 0 },
          { p: 1.0, pos: [0.3, 0.4, 5.2], look: [0, -0.2, 0], fov: 39, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawChecklistBoard(ctx, 540, 1090, 820, 470, 'EARLY RED-FLAG SYMPTOMS', [
            { text: '1. THROBBING HEADACHE', checked: true, appearAt: 0.06 },
            { text: '2. SUDDEN NAUSEA & VOMITING', checked: true, appearAt: 0.28 },
            { text: '3. DROWSY CONFUSION', checked: true, appearAt: 0.50 }
          ], p);
        }
      };
    }

    // S24: HERO SHOWPIECE #2 — Nowhere To Go: Brainstem Forced Down Through Foramen Magnum!
    case 24: {
      pool.skullBrain.visible = true;
      const { hemiGeoL, hemiGeoR, leftHemi, rightHemi, brainstem, mats } = pool.skullBrain.userData;
      leftHemi.material = mats.brainEdema;
      rightHemi.material = mats.brainEdema;
      morphGeoSwelling(hemiGeoL, 1.36, 1.10, t);
      morphGeoSwelling(hemiGeoR, 1.36, 1.10, t);
      // Brainstem physically herniates downward through the skull base hole!
      brainstem.position.y = -easeInOutCubic(p) * 0.44;
      pool.skullBrain.rotation.y = lerp(-0.22, 0.22, p);
      return {
        shadowFloor: false,
        crisisPulse: 0.8 + 0.2 * Math.sin(t * 14),
        impact: { at: 0.28, mag: 0.26 },
        cam: [
          { p: 0.0, pos: [-0.5, 0.1, 5.0], look: [0, -0.35, 0], fov: 38, roll: 0 },
          { p: 1.0, pos: [0.3, -0.35, 4.0], look: [0, -0.65, 0.1], fov: 33, roll: 0.02 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1550, 'FORAMEN MAGNUM', 'BRAINSTEM HERNIATION!', -2, (p - 0.18) * 3);
        }
      };
    }

    // S25: Brainstem Crushed — Breathing & Heart Switches Snap OFF! (R08 S24 Homage!)
    case 25: {
      pool.switchboard.visible = true;
      const { switches, bulbs } = pool.switchboard.userData;
      switches.forEach((sw, idx) => {
        const snapP = easeOutBack(clamp((p - idx * 0.18) * 2.4), 1.6);
        sw.rotation.x = lerp(-0.35, 1.95, snapP);
        bulbs[idx].color.setHex(snapP > 0.55 ? 0x7f1d1d : 0x34d399);
      });
      pool.switchboard.rotation.y = lerp(-0.20, 0.20, p);
      return {
        crisisPulse: 0.65,
        impact: { at: 0.25, mag: 0.22 },
        cam: [
          { p: 0.0, pos: [-0.7, 0.3, 5.0], look: [0, 0.0, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.5, 0.1, 4.2],  look: [0, -0.05, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 320, 1510, 'LUNGS: OFF', 'RESPIRATORY ARREST', -2, (p - 0.18) * 3);
          drawPaperTag(ctx, 760, 1510, 'HEART: OFF', 'BRAINSTEM COMA', 2, (p - 0.36) * 3);
        }
      };
    }

    // S26: Not Just Contests — Marathon Runners Hydration Station (1 in 8 Boston Finishers!)
    case 26: {
      pool.marathon.visible = true;
      pool.marathon.rotation.y = lerp(-0.22, 0.22, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.75, 5.3], look: [0, -0.35, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.8, 0.55, 4.6],  look: [0, -0.35, 0], fov: 36, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawJournalCard(ctx, 540, 1520, 840, 250, 1.2, 'NEW ENGLAND JOURNAL OF MEDICINE', 'Boston Marathon Study — 488 Runners', [
            '13% (1 in 8 finishers) developed hyponatremia',
            'from drinking excessive water at every mile.'
          ], 0, clamp((p - 0.20) * 2.4), p * 3.5);
        }
      };
    }

    // S27: Sweat Loses Water + Salt — Plain Water Drops Sodium Faster!
    case 27: {
      pool.sweatSalt.visible = true;
      const { saltCubes, sweatDrop } = pool.sweatSalt.userData;
      saltCubes.rotation.z = t * 0.9;
      sweatDrop.position.y = -0.18 + Math.sin(t * 3) * 0.08;
      return {
        cam: [
          { p: 0.0, pos: [-0.6, 0.45, 5.2], look: [0, -0.35, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.6, 0.30, 4.6],  look: [0, -0.35, 0], fov: 36, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 290, 1500, 'SWEAT LOSS', 'WATER + SALT (Na+)', -2, (p - 0.12) * 3);
          drawPaperTag(ctx, 790, 1500, 'PLAIN WATER', '0 mg SALT!', 2, (p - 0.38) * 3);
        }
      };
    }

    // S28: Babies Under 6 Months — NEVER Give Plain Water!
    case 28: {
      pool.babyBottle.visible = true;
      pool.babyBottle.rotation.y = lerp(-0.26, 0.26, p);
      const stampP = clamp((p - 0.36) * 3.0);
      return {
        cam: [
          { p: 0.0, pos: [-0.8, 0.35, 5.0], look: [0, -0.05, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.6, 0.15, 4.2],  look: [0, -0.05, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawRubberStamp(ctx, 540, 1550, 'MILK / FORMULA ONLY!', -4, stampP, '#FF5A36');
        }
      };
    }

    // S29: Hospital ICU Rescue — 3% Hypertonic Saline IV Pulls Excess Water Out of Brain!
    case 29: {
      pool.salineIV.visible = true;
      const { dripDrops } = pool.salineIV.userData;
      dripDrops.children.forEach((d) => {
        const u = ((t * 1.3 + d.userData.offset) % 1);
        d.position.set(0, lerp(-0.42, -0.84, u), 0);
      });
      pool.salineIV.rotation.y = lerp(-0.20, 0.22, p);
      return {
        shadowFloor: false,
        crisisPulse: 0.55,
        crisisHex: 0x34d399,
        cam: [
          { p: 0.0, pos: [-0.8, 0.4, 5.2], look: [0, 0.1, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.5, 0.2, 4.3],  look: [0, 0.05, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1540, '3% NaCl IV DRIP', 'REVERSES BRAIN SWELLING ✓', -1.5, (p - 0.18) * 3);
        }
      };
    }

    // S30: 3 Simple Hydration Rules Clipboard
    case 30: {
      pool.pouringGlass.visible = true;
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.5, 5.6], look: [0, -0.2, 0], fov: 41, roll: 0 },
          { p: 1.0, pos: [0.3, 0.4, 5.2], look: [0, -0.2, 0], fov: 39, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawChecklistBoard(ctx, 540, 1090, 820, 470, 'SAFE HYDRATION PROTOCOL', [
            { text: '1. SIP <= 800 ML PER HOUR', checked: true, appearAt: 0.06 },
            { text: '2. ADD ORS / SALT IN SWEAT', checked: true, appearAt: 0.28 },
            { text: '3. AIM FOR PALE-STRAW URINE', checked: true, appearAt: 0.50 }
          ], p);
        }
      };
    }

    // S31: Rule 1 — Pace Your Water: Graduated Cylinder Stopping Safely at 800 mL / Hr!
    case 31: {
      pool.measureCyl.visible = true;
      const { waterFill } = pool.measureCyl.userData;
      const f = lerp(0.28, 0.80, easeOutCubic(clamp(p * 1.4)));
      waterFill.scale.y = f;
      waterFill.position.y = -1.32 + (2.2 * f) * 0.5;
      pool.measureCyl.rotation.y = lerp(-0.24, 0.24, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.35, 5.1], look: [0, -0.05, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.7, 0.15, 4.3],  look: [0, 0.0, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSplitFlapBoard(ctx, 540, 1580, ['2','0','0',' ','M','L'], ['8','0','0',' ','M','L'], clamp(p * 2.1), 'SAFE HOURLY HYDRATION CEILING', 84, 110, 10, p * 4);
        }
      };
    }

    // S32: Rule 2 — Heavy Sweat? Drop an Electrolyte / ORS Tablet!
    case 32: {
      pool.fizzGlass.visible = true;
      const { tablet, fizz } = pool.fizzGlass.userData;
      const drop = easeOutCubic(clamp(p * 1.8));
      tablet.position.set(0, lerp(1.15, -0.78, drop), 0);
      tablet.rotation.z = t * 2.5;
      fizz.children.forEach((b) => {
        const u = ((t * 1.25 + b.userData.phase) % 1);
        b.visible = p > 0.18;
        b.position.set(b.userData.bx, -0.82 + u * 1.15, b.userData.bz);
      });
      return {
        cam: [
          { p: 0.0, pos: [-0.9, 0.45, 5.0], look: [0, -0.05, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.7, 0.20, 4.2],  look: [0, -0.10, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1530, 'ORS · ELECTROLYTES', 'REPLACES LOST SODIUM ✓', 2, (p - 0.22) * 3);
        }
      };
    }

    // S33: Rule 3 — Easy Hydration Check: 5-Tube Clinical Urine Color Spectrum Rack!
    case 33: {
      pool.urineRack.visible = true;
      const { tubes } = pool.urineRack.userData;
      // Gently elevate tubes 1 & 2 (Pale Straw Ideal!) on Beat B
      const lift = easeOutBack(clamp((p - 0.25) * 2.2), 1.5);
      tubes.forEach((tg, idx) => {
        tg.position.y = -0.18 + ((idx === 1 || idx === 2) ? lift * 0.26 : 0);
      });
      pool.urineRack.rotation.y = lerp(-0.20, 0.20, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.7, 0.45, 5.2], look: [0, -0.15, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.6, 0.25, 4.5],  look: [0, -0.15, 0], fov: 36, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 260, 1510, 'WATER CLEAR', 'OVERHYDRATED!', -2, (p - 0.12) * 3);
          drawPaperTag(ctx, 790, 1510, 'PALE STRAW', 'IDEAL BALANCE ✓', 2, (p - 0.35) * 3);
        }
      };
    }

    // S34: Trust Your Body's Built-In Thirst Sensor — Healthy Brain inside Skull!
    case 34: {
      pool.skullBrain.visible = true;
      const { hemiGeoL, hemiGeoR, leftHemi, rightHemi, brainstem, mats } = pool.skullBrain.userData;
      leftHemi.material = mats.brainTissue;
      rightHemi.material = mats.brainTissue;
      morphGeoSwelling(hemiGeoL, 1.0, 1.15, 0);
      morphGeoSwelling(hemiGeoR, 1.0, 1.15, 0);
      brainstem.position.y = 0;
      pool.skullBrain.rotation.y = lerp(0.26, -0.26, p);
      return {
        shadowFloor: false,
        crisisPulse: 0.45,
        crisisHex: 0x34d399,
        cam: [
          { p: 0.0, pos: [0.7, 0.35, 5.0], look: [0, 0.0, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [-0.5, 0.15, 4.2], look: [0, 0.0, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1530, 'HYPOTHALAMUS', '140 mmol/L THIRST GAUGE', -1.5, (p - 0.18) * 3);
        }
      };
    }

    // S35: Paracelsus Ancient Law — The Dose Makes The Poison (Brass Balance Scale!)
    case 35: {
      pool.scale.visible = true;
      const { beamGroup } = pool.scale.userData;
      // Settles from oscillating tilt into serene horizontal equilibrium!
      beamGroup.rotation.z = Math.sin(t * 3.5) * 0.24 * (1 - easeOutCubic(p));
      pool.scale.rotation.y = lerp(-0.24, 0.24, p);
      return {
        cam: [
          { p: 0.0, pos: [-0.8, 0.4, 5.1], look: [0, -0.05, 0], fov: 39, roll: 0 },
          { p: 1.0, pos: [0.6, 0.2, 4.3],  look: [0, -0.05, 0], fov: 35, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawPaperTag(ctx, 540, 1530, 'WATER + ELECTROLYTES', 'EQUILIBRIUM IS LIFE', 1.5, (p - 0.18) * 3);
        }
      };
    }

    // S36: Share This With Your Gym & Runner Friends!
    default: {
      pool.urineRack.visible = true;
      pool.urineRack.rotation.y = lerp(-0.18, 0.18, p);
      return {
        shadowFloor: false,
        cam: [
          { p: 0.0, pos: [0, 0.35, 5.6], look: [0, 0, 0], fov: 40, roll: 0 },
          { p: 1.0, pos: [0.35, 0.25, 5.2], look: [0, 0, 0], fov: 38, roll: 0 }
        ],
        hudDraw: (ctx) => {
          drawSharePhoneCard(ctx, 540, 1180, p);
        }
      };
    }
  }
}
