// Sovereign v15.0 — Master 32-Shot Native 1080x1920 Compositor & Continuous Multi-Shot Camera Director
import { getStudio, applyLightingPreset } from './core3d.js';
import {
  W, H, clamp, lerp, easeOutCubic, easeInOutCubic,
  drawBackdrop, drawArchivalSheetChrome
} from './dossier.js';
import { drawProgressiveHeadline } from './type.js';
import {
  drawCoronerArchivalSet,
  drawMythStickyNotes,
  drawElectrolytePathologyCard,
  drawMarathonExcerptCard,
  drawPocketSummaryCard
} from './props.js';
import {
  buildKidneyStandWorld,
  buildArterySodiumWorld,
  buildOsmosisMembraneWorld,
  buildSkullBrainWorld
} from './relief_anatomy.js';
import {
  buildRadioStudioWorld,
  buildBedroomNightWorld,
  buildEvidenceBoardWorld,
  buildSwitchboardIcuWorld,
  buildRealCasesIcuWorld,
  buildHydrationRulesWorld
} from './models3d.js';

export const SHOTS = [
  // WORLD 1: 2007 KDND Radio Broadcast Studio (S01 - S04)
  {
    id: 'S01', t0: 0.0, t1: 3.6, world: 'radio_studio', light: 'radio_booth', palette: 'studio_day',
    line1: 'JANUARY 2007', line2: 'LIVE ON RADIO', accent: '#F49328', line2Delay: 0.56,
    cam0: [0.05, 0.52, 7.15], cam1: [0.05, 0.48, 6.55], look0: [0.05, 0.45, -0.4], look1: [0.05, 0.42, -0.4], fov: 35
  },
  {
    id: 'S02', t0: 3.6, t1: 7.4, world: 'radio_studio', light: 'radio_booth', palette: 'studio_day',
    line1: 'THE CONTEST RULE:', line2: "DON'T PEE TO WIN", accent: '#49CEFF', line2Delay: 0.60,
    cam0: [0.58, 0.22, 5.45], cam1: [0.66, 0.18, 4.95], look0: [0.58, 0.02, -0.15], look1: [0.64, 0.00, -0.18], fov: 33
  },
  {
    id: 'S03', t0: 7.4, t1: 11.4, world: 'radio_studio', light: 'radio_booth', palette: 'studio_day',
    line1: 'JENNIFER DRANK', line2: '7.5 LITERS IN 3 HOURS', accent: '#F49328', line2Delay: 0.58,
    cam0: [-0.75, 0.18, 4.65], cam1: [0.65, 0.20, 4.45], look0: [-0.30, -0.10, 0.45], look1: [0.45, -0.06, 0.40], fov: 33
  },
  {
    id: 'S04', t0: 11.4, t1: 15.0, world: 'radio_studio', light: 'radio_booth', palette: 'studio_alert',
    line1: 'ON LIVE AIR', line2: 'BLINDING HEAD PAIN', accent: '#FF4B45', line2Delay: 0.56,
    cam0: [-0.48, 0.34, 3.85], cam1: [-0.42, 0.36, 3.35], look0: [-0.48, 0.18, 0.25], look1: [-0.45, 0.20, 0.25], fov: 31
  },

  // WORLD 2: Moonlit Bedroom & Coroner Archival Evidence (S05 - S07)
  {
    id: 'S05', t0: 15.0, t1: 19.0, world: 'bedroom_night', light: 'night_bedroom', palette: 'night_indigo',
    line1: 'FIVE HOURS LATER', line2: 'FOUND UNCONSCIOUS', accent: '#FF4B45', line2Delay: 0.60,
    cam0: [-0.32, 0.45, 6.95], cam1: [-0.22, 0.38, 6.35], look0: [-0.28, -0.18, -0.45], look1: [-0.18, -0.22, -0.50], fov: 35
  },
  {
    id: 'S06', t0: 19.0, t1: 22.8, world: 'evidence_board', light: 'warm_museum', palette: 'ochre_board',
    line1: 'CAUSE OF DEATH:', line2: 'PURE DRINKING WATER', accent: '#FFFDF7', line2Delay: 0.58,
    cam0: [0.0, 0.2, 6.2], cam1: [0.0, 0.2, 5.9], look0: [0.0, 0.2, 0.0], look1: [0.0, 0.2, 0.0], fov: 34,
    overlay: 'coroner'
  },
  {
    id: 'S07', t0: 22.8, t1: 26.5, world: 'evidence_board', light: 'warm_museum', palette: 'ochre_board',
    line1: '"MORE WATER = SAFE"', line2: 'A DEADLY MYTH', accent: '#FF443B', line2Delay: 0.58,
    cam0: [0.0, 0.2, 6.2], cam1: [0.0, 0.2, 5.95], look0: [0.0, 0.2, 0.0], look1: [0.0, 0.2, 0.0], fov: 34,
    overlay: 'myths'
  },

  // WORLD 3: Sagittal Kidney Cross-Section & Flowmeter Bench (S08 - S11)
  {
    id: 'S08', t0: 26.5, t1: 30.2, world: 'kidney_stand', light: 'warm_museum', palette: 'ochre_board',
    line1: 'YOUR TWO KIDNEYS', line2: 'HAVE A SPEED LIMIT', accent: '#FFFDF7', line2Delay: 0.58,
    cam0: [0.02, 0.42, 8.25], cam1: [0.02, 0.40, 7.65], look0: [0.02, 0.48, 0.0], look1: [0.02, 0.46, 0.0], fov: 34
  },
  {
    id: 'S09', t0: 30.2, t1: 34.0, world: 'kidney_stand', light: 'warm_museum', palette: 'ochre_board',
    line1: 'MAXIMUM OUTPUT:', line2: '0.8 LITERS PER HOUR', accent: '#49CEFF', line2Delay: 0.58,
    cam0: [0.65, -0.35, 4.65], cam1: [0.72, -0.42, 4.05], look0: [0.68, -0.38, 0.15], look1: [0.74, -0.46, 0.20], fov: 30,
    impactAt: 0.90
  },
  {
    id: 'S10', t0: 34.0, t1: 37.8, world: 'kidney_stand', light: 'warm_museum', palette: 'ochre_board',
    line1: 'SHE DRANK WATER', line2: '3X FASTER THAN EXIT', accent: '#FF443B', line2Delay: 0.58,
    cam0: [0.05, 0.62, 8.75], cam1: [0.05, 0.56, 8.15], look0: [0.05, 0.68, 0.0], look1: [0.05, 0.62, 0.0], fov: 35
  },
  {
    id: 'S11', t0: 37.8, t1: 41.5, world: 'kidney_stand', light: 'crimson_bio', palette: 'crimson_bio',
    line1: 'TRAPPED WATER', line2: 'FLOODS THE BLOOD', accent: '#49CEFF', line2Delay: 0.56,
    cam0: [0.95, 0.35, 4.85], cam1: [1.10, 0.28, 4.25], look0: [0.95, 0.42, 0.18], look1: [1.08, 0.36, 0.18], fov: 31
  },

  // WORLD 4: Bloodstream Lumen, Bifurcating Y-Artery & Analyzer (S12 - S15)
  {
    id: 'S12', t0: 41.5, t1: 45.4, world: 'artery_sodium', light: 'crimson_bio', palette: 'crimson_bio',
    line1: 'SODIUM IN BLOOD', line2: 'SPARKS EVERY NERVE', accent: '#F49328', line2Delay: 0.58,
    cam0: [0.0, 0.28, 5.25], cam1: [0.12, 0.22, 4.65], look0: [0.0, 0.35, 0.0], look1: [0.05, 0.30, 0.0], fov: 34
  },
  {
    id: 'S13', t0: 45.4, t1: 49.4, world: 'artery_sodium', light: 'warm_museum', palette: 'ochre_board',
    line1: 'HEALTHY BLOOD HOLDS', line2: '140 MMOL/L SODIUM', accent: '#FFFDF7', line2Delay: 0.60,
    cam0: [0.0, 0.42, 7.85], cam1: [0.0, 0.45, 7.25], look0: [0.0, 0.52, 0.0], look1: [0.0, 0.55, 0.0], fov: 34
  },
  {
    id: 'S14', t0: 49.4, t1: 53.2, world: 'artery_sodium', light: 'warm_museum', palette: 'ochre_board',
    line1: 'GALLONS OF WATER', line2: 'WASH SODIUM AWAY', accent: '#49CEFF', line2Delay: 0.58,
    cam0: [0.0, 0.78, 5.85], cam1: [0.0, 0.86, 5.15], look0: [0.0, 0.85, 0.10], look1: [0.0, 0.92, 0.12], fov: 31
  },
  {
    id: 'S15', t0: 53.2, t1: 57.0, world: 'artery_sodium', light: 'warm_museum', palette: 'slate_lab',
    line1: 'AT 118 MMOL/L:', line2: 'SODIUM TURNS CRITICAL', accent: '#FF4B45', line2Delay: 0.58,
    cam0: [0.0, 0.32, 7.35], cam1: [0.0, 0.35, 6.85], look0: [0.0, 0.20, 0.0], look1: [0.0, 0.22, 0.0], fov: 33,
    overlay: 'electrolyte_card'
  },

  // WORLD 5: U-Tube Osmometer, Aquaporin Pores & Muscle vs. Skull (S16 - S18)
  {
    id: 'S16', t0: 57.0, t1: 61.0, world: 'osmosis_membrane', light: 'warm_museum', palette: 'slate_lab',
    line1: "NATURE'S IRON RULE:", line2: 'WATER CHASES SALT', accent: '#F49328', line2Delay: 0.58,
    cam0: [0.0, -0.15, 8.95], cam1: [0.05, -0.12, 8.35], look0: [0.0, -0.25, 0.0], look1: [0.04, -0.22, 0.0], fov: 34
  },
  {
    id: 'S17', t0: 61.0, t1: 65.0, world: 'osmosis_membrane', light: 'crimson_bio', palette: 'cellular_indigo',
    line1: 'MILLIONS OF PORES', line2: 'PULL WATER INSIDE', accent: '#49CEFF', line2Delay: 0.58,
    cam0: [0.0, 0.32, 6.55], cam1: [0.0, 0.26, 5.85], look0: [0.0, 0.38, 0.0], look1: [0.0, 0.32, 0.0], fov: 33
  },
  {
    id: 'S18', t0: 65.0, t1: 69.0, world: 'osmosis_membrane', light: 'warm_museum', palette: 'ochre_board',
    line1: 'MUSCLES CAN STRETCH', line2: 'YOUR SKULL CANNOT', accent: '#FFFDF7', line2Delay: 0.58,
    cam0: [0.0, 0.12, 8.15], cam1: [0.12, 0.10, 7.55], look0: [0.0, 0.16, 0.0], look1: [0.10, 0.14, 0.0], fov: 34
  },

  // WORLD 6A: Sagittal Human Skull, 7mm Bone, Cerebral Edema & Herniation (S19 - S22)
  {
    id: 'S19', t0: 69.0, t1: 73.0, world: 'skull_brain', light: 'anatomy_dramatic', palette: 'dark_anatomy',
    line1: 'YOUR BRAIN SITS IN', line2: '7MM OF SOLID BONE', accent: '#FFFDF7', line2Delay: 0.58,
    cam0: [0.05, 0.48, 9.65], cam1: [0.05, 0.50, 9.05], look0: [0.05, 0.58, 0.0], look1: [0.05, 0.60, 0.0], fov: 34
  },
  {
    id: 'S20', t0: 73.0, t1: 76.8, world: 'skull_brain', light: 'anatomy_dramatic', palette: 'dark_anatomy',
    line1: 'BRAIN CELLS SWELL', line2: 'WITH ZERO EXIT ROOM', accent: '#49CEFF', line2Delay: 0.58,
    cam0: [0.05, 0.72, 6.85], cam1: [0.05, 0.75, 6.25], look0: [0.05, 0.78, 0.1], look1: [0.05, 0.80, 0.1], fov: 32
  },
  {
    id: 'S21', t0: 76.8, t1: 80.6, world: 'skull_brain', light: 'anatomy_dramatic', palette: 'dark_anatomy',
    line1: 'RISING PRESSURE', line2: 'CHOKES BLOOD FLOW', accent: '#FF4B45', line2Delay: 0.58,
    cam0: [0.22, 0.78, 7.55], cam1: [0.28, 0.82, 6.95], look0: [0.20, 0.84, 0.12], look1: [0.26, 0.88, 0.12], fov: 32
  },
  {
    id: 'S22', t0: 80.6, t1: 84.6, world: 'skull_brain', light: 'anatomy_dramatic', palette: 'dark_anatomy',
    line1: 'SWOLLEN TISSUE', line2: 'PLUGS THE SKULL BASE', accent: '#FF4B45', line2Delay: 0.58,
    cam0: [0.08, 0.34, 6.95], cam1: [0.08, 0.24, 6.25], look0: [0.06, 0.42, 0.10], look1: [0.06, 0.32, 0.10], fov: 31,
    impactAt: 1.80
  },

  // WORLD 6B: Industrial Brainstem Switchboard & ICU Monitor (S23 - S24)
  {
    id: 'S23', t0: 84.6, t1: 88.5, world: 'switchboard_icu', light: 'switchboard', palette: 'switchboard_green',
    line1: 'VITAL CONTROLS', line2: 'SWITCHED OFF', accent: '#F49328', line2Delay: 0.56,
    cam0: [0.0, 0.42, 8.25], cam1: [0.0, 0.36, 7.65], look0: [0.0, 0.48, 0.0], look1: [0.0, 0.42, 0.0], fov: 34,
    impactAt: 0.95
  },
  {
    id: 'S24', t0: 88.5, t1: 92.5, world: 'switchboard_icu', light: 'warm_museum', palette: 'icu_ward',
    line1: 'LUNGS AND HEART', line2: 'STOP TOGETHER', accent: '#FF4B45', line2Delay: 0.56,
    cam0: [0.0, 0.38, 9.65], cam1: [0.0, 0.34, 9.05], look0: [0.0, 0.44, 0.0], look1: [0.0, 0.40, 0.0], fov: 34
  },

  // WORLD 7: Real-World Victims & Emergency 3% Saline Rescue (S25 - S27)
  {
    id: 'S25', t0: 92.5, t1: 96.2, world: 'real_cases_icu', light: 'warm_museum', palette: 'slate_lab',
    line1: '13% OF MARATHONERS', line2: 'OVER-DRINK ON RACE DAY', accent: '#F49328', line2Delay: 0.58,
    cam0: [-0.22, 0.85, 7.35], cam1: [0.14, 0.78, 6.85], look0: [0.0, 0.15, 0.0], look1: [0.0, 0.12, 0.0], fov: 34,
    overlay: 'marathon_card'
  },
  {
    id: 'S26', t0: 96.2, t1: 99.8, world: 'evidence_board', light: 'warm_museum', palette: 'ochre_board',
    line1: 'BABIES UNDER 6 MONTHS', line2: 'NEED ZERO PLAIN WATER', accent: '#FFFDF7', line2Delay: 0.58,
    cam0: [0.0, 0.02, 8.65], cam1: [0.0, 0.00, 8.15], look0: [0.0, -0.18, 0.0], look1: [0.0, -0.20, 0.0], fov: 34
  },
  {
    id: 'S27', t0: 99.8, t1: 103.5, world: 'real_cases_icu', light: 'warm_museum', palette: 'icu_ward',
    line1: 'ICU DOCTORS INFUSE', line2: '3% HYPERTONIC SALT', accent: '#49CEFF', line2Delay: 0.58,
    cam0: [0.0, 0.45, 6.15], cam1: [0.05, 0.40, 5.55], look0: [0.0, 0.52, 0.0], look1: [0.02, 0.48, 0.0], fov: 33
  },

  // WORLD 8: 3 Golden Hydration Rules & Paracelsus Balance Scale (S28 - S32)
  {
    id: 'S28', t0: 103.5, t1: 107.0, world: 'hydration_rules', light: 'warm_museum', palette: 'slate_lab',
    line1: 'RULE 1: NEVER CHUG', line2: 'OVER 800 ML PER HOUR', accent: '#49CEFF', line2Delay: 0.56,
    cam0: [0.16, 0.18, 7.25], cam1: [0.12, 0.20, 6.75], look0: [0.16, 0.20, 0.1], look1: [0.12, 0.22, 0.1], fov: 33
  },
  {
    id: 'S29', t0: 107.0, t1: 110.5, world: 'hydration_rules', light: 'warm_museum', palette: 'ochre_board',
    line1: 'RULE 2: HEAVY SWEAT?', line2: 'ADD ELECTROLYTES', accent: '#FFFDF7', line2Delay: 0.56,
    cam0: [0.02, 0.02, 6.85], cam1: [0.00, 0.00, 6.35], look0: [0.02, -0.28, 0.15], look1: [0.00, -0.30, 0.15], fov: 33
  },
  {
    id: 'S30', t0: 110.5, t1: 114.0, world: 'hydration_rules', light: 'warm_museum', palette: 'slate_lab',
    line1: 'RULE 3: PALE YELLOW', line2: 'MEANS IDEAL BALANCE', accent: '#FFFDF7', line2Delay: 0.56,
    cam0: [0.0, 0.05, 7.15], cam1: [0.0, 0.02, 6.65], look0: [0.0, -0.18, 0.15], look1: [0.0, -0.20, 0.15], fov: 33
  },
  {
    id: 'S31', t0: 114.0, t1: 117.2, world: 'hydration_rules', light: 'warm_museum', palette: 'ochre_board',
    line1: 'EVEN PURE WATER', line2: 'HAS A LETHAL DOSE', accent: '#FFFDF7', line2Delay: 0.56,
    cam0: [0.0, 0.25, 8.25], cam1: [0.0, 0.22, 7.65], look0: [0.0, 0.28, 0.1], look1: [0.0, 0.25, 0.1], fov: 34
  },
  {
    id: 'S32', t0: 117.2, t1: 120.01, world: 'evidence_board', light: 'warm_museum', palette: 'ochre_board',
    line1: 'SEND THIS TO', line2: 'YOUR GYM PARTNER', accent: '#49CEFF', line2Delay: 0.50,
    cam0: [0.0, 0.2, 6.2], cam1: [0.0, 0.2, 6.0], look0: [0.0, 0.2, 0.0], look1: [0.0, 0.2, 0.0], fov: 34,
    overlay: 'pocket_summary'
  }
];

let _worlds = null;
function ensureWorlds(studio) {
  if (_worlds) return _worlds;
  _worlds = {
    radio_studio: buildRadioStudioWorld(),
    bedroom_night: buildBedroomNightWorld(),
    evidence_board: buildEvidenceBoardWorld(),
    kidney_stand: buildKidneyStandWorld(),
    artery_sodium: buildArterySodiumWorld(),
    osmosis_membrane: buildOsmosisMembraneWorld(),
    skull_brain: buildSkullBrainWorld(),
    switchboard_icu: buildSwitchboardIcuWorld(),
    real_cases_icu: buildRealCasesIcuWorld(),
    hydration_rules: buildHydrationRulesWorld()
  };
  for (const w of Object.values(_worlds)) {
    w.root.visible = false;
    studio.worldRoot.add(w.root);
  }
  return _worlds;
}

function findShot(tSec) {
  const t = clamp(tSec, 0, 119.999);
  for (let i = 0; i < SHOTS.length; i++) {
    if (t >= SHOTS[i].t0 && t < SHOTS[i].t1) return SHOTS[i];
  }
  return SHOTS[SHOTS.length - 1];
}

export function renderAtTime(ctx, tSec) {
  const shot = findShot(tSec);
  const dur = Math.max(0.001, shot.t1 - shot.t0);
  const localSec = Math.max(0, tSec - shot.t0);
  const p = clamp(localSec / dur, 0, 1);

  // 1. Saturated Era-2 Gradient & Glow Backdrop
  drawBackdrop(ctx, shot.palette);

  // 2. Native 1080x1920 Full-HD WebGL2 3D Diorama Pass
  const studio = getStudio();
  const worlds = ensureWorlds(studio);
  applyLightingPreset(studio, shot.light);

  for (const [key, w] of Object.entries(worlds)) {
    const active = key === shot.world;
    w.root.visible = active;
    if (active) w.update(shot.id, localSec, p);
  }

  // Smooth camera glide + subtle gentle settle on cut (ZERO fake blur overlays!)
  const camP = 0.22 * easeOutCubic(localSec / 0.28) + 0.78 * easeInOutCubic(p);
  let cx = lerp(shot.cam0[0], shot.cam1[0], camP);
  let cy = lerp(shot.cam0[1], shot.cam1[1], camP);
  const cz = lerp(shot.cam0[2], shot.cam1[2], camP);

  // Optional crisp physical impact micro-shake on the 3 mechanical/biological impacts
  if (typeof shot.impactAt === 'number' && localSec >= shot.impactAt && localSec <= shot.impactAt + 0.28) {
    const dt = (localSec - shot.impactAt) / 0.28;
    const mag = (1 - dt) * 0.045;
    cx += Math.sin(dt * 38) * mag;
    cy += Math.cos(dt * 44) * mag;
  }

  studio.camera.fov = shot.fov || 34;
  studio.camera.updateProjectionMatrix();
  studio.camera.position.set(cx, cy, cz);
  studio.camera.lookAt(
    lerp(shot.look0[0], shot.look1[0], camP),
    lerp(shot.look0[1], shot.look1[1], camP),
    lerp(shot.look0[2], shot.look1[2], camP)
  );

  studio.renderer.render(studio.scene, studio.camera);
  ctx.drawImage(studio.glCanvas, 0, 0, W, H);

  // 3. Sparse Motivated 2D Archival Tabletop Cards (ONLY on 5 of 32 shots!)
  if (shot.overlay === 'coroner') drawCoronerArchivalSet(ctx, localSec);
  else if (shot.overlay === 'myths') drawMythStickyNotes(ctx, localSec);
  else if (shot.overlay === 'electrolyte_card') drawElectrolytePathologyCard(ctx, localSec);
  else if (shot.overlay === 'marathon_card') drawMarathonExcerptCard(ctx, localSec);
  else if (shot.overlay === 'pocket_summary') drawPocketSummaryCard(ctx, localSec);

  // 4. Left-Aligned Progressive 2-Line Cumulative Headline + Subtle 6-Hole Archival Chrome
  drawProgressiveHeadline(ctx, shot, localSec);
  drawArchivalSheetChrome(ctx);
}
