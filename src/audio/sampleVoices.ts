import { CHOKE_AFTER, CHOKE_FADE, GHOST_GAIN } from '../domain/playback';
import type { Instrument } from '../domain/types';
import { TECHNIQUE_SAMPLES, type SampleBuffers, type SampleKey } from './sampleLoader';
import type { Voices } from './scheduler';

/** Unter diesem Pegel spielt die Aufnahme des leisen Schlags (drum-samples, design.md D2). */
export const SOFT_BELOW = 0.5;
const CHOKERS: readonly Instrument[] = ['hihat', 'hihatPedal'];
/** Bei Aufnahmen weicher als beim Synth, sonst knackt das Abstoppen. */
const CHOKE_TIME_CONSTANT = 0.01;

/** Stimmen aus Aufnahmen; ohne geladene Aufnahmen klingt nichts. */
export function createSampleVoices(ctx: BaseAudioContext, buffers: () => SampleBuffers | null): Voices {
  // Begrenzer: betonte Schläge liegen über dem Pegel der Aufnahmen
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.08;
  limiter.connect(ctx.destination);
  const newMaster = () => {
    const gain = ctx.createGain();
    gain.connect(limiter);
    return gain;
  };
  let master = newMaster();
  let openHat: { time: number; envelope: GainNode } | null = null;

  return {
    trigger(instrument, time, gain, technique) {
      const loaded = buffers();
      if (!loaded) return;
      if (openHat && CHOKERS.includes(instrument) && time > openHat.time) {
        openHat.envelope.gain.cancelScheduledValues(time);
        openHat.envelope.gain.setTargetAtTime(0, time, CHOKE_TIME_CONSTANT);
        openHat = null;
      }
      const soft = gain < SOFT_BELOW;
      const source = ctx.createBufferSource();
      const sample: SampleKey = technique && technique !== 'choke' ? TECHNIQUE_SAMPLES[technique] : `${instrument}-${soft ? 'soft' : 'normal'}`;
      source.buffer = loaded[sample];
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(soft ? Math.min(1, gain / GHOST_GAIN) : gain, time);
      source.connect(envelope).connect(master);
      source.start(time);
      if (technique === 'choke') envelope.gain.setTargetAtTime(0, time + CHOKE_AFTER, CHOKE_FADE);
      if (instrument === 'hihatOpen') openHat = { time, envelope };
    },
    silence() {
      master.disconnect();
      master = newMaster();
      openHat = null;
    },
  };
}
