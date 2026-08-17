/**
 * Ben 10 Vault — sound engine.
 *
 * Design goals: sparing, satisfying, never autoplaying, globally toggleable.
 *
 * Two layers:
 *  1. Replaceable asset slots. If a file exists at /public/audio/<slot>.mp3 (or .ogg/.wav) it is
 *     used. Slots (see AUDIO_SLOTS): omnitrix-activate-os|af|ua|ov, dial-tick, card-hover,
 *     card-open, card-close, ui-toggle. Drop real Omnitrix samples in and they take over —
 *     no code changes. See docs/audio.md.
 *  2. Synthesised fallbacks built with the Web Audio API — Omnitrix-style rising activation
 *     chimes, dial clicks and soft card ticks. They are tuned per era so each device sounds
 *     different (prototype = raw square-ish, recalibrated = cleaner sines, Ultimatrix = deeper,
 *     Omniverse = brighter chirp).
 */
export type SoundName =
  | 'omnitrix-activate-os'
  | 'omnitrix-activate-af'
  | 'omnitrix-activate-ua'
  | 'omnitrix-activate-ov'
  | 'dial-tick'
  | 'card-hover'
  | 'card-open'
  | 'card-close'
  | 'ui-toggle';

export const AUDIO_SLOTS: SoundName[] = [
  'omnitrix-activate-os',
  'omnitrix-activate-af',
  'omnitrix-activate-ua',
  'omnitrix-activate-ov',
  'dial-tick',
  'card-hover',
  'card-open',
  'card-close',
  'ui-toggle',
];

const STORAGE_KEY = 'ben10vault.sound';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<SoundName, AudioBuffer | null>();
  private probing = new Map<SoundName, Promise<AudioBuffer | null>>();
  private lastPlayed = new Map<SoundName, number>();
  private listeners = new Set<(enabled: boolean) => void>();
  enabled: boolean;

  constructor() {
    let stored: string | null = null;
    try {
      stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    } catch {
      stored = null;
    }
    // Sound is opt-in by default? No — it is on by default but nothing plays without a user gesture.
    this.enabled = stored === null ? true : stored === 'on';
  }

  subscribe(fn: (enabled: boolean) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    try {
      localStorage.setItem(STORAGE_KEY, v ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    this.listeners.forEach((l) => l(v));
    if (v) this.play('ui-toggle');
  }

  toggle() {
    this.setEnabled(!this.enabled);
  }

  /** Must be called from a user gesture at least once (we call it from every play()). */
  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private async probeFile(name: SoundName): Promise<AudioBuffer | null> {
    if (this.buffers.has(name)) return this.buffers.get(name) ?? null;
    if (this.probing.has(name)) return this.probing.get(name)!;
    const p = (async () => {
      const ctx = this.ensureContext();
      if (!ctx) return null;
      for (const ext of ['mp3', 'ogg', 'wav']) {
        try {
          const res = await fetch(`${BASE}/audio/${name}.${ext}`, { method: 'GET' });
          if (!res.ok) continue;
          const type = res.headers.get('content-type') ?? '';
          if (!type.startsWith('audio')) continue;
          const buf = await ctx.decodeAudioData(await res.arrayBuffer());
          this.buffers.set(name, buf);
          return buf;
        } catch {
          /* try next */
        }
      }
      this.buffers.set(name, null);
      return null;
    })();
    this.probing.set(name, p);
    return p;
  }

  play(name: SoundName, opts: { volume?: number; throttleMs?: number } = {}) {
    if (!this.enabled) return;
    const now = performance.now();
    const throttle = opts.throttleMs ?? 0;
    if (throttle && now - (this.lastPlayed.get(name) ?? -1e9) < throttle) return;
    this.lastPlayed.set(name, now);
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;
    const vol = opts.volume ?? 1;
    void this.probeFile(name).then((buf) => {
      if (!this.enabled) return;
      if (buf) {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = vol;
        src.connect(g).connect(this.master!);
        src.start();
      } else {
        this.synth(name, vol);
      }
    });
  }

  // ---------------- synthesised fallbacks ----------------
  private synth(name: SoundName, vol: number) {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.value = vol;
    out.connect(this.master!);
    const t = ctx.currentTime;
    switch (name) {
      case 'omnitrix-activate-os':
        this.activation(out, t, { base: 392, steps: [1, 1.26, 1.5, 2], wave: 'square', tail: 1.1, brightness: 2600, sub: 0.35 });
        break;
      case 'omnitrix-activate-af':
        this.activation(out, t, { base: 440, steps: [1, 1.5, 2, 2.5], wave: 'triangle', tail: 1.2, brightness: 3400, sub: 0.2 });
        break;
      case 'omnitrix-activate-ua':
        this.activation(out, t, { base: 330, steps: [1, 1.19, 1.5, 1.78], wave: 'sawtooth', tail: 1.35, brightness: 2200, sub: 0.6 });
        break;
      case 'omnitrix-activate-ov':
        this.activation(out, t, { base: 523, steps: [1, 1.33, 1.67, 2.25], wave: 'triangle', tail: 0.95, brightness: 4200, sub: 0.25 });
        break;
      case 'dial-tick':
        this.tick(out, t, 1900, 0.05, 0.5);
        break;
      case 'card-hover':
        this.tick(out, t, 2600, 0.03, 0.12);
        break;
      case 'card-open':
        this.whoosh(out, t, 220, 660, 0.34, 0.5);
        this.tick(out, t + 0.05, 1500, 0.06, 0.25);
        break;
      case 'card-close':
        this.whoosh(out, t, 520, 180, 0.26, 0.35);
        break;
      case 'ui-toggle':
        this.tick(out, t, 1200, 0.05, 0.3);
        this.tick(out, t + 0.07, 1800, 0.05, 0.3);
        break;
    }
    // auto-clean
    setTimeout(() => out.disconnect(), 3000);
  }

  /** Omnitrix-style activation: quick ascending blips, then a swelling shimmer with a light "whoom". */
  private activation(
    out: GainNode,
    t: number,
    p: { base: number; steps: number[]; wave: OscillatorType; tail: number; brightness: number; sub: number },
  ) {
    const ctx = this.ctx!;
    // 1) ascending blips
    p.steps.forEach((ratio, i) => {
      const o = ctx.createOscillator();
      o.type = p.wave;
      o.frequency.value = p.base * ratio;
      const g = ctx.createGain();
      const start = t + i * 0.085;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.28, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = p.brightness;
      o.connect(f).connect(g).connect(out);
      o.start(start);
      o.stop(start + 0.14);
    });
    // 2) swelling shimmer chord (detuned sines) with slow upward drift
    const chordStart = t + p.steps.length * 0.085 - 0.02;
    const chord = [p.base * 2, p.base * 2.5, p.base * 3, p.base * 4];
    chord.forEach((freq, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq * 0.985, chordStart);
      o.frequency.linearRampToValueAtTime(freq * 1.01, chordStart + p.tail);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, chordStart);
      g.gain.exponentialRampToValueAtTime(0.16 / (1 + i * 0.35), chordStart + 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, chordStart + p.tail);
      o.connect(g).connect(out);
      o.start(chordStart);
      o.stop(chordStart + p.tail + 0.05);
    });
    // 3) sub "whoom" — the transformation flash
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, chordStart);
    sub.frequency.exponentialRampToValueAtTime(48, chordStart + 0.5);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, chordStart);
    sg.gain.exponentialRampToValueAtTime(0.5 * p.sub, chordStart + 0.04);
    sg.gain.exponentialRampToValueAtTime(0.0001, chordStart + 0.55);
    sub.connect(sg).connect(out);
    sub.start(chordStart);
    sub.stop(chordStart + 0.6);
    // 4) airy noise sweep
    this.whoosh(out, chordStart, 400, 3200, 0.5, 0.18);
  }

  private tick(out: GainNode, t: number, freq: number, dur: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
    // click transient
    const n = this.noise(0.02);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.5, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    n.connect(hp).connect(ng).connect(out);
    n.start(t);
  }

  private whoosh(out: GainNode, t: number, from: number, to: number, dur: number, vol: number) {
    const ctx = this.ctx!;
    const n = this.noise(dur + 0.1);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp).connect(g).connect(out);
    n.start(t);
  }

  private noise(seconds: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }
}

export const audio = new AudioEngine();
