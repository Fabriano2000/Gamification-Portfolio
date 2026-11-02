// Sky for the day/night cycle: a dithered pixel gradient (shader), milky way + stars that fade in
// at night, drifting pixel clouds, a sun and two moons that rise and set, pixelated aurora ribbons,
// twinkling stars and the occasional shooting star.
import * as THREE from 'three';
import { pixelTexture } from '../pixel.js';
import { celestial } from './timeofday.js';

const SKY_Z = -200;
const HORIZON_Y = -50; // sky-plane height that lines up with the landscape horizon
const ARC_W = 170, ARC_H = 100;

const gradVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const gradFrag = /* glsl */ `
  uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor;
  varying vec2 vUv;
  void main() {
    vec2 px = floor(vUv * vec2(320.0, 160.0));
    float t = 1.0 - vUv.y;                               // 0 top .. 1 bottom
    t = clamp((t - 0.28) / 0.48, 0.0, 1.0);              // gradient spans the visible band of the plane
    float bayer = mod(px.x + px.y * 2.0, 4.0) / 4.0 - 0.375;
    float lv = floor(t * 14.0 + bayer) / 14.0;           // 14 dithered steps
    vec3 c = lv < 0.55 ? mix(uTop, uMid, lv / 0.55) : mix(uMid, uHor, (lv - 0.55) / 0.45);
    gl_FragColor = vec4(c, 1.0);
  }`;

function starsCanvas(rand) {
  const W = 512, H = 256;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  for (let i = 0; i < 2600; i++) {
    const t = rand(), x = t * W, cy = 20 + t * 150;
    const spread = 26 * (0.5 + Math.sin(t * Math.PI));
    const y = cy + (rand() + rand() + rand() - 1.5) * spread;
    const r = rand();
    c.fillStyle = r < 0.55 ? 'rgba(170,140,255,0.06)' : r < 0.8 ? 'rgba(255,160,220,0.06)' : 'rgba(255,255,255,0.6)';
    c.fillRect(Math.floor(x), Math.floor(y), r < 0.8 ? 2 : 1, 1);
  }
  for (let i = 0; i < 500; i++) {
    c.fillStyle = `rgba(255,255,255,${0.25 + rand() * 0.6})`;
    c.fillRect(Math.floor(rand() * W), Math.floor(rand() * H * 0.8), 1, 1);
  }
  return pixelTexture(cv);
}

function discCanvas(r, core, halo, craters = []) {
  const S = (r + 8) * 2, C = S / 2;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const disc = (rr, col) => { c.fillStyle = col; for (let k = -rr; k <= rr; k++) { const hw = Math.floor(Math.sqrt(rr * rr - k * k)); c.fillRect(C - hw, C + k, hw * 2, 1); } };
  if (halo) { disc(r + 7, halo.replace('A', '0.10')); disc(r + 4, halo.replace('A', '0.18')); }
  disc(r, core);
  c.fillStyle = 'rgba(0,0,30,0.18)';
  for (const [x, y, s] of craters) c.fillRect(C + x, C + y, s, s);
  return pixelTexture(cv);
}

function cloudsCanvas(rand) {
  const W = 512, H = 96;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const cx = Math.floor(rand() * W), cy = 14 + Math.floor(rand() * 64), len = 20 + Math.floor(rand() * 50);
    c.fillStyle = 'rgba(190,200,230,0.9)'; c.fillRect(cx, cy + 3, len, 4);
    c.fillStyle = '#ffffff'; c.fillRect(cx + 3, cy, len - 8, 4); c.fillRect(cx + 8, cy - 3, Math.floor(len / 2), 3);
    if (cx + len > W) { c.fillStyle = '#ffffff'; c.fillRect(0, cy, cx + len - W, 4); }
  }
  const t = pixelTexture(cv); t.wrapS = THREE.RepeatWrapping;
  return t;
}

const auroraVert = /* glsl */ `
  uniform float uTime; uniform float uPhase; varying vec2 vUv;
  void main() {
    vUv = uv; vec3 p = position;
    p.y += sin(p.x * 0.025 + uTime * 0.25 + uPhase) * 9.0 + sin(p.x * 0.06 - uTime * 0.4) * 3.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const auroraFrag = /* glsl */ `
  uniform float uTime; uniform float uPhase; uniform float uStrength; uniform vec3 uColA; uniform vec3 uColB;
  varying vec2 vUv;
  void main() {
    vec2 q = floor(vUv * vec2(220.0, 28.0)) / vec2(220.0, 28.0);
    float curtain = 0.5 + 0.5 * sin(q.x * 60.0 + uTime * 0.8 + uPhase) * sin(q.x * 23.0 - uTime * 0.5);
    float fade = smoothstep(0.0, 0.25, q.y) * (1.0 - smoothstep(0.35, 1.0, q.y));
    float edge = 1.0 - smoothstep(0.0, 0.08, min(q.x, 1.0 - q.x));
    float a = fade * (0.35 + 0.65 * curtain) * (1.0 - edge) * 0.55 * uStrength;
    gl_FragColor = vec4(mix(uColA, uColB, q.y) * 1.6, a);
  }`;
const starVert = /* glsl */ `
  attribute float aSize; attribute float aPhase; uniform float uTime; uniform float uStrength; varying float vAlpha;
  void main() {
    vAlpha = uStrength * (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (1.0 + aPhase * 0.3) + aPhase * 10.0)));
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const starFrag = /* glsl */ `varying float vAlpha; void main(){ gl_FragColor = vec4(vec3(1.4,1.45,1.6) * vAlpha, vAlpha); }`;

export function createSky(scene, quality, rand) {
  const group = new THREE.Group();
  group.name = 'sky';
  scene.add(group);
  const layer = (mesh, z) => { mesh.position.z = SKY_Z + z; mesh.renderOrder = -10 + z; group.add(mesh); return mesh; };
  const additive = { transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending };

  // gradient
  const grad = new THREE.ShaderMaterial({
    uniforms: { uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() } },
    vertexShader: gradVert, fragmentShader: gradFrag, depthWrite: false, fog: false,
  });
  layer(new THREE.Mesh(new THREE.PlaneGeometry(560, 280), grad), 0).position.y = -2;

  // milky way + static stars
  const starsMat = new THREE.MeshBasicMaterial({ map: starsCanvas(rand), ...additive });
  layer(new THREE.Mesh(new THREE.PlaneGeometry(560, 280), starsMat), 1).position.y = -2;

  // sun + moons
  const sunMat = new THREE.MeshBasicMaterial({ map: discCanvas(12, '#fff6d8', 'rgba(255,230,170,A)'), transparent: true, depthWrite: false, fog: false });
  const sun = layer(new THREE.Mesh(new THREE.PlaneGeometry(40, 40), sunMat), 2);
  const moonMat = new THREE.MeshBasicMaterial({ map: discCanvas(21, '#f2f4ff', 'rgba(170,195,255,A)', [[-8, -8, 5], [5, 4, 7], [-4, 9, 3], [8, -11, 3]]), transparent: true, depthWrite: false, fog: false });
  const moon = layer(new THREE.Mesh(new THREE.PlaneGeometry(52, 52), moonMat), 2);
  const moon2Mat = new THREE.MeshBasicMaterial({ map: discCanvas(6, '#ffc6e4', 'rgba(255,170,220,A)'), transparent: true, depthWrite: false, fog: false });
  const moon2 = layer(new THREE.Mesh(new THREE.PlaneGeometry(22, 22), moon2Mat), 2);

  // twinkling stars
  const n = quality.name === 'low' ? 220 : 650;
  const pos = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n);
  const dpr = Math.min(devicePixelRatio, quality.pixelRatio);
  for (let i = 0; i < n; i++) { pos.set([(rand() - 0.5) * 520, -40 + rand() * 120, 0], i * 3); size[i] = (rand() < 0.12 ? 3 : 2) * dpr; phase[i] = rand(); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  sg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const starMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uStrength: { value: 1 } }, vertexShader: starVert, fragmentShader: starFrag, ...additive });
  const stars = layer(new THREE.Points(sg, starMat), 3);
  stars.frustumCulled = false;

  // aurora
  const auroras = [
    { y: 40, w: 380, h: 46, a: '#2affb0', b: '#7a5aff', phase: 0, z: 20 },
    { y: 54, w: 300, h: 34, a: '#4ad8ff', b: '#ff6ad8', phase: 2.1, z: 25 },
  ].map((o) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPhase: { value: o.phase }, uStrength: { value: 1 }, uColA: { value: new THREE.Color(o.a) }, uColB: { value: new THREE.Color(o.b) } },
      vertexShader: auroraVert, fragmentShader: auroraFrag, ...additive, side: THREE.DoubleSide,
    });
    const m = layer(new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h, 96, 1), mat), o.z);
    m.position.set(-40 + o.phase * 30, o.y, m.position.z);
    return mat;
  });

  // clouds
  const cloudTex = cloudsCanvas(rand);
  cloudTex.repeat.set(1.4, 1);
  const cloudMat = new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false });
  layer(new THREE.Mesh(new THREE.PlaneGeometry(560, 70), cloudMat), 30).position.y = 6;

  // shooting star
  const streakCv = document.createElement('canvas'); streakCv.width = 64; streakCv.height = 2;
  const sc = streakCv.getContext('2d');
  for (let x = 0; x < 64; x++) { sc.fillStyle = `rgba(255,255,255,${(x / 64) ** 2})`; sc.fillRect(x, 0, 1, 2); }
  const streak = layer(new THREE.Mesh(new THREE.PlaneGeometry(26, 0.5), new THREE.MeshBasicMaterial({ map: pixelTexture(streakCv), ...additive })), 15);
  streak.visible = false;
  let next = 3, shoot = null, nightNow = 1;

  const arc = (mesh, frac, lift = 0) => {
    mesh.visible = frac !== null;
    if (frac === null) return;
    mesh.position.x = -ARC_W + frac * ARC_W * 2;
    mesh.position.y = HORIZON_Y + Math.sin(Math.PI * frac) * ARC_H + lift;
  };

  return {
    group,
    /** Apply a time-of-day sample (see timeofday.js). */
    setTime(tod) {
      grad.uniforms.uTop.value.copy(tod.top);
      grad.uniforms.uMid.value.copy(tod.mid);
      grad.uniforms.uHor.value.copy(tod.hor);
      const n = tod.night;
      nightNow = n;
      starsMat.opacity = n ** 1.5;
      starMat.uniforms.uStrength.value = n ** 1.5;
      for (const a of auroras) a.uniforms.uStrength.value = Math.max(0, (n - 0.6) / 0.4);
      cloudMat.color.copy(tod.cloud);
      cloudMat.opacity = 0.95 - 0.55 * n;
      const { sun: sf, moon: mf } = celestial(tod.hour);
      arc(sun, sf);
      if (sf !== null) {
        const low = 1 - Math.sin(Math.PI * sf);               // near the horizon → orange
        sunMat.color.setRGB(1, 1 - low * 0.35, 1 - low * 0.7);
      }
      arc(moon, mf, 8);
      arc(moon2, mf === null ? null : Math.max(0, Math.min(1, mf * 0.85 + 0.05)), -20);
      moon2.position.x -= 120;
      moonMat.opacity = moon2Mat.opacity = Math.min(1, n * 1.5);
    },
    update(t, dt) {
      starMat.uniforms.uTime.value = t;
      for (const m of auroras) m.uniforms.uTime.value = t;
      cloudTex.offset.x = t * 0.004;
      next -= dt;
      if (!shoot && next <= 0 && nightNow > 0.8) {
        const x = (Math.random() - 0.2) * 260, y = 10 + Math.random() * 50, ang = -0.35 - Math.random() * 0.3;
        shoot = { x, y, ang, t: 0, dur: 0.9 };
        streak.rotation.z = ang; streak.visible = true;
      }
      if (shoot) {
        shoot.t += dt;
        const k = shoot.t / shoot.dur, d = k * 90;
        streak.position.x = shoot.x + Math.cos(shoot.ang) * d;
        streak.position.y = shoot.y + Math.sin(shoot.ang) * d;
        streak.material.opacity = Math.sin(Math.PI * Math.min(1, k));
        if (k >= 1) { shoot = null; streak.visible = false; next = 4 + Math.random() * 7; }
      }
    },
  };
}
