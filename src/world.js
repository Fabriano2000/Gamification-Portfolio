// Builds the Quest Board zone as an HD-2D diorama.
// Depth layout follows the Figma "Depth Layers & Camera Rig" frame:
//   sky z=-130 · far skyline z=-60 · near skyline z=-25 · facades z=-6 · playfield z=0 · foreground z=+4
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { PixelSprite, PX } from './sprite.js';
import { TERMINAL, BOT_IDLE, SHARD, facadeTextures, neonTexture, tileTexture, rng, pixelTexture } from './pixel.js';

export const BOUNDS = { min: -16, max: 16 };
const INK = 0x05020f;

export function buildWorld(scene, quality, content) {
  const rand = rng(4242);
  const world = { interactables: [], shards: [], animated: [], lights: [] };

  // ---------- Atmosphere
  scene.background = new THREE.Color('#07041a');
  scene.fog = new THREE.FogExp2('#2a0f52', 0.022);

  const hemi = new THREE.HemisphereLight('#4a2a8a', '#0d0221', 0.9);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight('#9fb4ff', 0.9);
  moon.position.set(-8, 18, 14);
  moon.castShadow = quality.shadows > 0;
  if (moon.castShadow) {
    moon.shadow.mapSize.set(quality.shadows, quality.shadows);
    const c = moon.shadow.camera;
    c.left = -26; c.right = 26; c.top = 16; c.bottom = -8; c.near = 1; c.far = 60;
    moon.shadow.bias = -0.0008;
    moon.shadow.normalBias = 0.02;
  }
  scene.add(moon, moon.target);
  world.moon = moon;

  // Soft fill from the camera side so sprite faces stay readable.
  const fill = new THREE.DirectionalLight('#ff9ad5', 0.35);
  fill.position.set(0, 4, 20);
  scene.add(fill);

  // ---------- Sky dome (static gradient + stars + pixel moon)
  {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    const ctx = cv.getContext('2d');
    const bands = ['#07041a', '#0d0729', '#140a38', '#1d0c45', '#2a0f52', '#3a115a', '#4d135f', '#621463'];
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * 16, 256, 16); });
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.7})`;
      ctx.fillRect(Math.floor(rand() * 256), Math.floor(rand() * 70), 1, 1);
    }
    // moon
    ctx.fillStyle = '#f4e9ff';
    for (let y = -7; y <= 7; y++) {
      const half = Math.floor(Math.sqrt(49 - y * y));
      ctx.fillRect(170 - half, 22 + y, half * 2, 1);
    }
    ctx.fillStyle = '#d4c4f0'; ctx.fillRect(166, 19, 2, 2); ctx.fillRect(172, 24, 3, 3);
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(640, 240),
      new THREE.MeshBasicMaterial({ map: pixelTexture(cv), fog: false, depthWrite: false })
    );
    sky.position.set(0, 70, -130);
    scene.add(sky);
  }

  // ---------- Skylines
  const skyline = (z, count, spread, hMin, hMax, wMin, wMax, color, lit, litColor, glow) => {
    let x = -spread;
    for (let i = 0; i < count && x < spread; i++) {
      const w = wMin + rand() * (wMax - wMin);
      const h = hMin + rand() * (hMax - hMin);
      const tex = facadeTextures(Math.max(2, Math.round(w / 1.4)), Math.max(3, Math.round(h / 1.6)), rand, lit, litColor);
      const mat = new THREE.MeshStandardMaterial({
        color, map: tex.map, emissiveMap: tex.emissiveMap, emissive: '#ffffff', emissiveIntensity: glow, roughness: 1,
      });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 4), mat);
      b.position.set(x + w / 2, h / 2, z - rand() * 6);
      scene.add(b);
      if (rand() < 0.25) {
        const ant = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), new THREE.MeshStandardMaterial({ color }));
        ant.position.set(b.position.x, h + 1.5, b.position.z);
        const bea = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), new THREE.MeshBasicMaterial({ color: '#ff2a6d' }));
        bea.position.set(b.position.x, h + 3.2, b.position.z);
        scene.add(ant, bea);
        world.animated.push((t) => { bea.visible = Math.sin(t * 2 + x) > -0.3; });
      }
      x += w + rand() * 2;
    }
  };
  skyline(-60, 60, 130, 24, 52, 6, 12, '#2a1450', 0.12, '#ff7ad9', 1.6);
  skyline(-25, 40, 70, 12, 28, 4, 8, '#1d0b3a', 0.22, '#00f0ff', 1.4);

  // ---------- Street: reflector underneath a semi-transparent wet tile layer
  const streetW = 90, streetD = 16, streetZ = -1;
  if (quality.reflections) {
    const mirror = new Reflector(new THREE.PlaneGeometry(streetW, streetD), {
      textureWidth: Math.floor(window.innerWidth * quality.reflectionScale),
      textureHeight: Math.floor(window.innerHeight * quality.reflectionScale),
      color: 0x6a5a8a,
    });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.set(0, -0.01, streetZ);
    scene.add(mirror);
  }
  const streetTex = tileTexture('street_wet', streetW / 1.6, streetD / 1.6);
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(streetW, streetD),
    new THREE.MeshStandardMaterial({
      map: streetTex, roughness: 0.35, metalness: 0.3,
      transparent: quality.reflections, opacity: quality.reflections ? 0.72 : 1,
    })
  );
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0, streetZ);
  street.receiveShadow = true;
  scene.add(street);

  // Curb + raised sidewalk behind the playfield
  const curb = new THREE.Mesh(new THREE.BoxGeometry(streetW, 0.2, 0.25), new THREE.MeshStandardMaterial({ color: '#3b1f6b' }));
  curb.position.set(0, 0.1, -2.6);
  const neonCurb = new THREE.Mesh(
    new THREE.BoxGeometry(streetW, 0.05, 0.05),
    new THREE.MeshStandardMaterial({ color: '#ff2a6d', emissive: '#ff2a6d', emissiveIntensity: 2.2 })
  );
  neonCurb.position.set(0, 0.2, -2.46);
  const walkTex = tileTexture('metal_panel', streetW / 1.6, 3.4 / 1.6);
  const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(streetW, 0.2, 3.4), new THREE.MeshStandardMaterial({ map: walkTex, roughness: 0.8 }));
  sidewalk.position.set(0, 0.1, -4.4);
  sidewalk.receiveShadow = curb.receiveShadow = true;
  scene.add(curb, neonCurb, sidewalk);

  // ---------- Facades (z = -6)
  let fx = -44;
  const facadeColors = ['#2a1450', '#241046', '#1f0d40', '#2c1552'];
  while (fx < 44) {
    const w = 4 + Math.round(rand() * 3) * 1.4;
    const h = 5 + Math.round(rand() * 4) * 1.6;
    const tex = facadeTextures(Math.round(w / 1.4), Math.round(h / 1.6), rand, 0.45);
    const mat = new THREE.MeshStandardMaterial({
      color: facadeColors[Math.floor(rand() * facadeColors.length)],
      map: tex.map, emissiveMap: tex.emissiveMap, emissive: '#ffffff', emissiveIntensity: 1.25, roughness: 0.95,
    });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), mat);
    b.position.set(fx + w / 2, h / 2 + 0.2, -7.6);
    b.receiveShadow = true;
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.3, 3.3), new THREE.MeshStandardMaterial({ color: '#3b1f6b' }));
    cornice.position.set(b.position.x, h + 0.35, -7.6);
    scene.add(b, cornice);
    fx += w + 0.2;
  }

  // ---------- Neon signs (emissive + a real point light each)
  const sign = (text, color, x, y, z, px = 8, scale = 0.12, vertical = false, light = true) => {
    const t = neonTexture(text, color, px);
    const mat = new THREE.MeshStandardMaterial({
      map: t.map, emissiveMap: t.emissiveMap, emissive: '#ffffff', emissiveIntensity: 3.2, roughness: 1,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(t.w * scale, t.h * scale), mat);
    m.position.set(x, y, z);
    if (vertical) m.rotation.z = -Math.PI / 2;
    scene.add(m);
    if (light && world.lights.length < quality.maxLights) {
      const l = new THREE.PointLight(color, 9, 14, 1.6);
      l.position.set(x, y - 0.5, z + 1.6);
      scene.add(l);
      world.lights.push(l);
    }
    const phase = rand() * 10;
    world.animated.push((time) => {
      // occasional neon flicker
      const f = Math.sin(time * 23 + phase) > 0.985 ? 0.3 : 1;
      mat.emissiveIntensity = 3.2 * f;
    });
    return m;
  };
  sign('QUEST BOARD', '#ffe14d', 0, 6.4, -6.0, 8, 0.075);
  sign('BAR', '#ff2a6d', -10.5, 4.6, -6.0, 8, 0.065, true);
  sign('24H', '#00f0ff', 9.5, 5.4, -6.0, 8, 0.065);
  sign('DATA', '#ff7ad9', 14.5, 4.0, -6.0, 8, 0.06, true, false);
  sign('ZONE 03', '#ffe14d', -15.6, 2.6, -3.2, 8, 0.04, false, false);

  // ---------- Terminals (projects)
  const termColors = ['#ff2a6d', '#00f0ff', '#ffe14d'];
  content.projects.slice(0, 3).forEach((p, i) => {
    const x = -6 + i * 6;
    const s = new PixelSprite({ frames: TERMINAL, scale: 1.4, glowChars: 'VvJY', glow: 2.6 });
    s.mesh.position.set(x, 0, -0.6);
    scene.add(s.mesh);
    if (world.lights.length < quality.maxLights) {
      const l = new THREE.PointLight(termColors[i], 6, 7, 1.8);
      l.position.set(x, 2.0, 0.6);
      scene.add(l);
      world.lights.push(l);
    }
    // holo beam from the screen up to where the quest card floats
    const beam = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 1.4),
      new THREE.MeshBasicMaterial({ color: termColors[i], transparent: true, opacity: 0.6, depthWrite: false })
    );
    beam.position.set(x, s.height + 0.7, -0.6);
    scene.add(beam);
    world.animated.push((t) => { beam.material.opacity = 0.35 + 0.25 * Math.sin(t * 3 + i); });
    world.interactables.push({
      kind: 'project', index: i, x, color: termColors[i],
      anchor: new THREE.Vector3(x, s.height + 1.5, -0.6), radius: 1.6,
    });
  });

  // ---------- Guide bot
  const bot = new PixelSprite({ frames: BOT_IDLE, scale: 1.2, fps: 4, glowChars: 'VY', glow: 2 });
  bot.mesh.position.set(-12, 0, -0.4);
  scene.add(bot.mesh);
  world.bot = bot;
  world.interactables.push({ kind: 'bot', x: -12, anchor: new THREE.Vector3(-12, bot.height + 0.6, -0.4), radius: 1.8 });

  // ---------- Data shards (collectibles)
  [-9, -3, 3, 9, 13].forEach((x, i) => {
    const s = new PixelSprite({ frames: SHARD, scale: 1.2, glowChars: 'VvW', glow: 3 });
    s.mesh.position.set(x, 1.0, 0);
    s.mesh.castShadow = false;
    scene.add(s.mesh);
    world.shards.push({ sprite: s, x, taken: false, phase: i });
  });

  // ---------- Foreground props (z = +4..+5): dark silhouettes, pushed out of focus by DOF
  const ink = new THREE.MeshStandardMaterial({ color: INK, roughness: 1 });
  const poles = [-14, 7, 21];
  poles.forEach((x) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.45, 14, 0.45), ink);
    p.position.set(x, 7, 4.6);
    p.castShadow = true;
    scene.add(p);
  });
  // cables between poles
  for (let i = 0; i < poles.length - 1; i++) {
    for (const [hA, sag] of [[10.5, 1.6], [9.2, 2.2]]) {
      const a = new THREE.Vector3(poles[i], hA, 4.6), b = new THREE.Vector3(poles[i + 1], hA + 0.4, 4.6);
      const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
      const curve = new THREE.CatmullRomCurve3([a, mid, b]);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.06, 4), ink));
    }
  }
  // AC units + railing
  [[-19, 1.4], [16, 1.1]].forEach(([x, h]) => {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(2.6, h, 1.2), ink);
    ac.position.set(x, h / 2, 4.2);
    scene.add(ac);
  });
  for (let x = -40; x <= 40; x += 1.6) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), ink);
    post.position.set(x, 0.45, 5.4);
    scene.add(post);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(80, 0.12, 0.12), ink);
  rail.position.set(0, 0.92, 5.4);
  scene.add(rail);

  world.update = (time, dt) => {
    bot.update(dt);
    for (const a of world.animated) a(time);
    for (const s of world.shards) {
      if (s.taken) continue;
      s.sprite.mesh.position.y = 1.0 + Math.sin(time * 2.5 + s.phase) * 0.15;
      s.sprite.update(dt);
    }
  };
  return world;
}
