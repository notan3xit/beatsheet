import { CHOKE_AFTER, CHOKE_FADE, type Technique } from '../domain/playback';
import type { Instrument } from '../domain/types';
import type { Voices } from './scheduler';

/** Eine Klangschicht: Oszillator oder Rauschen, optional gefiltert, mit abklingender Hüllkurve. */
export interface Layer {
  wave: 'sine' | 'triangle' | 'square' | 'noise';
  /** Anfangsfrequenz in Hz (nur Oszillatoren). */
  frequency?: number;
  /** Frequenz am Ende des Tonhöhenabfalls (nur Oszillatoren). */
  endFrequency?: number;
  filter?: { type: BiquadFilterType; frequency: number; q?: number };
  /** Pegel der Schicht bei einem normalen Schlag. */
  level: number;
  /** Abklingzeit in Sekunden. */
  decay: number;
}

const click = (frequency: number, level = 0.12): Layer => ({
  wave: 'noise',
  filter: { type: 'lowpass', frequency },
  level,
  decay: 0.02,
});

/** Rezepturen der Instrumente (design.md D5); unterscheidbar statt naturgetreu. */
export const RECIPES: Record<Instrument, Layer[]> = {
  kick: [{ wave: 'sine', frequency: 150, endFrequency: 45, level: 1, decay: 0.45 }, click(1500, 0.15)],
  snare: [
    { wave: 'triangle', frequency: 185, endFrequency: 150, level: 0.45, decay: 0.12 },
    { wave: 'noise', filter: { type: 'bandpass', frequency: 1800, q: 0.8 }, level: 0.8, decay: 0.2 },
  ],
  tom1: [{ wave: 'sine', frequency: 220, endFrequency: 180, level: 0.85, decay: 0.35 }, click(3000)],
  tom2: [{ wave: 'sine', frequency: 165, endFrequency: 135, level: 0.85, decay: 0.4 }, click(2500)],
  floorTom: [{ wave: 'sine', frequency: 110, endFrequency: 88, level: 0.9, decay: 0.5 }, click(2000)],
  hihat: [{ wave: 'noise', filter: { type: 'highpass', frequency: 7000 }, level: 0.4, decay: 0.05 }],
  hihatOpen: [{ wave: 'noise', filter: { type: 'highpass', frequency: 7000 }, level: 0.4, decay: 0.5 }],
  hihatPedal: [{ wave: 'noise', filter: { type: 'highpass', frequency: 6000 }, level: 0.25, decay: 0.04 }],
  ride: [
    { wave: 'square', frequency: 400, filter: { type: 'bandpass', frequency: 5000, q: 1 }, level: 0.12, decay: 1 },
    { wave: 'square', frequency: 593, filter: { type: 'bandpass', frequency: 5000, q: 1 }, level: 0.1, decay: 1 },
    { wave: 'square', frequency: 805, filter: { type: 'bandpass', frequency: 5000, q: 1 }, level: 0.08, decay: 1 },
    { wave: 'noise', filter: { type: 'bandpass', frequency: 5000, q: 1.5 }, level: 0.15, decay: 0.8 },
  ],
  crash: [
    { wave: 'noise', filter: { type: 'highpass', frequency: 4000 }, level: 0.55, decay: 1.5 },
    { wave: 'square', frequency: 540, filter: { type: 'highpass', frequency: 6000 }, level: 0.08, decay: 1 },
  ],
};

/** Rezepturen der Spielweisen mit eigenem Klang; ein Choke nutzt die Rezeptur des Instruments. */
export const TECHNIQUE_RECIPES: Record<Exclude<Technique, 'choke'>, Layer[]> = {
  rim: [
    { wave: 'triangle', frequency: 200, endFrequency: 160, level: 0.5, decay: 0.12 },
    { wave: 'noise', filter: { type: 'bandpass', frequency: 1800, q: 0.8 }, level: 0.9, decay: 0.18 },
    { wave: 'noise', filter: { type: 'highpass', frequency: 3500 }, level: 0.5, decay: 0.05 },
  ],
  cross: [
    { wave: 'square', frequency: 1100, filter: { type: 'bandpass', frequency: 2000, q: 2 }, level: 0.3, decay: 0.04 },
    { wave: 'noise', filter: { type: 'bandpass', frequency: 3500, q: 1 }, level: 0.25, decay: 0.03 },
  ],
  bell: [
    { wave: 'square', frequency: 800, filter: { type: 'bandpass', frequency: 3000, q: 1.5 }, level: 0.22, decay: 0.7 },
    { wave: 'square', frequency: 1190, filter: { type: 'bandpass', frequency: 3000, q: 1.5 }, level: 0.16, decay: 0.6 },
  ],
};

/** Hi-Hat-Klänge, die eine nachklingende offene Hi-Hat abstoppen. */
const CHOKERS: readonly Instrument[] = ['hihat', 'hihatPedal'];
const CHOKE_TIME_CONSTANT = 0.004;
const MASTER_LEVEL = 0.6;

/** Synthetisierte Stimmen über Web Audio. */
export function createVoices(ctx: BaseAudioContext): Voices {
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  // Gemeinsamer Ausgang mit Kompressor gegen Übersteuern bei vielen gleichzeitigen Schlägen
  const compressor = ctx.createDynamicsCompressor();
  compressor.connect(ctx.destination);
  const newMaster = () => {
    const gain = ctx.createGain();
    gain.gain.value = MASTER_LEVEL;
    gain.connect(compressor);
    return gain;
  };
  let master = newMaster();
  let openHat: { time: number; envelopes: GainNode[] } | null = null;

  const playLayer = (layer: Layer, time: number, gain: number): GainNode => {
    let source: AudioScheduledSourceNode;
    if (layer.wave === 'noise') {
      const buffer = ctx.createBufferSource();
      buffer.buffer = noise;
      buffer.loop = true;
      source = buffer;
    } else {
      const osc = ctx.createOscillator();
      osc.type = layer.wave;
      osc.frequency.setValueAtTime(layer.frequency!, time);
      if (layer.endFrequency) osc.frequency.exponentialRampToValueAtTime(layer.endFrequency, time + layer.decay * 0.5);
      source = osc;
    }
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(layer.level * gain, time);
    envelope.gain.setTargetAtTime(0, time, layer.decay / 5);
    let out: AudioNode = source;
    if (layer.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = layer.filter.type;
      filter.frequency.setValueAtTime(layer.filter.frequency, time);
      if (layer.filter.q !== undefined) filter.Q.setValueAtTime(layer.filter.q, time);
      out = out.connect(filter);
    }
    out.connect(envelope).connect(master);
    source.start(time);
    source.stop(time + layer.decay);
    return envelope;
  };

  return {
    trigger(instrument, time, gain, technique) {
      if (openHat && CHOKERS.includes(instrument) && time > openHat.time) {
        for (const envelope of openHat.envelopes) {
          envelope.gain.cancelScheduledValues(time);
          envelope.gain.setTargetAtTime(0, time, CHOKE_TIME_CONSTANT);
        }
        openHat = null;
      }
      const recipe = technique && technique !== 'choke' ? TECHNIQUE_RECIPES[technique] : RECIPES[instrument];
      const envelopes = recipe.map((layer) => playLayer(layer, time, gain));
      if (technique === 'choke') for (const envelope of envelopes) envelope.gain.setTargetAtTime(0, time + CHOKE_AFTER, CHOKE_FADE);
      if (instrument === 'hihatOpen') openHat = { time, envelopes };
    },
    silence() {
      master.disconnect();
      master = newMaster();
      openHat = null;
    },
  };
}
