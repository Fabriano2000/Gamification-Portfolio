import * as THREE from 'three';
import { content } from './content.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { createPost } from './post.js';
import { pickQuality, saveQuality } from './quality.js';
import { THEMES, THEME_BY_ID } from './env/themes.js';
import * as ui from './ui.js';

const $ = (s) => document.querySelector(s);
const ENV_KEY = 'gp-env';
ui.fillStatic(content);
ui.buildEnvMenu(THEMES);

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}

function pickTheme() {
  const q = new URLSearchParams(location.search).get('env');
  if (q && THEME_BY_ID[q]) return THEME_BY_ID[q];
  try { const s = localStorage.getItem(ENV_KEY); if (s && THEME_BY_ID[s]) return THEME_BY_ID[s]; } catch { /* ignore */ }
  return THEMES[0];
}

async function boot() {
  // Sign textures use the pixel fonts, so wait for them (but never hang on it).
  await Promise.race([
    Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('12px "DotGothic16"', 'ラーメン')]),
    new Promise((r) => setTimeout(r, 3000)),
  ]);

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
  // Camera rig from the Figma spec: narrow fov, pitched down, riding a rail along X.
  const camera = new THREE.PerspectiveCamera(24, innerWidth / innerHeight, 0.5, 400);
  const DIST = 30, PITCH = THREE.MathUtils.degToRad(16), LOOK_Y = 2.4;
  const focus = new THREE.Vector3();
  const post = createPost(renderer, scene, camera, quality, focus);

  // ---------- Environment (live-swappable)
  let theme = pickTheme();
  let world = null;
  let player = null;
  let shards = 0;

  const loadTheme = (t) => {
    const keepX = player ? player.x : -10;
    world?.dispose();
    player?.dispose();
    theme = t;
    world = buildWorld(scene, quality, content, theme);
    player = new Player(scene, theme.playerRecolor || null, keepX);
    post.applyTheme(theme.post);
    ui.applyTheme(theme);
    shards = 0;
    ui.setShards(0, world.shards.length);
    try { localStorage.setItem(ENV_KEY, theme.id); } catch { /* ignore */ }
    renderer.shadowMap.needsUpdate = true;
  };
  loadTheme(theme);

  // ---------- State
  let state = 'title'; // title | play | dialog
  let camX = -10;
  let nearest = null;
  const dialog = ui.createDialog();

  const startGame = () => {
    if (state !== 'title') return;
    $('#title').hidden = true;
    $('#hud').hidden = false;
    if (matchMedia('(pointer: coarse)').matches) $('#touch').hidden = false;
    state = 'dialog';
    dialog.show(theme.npc.name, [...theme.intro(content), 'Walk with A/D or the arrow keys. Press E near anything that glows.'], () => { state = 'play'; });
  };

  const interact = () => {
    if (ui.anyOverlayOpen()) return;
    if (state === 'title') return startGame();
    if (state === 'dialog') return dialog.next();
    if (!nearest) return;
    if (nearest.kind === 'project') ui.openProject(content.projects[nearest.index], nearest.index, theme.station.colors);
    if (nearest.kind === 'npc') {
      state = 'dialog';
      dialog.show(theme.npc.name, [
        `${shards} of ${world.shards.length} shards collected.`,
        'Want a different scenery? Press ESC and pick another environment.',
      ], () => { state = 'play'; });
    }
  };

  // ---------- Input
  const keys = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  addEventListener('keydown', (e) => {
    if (keys[e.key]) { player.input[keys[e.key]] = true; return; }
    if (e.key === 'Escape') {
      if (ui.closeOverlay('#modal') || ui.closeOverlay('#quick') || ui.closeOverlay('#menu')) return;
      ui.openMenu(quality.name, theme.id);
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
  $('#btn-settings').addEventListener('click', () => ui.openMenu(quality.name, theme.id));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => ui.closeOverlay('#' + b.closest('.overlay').id)));
  document.querySelectorAll('.overlay').forEach((o) => o.addEventListener('click', (e) => { if (e.target === o) ui.closeOverlay('#' + o.id); }));
  $('#menu').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const { act, q, env } = btn.dataset;
    if (act === 'resume') ui.closeOverlay('#menu');
    if (act === 'quick') { ui.closeOverlay('#menu'); ui.openQuick(content); }
    if (env && env !== theme.id) { loadTheme(THEME_BY_ID[env]); ui.markMenu(quality.name, theme.id); }
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
    post.composer.setSize(innerWidth, innerHeight);
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

    // camera: slow drift on the title screen, rail-follow with look-ahead while playing
    const targetX = state === 'title' ? Math.sin(t * 0.08) * 9 : player.x + player.facing * 1.5;
    camX += (targetX - camX) * (state === 'title' ? 1 : Math.min(1, dt * 4.8));
    camera.position.set(camX, LOOK_Y + DIST * Math.sin(PITCH), DIST * Math.cos(PITCH));
    camera.lookAt(camX, LOOK_Y, 0);
    focus.set(player.x, 1, 0);
    world.update(t, dt, camX);

    for (const s of world.shards) {
      if (!s.taken && state === 'play' && Math.abs(player.x - s.x) < 0.6) {
        s.taken = true; s.sprite.mesh.visible = false; shards++;
        ui.setShards(shards, world.shards.length);
      }
    }

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
      ui.showCard(content.projects[nearest.index], nearest.index, x, y, nearest.color);
      ui.hidePrompt();
    } else if (nearest?.kind === 'npc') {
      const [x, y] = toScreen(nearest.anchor);
      ui.hideCard();
      ui.showPrompt('E  TALK', x, y);
    } else {
      ui.hideCard();
      ui.hidePrompt();
    }

    post.composer.render(dt);
  });

  // exposed for debugging in the console
  window.__game = { scene, camera, get player() { return player; }, quality, startGame, loadTheme: (id) => loadTheme(THEME_BY_ID[id]) };
}

boot();
