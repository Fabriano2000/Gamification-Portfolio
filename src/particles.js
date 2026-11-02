// Ambient particles that follow the camera: rain streaks or drifting motes
// (sakura petals, fireflies, dust, leaves, pollen).
import * as THREE from 'three';

const AREA = { w: 46, h: 16, zMin: -8, zMax: 7 };

const KINDS = {
  rain: { color: '#bfefff', opacity: 0.32 },
  petals: { color: '#f7b7cf', size: 0.16, fall: [0.6, 1.2], sway: 1.2, opacity: 0.95 },
  leaves: { color: '#e8823a', size: 0.16, fall: [0.8, 1.4], sway: 1.4, opacity: 0.95 },
  fireflies: { color: '#d8ff7a', size: 0.14, fall: [-0.15, 0.15], sway: 0.6, opacity: 1, additive: true, pulse: true, yMax: 6 },
  pollen: { color: '#fff6b0', size: 0.08, fall: [-0.1, 0.2], sway: 0.5, opacity: 0.8, additive: true, yMax: 9 },
  dust: { color: '#fff3d6', size: 0.06, fall: [-0.05, 0.08], sway: 0.25, opacity: 0.55, additive: true, yMax: 10 },
};

function squareTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 4;
  const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, 4, 4);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
}

export function createParticles(group, kind, count) {
  const k = KINDS[kind];
  if (!k || count <= 0) return { update() {} };
  return kind === 'rain' ? rain(group, k, count) : motes(group, k, count);
}

function rain(group, k, count) {
  const pos = new Float32Array(count * 6);
  const speed = new Float32Array(count);
  const len = 0.45;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * AREA.w, y = Math.random() * AREA.h;
    const z = AREA.zMin + Math.random() * (AREA.zMax - AREA.zMin);
    pos.set([x, y, z, x - 0.04, y - len, z], i * 6);
    speed[i] = 14 + Math.random() * 6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: k.color, transparent: true, opacity: k.opacity, depthWrite: false }));
  lines.frustumCulled = false;
  group.add(lines);
  return {
    update(dt, centerX) {
      lines.position.x = centerX;
      for (let i = 0; i < count; i++) {
        const o = i * 6, d = speed[i] * dt;
        pos[o + 1] -= d; pos[o + 4] -= d; pos[o] -= d * 0.08; pos[o + 3] -= d * 0.08;
        if (pos[o + 4] < 0) {
          const x = (Math.random() - 0.5) * AREA.w, y = AREA.h + Math.random() * 2;
          pos[o] = x; pos[o + 1] = y; pos[o + 3] = x - 0.04; pos[o + 4] = y - len;
        }
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

function motes(group, k, count) {
  const yMax = k.yMax || AREA.h;
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * AREA.w;
    pos[i * 3 + 1] = Math.random() * yMax;
    pos[i * 3 + 2] = AREA.zMin + Math.random() * (AREA.zMax - AREA.zMin);
    vel[i] = k.fall[0] + Math.random() * (k.fall[1] - k.fall[0]);
    phase[i] = Math.random() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: k.color, size: k.size, map: squareTexture(), transparent: true, opacity: k.opacity,
    depthWrite: false, blending: k.additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  group.add(pts);
  let t = 0;
  return {
    update(dt, centerX) {
      t += dt;
      pts.position.x = centerX;
      for (let i = 0; i < count; i++) {
        const o = i * 3;
        pos[o + 1] -= vel[i] * dt;
        pos[o] += Math.sin(t * 0.9 + phase[i]) * k.sway * dt;
        pos[o + 2] += Math.cos(t * 0.7 + phase[i]) * k.sway * 0.4 * dt;
        if (pos[o + 1] < 0) pos[o + 1] = yMax;
        if (pos[o + 1] > yMax) pos[o + 1] = 0;
      }
      if (k.pulse) mat.opacity = 0.6 + 0.4 * Math.sin(t * 3);
      geo.attributes.position.needsUpdate = true;
    },
  };
}
