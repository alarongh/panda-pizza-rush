/** Original synthesized cues: no downloaded recordings or external assets. */
export class GameAudio {
  constructor(enabled = false) { this.enabled = enabled; this.context = null; }
  async unlock() {
    if (!this.enabled) return;
    try {
      if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* Audio is optional; the game remains playable. */ }
  }
  suspend() { this.context?.suspend().catch(() => {}); }
  play(kind) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const sequences = { collect: [660, 880], jump: [300, 420], slide: [240, 170], hit: [150, 80], finish: [523, 659, 784, 1047] };
    (sequences[kind] || []).forEach((frequency, i) => {
      const ctx = this.context, oscillator = ctx.createOscillator(), gain = ctx.createGain(), at = ctx.currentTime + i * .075;
      oscillator.type = kind === 'hit' ? 'triangle' : 'sine'; oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.05, at + .008); gain.gain.exponentialRampToValueAtTime(.001, at + .13);
      oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(at); oscillator.stop(at + .14);
    });
  }
}
