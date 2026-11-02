// Night sky: painted pixel dome (gradient, milky way, two moons), twinkling stars,
// pixelated aurora ribbons and the occasional shooting star. The sky is the main light source.
import * as THREE from 'three';
import { pixelTexture } from '../pixel.js';

const SKY_Z = -200;

function skyCanvas(rand) {
  const W = 512, H = 256;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  // dithered vertical gradient: deep navy at the top -> violet -> teal glow on the horizon
  const stops = ['#04030d', '#070720', '#0c0c30', '#14123e', '#1e164a', '#2a1c56', '#382260', '#3a2c6a', '#2c3c72', '#1f5574'];
  const band = H / stops.length;
  for (let y = 0; y < H; y++) {
    const f = y / band, i = Math.min(stops.length - 1, Math.floor(f)), frac = f - i;
    for (let x = 0; x < W; x += 2) {
      const dither = ((x >> 1) + y) % 4 / 4;
      c.fillStyle = frac > 0.5 + dither * 0.5 && i + 1 < stops.length ? stops[i + 1] : stops[i];
      c.fillRect(x, y, 2, 1);
    }
  }
  // milky way: a diagonal haze band with dense tiny stars
  for (let i = 0; i < 2600; i++) {
    const t = rand();
    const x = t * W, cy = 20 + t * 150;
    const spread = 26 * (0.5 + Math.sin(t * Math.PI));
    const y = cy + (rand() + rand() + rand() - 1.5) * spread;
    const r = rand();
    c.fillStyle = r < 0.55 ? 'rgba(170,140,255,0.10)' : r < 0.8 ? 'rgba(255,160,220,0.10)' : 'rgba(255,255,255,0.55)';
    c.fillRect(Math.floor(x), Math.floor(y), r < 0.8 ? 3 : 1, r < 0.8 ? 2 : 1);
  }
  // static background stars
  for (let i = 0; i < 500; i++) {
    c.fillStyle = `rgba(255,255,255,${0.2 + rand() * 0.6})`;
    c.fillRect(Math.floor(rand() * W), Math.floor(rand() * H * 0.8), 1, 1);
  }
  // moons
  const disc = (cx, cy, r, col) => { c.fillStyle = col; for (let k = -r; k <= r; k++) { const hw = Math.floor(Math.sqrt(r * r - k * k)); c.fillRect(cx - hw, cy + k, hw * 2, 1); } };
  disc(390, 58, 34, 'rgba(160,190,255,0.08)');
  disc(390, 58, 28, 'rgba(180,200,255,0.14)');
  disc(390, 58, 21, '#f2f4ff');
  c.fillStyle = '#c9d0f0';
  [[382, 50, 5], [397, 63, 7], [386, 68, 3], [399, 47, 3]].forEach(([x, y, s]) => c.fillRect(x, y, s, s));
  disc(118, 44, 9, 'rgba(255,170,220,0.15)');
  disc(118, 44, 6, '#ffc6e4');
  c.fillStyle = '#e8a0c8'; c.fillRect(116, 42, 2, 2);
  return pixelTexture(cv);
}

const auroraVert = /* glsl */ `
  uniform float uTime; uniform float uPhase;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.y += sin(p.x * 0.025 + uTime * 0.25 + uPhase) * 9.0 + sin(p.x * 0.06 - uTime * 0.4) * 3.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const auroraFrag = /* glsl */ `
  uniform float uTime; uniform float uPhase; uniform vec3 uColA; uniform vec3 uColB;
  varying vec2 vUv;
  void main() {
    vec2 q = floor(vUv * vec2(220.0, 28.0)) / vec2(220.0, 28.0);          // pixelate
    float curtain = 0.5 + 0.5 * sin(q.x * 60.0 + uTime * 0.8 + uPhase) * sin(q.x * 23.0 - uTime * 0.5);
    float fade = smoothstep(0.0, 0.25, q.y) * (1.0 - smoothstep(0.35, 1.0, q.y));
    float edge = 1.0 - smoothstep(0.0, 0.08, min(q.x, 1.0 - q.x));
    vec3 col = mix(uColA, uColB, q.y);
    float a = fade * (0.35 + 0.65 * curtain) * (1.0 - edge) * 0.55;
    gl_FragColor = vec4(col * 1.6, a);
  }`;

const starVert = /* glsl */ `
  attribute float aSize; attribute float aPhase;
  uniform float uTime; varying float vAlpha;
  void main() {
    vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (1.0 + aPhase * 0.3) + aPhase * 10.0));
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * mv;
  }`;
const starFrag = /* glsl */ `
  varying float vAlpha;
  void main() { gl_FragColor = vec4(vec3(1.4, 1.45, 1.6) * vAlpha, vAlpha); }`;

export function createSky(scene, quality, rand) {
  const group = new THREE.Group();
  group.name = 'sky';
  scene.add(group);

  const dome = new THREE.Mesh(new THREE.PlaneGeometry(560, 280), new THREE.MeshBasicMaterial({ map: skyCanvas(rand), fog: false, depthWrite: false }));
  dome.position.set(0, -2, SKY_Z);
  group.add(dome);

  // twinkling stars (screen-pixel sized squares)
  const n = quality.name === 'low' ? 220 : 650;
  const pos = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n);
  const dpr = Math.min(devicePixelRatio, quality.pixelRatio);
  for (let i = 0; i < n; i++) {
    pos.set([(rand() - 0.5) * 520, -10 + rand() * 140, SKY_Z + 5], i * 3);
    size[i] = (rand() < 0.12 ? 3 : 2) * dpr;
    phase[i] = rand();
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  sg.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, vertexShader: starVert, fragmentShader: starFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const stars = new THREE.Points(sg, starMat);
  stars.frustumCulled = false;
  group.add(stars);

  // aurora ribbons
  const auroras = [
    { y: 46, z: SKY_Z + 20, w: 380, h: 46, a: '#2affb0', b: '#7a5aff', phase: 0 },
    { y: 60, z: SKY_Z + 25, w: 300, h: 34, a: '#4ad8ff', b: '#ff6ad8', phase: 2.1 },
  ].map((o) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPhase: { value: o.phase }, uColA: { value: new THREE.Color(o.a) }, uColB: { value: new THREE.Color(o.b) } },
      vertexShader: auroraVert, fragmentShader: auroraFrag,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h, 96, 1), mat);
    m.position.set(-40 + o.phase * 30, o.y, o.z);
    group.add(m);
    return mat;
  });

  // shooting star
  const streakCv = document.createElement('canvas'); streakCv.width = 64; streakCv.height = 2;
  const sc = streakCv.getContext('2d');
  for (let x = 0; x < 64; x++) { sc.fillStyle = `rgba(255,255,255,${(x / 64) ** 2})`; sc.fillRect(x, 0, 1, 2); }
  const streak = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 0.5),
    new THREE.MeshBasicMaterial({ map: pixelTexture(streakCv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  );
  streak.visible = false;
  group.add(streak);
  let next = 3, shoot = null;

  return {
    group,
    update(t, dt) {
      starMat.uniforms.uTime.value = t;
      for (const m of auroras) m.uniforms.uTime.value = t;
      next -= dt;
      if (!shoot && next <= 0) {
        const x = (Math.random() - 0.2) * 260, y = 40 + Math.random() * 60;
        const ang = -0.35 - Math.random() * 0.3;
        shoot = { x, y, ang, t: 0, dur: 0.9 };
        streak.rotation.z = ang;
        streak.visible = true;
      }
      if (shoot) {
        shoot.t += dt;
        const k = shoot.t / shoot.dur;
        const d = k * 90;
        streak.position.set(shoot.x + Math.cos(shoot.ang) * d, shoot.y + Math.sin(shoot.ang) * d, SKY_Z + 15);
        streak.material.opacity = Math.sin(Math.PI * Math.min(1, k));
        if (k >= 1) { shoot = null; streak.visible = false; next = 4 + Math.random() * 7; }
      }
    },
  };
}
