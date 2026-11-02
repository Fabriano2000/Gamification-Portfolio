// Pixel-art data + canvas texture generators.
// Each sprite is an array of strings; each character maps to a palette color, '.' = transparent.
// Everything is drawn at runtime, so the project needs no image files.
import * as THREE from 'three';

export const PAL = {
  // original cyberpunk set (matches Figma)
  K: '#0d0221', H: '#3b1f6b', h: '#5a2d9c', S: '#f2b48a', V: '#00f0ff', v: '#0088aa',
  J: '#ff2a6d', j: '#b0164a', P: '#1f1f4a', B: '#2b2b3b', W: '#ffffff', G: '#6b7a99',
  g: '#46506b', Y: '#ffe14d', M: '#2a2350', R: '#ff3b3b', D: '#1d0b3a', d: '#140726',
  L: '#3b1f6b', O: '#ffcf6b', o: '#c98a2e', E: '#24103f', n: '#00f0ff', m: '#ff7ad9',
  // extended set for the other environments
  T: '#9a6a3a', t: '#5e3b1e', N: '#4fae4f', u: '#2a6a32', A: '#9aa0ae', a: '#5e6372',
  C: '#f0c04a', c: '#a8782a', F: '#f2e6c4', f: '#d8dce6', Q: '#d8343c', q: '#8a1a24',
  X: '#3a7bd5', x: '#1d3f7a', Z: '#dff6ff', U: '#ff8a2a', I: '#c07bff', i: '#2ac4b0',
  e: '#8a6a4a', b: '#5e4430', l: '#b8966c', p: '#f7b7cf', w: '#eef0f4', s: '#33363f',
};
const PAL_KEYS = Object.keys(PAL);

const blank = (n = 12) => '.'.repeat(n);

// ---------- Player (front, idle)
const front = [
  '....KKKK....', '...KHHHHK...', '..KHhhhhHK..', '..KHSSSSHK..', '..KVVVVVVK..', '..KHSSSSHK..',
  '...KSSSSK...', '..KJJJJJJK..', '.KJJjJJjJJK.', '.KJJjJJjJJK.', '.KSJJJJJJSK.', '..KJJJJJJK..',
  '..KPPPPPPK..', '..KPPKKPPK..', '..KPK..KPK..', '..KBK..KBK..', '.KBBK..KBBK.', '.KKKK..KKKK.',
];
const idleDown = [blank(), ...front.slice(0, 13), ...front.slice(14)];
export const PLAYER_IDLE = [
  [...front, blank()],
  idleDown,
  idleDown.map((r, i) => (i === 5 ? '..KVWVVVVK..' : r)),
  [...front, blank()],
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
  return bob ? [...body, blank()] : [blank(), ...body];
};
export const PLAYER_WALK = [
  sideF(armA, legContact, false), sideF(armB, legMid, false), sideF(armB, legPass, true),
  sideF(armC, legContact, false), sideF(armB, legMid, false), sideF(armB, legPass, true),
];

// ---------- NPCs
const botTop = [
  '...KKKKKK...', '..KGGGGGGK..', '..KGVGGVGK..', '..KGGGGGGK..', '..KGKKKKGK..', '...KKKKKK...',
  '.....KK.....', '..KKGGGGKK..', '.KGGGYYGGGK.', '.KGGGYYGGGK.', '.KGgGGGGgGK.', '..KGGGGGGK..',
  '..KGK..KGK..', '..KKK..KKK..',
];
export const BOT_IDLE = [
  [blank(), blank(), ...botTop],
  [blank(), ...botTop.map((r, i) => (i === 2 ? '..KGKGGKGK..' : r)), blank()],
  [blank(), ...botTop, blank()],
  [blank(), blank(), ...botTop.map((r, i) => (i === 10 ? '.KGgGYYGgGK.' : r))],
];
const wizard = [
  '.....KK.....', '....KXXK....', '...KXXXK....', '...KXXXXK...', '..KXXCXXXK..', '.KKKKKKKKKK.',
  '...KSSSSK...', '...KSKKSK...', '...KWWWWK...', '..KXWWWWXK..', '.KXXXWWXXXK.', '.KXXXXXXXXK.',
  '.KSXXXXXXSK.', '..KXXXXXXK..', '..KXXXXXXK..', '..KxXXXXxK..', '.KxxxxxxxxK.', '.KKKKKKKKKK.',
];
export const WIZARD_IDLE = [
  [blank(), ...wizard],
  [blank(), ...wizard.map((r, i) => (i === 4 ? '..KXXYXXXK..' : r))],
  [...wizard, blank()],
  [blank(), ...wizard],
];

// ---------- Project stations (one per environment)
export const TERMINAL = [[
  'KKKKKKKKKKKKKK', 'KMMMMMMMMMMMMK', 'KMVVVVVVVVVVMK', 'KMVvvVVVvvVVMK', 'KMVVVVVVVVVVMK', 'KMVvvvvVVVVVMK',
  'KMVVVVVVVvvVMK', 'KMVVVVVVVVVVMK', 'KMMMMMMMMMMMMK', 'KKKKKKKKKKKKKK', '.....KMMK.....', '.....KMMK.....',
  '...KKKMMKKK...', '..KMMMMMMMMK..', '..KMJMYMVMMK..', '..KMMMMMMMMK..', '..KKKKKKKKKK..',
]];
export const NOTICE_BOARD = [[
  'KKKKKKKKKKKKKKKK', 'KttttttttttttttK', '.KTTTTTTTTTTTTK.', '.KTFFFFTFFFFFTK.', '.KTFKKFTFKKKFTK.', '.KTFFFFTFFFFFTK.',
  '.KTFKKFTFKKFFTK.', '.KTFFFFTFFFFFTK.', '.KTTTTTTTTTTTTK.', '.KTFFFFFFTFFFTK.', '.KTFKKKKFTFKFTK.', '.KTFFFFFFTFFFTK.',
  '.KTTTTTTTTTTTTK.', '.KKKKKKKKKKKKKK.', '...KtK....KtK...', '...KtK....KtK...', '...KtK....KtK...', '..KKKKK..KKKKK..',
]];
export const RUNESTONE = [[
  '....KKKKKK....', '...KAAAAAAK...', '..KAAaAAAAAK..', '..KAAIIIIAAK..', '..KAAIAAIAAK..', '..KAAAIIAAAK..',
  '..KAAAIIAAaK..', '..KAAIAAIAAK..', '..KAAIIIIAAK..', '..KAaAAAAAAK..', '..KAAAIIAAAK..', '..KAAAIIAAAK..',
  '..KAAAAAAaAK..', '..KAAAAAAAAK..', '.KNNAAAAAANNK.', 'KNuNNNNNNNNuNK', 'KuuNNuNNuNNuuK', 'KKKKKKKKKKKKKK',
]];
export const PEDESTAL = [[
  '......KK......', '.....KCCK.....', '....KCCCCK....', '...KCcCCcCK...', '...KCCQCCCK...', '....KCCCCK....',
  '.....KCCK.....', '....KKKKKK....', '..KKKKKKKKKK..', '..KffffffffK..', '...KffffffK...', '...KfWffffK...',
  '...KffffffK...', '...KfffffWK...', '...KffffffK...', '..KffffffffK..', '.KKKKKKKKKKKK.', 'KffffffffffffK',
]];
export const KIOSK = [[
  'KKKKKKKKKKKKKK', 'KxxxxxxxxxxxxK', 'KxZZZZZZZZZZxK', 'KxZXXZZZZZZZxK', 'KxZZZZZXXXZZxK', 'KxZXXXXZZZZZxK',
  'KxZZZZZZZZZZxK', 'KxZXXXZZZXXZxK', 'KxZZZZZZZZZZxK', 'KxxxxxxxxxxxxK', 'KxxxxXXXXxxxxK', 'KKKKKKKKKKKKKK',
  '....KffffK....', '....KffffK....', '....KffffK....', '....KffffK....', '....KffffK....', '...KffffffK...',
  '..KKKKKKKKKK..',
]];
export const VENDING = [[
  'KKKKKKKKKKKKKK', 'KQQQQQQQQQQQQK', 'KQZZZZZZZZZZQK', 'KQZXZUZiZCZZQK', 'KQZXZUZiZCZZQK', 'KQZKZKZKZKZZQK',
  'KQZZZZZZZZZZQK', 'KQZNZFZXZUZZQK', 'KQZNZFZXZUZZQK', 'KQZKZKZKZKZZQK', 'KQZZZZZZZZZZQK', 'KQQQQQQQQQQQQK',
  'KQQKKKKQQQYQQK', 'KQQKffKQQQQQQK', 'KQQKKKKQQQQQQK', 'KQQQQQQQQQQQQK', 'KqKKKKKKKKKKqK', 'KqKaaaaaaaaKqK',
  'KqKKKKKKKKKKqK', 'KqqqqqqqqqqqqK', 'KKKKKKKKKKKKKK',
]];
export const DESK = [[
  '.....KKKKKKKK.....', '.....KZZZZZZK.....', '.....KZXXZZZK.....', '.....KZZZXXZK.....', '.....KZXZZZZK.....',
  '.....KKKKKKKK.....', '........KK........', '......KKKKKK..KQK.', 'KKKKKKKKKKKKKKKKKK', 'KTTTTTTTTTTTTTTTTK',
  'KttttttttttttttttK', '.Kt............tK.', '.Kt............tK.', '.Kt............tK.', '.KK............KK.',
]];
export const MAILBOX = [[
  '..KKKKKKKK..', '.KJJJJJJJJK.', 'KJJWWWWWWJJK', 'KJJWKKKKWJJK', 'KJJWWWWWWJJK', 'KjjjjjjjjjjK',
  'KKKKKKKKKKKK', '.....KK.....', '.....KK.....', '.....KK.....', '....KKKK....',
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

/** Recolor map where only `glowChars` keep their color (for emissive maps). */
export function glowRecolor(glowChars, base = {}) {
  const r = {};
  for (const c of PAL_KEYS) r[c] = glowChars.includes(c) ? base[c] || PAL[c] : '#000000';
  return r;
}

/** Horizontal sprite-sheet texture from frames. */
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

// ---------- 16x16 tiles
const tileRows = (fn) => Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => fn(x, y)).join(''));
export const TILES = {
  facade_brick: tileRows((x, y) => (y % 4 === 3 ? 'D' : (x + (Math.floor(y / 4) % 2) * 4) % 8 === 7 ? 'D' : (x * 7 + y * 3) % 11 === 0 ? 'L' : 'E')),
  street_wet: tileRows((x, y) => (y === 0 || x === 0 ? 'D' : (x * 5 + y * 11) % 41 === 0 ? 'm' : (x * 3 + y * 7) % 37 === 0 ? 'n' : 'K')),
  metal_panel: tileRows((x, y) => (x === 0 || y === 0 ? 'K' : (x === 2 || x === 13) && (y === 2 || y === 13) ? 'G' : y === 8 ? 'K' : 'M')),
  cobble: tileRows((x, y) => {
    const off = (Math.floor(y / 4) % 2) * 3;
    if (y % 4 === 3 || (x + off) % 6 === 5) return 'a';
    if (y % 4 === 0 && (x + off) % 6 === 0) return 'f';
    return (x * 3 + y * 5) % 13 === 0 ? 'G' : 'A';
  }),
  plank: tileRows((x, y) => (y % 4 === 3 ? 't' : (x + Math.floor(y / 4) * 5) % 16 === 0 ? 't' : (x * 3 + y * 5) % 13 === 0 ? 'e' : 'T')),
  plaster_timber: tileRows((x, y) => (x % 8 === 0 || y === 0 || (y < 8 && x % 8 === y) ? 't' : (x * 5 + y * 3) % 17 === 0 ? 'l' : 'F')),
  roof_red: tileRows((x, y) => (y % 4 === 3 ? 'q' : (x + (Math.floor(y / 4) % 2) * 2) % 4 === 0 ? 'q' : y % 4 === 0 ? 'U' : 'Q')),
  roof_slate: tileRows((x, y) => (y % 4 === 3 ? 's' : (x + (Math.floor(y / 4) % 2) * 2) % 4 === 0 ? 's' : y % 4 === 0 ? 'A' : 'a')),
  roof_dark: tileRows((x, y) => (y % 3 === 2 ? 'K' : x % 4 === 0 ? 's' : 'B')),
  thatch: tileRows((x, y) => ((x * 7 + y * 2) % 5 === 0 ? 'c' : y % 4 === 0 ? 'e' : 'o')),
  grass: tileRows((x, y) => ((x * 7 + y * 13) % 11 === 0 ? 'u' : (x * 5 + y * 3) % 29 === 0 ? 'C' : (x * 2 + y * 9) % 23 === 0 ? 'W' : 'N')),
  dirt_path: tileRows((x, y) => ((x * 7 + y * 3) % 9 === 0 ? 'b' : (x * 2 + y * 11) % 13 === 0 ? 'l' : 'e')),
  stone_block: tileRows((x, y) => (y % 8 === 7 || (x + (Math.floor(y / 8) % 2) * 8) % 16 === 15 ? 'a' : y % 8 === 0 ? 'f' : (x * 3 + y * 7) % 19 === 0 ? 'G' : 'A')),
  marble: tileRows((x, y) => (x === 0 || y === 0 ? 'A' : (x + y * 2) % 13 === 0 || (x * 2 - y + 32) % 17 === 0 ? 'f' : 'w')),
  glass_curtain: tileRows((x, y) => (x % 4 === 0 || y % 8 === 0 ? 'a' : (x + y) % 11 < 2 ? 'X' : 'x')),
  concrete: tileRows((x, y) => (x === 0 || y === 0 ? 'A' : (x * 5 + y * 7) % 13 === 0 ? 'A' : 'f')),
  asphalt: tileRows((x, y) => ((x * 7 + y * 5) % 11 === 0 ? 'g' : (x * 3 + y * 13) % 17 === 0 ? 'a' : 'B')),
  jp_tile: tileRows((x, y) => (x % 8 === 0 || y % 8 === 0 ? 'A' : (x * 3 + y) % 7 === 0 ? 'w' : 'f')),
  jp_wall: tileRows((x, y) => (y % 8 === 7 ? 'a' : (x * 5 + y * 3) % 23 === 0 ? 'A' : 'f')),
  carpet: tileRows((x, y) => ((x + y) % 4 === 0 && x % 2 === 0 ? 'X' : 'x')),
  parquet: tileRows((x, y) => {
    const bx = Math.floor(x / 4), by = Math.floor(y / 8);
    const v = (bx + by) % 2 === 0;
    if (v ? x % 4 === 3 : y % 4 === 3) return 't';
    return (x * 3 + y * 5) % 11 === 0 ? 'e' : 'T';
  }),
  office_wall: tileRows((x, y) => (x === 0 ? 'A' : y === 15 ? 'a' : 'w')),
};

export function tileTexture(name, repeatX = 1, repeatY = 1, recolor) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 16;
  paint(cv.getContext('2d'), TILES[name], 0, 0, recolor);
  const t = pixelTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  return t;
}

/**
 * Building facade texture: a wall tile with a grid of windows.
 * opts.style: 'grid' (square windows) | 'arched' (fantasy) | 'bands' (office/modern strips) | 'none'
 * Returns {map, emissiveMap}; 1 texel = 1 art pixel.
 */
export function facadeTextures(cols, rows, rand, opts = {}) {
  const {
    wall = 'facade_brick', wallRecolor, style = 'grid', litChance = 0.45,
    litColors = ['#ffcf6b', '#ffcf6b', '#ffcf6b', '#ff7ad9', '#00f0ff'],
    unlit = '#140726', frame = '#3b1f6b', shutters = null, cellW = 14, cellH = 16,
  } = opts;
  const W = cols * cellW, H = rows * cellH;
  const base = document.createElement('canvas');
  base.width = W; base.height = H;
  const glow = document.createElement('canvas');
  glow.width = W; glow.height = H;
  const b = base.getContext('2d'), g = glow.getContext('2d');
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) paint(b, TILES[wall], x, y, wallRecolor);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (style === 'none') return { map: pixelTexture(base), emissiveMap: pixelTexture(glow), W, H };
  for (let r = 0; r < rows; r++) {
    if (style === 'bands') {
      const y = r * cellH + 4, h = 8;
      b.fillStyle = frame; b.fillRect(0, y - 1, W, h + 2);
      for (let x = 1; x < W - 1; x += 6) {
        const lit = rand() < litChance;
        const col = lit ? litColors[Math.floor(rand() * litColors.length)] : unlit;
        b.fillStyle = col; b.fillRect(x, y, 5, h);
        if (lit) { g.fillStyle = col; g.fillRect(x, y, 5, h); }
      }
      continue;
    }
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + 3, y = r * cellH + 4, w = cellW - 6, h = cellH - 7;
      const lit = rand() < litChance;
      const col = lit ? litColors[Math.floor(rand() * litColors.length)] : unlit;
      b.fillStyle = frame; b.fillRect(x - 1, y - 1, w + 2, h + 2);
      b.fillStyle = col; b.fillRect(x, y, w, h);
      if (lit) { g.fillStyle = col; g.fillRect(x, y, w, h); }
      if (style === 'arched') {
        // knock the top corners off and add a mullion cross
        b.fillStyle = frame; b.fillRect(x, y, 1, 1); b.fillRect(x + w - 1, y, 1, 1);
        g.fillStyle = '#000'; g.fillRect(x, y, 1, 1); g.fillRect(x + w - 1, y, 1, 1);
        b.fillRect(x + Math.floor(w / 2), y, 1, h); g.fillRect(x + Math.floor(w / 2), y, 1, h);
      }
      b.fillStyle = frame; b.fillRect(x, y + Math.floor(h / 2), w, 1);
      g.fillStyle = '#000'; g.fillRect(x, y + Math.floor(h / 2), w, 1);
      if (shutters) { b.fillStyle = shutters; b.fillRect(x - 3, y - 1, 2, h + 2); b.fillRect(x + w + 1, y - 1, 2, h + 2); }
    }
  }
  return { map: pixelTexture(base), emissiveMap: pixelTexture(glow), W, H };
}

/**
 * Sign texture. style:
 *  'neon'  dark board, glowing border + text
 *  'wood'  carved wooden board (no glow)
 *  'plaque' brass plaque, dark text
 *  'panel' lit light-box (billboard / office wall)
 */
export function signTexture(text, opts = {}) {
  const { color = '#ffe14d', px = 8, font = 'Press Start 2P', style = 'neon', vertical = false, bg, ink } = opts;
  const f = `${px}px "${font}"`;
  const m = document.createElement('canvas').getContext('2d');
  m.font = f;
  const chars = [...text];
  const pad = 4;
  let w, h;
  if (vertical) {
    const cw = Math.max(...chars.map((c) => m.measureText(c).width));
    w = Math.ceil(cw) + pad * 2; h = chars.length * (px + 2) + pad * 2 - 2;
  } else {
    w = Math.ceil(m.measureText(text).width) + pad * 2; h = px + pad * 2;
  }
  const styles = {
    neon: { bg: bg || '#0b0620', border: color, text: color, glow: true },
    wood: { bg: bg || '#5e3b1e', border: '#2e1a0c', text: ink || '#f2e6c4', glow: false },
    plaque: { bg: bg || '#c9a24a', border: '#7a5a1a', text: ink || '#2a1a0a', glow: false },
    panel: { bg: bg || '#f4f6fb', border: color, text: ink || color, glow: true },
  }[style];
  const draw = (ctx, isGlow) => {
    ctx.fillStyle = isGlow ? (style === 'panel' ? styles.bg : '#000') : styles.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = isGlow && style !== 'neon' ? '#000' : styles.border;
    ctx.lineWidth = 2; ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.font = f; ctx.textBaseline = 'top';
    ctx.fillStyle = styles.text;
    if (vertical) chars.forEach((c, i) => ctx.fillText(c, (w - m.measureText(c).width) / 2, pad + i * (px + 2)));
    else ctx.fillText(text, pad, pad);
  };
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), false);
  let emissiveMap = null;
  if (styles.glow) {
    const em = document.createElement('canvas'); em.width = w; em.height = h; draw(em.getContext('2d'), true);
    emissiveMap = pixelTexture(em);
  }
  return { map: pixelTexture(cv), emissiveMap, w, h };
}

/** Pixel sky: color bands, stars, sun/moon, clouds. */
export function skyTexture(rand, { bands, stars = 0, body, clouds }) {
  const W = 256, H = 128;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const bh = Math.ceil(H / bands.length);
  bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * bh, W, bh); });
  for (let i = 0; i < stars; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.7})`;
    ctx.fillRect(Math.floor(rand() * W), Math.floor(rand() * 70), 1, 1);
  }
  if (body) {
    const { x, y, r, color, halo } = body;
    if (halo) { ctx.fillStyle = halo; for (let k = -r - 3; k <= r + 3; k++) { const hw = Math.floor(Math.sqrt((r + 3) ** 2 - k * k)); ctx.fillRect(x - hw, y + k, hw * 2, 1); } }
    ctx.fillStyle = color;
    for (let k = -r; k <= r; k++) { const hw = Math.floor(Math.sqrt(r * r - k * k)); ctx.fillRect(x - hw, y + k, hw * 2, 1); }
  }
  if (clouds) {
    for (let i = 0; i < clouds.count; i++) {
      const cx = Math.floor(rand() * W), cy = 10 + Math.floor(rand() * 50), len = 14 + Math.floor(rand() * 26);
      ctx.fillStyle = clouds.shade; ctx.fillRect(cx, cy + 2, len, 3);
      ctx.fillStyle = clouds.color; ctx.fillRect(cx + 2, cy, len - 6, 3); ctx.fillRect(cx + 6, cy - 2, Math.floor(len / 2), 2);
    }
  }
  return pixelTexture(cv);
}

/** Small procedural pixel painting for the museum walls. */
export function paintingTexture(rand, kind) {
  const W = 24, H = 18;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const px = (col, x, y, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  if (kind === 'landscape') {
    ['#7ec8ff', '#9ad6ff', '#c4e6ff', '#ffe6b0'].forEach((col, i) => px(col, 0, i * 3, W, 3));
    px('#fff4c0', 17, 2, 3, 3);
    for (let x = 0; x < W; x++) { const h = 4 + Math.floor(Math.abs(Math.sin(x * 0.5 + rand() * 0.3)) * 4); px('#6a7fa8', x, 12 - h, 1, h + 1); }
    px('#4fae4f', 0, 12, W, 3); px('#2a6a8a', 0, 15, W, 3); px('#7ec8ff', 3, 16, 6, 1);
  } else if (kind === 'portrait') {
    px('#3a2a4a', 0, 0, W, H); px('#5a3a6a', 0, 0, W, 4);
    px('#2a1a0a', 8, 2, 8, 6); px('#f2b48a', 9, 4, 6, 6); px('#0d0221', 10, 6); px('#0d0221', 13, 6);
    px('#8a1a24', 6, 10, 12, 8); px('#f0c04a', 11, 11, 2, 2);
  } else {
    const cols = ['#d8343c', '#3a7bd5', '#f0c04a', '#eef0f4', '#eef0f4'];
    px('#eef0f4', 0, 0, W, H);
    for (let i = 0; i < 6; i++) px(cols[Math.floor(rand() * cols.length)], Math.floor(rand() * 18), Math.floor(rand() * 12), 3 + Math.floor(rand() * 8), 3 + Math.floor(rand() * 6));
    px('#0d0221', 8, 0, 1, H); px('#0d0221', 0, 9, W, 1); px('#0d0221', 16, 9, 1, 9);
  }
  return pixelTexture(cv);
}

/** Two-color stripe texture (awnings, banners). */
export function stripeTexture(a, b, n = 8) {
  const cv = document.createElement('canvas'); cv.width = n * 2; cv.height = 4;
  const c = cv.getContext('2d');
  for (let i = 0; i < n * 2; i++) { c.fillStyle = i % 4 < 2 ? a : b; c.fillRect(i, 0, 1, 4); }
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 3, n * 2, 1);
  return pixelTexture(cv);
}

/** Deterministic RNG so each environment looks the same on every load. */
export function rng(seed = 1337) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
