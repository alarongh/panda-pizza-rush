export class InputController {
  constructor(element, onAction, onPause) {
    this.element = element; this.onAction = onAction; this.onPause = onPause; this.start = null;
    this.key = event => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      const action = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'jump', w: 'jump', ' ': 'jump', arrowdown: 'slide', s: 'slide' }[key];
      if (action) { event.preventDefault(); onAction(action); }
      if (key === 'escape' || key === 'p') { event.preventDefault(); onPause(); }
    };
    this.down = event => {
      if (event.target.closest('button') || !event.isPrimary) return;
      this.start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      try { element.setPointerCapture(event.pointerId); } catch { /* Synthetic or cancelled pointer; gesture remains safe. */ }
    };
    this.move = event => {
      if (!this.start || event.pointerId !== this.start.id) return;
      const dx = event.clientX - this.start.x, dy = event.clientY - this.start.y;
      const threshold = Math.max(18, element.clientWidth * .055);
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      onAction(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'slide' : 'jump'));
      this.cancel();
    };
    this.up = event => { this.move(event); this.cancel(); };
    this.cancel = () => { this.start = null; };
    window.addEventListener('keydown', this.key);
    element.addEventListener('pointerdown', this.down);
    element.addEventListener('pointermove', this.move);
    element.addEventListener('pointerup', this.up);
    element.addEventListener('pointercancel', this.cancel);
    element.addEventListener('lostpointercapture', this.cancel);
  }
  destroy() {
    window.removeEventListener('keydown', this.key);
    this.element.removeEventListener('pointerdown', this.down);
    this.element.removeEventListener('pointermove', this.move);
    this.element.removeEventListener('pointerup', this.up);
    this.element.removeEventListener('pointercancel', this.cancel);
    this.element.removeEventListener('lostpointercapture', this.cancel);
  }
}
