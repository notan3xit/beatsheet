import type { SettingStorage } from './deviceSetting';

export const PRACTICE_STORAGE_KEY = 'beatsheet.practice-tempo';

/** Übetempo je Song auf diesem Gerät und Schalter „Üben“ je Song bis zum Neuladen (practice-tempo, design.md D4). */
export interface PracticeStore {
  /** Gespeichertes Übetempo; undefined, solange der Nutzer es nie geändert hat. */
  tempo(songId: string): number | undefined;
  setTempo(songId: string, bpm: number): void;
  enabled(songId: string): boolean;
  setEnabled(songId: string, on: boolean): void;
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
  const enabled = new Set<string>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
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
    enabled: (songId) => enabled.has(songId),
    setEnabled(songId, on) {
      if (enabled.has(songId) === on) return;
      if (on) enabled.add(songId);
      else enabled.delete(songId);
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
