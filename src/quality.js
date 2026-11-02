// Quality tiers from the Figma "Render Spec" frame.
export const TIERS = {
  high: { name: 'high', pixelRatio: 2, shadows: 1024, rain: 6000, maxLights: 8, reflections: true, reflectionScale: 0.5, dof: true, chroma: true, bloomRes: 1 },
  medium: { name: 'medium', pixelRatio: 1.25, shadows: 512, rain: 2500, maxLights: 6, reflections: true, reflectionScale: 0.35, dof: true, chroma: false, bloomRes: 0.75 },
  low: { name: 'low', pixelRatio: 1, shadows: 0, rain: 800, maxLights: 2, reflections: false, reflectionScale: 0, dof: false, chroma: false, bloomRes: 0.5 },
};

const KEY = 'gp-quality';

export function pickQuality() {
  const q = new URLSearchParams(location.search).get('q');
  if (q && TIERS[q]) return TIERS[q];
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && TIERS[saved]) return TIERS[saved];
  } catch { /* storage blocked */ }
  const touch = matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  if (touch || innerWidth < 800) return TIERS.low;
  if (cores <= 4) return TIERS.medium;
  return TIERS.high;
}

export function saveQuality(name) {
  try { localStorage.setItem(KEY, name); } catch { /* ignore */ }
}
