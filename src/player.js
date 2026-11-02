import { PixelSprite } from './sprite.js';
import { PLAYER_IDLE, PLAYER_WALK } from './pixel.js';
import { BOUNDS } from './world.js';

const SPEED = 4.2;
const ACCEL = 18;

export class Player {
  constructor(scene) {
    this.sprite = new PixelSprite({ frames: PLAYER_IDLE, scale: 1.25, fps: 4, glowChars: 'V', glow: 1.6 });
    this.sprite.addSheet('walk', PLAYER_WALK, 'V');
    this.mesh = this.sprite.mesh;
    this.mesh.position.set(-10, 0, 0);
    scene.add(this.mesh);
    this.vx = 0;
    this.facing = 1;
    this.input = { left: false, right: false };
    this.frozen = true;
  }

  get x() { return this.mesh.position.x; }

  update(dt) {
    let dir = 0;
    if (!this.frozen) dir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const target = dir * SPEED;
    const dv = target - this.vx;
    this.vx += Math.sign(dv) * Math.min(Math.abs(dv), ACCEL * dt);
    const p = this.mesh.position;
    p.x = Math.min(BOUNDS.max, Math.max(BOUNDS.min, p.x + this.vx * dt));

    if (dir !== 0) this.facing = dir;
    const moving = Math.abs(this.vx) > 0.3;
    if (moving) {
      this.sprite.play('walk');
      this.sprite.setFps(10);
      this.mesh.scale.x = this.facing; // flip the right-facing walk cycle when moving left
    } else {
      this.sprite.play('default');
      this.sprite.setFps(4);
      this.mesh.scale.x = 1;
    }
    this.sprite.update(dt);
  }
}
