// Generic world builder: atmosphere + theme scenery (src/env/themes.js) + interactive stations,
// NPC, collectibles and particles. Everything lives in one group so environments can be swapped live.
import * as THREE from 'three';
import { PixelSprite } from './sprite.js';
import { SHARD, rng } from './pixel.js';
import { createKit } from './env/kit.js';
import { createParticles } from './particles.js';

export const BOUNDS = { min: -16, max: 16 };

export function buildWorld(scene, quality, content, theme) {
  const group = new THREE.Group();
  group.name = `env:${theme.id}`;
  scene.add(group);
  const rand = rng(theme.seed);
  scene.background = new THREE.Color(theme.background);
  scene.fog = new THREE.FogExp2(theme.fog.color, theme.fog.density);

  const kit = createKit(group, scene, quality, rand);
  theme.build(kit, { rand, content });

  const world = { group, interactables: [], shards: [], sprites: [], theme };

  // ---------- Project stations
  const st = theme.station;
  content.projects.slice(0, 3).forEach((p, i) => {
    const x = -6 + i * 6;
    const color = st.colors[i % st.colors.length];
    const s = new PixelSprite({ frames: st.frames, scale: st.scale, glowChars: st.glowChars, glow: st.glow });
    s.mesh.position.set(x, 0, -0.6);
    group.add(s.mesh);
    world.sprites.push(s);
    if (st.light) kit.pointLight(st.lightColor || color, 6, 7, x, 2.0, 0.6);
    if (st.spot) kit.spotLight('#fff1d6', 40, x, 11, 3, x, 1, -0.6, 0.32);
    if (st.beam) {
      const beam = new THREE.Mesh(
        new THREE.PlaneGeometry(0.06, 1.4),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false })
      );
      beam.position.set(x, s.height + 0.7, -0.6);
      group.add(beam);
      kit.onUpdate((t) => { beam.material.opacity = 0.35 + 0.25 * Math.sin(t * 3 + i); });
    }
    world.interactables.push({ kind: 'project', index: i, x, color, anchor: new THREE.Vector3(x, s.height + 1.5, -0.6), radius: 1.6 });
  });

  // ---------- Guide NPC
  const npc = new PixelSprite({ frames: theme.npc.frames, scale: theme.npc.scale, fps: 4, glowChars: theme.npc.glowChars, glow: 2, recolor: theme.npc.recolor });
  npc.mesh.position.set(-12, 0, -0.4);
  group.add(npc.mesh);
  world.sprites.push(npc);
  world.interactables.push({ kind: 'npc', x: -12, anchor: new THREE.Vector3(-12, npc.height + 0.6, -0.4), radius: 1.8 });

  // ---------- Collectibles
  [-9, -3, 3, 9, 13].forEach((x, i) => {
    const s = new PixelSprite({ frames: SHARD, scale: 1.2, glowChars: 'VvW', glow: 3 });
    s.mesh.position.set(x, 1.0, 0);
    s.mesh.castShadow = false;
    group.add(s.mesh);
    world.sprites.push(s);
    world.shards.push({ sprite: s, x, taken: false, phase: i });
  });

  // ---------- Ambient particles
  const pCount = theme.particles === 'rain' ? quality.rain : Math.round(quality.rain * 0.12);
  const particles = theme.particles ? createParticles(group, theme.particles, pCount) : { update() {} };

  world.update = (time, dt, camX) => {
    npc.update(dt);
    for (const a of kit.animated) a(time);
    for (const s of world.shards) {
      if (s.taken) continue;
      s.sprite.mesh.position.y = 1.0 + Math.sin(time * 2.5 + s.phase) * 0.15;
      s.sprite.update(dt);
    }
    if (kit.key) {
      const [ox, oy, oz] = kit.key.userData.offset;
      kit.key.position.set(camX + ox, oy, oz);
      kit.key.target.position.set(camX, 0, 0);
    }
    particles.update(dt, camX);
  };

  world.dispose = () => {
    scene.remove(group);
    for (const r of kit.reflectors) r.dispose();
    const seen = new Set();
    const disposeMat = (m) => {
      if (!m || seen.has(m)) return;
      seen.add(m);
      for (const key of ['map', 'emissiveMap']) m[key]?.dispose?.();
      m.dispose();
    };
    group.traverse((o) => {
      o.geometry?.dispose?.();
      if (Array.isArray(o.material)) o.material.forEach(disposeMat); else disposeMat(o.material);
      disposeMat(o.customDepthMaterial);
      if (o.isLight && o.shadow?.map) o.shadow.map.dispose();
    });
  };

  return world;
}
