// Fantasy night landscape behind the planet. Three painted-silhouette layers at different depths
// scroll with parallax as you walk, and wrap so the world never runs out.
import * as THREE from 'three';
import { pixelTexture } from '../pixel.js';

const basic = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });
const glow = (color) => new THREE.MeshBasicMaterial({ color, fog: false });

function shapeMesh(pts, mat) {
  return new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))), mat);
}

/** Jagged ridge polyline across [0, W] that starts and ends at the same height so copies tile. */
function ridge(rand, W, base, min, max, step, jag) {
  const pts = [[0, base]];
  const tops = [];
  const y0 = (min + max) / 2;
  pts.push([0, y0]);
  for (let x = step; x < W - step; x += step * (0.6 + rand() * 0.8)) {
    const y = min + rand() * (max - min);
    pts.push([x, y]); tops.push([x, y]);
    if (jag) pts.push([x + step * 0.4, y - (max - min) * jag * rand()]);
  }
  pts.push([W, y0], [W, base]);
  return { pts, tops };
}

function waterfallTexture() {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 32;
  const c = cv.getContext('2d');
  for (let y = 0; y < 32; y++) { c.fillStyle = y % 6 < 3 ? '#bff4ff' : '#4ac8ff'; c.fillRect(0, y, 4, 1); c.fillStyle = '#ffffff'; if (y % 11 === 0) c.fillRect(1, y, 1, 1); }
  const t = pixelTexture(cv); t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3);
  return t;
}

export function createBackdrop(scene, rand) {
  const root = new THREE.Group();
  root.name = 'backdrop';
  scene.add(root);
  const animated = [];
  const layers = [];

  // y offsets keep each layer's horizon below the planet's crown, so the player is
  // silhouetted against the sky and only tall features (peaks, castle, islands, tree) rise behind.
  const addLayer = (z, y, W, factor, build) => {
    const tile = new THREE.Group();
    build(tile, W);
    const holder = new THREE.Group();
    holder.position.set(0, y, z);
    for (const k of [-1, 0, 1]) {
      const copy = k === 0 ? tile : tile.clone();
      copy.position.x = k * W - W / 2;
      holder.add(copy);
    }
    root.add(holder);
    layers.push({ holder, W, factor });
  };

  // ---------- far: snowy mountain range lit by the moon
  addLayer(-150, -40, 420, 0.04, (g, W) => {
    const back = ridge(rand, W, -90, 14, 52, 22, 0.35);
    g.add(shapeMesh(back.pts, basic('#141a40')));
    for (const [x, y] of back.tops) if (y > 34) {
      const s = 4 + rand() * 4;
      const cap = shapeMesh([[x - s, y - s * 1.2], [x, y], [x + s * 0.9, y - s * 1.1], [x + s * 0.3, y - s * 0.7]], basic('#7c8cc8'));
      cap.position.z = 0.1; g.add(cap);
    }
    const front = ridge(rand, W, -90, 0, 12, 16, 0.25);
    const fm = shapeMesh(front.pts, basic('#10143a')); fm.position.z = 2; g.add(fm);
  });

  // ---------- mid: castle on a cliff, floating islands with waterfalls, a glowing tree
  const wfTex = waterfallTexture();
  animated.push((t) => { wfTex.offset.y = -t * 0.6; });
  addLayer(-105, -22, 300, 0.1, (g, W) => {
    const rock = '#0e1232', dark = '#121640';
    // cliff + castle
    const cx = 70;
    g.add(shapeMesh([[cx - 26, -80], [cx - 20, 6], [cx - 12, 14], [cx - 4, 16], [cx + 10, 15], [cx + 18, 8], [cx + 24, -80]], basic(rock)));
    const castle = basic(dark);
    const box = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), castle); m.position.set(x, y, 0.2); g.add(m); };
    box(16, 10, cx, 21); box(4, 18, cx - 8, 25); box(4, 22, cx + 7, 27); box(3, 28, cx, 30);
    for (const [x, h] of [[cx - 8, 34], [cx + 7, 38], [cx, 44]]) {
      const spire = shapeMesh([[x - 2.6, h], [x, h + 7], [x + 2.6, h]], castle); spire.position.z = 0.2; g.add(spire);
      const beacon = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), glow('#ff6a8a')); beacon.position.set(x, h + 7.4, 0.3); g.add(beacon);
    }
    for (let i = 0; i < 14; i++) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), glow(rand() < 0.8 ? '#ffd88a' : '#9ad8ff'));
      w.position.set(cx - 9 + Math.floor(rand() * 18), 18 + Math.floor(rand() * 16), 0.3); g.add(w);
    }
    // floating islands with waterfalls
    for (const [x, y, s] of [[-80, 44, 1.3], [-30, 54, 0.8], [130, 48, 1]]) {
      const isl = new THREE.Group();
      isl.add(shapeMesh([[-10 * s, 0], [10 * s, 0], [6 * s, -5 * s], [1 * s, -16 * s], [-4 * s, -7 * s]], basic(rock)));
      const top = shapeMesh([[-10.5 * s, 0], [10.5 * s, 0], [9 * s, 1.2 * s], [-9 * s, 1.2 * s]], basic('#1a2a4a')); top.position.z = 0.1; isl.add(top);
      for (let i = 0; i < 4; i++) {
        const tx = (-7 + i * 4.5 + rand()) * s, th = (3 + rand() * 4) * s;
        const tree = shapeMesh([[tx - 1.4 * s, 1 * s], [tx, 1 * s + th], [tx + 1.4 * s, 1 * s]], basic('#0b1430')); tree.position.z = 0.2; isl.add(tree);
      }
      const fall = new THREE.Mesh(new THREE.PlaneGeometry(1.4 * s, 60), new THREE.MeshBasicMaterial({ map: wfTex, transparent: true, opacity: 0.85, fog: false }));
      fall.position.set(5 * s, -30, 0.05); isl.add(fall);
      isl.position.set(x, y, 0);
      g.add(isl);
      const ph = rand() * 6;
      animated.push((t) => { isl.position.y = y + Math.sin(t * 0.35 + ph) * 1.2; });
    }
    // glowing world tree
    const tx = -10;
    g.add(shapeMesh([[tx - 2, -80], [tx - 1.2, 10], [tx - 6, 18], [tx - 0.5, 14], [tx, 22], [tx + 0.6, 14], [tx + 6, 19], [tx + 1.3, 10], [tx + 2, -80]], basic(rock)));
    for (let i = 0; i < 120; i++) {
      const a = rand() * Math.PI * 2, r = rand() * 13;
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), glow(rand() < 0.6 ? '#b07bff' : '#6ae0ff'));
      leaf.position.set(tx + Math.cos(a) * r * 1.3, 24 + Math.sin(a) * r * 0.7, 0.3); g.add(leaf);
    }
  });

  // ---------- near: rolling hills, pines and a sleeping village
  addLayer(-62, -24, 200, 0.22, (g, W) => {
    const hills = ridge(rand, W, -60, 2, 8, 14, 0.05);
    g.add(shapeMesh(hills.pts, basic('#0b0e28')));
    for (let x = 4; x < W - 4; x += 2.5 + rand() * 4) {
      const h = 3 + rand() * 4, y = 2 + rand() * 3;
      const p = shapeMesh([[x - h * 0.3, y], [x, y + h], [x + h * 0.3, y]], basic('#080a20')); p.position.z = 0.5; g.add(p);
    }
    for (let i = 0; i < 6; i++) {
      const x = 120 + i * 4.5;
      const house = shapeMesh([[x - 1.6, 4], [x - 1.6, 6.5], [x, 8.2], [x + 1.6, 6.5], [x + 1.6, 4]], basic('#0d1030')); house.position.z = 0.8; g.add(house);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), glow('#ffcf6b')); win.position.set(x, 5.6, 0.9); g.add(win);
    }
  });

  // glowing mist band right behind the planet's crown (makes the silhouette pop)
  {
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 32;
    const c = cv.getContext('2d');
    for (let y = 0; y < 32; y++) {
      const a = Math.max(0, 1 - Math.abs(y - 18) / 14);
      c.fillStyle = `rgba(120,130,255,${(a * a * 0.55).toFixed(3)})`; c.fillRect(0, y, 4, 1);
    }
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(320, 22),
      new THREE.MeshBasicMaterial({ map: pixelTexture(cv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    mist.position.set(0, -4, -30);
    root.add(mist);
  }

  return {
    update(t, walked) {
      for (const a of animated) a(t);
      for (const { holder, W, factor } of layers) {
        const v = -walked * factor;
        holder.position.x = ((v % W) + W * 1.5) % W - W / 2;
      }
    },
  };
}
