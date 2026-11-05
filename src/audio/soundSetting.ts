/** Klang der Wiedergabe: Aufnahmen des DRSKit oder Synth (playback-sound). */
export type Sound = 'drs' | 'synth';

export const DEFAULT_SOUND: Sound = 'drs';
export const SOUND_STORAGE_KEY = 'beatsheet.sound';

type SoundStorage = Pick<Storage, 'getItem' | 'setItem'>;

export interface SoundSetting {
  get(): Sound;
  set(sound: Sound): void;
  subscribe(listener: () => void): () => void;
}

const isSound = (value: unknown): value is Sound => value === 'drs' || value === 'synth';

/**
 * Wahl des Klangs pro Gerät im lokalen Speicher (drum-samples, design.md D6). Ist der Speicher nicht
 * nutzbar, gilt die Wahl nur für die Sitzung.
 */
export function createSoundSetting(storage: SoundStorage | null): SoundSetting {
  let stored: string | null = null;
  try {
    stored = storage?.getItem(SOUND_STORAGE_KEY) ?? null;
  } catch {
    // privater Modus o. ä.: Vorgabe
  }
  let current: Sound = isSound(stored) ? stored : DEFAULT_SOUND;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(sound) {
      if (sound === current) return;
      current = sound;
      try {
        storage?.setItem(SOUND_STORAGE_KEY, sound);
      } catch {
        // nur für die Sitzung
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Speicher des Browsers, falls zugänglich. */
export function browserStorage(): SoundStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
