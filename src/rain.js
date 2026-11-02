// Rain streaks as line segments in a box that follows the camera.
import * as THREE from 'three';

export function createRain(scene, count) {
  const AREA = { w: 44, h: 16, zMin: -8, zMax: 7 };
  const pos = new Float32Array(count * 6);
  const speed = new Float32Array(count);
  const len = 0.45;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * AREA.w;
    const y = Math.random() * AREA.h;
    const z = AREA.zMin + Math.random() * (AREA.zMax - AREA.zMin);
    pos.set([x, y, z, x - 0.04, y - len, z], i * 6);
    speed[i] = 14 + Math.random() * 6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: '#bfefff', transparent: true, opacity: 0.32, depthWrite: false });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  scene.add(lines);

  return {
    update(dt, centerX) {
      lines.position.x = centerX;
      for (let i = 0; i < count; i++) {
        const o = i * 6;
        const d = speed[i] * dt;
        pos[o + 1] -= d; pos[o + 4] -= d;
        pos[o] -= d * 0.08; pos[o + 3] -= d * 0.08;
        if (pos[o + 4] < 0) {
          const x = (Math.random() - 0.5) * AREA.w;
          const y = AREA.h + Math.random() * 2;
          pos[o] = x; pos[o + 1] = y; pos[o + 3] = x - 0.04; pos[o + 4] = y - len;
        }
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
