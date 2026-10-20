"use client";

let context: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === "undefined") {
    return null;
  }
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      return null;
    }
    context = new Ctor();
  }
  if (context.state === "suspended") {
    void context.resume();
  }
  return context;
};

const envelope = (ctx: AudioContext, peak: number, attack: number, release: number) => {
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
  gain.connect(ctx.destination);
  return gain;
};

const tone = (frequency: number, { type = "sine", peak = 0.12, attack = 0.01, release = 0.4, delay = 0, slideTo }: {
  type?: OscillatorType;
  peak?: number;
  attack?: number;
  release?: number;
  delay?: number;
  slideTo?: number;
} = {}) => {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  window.setTimeout(() => {
    const osc = ctx.createOscillator();
    const gain = envelope(ctx, peak, attack, release);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + attack + release);
    }
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + attack + release + 0.05);
  }, delay);
};

const noiseBuffer = (ctx: AudioContext, seconds: number, brown = false): AudioBuffer => {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[index] = last * 3.5;
    } else {
      data[index] = white;
    }
  }
  return buffer;
};

export const sfx = {
  click() {
    const ctx = getContext();
    if (!ctx) {
      return;
    }
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 0.05);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    source.connect(filter);
    filter.connect(envelope(ctx, 0.5, 0.002, 0.05));
    source.start();
    tone(180, { type: "square", peak: 0.04, release: 0.04 });
  },
  squeak() {
    tone(900, { type: "triangle", peak: 0.12, attack: 0.02, release: 0.18, slideTo: 1500 });
    tone(1400, { type: "triangle", peak: 0.08, attack: 0.02, release: 0.16, slideTo: 800, delay: 170 });
  },
  pop() {
    tone(520, { type: "sine", peak: 0.14, attack: 0.005, release: 0.12, slideTo: 980 });
  },
  thud() {
    tone(140, { type: "sine", peak: 0.16, attack: 0.005, release: 0.18, slideTo: 60 });
  },
  chime(notes: number[] = [659.25, 830.61, 987.77, 1318.5]) {
    notes.forEach((note, index) => {
      tone(note, { type: "sine", peak: 0.09, attack: 0.01, release: 1.1, delay: index * 110 });
      tone(note * 2, { type: "sine", peak: 0.02, attack: 0.01, release: 0.7, delay: index * 110 });
    });
  },
  sparkle() {
    [1568, 2093, 2637].forEach((note, index) => {
      tone(note, { type: "sine", peak: 0.04, attack: 0.005, release: 0.35, delay: index * 60 });
    });
  },
  shutter() {
    const ctx = getContext();
    if (!ctx) {
      return;
    }
    [0, 70].forEach((delay) => {
      window.setTimeout(() => {
        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer(ctx, 0.06);
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 1800;
        source.connect(filter);
        filter.connect(envelope(ctx, 0.35, 0.002, 0.06));
        source.start();
      }, delay);
    });
  },
  hum(on: boolean) {
    tone(on ? 110 : 90, { type: "sawtooth", peak: 0.025, attack: 0.08, release: 0.6, slideTo: on ? 220 : 55 });
  },
};

export interface AmbientHandle {
  stop: () => void;
}

export const startWaves = (): AmbientHandle | null => {
  const ctx = getContext();
  if (!ctx) {
    return null;
  }

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, 6, true);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 520;

  const swell = ctx.createGain();
  swell.gain.value = 0.08;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.11;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.07;
  lfo.connect(lfoDepth);
  lfoDepth.connect(swell.gain);

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 2);

  source.connect(filter);
  filter.connect(swell);
  swell.connect(master);
  master.connect(ctx.destination);
  source.start();
  lfo.start();

  return {
    stop() {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      window.setTimeout(() => {
        source.stop();
        lfo.stop();
        master.disconnect();
      }, 1300);
    },
  };
};
