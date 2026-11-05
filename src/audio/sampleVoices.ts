import { GHOST_GAIN } from '../domain/playback';
import type { Instrument } from '../domain/types';
import type { SampleBuffers } from './sampleLoader';
import type { Voices } from './scheduler';

/** Unter diesem Pegel spielt die Aufnahme des leisen Schlags (drum-samples, design.md D2). */
export const SOFT_BELOW = 0.5;
const CHOKERS: readonly Instrument[] = ['hihat', 'hihatPedal'];
/** Bei Aufnahmen weicher als beim Synth, sonst knackt das Abstoppen. */
const CHOKE_TIME_CONSTANT = 0.01;

/** Stimmen aus Aufnahmen; ohne geladene Aufnahmen klingt nichts. */
export function createSampleVoices(ctx: BaseAudioContext, buffers: () => SampleBuffers | null): Voices {
  const newMaster = () => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    return gain;
  };
  let master = newMaster();
  let openHat: { time: number; envelope: GainNode } | null = null;

  return {
    trigger(instrument, time, gain) {
      const loaded = buffers();
      if (!loaded) return;
      if (openHat && CHOKERS.includes(instrument) && time > openHat.time) {
        openHat.envelope.gain.cancelScheduledValues(time);
        openHat.envelope.gain.setTargetAtTime(0, time, CHOKE_TIME_CONSTANT);
        openHat = null;
      }
      const soft = gain < SOFT_BELOW;
      const source = ctx.createBufferSource();
      source.buffer = loaded[`${instrument}-${soft ? 'soft' : 'normal'}`];
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(soft ? Math.min(1, gain / GHOST_GAIN) : gain, time);
      source.connect(envelope).connect(master);
      source.start(time);
      if (instrument === 'hihatOpen') openHat = { time, envelope };
    },
    silence() {
      master.disconnect();
      master = newMaster();
      openHat = null;
    },
  };
}
