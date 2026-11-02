// Villages, towns and the people who live in them. Everything is placed by angle on the planet
// rim (deg clockwise from the top at the start, which is dawn). Dialogue text lives in content.js.
import * as THREE from 'three';
import { tileTexture } from '../pixel.js';
import { villagerFrames, CAT } from './folk.js';
import { WIZARD_IDLE } from '../pixel.js';

export const SETTLEMENTS = [
  { name: 'DAWNVALE', from: 27, to: 51 },
  { name: 'MILLBROOK', from: 76, to: 100 },
  { name: 'DUSKHAVEN', from: 217, to: 259 },
  { name: 'LANTERNREACH', from: 280, to: 307 },
  { name: 'OLD RUINS', from: 331, to: 353 },
];

// Who lives where. `look` picks the sprite, `wander` (deg) makes them stroll back and forth.
const FOLK = [
  { id: 'sage', deg: 22, z: -0.3, wizard: true, recolor: { X: '#2a3a7a', x: '#1a2450' } },
  { id: 'baker', deg: 33, z: -0.6, look: { head: 'short' }, recolor: { H: '#6a3a1a', J: '#f0ece4', j: '#c8c0b0', P: '#4a3a2a' } },
  { id: 'kid', deg: 40, z: 0.2, scale: 0.85, wander: 4, speed: 0.5, look: { head: 'short' }, recolor: { H: '#e8b040', J: '#3a7bd5', j: '#1d3f7a', P: '#4a4a6a' } },
  { id: 'cat', deg: 46, z: 0.3, cat: true, wander: 2.5, speed: 0.35, recolor: { G: '#f0a050' } },
  { id: 'farmer', deg: 90, z: -0.5, look: { head: 'hat' }, recolor: { T: '#e8c060', H: '#5a3a1a', J: '#3f8a4a', j: '#2a6a3a', P: '#3a4a6a' } },
  { id: 'bard', deg: 140, z: -0.4, look: { head: 'long' }, recolor: { H: '#c84a2a', J: '#8a3aa8', j: '#5a2a7a', P: '#2a2a3a' } },
  { id: 'traveler', deg: 188, z: 0.1, wander: 7, speed: 0.18, look: { head: 'hat' }, recolor: { T: '#5a4030', H: '#2a1a10', J: '#6a5a4a', j: '#4a3a2a', P: '#3a3030' } },
  { id: 'knight', deg: 220.5, z: -0.2, look: { head: 'helm', body: 'armor' }, recolor: { A: '#b8bccc', a: '#7a7e90', Q: '#c83a3a', P: '#5a5e70', B: '#3a3e4a' } },
  { id: 'mayor', deg: 238, z: -0.4, look: { head: 'short' }, recolor: { H: '#d8d8d8', J: '#3a2a6a', j: '#6a4ab0', P: '#2a2a3a' } },
  { id: 'merchant', deg: 247, z: 0.0, look: { head: 'hat' }, recolor: { T: '#c83a3a', H: '#3a2a1a', J: '#e8a040', j: '#b07020', P: '#4a3a2a' } },
  { id: 'kid2', deg: 253, z: 0.3, scale: 0.85, wander: 3, speed: 0.6, look: { head: 'long', body: 'dress' }, recolor: { H: '#3a2010', J: '#ff7ab0', j: '#c04a80' } },
  { id: 'stargazer', deg: 296, z: -0.5, look: { head: 'long', body: 'dress' }, recolor: { H: '#e8e0f0', J: '#2a3a7a', j: '#1a2450' } },
  { id: 'wanderer', deg: 341, z: 0.1, wander: 5, speed: 0.25, look: { head: 'short' }, recolor: { H: '#2a2a2a', J: '#4a6a5a', j: '#2a4a3a', P: '#3a3a3a' } },
];

const WIN = '#ffc06a';

export function buildSettlements({ kitAt, place, sprite, rand, content, station }) {
  const T = (name, w, h, recolor) => tileTexture(name, w / 1.6, h / 1.6, recolor);
  const WALLS = [
    { tile: 'plaster_timber', recolor: null },
    { tile: 'plaster_timber', recolor: { F: '#f2d8b8', l: '#d8b890' } },
    { tile: 'plaster_timber', recolor: { F: '#d8e0f0', l: '#b8c0d8', t: '#3a3050' } },
    { tile: 'stone_block', recolor: null },
  ];
  const ROOFS = ['roof_red', 'roof_slate', 'thatch'];

  // ---------- building blocks
  const windowPane = (k, x, y, z) => k.box(0.7, 0.75, 0.06, k.glowMat(WIN, 2.4), x, y, z);
  const cottage = (deg, z, { w = 3.6, h = 2.6, d = 2.6, wall = WALLS[Math.floor(rand() * 3)], roof = ROOFS[Math.floor(rand() * 3)] } = {}) => {
    const k = kitAt(deg, z);
    k.box(w, h, d, k.mat({ map: T(wall.tile, w, h, wall.recolor) }), 0, h / 2, 0).castShadow = true;
    k.gableRoof(0, h, 0, w, d, { tile: roof, height: 1.7 });
    windowPane(k, -w * 0.28, h * 0.6, d / 2 + 0.02);
    windowPane(k, w * 0.28, h * 0.6, d / 2 + 0.02);
    k.box(0.7, 1.3, 0.06, k.mat({ color: '#4a3020' }), 0, 0.65, d / 2 + 0.02);
    return k;
  };
  const townhouse = (deg, z, { w = 3.2, floors = 2 + Math.floor(rand() * 2), d = 2.6 } = {}) => {
    const k = kitAt(deg, z);
    const wall = WALLS[Math.floor(rand() * WALLS.length)];
    const h = floors * 2.2;
    k.box(w, h, d, k.mat({ map: T(wall.tile, w, h, wall.recolor) }), 0, h / 2, 0).castShadow = true;
    k.gableRoof(0, h, 0, w, d, { tile: rand() < 0.5 ? 'roof_red' : 'roof_slate', height: 1.6 });
    for (let f = 0; f < floors; f++) for (const x of [-w * 0.27, w * 0.27]) {
      if (f === 0 && x > 0) continue;
      if (rand() < 0.8) windowPane(k, x, 1.2 + f * 2.2, d / 2 + 0.02);
    }
    k.box(0.7, 1.4, 0.06, k.mat({ color: '#3a2418' }), w * 0.25, 0.7, d / 2 + 0.02);
    return k;
  };
  const lampPost = (deg, z) => kitAt(deg, z).lamp(0, 0, { color: '#ffb85a', h: 2.6, pole: '#2a2228' });
  const signpost = (deg, z, text) => {
    const k = kitAt(deg, z);
    k.box(0.14, 1.5, 0.14, k.mat({ color: '#5a4030' }), 0, 0.75, 0);
    k.sign(text, { style: 'wood', x: 0, y: 1.55, z: 0.1, scale: 0.04, light: false });
  };

  // ---------- DAWNVALE: a little village right after home
  cottage(29.5, -3.4);
  cottage(37.5, -4.0, { w: 4.2 });
  cottage(48.5, -3.2, { w: 3.2 });
  {
    const k = kitAt(34, -1.7); // well
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.8, 10), k.flat('#8a8ea0'));
    ring.position.y = 0.4; k.add(ring);
    k.box(0.1, 1.5, 0.1, k.flat('#5a4030'), -0.6, 1.05, 0); k.box(0.1, 1.5, 0.1, k.flat('#5a4030'), 0.6, 1.05, 0);
    k.gableRoof(0, 1.8, 0, 1.4, 1.2, { tile: 'thatch', height: 0.6, overhang: 0.2 });
  }
  {
    const k = kitAt(43, -1.6); // fence + flowerbed
    for (let i = 0; i < 5; i++) k.box(0.12, 0.7, 0.12, k.flat('#7a5a40'), -1.6 + i * 0.8, 0.35, 0);
    k.box(3.4, 0.08, 0.08, k.flat('#7a5a40'), 0, 0.55, 0.02);
  }
  lampPost(51, -1.2);
  signpost(27.5, 0.9, 'DAWNVALE');

  // ---------- MILLBROOK: windmill hamlet among the fields
  {
    const k = kitAt(87, -4.6);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.6, 6.5, 8), k.mat({ map: T('plaster_timber', 6, 6.5, { F: '#efe6d4' }) }));
    tower.position.y = 3.25; tower.castShadow = true; k.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.6, 8), k.mat({ map: T('thatch', 3, 2) }));
    cap.position.y = 7.3; k.add(cap);
    windowPane(k, 0, 3.6, 1.32);
    const hub = new THREE.Group(); hub.position.set(0, 6.0, 1.5); k.add(hub);
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Group(); arm.rotation.z = (i * Math.PI) / 2; hub.add(arm);
      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.2, 0.08), k.flat('#5a4030')); spar.position.y = 2.1; arm.add(spar);
      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.2, 0.04), k.flat('#f0e8d8')); sail.position.set(0.5, 2.5, 0); arm.add(sail);
    }
    k.onUpdate((t) => { hub.rotation.z = -t * 0.6; });
  }
  for (const [deg, z] of [[80, -2.6], [94, -2.8]]) {
    const k = kitAt(deg, z); // haystacks
    const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 1.2, 10), k.flat('#e8c060')); hay.position.y = 0.6; k.add(hay);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.7, 10), k.flat('#d8b050')); top.position.y = 1.55; k.add(top);
  }
  for (let deg = 78; deg <= 98; deg += 1.6) {
    if (Math.abs(deg - 87) < 3) continue;
    const k = kitAt(deg, -1.6); // crop rows
    for (let i = 0; i < 3; i++) k.box(0.5, 0.35 + rand() * 0.2, 0.3, k.flat(rand() < 0.3 ? '#e8c060' : '#4f9e4f'), 0, 0.2, -i * 0.7);
  }
  {
    const k = kitAt(97, -0.9); // scarecrow
    k.box(0.12, 2.0, 0.12, k.flat('#5a4030'), 0, 1.0, 0);
    k.box(1.4, 0.12, 0.12, k.flat('#5a4030'), 0, 1.5, 0);
    k.box(0.7, 0.8, 0.3, k.flat('#8a6a3a'), 0, 1.3, 0.05);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 8), k.flat('#e8c060')); hat.position.y = 2.2; k.add(hat);
  }
  signpost(77, 0.9, 'MILLBROOK');

  // ---------- roadside between the quests: a bard's rock and a traveler's camp
  { const k = kitAt(141.5, -0.9); const r = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), k.flat('#7a7e90')); r.position.y = 0.3; k.add(r); }
  {
    const k = kitAt(186, -2.6); // tent
    const tent = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 4), k.flat('#c86a3a')); tent.position.y = 0.9; tent.rotation.y = Math.PI / 4; k.add(tent);
    k.lantern(1.4, 0.5, 0.4, '#ffcf6b');
  }

  // ---------- DUSKHAVEN: a market town before the lighthouse
  {
    const k = kitAt(219, -0.8); // town gate
    const stone = k.mat({ map: T('stone_block', 1, 5) });
    k.box(0.9, 5, 0.9, stone, -2.4, 2.5, 0).castShadow = true;
    k.box(0.9, 5, 0.9, stone, 2.4, 2.5, 0).castShadow = true;
    k.box(5.8, 0.8, 1.0, k.mat({ map: T('stone_block', 5.8, 0.8) }), 0, 5.2, 0);
    k.sign('DUSKHAVEN', { style: 'wood', x: 0, y: 5.2, z: 0.52, scale: 0.05, light: false });
    for (const x of [-2.4, 2.4]) k.box(0.5, 1.6, 0.04, k.mat({ color: '#8a1a24' }), x, 3.6, 0.47);
  }
  for (const [deg, z] of [[223.5, -3.6], [229, -4.2], [243.5, -3.8], [249, -4.4], [254.5, -3.6]]) townhouse(deg, z);
  {
    const k = kitAt(236, -4.6); // clock tower / chapel
    const wall = k.mat({ map: T('stone_block', 2.6, 10) });
    k.box(2.6, 10, 2.6, wall, 0, 5, 0).castShadow = true;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), k.glowMat('#ffe6a0', 1.6)); face.position.set(0, 8, 1.32); k.add(face);
    const hand = k.box(0.08, 0.6, 0.04, k.mat({ color: '#2a1e18' }), 0, 8, 1.36);
    hand.geometry.translate(0, 0.3, 0); hand.position.y = 8;
    k.onUpdate((t) => { hand.rotation.z = -t * 0.2; });
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.9, 4, 4), k.mat({ map: T('roof_slate', 4, 4) })); spire.position.y = 12; spire.rotation.y = Math.PI / 4; k.add(spire);
    windowPane(k, 0, 4.5, 1.32);
  }
  for (const [deg, a, b] of [[232.5, '#d8343c', '#f2e6c4'], [247, '#2a6a8a', '#f2e6c4']]) {
    const k = kitAt(deg, -1.9); // market stalls
    k.box(2.4, 0.9, 1.0, k.flat('#7a5030'), 0, 0.45, 0);
    for (const x of [-1.1, 1.1]) k.box(0.1, 2.2, 0.1, k.flat('#5a4030'), x, 1.1, 0.45);
    k.awning(0, 2.2, -0.2, 2.6, a, b);
    for (let i = 0; i < 4; i++) k.box(0.3, 0.25, 0.3, k.flat(['#e8c060', '#d8343c', '#4f9e4f', '#ff8a2a'][i]), -0.8 + i * 0.55, 1.02, 0.1);
  }
  for (const deg of [226.5, 240.5, 257]) lampPost(deg, -1.3);

  // ---------- LANTERNREACH: a quiet night village with paper lanterns
  cottage(283, -3.4, { roof: 'roof_slate' });
  cottage(290.5, -4.0, { w: 4.2, roof: 'thatch' });
  cottage(303.5, -3.3, { w: 3.2, roof: 'roof_red' });
  for (let deg = 282; deg <= 305; deg += 2.6) {
    const k = kitAt(deg, -1.4);
    k.box(0.08, 2.2, 0.08, k.flat('#2a2228'), 0, 1.1, 0);
    k.lantern(0, 2.3, 0, ['#ff4a3a', '#ffcf6b', '#ff8ad8'][Math.round(deg) % 3]);
  }
  {
    const k = kitAt(298, -0.9); // telescope
    for (const r of [-0.4, 0.4, 0]) { const leg = k.box(0.06, 1.2, 0.06, k.flat('#5a4030'), r, 0.6, r === 0 ? -0.35 : 0.2); leg.rotation.z = -r * 0.5; }
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 8), k.flat('#c9a24a')); tube.position.set(0, 1.35, 0); tube.rotation.z = -0.9; k.add(tube);
  }
  signpost(280.5, 0.9, 'LANTERNREACH');

  // ---------- OLD RUINS before dawn
  {
    for (const [deg, h] of [[333, 3.4], [336.5, 1.6], [347, 4.2], [350.5, 2.2]]) kitAt(deg, -3.2).column(0, 0, h, '#b8b4c8');
    const k = kitAt(341.5, -4.2);
    const stone = k.mat({ map: T('stone_block', 1, 5) });
    k.box(0.9, 5, 0.9, stone, -2, 2.5, 0); k.box(0.9, 3.4, 0.9, stone, 2, 1.7, 0);
    k.box(3.2, 0.7, 1.0, k.mat({ map: T('stone_block', 3, 1) }), -0.6, 5.2, 0);
    signpost(331.5, 0.9, 'OLD RUINS');
  }

  // ---------- people
  const byId = Object.fromEntries((content.villagers || []).map((v) => [v.id, v]));
  const fill = (s) => s.replaceAll('{name}', content.name);
  const npcs = [];
  for (const f of FOLK) {
    const talk = byId[f.id];
    if (!talk) continue;
    const holder = place(f.deg, f.z);
    let s;
    if (f.wizard) {
      s = sprite(holder, { frames: WIZARD_IDLE, scale: 1.25, fps: 4, glowChars: 'CY', glow: 2, recolor: f.recolor });
    } else {
      const frames = f.cat ? CAT : villagerFrames(f.look);
      s = sprite(holder, { frames: frames.idle, scale: (f.cat ? 1.1 : 1.2) * (f.scale || 1), fps: 2, recolor: f.recolor });
      s.addSheet('walk', frames.walk);
    }
    const st = station({
      kind: 'npc', deg: f.deg, name: talk.name, label: talk.name, lines: talk.lines.map(fill),
      color: '#9ad8ff', holder, anchor: new THREE.Vector3(0, s.height + 0.9, 0), radius: 3,
    });
    npcs.push({ f, s, pivot: holder.parent, st, phase: rand() * 10, last: f.deg });
  }

  const DEG = Math.PI / 180;
  return {
    spans: SETTLEMENTS,
    update(t) {
      for (const n of npcs) {
        if (!n.f.wander) continue;
        // stroll back and forth, pausing at each end
        const p = Math.max(-1, Math.min(1, Math.sin(t * n.f.speed + n.phase) * 1.5));
        const deg = n.f.deg + p * n.f.wander;
        const v = deg - n.last;
        n.last = deg;
        n.pivot.rotation.z = -deg * DEG;
        n.st.deg = deg;
        const moving = Math.abs(v) > 0.002;
        n.s.play(moving ? 'walk' : 'default');
        n.s.setFps(moving ? 6 : 2);
        if (moving) n.s.mesh.scale.x = v > 0 ? 1 : -1;
      }
    },
  };
}
