import type { SettingStorage } from './deviceSetting';

export const PRACTICE_STORAGE_KEY = 'beatsheet.practice-tempo';

/**
 * Übetempo je Song auf diesem Gerät und Schalter „Tempo“, „Metronom“ und „Einzählen“ je Song bis zum Neuladen
 * (practice-tempo, design.md D4; practice-click, design.md D5).
 */
export interface PracticeStore {
  /** Gespeichertes Übetempo; undefined, solange der Nutzer es nie geändert hat. */
  tempo(songId: string): number | undefined;
  setTempo(songId: string, bpm: number): void;
  enabled(songId: string): boolean;
  setEnabled(songId: string, on: boolean): void;
  metronome(songId: string): boolean;
  setMetronome(songId: string, on: boolean): void;
  countIn(songId: string): boolean;
  setCountIn(songId: string, on: boolean): void;
  subscribe(listener: () => void): () => void;
}

/** Werte als JSON-Objekt Song-ID → BPM unter einem Schlüssel; ist der Speicher nicht nutzbar, gelten sie nur für die Sitzung. */
export function createPracticeStore(storage: SettingStorage | null): PracticeStore {
  let tempos: Record<string, number> = {};
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(PRACTICE_STORAGE_KEY) ?? '{}');
    if (parsed && typeof parsed === 'object') {
      tempos = Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, number] => Number.isInteger(entry[1])));
    }
  } catch {
    // unlesbar oder nicht zugänglich: leer
  }
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  /** Schalter je Song, nur im Speicher des Stores. */
  const toggle = () => {
    const on = new Set<string>();
    return {
      get: (songId: string) => on.has(songId),
      set(songId: string, value: boolean) {
        if (on.has(songId) === value) return;
        if (value) on.add(songId);
        else on.delete(songId);
        notify();
      },
    };
  };
  const enabled = toggle();
  const metronome = toggle();
  const countIn = toggle();
  return {
    tempo: (songId) => tempos[songId],
    setTempo(songId, bpm) {
      if (tempos[songId] === bpm) return;
      tempos = { ...tempos, [songId]: bpm };
      try {
        storage?.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(tempos));
      } catch {
        // nur für die Sitzung
      }
      notify();
    },
    enabled: enabled.get,
    setEnabled: enabled.set,
    metronome: metronome.get,
    setMetronome: metronome.set,
    countIn: countIn.get,
    setCountIn: countIn.set,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
