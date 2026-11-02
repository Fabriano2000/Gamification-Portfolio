// Building blocks shared by every environment. Each helper adds meshes/lights to the
// environment's group so the whole world can be disposed when switching environments.
//
// Depth layout (from the Figma "Depth Layers & Camera Rig" frame):
//   sky z=-130 · far layer z=-60 · near layer z=-25 · facades z=-6 · playfield z=0 · foreground z=+4
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { tileTexture, facadeTextures, signTexture, skyTexture, stripeTexture, pixelTexture } from '../pixel.js';

export const STREET = { w: 96, d: 30, z: 6 }; // floor runs from z=-9 to z=+21 so it fills the bottom of the frame
export const FACADE_Z = -7.6; // building centre; front face at about -6.1

export function createKit(group, scene, quality, rand) {
  const kit = { group, scene, quality, rand, lights: 0, animated: [], reflectors: [] };
  const add = (o) => { group.add(o); return o; };
  kit.add = add;

  kit.mat = (opts) => new THREE.MeshStandardMaterial({ roughness: 0.9, ...opts });
  kit.flat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...opts });
  kit.glowMat = (color, intensity = 2.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 1 });
  kit.box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    return add(m);
  };
  kit.onUpdate = (fn) => kit.animated.push(fn);

  // ---------- Lights
  kit.pointLight = (color, intensity, distance, x, y, z, decay = 1.6) => {
    if (kit.lights >= quality.maxLights) return null;
    kit.lights++;
    const l = new THREE.PointLight(color, intensity, distance, decay);
    l.position.set(x, y, z);
    return add(l);
  };
  kit.spotLight = (color, intensity, x, y, z, tx, ty, tz, angle = 0.5) => {
    if (kit.lights >= quality.maxLights) return null;
    kit.lights++;
    const s = new THREE.SpotLight(color, intensity, 22, angle, 0.5, 1.4);
    s.position.set(x, y, z);
    s.target.position.set(tx, ty, tz);
    add(s); add(s.target);
    return s;
  };
  kit.ambient = ({ sky, ground, intensity }) => add(new THREE.HemisphereLight(sky, ground, intensity));
  /** Main shadow-casting light (sun or moon). Follows the camera in world.update. */
  kit.keyLight = ({ color, intensity, offset = [-8, 18, 14] }) => {
    const l = new THREE.DirectionalLight(color, intensity);
    l.castShadow = quality.shadows > 0;
    if (l.castShadow) {
      l.shadow.mapSize.set(quality.shadows, quality.shadows);
      const c = l.shadow.camera;
      c.left = -26; c.right = 26; c.top = 16; c.bottom = -8; c.near = 1; c.far = 70;
      l.shadow.bias = -0.0008; l.shadow.normalBias = 0.02;
    }
    l.userData.offset = offset;
    add(l); add(l.target);
    kit.key = l;
    return l;
  };
  kit.fill = (color, intensity) => { const f = new THREE.DirectionalLight(color, intensity); f.position.set(0, 4, 20); return add(f); };

  // ---------- Sky
  kit.sky = (opts) => {
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(640, 240),
      new THREE.MeshBasicMaterial({ map: skyTexture(rand, opts), fog: false, depthWrite: false })
    );
    sky.position.set(0, 70, -130);
    sky.renderOrder = -1;
    return add(sky);
  };

  // ---------- Ground: optional reflector under a (semi-transparent) tiled floor, plus curb + back strip
  kit.ground = ({ tile, tileRecolor, reflect = false, opacity = 0.72, roughness = 0.6, metalness = 0.1, back, backRecolor, curb, backHeight = 0.2 }) => {
    const { w, d, z } = STREET;
    const useReflect = reflect && quality.reflections;
    if (useReflect) {
      const mirror = new Reflector(new THREE.PlaneGeometry(w, d), {
        textureWidth: Math.floor(innerWidth * quality.reflectionScale),
        textureHeight: Math.floor(innerHeight * quality.reflectionScale),
        color: 0x6a5a8a,
      });
      mirror.rotation.x = -Math.PI / 2;
      mirror.position.set(0, -0.01, z);
      add(mirror);
      kit.reflectors.push(mirror);
    }
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      kit.mat({ map: tileTexture(tile, w / 1.6, d / 1.6, tileRecolor), roughness, metalness, transparent: useReflect, opacity: useReflect ? opacity : 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, z);
    floor.receiveShadow = true;
    add(floor);
    if (back) {
      const strip = kit.box(w, backHeight, 3.4, kit.mat({ map: tileTexture(back, w / 1.6, 3.4 / 1.6, backRecolor), roughness: 0.8 }), 0, backHeight / 2, -4.4);
      strip.receiveShadow = true;
    }
    if (curb) {
      kit.box(w, 0.22, 0.25, kit.mat({ color: curb.color }), 0, 0.11, -2.6).receiveShadow = true;
      if (curb.glow) kit.box(w, 0.05, 0.05, kit.glowMat(curb.glow, 2.2), 0, 0.22, -2.46);
    }
    return floor;
  };

  // ---------- Building row along the street
  /**
   * opts: from,to, z, wMin,wMax, hMin,hMax, depth, colors[], emissive, window opts (passed to facadeTextures),
   *       roof: {kind:'gable'|'flat', tile, height, overhang}, awnings: [[colorA,colorB],...], gap
   */
  kit.facades = (o) => {
    const {
      from = -46, to = 46, z = FACADE_Z, wMin = 4, wMax = 8, hMin = 5, hMax = 11, depth = 3, colors = ['#ffffff'],
      emissive = 1.2, windows = {}, roof = null, awnings = null, gap = 0.2, baseY = 0.2,
    } = o;
    const out = [];
    let x = from;
    while (x < to) {
      const w = Math.round((wMin + rand() * (wMax - wMin)) / 1.4) * 1.4 || 1.4;
      const h = Math.round((hMin + rand() * (hMax - hMin)) / 1.6) * 1.6 || 1.6;
      const tex = facadeTextures(Math.max(1, Math.round(w / 1.4)), Math.max(1, Math.round(h / 1.6)), rand, windows);
      const b = kit.box(w, h, depth, kit.mat({
        color: colors[Math.floor(rand() * colors.length)], map: tex.map, emissiveMap: tex.emissiveMap,
        emissive: '#ffffff', emissiveIntensity: emissive, roughness: 0.95,
      }), x + w / 2, h / 2 + baseY, z);
      b.receiveShadow = true; b.castShadow = true;
      const top = h + baseY;
      if (roof?.kind === 'gable') kit.gableRoof(x + w / 2, top, z, w, depth, roof.tiles ? { ...roof, tile: roof.tiles[Math.floor(rand() * roof.tiles.length)] } : roof);
      else if (roof?.kind === 'flat') kit.box(w + 0.3, 0.3, depth + 0.3, kit.mat({ color: roof.color || '#3b1f6b' }), x + w / 2, top + 0.15, z);
      if (awnings && rand() < 0.75) {
        const [a, c] = awnings[Math.floor(rand() * awnings.length)];
        kit.awning(x + w / 2, 2.9, z + depth / 2, w * 0.86, a, c);
      }
      out.push({ x: x + w / 2, w, h: top, z });
      x += w + gap;
    }
    return out;
  };

  /** Ridge runs along X so the roof slope faces the camera (classic HD-2D town look). */
  kit.gableRoof = (cx, y, z, w, depth, { tile = 'roof_red', height = 2.2, overhang = 0.5, recolor }) => {
    const half = depth / 2 + overhang;
    const shape = new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, height)]);
    const len = w + overhang * 2;
    const geo = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
    geo.rotateY(Math.PI / 2);
    geo.translate(-len / 2, 0, 0);
    const tex = tileTexture(tile, 1 / 1.6, 1 / 1.6, recolor);
    const m = new THREE.Mesh(geo, kit.mat({ map: tex, roughness: 0.85 }));
    m.position.set(cx, y, z);
    m.castShadow = true;
    if (rand() < 0.5) { // chimney
      kit.box(0.6, 1.4, 0.6, kit.mat({ color: '#6a4a3a' }), cx + (rand() - 0.5) * w * 0.5, y + height * 0.6, z - 0.4);
    }
    return add(m);
  };

  kit.awning = (cx, y, zFront, w, a, b) => {
    const tex = stripeTexture(a, b, 8);
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(w / 1.6, 1);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 1.3), kit.mat({ map: tex }));
    m.position.set(cx, y, zFront + 0.6);
    m.rotation.x = 0.38;
    m.castShadow = true;
    return add(m);
  };

  // ---------- Background layers
  /** Box skyline (modern/cyber cities). */
  kit.skyline = ({ z, count = 50, spread = 120, hMin, hMax, wMin, wMax, color, windows = {}, emissive = 1.4, depth = 4, beacons = false }) => {
    let x = -spread;
    for (let i = 0; i < count && x < spread; i++) {
      const w = wMin + rand() * (wMax - wMin);
      const h = hMin + rand() * (hMax - hMin);
      const tex = facadeTextures(Math.max(2, Math.round(w / 1.4)), Math.max(3, Math.round(h / 1.6)), rand, windows);
      const b = kit.box(w, h, depth, kit.mat({ color, map: tex.map, emissiveMap: tex.emissiveMap, emissive: '#ffffff', emissiveIntensity: emissive, roughness: 1 }), x + w / 2, h / 2, z - rand() * 6);
      if (beacons && rand() < 0.25) {
        kit.box(0.3, 3, 0.3, kit.mat({ color }), b.position.x, h + 1.5, b.position.z);
        const bea = kit.box(0.5, 0.4, 0.5, new THREE.MeshBasicMaterial({ color: beacons }), b.position.x, h + 3.2, b.position.z);
        const ph = rand() * 6;
        kit.onUpdate((t) => { bea.visible = Math.sin(t * 2 + ph) > -0.3; });
      }
      x += w + rand() * 2;
    }
  };

  /** Flat silhouette from a polyline (hills, mountains, castle). Points are [x, y]. */
  kit.silhouette = (z, color, pts, opts = {}) => {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color, roughness: 1, ...opts }));
    m.position.z = z;
    return add(m);
  };
  kit.ridge = (z, color, { from = -200, to = 200, base = -2, min, max, step = 8, jag = 0.5, snow }) => {
    const pts = [[from, base]];
    const tops = [];
    for (let x = from; x <= to; x += step * (0.6 + rand() * 0.8)) {
      const y = min + rand() * (max - min);
      pts.push([x, y]); tops.push([x, y]);
      if (jag) pts.push([x + step * 0.4, y - (max - min) * jag * rand()]);
    }
    pts.push([to, base]);
    kit.silhouette(z, color, pts);
    if (snow) for (const [x, y] of tops) if (y > min + (max - min) * 0.55) {
      const s = 2.2 + rand() * 1.5;
      kit.silhouette(z + 0.05, snow, [[x - s, y - s * 1.1], [x, y], [x + s, y - s * 1.1]]);
    }
  };

  // ---------- Trees (low-poly, flat shaded — the "3D" half of HD-2D)
  kit.pine = (x, z, h = 4, color = '#2a6a32', trunk = '#5e3b1e') => {
    kit.box(0.35, h * 0.3, 0.35, kit.flat(trunk), x, h * 0.15, z).castShadow = true;
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(h * (0.32 - i * 0.07), h * 0.45, 6), kit.flat(color));
      c.position.set(x, h * (0.42 + i * 0.2), z);
      c.castShadow = true;
      add(c);
    }
  };
  kit.roundTree = (x, z, h = 4, color = '#4fae4f', trunk = '#5e3b1e') => {
    kit.box(0.4, h * 0.5, 0.4, kit.flat(trunk), x, h * 0.25, z).castShadow = true;
    const r = h * 0.32;
    for (const [dx, dy, s] of [[0, 0.65, 1], [-0.25, 0.5, 0.75], [0.28, 0.52, 0.7]]) {
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), kit.flat(color));
      c.position.set(x + dx * h * 0.4, h * dy + r * 0.3, z);
      c.castShadow = true;
      add(c);
    }
  };

  // ---------- Signs
  kit.sign = (text, { x, y, z, scale = 0.07, light = true, flicker = false, intensity = 3, lightColor, ...sopts }) => {
    const t = signTexture(text, sopts);
    const mat = kit.mat({
      map: t.map, emissiveMap: t.emissiveMap, emissive: t.emissiveMap ? '#ffffff' : '#000000',
      emissiveIntensity: intensity, roughness: 1,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(t.w * scale, t.h * scale), mat);
    m.position.set(x, y, z);
    add(m);
    if (light) kit.pointLight(lightColor || sopts.color || '#ffffff', 8, 13, x, y - 0.5, z + 1.6);
    if (flicker) {
      const ph = rand() * 10;
      kit.onUpdate((tm) => { mat.emissiveIntensity = intensity * (Math.sin(tm * 23 + ph) > 0.985 ? 0.3 : 1); });
    }
    return m;
  };

  // ---------- Props
  kit.lamp = (x, z, { color = '#ffcf6b', h = 3.6, pole = '#1d1a24', light = true, style = 'iron' } = {}) => {
    kit.box(0.16, h, 0.16, kit.mat({ color: pole }), x, h / 2, z).castShadow = true;
    if (style === 'iron') {
      kit.box(0.5, 0.12, 0.5, kit.mat({ color: pole }), x, h + 0.06, z);
      kit.box(0.36, 0.5, 0.36, kit.glowMat(color, 3), x, h - 0.25, z);
    } else {
      kit.box(1.0, 0.1, 0.12, kit.mat({ color: pole }), x + 0.45, h, z);
      kit.box(0.5, 0.1, 0.3, kit.glowMat(color, 3), x + 0.8, h - 0.08, z);
    }
    if (light) kit.pointLight(color, 7, 9, x, h - 0.6, z + 0.4);
  };
  kit.lantern = (x, y, z, color = '#ff4a3a', light = false) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 8), kit.glowMat(color, 2.6));
    m.position.set(x, y, z);
    add(m);
    if (light) kit.pointLight(color, 4, 6, x, y - 0.3, z + 0.5);
    return m;
  };
  kit.cable = (a, b, sag, color, r = 0.05) => {
    const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
    return add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 24, r, 4), kit.mat({ color })));
  };
  kit.railing = (z, color, { h = 0.9, from = -48, to = 48, step = 1.6 } = {}) => {
    const mat = kit.mat({ color });
    for (let x = from; x <= to; x += step) kit.box(0.1, h, 0.1, mat, x, h / 2, z);
    kit.box(to - from, 0.12, 0.12, mat, (from + to) / 2, h, z);
  };
  kit.fence = (z, color, { from = -48, to = 48 } = {}) => {
    const mat = kit.flat(color);
    for (let x = from; x <= to; x += 0.8) kit.box(0.25, 1.1 + (Math.round(x / 0.8) % 2) * 0.15, 0.1, mat, x, 0.6, z);
    kit.box(to - from, 0.12, 0.12, mat, (from + to) / 2, 0.85, z + 0.06);
    kit.box(to - from, 0.12, 0.12, mat, (from + to) / 2, 0.4, z + 0.06);
  };
  kit.barrel = (x, z, color = '#7a4a24') => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 10), kit.flat(color));
    m.position.set(x, 0.45, z); m.castShadow = true;
    add(m);
  };
  kit.crate = (x, z, s = 0.8, color = '#9a6a3a') => { const b = kit.box(s, s, s, kit.flat(color), x, s / 2, z); b.castShadow = true; return b; };
  kit.column = (x, z, h, color = '#e8e4da') => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, h, 12), kit.flat(color));
    c.position.set(x, h / 2, z); c.castShadow = true; add(c);
    kit.box(1.2, 0.3, 1.2, kit.flat(color), x, 0.15, z);
    kit.box(1.2, 0.3, 1.2, kit.flat(color), x, h - 0.15, z);
  };
  kit.plant = (x, z, s = 1) => {
    kit.box(0.6 * s, 0.6 * s, 0.6 * s, kit.flat('#e8e4da'), x, 0.3 * s, z);
    for (let i = 0; i < 5; i++) {
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.18 * s, 1.2 * s, 4), kit.flat('#3f9a4f'));
      l.position.set(x + (i - 2) * 0.12 * s, 0.9 * s, z);
      l.rotation.z = (i - 2) * 0.3;
      l.castShadow = true;
      add(l);
    }
  };

  /** Generic textured plane (paintings, posters, windows). */
  kit.plane = (w, h, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); return add(m); };
  kit.texMat = (canvasTex, glow = 0) => kit.mat({ map: canvasTex, emissiveMap: glow ? canvasTex : null, emissive: glow ? '#ffffff' : '#000000', emissiveIntensity: glow });
  kit.pixelTexture = pixelTexture;

  return kit;
}
