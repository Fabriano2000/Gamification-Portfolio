// Day/night cycle driven by how far you've walked: one lap around the planet = one day.
// 0° (home) is dawn, the day passes as you walk, night falls around the lighthouse and
// fades back into dawn just before you get home again.
import * as THREE from 'three';

export const START_HOUR = 5;               // hour at rotation 0°
export const hourAt = (rotDeg) => (((START_HOUR + rotDeg / 15) % 24) + 24) % 24; // 360° = 24h

const NIGHT = {
  name: 'NIGHT', top: '#04030d', mid: '#14123e', hor: '#2c3c72', shade: '#05061a', fog: '#232a5a',
  hemiSky: '#5a6ac0', hemiGround: '#0a0814', hemi: 0.6, key: '#9fb8ff', keyI: 1.7,
  mist: '#7882ff', mistA: 0.55, cloud: '#232650', night: 1, bloom: 1.35, thr: 0.55,
};
// Keyframes by hour; the list wraps around at 24h.
const KEYS = [
  { h: 0, ...NIGHT },
  { h: 4.2, ...NIGHT, hor: '#3a3a7a', mist: '#8a82ff' },
  { h: 5.3, name: 'DAWN', top: '#2a2a6a', mid: '#7a4a8a', hor: '#ff9a7a', shade: '#1c1630', fog: '#6a4a7a', hemiSky: '#c8a0c8', hemiGround: '#2a1a2a', hemi: 1.0, key: '#ffb08a', keyI: 1.8, mist: '#ffb0c0', mistA: 0.45, cloud: '#ff9ab0', night: 0.45, bloom: 1.0, thr: 0.65 },
  { h: 7, name: 'MORNING', top: '#4a8ad8', mid: '#8ab8e8', hor: '#ffe0b8', shade: '#3a4a6a', fog: '#a8c0e0', hemiSky: '#d8e8ff', hemiGround: '#4a5a3a', hemi: 1.3, key: '#fff0d0', keyI: 2.6, mist: '#ffffff', mistA: 0.22, cloud: '#ffffff', night: 0, bloom: 0.55, thr: 0.85 },
  { h: 12, name: 'NOON', top: '#2f6fd8', mid: '#6aaaf0', hor: '#c4e4fc', shade: '#3a5a7a', fog: '#b8d4f0', hemiSky: '#e8f2ff', hemiGround: '#4a6a3a', hemi: 1.5, key: '#fffaf0', keyI: 3.0, mist: '#ffffff', mistA: 0.18, cloud: '#ffffff', night: 0, bloom: 0.45, thr: 0.9 },
  { h: 16.3, name: 'AFTERNOON', top: '#3a6ac8', mid: '#8aa8d8', hor: '#ffd8a0', shade: '#4a4a6a', fog: '#d8c0b0', hemiSky: '#ffe8d0', hemiGround: '#4a4a3a', hemi: 1.3, key: '#ffd8a0', keyI: 2.6, mist: '#fff0d0', mistA: 0.22, cloud: '#fff0e0', night: 0, bloom: 0.55, thr: 0.85 },
  { h: 18.3, name: 'SUNSET', top: '#3a3a8a', mid: '#c86a7a', hor: '#ff8a3a', shade: '#2a1a3a', fog: '#a05a6a', hemiSky: '#ffb0a0', hemiGround: '#2a1a2a', hemi: 1.05, key: '#ff8a4a', keyI: 2.1, mist: '#ffa070', mistA: 0.45, cloud: '#ff8a6a', night: 0.2, bloom: 0.95, thr: 0.7 },
  { h: 19.6, name: 'DUSK', top: '#14123e', mid: '#4a2a6a', hor: '#a04a7a', shade: '#120c26', fog: '#3a2a5a', hemiSky: '#8a6ab0', hemiGround: '#140c1c', hemi: 0.8, key: '#c08aff', keyI: 1.6, mist: '#c080ff', mistA: 0.5, cloud: '#5a3a7a', night: 0.75, bloom: 1.2, thr: 0.6 },
  { h: 21, ...NIGHT },
  { h: 24, ...NIGHT },
];
const COLOR_KEYS = ['top', 'mid', 'hor', 'shade', 'fog', 'hemiSky', 'hemiGround', 'key', 'mist', 'cloud'];
const NUM_KEYS = ['hemi', 'keyI', 'mistA', 'night', 'bloom', 'thr'];
const cache = KEYS.map((k) => Object.fromEntries(COLOR_KEYS.map((c) => [c, new THREE.Color(k[c])])));

const out = Object.fromEntries(COLOR_KEYS.map((c) => [c, new THREE.Color()]));

/** Interpolated look for a given hour. Returns a shared object (don't keep references). */
export function sample(hour) {
  let i = 0;
  while (i < KEYS.length - 2 && hour >= KEYS[i + 1].h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const f = THREE.MathUtils.smoothstep(hour, a.h, b.h);
  for (const c of COLOR_KEYS) out[c].copy(cache[i][c]).lerp(cache[i + 1][c], f);
  for (const n of NUM_KEYS) out[n] = a[n] + (b[n] - a[n]) * f;
  out.name = f < 0.5 ? a.name : b.name;
  out.hour = hour;
  return out;
}

/** Sun (6:00–19:00) or moon (19:00–6:00) position along a sky arc, frac 0..1 left→right. */
export function celestial(hour) {
  const sunFrac = (hour - 5.5) / (19.2 - 5.5);
  const nightH = (hour - 18.8 + 24) % 24;
  const moonFrac = nightH / (24 - 18.8 + 5.8);
  return {
    sun: sunFrac >= 0 && sunFrac <= 1 ? sunFrac : null,
    moon: moonFrac >= 0 && moonFrac <= 1 ? moonFrac : null,
  };
}

export const formatClock = (hour) => {
  const h = Math.floor(hour), m = Math.floor((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m - (m % 5)).padStart(2, '0')}`;
};
