// Villager pixel sprites. Art is drawn without an outline; `outlined()` adds the dark 1px
// outline used by every other sprite, so new characters are quick to author.
// Palette letters: H hair, S skin, J top, j top shade, P legs, B shoes, T hat, A/a armor, Q tabard, G fur.

/** Pad by 1px and put 'K' on empty cells that touch a filled cell. */
export function outlined(rows) {
  const w = rows[0].length + 2;
  const grid = [Array(w).fill('.'), ...rows.map((r) => ['.', ...r, '.']), Array(w).fill('.')];
  const out = grid.map((r) => [...r]);
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < w; x++) {
    if (grid[y][x] !== '.') continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx] && grid[y + dy][x + dx] !== '.');
    if (n) out[y][x] = 'K';
  }
  return out.map((r) => r.join(''));
}

const heads = {
  short: ['...HHHH...', '..HHHHHH..', '.HHSSSSHH.', '.HSKSSKSH.', '..SSSSSS..', '...SSSS...'],
  long: ['...HHHH...', '..HHHHHH..', '.HHSSSSHH.', '.HSKSSKSH.', '.HSSSSSSH.', '.HHSSSSHH.'],
  hat: ['...TTTT...', '.TTTTTTTT.', '..HSSSSH..', '..SKSSKS..', '..SSSSSS..', '...SSSS...'],
  helm: ['...AAAA...', '..AAAAAA..', '..AKKKKA..', '..AAAAAA..', '...AAAA...', '...aaaa...'],
};
const bodies = {
  tunic: ['..JJJJJJ..', '.JJjJJjJJ.', '.JJjJJjJJ.', '.SJJJJJJS.', '..JJJJJJ..'],
  dress: ['..JJJJJJ..', '.JJjJJjJJ.', '.SJJJJJJS.', '..JJJJJJ..', '.JJJJJJJJ.'],
  armor: ['..QAAAAQ..', '.AAQQQQAA.', '.AAQQQQAA.', '.SAQQQQAS.', '..QQQQQQ..'],
};
const legs = {
  stand: ['..PPPPPP..', '..PP..PP..', '..PP..PP..', '..BB..BB..'],
  step: ['..PPPPPP..', '.PP...PP..', '.PP....PP.', '.BB....BB.'],
  dress: ['.JJJJJJJJ.', '.JJJJJJJJ.', '..PP..PP..', '..BB..BB..'],
  dressStep: ['.JJJJJJJJ.', '.JJJJJJJJ.', '.PP....PP.', '.BB....BB.'],
};
const blank = '..........';

/** Build idle (2 frames) + walk (2 frames) for a villager look. */
export function villagerFrames({ head = 'short', body = 'tunic' } = {}) {
  const dress = body === 'dress';
  const h = heads[head], b = bodies[body];
  const lStand = dress ? legs.dress : legs.stand, lStep = dress ? legs.dressStep : legs.step;
  const frame = (l, bob) => outlined(bob ? [blank, ...h, ...b, ...l] : [...h, ...b, ...l, blank]);
  return { idle: [frame(lStand, false), frame(lStand, true)], walk: [frame(lStep, false), frame(lStand, true)] };
}

const cat = ['G....G..', 'GG..GG..', 'GGGGGG.G', 'GYGGYG.G', 'GGGGGGGG', '.GGGGGG.', '.G.G.G.G'];
const catTail = ['G....G..', 'GG..GG.G', 'GGGGGG.G', 'GYGGYGG.', 'GGGGGGGG', '.GGGGGG.', '.G.G.G.G'];
export const CAT = { idle: [outlined(cat), outlined(catTail)], walk: [outlined(cat), outlined(catTail)] };
