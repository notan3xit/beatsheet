import { DRS_FORMATS } from './drsSamples';
import { browserDecode, browserFetch, createSampleLoader, type SampleLoader } from './sampleLoader';
import { browserStorage, createSoundSetting, type SoundSetting } from './soundSetting';

/** Klangwahl und Aufnahmen, gemeinsam für Player und Menü (playback-sound). */
export interface PlaybackSound {
  setting: SoundSetting;
  loader: SampleLoader;
}

type OfflineWindow = { OfflineAudioContext?: unknown; webkitOfflineAudioContext?: unknown };

/** Ein Lader, der nichts laden kann: Der Browser dekodiert keine Audiodateien. */
function unavailableLoader(): SampleLoader {
  return { state: () => 'unavailable', buffers: () => null, load: () => Promise.resolve(), subscribe: () => () => {} };
}

/** Wahl im Gerätespeicher, DRSKit-Aufnahmen vom Server (drum-samples, design.md D3, D6). */
export function createDeviceSound(win: OfflineWindow = globalThis as OfflineWindow): PlaybackSound {
  const canDecode = win.OfflineAudioContext !== undefined || win.webkitOfflineAudioContext !== undefined;
  return {
    setting: createSoundSetting(browserStorage()),
    loader: canDecode ? createSampleLoader({ formats: DRS_FORMATS, fetchData: browserFetch, decode: browserDecode() }) : unavailableLoader(),
  };
}
