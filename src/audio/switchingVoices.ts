import type { LoaderState } from './sampleLoader';
import type { Voices } from './scheduler';
import type { SoundSetting } from './soundSetting';

/** Aufnahmen spielen, wenn „DRSKit“ gewählt und geladen ist; sonst der Synth (playback-sound). */
export function samplesPlayable(setting: Pick<SoundSetting, 'get'>, loader: { state(): LoaderState }): () => boolean {
  return () => setting.get() === 'drs' && loader.state() === 'ready';
}

/**
 * Entscheidet bei jedem Schlag neu, welche Stimmen spielen; so gilt ein Wechsel ab dem nächsten Schlag,
 * ohne dass der Scheduler davon weiß (drum-samples, design.md D1).
 */
export function createSwitchingVoices(synth: Voices, samples: Voices, useSamples: () => boolean): Voices {
  return {
    trigger(instrument, time, gain, technique) {
      (useSamples() ? samples : synth).trigger(instrument, time, gain, technique);
    },
    silence() {
      synth.silence();
      samples.silence();
    },
  };
}
