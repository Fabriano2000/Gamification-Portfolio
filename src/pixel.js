// Pixel-art data lifted 1:1 from the Figma "Sprite Sheets" and "Texture Tiles" frames.
// Each sprite is an array of strings; each character maps to a palette color, '.' = transparent.
// Textures are generated at runtime on a canvas, so no image files are needed.
import * as THREE from 'three';

export const PAL = {
  K: '#0d0221', H: '#3b1f6b', h: '#5a2d9c', S: '#f2b48a', V: '#00f0ff', v: '#0088aa',
  J: '#ff2a6d', j: '#b0164a', P: '#1f1f4a', B: '#2b2b3b', W: '#ffffff', G: '#6b7a99',
  g: '#46506b', Y: '#ffe14d', M: '#2a2350', R: '#ff3b3b', D: '#1d0b3a', d: '#140726',
  L: '#3b1f6b', O: '#ffcf6b', o: '#c98a2e', E: '#24103f', n: '#00f0ff', m: '#ff7ad9',
};

const blank = '............';

// ---------- Player (front, idle)
const front = [
  '....KKKK....', '...KHHHHK...', '..KHhhhhHK..', '..KHSSSSHK..', '..KVVVVVVK..', '..KHSSSSHK..',
  '...KSSSSK...', '..KJJJJJJK..', '.KJJjJJjJJK.', '.KJJjJJjJJK.', '.KSJJJJJJSK.', '..KJJJJJJK..',
  '..KPPPPPPK..', '..KPPKKPPK..', '..KPK..KPK..', '..KBK..KBK..', '.KBBK..KBBK.', '.KKKK..KKKK.',
];
const idleDown = [blank, ...front.slice(0, 13), ...front.slice(14)];
export const PLAYER_IDLE = [
  [...front, blank],
  idleDown,
  idleDown.map((r, i) => (i === 5 ? '..KVWVVVVK..' : r)),
  [...front, blank],
];

// ---------- Player (side, walking right)
const sideHead = ['....KKKK....', '...KHHHHK...', '..KHHhhhhK..', '..KHHSSSSK..', '..KHHVVVVVK.', '..KHHSSSSK..', '...KHSSSK...', '...KJJJJK...'];
const armA = ['..KJJJJJJK..', '..KJJJjjjKK.', '..KJJJJJKSK.', '..KJJJJJJK..'];
const armB = ['..KJJjJJJK..', '..KJJjJJJK..', '..KJJjJJJK..', '..KJJSJJJK..'];
const armC = ['..KjjJJJJK..', '..KjJJJJJK..', '.KSKJJJJJK..', '..KJJJJJJK..'];
const hips = '..KPPPPPPK..';
const legContact = ['..KPPK.KPPK.', '.KPK....KPK.', '.KPK....KBK.', 'KBBK....KBBK', 'KKK.....KKKK'];
const legMid = ['..KPPKKPPK..', '..KPK.KPK...', '.KPK...KBK..', '.KBK...KBBK.', '.KKK...KKKK.'];
const legPass = ['...KPPPPK...', '...KPKPK....', '...KPKBK....', '...KBBKBBK..', '...KKKKKKK..'];
const sideF = (arm, legs, bob) => {
  const body = [...sideHead, ...arm, hips, ...legs];
  return bob ? [...body, blank] : [blank, ...body];
};
export const PLAYER_WALK = [
  sideF(armA, legContact, false), sideF(armB, legMid, false), sideF(armB, legPass, true),
  sideF(armC, legContact, false), sideF(armB, legMid, false), sideF(armB, legPass, true),
];

// ---------- Guide bot
const botTop = [
  '...KKKKKK...', '..KGGGGGGK..', '..KGVGGVGK..', '..KGGGGGGK..', '..KGKKKKGK..', '...KKKKKK...',
  '.....KK.....', '..KKGGGGKK..', '.KGGGYYGGGK.', '.KGGGYYGGGK.', '.KGgGGGGgGK.', '..KGGGGGGK..',
  '..KGK..KGK..', '..KKK..KKK..',
];
export const BOT_IDLE = [
  [blank, blank, ...botTop],
  [blank, ...botTop.map((r, i) => (i === 2 ? '..KGKGGKGK..' : r)), blank],
  [blank, ...botTop, blank],
  [blank, blank, ...botTop.map((r, i) => (i === 10 ? '.KGgGYYGgGK.' : r))],
];

// ---------- Props
export const TERMINAL = [[
  'KKKKKKKKKKKKKK', 'KMMMMMMMMMMMMK', 'KMVVVVVVVVVVMK', 'KMVvvVVVvvVVMK', 'KMVVVVVVVVVVMK', 'KMVvvvvVVVVVMK',
  'KMVVVVVVVvvVMK', 'KMVVVVVVVVVVMK', 'KMMMMMMMMMMMMK', 'KKKKKKKKKKKKKK', '.....KMMK.....', '.....KMMK.....',
  '...KKKMMKKK...', '..KMMMMMMMMK..', '..KMJMYMVMMK..', '..KMMMMMMMMK..', '..KKKKKKKKKK..',
]];
export const SHARD = [['..KK..', '.KVVK.', 'KVWVVK', 'KVVVvK', '.KVvK.', '..KK..']];

// ---------- Canvas helpers
function paint(ctx, rows, ox = 0, oy = 0, recolor) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === '.') continue;
      ctx.fillStyle = (recolor && recolor[c]) || PAL[c];
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  });
}

export function pixelTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Build a horizontal sprite-sheet texture from frames. Returns {texture, frames, w, h}. */
export function sheetTexture(frames, recolor) {
  const w = frames[0][0].length;
  const h = frames[0].length;
  const cv = document.createElement('canvas');
  cv.width = w * frames.length;
  cv.height = h;
  const ctx = cv.getContext('2d');
  frames.forEach((f, i) => paint(ctx, f, i * w, 0, recolor));
  const texture = pixelTexture(cv);
  texture.repeat.set(1 / frames.length, 1);
  return { texture, frames: frames.length, w, h };
}

// ---------- 16x16 tiles (same formulas as the Figma Texture Tiles frame)
const tileRows = (fn) => Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => fn(x, y)).join(''));
export const TILES = {
  facade_brick: tileRows((x, y) => (y % 4 === 3 ? 'D' : (x + (Math.floor(y / 4) % 2) * 4) % 8 === 7 ? 'D' : (x * 7 + y * 3) % 11 === 0 ? 'L' : 'E')),
  street_wet: tileRows((x, y) => (y === 0 || x === 0 ? 'D' : (x * 5 + y * 11) % 41 === 0 ? 'm' : (x * 3 + y * 7) % 37 === 0 ? 'n' : 'K')),
  metal_panel: tileRows((x, y) => (x === 0 || y === 0 ? 'K' : (x === 2 || x === 13) && (y === 2 || y === 13) ? 'G' : y === 8 ? 'K' : 'M')),
};

export function tileTexture(name, repeatX = 1, repeatY = 1) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 16;
  paint(cv.getContext('2d'), TILES[name]);
  const t = pixelTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  return t;
}

/**
 * Building facade: brick tile with a grid of windows, some lit.
 * Returns {map, emissiveMap}. 1 texel = 1 art pixel; caller sets repeat via geometry size.
 */
export function facadeTextures(cols, rows, rand, litChance = 0.45, litColor = '#ffcf6b') {
  const cw = 14, ch = 16; // pixels per window cell
  const W = cols * cw, H = rows * ch;
  const base = document.createElement('canvas');
  base.width = W; base.height = H;
  const glow = document.createElement('canvas');
  glow.width = W; glow.height = H;
  const b = base.getContext('2d'), g = glow.getContext('2d');
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) paint(b, TILES.facade_brick, x, y);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw + 3, y = r * ch + 4, w = 8, h = 9;
      const lit = rand() < litChance;
      b.fillStyle = '#140726'; b.fillRect(x - 1, y - 1, w + 2, h + 2);
      if (lit) {
        const col = rand() < 0.15 ? '#ff7ad9' : rand() < 0.2 ? '#00f0ff' : litColor;
        b.fillStyle = col; b.fillRect(x, y, w, h);
        g.fillStyle = col; g.fillRect(x, y, w, h);
        b.fillStyle = '#3b1f6b'; b.fillRect(x, y + 4, w, 1);
        g.fillStyle = '#000'; g.fillRect(x, y + 4, w, 1);
      } else {
        b.fillStyle = '#1d0b3a'; b.fillRect(x, y, w, h);
        b.fillStyle = '#3b1f6b'; b.fillRect(x + 1, y + 1, 1, 1);
      }
    }
  }
  return { map: pixelTexture(base), emissiveMap: pixelTexture(glow), W, H };
}

/** Neon text sign rendered with the pixel font (font must already be loaded). */
export function neonTexture(text, color, px = 8) {
  const font = `${px}px "Press Start 2P"`;
  const m = document.createElement('canvas').getContext('2d');
  m.font = font;
  const w = Math.ceil(m.measureText(text).width) + 8;
  const h = px + 8;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#0b0620'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.font = font; ctx.textBaseline = 'top'; ctx.fillStyle = color;
  ctx.fillText(text, 4, 4);
  const emi = document.createElement('canvas');
  emi.width = w; emi.height = h;
  const e = emi.getContext('2d');
  e.fillStyle = '#000'; e.fillRect(0, 0, w, h);
  e.strokeStyle = color; e.lineWidth = 2; e.strokeRect(1, 1, w - 2, h - 2);
  e.font = font; e.textBaseline = 'top'; e.fillStyle = color; e.fillText(text, 4, 4);
  return { map: pixelTexture(cv), emissiveMap: pixelTexture(emi), w, h };
}

/** Deterministic RNG so the city looks the same on every load. */
export function rng(seed = 1337) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
