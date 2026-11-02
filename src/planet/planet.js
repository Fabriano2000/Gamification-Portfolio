// The little round world. It is a thick disc (a slice of a planet seen side-on, the HD-2D-friendly
// version of a globe). The player stays on top; walking rotates the planet underneath, so the
// portfolio stops come round one after another and loop forever.
import * as THREE from 'three';
import { createKit } from '../env/kit.js';
import { PixelSprite } from '../sprite.js';
import { RUNESTONE, MAILBOX, WIZARD_IDLE, tileTexture, pixelTexture } from '../pixel.js';

export const R = 36;
const DEPTH = 12;
const DEG = Math.PI / 180;
export const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

const GRASS = { N: '#3f8a4a', u: '#2a6a3a', C: '#c07bff', W: '#7ad8ff' };

/** Pixel cross-section of the planet: strata, roots, glowing crystals and a warm core. */
function earthTextures(rand) {
  const S = 192, C = S / 2;
  const base = document.createElement('canvas'); base.width = base.height = S;
  const glow = document.createElement('canvas'); glow.width = glow.height = S;
  const b = base.getContext('2d'), g = glow.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  const strata = ['#3a2a44', '#2c2238', '#352848', '#261e34', '#302444', '#221a30'];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - C + 0.5, dy = y - C + 0.5, d = Math.sqrt(dx * dx + dy * dy) / C;
    if (d > 1) continue;
    const a = Math.atan2(dy, dx);
    const wob = d + Math.sin(a * 7) * 0.012 + Math.sin(a * 13 + 1) * 0.008;
    let col = strata[Math.floor(wob * 14) % strata.length];
    if (d > 0.95) col = '#3e2e4a';
    if (d < 0.22) col = d < 0.12 ? '#6a2a6a' : '#3a1e4a';
    if ((x * 7 + y * 13) % 29 === 0) col = '#33283f';
    b.fillStyle = col; b.fillRect(x, y, 1, 1);
    if (d < 0.12) { g.fillStyle = '#5a1a5a'; g.fillRect(x, y, 1, 1); }
  }
  // crystal clusters
  const cols = ['#4ae0ff', '#c07bff', '#ff6ad8', '#7affc8'];
  for (let i = 0; i < 90; i++) {
    const a = rand() * Math.PI * 2, d = i < 50 ? 0.72 + rand() * 0.24 : 0.3 + rand() * 0.45;
    const x = Math.floor(C + Math.cos(a) * d * C), y = Math.floor(C + Math.sin(a) * d * C);
    const col = cols[Math.floor(rand() * cols.length)];
    for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, -1]]) if (rand() < 0.8) {
      b.fillStyle = col; b.fillRect(x + ox, y + oy, 1, 1);
      g.fillStyle = col; g.fillRect(x + ox, y + oy, 1, 1);
    }
  }
  // roots near the surface
  b.fillStyle = '#120c14';
  for (let i = 0; i < 70; i++) {
    let a = rand() * Math.PI * 2, d = 0.97;
    for (let k = 0; k < 10; k++) {
      b.fillRect(Math.floor(C + Math.cos(a) * d * C), Math.floor(C + Math.sin(a) * d * C), 1, 1);
      d -= 0.008 + rand() * 0.01; a += (rand() - 0.5) * 0.03;
    }
  }
  return { map: pixelTexture(base), glow: pixelTexture(glow) };
}

export function createPlanet(scene, quality, rand, content) {
  const planet = new THREE.Group();
  planet.name = 'planet';
  planet.position.set(0, -R, 0);
  scene.add(planet);
  const budget = { n: 0 };
  const kits = [];
  const sprites = [];
  const animated = [];
  const stations = [];
  const glowK = { v: 1 }; // 0 = broad daylight, 1 = deep night

  // ---------- the disc
  const geo = new THREE.CylinderGeometry(R, R, DEPTH, 200, 1);
  geo.rotateX(Math.PI / 2); // top cap now faces the camera
  const earth = earthTextures(rand);
  const sideMat = new THREE.MeshStandardMaterial({ map: tileTexture('grass', (2 * Math.PI * R) / 1.6, DEPTH / 1.6, GRASS), roughness: 1 });
  const capMat = new THREE.MeshStandardMaterial({ map: earth.map, emissiveMap: earth.glow, emissive: '#ffffff', emissiveIntensity: 1.8, roughness: 1 });
  const disc = new THREE.Mesh(geo, [sideMat, capMat, capMat]);
  disc.receiveShadow = true;
  planet.add(disc);

  // ---------- placement on the rim: deg is clockwise from the top
  const place = (deg, z = 0) => {
    const pivot = new THREE.Group();
    pivot.rotation.z = -deg * DEG;
    const holder = new THREE.Group();
    holder.position.set(0, R, z);
    pivot.add(holder);
    planet.add(pivot);
    return holder;
  };
  const kitAt = (deg, z = 0) => { const k = createKit(place(deg, z), scene, quality, rand, budget); kits.push(k); return k; };
  const sprite = (holder, opts, x = 0, z = 0) => {
    const s = new PixelSprite(opts);
    s.mesh.position.set(x, 0, z);
    holder.add(s.mesh);
    sprites.push(s);
    return s;
  };
  const signpost = (k, text, x, z = 1.2) => {
    k.box(0.14, 1.3, 0.14, k.mat({ color: '#5a4030' }), x, 0.65, z);
    k.sign(text, { style: 'wood', x, y: 1.35, z: z + 0.1, scale: 0.045, light: false });
  };
  const station = (s) => { stations.push(s); return s; };

  // ---------- 1. HOME (about)
  {
    const k = kitAt(10, -1.4);
    const wall = k.mat({ map: tileTexture('plaster_timber', 4.2 / 1.6, 3 / 1.6, { F: '#e8dcc4', l: '#c8b89c', t: '#4a3020' }) });
    k.box(4.2, 3, 3, wall, 0, 1.5, 0).castShadow = true;
    k.gableRoof(0, 3, 0, 4.2, 3, { tile: 'roof_red', height: 2 });
    k.box(0.9, 0.8, 0.06, k.glowMat('#ffc06a', 2.6), -1.1, 1.8, 1.52);
    k.box(0.9, 0.8, 0.06, k.glowMat('#ffc06a', 2.6), 1.1, 1.8, 1.52);
    k.box(0.8, 1.5, 0.06, k.mat({ color: '#4a3020' }), 0, 0.75, 1.52);
    k.lamp(2.7, 0.9, { color: '#ffb85a', h: 2.4, pole: '#2a2228' });
    signpost(k, 'HOME', -2.9);
    station({ kind: 'about', deg: 10, label: 'HOME · ABOUT', color: '#ffb85a', holder: k.group, anchor: new THREE.Vector3(0, 6.2, 1.4) });
  }

  // ---------- guide NPC
  {
    const h = place(22, -0.3);
    sprite(h, { frames: WIZARD_IDLE, scale: 1.25, fps: 4, glowChars: 'CY', glow: 2, recolor: { X: '#2a3a7a', x: '#1a2450' } });
    station({ kind: 'npc', deg: 22, label: 'SAGE', color: '#9ad8ff', holder: h, anchor: new THREE.Vector3(0, 3.0, 0) });
  }

  // ---------- 2. SKILLS: crystal shrine
  {
    const k = kitAt(61, -0.6);
    k.box(3.4, 0.5, 2.2, k.mat({ map: tileTexture('stone_block', 2, 1) }), 0, 0.25, 0);
    const cols = ['#4ae0ff', '#c07bff', '#7affc8', '#ff6ad8', '#4ae0ff'];
    const crystals = new THREE.Group();
    [[-1, 1.6, 0.5], [-0.3, 2.6, 0.7], [0.5, 2.0, 0.55], [1.1, 1.3, 0.4], [0.1, 1.2, 0.35]].forEach(([x, h, r], i) => {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), new THREE.MeshStandardMaterial({ color: cols[i], emissive: cols[i], emissiveIntensity: 1.6, roughness: 0.3, flatShading: true }));
      c.scale.y = h / r / 1.4; c.position.set(x, 0.5 + h * 0.5, 0); c.rotation.z = (x) * 0.12;
      crystals.add(c);
    });
    k.add(crystals);
    const floaters = [0, 1, 2].map((i) => {
      const f = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), k.glowMat(cols[i + 1], 2.4));
      k.add(f); return f;
    });
    k.onUpdate((t) => floaters.forEach((f, i) => {
      const a = t * 0.8 + (i * Math.PI * 2) / 3;
      f.position.set(Math.cos(a) * 1.7, 3.2 + Math.sin(t * 1.3 + i) * 0.3, Math.sin(a) * 0.8);
      f.rotation.y = t * 2;
    }));
    k.pointLight('#6ad8ff', 7, 9, 0, 2.4, 1.4);
    signpost(k, 'SKILLS', -2.4);
    station({ kind: 'skills', deg: 61, label: 'CRYSTAL SHRINE · SKILLS', color: '#4ae0ff', holder: k.group, anchor: new THREE.Vector3(0, 4.6, 0.6) });
  }

  // ---------- 3-5. PROJECTS: runestones
  const runeCols = ['#c07bff', '#2ac4b0', '#f0c04a'];
  content.projects.slice(0, 3).forEach((p, i) => {
    const deg = 112 + i * 51;
    const k = kitAt(deg, -0.3);
    const s = sprite(k.group, {
      frames: RUNESTONE, scale: 1.6, glowChars: 'I', glow: 2.8,
      recolor: { N: '#3f8a4a', u: '#2a6a3a', I: runeCols[i] },
    });
    k.pointLight(runeCols[i], 6, 8, 0, 2, 1.2);
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.6), new THREE.MeshBasicMaterial({ color: runeCols[i], transparent: true, opacity: 0.6, depthWrite: false }));
    beam.position.set(0, s.height + 0.8, 0);
    k.add(beam);
    k.onUpdate((t) => { beam.material.opacity = 0.3 + 0.3 * Math.sin(t * 3 + i); });
    if (i === 0) signpost(k, 'QUESTS', -2.2);
    station({ kind: 'project', index: i, deg, label: p.quest, color: runeCols[i], holder: k.group, anchor: new THREE.Vector3(0, s.height + 1.8, 0) });
  });

  // ---------- 6. CAREER: lighthouse
  {
    const k = kitAt(265, -2.2);
    const stripes = ['#c84a4a', '#f0ece4'];
    for (let i = 0; i < 4; i++) {
      const r0 = 1.3 - i * 0.1, r1 = 1.3 - (i + 1) * 0.1;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 2, 10), k.flat(stripes[i % 2]));
      seg.position.y = 1 + i * 2; seg.castShadow = true; k.add(seg);
    }
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1, 8), k.glowMat('#ffe6a0', 3));
    lamp.position.y = 8.5; k.add(lamp);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.2, 8), k.flat('#3a2a2a'));
    roof.position.y = 9.6; k.add(roof);
    k.pointLight('#ffe6a0', 8, 12, 0, 8.5, 1.5);
    const beamPivot = new THREE.Group(); beamPivot.position.y = 8.5; k.add(beamPivot);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 24, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: '#ffe6a0', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.rotation.z = Math.PI / 2; cone.position.x = 12;
    beamPivot.add(cone);
    k.onUpdate((t) => { beamPivot.rotation.y = t * 0.7; cone.material.opacity = 0.1 * glowK.v; });
    signpost(k, 'CAREER', 2.4, 3.2);
    station({ kind: 'career', deg: 265, label: 'LIGHTHOUSE · CAREER', color: '#ffe6a0', holder: k.group, anchor: new THREE.Vector3(0, 11.5, 2.2) });
  }

  // ---------- 7. CONTACT: campfire + mailbox
  {
    const k = kitAt(316, -0.6);
    for (const r of [0.6, -0.6]) { const log = k.box(1.6, 0.22, 0.22, k.flat('#3a2418'), 0, 0.15, 0); log.rotation.y = r; }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), k.flat('#7a7e90'));
      st.position.set(Math.cos(a) * 0.95, 0.12, Math.sin(a) * 0.6); k.add(st);
    }
    const flames = ['#ff5a1a', '#ff9a2a', '#ffe06a'].map((c, i) => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.42 - i * 0.11, 1.2 - i * 0.25, 5), k.glowMat(c, 3));
      f.position.y = 0.6 - i * 0.05; k.add(f); return f;
    });
    const fire = k.pointLight('#ff8a3a', 9, 10, 0, 1.2, 0.8);
    k.onUpdate((t) => {
      flames.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 9 + i) * 0.08, 1 + Math.sin(t * 13 + i * 2) * 0.18, 1); f.rotation.y = t * (1 + i); });
      if (fire) fire.intensity = (8 + Math.sin(t * 11) * 1.5 + Math.sin(t * 23) * 1) * (0.25 + 0.75 * glowK.v);
    });
    // embers
    const n = 30, ep = new Float32Array(n * 3), life = new Float32Array(n);
    for (let i = 0; i < n; i++) life[i] = Math.random();
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
    const embers = new THREE.Points(eg, new THREE.PointsMaterial({ color: '#ffb04a', size: 0.12, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    embers.frustumCulled = false; k.add(embers);
    k.onUpdate((t) => {
      for (let i = 0; i < n; i++) {
        life[i] += 0.006 + (i % 5) * 0.001; if (life[i] > 1) life[i] = 0;
        ep[i * 3] = Math.sin(i * 7.3 + t) * 0.3 * life[i]; ep[i * 3 + 1] = 0.6 + life[i] * 3.5; ep[i * 3 + 2] = Math.cos(i * 3.1) * 0.2;
      }
      eg.attributes.position.needsUpdate = true;
    });
    for (const x of [-1.8, 1.8]) k.box(1.2, 0.3, 0.4, k.flat('#2a1a14'), x, 0.15, 0.6);
    sprite(k.group, { frames: MAILBOX, scale: 1.4, recolor: { J: '#c0405a', j: '#80203a' } }, 3.2, -0.4);
    signpost(k, 'CONTACT', -3.0);
    station({ kind: 'contact', deg: 316, label: 'CAMPFIRE · CONTACT', color: '#ff9a4a', holder: k.group, anchor: new THREE.Vector3(0.8, 3.6, 0.6) });
  }

  // ---------- scenery between the stops
  const near = (deg, pad) => stations.some((s) => Math.abs(wrap180(s.deg - deg)) < pad);
  const shroomCols = ['#4ae0ff', '#ff6ad8', '#7affc8'];
  for (let deg = 0; deg < 360; deg += 2.5 + rand() * 4) {
    // back row: trees
    if (!near(deg, 5)) {
      const k = kitAt(deg, -3.5 - rand() * 2);
      const h = 3 + rand() * 4;
      if (rand() < 0.6) k.pine(0, 0, h, rand() < 0.5 ? '#2a5a3a' : '#2f6a44', '#4a3020');
      else k.roundTree(0, 0, h, '#3a7a4a', '#4a3020');
    }
    // mid: rocks, mushrooms, fence posts
    if (!near(deg, 4) && rand() < 0.5) {
      const k = kitAt(deg + 1.2, (rand() - 0.5) * 4);
      const r = rand();
      if (r < 0.45) {
        const col = shroomCols[Math.floor(rand() * shroomCols.length)];
        for (let i = 0; i < 1 + Math.floor(rand() * 3); i++) {
          const x = (rand() - 0.5) * 0.8, s = 0.6 + rand() * 0.6;
          k.box(0.08 * s, 0.4 * s, 0.08 * s, k.mat({ color: '#d8d0e8' }), x, 0.2 * s, 0);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), k.glowMat(col, 1.8));
          cap.position.set(x, 0.4 * s, 0); k.add(cap);
        }
      } else if (r < 0.8) {
        const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + rand() * 0.5, 0), k.flat('#6a6e80'));
        rock.position.y = 0.2; rock.castShadow = true; k.add(rock);
      } else {
        for (let i = 0; i < 3; i++) k.box(0.12, 0.8, 0.12, k.flat('#5a4030'), i * 0.6 - 0.6, 0.4, 0);
        k.box(1.5, 0.08, 0.08, k.flat('#5a4030'), 0, 0.6, 0);
      }
    }
    // front row: dark bushes (blurred by depth of field)
    if (rand() < 0.45) {
      const k = kitAt(deg + 0.7, 4.2 + rand() * 1.5);
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 + rand() * 0.6, 0), k.flat('#2a4a30'));
      b.position.y = 0.25; k.add(b);
    }
  }

  // ---------- grass tufts (instanced)
  const tufts = quality.name === 'low' ? 700 : 2400;
  const blade = new THREE.ConeGeometry(0.07, 0.5, 3);
  blade.translate(0, 0.25, 0);
  const grassInst = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: '#3f8a4a', roughness: 1, flatShading: true }), tufts);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < tufts; i++) {
    const a = rand() * Math.PI * 2, z = (rand() - 0.5) * (DEPTH - 0.6);
    dummy.position.set(Math.sin(a) * R, Math.cos(a) * R, z);
    dummy.rotation.set(0, rand() * Math.PI, -a + (rand() - 0.5) * 0.4, 'ZXY');
    dummy.rotation.z = -a + (rand() - 0.5) * 0.4;
    const s = 0.6 + rand() * 0.9; dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    grassInst.setMatrixAt(i, dummy.matrix);
  }
  planet.add(grassInst);

  // ---------- glowing flowers dotted over the rim
  const fn = 260, fp = new Float32Array(fn * 3), fc = new Float32Array(fn * 3);
  const fcol = [new THREE.Color('#ff7ad8'), new THREE.Color('#7ad8ff'), new THREE.Color('#fff2a0')];
  for (let i = 0; i < fn; i++) {
    const a = rand() * Math.PI * 2, z = (rand() - 0.5) * (DEPTH - 1);
    fp.set([Math.sin(a) * (R + 0.25), Math.cos(a) * (R + 0.25), z], i * 3);
    fcol[i % 3].toArray(fc, i * 3);
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  fg.setAttribute('color', new THREE.BufferAttribute(fc, 3));
  const flowerMat = new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  planet.add(new THREE.Points(fg, flowerMat));

  for (const k of kits) animated.push(...k.animated);
  const tmp = new THREE.Vector3();

  // everything that glows gets dimmer in daylight
  const emissives = [], lights = [];
  planet.traverse((o) => {
    if (o.isPointLight) { if (o.color.getHex() !== new THREE.Color('#ff8a3a').getHex()) lights.push({ l: o, base: o.intensity }); return; }
    for (const m of [].concat(o.material || [])) {
      if (m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0 && !emissives.some((e) => e.m === m)) emissives.push({ m, base: m.emissiveIntensity });
    }
  });

  return {
    group: planet,
    stations,
    /** rotation in degrees: positive = walked to the right */
    setRotation(deg) { planet.rotation.z = deg * DEG; },
    nearest(rotDeg, maxDeg = 4.5) {
      let best = null, bd = maxDeg;
      for (const s of stations) {
        const d = Math.abs(wrap180(s.deg - rotDeg));
        if (d < bd) { bd = d; best = s; }
      }
      return best;
    },
    anchorWorld(s) { return s.holder.localToWorld(tmp.copy(s.anchor)); },
    /** n: 0 = day, 1 = night */
    setNight(n) {
      glowK.v = n;
      for (const e of emissives) e.m.emissiveIntensity = e.base * (0.3 + 0.7 * n);
      for (const l of lights) l.l.intensity = l.base * (0.12 + 0.88 * n);
    },
    update(t, dt) {
      for (const a of animated) a(t);
      for (const s of sprites) s.update(dt);
      flowerMat.opacity = (0.75 + 0.25 * Math.sin(t * 2)) * (0.35 + 0.65 * glowK.v);
    },
  };
}
