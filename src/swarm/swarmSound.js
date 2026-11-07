/**
 * Swarm sound engine — Joratali Engineering.
 *
 * Synthesised live with the Web Audio API. No audio files, no microphone.
 * The *idea* follows the sound design described in the Swarm Rebuild
 * extension's README (v1.1.0): a glass piano in E major pentatonic,
 * mechanical-keyboard typing ticks, and small event sounds. The code
 * below is written from scratch for this site — it is not a copy of
 * that project's swarm.js.
 */

const PENTA = [0, 2, 4, 7, 9]; // E F# G# B C# (E major pentatonic degrees)
const E2 = 40; // MIDI note for E2
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

export class SwarmSound {
  constructor() {
    this.on = true;
    this.ctx = null;
    this.bpm = 104;
    this.slots = new Map();
    this.lastKey = new Map();
    this.keyTimes = [];
    this.pressTimes = [];
    this.ends = [];
    this.t0 = 0;
  }

  init() {
    if (this.ctx) return true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx({ latencyHint: 'interactive' });
    } catch {
      return false;
    }
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = this.on ? 1 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 14;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.3;
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);
    comp.connect(out);
    out.connect(ctx.destination);
    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(3.2, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    verb.connect(wet);
    wet.connect(master);
    this.out = out;
    this.master = master;
    this.verb = verb;
    this.noiseBuf = this.noise(1.5);
    this.t0 = ctx.currentTime;
    return true;
  }

  now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  get blocked() {
    return !!this.ctx && this.ctx.state !== 'running';
  }

  ready() {
    return !!(this.ctx && this.on && this.ctx.state === 'running');
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended' && this.ctx.resume) {
      this.ctx.resume().catch(() => {});
    }
  }

  setOn(on) {
    this.on = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(on ? 1 : 0, t, 0.05);
    if (on) this.resume();
  }

  close() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  // Generated room: decaying stereo noise, darkened as it rings out.
  impulse(secs, decay) {
    const sr = this.ctx.sampleRate;
    const n = Math.floor(sr * secs);
    const b = this.ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const k = i / n;
        const a = 0.55 - 0.4 * k;
        lp += a * (Math.random() * 2 - 1 - lp);
        d[i] = lp * Math.pow(1 - k, decay) * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
      }
    }
    return b;
  }

  noise(secs) {
    const sr = this.ctx.sampleRate;
    const b = this.ctx.createBuffer(1, Math.floor(sr * secs), sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // Next note on the beat grid (16th notes by default, 8ths for slow events).
  grid(div = 4) {
    const step = 60 / this.bpm / div;
    const now = this.now() + 0.015;
    const k = Math.ceil((now - this.t0) / step);
    return { when: this.t0 + k * step, slot: `${div}:${k}` };
  }

  pan(x, vw) {
    return clamp((x / Math.max(1, vw)) * 1.6 - 0.8, -0.8, 0.8);
  }

  bus(when, pan, send) {
    const g = this.ctx.createGain();
    const p = this.ctx.createStereoPanner();
    p.pan.setValueAtTime(pan, when);
    g.connect(p);
    p.connect(this.master);
    if (send) {
      const s = this.ctx.createGain();
      s.gain.value = send;
      p.connect(s);
      s.connect(this.verb);
    }
    return g;
  }

  // Glass piano: a few sine partials (one inharmonic, for the glass)
  // with a soft felt-hammer tick and a long exponential ring.
  piano(midi, when, vel, pan, ring = 2.4) {
    const now = this.now();
    this.ends = this.ends.filter((e) => e > now);
    if (this.ends.length >= 28) return;
    const ctx = this.ctx;
    const f = mtof(midi);
    const v = this.bus(when, pan, 0.85);
    v.gain.value = 0.3 * vel;
    const hi = f > 900;
    const parts = [
      [1, 1, 1],
      [2, 0.38, 0.55],
      [3, 0.12, 0.32],
      [2.756, 0.16, 0.42],
      [5.4, 0.05, 0.16],
    ];
    let last = null;
    for (const [r, a, d] of parts) {
      if (f * r > 15000) continue;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * r * (1 + (Math.random() - 0.5) * 0.002);
      const g = ctx.createGain();
      const dec = ring * d * (hi ? 0.65 : 1);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(a, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0006, when + dec);
      o.connect(g);
      g.connect(v);
      o.start(when);
      o.stop(when + dec + 0.05);
      last = o;
    }
    this.hammer(when, v, f, 0.5);
    this.ends.push(when + ring * (hi ? 0.65 : 1));
    if (last) last.onended = () => v.disconnect();
  }

  hammer(when, dest, f, amt) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(9000, f * 4 + 1200);
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.25 * amt, when + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0005, when + 0.03);
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(when, Math.random());
    src.stop(when + 0.05);
  }

  // Short filtered-noise tick: typing and clicks.
  tick(when, pan, freq, q, vel, len) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = this.bus(when, pan, 0.06);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vel, when + 0.0008);
    g.gain.exponentialRampToValueAtTime(0.0004, when + len);
    src.connect(bp);
    bp.connect(g);
    src.start(when, Math.random() * 1.2);
    src.stop(when + len + 0.02);
    src.onended = () => g.disconnect();
  }

  // One mechanical key: a sharp click over a short "thock"
  // (deeper for the space bar).
  clack(when, pan, space, vel = 1) {
    this.tick(when, pan, rand(3600, 5600), 2.2, rand(0.2, 0.3) * vel, rand(0.006, 0.011));
    this.tick(
      when + rand(0.001, 0.005),
      pan,
      space ? rand(380, 560) : rand(850, 1500),
      1.6,
      (space ? 0.26 : rand(0.13, 0.2)) * vel,
      space ? 0.065 : rand(0.025, 0.042),
    );
  }

  key(x, vw, id, n = 1, space = 0) {
    if (!this.ready()) return;
    const t = this.now();
    if (t - (this.lastKey.get(id) || -1) < 0.024) return;
    this.keyTimes = this.keyTimes.filter((k) => t - k < 1);
    if (this.keyTimes.length > 80) return;
    this.lastKey.set(id, t);
    const pan = this.pan(x, vw);
    let at = t + 0.004;
    for (let k = 0; k < Math.min(n, 3) && this.keyTimes.length <= 80; k++) {
      this.keyTimes.push(t);
      this.clack(at, pan, space && k === 0, rand(0.75, 1));
      at += rand(0.018, 0.032);
    }
  }

  // A mouse button: press click, then a lighter release.
  press(x, vw) {
    if (!this.ready()) return;
    const t = this.now();
    this.pressTimes = this.pressTimes.filter((k) => t - k < 1);
    if (this.pressTimes.length > 40) return;
    this.pressTimes.push(t);
    const pan = this.pan(x, vw);
    this.tick(t + 0.004, pan, rand(2100, 2700), 4, 0.32, 0.012);
    this.tick(t + 0.005, pan, rand(650, 850), 2, 0.16, 0.022);
    this.tick(t + rand(0.055, 0.075), pan, rand(2900, 3400), 4, 0.15, 0.008);
  }

  // A finished element: boxes, media and duplicates sing; text and
  // lines stay percussive. Big sections play low, small things high,
  // pitch rises left to right, panned to the cursor.
  place(kind, x, y, w, h, vw, vh) {
    if (!this.ready()) return;
    if (kind === 'text' || kind === 'line') return;
    const area = (w * h) / Math.max(1, vw * vh);
    let oct;
    if (kind === 'guide') oct = 5;
    else oct = area > 0.08 ? 1 : area > 0.015 ? 2 : area > 0.002 ? 3 : 4;
    const deg = Math.floor(clamp(x / Math.max(1, vw), 0, 0.999) * 5);
    const midi = E2 + oct * 12 + PENTA[deg];
    const { when, slot } = this.grid(2);
    const seen = this.slots.get(slot) || [];
    if (seen.length >= 1) return;
    seen.push(midi);
    this.slots.set(slot, seen);
    if (this.slots.size > 64) this.slots.delete(this.slots.keys().next().value);
    const off = y < -40 || y > vh + 40 ? 0.45 : 1;
    const pan = this.pan(x, vw);
    const vel = ({ rect: 0.55, image: 0.5, dup: 0.5, guide: 0.3, restyle: 0.34 }[kind] || 0.4) * 0.42;
    const ring = oct <= 1 ? 3.6 : oct >= 4 ? 1.6 : 2.4;
    this.piano(midi, when, vel * off, pan, ring);
    if (kind === 'image') {
      this.piano(midi + ((PENTA[(deg + 2) % 5] - PENTA[deg] + 12) % 12), when + 0.04, vel * 0.6 * off, pan, ring);
    }
    if (kind === 'dup') {
      this.piano(E2 + 12 + (deg % 2 ? 7 : 0), when, 0.15 * off, pan * 0.5, 2.8);
    }
  }

  // Headings stepping up in size: a little rising run.
  grow(step, x, vw) {
    if (!this.ready()) return;
    const t = this.now() + 0.004;
    this.tick(t, this.pan(x, vw), 2400 + step * 260, 5, 0.12, 0.01);
  }

  snap(x, vw) {
    if (!this.ready()) return;
    const t = this.now() + 0.004;
    const pan = this.pan(x, vw);
    this.tick(t, pan, 4800, 3, 0.36, 0.012);
    this.tick(t + 0.002, pan, 1200, 2, 0.2, 0.03);
  }

  pad(midi, when, vel, len) {
    const ctx = this.ctx;
    const g = this.bus(when, 0, 0.9);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vel, when + len * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0005, when + len);
    for (const det of [-4, 4]) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = mtof(midi);
      o.detune.value = det;
      o.connect(g);
      o.start(when);
      o.stop(when + len + 0.05);
    }
  }

  // The page dissolving: an airy swell over a low open fifth.
  intro() {
    if (!this.ready()) return;
    const ctx = this.ctx;
    const t = this.now() + 0.02;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(260, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.9);
    bp.frequency.exponentialRampToValueAtTime(900, t + 1.8);
    const g = this.bus(t, 0, 0.6);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 2.2);
    src.connect(bp);
    bp.connect(g);
    src.start(t);
    src.stop(t + 2.3);
    src.onended = () => g.disconnect();
    for (const [m, d] of [[E2, 0], [E2 + 7, 0.08], [E2 + 12, 0.16]]) {
      this.pad(m, t + 0.3 + d, 0.07, 2.6);
    }
  }

  // The swarm fans out: E G# B E arpeggio on the grid.
  start() {
    if (!this.ready()) return;
    const { when } = this.grid(4);
    const step = 60 / this.bpm / 4;
    [E2 + 24, E2 + 28, E2 + 31, E2 + 36, E2 + 40].forEach((m, i) =>
      this.piano(m, when + i * step, 0.2, -0.5 + i * 0.25, 2),
    );
  }

  // The last chord rings: E major add9, strummed.
  finale() {
    if (!this.ready()) return;
    const { when } = this.grid(2);
    const chord = [E2, E2 + 7, E2 + 12, E2 + 16, E2 + 19, E2 + 26, E2 + 28, E2 + 31, E2 + 36, E2 + 43];
    chord.forEach((m, i) =>
      this.piano(m, when + i * 0.035, 0.34 - i * 0.015, -0.6 + (i / chord.length) * 1.2, 5.5),
    );
    this.pad(E2 + 12, when, 0.05, 5);
  }

  // Back to the real page: a falling sweep.
  release() {
    if (!this.ready()) return;
    const ctx = this.ctx;
    const t = this.now() + 0.01;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1;
    bp.frequency.setValueAtTime(3000, t);
    bp.frequency.exponentialRampToValueAtTime(220, t + 1);
    const g = this.bus(t, 0, 0.5);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 1.1);
    src.connect(bp);
    bp.connect(g);
    src.start(t);
    src.stop(t + 1.2);
    this.piano(E2 + 12, t + 0.05, 0.3, 0, 2.5);
  }
}

export default SwarmSound;
