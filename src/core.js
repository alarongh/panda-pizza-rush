import { createLevel, FINISH_DISTANCE, OBSTACLES } from './level.js';
export const JUMP_DURATION = .96;
export const SLIDE_DURATION = .9;
export class RunnerGame {
  constructor({ onEvent = () => {} } = {}) { this.onEvent = onEvent; this.reset(); this.state = 'menu'; }
  reset() {
    this.distance = 0; this.elapsed = 0; this.pizzas = 0; this.lane = 1; this.x = 1;
    this.action = null; this.actionTime = 0; this.entities = createLevel(); this.hit = null;
    this.state = 'playing';
  }
  get speed() { return 9 + 7 * Math.min(1, this.distance / FINISH_DISTANCE); }
  get score() { return Math.floor(this.distance) + this.pizzas * 10; }
  get jumpHeight() { return this.action === 'jump' ? Math.sin(Math.PI * Math.min(1, this.actionTime / JUMP_DURATION)) : 0; }
  input(action) {
    if (this.state !== 'playing') return false;
    if (action === 'left' || action === 'right') {
      const next = Math.max(0, Math.min(2, this.lane + (action === 'left' ? -1 : 1)));
      if (next === this.lane) return false;
      this.lane = next; this.onEvent({ type: 'lane' }); return true;
    }
    if (!this.action && (action === 'jump' || action === 'slide')) {
      this.action = action; this.actionTime = 0; this.onEvent({ type: action }); return true;
    }
    return false;
  }
  pause() { if (this.state === 'playing') { this.state = 'paused'; this.onEvent({ type: 'pause' }); } }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this.onEvent({ type: 'resume' }); } }
  update(dt) {
    if (this.state !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
    // Fixed small substeps make collisions and actions independent of framerate.
    // Ignore excess wall time after a stalled frame; never teleport after return.
    let remaining = Math.min(dt, .1);
    while (remaining > .000001 && this.state === 'playing') {
      const step = Math.min(remaining, 1 / 120); this.step(step); remaining -= step;
    }
  }
  step(dt) {
    const previous = this.distance;
    this.elapsed += dt;
    this.distance = Math.min(FINISH_DISTANCE, this.distance + this.speed * dt);
    this.x += Math.sign(this.lane - this.x) * Math.min(Math.abs(this.lane - this.x), dt * 9);
    if (this.action) {
      this.actionTime += dt;
      if (this.actionTime >= (this.action === 'jump' ? JUMP_DURATION : SLIDE_DURATION)) this.action = null;
    }
    for (const entity of this.entities) {
      if (entity.resolved || entity.z > this.distance) continue;
      entity.resolved = true;
      if (entity.z < previous || Math.abs(entity.lane - this.x) > .4) continue;
      if (entity.type === 'pizza') {
        this.pizzas++; this.onEvent({ type: 'collect', entity }); continue;
      }
      const need = OBSTACLES[entity.type].action;
      const safe = (need === 'jump' && this.jumpHeight > .43) || (need === 'slide' && this.action === 'slide');
      if (safe) { this.onEvent({ type: 'avoid', entity }); continue; }
      this.hit = entity; this.state = 'gameover'; this.onEvent({ type: 'hit', entity }); return;
    }
    if (this.distance >= FINISH_DISTANCE) { this.state = 'finish'; this.onEvent({ type: 'finish' }); }
  }
  result() { return { score: this.score, pizzas: this.pizzas, distance: Math.floor(this.distance), time: Math.round(this.elapsed * 10) / 10, delivered: this.state === 'finish' }; }
}
