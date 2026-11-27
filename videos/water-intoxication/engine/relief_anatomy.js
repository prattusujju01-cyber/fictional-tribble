// Sovereign v15.0 — Museum-Grade 1024x1024 Procedural Anatomical Cutaway & Cellular Relief Factory
import { THREE } from './core3d.js';
import {
  buildMappedRelief,
  getWoodMat,
  getOchreBoardMat,
  getBrassMat,
  getDarkBrassMat,
  getClearGlassMat,
  getWaterLiquidMat,
  addFresnelRim,
  makeLabelTex
} from './materials3d.js';
import { clamp, lerp, easeInOutCubic, mulberry32 } from './dossier.js';

// Classic dimpled biconcave Red Blood Cell LatheGeometry (ZERO meatballs!)
let _rbcGeo = null;
export function getBiconcaveRBCGeo() {
  if (_rbcGeo) return _rbcGeo;
  const pts = [];
  const N = 22;
  for (let i = 0; i <= N; i++) {
    const t = i / N; // 0 center -> 1 rim -> wrap
    const theta = t * Math.PI; // top pole to bottom pole around cross-section
    const r = Math.sin(theta) * 0.24;
    const rNorm = r / 0.24;
    // Evans-Fung biconcave thickness profile
    const halfThick = 0.082 * Math.sqrt(Math.max(0, 1 - rNorm * rNorm)) * (0.34 + 1.45 * rNorm * rNorm - 0.85 * Math.pow(rNorm, 4));
    const y = (theta <= Math.PI * 0.5 ? 1 : -1) * Math.max(0.012, Math.abs(halfThick) || 0.025 * Math.cos(theta));
    pts.push(new THREE.Vector2(Math.max(0.001, r), Math.cos(theta) * (0.036 + 0.058 * Math.pow(Math.sin(theta), 2))));
  }
  _rbcGeo = new THREE.LatheGeometry(pts, 28);
  _rbcGeo.computeVertexNormals();
  return _rbcGeo;
}

// Reusable Turned Brass Circular Dial Gauge
export function buildBrassDialGauge({ radius = 0.62, title = 'Na+ mmol/L', subLeft = 'LOW', subRight = '140' }) {
  const grp = new THREE.Group();
  const brass = getBrassMat();
  const darkBrass = getDarkBrassMat();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.03, 0.16, 44), brass);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  grp.add(body);

  const bezel = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.96, 0.055, 16, 48), darkBrass);
  bezel.position.z = 0.08;
  grp.add(bezel);

  const { tex } = makeLabelTex(512, 512, (ctx, w, h) => {
    const cx = w / 2, cy = h / 2;
    const rg = ctx.createRadialGradient(cx, cy - 30, 10, cx, cy, 240);
    rg.addColorStop(0, '#FFFDF6');
    rg.addColorStop(0.85, '#EDE2CA');
    rg.addColorStop(1, '#CBBBA0');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(cx, cy, 244, 0, Math.PI * 2); ctx.fill();

    // Danger red arc (left: PI*0.78 .. PI*1.28) & safe green arc (right: PI*1.58 .. PI*2.18)
    ctx.lineWidth = 28;
    ctx.strokeStyle = '#D62C26';
    ctx.beginPath(); ctx.arc(cx, cy, 186, Math.PI * 0.78, Math.PI * 1.32); ctx.stroke();

    ctx.strokeStyle = '#E89B25';
    ctx.beginPath(); ctx.arc(cx, cy, 186, Math.PI * 1.32, Math.PI * 1.62); ctx.stroke();

    ctx.strokeStyle = '#228B4E';
    ctx.beginPath(); ctx.arc(cx, cy, 186, Math.PI * 1.62, Math.PI * 2.22); ctx.stroke();

    // Ticks
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * 0.78 + (i / 24) * (Math.PI * 1.44);
      const r0 = i % 4 === 0 ? 156 : 168;
      ctx.lineWidth = i % 4 === 0 ? 5 : 2.5;
      ctx.strokeStyle = '#231E18';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * 204, cy + Math.sin(a) * 204);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1E1A15';
    ctx.font = '700 34px "OswaldBold"';
    ctx.fillText(title, cx, cy + 98);

    ctx.fillStyle = '#C4221D';
    ctx.font = '700 32px "OswaldBold"';
    ctx.fillText(subLeft, cx - 108, cy + 42);

    ctx.fillStyle = '#1B6E3E';
    ctx.fillText(subRight, cx + 108, cy + 42);
  });

  const face = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.92, 44),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.04 })
  );
  face.position.z = 0.084;
  grp.add(face);

  const needlePivot = new THREE.Group();
  needlePivot.position.z = 0.105;
  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, radius * 0.74, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x1B1714, roughness: 0.3, metalness: 0.6 })
  );
  needle.position.y = radius * 0.28;
  needlePivot.add(needle);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 24), darkBrass);
  cap.rotation.x = Math.PI / 2;
  needlePivot.add(cap);
  grp.add(needlePivot);

  const glassCover = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.93, 40), getClearGlassMat(0.20));
  glassCover.position.z = 0.125;
  grp.add(glassCover);

  return { group: grp, needlePivot };
}

// ============================================================================
// WORLD 3: SAGITTAL HUMAN KIDNEY CROSS-SECTION & INLINE FLOWMETER (S08 - S11)
// ============================================================================
export function buildKidneyStandWorld() {
  const root = new THREE.Group();

  // Warm Ochre Studio Backboard + Oak Bench
  const backBoard = new THREE.Mesh(new THREE.PlaneGeometry(11, 18), getOchreBoardMat());
  backBoard.position.set(0, 0, -1.35);
  backBoard.receiveShadow = true;
  root.add(backBoard);

  const bench = new THREE.Mesh(new THREE.BoxGeometry(10, 0.55, 3.6), getWoodMat('walnut'));
  bench.position.set(0, -2.55, -0.2);
  bench.receiveShadow = true;
  root.add(bench);

  // Brass Museum Pedestal Rod
  const brass = getBrassMat();
  const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.98, 0.16, 36), brass);
  basePlate.position.set(-0.35, -2.20, 0.0);
  basePlate.castShadow = true;
  root.add(basePlate);

  const standRod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.5, 20), brass);
  standRod.position.set(-0.35, -0.95, -0.25);
  root.add(standRod);

  // Bean-shaped Sagittal Kidney Outline (normalized [0..1]x[0..1], hilum notch on right x~0.72)
  const kidneyOutline = [
    [0.48, 0.08], [0.28, 0.12], [0.15, 0.27], [0.10, 0.48],
    [0.14, 0.71], [0.27, 0.87], [0.48, 0.92], [0.68, 0.85],
    [0.74, 0.72], [0.63, 0.60], [0.61, 0.48], [0.64, 0.36],
    [0.74, 0.25], [0.67, 0.13]
  ];

  const kidneySlab = buildMappedRelief({
    key: 'sagittal_kidney_v15',
    width: 3.15,
    height: 3.75,
    depth: 0.26,
    bevel: 0.055,
    outlinePts: kidneyOutline,
    sideColor: 0x5B1E20,
    roughness: 0.38,
    rimHex: 0xFFB8A8,
    rimStrength: 0.32,
    paintFn: (ctx, hCtx, S) => {
      const rng = mulberry32(30811);
      // Outer fibrous capsule & granular cortex base
      const bg = ctx.createRadialGradient(S * 0.42, S * 0.5, 40, S * 0.45, S * 0.5, S * 0.52);
      bg.addColorStop(0, '#D46E63');
      bg.addColorStop(0.72, '#B34B43');
      bg.addColorStop(1, '#6E2220');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, S, S);

      hCtx.fillStyle = '#9E9E9E';
      hCtx.fillRect(0, 0, S, S);

      // Granular cortical glomeruli stippling
      for (let i = 0; i < 2400; i++) {
        const x = rng() * S, y = rng() * S;
        ctx.fillStyle = rng() > 0.5 ? 'rgba(255,205,190,0.16)' : 'rgba(88,24,22,0.18)';
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      }

      // Outer capsule dark rim
      ctx.strokeStyle = '#581918';
      ctx.lineWidth = 28;
      ctx.beginPath();
      kidneyOutline.forEach(([u, v], idx) => {
        if (idx === 0) ctx.moveTo(u * S, v * S);
        else ctx.lineTo(u * S, v * S);
      });
      ctx.closePath();
      ctx.stroke();

      // Central Renal Sinus & Golden-Cream Pelvis Funnel converging to Hilum (0.66, 0.50)
      const hx = S * 0.65, hy = S * 0.50;
      const pyAngles = [-1.22, -0.82, -0.42, 0.0, 0.42, 0.82, 1.22];

      // Draw Minor/Major Calyces & Pelvis
      ctx.lineCap = 'round';
      for (const a of pyAngles) {
        const px = hx - Math.cos(a) * S * 0.25;
        const py = hy + Math.sin(a) * S * 0.28;
        ctx.strokeStyle = '#EAD2AC';
        ctx.lineWidth = 34;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.quadraticCurveTo((hx + px) * 0.52, (hy + py) * 0.5, px, py);
        ctx.stroke();

        hCtx.strokeStyle = '#686868';
        hCtx.lineWidth = 32;
        hCtx.beginPath();
        hCtx.moveTo(hx, hy);
        hCtx.quadraticCurveTo((hx + px) * 0.52, (hy + py) * 0.5, px, py);
        hCtx.stroke();
      }

      ctx.fillStyle = '#F3DFBE';
      ctx.beginPath();
      ctx.ellipse(hx - 18, hy, 88, 115, 0, 0, Math.PI * 2);
      ctx.fill();

      // 7 Striated Medullary Renal Pyramids fanning around the pelvis!
      for (const a of pyAngles) {
        const tipX = hx - Math.cos(a) * S * 0.18;
        const tipY = hy + Math.sin(a) * S * 0.21;
        const baseDist = S * 0.37;
        const spread = 0.22;
        const b1x = hx - Math.cos(a - spread) * baseDist;
        const b1y = hy + Math.sin(a - spread) * (baseDist * 1.12);
        const b2x = hx - Math.cos(a + spread) * baseDist;
        const b2y = hy + Math.sin(a + spread) * (baseDist * 1.12);

        const pg = ctx.createLinearGradient(tipX, tipY, (b1x + b2x) * 0.5, (b1y + b2y) * 0.5);
        pg.addColorStop(0, '#59121B');
        pg.addColorStop(0.55, '#7E1D27');
        pg.addColorStop(1, '#982B33');

        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.quadraticCurveTo((b1x + b2x) * 0.5 - Math.cos(a) * 28, (b1y + b2y) * 0.5, b1x, b1y);
        ctx.quadraticCurveTo((b1x + b2x) * 0.5 - Math.cos(a) * 34, (b1y + b2y) * 0.5 + Math.sin(a) * 26, b2x, b2y);
        ctx.closePath();
        ctx.fill();

        // Fine medullary nephron striations
        ctx.strokeStyle = 'rgba(248, 186, 175, 0.28)';
        ctx.lineWidth = 2.2;
        for (let s = 0; s <= 10; s++) {
          const f = s / 10;
          const bx = lerp(b1x, b2x, f);
          const by = lerp(b1y, b2y, f);
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        hCtx.fillStyle = '#B8B8B8';
        hCtx.beginPath();
        hCtx.moveTo(tipX, tipY);
        hCtx.lineTo(b1x, b1y);
        hCtx.lineTo(b2x, b2y);
        hCtx.closePath();
        hCtx.fill();
      }

      // Fine cortical interlobar vessels (red & blue)
      for (const a of [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0]) {
        const vx = hx - Math.cos(a) * S * 0.39;
        const vy = hy + Math.sin(a) * S * 0.42;
        ctx.strokeStyle = '#D92228';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(hx - 10, hy - 8); ctx.lineTo(vx, vy); ctx.stroke();
        ctx.strokeStyle = '#2B6FD6';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(hx - 6, hy + 8); ctx.lineTo(vx + 8, vy + 8); ctx.stroke();
      }
    }
  });
  kidneySlab.position.set(-0.52, 0.28, 0.0);
  root.add(kidneySlab);

  // 3D Hilum Vessels: Renal Artery (Red), Renal Vein (Blue), Descending Ureter (Ivory-Gold)
  const makeTube = (pts, r, hex) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, r, 16, false),
      addFresnelRim(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.34, metalness: 0.08 }), 0xFFFFFF, 2.5, 0.25)
    );
    m.castShadow = true;
    return m;
  };

  const renalArtery = makeTube([[-0.05, 0.42, 0.14], [0.75, 0.58, 0.16], [1.65, 0.72, 0.12]], 0.105, 0xC82228);
  const renalVein = makeTube([[-0.05, 0.18, 0.18], [0.82, 0.22, 0.20], [1.95, 0.26, 0.18]], 0.125, 0x2664C8);
  const ureterTube = makeTube([[-0.02, 0.04, 0.12], [0.48, -0.35, 0.14], [0.68, -1.15, 0.14], [0.68, -2.05, 0.14]], 0.075, 0xE6CE9E);
  root.add(renalArtery, renalVein, ureterTube);

  // Inline Brass Renal Flowmeter mounted onto Ureter at (0.68, -0.95, 0.24)
  const flowMeter = buildBrassDialGauge({ radius: 0.56, title: 'KIDNEY L/HR', subLeft: '0.8 MAX', subRight: 'OVER' });
  flowMeter.group.position.set(0.78, -0.92, 0.28);
  root.add(flowMeter.group);

  // Lower Collection Beaker under Ureter
  const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.40, 0.85, 32, 1, true), getClearGlassMat(0.32));
  beaker.position.set(0.68, -1.86, 0.14);
  const beakerFill = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.37, 0.38, 28), getWaterLiquidMat(0xF2DC7E, 0.78));
  beakerFill.position.set(0.68, -2.06, 0.14);
  root.add(beaker, beakerFill);

  // S10 Top 2.5 L/HR Intake Funnel & Pouring Water Column
  const funnelGroup = new THREE.Group();
  const funnelCone = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.78, 32, 1, true), getClearGlassMat(0.36));
  funnelCone.rotation.x = Math.PI;
  funnelCone.position.set(-0.22, 2.28, 0.22);
  const pourStream = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 1.85, 20), getWaterLiquidMat(0x42CAFF, 0.86));
  pourStream.position.set(-0.22, 1.35, 0.22);
  const pelvisSwell = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 24), getWaterLiquidMat(0x49CEFF, 0.68));
  pelvisSwell.position.set(-0.02, 0.25, 0.18);
  funnelGroup.add(funnelCone, pourStream, pelvisSwell);
  root.add(funnelGroup);

  // S11 Systemic Bloodstream Overflow Pipe on Right + Streaming Water Droplets
  const overflowGroup = new THREE.Group();
  const bloodPipe = makeTube([[1.55, 1.45, 0.18], [1.62, 0.25, 0.18], [1.68, -1.35, 0.18]], 0.26, 0x8F1620);
  overflowGroup.add(bloodPipe);
  const droplets = [];
  const dropGeo = new THREE.SphereGeometry(0.065, 14, 14);
  const dropMat = getWaterLiquidMat(0x58D5FF, 0.90);
  for (let i = 0; i < 16; i++) {
    const d = new THREE.Mesh(dropGeo, dropMat);
    overflowGroup.add(d);
    droplets.push(d);
  }
  root.add(overflowGroup);

  return {
    root,
    update(shotId, localSec, p) {
      funnelGroup.visible = shotId === 'S10' || shotId === 'S11';
      overflowGroup.visible = shotId === 'S11';
      backBoard.visible = shotId !== 'S11';

      // Needle angle: 0 rad = straight up; positive = CCW (left), negative = CW (right)
      if (shotId === 'S08') {
        flowMeter.needlePivot.rotation.z = lerp(0.85, 0.35, easeInOutCubic(p));
        kidneySlab.scale.setScalar(1.0 + 0.012 * Math.sin(localSec * 3.5));
      } else if (shotId === 'S09') {
        // Hits mechanical pin at 0.8 L/HR and vibrates!
        const hit = clamp(localSec / 0.9);
        const buzz = hit >= 1 ? Math.sin(localSec * 42) * 0.035 : 0;
        flowMeter.needlePivot.rotation.z = lerp(0.75, 0.18, hit) + buzz;
        kidneySlab.scale.setScalar(1.0);
      } else if (shotId === 'S10') {
        flowMeter.needlePivot.rotation.z = -0.62 + Math.sin(localSec * 34) * 0.05;
        const sw = 0.75 + 0.65 * easeInOutCubic(p);
        pelvisSwell.scale.set(sw, sw * 1.15, 0.65);
        pourStream.scale.x = 1.0 + 0.12 * Math.sin(localSec * 18);
        kidneySlab.scale.set(1.0 + 0.04 * p, 1.0 + 0.03 * p, 1.0);
      } else if (shotId === 'S11') {
        flowMeter.needlePivot.rotation.z = -0.75;
        pelvisSwell.scale.set(1.35, 1.45, 0.65);
        for (let i = 0; i < droplets.length; i++) {
          const u = ((localSec * 0.85 + i / droplets.length) % 1.0);
          if (u < 0.55) {
            const k = u / 0.55;
            droplets[i].position.set(lerp(0.05, 1.60, k), lerp(0.22, 0.26, k) + Math.sin(k * 9) * 0.03, 0.28);
          } else {
            const k = (u - 0.55) / 0.45;
            droplets[i].position.set(1.62 + Math.sin(i * 2.1) * 0.09, lerp(0.26, -1.25, k), 0.34);
          }
        }
      }
    }
  };
}

// ============================================================================
// WORLD 4: BLOODSTREAM LUMEN, BIFURCATING Y-ARTERY & ANALYZER (S12 - S15)
// (Direct homage to strip_09.jpg f1875..2400 & strip_08.jpg f1875..2025)
// ============================================================================
export function buildArterySodiumWorld() {
  const root = new THREE.Group();
  const rbcGeo = getBiconcaveRBCGeo();
  const rbcMat = addFresnelRim(
    new THREE.MeshStandardMaterial({ color: 0xBE1B24, roughness: 0.32, metalness: 0.05 }),
    0xFF8888, 2.4, 0.38
  );
  const naGeo = new THREE.SphereGeometry(0.075, 18, 18);
  const naMat = new THREE.MeshStandardMaterial({
    color: 0xFFB830,
    emissive: 0xFF8800,
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.35
  });

  // --- SUBRIG A: S12 Deep Crimson Bloodstream Lumen + Nerve Spark ---
  const lumenGroup = new THREE.Group();
  const tunnelWall = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.35, 9.5, 36, 12, true),
    new THREE.MeshStandardMaterial({ color: 0x5A0D14, roughness: 0.55, side: THREE.BackSide })
  );
  tunnelWall.rotation.z = Math.PI * 0.18;
  lumenGroup.add(tunnelWall);

  // Myelinated golden-cyan nerve fiber running across lumen foreground
  const nerveCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, -1.1, 0.3),
    new THREE.Vector3(-0.7, -0.55, 0.55),
    new THREE.Vector3(0.9, -0.15, 0.50),
    new THREE.Vector3(2.5, 0.35, 0.25)
  ]);
  const nerveMesh = new THREE.Mesh(
    new THREE.TubeGeometry(nerveCurve, 44, 0.085, 16, false),
    new THREE.MeshStandardMaterial({ color: 0xF3C978, emissive: 0x2277AA, emissiveIntensity: 0.35, roughness: 0.3 })
  );
  lumenGroup.add(nerveMesh);

  const sparkPulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0x62E6FF })
  );
  lumenGroup.add(sparkPulse);

  const lumenRBCs = [];
  const lumenNas = [];
  const rng12 = mulberry32(12044);
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(rbcGeo, rbcMat);
    m.scale.setScalar(1.35 + rng12() * 0.45);
    lumenGroup.add(m);
    lumenRBCs.push({ mesh: m, x0: (rng12() - 0.5) * 3.4, y0: (rng12() - 0.5) * 4.2, z0: -1.2 + rng12() * 1.8, sp: 0.6 + rng12() * 0.6, rx: rng12() * 3, rz: rng12() * 3 });
  }
  for (let i = 0; i < 22; i++) {
    const n = new THREE.Mesh(naGeo, naMat);
    lumenGroup.add(n);
    lumenNas.push({ mesh: n, x0: (rng12() - 0.5) * 3.0, y0: (rng12() - 0.5) * 4.0, z0: -0.6 + rng12() * 1.4, ph: rng12() * 6.28 });
  }
  root.add(lumenGroup);

  // --- SUBRIG B: S13 & S14 Bifurcating Y-Artery Cutaway + Brass Stem Gauge ---
  const yGroup = new THREE.Group();
  const ochreBack = new THREE.Mesh(new THREE.PlaneGeometry(11, 18), getOchreBoardMat());
  ochreBack.position.z = -0.85;
  ochreBack.receiveShadow = true;
  yGroup.add(ochreBack);

  const yOutline = [
    [0.08, 0.06], [0.28, 0.06], [0.50, 0.44], [0.72, 0.06], [0.92, 0.06],
    [0.64, 0.56], [0.62, 0.95], [0.38, 0.95], [0.36, 0.56]
  ];
  const ySlab = buildMappedRelief({
    key: 'y_artery_cutaway_v15',
    width: 3.9,
    height: 4.8,
    depth: 0.24,
    bevel: 0.045,
    outlinePts: yOutline,
    sideColor: 0x6E1B20,
    roughness: 0.40,
    rimHex: 0xFFB5A8,
    rimStrength: 0.26,
    paintFn: (ctx, hCtx, S) => {
      ctx.fillStyle = '#D99B82';
      ctx.fillRect(0, 0, S, S);
      hCtx.fillStyle = '#D8D8D8';
      hCtx.fillRect(0, 0, S, S);

      const drawY = (targetCtx, lw, stroke) => {
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';
        targetCtx.lineWidth = lw;
        targetCtx.strokeStyle = stroke;
        targetCtx.beginPath();
        targetCtx.moveTo(S * 0.18, S * 0.04);
        targetCtx.lineTo(S * 0.50, S * 0.54);
        targetCtx.lineTo(S * 0.50, S * 0.97);
        targetCtx.moveTo(S * 0.82, S * 0.04);
        targetCtx.lineTo(S * 0.50, S * 0.54);
        targetCtx.stroke();
      };

      // Outer adventitia -> striated media -> deep arterial lumen channel
      drawY(ctx, 235, '#E5B299');
      drawY(ctx, 205, '#B5383C');
      drawY(ctx, 152, '#5E0E15');

      drawY(hCtx, 235, '#E6E6E6');
      drawY(hCtx, 195, '#B0B0B0');
      drawY(hCtx, 148, '#464646');
    }
  });
  ySlab.position.set(0, -0.45, -0.12);
  yGroup.add(ySlab);

  // Translucent Water Dilution Overlay Stream inside the Y channel
  const dilutionOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 4.5),
    new THREE.MeshBasicMaterial({ color: 0x7CE2FF, transparent: true, opacity: 0.0, depthWrite: false })
  );
  dilutionOverlay.position.set(0, -0.45, 0.05);
  yGroup.add(dilutionOverlay);

  // Flowing RBCs & Na+ ions inside the Y-channel
  const yCells = [];
  const yNas = [];
  for (let i = 0; i < 20; i++) {
    const c = new THREE.Mesh(rbcGeo, rbcMat);
    c.scale.setScalar(0.95);
    yGroup.add(c);
    yCells.push({ mesh: c, branch: i % 2, offset: i / 20 });
  }
  for (let i = 0; i < 24; i++) {
    const n = new THREE.Mesh(naGeo, naMat);
    n.scale.setScalar(0.85);
    yGroup.add(n);
    yNas.push({ mesh: n, branch: i % 2, offset: i / 24 });
  }

  // Vertical Brass Stem + Sodium Gauge in the V-fork (strip_09.jpg f2325..2400 exact homage!)
  const stemPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.35, 20), getBrassMat());
  stemPipe.position.set(0, 0.35, 0.14);
  yGroup.add(stemPipe);

  const naGauge = buildBrassDialGauge({ radius: 0.68, title: 'SODIUM mmol/L', subLeft: 'LOW', subRight: '140' });
  naGauge.group.position.set(0, 1.18, 0.20);
  yGroup.add(naGauge.group);

  root.add(yGroup);

  // --- SUBRIG C: S15 Brushed Stainless Clinical Electrolyte Analyzer (strip_08.jpg f1950 homage) ---
  const analyzerGroup = new THREE.Group();
  const labBack = new THREE.Mesh(new THREE.PlaneGeometry(11, 18), new THREE.MeshStandardMaterial({ color: 0x243442, roughness: 0.8 }));
  labBack.position.z = -1.2;
  analyzerGroup.add(labBack);

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(3.15, 2.35, 0.65),
    new THREE.MeshStandardMaterial({ color: 0x20262C, roughness: 0.36, metalness: 0.62 })
  );
  chassis.position.set(0, 0.72, 0);
  chassis.castShadow = true;
  analyzerGroup.add(chassis);

  const steelPan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 0.96, 0.14, 48),
    new THREE.MeshStandardMaterial({ color: 0xDCE3EA, roughness: 0.20, metalness: 0.90 })
  );
  steelPan.rotation.x = Math.PI * 0.36;
  steelPan.position.set(0, 1.05, 0.42);
  analyzerGroup.add(steelPan);

  // Blood sample vacutainer tube resting on sample well
  const vialGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.88, 24), getClearGlassMat(0.38));
  const vialBlood = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.56, 20), getWaterLiquidMat(0xC92A38, 0.88));
  vialBlood.position.y = -0.10;
  const vialCap = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.18, 24), new THREE.MeshStandardMaterial({ color: 0x8A3AB8, roughness: 0.4 }));
  vialCap.position.y = 0.46;
  const sampleVial = new THREE.Group();
  sampleVial.add(vialGlass, vialBlood, vialCap);
  sampleVial.rotation.z = 0.42;
  sampleVial.position.set(0.05, 1.18, 0.58);
  analyzerGroup.add(sampleVial);

  // Live updating 7-segment Red LED Screen CanvasTexture
  const ledObj = makeLabelTex(512, 160, () => {});
  const ledScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35, 0.68),
    new THREE.MeshBasicMaterial({ map: ledObj.tex })
  );
  ledScreen.position.set(0, -0.02, 0.34);
  analyzerGroup.add(ledScreen);

  root.add(analyzerGroup);

  function updateLedValue(val) {
    const { ctx, canvas, tex } = ledObj;
    ctx.fillStyle = '#120708';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#4A2225';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    const isCrit = val <= 122;
    ctx.fillStyle = isCrit ? '#FF2E2A' : '#FF9A28';
    ctx.shadowColor = isCrit ? '#FF1E1A' : '#FF8800';
    ctx.shadowBlur = 18;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '700 92px "SpaceMonoBold"';
    ctx.fillText(val.toFixed(1), 355, 84);

    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.font = '700 30px "OswaldBold"';
    ctx.fillStyle = '#F2D8D5';
    ctx.fillText('mmol/L', 372, 68);
    ctx.fillStyle = isCrit ? '#FF4B47' : '#FFC46B';
    ctx.font = '700 24px "SpaceMonoBold"';
    ctx.fillText(isCrit ? 'CRITICAL' : 'LOW Na+', 372, 108);
    tex.needsUpdate = true;
  }

  function posAlongY(branch, u) {
    // u: 0 top branch -> 0.52 fork -> 1.0 bottom stem
    if (u < 0.52) {
      const k = u / 0.52;
      const sx = branch === 0 ? -1.22 : 1.22;
      return [lerp(sx, 0, k), lerp(1.72, -0.58, k)];
    }
    const k = (u - 0.52) / 0.48;
    return [0, lerp(-0.58, -2.65, k)];
  }

  return {
    root,
    update(shotId, localSec, p) {
      lumenGroup.visible = shotId === 'S12';
      yGroup.visible = shotId === 'S13' || shotId === 'S14';
      analyzerGroup.visible = shotId === 'S15';

      if (shotId === 'S12') {
        const spU = (localSec * 0.65) % 1.0;
        sparkPulse.position.copy(nerveCurve.getPointAt(spU));
        for (const r of lumenRBCs) {
          const y = ((r.y0 - localSec * r.sp + 2.5) % 5.0) - 2.5;
          r.mesh.position.set(r.x0, y, r.z0);
          r.mesh.rotation.set(r.rx + localSec * 0.8, localSec * 0.5, r.rz);
        }
        for (const n of lumenNas) {
          n.mesh.position.set(
            n.x0 + Math.sin(localSec * 2.5 + n.ph) * 0.14,
            n.y0 + Math.cos(localSec * 2.1 + n.ph) * 0.14,
            n.z0
          );
        }
      } else if (shotId === 'S13' || shotId === 'S14') {
        const dil = shotId === 'S14' ? easeInOutCubic(clamp(localSec / 2.6)) : 0.0;
        dilutionOverlay.material.opacity = dil * 0.34;
        // Gauge needle: -0.68 rad = green 140 on right; +0.72 rad = red LOW on left
        naGauge.needlePivot.rotation.z = lerp(-0.68, 0.72, dil) + Math.sin(localSec * 8) * 0.015;

        for (let i = 0; i < yCells.length; i++) {
          const u = (yCells[i].offset + localSec * 0.22) % 1.0;
          const [x, y] = posAlongY(yCells[i].branch, u);
          yCells[i].mesh.position.set(x + Math.sin(i * 3.1) * 0.08, y, 0.08);
          yCells[i].mesh.rotation.set(0.9 + localSec, i, 0.4);
        }
        for (let i = 0; i < yNas.length; i++) {
          const u = (yNas[i].offset + localSec * (0.20 + dil * 0.28)) % 1.0;
          const [x, y] = posAlongY(yNas[i].branch, u);
          yNas[i].mesh.visible = dil < 0.5 || i % 3 === 0; // Sodium gets washed sparse!
          yNas[i].mesh.position.set(x + Math.cos(i * 2.3) * 0.11, y, 0.13);
        }
      } else if (shotId === 'S15') {
        const val = lerp(140.0, 118.0, easeInOutCubic(clamp(localSec / 2.4)));
        updateLedValue(val);
        vialBlood.material.color.setHex(val < 124 ? 0xE26D7A : 0xC92A38);
      }
    }
  };
}

// ============================================================================
// WORLD 5: U-TUBE OSMOMETER, PHOSPHOLIPID BILAYER & MUSCLE VS SKULL (S16 - S18)
// ============================================================================
export function buildOsmosisMembraneWorld() {
  const root = new THREE.Group();
  const brass = getBrassMat();
  const glass = getClearGlassMat(0.34);

  // --- S16: Oak Bench + Borosilicate U-Tube Osmometer ---
  const uTubeGroup = new THREE.Group();
  const bench = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, 4.0), getWoodMat('oak'));
  bench.position.set(0, -2.15, 0);
  bench.receiveShadow = true;
  uTubeGroup.add(bench);

  // Left & Right Glass Vertical Arms + Bottom U-Bend + Central Brass Semi-Permeable Flange
  const armX = 0.78;
  const leftGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 2.55, 32, 1, true), glass);
  leftGlass.position.set(-armX, -0.35, 0);
  const rightGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 2.55, 32, 1, true), glass);
  rightGlass.position.set(armX, -0.35, 0);
  const bottomBend = new THREE.Mesh(new THREE.TorusGeometry(armX, 0.34, 20, 40, Math.PI), glass);
  bottomBend.rotation.z = Math.PI;
  bottomBend.position.set(0, -1.62, 0);
  const membraneFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.14, 28), brass);
  membraneFlange.rotation.z = Math.PI / 2;
  membraneFlange.position.set(0, -2.40, 0);
  // Stand base under U-tube
  const standBlock = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.24, 1.2), getWoodMat('walnut'));
  standBlock.position.set(0, -1.92, -0.35);
  uTubeGroup.add(leftGlass, rightGlass, bottomBend, membraneFlange, standBlock);

  const leftWater = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.0, 28), getWaterLiquidMat(0x5BD4FF, 0.80));
  const rightWater = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.0, 28), getWaterLiquidMat(0xF5B638, 0.85));
  const bottomWater = new THREE.Mesh(new THREE.TorusGeometry(armX, 0.30, 18, 36, Math.PI), getWaterLiquidMat(0x8ACDF0, 0.82));
  bottomWater.rotation.z = Math.PI;
  bottomWater.position.set(0, -1.62, 0);
  uTubeGroup.add(leftWater, rightWater, bottomWater);

  // Brass Plaques for Left ("DILUTE BLOOD") and Right ("SALTY CELLS")
  const mkPlaque = (txt, x, y = -2.72) => {
    const { tex } = makeLabelTex(320, 88, (ctx, w, h) => {
      ctx.fillStyle = '#2B1F12';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#D6A648';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#FFF3D6';
      ctx.font = '700 32px "OswaldBold"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, w / 2, h / 2 + 2);
    });
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.34, 0.08), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }));
    m.position.set(x, y, 0.46);
    return m;
  };
  uTubeGroup.add(mkPlaque('DILUTE BLOOD', -0.78, -1.94), mkPlaque('SALTY CELLS', 0.78, -1.94));
  root.add(uTubeGroup);

  // --- S17: Phospholipid Bilayer + 3 Hourglass Cyan Aquaporin-4 Channels ---
  const bilayerGroup = new THREE.Group();
  const headGeo = new THREE.SphereGeometry(0.088, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xE8B243, roughness: 0.32, metalness: 0.22 });
  const tailGeo = new THREE.CylinderGeometry(0.018, 0.015, 0.34, 8);
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xC68A2C, roughness: 0.55 });

  const poreXs = [-1.15, 0.0, 1.15];
  for (let i = -18; i <= 18; i++) {
    const x = i * 0.165;
    if (poreXs.some(px => Math.abs(x - px) < 0.28)) continue;
    for (const sgn of [1, -1]) {
      const h = new THREE.Mesh(headGeo, headMat);
      h.position.set(x, sgn * 0.38, 0);
      const t1 = new THREE.Mesh(tailGeo, tailMat);
      t1.position.set(x - 0.03, sgn * 0.18, 0);
      t1.rotation.z = sgn * 0.12;
      const t2 = new THREE.Mesh(tailGeo, tailMat);
      t2.position.set(x + 0.03, sgn * 0.18, 0);
      t2.rotation.z = -sgn * 0.12;
      bilayerGroup.add(h, t1, t2);
    }
  }

  // 3 Sculpted Hourglass Aquaporin Channel Proteins
  const aqpPts = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const y = (u - 0.5) * 1.02;
    const r = 0.15 + 0.13 * Math.pow((u - 0.5) * 2, 2);
    aqpPts.push(new THREE.Vector2(r, y));
  }
  const aqpGeo = new THREE.LatheGeometry(aqpPts, 28);
  const aqpMat = addFresnelRim(
    new THREE.MeshStandardMaterial({ color: 0x1E8FB8, roughness: 0.28, metalness: 0.18 }),
    0x7CEBFF, 2.2, 0.55
  );
  for (const px of poreXs) {
    const ch = new THREE.Mesh(aqpGeo, aqpMat);
    ch.position.set(px, 0, 0.04);
    bilayerGroup.add(ch);
  }

  // Streaming Tri-Atomic H2O Molecules (top extracellular -> through AQP4 -> bottom intracellular salty cytoplasm)
  const h2oList = [];
  const oGeo = new THREE.SphereGeometry(0.068, 14, 14);
  const hGeo = new THREE.SphereGeometry(0.042, 10, 10);
  const oMat = new THREE.MeshStandardMaterial({ color: 0x3AC8FF, emissive: 0x115588, emissiveIntensity: 0.4, roughness: 0.2 });
  const hMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.25 });

  for (let i = 0; i < 30; i++) {
    const mol = new THREE.Group();
    const ox = new THREE.Mesh(oGeo, oMat);
    const h1 = new THREE.Mesh(hGeo, hMat); h1.position.set(-0.055, 0.045, 0);
    const h2 = new THREE.Mesh(hGeo, hMat); h2.position.set(0.055, 0.045, 0);
    mol.add(ox, h1, h2);
    bilayerGroup.add(mol);
    h2oList.push({ mol, lane: i % 3, off: i / 30, spread: ((i * 7) % 11 - 5) * 0.14 });
  }

  // Intracellular Golden Salt Ions below membrane
  const naGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const naMat = new THREE.MeshStandardMaterial({ color: 0xFFB830, emissive: 0xFF8800, emissiveIntensity: 0.5, roughness: 0.25 });
  for (let i = 0; i < 18; i++) {
    const s = new THREE.Mesh(naGeo, naMat);
    s.position.set(-1.8 + (i % 6) * 0.72 + (i % 2) * 0.18, -1.05 - Math.floor(i / 6) * 0.52, -0.05);
    bilayerGroup.add(s);
  }
  root.add(bilayerGroup);

  // --- S18: Split Comparison — Flexible Muscle Bundle vs. Rigid Ivory Skull Ring ---
  const compareGroup = new THREE.Group();
  const ochreBg = new THREE.Mesh(new THREE.PlaneGeometry(11, 18), getOchreBoardMat());
  ochreBg.position.z = -1.0;
  compareGroup.add(ochreBg);

  const muscleGroup = new THREE.Group();
  muscleGroup.position.set(-0.76, -0.08, 0);
  const muscleMat = addFresnelRim(new THREE.MeshStandardMaterial({ color: 0xBF3438, roughness: 0.42 }), 0xFFA29A, 2.4, 0.35);
  for (const [ox, oy] of [[0, 0], [-0.20, 0.14], [0.20, 0.14], [-0.18, -0.18], [0.18, -0.18]]) {
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 1.05, 12, 24), muscleMat);
    f.position.set(ox, oy, 0);
    muscleGroup.add(f);
  }
  compareGroup.add(muscleGroup);
  compareGroup.add(mkPlaque('SOFT MUSCLE', -0.76, -1.35));

  const skullLockGroup = new THREE.Group();
  skullLockGroup.position.set(0.76, -0.08, 0);
  const boneRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.14, 22, 48),
    new THREE.MeshStandardMaterial({ color: 0xEFE5CE, roughness: 0.46 })
  );
  const trappedCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 28, 28),
    addFresnelRim(new THREE.MeshStandardMaterial({ color: 0xDF7674, roughness: 0.38 }), 0xFF4444, 2.2, 0.45)
  );
  trappedCore.scale.z = 0.55;
  skullLockGroup.add(boneRing, trappedCore);
  compareGroup.add(skullLockGroup);
  compareGroup.add(mkPlaque('SOLID SKULL', 0.76, -1.35));

  root.add(compareGroup);

  return {
    root,
    update(shotId, localSec, p) {
      uTubeGroup.visible = shotId === 'S16';
      bilayerGroup.visible = shotId === 'S17';
      compareGroup.visible = shotId === 'S18';

      if (shotId === 'S16') {
        const k = easeInOutCubic(clamp(localSec / 2.8));
        const lh = lerp(1.55, 0.72, k);
        const rh = lerp(1.05, 2.10, k);
        leftWater.scale.y = lh;
        leftWater.position.set(-armX, -1.62 + lh * 0.5, 0);
        rightWater.scale.y = rh;
        rightWater.position.set(armX, -1.62 + rh * 0.5, 0);
      } else if (shotId === 'S17') {
        for (const item of h2oList) {
          const u = (item.off + localSec * 0.42) % 1.0;
          const px = poreXs[item.lane];
          let x = px, y = 0;
          if (u < 0.35) {
            const k = u / 0.35;
            x = lerp(px + item.spread, px, k);
            y = lerp(1.95, 0.48, k);
          } else if (u < 0.65) {
            const k = (u - 0.35) / 0.30;
            x = px;
            y = lerp(0.48, -0.48, k);
          } else {
            const k = (u - 0.65) / 0.35;
            x = lerp(px, px + item.spread * 1.4, k);
            y = lerp(-0.48, -1.95, k);
          }
          item.mol.position.set(x, y, 0.18);
          item.mol.rotation.z = localSec * 2.2 + item.off * 6.28;
        }
      } else if (shotId === 'S18') {
        const swell = easeInOutCubic(clamp(localSec / 2.6));
        muscleGroup.scale.set(1.0 + 0.28 * swell, 1.0 + 0.14 * swell, 1.0);
        trappedCore.scale.set(1.0 + 0.06 * swell, 1.0 + 0.06 * swell, 0.55);
        trappedCore.material.color.setHex(swell > 0.5 ? 0xD9383A : 0xDF7674);
      }
    }
  };
}

// ============================================================================
// WORLD 6A: SAGITTAL HUMAN HEAD, 7MM CORTICAL SKULL, FOLDED BRAIN & HERNIATION
// (S19 - S22 — Fusion of shots_02.jpg S2/S21 & strip_08.jpg f2400)
// ============================================================================
export function buildSkullBrainWorld() {
  const root = new THREE.Group();
  const brass = getBrassMat();

  // Brass Museum Pedestal Stand
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.28, 0.22, 40), getWoodMat('walnut'));
  plinth.position.set(0, -2.55, 0);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 2.2, 24), brass);
  rod.position.set(0.12, -1.55, -0.25);
  root.add(plinth, rod);

  // LAYER 1: Sagittal Human Head & Neck Silhouette Slab (facing left, z = -0.24)
  const headOutline = [
    [0.50, 0.07], [0.30, 0.11], [0.19, 0.23], [0.17, 0.37], // Crown -> Forehead -> Brow
    [0.08, 0.48], [0.15, 0.53], [0.12, 0.59], [0.15, 0.65], // Nose -> Upper/Lower Lip
    [0.14, 0.73], [0.27, 0.77], [0.34, 0.94],               // Chin -> Jaw -> Anterior Neck
    [0.68, 0.94], [0.71, 0.73], [0.85, 0.58], [0.88, 0.38], [0.76, 0.16] // Posterior Neck -> Occiput -> Parietal
  ];

  const headSlab = buildMappedRelief({
    key: 'sagittal_head_profile_v15',
    width: 4.15,
    height: 4.65,
    depth: 0.16,
    bevel: 0.035,
    outlinePts: headOutline,
    sideColor: 0x5D3E31,
    roughness: 0.62,
    rimHex: 0xF5CEB0,
    rimStrength: 0.18,
    paintFn: (ctx, hCtx, S) => {
      const g = ctx.createLinearGradient(0, 0, S, S);
      g.addColorStop(0, '#CFA082');
      g.addColorStop(0.55, '#AF7D60');
      g.addColorStop(1, '#7D533D');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);

      // Dark cranial & pharyngeal interior recess so ivory skull & pink brain pop with 3D contrast
      ctx.fillStyle = '#2B161A';
      ctx.beginPath();
      ctx.ellipse(S * 0.53, S * 0.40, S * 0.31, S * 0.27, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(S * 0.44, S * 0.60, S * 0.15, S * 0.35); // Spinal canal channel
    }
  });
  headSlab.position.set(0, -0.15, -0.24);
  root.add(headSlab);

  // LAYER 2: 7mm Solid Ivory Cortical Skull Vault & Base (with open Foramen Magnum at bottom!)
  const skullVaultOutline = [
    [0.50, 0.09], [0.29, 0.14], [0.20, 0.27], [0.21, 0.43], [0.36, 0.54],
    [0.44, 0.64], [0.40, 0.64], [0.28, 0.53], [0.16, 0.42], [0.15, 0.25],
    [0.25, 0.10], [0.50, 0.05], [0.76, 0.13], [0.87, 0.34], [0.84, 0.56],
    [0.69, 0.66], [0.60, 0.66], [0.64, 0.61], [0.78, 0.52], [0.81, 0.34], [0.72, 0.17]
  ];
  // Better yet: crisp continuous cranial bone shell painted at 1024x1024 on cranial dome slab with deep recessed interior!
  const craniumOutline = [
    [0.50, 0.08], [0.28, 0.13], [0.18, 0.27], [0.19, 0.45],
    [0.34, 0.59], [0.43, 0.68], [0.63, 0.68], [0.79, 0.58],
    [0.86, 0.38], [0.75, 0.15]
  ];

  const skullSlab = buildMappedRelief({
    key: 'cortical_skull_7mm_v15',
    width: 4.15,
    height: 4.65,
    depth: 0.18,
    bevel: 0.03,
    outlinePts: craniumOutline,
    sideColor: 0xBFB093,
    roughness: 0.46,
    rimHex: 0xFFF7E2,
    rimStrength: 0.24,
    paintFn: (ctx, hCtx, S) => {
      // Ivory 7mm Bone Outer Shell
      ctx.fillStyle = '#EFE5CC';
      ctx.fillRect(0, 0, S, S);
      hCtx.fillStyle = '#EAEAEA';
      hCtx.fillRect(0, 0, S, S);

      // Trabecular diploë marrow stippling inside the bone band
      const rng = mulberry32(6019);
      for (let i = 0; i < 3200; i++) {
        const x = rng() * S, y = rng() * S;
        ctx.fillStyle = rng() > 0.5 ? 'rgba(176,120,96,0.25)' : 'rgba(255,252,242,0.35)';
        ctx.fillRect(x, y, 3, 3);
      }

      // Deep dark cranial vault cavity inside the 7mm bone wall!
      const drawCavity = (c, fill) => {
        c.fillStyle = fill;
        c.beginPath();
        c.moveTo(S * 0.50, S * 0.135);
        c.bezierCurveTo(S * 0.28, S * 0.15, S * 0.225, S * 0.30, S * 0.24, S * 0.43);
        c.bezierCurveTo(S * 0.26, S * 0.53, S * 0.38, S * 0.57, S * 0.455, S * 0.63);
        // Open Foramen Magnum throat!
        c.lineTo(S * 0.465, S * 0.70);
        c.lineTo(S * 0.585, S * 0.70);
        c.lineTo(S * 0.595, S * 0.63);
        c.bezierCurveTo(S * 0.74, S * 0.61, S * 0.805, S * 0.50, S * 0.795, S * 0.36);
        c.bezierCurveTo(S * 0.785, S * 0.20, S * 0.67, S * 0.135, S * 0.50, S * 0.135);
        c.closePath();
        c.fill();
      };
      drawCavity(ctx, '#1C2736'); // Subtle dark CSF cavity
      drawCavity(hCtx, '#303030');

      // Crisp inner cortical bone lamina highlight
      ctx.strokeStyle = '#FFF9EA';
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  });
  skullSlab.position.set(0, -0.15, -0.06);
  root.add(skullSlab);

  // Translucent Blue CSF Cushion Halo inside the Cranial Vault (gets squeezed away as brain swells!)
  const csfHalo = new THREE.Mesh(
    new THREE.SphereGeometry(1.16, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x4EC9FF, transparent: true, opacity: 0.26, depthWrite: false })
  );
  csfHalo.scale.set(1.06, 0.88, 0.12);
  csfHalo.position.set(0.06, 0.44, 0.05);
  root.add(csfHalo);

  // LAYER 3A: Folded Cerebral Hemisphere + Corpus Callosum Relief (Independently Swelling!)
  const cerebrumOutline = [
    [0.50, 0.16], [0.33, 0.19], [0.25, 0.30], [0.26, 0.43],
    [0.36, 0.52], [0.52, 0.51], [0.64, 0.50], [0.77, 0.47],
    [0.78, 0.33], [0.68, 0.19]
  ];

  const cerebrumMesh = buildMappedRelief({
    key: 'folded_cerebrum_gyri_v15_curved',
    width: 3.92,
    height: 4.40,
    depth: 0.22,
    bevel: 0.05,
    outlinePts: cerebrumOutline,
    sideColor: 0x8F3D42,
    roughness: 0.38,
    bumpStrength: 2.8,
    rimHex: 0xFFD4CC,
    rimStrength: 0.34,
    paintFn: (ctx, hCtx, S) => {
      const bg = ctx.createRadialGradient(S * 0.48, S * 0.32, 30, S * 0.52, S * 0.35, S * 0.35);
      bg.addColorStop(0, '#F4ABA2');
      bg.addColorStop(0.65, '#DF7F78');
      bg.addColorStop(1, '#AC4E4B');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, S, S);

      hCtx.fillStyle = '#D2D2D2';
      hCtx.fillRect(0, 0, S, S);

      // Soft airbrushed rounded gyrus pads
      const gyriPads = [
        [0.34, 0.27, 0.07, 0.04], [0.43, 0.22, 0.08, 0.04], [0.55, 0.21, 0.08, 0.04],
        [0.66, 0.25, 0.07, 0.04], [0.72, 0.35, 0.06, 0.05], [0.33, 0.38, 0.07, 0.04],
        [0.45, 0.45, 0.09, 0.04], [0.63, 0.44, 0.08, 0.04]
      ];
      for (const [gx, gy, rx, ry] of gyriPads) {
        const gg = ctx.createRadialGradient(gx * S, gy * S - 6, 4, gx * S, gy * S, rx * S);
        gg.addColorStop(0, 'rgba(255, 226, 218, 0.58)');
        gg.addColorStop(1, 'rgba(255, 226, 218, 0.0)');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.ellipse(gx * S, gy * S, rx * S, ry * S, 0, 0, Math.PI * 2); ctx.fill();
      }

      const smoothCurve = (targetCtx, pts) => {
        targetCtx.beginPath();
        targetCtx.moveTo(pts[0][0] * S, pts[0][1] * S);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i][0] + pts[i + 1][0]) * 0.5 * S;
          const my = (pts[i][1] + pts[i + 1][1]) * 0.5 * S;
          targetCtx.quadraticCurveTo(pts[i][0] * S, pts[i][1] * S, mx, my);
        }
        const last = pts[pts.length - 1];
        targetCtx.lineTo(last[0] * S, last[1] * S);
      };

      const sulci = [
        [[0.27, 0.39], [0.35, 0.36], [0.43, 0.41], [0.51, 0.37], [0.58, 0.39]],
        [[0.51, 0.17], [0.49, 0.24], [0.53, 0.30], [0.50, 0.36]],
        [[0.30, 0.31], [0.35, 0.26], [0.41, 0.31], [0.46, 0.25]],
        [[0.35, 0.21], [0.41, 0.24], [0.46, 0.19], [0.50, 0.23]],
        [[0.57, 0.19], [0.60, 0.25], [0.56, 0.31], [0.63, 0.33]],
        [[0.65, 0.22], [0.69, 0.28], [0.66, 0.35], [0.74, 0.37]],
        [[0.71, 0.29], [0.75, 0.34], [0.72, 0.42], [0.77, 0.45]],
        [[0.32, 0.45], [0.39, 0.43], [0.46, 0.47], [0.54, 0.44]],
        [[0.57, 0.44], [0.63, 0.42], [0.69, 0.46], [0.75, 0.43]],
        [[0.38, 0.27], [0.37, 0.33], [0.43, 0.36]],
        [[0.62, 0.27], [0.61, 0.34], [0.67, 0.39]]
      ];

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      hCtx.lineCap = 'round';
      hCtx.lineJoin = 'round';

      for (const path of sulci) {
        ctx.strokeStyle = 'rgba(128, 42, 48, 0.38)';
        ctx.lineWidth = 16;
        smoothCurve(ctx, path);
        ctx.stroke();

        ctx.strokeStyle = '#6A2026';
        ctx.lineWidth = 6.5;
        smoothCurve(ctx, path);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(205, 34, 42, 0.72)';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        hCtx.strokeStyle = '#484848';
        hCtx.lineWidth = 14;
        smoothCurve(hCtx, path);
        hCtx.stroke();
      }

      // Arched White-Matter Corpus Callosum & Thalamus at Sagittal Center
      ctx.strokeStyle = '#F7EDE0';
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(S * 0.39, S * 0.43);
      ctx.bezierCurveTo(S * 0.40, S * 0.325, S * 0.61, S * 0.325, S * 0.63, S * 0.43);
      ctx.stroke();

      ctx.fillStyle = '#DCA08D';
      ctx.beginPath();
      ctx.ellipse(S * 0.52, S * 0.43, S * 0.072, S * 0.044, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  cerebrumMesh.position.set(0, -0.15, 0.12);
  root.add(cerebrumMesh);

  // LAYER 3B: Cerebellum (Arbor Vitae) & Descending Brainstem (Herniates Downward through Foramen Magnum in S22!)
  const stemOutline = [
    [0.48, 0.47], [0.45, 0.55], [0.47, 0.66], [0.48, 0.88],
    [0.55, 0.88], [0.56, 0.67], [0.68, 0.64], [0.76, 0.57],
    [0.74, 0.49], [0.62, 0.48]
  ];
  const brainstemMesh = buildMappedRelief({
    key: 'cerebellum_brainstem_v15',
    width: 3.92,
    height: 4.40,
    depth: 0.20,
    bevel: 0.04,
    outlinePts: stemOutline,
    sideColor: 0x7A363A,
    roughness: 0.38,
    rimHex: 0xFFE0CC,
    rimStrength: 0.32,
    paintFn: (ctx, hCtx, S) => {
      // Ivory-pink Pons, Medulla & Spinal Cord column on left (0.46..0.56)
      const sg = ctx.createLinearGradient(S * 0.45, 0, S * 0.57, 0);
      sg.addColorStop(0, '#F3DFCE');
      sg.addColorStop(0.6, '#DFBEAB');
      sg.addColorStop(1, '#B88B78');
      ctx.fillStyle = sg;
      ctx.fillRect(S * 0.43, S * 0.46, S * 0.16, S * 0.45);

      // Glowing cyan neural tract down brainstem center
      ctx.strokeStyle = '#5BE2FF';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(S * 0.51, S * 0.48);
      ctx.lineTo(S * 0.515, S * 0.88);
      ctx.stroke();

      // Cerebellum Foliated Lobe on right (0.56..0.76, 0.48..0.65)
      ctx.fillStyle = '#C96D68';
      ctx.beginPath();
      ctx.ellipse(S * 0.65, S * 0.565, S * 0.11, S * 0.085, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Fine horizontal cerebellar folia striations
      ctx.strokeStyle = '#6B2428';
      ctx.lineWidth = 3.5;
      for (let y = S * 0.49; y <= S * 0.64; y += 9) {
        ctx.beginPath();
        ctx.moveTo(S * 0.55, y);
        ctx.lineTo(S * 0.75, y + 3);
        ctx.stroke();
      }

      // White Arbor Vitae ("Tree of Life") branching core inside cerebellum!
      ctx.strokeStyle = '#FAF0E2';
      ctx.lineWidth = 7;
      const cx = S * 0.57, cy = S * 0.565;
      for (const [dx, dy] of [[85, -42], [105, -12], [98, 22], [68, 46]]) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx, cy + dy);
        ctx.stroke();
      }
    }
  });
  brainstemMesh.position.set(0, -0.15, 0.10);
  root.add(brainstemMesh);

  // S19 Brass "7 MM BONE" Caliper Bracket at Parietal Wall
  const caliperGroup = new THREE.Group();
  const calPlate = makeLabelTex(260, 84, (ctx, w, h) => {
    ctx.fillStyle = '#241B12'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#E0B04E'; ctx.lineWidth = 6; ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#FFF4DA'; ctx.font = '700 34px "OswaldBold"';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('7 MM BONE', w / 2, h / 2 + 2);
  });
  const calTag = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.32, 0.08), new THREE.MeshStandardMaterial({ map: calPlate.tex }));
  calTag.position.set(1.12, 1.48, 0.25);
  const calPin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.48, 12), brass);
  calPin.rotation.z = Math.PI * 0.28;
  calPin.position.set(0.78, 1.24, 0.22);
  caliperGroup.add(calTag, calPin);
  root.add(caliperGroup);

  // S21 Intracranial Pressure (ICP mmHg) Brass Manometer
  const icpGauge = buildBrassDialGauge({ radius: 0.48, title: 'SKULL ICP', subLeft: '45!', subRight: '10' });
  icpGauge.group.position.set(1.06, 1.05, 0.28);
  root.add(icpGauge.group);

  // S22 Red Foramen Magnum Pinch Indicators at Skull Base
  const pinchGroup = new THREE.Group();
  const arrowGeo = new THREE.ConeGeometry(0.12, 0.34, 18);
  const arrowMat = new THREE.MeshStandardMaterial({ color: 0xFF2B28, emissive: 0x990000, emissiveIntensity: 0.55 });
  const leftPinch = new THREE.Mesh(arrowGeo, arrowMat);
  leftPinch.rotation.z = -Math.PI / 2;
  leftPinch.position.set(-0.36, -0.96, 0.28);
  const rightPinch = new THREE.Mesh(arrowGeo, arrowMat);
  rightPinch.rotation.z = Math.PI / 2;
  rightPinch.position.set(0.48, -0.96, 0.28);
  pinchGroup.add(leftPinch, rightPinch);
  root.add(pinchGroup);

  return {
    root,
    update(shotId, localSec, p) {
      caliperGroup.visible = shotId === 'S19';
      icpGauge.group.visible = shotId === 'S21';
      pinchGroup.visible = shotId === 'S22';

      let swell = 0;
      let herniate = 0;
      if (shotId === 'S19') {
        swell = 0.0;
      } else if (shotId === 'S20') {
        swell = easeInOutCubic(clamp(localSec / 2.8));
      } else if (shotId === 'S21') {
        swell = 1.0;
        const k = easeInOutCubic(clamp(localSec / 2.4));
        icpGauge.needlePivot.rotation.z = lerp(-0.65, 0.78, k) + Math.sin(localSec * 28) * 0.03;
      } else if (shotId === 'S22') {
        swell = 1.0;
        herniate = easeInOutCubic(clamp(localSec / 2.6));
        const pulse = Math.sin(localSec * 12) * 0.04;
        leftPinch.position.x = -0.34 + pulse;
        rightPinch.position.x = 0.46 - pulse;
      }

      // Cerebrum expands from 1.00 -> 1.088, obliterating the blue CSF cushion right up against the 7mm skull!
      const sc = 1.0 + 0.088 * swell;
      cerebrumMesh.scale.set(sc, sc, 1.0 + 0.10 * swell);
      cerebrumMesh.position.set(-0.01 * swell, -0.15 - 0.02 * swell, 0.12);
      csfHalo.material.opacity = lerp(0.28, 0.02, swell);

      // Flush cortex deeper crimson under high ICP (S21-S22)
      const flush = shotId === 'S21' || shotId === 'S22' ? 1.0 : swell * 0.4;
      cerebrumMesh.material[0].color.setRGB(1.0, lerp(1.0, 0.74, flush), lerp(1.0, 0.74, flush));

      // Brainstem & cerebellar tonsils herniate downward into the Foramen Magnum in S22!
      brainstemMesh.position.set(0, -0.15 - 0.24 * herniate, 0.10);
      brainstemMesh.scale.set(1.0 - 0.04 * herniate, 1.0 + 0.06 * herniate, 1.0);
    }
  };
}
