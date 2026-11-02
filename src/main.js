// Planet Walk: a silhouette walks on top of a tiny round world under a fantasy night sky.
// Walking turns the planet; portfolio stops come round one after another and loop forever.
import * as THREE from 'three';
import { content } from './content.js';
import { createPlanet, R, wrap180 } from './planet/planet.js';
import { createSky } from './planet/sky.js';
import { createBackdrop } from './planet/backdrop.js';
import { hourAt, sample, celestial, formatClock } from './planet/timeofday.js';
import { createParticles } from './particles.js';
import { PixelSprite } from './sprite.js';
import { PLAYER_IDLE, PLAYER_WALK, rng } from './pixel.js';
import { createPost } from './post.js';
import { pickQuality, saveQuality } from './quality.js';
import * as ui from './ui.js';

const $ = (s) => document.querySelector(s);
ui.fillStatic(content);

// Silhouette: every color goes near-black, the outline becomes a cool moonlit rim, the visor keeps a faint glow.
const SILHOUETTE = { K: '#7486e0', H: '#07060f', h: '#0a0916', S: '#0a0916', J: '#07060f', j: '#05040c', P: '#07060f', B: '#05040c', W: '#9ad8ff', V: '#7ac8ff' };

const SPEED = 5;   // world units per second along the rim
const AUTO_SPEED = 3.2; // auto tour walks a little slower
const AUTO_PAUSE = 3.5; // seconds the auto tour stops at each portfolio stop
const ACCEL = 20;

function webglAvailable() {
  try { return !!(window.WebGL2RenderingContext && document.createElement('canvas').getContext('webgl2')); } catch { return false; }
}

async function boot() {
  await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise((r) => setTimeout(r, 2500))]);
  if (!webglAvailable()) {
    $('#btn-start').disabled = true;
    $('#btn-start').textContent = 'NO WEBGL :(';
    ui.openQuick(content);
    return;
  }

  const quality = pickQuality();
  const renderer = new THREE.WebGLRenderer({ powerPreference: 'high-performance', antialias: false, stencil: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality.pixelRatio));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = quality.shadows > 0;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('#stage').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05040f');
  scene.fog = new THREE.FogExp2('#232a5a', 0.0045);

  // Camera: long lens, slightly above, the planet's crown in the lower third (like the sketch).
  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 1, 600);
  const CAM_DIST = 48, CAM_PITCH = THREE.MathUtils.degToRad(5), LOOK_Y = 7.5;
  const frameCamera = () => {
    // keep the planet crown readable on tall/narrow screens by backing off a little
    const narrow = Math.max(1, 1.2 / camera.aspect);
    const d = CAM_DIST * Math.min(narrow, 1.8);
    camera.position.set(0, LOOK_Y + d * Math.sin(CAM_PITCH), d * Math.cos(CAM_PITCH));
    camera.lookAt(0, LOOK_Y, 0);
  };
  frameCamera();

  // Lighting: the night sky is the light. Cool moonlight from behind-right rims everything,
  // a soft violet sky fill keeps shapes readable, warm points come from windows and fires.
  // Colors/intensities below are overwritten every frame by the day/night cycle.
  const hemi = new THREE.HemisphereLight('#5a6ac0', '#0a0814', 1.0);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight('#9fb8ff', 2.2); // key light: the sun by day, the moon by night
  moon.position.set(22, 30, -24);
  moon.castShadow = quality.shadows > 0;
  if (moon.castShadow) {
    moon.shadow.mapSize.set(quality.shadows, quality.shadows);
    Object.assign(moon.shadow.camera, { left: -30, right: 30, top: 20, bottom: -14, near: 1, far: 90 });
    moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03;
  }
  scene.add(moon);
  const front = new THREE.DirectionalLight('#6a5aff', 0.25);
  front.position.set(-10, 8, 30);
  scene.add(front);

  const rand = rng(2112);
  const sky = createSky(scene, quality, rand);
  const backdrop = createBackdrop(scene, rand);
  const planet = createPlanet(scene, quality, rand, content);
  const fireflies = createParticles(scene, 'fireflies', quality.name === 'low' ? 60 : 160);
  const pollen = createParticles(scene, 'pollen', quality.name === 'low' ? 60 : 160);
  const FILL_NIGHT = new THREE.Color('#6a5aff'), FILL_DAY = new THREE.Color('#fff4e8');

  // Player silhouette, fixed on the crown of the planet.
  const player = new PixelSprite({ frames: PLAYER_IDLE, scale: 1.6, fps: 4, glowChars: 'VW', glow: 1.4, recolor: SILHOUETTE });
  player.addSheet('walk', PLAYER_WALK, 'VW');
  player.mesh.position.set(0, 0, 0.8);
  scene.add(player.mesh);

  const focus = new THREE.Vector3(0, 1, 0.8);
  const post = createPost(renderer, scene, camera, quality, focus, { focusDistance: CAM_DIST, focusRange: 16 });
  post.applyTheme({ bloom: 1.35, threshold: 0.55, vignette: 0.62, chroma: true });

  ui.buildRing(planet.stations);

  // ---------- State
  let state = 'title'; // title | play | dialog
  let rot = -6;        // planet rotation in degrees (walked distance / R)
  let vel = 0;
  let facing = 1;
  const input = { left: false, right: false };
  let nearest = null;
  const dialog = ui.createDialog();

  // Auto tour: walks the loop by itself and pauses at each portfolio stop.
  let auto = false, autoPause = 0, autoSeen = null;
  const setAuto = (v) => { auto = v; autoPause = 0; autoSeen = null; ui.setAuto(v); };

  const startGame = (withAuto = false) => {
    if (state !== 'title') return;
    $('#title').hidden = true;
    $('#hud').hidden = false;
    if (matchMedia('(pointer: coarse)').matches) $('#touch').hidden = false;
    if (withAuto) { state = 'play'; setAuto(true); return; }
    state = 'dialog';
    dialog.show('SAGE', [
      `Welcome, traveler. This little world belongs to ${content.name}.`,
      'Walk with A/D or the arrow keys. The world turns beneath your feet.',
      'Every light on the horizon is a chapter of their story. Press E when you reach one.',
      'Tired feet? Press T for the auto tour.',
    ], () => { state = 'play'; });
  };

  const talk = (lines, who = 'SAGE') => { state = 'dialog'; dialog.show(who, lines, () => { state = 'play'; }); };

  const interact = () => {
    if (ui.anyOverlayOpen()) return;
    if (state === 'title') return startGame();
    if (state === 'dialog') return dialog.next();
    if (!nearest) return;
    switch (nearest.kind) {
      case 'about': ui.openAbout(content); break;
      case 'skills': ui.openSkills(content); break;
      case 'project': ui.openProject(content.projects[nearest.index], nearest.index, ['#c07bff', '#2ac4b0', '#f0c04a']); break;
      case 'career': ui.openCareer(content); break;
      case 'contact': ui.openContact(content); break;
      case 'npc': talk(nearest.lines, nearest.name); break;
    }
  };

  // ---------- Input
  const keys = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  addEventListener('keydown', (e) => {
    if (keys[e.key]) { input[keys[e.key]] = true; if (auto) setAuto(false); return; }
    if (e.key === 'Escape') {
      if (ui.closeOverlay('#modal') || ui.closeOverlay('#quick') || ui.closeOverlay('#menu')) return;
      ui.openMenu(quality.name);
      return;
    }
    if (ui.anyOverlayOpen()) return;
    if (['e', 'E', 'Enter', ' '].includes(e.key)) { e.preventDefault(); interact(); }
    if ((e.key === 'q' || e.key === 'Q') && state !== 'title') ui.openQuick(content);
    if ((e.key === 't' || e.key === 'T') && state !== 'title') setAuto(!auto);
  });
  addEventListener('keyup', (e) => { if (keys[e.key]) input[keys[e.key]] = false; });
  addEventListener('blur', () => { input.left = input.right = false; });

  $('#btn-start').addEventListener('click', () => startGame());
  $('#btn-quick').addEventListener('click', () => ui.openQuick(content));
  $('#btn-settings').addEventListener('click', () => ui.openMenu(quality.name));
  $('#btn-tour').addEventListener('click', () => startGame(true));
  $('#btn-auto').addEventListener('click', (e) => { setAuto(!auto); e.currentTarget.blur(); });
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => ui.closeOverlay('#' + b.closest('.overlay').id)));
  document.querySelectorAll('.overlay').forEach((o) => o.addEventListener('click', (e) => { if (e.target === o) ui.closeOverlay('#' + o.id); }));
  $('#menu').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const { act, q } = btn.dataset;
    if (act === 'resume') ui.closeOverlay('#menu');
    if (act === 'quick') { ui.closeOverlay('#menu'); ui.openQuick(content); }
    if (q && q !== quality.name) { saveQuality(q); location.reload(); }
  });
  document.querySelectorAll('#touch button').forEach((b) => {
    const k = b.dataset.key;
    const down = (e) => { e.preventDefault(); if (k === 'act') interact(); else input[k] = true; };
    const up = () => { if (k !== 'act') input[k] = false; };
    b.addEventListener('pointerdown', down);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, up));
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    frameCamera();
    renderer.setSize(innerWidth, innerHeight);
    post.composer.setSize(innerWidth, innerHeight);
  });

  // ---------- Loop
  const clock = new THREE.Clock();
  const v = new THREE.Vector3();
  const toScreen = (p) => { v.copy(p).project(camera); return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight]; };

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // movement → planet rotation
    const canMove = state === 'play' && !ui.anyOverlayOpen();
    let dir = canMove ? (input.right ? 1 : 0) - (input.left ? 1 : 0) : 0;
    if (state === 'title') dir = 0;
    if (canMove && auto) {
      // `nearest` is from the previous frame: stop once at each portfolio stop, then carry on
      if (nearest && nearest.kind !== 'npc' && nearest !== autoSeen) { autoSeen = nearest; autoPause = AUTO_PAUSE; }
      if (!nearest) autoSeen = null;
      autoPause -= dt;
      dir = autoPause > 0 ? 0 : 1;
    }
    const target = dir * (auto ? AUTO_SPEED : SPEED);
    vel += Math.sign(target - vel) * Math.min(Math.abs(target - vel), ACCEL * dt);
    if (state === 'title') rot += dt * 3;                 // idle spin behind the title screen
    else rot += THREE.MathUtils.radToDeg((vel * dt) / R);
    planet.setRotation(rot);
    planet.group.updateMatrixWorld();

    // player animation
    if (dir !== 0) facing = dir;
    const moving = Math.abs(vel) > 0.3;
    player.play(moving ? 'walk' : 'default');
    player.setFps(moving ? 10 : 4);
    player.mesh.scale.x = moving ? facing : 1;
    player.update(dt);

    const walked = THREE.MathUtils.degToRad(rot) * R;
    sky.update(t, dt);
    backdrop.update(t, walked);
    planet.update(t, dt);
    fireflies.update(dt, 0);
    pollen.update(dt, 0);

    // ---------- day/night: one lap = one day, starting at dawn
    const hour = hourAt(rot);
    const tod = sample(hour);
    sky.setTime(tod);
    backdrop.setTime(tod);
    planet.setNight(tod.night);
    hemi.color.copy(tod.hemiSky); hemi.groundColor.copy(tod.hemiGround); hemi.intensity = tod.hemi;
    moon.color.copy(tod.key); moon.intensity = tod.keyI;
    const { sun: sf, moon: mf } = celestial(hour);
    const arc = sf ?? mf ?? 0.5;
    moon.position.set(-40 + arc * 80, 10 + Math.sin(Math.PI * arc) * 30, -24); // always behind the planet: rim light
    front.color.copy(FILL_NIGHT).lerp(FILL_DAY, 1 - tod.night); front.intensity = 0.25 + 0.35 * (1 - tod.night);
    scene.fog.color.copy(tod.fog);
    scene.background.copy(tod.top);
    post.applyTheme({ bloom: tod.bloom, threshold: tod.thr, vignette: 0.5 + 0.12 * tod.night, chroma: true });
    fireflies.setStrength(tod.night);
    pollen.setStrength(1 - tod.night);
    ui.setClock(`${tod.name} · ${formatClock(hour)}`);
    ui.setRing(rot);

    // nearest stop → card / prompt / section label
    nearest = state === 'play' && !ui.anyOverlayOpen() ? planet.nearest(rot) : null;
    if (nearest?.kind === 'project') {
      const [x, y] = toScreen(planet.anchorWorld(nearest));
      ui.showCard(content.projects[nearest.index], nearest.index, x, y, nearest.color);
      ui.hidePrompt();
    } else if (nearest) {
      const [x, y] = toScreen(planet.anchorWorld(nearest));
      ui.hideCard();
      ui.showPrompt(nearest.kind === 'npc' ? 'E  TALK' : `E  ${nearest.label.split(' · ').pop()}`, x, y);
    } else {
      ui.hideCard();
      ui.hidePrompt();
    }
    // the next stop ahead (shown in the HUD)
    const ahead = planet.stations
      .filter((s) => s.kind !== 'npc')
      .map((s) => ({ s, d: wrap180(s.deg - rot) * (facing || 1) }))
      .filter((o) => o.d > -4.5)
      .sort((a, b) => a.d - b.d)[0];
    const town = planet.placeAt(rot);
    ui.setSection(nearest && nearest.kind !== 'npc' ? nearest.label : town ? `~ ${town} ~` : ahead ? `NEXT: ${ahead.s.label}` : '');

    post.composer.render(dt);
  });

  window.__game = { scene, camera, planet, startGame, setRot: (d) => { rot = d; }, get rot() { return rot; }, get auto() { return auto; } };
}

boot();
