import { createDeviceSetting, type DeviceSetting, type SettingStorage } from '../state/deviceSetting';

/** Klang der Wiedergabe: Aufnahmen des DRSKit oder Synth (playback-sound). */
export type Sound = 'drs' | 'synth';

export const DEFAULT_SOUND: Sound = 'drs';
export const SOUND_STORAGE_KEY = 'beatsheet.sound';

export type SoundSetting = DeviceSetting<Sound>;

/** Wahl des Klangs pro Gerät (drum-samples, design.md D6). */
export function createSoundSetting(storage: SettingStorage | null): SoundSetting {
  return createDeviceSetting({ key: SOUND_STORAGE_KEY, values: ['drs', 'synth'], fallback: DEFAULT_SOUND }, storage);
}
