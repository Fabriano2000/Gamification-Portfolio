// Environment presets. Each one sets atmosphere, lighting, UI colors, post-FX, the project "station"
// sprite and NPC, then builds its scenery with the shared kit.
import * as THREE from 'three';
import {
  TERMINAL, NOTICE_BOARD, RUNESTONE, PEDESTAL, KIOSK, VENDING, DESK, BOT_IDLE, WIZARD_IDLE,
  paintingTexture, tileTexture,
} from '../pixel.js';
import { FACADE_Z } from './kit.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- CYBERPUNK
const cyberpunk = {
  id: 'cyberpunk', label: 'Cyberpunk City', zone: 'QUEST BOARD', seed: 4242,
  background: '#07041a', fog: { color: '#2a0f52', density: 0.022 },
  post: { bloom: 1.4, threshold: 0.6, vignette: 0.65, chroma: true },
  ui: { cyan: '#00f0ff', pink: '#ff2a6d', yellow: '#ffe14d', panel: 'rgba(11,6,32,.92)', line: '#3b1f6b', muted: '#8f86c9', text: '#e8e6ff', bg: '#07041a' },
  particles: 'rain',
  station: { frames: TERMINAL, scale: 1.4, glowChars: 'VvJY', glow: 2.6, colors: ['#ff2a6d', '#00f0ff', '#ffe14d'], light: true, beam: true },
  npc: { name: 'GUIDE-BOT', frames: BOT_IDLE, scale: 1.2, glowChars: 'VY' },
  intro: (c) => ['Welcome to Neo-Portfolio City, traveler.', `This is the Quest Board. Each terminal holds one of ${c.name}'s projects.`],
  build(k) {
    k.ambient({ sky: '#4a2a8a', ground: '#0d0221', intensity: 0.9 });
    k.keyLight({ color: '#9fb4ff', intensity: 0.9 });
    k.fill('#ff9ad5', 0.35);
    k.sky({ bands: ['#07041a', '#0d0729', '#140a38', '#1d0c45', '#2a0f52', '#3a115a', '#4d135f', '#621463'], stars: 140, body: { x: 170, y: 22, r: 7, color: '#f4e9ff' } });
    k.skyline({ z: -60, count: 60, spread: 130, hMin: 24, hMax: 52, wMin: 6, wMax: 12, color: '#2a1450', windows: { litChance: 0.12, litColors: ['#ff7ad9'] }, emissive: 1.6, beacons: '#ff2a6d' });
    k.skyline({ z: -25, count: 40, spread: 70, hMin: 12, hMax: 28, wMin: 4, wMax: 8, color: '#1d0b3a', windows: { litChance: 0.22, litColors: ['#00f0ff'] }, emissive: 1.4, beacons: '#ff2a6d' });
    k.ground({ tile: 'street_wet', reflect: true, opacity: 0.72, roughness: 0.35, metalness: 0.3, back: 'metal_panel', curb: { color: '#3b1f6b', glow: '#ff2a6d' } });
    k.facades({ hMin: 5, hMax: 11.4, colors: ['#2a1450', '#241046', '#1f0d40', '#2c1552'], emissive: 1.25, roof: { kind: 'flat', color: '#3b1f6b' } });
    k.sign('QUEST BOARD', { color: '#ffe14d', x: 0, y: 6.4, z: -6, scale: 0.075, flicker: true, intensity: 3.2 });
    k.sign('BAR', { color: '#ff2a6d', x: -10.5, y: 4.6, z: -6, scale: 0.065, vertical: true, flicker: true, intensity: 3.2 });
    k.sign('24H', { color: '#00f0ff', x: 9.5, y: 5.4, z: -6, scale: 0.065, flicker: true, intensity: 3.2 });
    k.sign('DATA', { color: '#ff7ad9', x: 14.5, y: 4.0, z: -6, scale: 0.06, vertical: true, light: false, intensity: 3.2 });
    // foreground silhouettes
    const ink = '#05020f';
    const poles = [-14, 7, 21];
    poles.forEach((x) => k.box(0.45, 14, 0.45, k.mat({ color: ink }), x, 7, 4.6));
    for (let i = 0; i < poles.length - 1; i++) {
      k.cable(V3(poles[i], 10.5, 4.6), V3(poles[i + 1], 10.9, 4.6), 1.6, ink, 0.06);
      k.cable(V3(poles[i], 9.2, 4.6), V3(poles[i + 1], 9.6, 4.6), 2.2, ink, 0.06);
    }
    k.box(2.6, 1.4, 1.2, k.mat({ color: ink }), -19, 0.7, 4.2);
    k.box(2.6, 1.1, 1.2, k.mat({ color: ink }), 16, 0.55, 4.2);
    k.railing(5.4, ink);
  },
};

// ---------------------------------------------------------------- FANTASY TOWN
const fantasyTown = {
  id: 'fantasy-town', label: 'Fantasy Town', zone: 'GUILD SQUARE', seed: 777,
  background: '#e8a070', fog: { color: '#d89a7a', density: 0.008 },
  post: { bloom: 0.9, threshold: 0.75, vignette: 0.55, chroma: false },
  ui: { cyan: '#f0c04a', pink: '#8a1a24', yellow: '#ffe6b0', panel: 'rgba(40,24,16,.94)', line: '#7a5a3a', muted: '#c8b090', text: '#f6ecd6', bg: '#1a120c' },
  particles: 'leaves',
  playerRecolor: { J: '#3f8a4a', j: '#2a5a32', V: '#5e3b1e', H: '#6a4a2a', h: '#8a6a3a', P: '#4a3a2a' },
  station: { frames: NOTICE_BOARD, scale: 1.3, glowChars: '', glow: 0, colors: ['#d8343c', '#3a7bd5', '#f0c04a'], light: true, lightColor: '#ffb85a' },
  npc: { name: 'OLD SAGE', frames: WIZARD_IDLE, scale: 1.2, glowChars: 'CY' },
  intro: (c) => ['Ah, a new adventurer! Welcome to the Guild Square.', `${c.name}'s quests are pinned to the notice boards. Read them all!`],
  build(k, { rand }) {
    k.ambient({ sky: '#ffd6a8', ground: '#5a3a4a', intensity: 0.95 });
    k.keyLight({ color: '#ffcc88', intensity: 2.2, offset: [-16, 10, 10] });
    k.fill('#8aa0ff', 0.3);
    k.sky({ bands: ['#3a4a8a', '#5a5a9a', '#8a6a9a', '#c87a7a', '#f09a6a', '#ffc07a', '#ffd89a', '#ffe6b0'], body: { x: 190, y: 92, r: 10, color: '#fff2c0', halo: '#ffd89a' }, clouds: { color: '#ffd0b0', shade: '#e89a8a', count: 14 } });
    // far hills + castle
    k.ridge(-70, '#8a6a9a', { min: 6, max: 16, step: 16, jag: 0.12 });
    const castle = k.mat({ color: '#7a6a9a' });
    k.box(10, 16, 4, castle, 24, 8 + 8, -58);
    for (const [x, h] of [[17, 26], [31, 24], [24, 32]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, h, 8), castle);
      t.position.set(x, h / 2 + 8, -57); k.add(t);
      const r = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5, 8), k.mat({ color: '#9a5a7a' }));
      r.position.set(x, h + 10.5, -57); k.add(r);
    }
    k.ridge(-30, '#6a8a5a', { min: 2, max: 6, step: 12, jag: 0.1 });
    for (let x = -60; x < 60; x += 4 + rand() * 4) k.roundTree(x, -22 - rand() * 4, 3 + rand() * 2, '#4a8a4a');
    // street
    k.ground({ tile: 'cobble', roughness: 0.85, back: 'plank', curb: { color: '#6a5a4a' } });
    k.facades({
      hMin: 4.8, hMax: 8, wMin: 4.2, wMax: 7, colors: ['#ffffff', '#fff0e0', '#ffe8d0', '#f0e8ff'], emissive: 0.9,
      windows: { wall: 'plaster_timber', style: 'arched', litChance: 0.55, litColors: ['#ffcf6b', '#ffb85a'], unlit: '#3a2a3a', frame: '#5e3b1e', shutters: '#3a6a8a' },
      roof: { kind: 'gable', tiles: ['roof_red', 'roof_slate', 'thatch'], height: 2.4 },
      awnings: [['#d8343c', '#f2e6c4'], ['#2a6a8a', '#f2e6c4']],
    });
    k.sign('GUILD HALL', { style: 'wood', x: 0, y: 6.0, z: -6.0, scale: 0.08, light: false });
    k.sign('INN', { style: 'wood', x: -10.5, y: 4.4, z: -5.2, scale: 0.07, light: false });
    k.sign('SMITH', { style: 'wood', x: 11, y: 4.4, z: -5.2, scale: 0.06, light: false });
    // street furniture
    [-9, 3, 13].forEach((x) => k.lamp(x, -2.3, { color: '#ffb85a', pole: '#2a1e18' }));
    [[-15, -4.6], [-14.2, -4.4], [6, -4.6], [17, -4.5]].forEach(([x, z]) => k.barrel(x, z));
    [[-4, -4.7], [8.4, -4.8], [9.2, -4.6]].forEach(([x, z]) => k.crate(x, z, 0.8));
    // foreground
    k.fence(5.2, '#3a2418');
    k.roundTree(-21, 5.5, 7, '#3a6a3a', '#3a2418');
    k.roundTree(19, 5.8, 8, '#3a6a3a', '#3a2418');
  },
};

// ---------------------------------------------------------------- FANTASY WORLD
const fantasyWorld = {
  id: 'fantasy-world', label: 'Fantasy World', zone: 'ANCIENT RUINS', seed: 99,
  background: '#8ac8ff', fog: { color: '#b8dcff', density: 0.0055 },
  post: { bloom: 0.7, threshold: 0.8, vignette: 0.45, chroma: false },
  ui: { cyan: '#7ed6a0', pink: '#2a6a8a', yellow: '#f0c04a', panel: 'rgba(14,30,26,.93)', line: '#2f5a48', muted: '#9ec8b0', text: '#eef8f0', bg: '#0e1e1a' },
  particles: 'pollen',
  playerRecolor: { J: '#2a6a8a', j: '#1d3f5a', V: '#f0c04a', H: '#5e3b1e', h: '#8a6a3a', P: '#4a3a2a' },
  station: { frames: RUNESTONE, scale: 1.4, glowChars: 'I', glow: 2.8, colors: ['#c07bff', '#2ac4b0', '#f0c04a'], light: true, beam: true },
  npc: { name: 'WANDERER', frames: WIZARD_IDLE, scale: 1.2, glowChars: 'CY', recolor: { X: '#3f8a4a', x: '#2a5a32' } },
  intro: (c) => ['The old runestones hum when someone worthy walks by.', `Each one remembers a deed of ${c.name}. Touch them to listen.`],
  build(k, { rand }) {
    k.ambient({ sky: '#cfe8ff', ground: '#4a6a3a', intensity: 1.1 });
    k.keyLight({ color: '#fff2d8', intensity: 2.4, offset: [10, 20, 12] });
    k.fill('#ffffff', 0.3);
    k.sky({ bands: ['#3a7ad8', '#4a8ae0', '#5a9ae8', '#6aaaf0', '#7ebaf4', '#92c8f8', '#a8d6fa', '#c4e4fc'], body: { x: 60, y: 25, r: 8, color: '#fffbe0', halo: '#e8f4ff' }, clouds: { color: '#ffffff', shade: '#d0e0f0', count: 18 } });
    k.ridge(-80, '#8a9ac8', { min: 22, max: 46, step: 18, jag: 0.35, snow: '#f4f8ff' });
    // floating islands
    for (const [x, y, s] of [[-40, 24, 1.2], [-6, 30, 0.8], [30, 22, 1.4], [60, 28, 1]]) {
      const isl = new THREE.Group();
      const rock = new THREE.Mesh(new THREE.ConeGeometry(4 * s, 6 * s, 7), k.flat('#8a7a6a'));
      rock.rotation.x = Math.PI; isl.add(rock);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(4.1 * s, 4 * s, 0.8 * s, 7), k.flat('#5aae5a'));
      top.position.y = 3.2 * s; isl.add(top);
      for (let i = 0; i < 3; i++) {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 3 * s, 6), k.flat('#2a6a3a'));
        c.position.set((i - 1) * 1.6 * s, 5 * s, (rand() - 0.5) * 2); isl.add(c);
      }
      isl.position.set(x, y, -45);
      k.add(isl);
      const ph = rand() * 6;
      k.onUpdate((t) => { isl.position.y = y + Math.sin(t * 0.4 + ph) * 0.8; });
    }
    k.ridge(-32, '#5a9a5a', { min: 4, max: 10, step: 10, jag: 0.1 });
    for (let x = -60; x < 60; x += 2.5 + rand() * 3) k.pine(x, -14 - rand() * 8, 4 + rand() * 4, rand() < 0.5 ? '#2a6a3a' : '#3a7a4a');
    // ground: grass with a dirt path along the playfield
    k.ground({ tile: 'grass', roughness: 1 });
    const path = k.plane(96, 3.2, k.mat({ map: tileTexture('dirt_path', 60, 2) }), 0, 0.01, 0);
    path.rotation.x = -Math.PI / 2; path.receiveShadow = true;
    // ruins: a stone arch behind the stones + broken columns
    const stone = k.mat({ map: tileTexture('stone_block', 1, 4) });
    k.box(1.4, 7, 1.4, stone, -5, 3.5, -6).castShadow = true;
    k.box(1.4, 7, 1.4, stone, 5, 3.5, -6).castShadow = true;
    k.box(12, 1.4, 1.6, k.mat({ map: tileTexture('stone_block', 7, 1) }), 0, 7.6, -6).castShadow = true;
    [[-13, 3], [-11, 1.6], [12, 4.2], [15, 2]].forEach(([x, h]) => k.column(x, -5.6, h, '#c8c4b8'));
    k.sign('RUINS OF WORK', { style: 'wood', x: 0, y: 7.6, z: -5.15, scale: 0.06, light: false });
    // big tree + rocks
    k.roundTree(-20, -8, 12, '#4a9a4a');
    for (let i = 0; i < 8; i++) {
      const r = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 + rand() * 0.6, 0), k.flat('#8a8f9a'));
      r.position.set(-24 + rand() * 48, 0.3, -3 - rand() * 3); r.castShadow = true; k.add(r);
    }
    // foreground: trunks + bushes
    k.roundTree(-17, 5.6, 9, '#2f6a3a');
    k.pine(14, 5.4, 10, '#245a30');
    k.pine(24, 5.8, 8, '#245a30');
    for (let x = -30; x < 30; x += 3 + rand() * 4) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + rand() * 0.5, 0), k.flat('#3a7a3a'));
      b.position.set(x, 0.5, 4.8 + rand()); k.add(b);
    }
  },
};

// ---------------------------------------------------------------- MUSEUM
const museum = {
  id: 'museum', label: 'Museum / Exhibition', zone: 'HALL OF PROJECTS', seed: 314,
  background: '#120e0a', fog: { color: '#1a140e', density: 0.012 },
  post: { bloom: 0.8, threshold: 0.75, vignette: 0.6, chroma: false },
  ui: { cyan: '#c9a24a', pink: '#5a1a1a', yellow: '#f2e6c4', panel: 'rgba(16,12,8,.94)', line: '#5a4a2a', muted: '#b0a080', text: '#f6f0e4', bg: '#0e0a06' },
  particles: 'dust',
  station: { frames: PEDESTAL, scale: 1.3, glowChars: 'C', glow: 0.4, colors: ['#c9a24a', '#d8343c', '#3a7bd5'], spot: true },
  npc: { name: 'CURATOR-BOT', frames: BOT_IDLE, scale: 1.2, glowChars: 'VY', recolor: { G: '#c9a24a', g: '#8a6a2a', V: '#ffe6b0', Y: '#ffffff' } },
  intro: (c) => [`Welcome to the ${c.name} retrospective.`, 'Each pedestal holds a project. Step up to read its placard.'],
  build(k, { rand }) {
    k.ambient({ sky: '#fff0d8', ground: '#2a2018', intensity: 0.55 });
    k.keyLight({ color: '#fff4e0', intensity: 0.9, offset: [2, 22, 8] });
    k.fill('#ffd8a8', 0.3);
    // back wall
    const wallTex = tileTexture('stone_block', 96 / 1.6, 14 / 1.6, { A: '#d8ccb4', a: '#a89878', f: '#efe6d4', G: '#c8b89c' });
    k.box(96, 14, 1, k.mat({ map: wallTex }), 0, 7, -7.5).receiveShadow = true;
    k.box(96, 0.5, 1.4, k.mat({ color: '#c9a24a', metalness: 0.6, roughness: 0.4 }), 0, 12, -7.2);
    k.box(96, 0.6, 1.2, k.mat({ color: '#3a2418' }), 0, 0.3, -7.0);
    // paintings with gold frames, between columns
    const kinds = ['landscape', 'portrait', 'abstract'];
    let i = 0;
    for (let x = -40; x <= 40; x += 8) {
      k.column(x, -6.4, 12, '#efe6d4');
      const px = x + 4;
      if (px > 40) continue;
      const big = Math.abs(px) < 6;
      const w = big ? 4.8 : 3.6, h = w * 0.75;
      k.box(w + 0.4, h + 0.4, 0.2, k.mat({ color: '#c9a24a', metalness: 0.7, roughness: 0.35 }), px, 5.6, -6.9);
      k.plane(w, h, k.texMat(paintingTexture(rand, kinds[i++ % 3]), 0.35), px, 5.6, -6.78);
      k.sign(`NO. ${String(i).padStart(2, '0')}`, { style: 'plaque', x: px, y: 3.5, z: -6.85, scale: 0.035, light: false });
    }
    k.sign('HALL OF PROJECTS', { style: 'plaque', x: 0, y: 9.4, z: -6.85, scale: 0.08, light: false });
    // hanging banners
    for (const x of [-12, 12]) k.box(1.4, 4, 0.08, k.mat({ color: '#8a1a24' }), x, 9, -6.6);
    // floor: polished marble with reflections
    k.ground({ tile: 'marble', reflect: true, opacity: 0.82, roughness: 0.2, metalness: 0.1, back: 'parquet', backHeight: 0.05 });
    // benches + a sculpture
    [-16, 16].forEach((x) => { k.box(3, 0.2, 0.8, k.mat({ color: '#3a2418' }), x, 0.6, -3.6); k.box(0.2, 0.6, 0.8, k.mat({ color: '#1a120c' }), x - 1.3, 0.3, -3.6); k.box(0.2, 0.6, 0.8, k.mat({ color: '#1a120c' }), x + 1.3, 0.3, -3.6); });
    k.box(1.2, 1.4, 1.2, k.flat('#efe6d4'), -21, 0.7, -3.5);
    const bust = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), k.flat('#f4f0e8'));
    bust.position.set(-21, 2.0, -3.5); bust.castShadow = true; k.add(bust);
    // velvet ropes in front of the walkway
    const brass = k.mat({ color: '#c9a24a', metalness: 0.7, roughness: 0.3 });
    const posts = [];
    for (let x = -24; x <= 24; x += 4) { k.box(0.14, 1.0, 0.14, brass, x, 0.5, 1.8); k.box(0.3, 0.06, 0.3, brass, x, 0.03, 1.8); posts.push(x); }
    for (let j = 0; j < posts.length - 1; j++) k.cable(V3(posts[j], 0.95, 1.8), V3(posts[j + 1], 0.95, 1.8), 0.25, '#8a1a24', 0.05);
    // foreground columns (blurred by DOF)
    [-14, 10, 22].forEach((x) => k.column(x, 4.8, 14, '#4a3a2a'));
  },
};

// ---------------------------------------------------------------- MODERN CITY
const modernCity = {
  id: 'modern-city', label: 'Modern City', zone: 'PORTFOLIO PLAZA', seed: 2024,
  background: '#9ac8f0', fog: { color: '#c8dcf0', density: 0.007 },
  post: { bloom: 0.5, threshold: 0.85, vignette: 0.4, chroma: false },
  ui: { cyan: '#3a7bd5', pink: '#ff8a2a', yellow: '#ffd34a', panel: 'rgba(14,22,36,.92)', line: '#2a3a5a', muted: '#9ab0cc', text: '#eef4fb', bg: '#0b1220' },
  particles: null,
  station: { frames: KIOSK, scale: 1.3, glowChars: 'ZX', glow: 1.4, colors: ['#3a7bd5', '#2ac4b0', '#ff8a2a'], light: false },
  npc: { name: 'CITY-BOT', frames: BOT_IDLE, scale: 1.2, glowChars: 'VY', recolor: { G: '#eef0f4', g: '#9aa0ae', V: '#3a7bd5', Y: '#ff8a2a' } },
  intro: (c) => ['Welcome to Portfolio Plaza!', `Tap any info kiosk to see what ${c.name} has been building.`],
  build(k, { rand }) {
    k.ambient({ sky: '#dfeeff', ground: '#4a4a52', intensity: 1.0 });
    k.keyLight({ color: '#fff0dc', intensity: 2.2, offset: [12, 18, 12] });
    k.fill('#ffffff', 0.3);
    k.sky({ bands: ['#2f6fc8', '#3f7fd0', '#5090d8', '#64a2e0', '#7ab4e8', '#90c4ee', '#a8d2f2', '#c6e2f6'], body: { x: 210, y: 30, r: 7, color: '#fffbe8', halo: '#eef6ff' }, clouds: { color: '#ffffff', shade: '#d8e4f0', count: 10 } });
    k.skyline({ z: -62, count: 50, spread: 130, hMin: 30, hMax: 70, wMin: 6, wMax: 12, color: '#b8cce4', windows: { wall: 'glass_curtain', style: 'none' }, emissive: 0.05 });
    k.skyline({ z: -28, count: 36, spread: 70, hMin: 14, hMax: 34, wMin: 5, wMax: 9, color: '#e0e4ec', windows: { wall: 'concrete', style: 'bands', litChance: 0.3, litColors: ['#bcd8f0', '#9ac0e0'], unlit: '#5a7a9a', frame: '#4a5a6a' }, emissive: 0.15 });
    // sidewalk is the playfield; road in front
    k.ground({ tile: 'jp_tile', roughness: 0.8, back: 'concrete' });
    const road = k.plane(96, 6, k.mat({ map: tileTexture('asphalt', 60, 3.75), roughness: 0.9 }), 0, 0.02, 4.4);
    road.rotation.x = -Math.PI / 2; road.receiveShadow = true;
    k.box(96, 0.2, 0.3, k.mat({ color: '#b8bcc6' }), 0, 0.1, 1.3);
    for (let x = -48; x < 48; x += 3) { const d = k.plane(1.4, 0.15, k.mat({ color: '#f4f4f4' }), x, 0.03, 4.4); d.rotation.x = -Math.PI / 2; }
    k.facades({
      hMin: 6.4, hMax: 12.8, wMin: 4.2, wMax: 8.4, colors: ['#ffffff', '#e8e0d8', '#d8e0e8', '#f0e6dc'], emissive: 0.2,
      windows: { wall: 'concrete', style: 'grid', litChance: 0.15, litColors: ['#cfe6ff'], unlit: '#5a7a9a', frame: '#3a4a5a' },
      roof: { kind: 'flat', color: '#8a8f9a' }, awnings: [['#2a6a8a', '#ffffff'], ['#d8343c', '#ffffff'], ['#3f9a4f', '#ffffff']],
    });
    k.sign('PORTFOLIO PLAZA', { style: 'panel', color: '#1d3f7a', x: 0, y: 6.4, z: -6.0, scale: 0.075, light: false, intensity: 0.9 });
    k.sign('CAFE', { style: 'panel', color: '#8a1a24', x: -10.5, y: 4.4, z: -6.0, scale: 0.06, light: false, intensity: 0.9 });
    k.sign('TECH CO', { style: 'panel', color: '#2a6a8a', x: 11, y: 5.2, z: -6.0, scale: 0.06, light: false, intensity: 0.9 });
    [-10, 4, 15].forEach((x) => { k.box(1.2, 0.5, 1.2, k.mat({ color: '#8a8f9a' }), x, 0.25, -3.4); k.roundTree(x, -3.4, 4.5, '#4f9e4f'); });
    [-3, 10].forEach((x) => k.lamp(x, -2.2, { style: 'modern', color: '#fff6e0', pole: '#3a3f4a', light: false }));
    // bench + bus stop
    k.box(2.4, 0.15, 0.7, k.mat({ color: '#9a6a3a' }), -16, 0.55, -3.6);
    k.box(4, 0.1, 1.6, k.mat({ color: '#3a3f4a' }), 18, 3, -3.6);
    k.box(0.1, 3, 0.1, k.mat({ color: '#3a3f4a' }), 16.2, 1.5, -3.0); k.box(0.1, 3, 0.1, k.mat({ color: '#3a3f4a' }), 19.8, 1.5, -3.0);
    k.plane(3.6, 2.2, k.mat({ color: '#bcd8f0', transparent: true, opacity: 0.35 }), 18, 1.6, -4.3);
    // foreground: parked cars + traffic light
    const car = (x, color) => {
      k.box(4, 0.9, 1.8, k.flat(color), x, 0.75, 5.2).castShadow = true;
      k.box(2.2, 0.7, 1.6, k.flat('#2a3040'), x - 0.2, 1.5, 5.2);
      for (const dx of [-1.3, 1.3]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.9, 10), k.flat('#1a1a1a')); w.rotation.x = Math.PI / 2; w.position.set(x + dx, 0.38, 5.2); k.add(w); }
    };
    car(-17, '#d8343c'); car(6, '#eef0f4'); car(21, '#3a7bd5');
    k.box(0.2, 6, 0.2, k.mat({ color: '#2a2f3a' }), -6, 3, 2.0);
    k.box(0.5, 1.4, 0.4, k.mat({ color: '#2a2f3a' }), -6, 5.8, 2.0);
    k.box(0.25, 0.25, 0.1, k.glowMat('#3fdc6a', 3), -6, 5.4, 2.22);
  },
};

// ---------------------------------------------------------------- MODERN JAPANESE CITY
const japanCity = {
  id: 'japan-city', label: 'Modern Japanese City', zone: 'SHOTENGAI', seed: 1964,
  background: '#1a1430', fog: { color: '#3a2a4a', density: 0.02 },
  post: { bloom: 1.2, threshold: 0.62, vignette: 0.6, chroma: true },
  ui: { cyan: '#ff4a5a', pink: '#2a4a8a', yellow: '#ffe6b0', panel: 'rgba(20,14,28,.93)', line: '#4a3050', muted: '#c0a8c0', text: '#fff4f0', bg: '#140e1c' },
  particles: 'petals',
  station: { frames: VENDING, scale: 1.2, glowChars: 'Z', glow: 2.2, colors: ['#d8343c', '#3a7bd5', '#f0c04a'], light: true, lightColor: '#dff6ff' },
  npc: { name: 'SHOP-BOT', frames: BOT_IDLE, scale: 1.2, glowChars: 'VY', recolor: { G: '#f4f0ec', g: '#c8c0b8', V: '#d8343c', Y: '#f0c04a' } },
  intro: (c) => ['Irasshaimase! Welcome to the shopping street.', `Every vending machine here dispenses one of ${c.name}'s projects.`],
  build(k, { rand }) {
    k.ambient({ sky: '#8a7ab0', ground: '#1a1018', intensity: 0.85 });
    k.keyLight({ color: '#ffb0a0', intensity: 0.7, offset: [-10, 14, 12] });
    k.fill('#ffd0e0', 0.3);
    k.sky({ bands: ['#141a3a', '#1f2448', '#2e2c56', '#46355e', '#6a4064', '#9a5068', '#c8686a', '#e88a70'], stars: 40, clouds: { color: '#7a4a6a', shade: '#4a3050', count: 6 } });
    k.skyline({ z: -60, count: 60, spread: 130, hMin: 20, hMax: 46, wMin: 5, wMax: 10, color: '#2a2440', windows: { litChance: 0.2, litColors: ['#ffe6a0', '#ffffff'], unlit: '#1a1628', frame: '#2a2440', wall: 'concrete', wallRecolor: { f: '#3a3450', A: '#2a2440' } }, emissive: 1.0 });
    // red & white lattice tower
    for (let i = 0; i < 12; i++) {
      const w = 6 - i * 0.42;
      k.box(w, 3.4, w, k.mat({ color: i % 2 ? '#f4f0ec' : '#e8463a', emissive: i % 2 ? '#000000' : '#e8463a', emissiveIntensity: 0.4 }), -32, 1.7 + i * 3.4, -56);
    }
    k.box(0.4, 8, 0.4, k.mat({ color: '#f4f0ec' }), -32, 45, -56);
    k.skyline({ z: -26, count: 40, spread: 70, hMin: 10, hMax: 24, wMin: 4, wMax: 8, color: '#3a3048', windows: { style: 'bands', litChance: 0.4, litColors: ['#ffd8a0', '#bfe0ff'], unlit: '#2a2238', frame: '#3a3048', wall: 'jp_wall', wallRecolor: { f: '#4a4058', a: '#3a3048', A: '#3a3048' } }, emissive: 1.1 });
    k.ground({ tile: 'asphalt', reflect: true, opacity: 0.8, roughness: 0.4, metalness: 0.2, back: 'jp_tile' });
    k.facades({
      hMin: 6.4, hMax: 11.2, wMin: 4.2, wMax: 7, colors: ['#f4f0ec', '#e8e0d8', '#d8d0c8', '#c8c0b8'], emissive: 1.1,
      windows: { wall: 'jp_wall', style: 'grid', litChance: 0.55, litColors: ['#ffe6b0', '#ffd080', '#bfe0ff'], unlit: '#2a2a3a', frame: '#4a4a5a' },
      roof: { kind: 'flat', color: '#4a4a5a' }, awnings: [['#d8343c', '#ffffff'], ['#2a4a8a', '#ffffff'], ['#f0c04a', '#2a2a2a']],
    });
    const jp = { font: 'DotGothic16', px: 12, vertical: true, flicker: true, intensity: 3 };
    k.sign('ラーメン', { ...jp, color: '#ff4a5a', x: -10.6, y: 5.6, z: -5.9, scale: 0.06 });
    k.sign('カラオケ', { ...jp, color: '#ff7ad9', x: 9.6, y: 6, z: -5.9, scale: 0.06 });
    k.sign('居酒屋', { ...jp, color: '#ffb85a', x: -17, y: 5.2, z: -5.9, scale: 0.06, light: false });
    k.sign('ゲーム', { ...jp, color: '#00f0ff', x: 16.5, y: 5.4, z: -5.9, scale: 0.06, light: false });
    k.sign('しょうてんがい', { font: 'DotGothic16', px: 12, color: '#ffe6b0', x: 0, y: 6.6, z: -5.9, scale: 0.065, light: false, intensity: 2.6 });
    // paper lanterns strung across the street
    k.cable(V3(-24, 5.2, -3.2), V3(24, 5.2, -3.2), 0.8, '#2a2430', 0.03);
    for (let x = -22; x <= 22; x += 2.2) {
      const sag = 0.8 * (1 - (x / 24) ** 2);
      k.lantern(x, 4.75 - sag, -3.2, rand() < 0.3 ? '#ffe6b0' : '#ff4a3a', Math.abs(x) < 2);
    }
    // sakura
    k.roundTree(-21, -3.8, 6, '#f7b7cf', '#4a2e2a');
    k.roundTree(20, -3.8, 5.5, '#f7b7cf', '#4a2e2a');
    // foreground: utility poles + tangled cables
    const ink = '#120c18';
    const poles = [-15, 6, 22];
    poles.forEach((x) => { k.box(0.5, 14, 0.5, k.mat({ color: ink }), x, 7, 4.6); k.box(2.4, 0.15, 0.15, k.mat({ color: ink }), x, 11, 4.6); k.box(0.6, 0.9, 0.5, k.mat({ color: ink }), x + 0.5, 8, 4.6); });
    for (let i = 0; i < poles.length - 1; i++) for (const [h, s] of [[11, 1.2], [10.4, 1.8], [9.6, 2.4], [8.8, 1.5]]) k.cable(V3(poles[i] - 1 + (h % 2), h, 4.6), V3(poles[i + 1] + 1 - (h % 2), h + 0.2, 4.6), s, ink, 0.04);
  },
};

// ---------------------------------------------------------------- OFFICE
const office = {
  id: 'office', label: 'Office', zone: 'FLOOR 24', seed: 9001,
  background: '#bcd8f0', fog: { color: '#dce8f4', density: 0.004 },
  post: { bloom: 0.45, threshold: 0.88, vignette: 0.35, chroma: false },
  ui: { cyan: '#3a7bd5', pink: '#2ac4b0', yellow: '#ffd34a', panel: 'rgba(18,24,34,.93)', line: '#2e3a4e', muted: '#a0aec4', text: '#f0f4fa', bg: '#10161f' },
  particles: 'dust',
  playerRecolor: { J: '#3a7bd5', j: '#1d3f7a' },
  station: { frames: DESK, scale: 1.25, glowChars: 'ZX', glow: 1.4, colors: ['#3a7bd5', '#2ac4b0', '#ff8a2a'], light: false },
  npc: { name: 'RECRUIT-BOT', frames: BOT_IDLE, scale: 1.2, glowChars: 'VY', recolor: { G: '#c8ccd6', g: '#8a90a0', V: '#3a7bd5', Y: '#2ac4b0' } },
  intro: (c) => ['Welcome to Floor 24! Grab a coffee.', `Each workstation has one of ${c.name}'s projects open. Have a look.`],
  build(k, { rand }) {
    k.ambient({ sky: '#f0f4ff', ground: '#5a5a66', intensity: 1.1 });
    k.keyLight({ color: '#fff6ea', intensity: 1.6, offset: [6, 14, -16] }); // daylight from the windows
    k.fill('#ffffff', 0.7);
    k.sky({ bands: ['#4a8ad8', '#5a96dc', '#6aa2e0', '#7eb0e6', '#92beec', '#a6ccf0', '#bad8f4', '#d0e4f8'], body: { x: 120, y: 26, r: 7, color: '#fffbe8', halo: '#eef6ff' }, clouds: { color: '#ffffff', shade: '#dae6f2', count: 12 } });
    k.skyline({ z: -64, count: 50, spread: 130, hMin: 30, hMax: 60, wMin: 6, wMax: 12, color: '#b8cce4', windows: { wall: 'glass_curtain', style: 'none' }, emissive: 0.05 });
    k.skyline({ z: -34, count: 30, spread: 70, hMin: 10, hMax: 30, wMin: 5, wMax: 9, color: '#e0e4ec', windows: { wall: 'concrete', style: 'bands', litChance: 0.25, litColors: ['#bcd8f0'], unlit: '#6a8aaa', frame: '#4a5a6a' }, emissive: 0.1 });
    // window wall: mullions + tinted glass
    const steel = k.mat({ color: '#3a3f4a', metalness: 0.5, roughness: 0.4 });
    for (let x = -48; x <= 48; x += 3.2) k.box(0.18, 12, 0.18, steel, x, 6, -7.2);
    for (const y of [0.2, 6, 11.8]) k.box(96, 0.18, 0.2, steel, 0, y, -7.2);
    k.plane(96, 12, k.mat({ color: '#cfe4ff', transparent: true, opacity: 0.12, roughness: 0.1, metalness: 0.3 }), 0, 6, -7.1);
    // floor
    k.ground({ tile: 'carpet', tileRecolor: { x: '#4a5262', X: '#586274' }, roughness: 1, back: 'parquet', backHeight: 0.05 });
    // back row of desks + partitions
    const part = k.mat({ color: '#9aa4b4' });
    for (let x = -21; x <= 21; x += 7) {
      k.box(5.6, 1.4, 0.12, part, x, 0.7, -3.3);
      k.box(4.2, 0.12, 1.4, k.mat({ color: '#e8e4da' }), x, 1.1, -4.4);
      k.box(1.4, 0.6, 0.12, k.glowMat('#9ac8ff', 0.8), x - 0.6, 1.6, -4.7);
      k.box(0.7, 0.8, 0.7, k.mat({ color: '#2a2f3a' }), x + 1, 0.4, -3.8);
    }
    k.sign('PORTFOLIO INC.', { style: 'panel', color: '#1d3f7a', x: 0, y: 9.2, z: -6.95, scale: 0.075, light: false, intensity: 0.6 });
    // whiteboard with sticky notes
    k.box(4.4, 2.6, 0.1, k.mat({ color: '#f4f6fb' }), -17, 2.6, -5.6);
    k.box(0.1, 1.3, 0.1, steel, -18.8, 0.65, -5.6); k.box(0.1, 1.3, 0.1, steel, -15.2, 0.65, -5.6);
    k.sign('SPRINT BOARD', { style: 'panel', color: '#1d3f7a', x: -17, y: 3.6, z: -5.53, scale: 0.03, light: false, intensity: 0.2 });
    for (let i = 0; i < 9; i++) k.box(0.45, 0.45, 0.02, k.mat({ color: ['#ffd34a', '#ff8ab0', '#8ae0c0'][i % 3] }), -18.4 + (i % 3) * 1.1 + rand() * 0.3, 2.9 - Math.floor(i / 3) * 0.7, -5.54);
    k.plant(-12, -4.8, 1.2); k.plant(13, -4.8, 1.2); k.plant(22, -4.6, 1.4);
    // water cooler
    k.box(0.7, 1.4, 0.7, k.mat({ color: '#e8ecf2' }), 17, 0.7, -4.6);
    const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 10), k.mat({ color: '#7ec8ff', transparent: true, opacity: 0.7 }));
    jug.position.set(17, 1.8, -4.6); k.add(jug);
    // ceiling light panels (glow) visible at the top of the frame
    for (let x = -24; x <= 24; x += 8) k.box(3, 0.1, 1, k.glowMat('#ffffff', 1.4), x, 8.8, -3);
    // foreground: concrete pillars + big plants
    [-14, 9, 22].forEach((x) => k.box(1.2, 14, 1.2, k.mat({ color: '#8a90a0' }), x, 7, 4.8));
    k.plant(-19, 5, 2.2); k.plant(15, 5.2, 2);
  },
};

export const THEMES = [cyberpunk, fantasyTown, fantasyWorld, museum, modernCity, japanCity, office];
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));
export { FACADE_Z };
