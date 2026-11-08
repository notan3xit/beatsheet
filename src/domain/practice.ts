import { MAX_TEMPO, MIN_TEMPO } from './types';

/** Übetempo, solange keines gespeichert ist: 75 % des Song-Tempos, auf 5 gerundet (practice-tempo). */
export function defaultPracticeTempo(songTempo: number): number {
  return Math.max(MIN_TEMPO, Math.round((songTempo * 0.75) / 5) * 5);
}

/** Gespeichertes Übetempo oder die Vorgabe; das Song-Tempo begrenzt es nicht. */
export function practiceTempo(stored: number | undefined, songTempo: number): number {
  return stored ?? defaultPracticeTempo(songTempo);
}

/** Übetempo um `delta` geändert, innerhalb der gültigen Tempi. */
export function stepPracticeTempo(current: number, delta: number): number {
  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, current + delta));
}
