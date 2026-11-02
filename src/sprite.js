// Billboard pixel sprite: a lit plane with a sprite-sheet texture, crisp pixels and cut-out shadows.
import * as THREE from 'three';
import { sheetTexture, glowRecolor } from './pixel.js';

export const PX = 0.1; // world units per art pixel

export class PixelSprite {
  /**
   * @param {object} opts
   * @param {string[][]} opts.frames   sprite frames (arrays of strings)
   * @param {number} [opts.scale]      extra scale on top of PX
   * @param {number} [opts.fps]        animation speed
   * @param {string} [opts.glowChars]  palette chars that should glow (emissive)
   * @param {number} [opts.glow]       emissive intensity
   * @param {object} [opts.recolor]    palette overrides {char: '#hex'}
   */
  constructor({ frames, scale = 1, fps = 4, glowChars = '', glow = 2, recolor = null }) {
    this.sheets = {};
    this.fps = fps;
    this.time = 0;
    this.recolor = recolor;
    const main = this.addSheet('default', frames, glowChars);
    this.current = 'default';

    const w = main.w * PX * scale;
    const h = main.h * PX * scale;
    const geo = new THREE.PlaneGeometry(w, h);
    geo.translate(0, h / 2, 0); // origin at the feet
    this.height = h;
    this.width = w;

    this.material = new THREE.MeshStandardMaterial({
      map: main.texture,
      emissiveMap: main.emissive || null,
      emissive: main.emissive ? new THREE.Color(0xffffff) : new THREE.Color(0x000000),
      emissiveIntensity: glow,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.castShadow = true;
    // Cut-out shadow: the shadow follows the sprite silhouette, not the quad.
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: main.texture,
      alphaTest: 0.5,
    });
  }

  addSheet(name, frames, glowChars = '') {
    const sheet = sheetTexture(frames, this.recolor);
    if (glowChars) sheet.emissive = sheetTexture(frames, glowRecolor(glowChars, this.recolor || {})).texture;
    this.sheets[name] = sheet;
    return sheet;
  }

  play(name) {
    if (this.current === name) return;
    const s = this.sheets[name];
    this.current = name;
    this.time = 0;
    this.material.map = s.texture;
    this.mesh.customDepthMaterial.map = s.texture;
    if (s.emissive) this.material.emissiveMap = s.emissive;
  }

  setFps(fps) { this.fps = fps; }

  update(dt) {
    const s = this.sheets[this.current];
    this.time += dt;
    const frame = Math.floor(this.time * this.fps) % s.frames;
    s.texture.offset.x = frame / s.frames;
    if (s.emissive) s.emissive.offset.x = frame / s.frames;
  }

  dispose() {
    for (const s of Object.values(this.sheets)) { s.texture.dispose(); s.emissive?.dispose(); }
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.mesh.customDepthMaterial.dispose();
  }
}
