import * as THREE from 'three';
import { content } from './content.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { createRain } from './rain.js';
import { createPost } from './post.js';
import { pickQuality, saveQuality } from './quality.js';
import * as ui from './ui.js';

const $ = (s) => document.querySelector(s);
ui.fillStatic(content);

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}

async function boot() {
  // Neon sign textures use the pixel font, so wait for it (but never hang on it).
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
  // Camera rig from the Figma spec: fov 24, pitched down 18°, distance 18, riding a rail along X.
  const camera = new THREE.PerspectiveCamera(24, innerWidth / innerHeight, 0.5, 400);
  const DIST = 30, PITCH = THREE.MathUtils.degToRad(16), LOOK_Y = 2.4;

  const world = buildWorld(scene, quality, content);
  const player = new Player(scene);
  const rain = createRain(scene, quality.rain);
  const focus = new THREE.Vector3();
  const { composer } = createPost(renderer, scene, camera, quality, focus);

  // ---------- State
  let state = 'title'; // title | play | dialog
  let camX = -10;
  let shards = 0;
  let nearest = null;
  const dialog = ui.createDialog();

  const startGame = () => {
    if (state !== 'title') return;
    $('#title').hidden = true;
    $('#hud').hidden = false;
    if (matchMedia('(pointer: coarse)').matches) $('#touch').hidden = false;
    state = 'dialog';
    dialog.show('GUIDE-BOT', content.intro, () => { state = 'play'; });
  };

  const interact = () => {
    if (ui.anyOverlayOpen()) return;
    if (state === 'title') return startGame();
    if (state === 'dialog') return dialog.next();
    if (!nearest) return;
    if (nearest.kind === 'project') ui.openProject(content.projects[nearest.index], nearest.index);
    if (nearest.kind === 'bot') {
      state = 'dialog';
      dialog.show('GUIDE-BOT', [
        `${shards} of ${world.shards.length} data shards collected.`,
        'Each terminal is a quest. Press E at one to read the full log.',
      ], () => { state = 'play'; });
    }
  };

  // ---------- Input
  const keys = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  addEventListener('keydown', (e) => {
    if (keys[e.key]) { player.input[keys[e.key]] = true; return; }
    if (e.key === 'Escape') {
      if (ui.closeOverlay('#modal') || ui.closeOverlay('#quick') || ui.closeOverlay('#menu')) return;
      if (state !== 'title') ui.openMenu(quality.name);
      return;
    }
    if (ui.anyOverlayOpen()) return; // let buttons/links inside overlays handle Enter/Space
    if (['e', 'E', 'Enter', ' '].includes(e.key)) { e.preventDefault(); interact(); }
    if ((e.key === 'q' || e.key === 'Q') && state !== 'title') ui.openQuick(content);
  });
  addEventListener('keyup', (e) => { if (keys[e.key]) player.input[keys[e.key]] = false; });
  addEventListener('blur', () => { player.input.left = player.input.right = false; });

  $('#btn-start').addEventListener('click', startGame);
  $('#btn-quick').addEventListener('click', () => ui.openQuick(content));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => ui.closeOverlay('#' + b.closest('.overlay').id)));
  document.querySelectorAll('.overlay').forEach((o) => o.addEventListener('click', (e) => { if (e.target === o) ui.closeOverlay('#' + o.id); }));
  $('#menu').addEventListener('click', (e) => {
    const act = e.target.dataset.act, q = e.target.dataset.q;
    if (act === 'resume') ui.closeOverlay('#menu');
    if (act === 'quick') { ui.closeOverlay('#menu'); ui.openQuick(content); }
    if (q && q !== quality.name) { saveQuality(q); location.reload(); }
  });
  document.querySelectorAll('#touch button').forEach((b) => {
    const k = b.dataset.key;
    const down = (e) => { e.preventDefault(); if (k === 'act') interact(); else player.input[k] = true; };
    const up = () => { if (k !== 'act') player.input[k] = false; };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  // ---------- Loop
  const clock = new THREE.Clock();
  const v = new THREE.Vector3();
  const toScreen = (p) => { v.copy(p).project(camera); return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight]; };

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    player.frozen = state !== 'play' || ui.anyOverlayOpen();
    player.update(dt);
    world.update(t, dt);

    // camera: slow drift on the title screen, rail-follow with look-ahead while playing
    const targetX = state === 'title' ? Math.sin(t * 0.08) * 9 : player.x + player.facing * 1.5;
    camX += (targetX - camX) * (state === 'title' ? 1 : Math.min(1, dt * 4.8));
    camera.position.set(camX, LOOK_Y + DIST * Math.sin(PITCH), DIST * Math.cos(PITCH));
    camera.lookAt(camX, LOOK_Y, 0);
    focus.set(player.x, 1, 0);
    world.moon.position.set(camX - 8, 18, 14);
    world.moon.target.position.set(camX, 0, 0);
    rain.update(dt, camX);

    // shards
    for (const s of world.shards) {
      if (!s.taken && state === 'play' && Math.abs(player.x - s.x) < 0.6) {
        s.taken = true; s.sprite.mesh.visible = false; shards++;
        ui.setShards(shards, world.shards.length);
      }
    }

    // nearest interactable → floating card / prompt
    nearest = null;
    if (state === 'play' && !ui.anyOverlayOpen()) {
      let best = Infinity;
      for (const it of world.interactables) {
        const d = Math.abs(player.x - it.x);
        if (d < it.radius && d < best) { best = d; nearest = it; }
      }
    }
    if (nearest?.kind === 'project') {
      const [x, y] = toScreen(nearest.anchor);
      ui.showCard(content.projects[nearest.index], nearest.index, x, y);
      ui.hidePrompt();
    } else if (nearest?.kind === 'bot') {
      const [x, y] = toScreen(nearest.anchor);
      ui.hideCard();
      ui.showPrompt('E  TALK', x, y);
    } else {
      ui.hideCard();
      ui.hidePrompt();
    }

    composer.render(dt);
  });

  // expose for debugging in the console
  window.__game = { scene, camera, player, quality, startGame };
}

boot();
