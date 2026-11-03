import { articulationAt } from './sequencer';
import { INSTRUMENTS, MAX_TEMPO, MIN_TEMPO, type Instrument, type Pattern, type Song } from './types';

export function isValidTempo(bpm: number): boolean {
  return Number.isInteger(bpm) && bpm >= MIN_TEMPO && bpm <= MAX_TEMPO;
}

/** Neues Tempo; ungültig oder unverändert -> derselbe Song (keine Revision). */
export function setTempo(song: Song, bpm: number): Song {
  if (!isValidTempo(bpm) || bpm === song.tempo) return song;
  return { ...song, tempo: bpm };
}

/** Pegel einer Ghost Note relativ zum normalen Schlag. */
export const GHOST_GAIN = 0.3;
/** Abstand des Flam-Vorschlags vor dem Hauptschlag, in Sekunden (unabhängig vom Tempo). */
export const FLAM_GRACE_SECONDS = 0.03;
/** Pegel des Flam-Vorschlags relativ zum normalen Schlag. */
export const FLAM_GRACE_GAIN = 0.4;

export interface Step {
  /** Beat im Pattern, 0-basiert. */
  beat: number;
  /** Position im Beat, 0-basiert. */
  position: number;
}

export interface PlaybackStep extends Step {
  /** Zeitpunkt in Beats ab Pattern-Anfang. */
  at: number;
}

export interface PlaybackHit {
  /** Zeitpunkt in Beats ab Pattern-Anfang. */
  at: number;
  instrument: Instrument;
  /** Pegel relativ zum normalen Schlag (1). */
  gain: number;
  step: Step;
  /** Flam: Vorschlag so viele Sekunden vor dem Hauptschlag, mit FLAM_GRACE_GAIN. */
  graceBefore?: number;
}

/** Alle Rasterpositionen des Patterns in zeitlicher Reihenfolge. */
export function patternSteps(pattern: Pattern): PlaybackStep[] {
  return pattern.beats.flatMap((beat, b) =>
    Array.from({ length: beat.subdivision }, (_, position) => ({ beat: b, position, at: b + position / beat.subdivision })),
  );
}

/** Alle Schläge des Patterns mit Zeitpunkt und Pegel, nach Zeit sortiert (gleichzeitige in Instrumentenreihenfolge). */
export function patternHits(pattern: Pattern): PlaybackHit[] {
  const hits: PlaybackHit[] = [];
  pattern.beats.forEach((beat, b) => {
    for (let position = 0; position < beat.subdivision; position++) {
      for (const instrument of INSTRUMENTS) {
        if (!beat.hits[instrument]?.includes(position)) continue;
        const articulation = articulationAt(beat, instrument, position);
        const hit: PlaybackHit = {
          at: b + position / beat.subdivision,
          instrument,
          gain: articulation === 'ghost' ? GHOST_GAIN : 1,
          step: { beat: b, position },
        };
        if (articulation === 'flam') hit.graceBefore = FLAM_GRACE_SECONDS;
        hits.push(hit);
      }
    }
  });
  return hits;
}
