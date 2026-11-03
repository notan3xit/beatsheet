import { articulationAt } from './sequencer';
import { resolveSong } from './timeline';
import { INSTRUMENTS, MAX_TEMPO, MIN_TEMPO, type Beat, type Instrument, type Pattern, type Song } from './types';

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

/**
 * Schläge eines Beats, der bei `start` (Beats) beginnt, nach Zeit sortiert (gleichzeitige in
 * Instrumentenreihenfolge). `beatIndex` ist der Beat im Pattern, für die Rasterposition.
 */
function beatHits(beat: Beat, beatIndex: number, start: number): PlaybackHit[] {
  const hits: PlaybackHit[] = [];
  for (let position = 0; position < beat.subdivision; position++) {
    for (const instrument of INSTRUMENTS) {
      if (!beat.hits[instrument]?.includes(position)) continue;
      const articulation = articulationAt(beat, instrument, position);
      const hit: PlaybackHit = {
        at: start + position / beat.subdivision,
        instrument,
        gain: articulation === 'ghost' ? GHOST_GAIN : 1,
        step: { beat: beatIndex, position },
      };
      if (articulation === 'flam') hit.graceBefore = FLAM_GRACE_SECONDS;
      hits.push(hit);
    }
  }
  return hits;
}

/** Alle Schläge des Patterns mit Zeitpunkt und Pegel, nach Zeit sortiert (gleichzeitige in Instrumentenreihenfolge). */
export function patternHits(pattern: Pattern): PlaybackHit[] {
  return pattern.beats.flatMap((beat, b) => beatHits(beat, b, b));
}

/** Was eine Wiedergabe-Quelle liefert: Länge, Schläge und Marken, alle Zeiten in Beats ab Quellenanfang. */
export interface Timeline<M> {
  length: number;
  hits: PlaybackHit[];
  /** Positionen, die der Abspieler beim Erreichen meldet (Rasterposition, Takt …). */
  marks: { at: number; mark: M }[];
}

/** Zeitplan eines Patterns; Marken sind die Rasterpositionen. */
export function patternTimeline(pattern: Pattern): Timeline<Step> {
  return {
    length: pattern.beats.length,
    hits: patternHits(pattern),
    marks: patternSteps(pattern).map(({ at, beat, position }) => ({ at, mark: { beat, position } })),
  };
}

/** Abschnitt eines Songs zum Abspielen: von Takt `from` bis Takt `to` (einschließlich) oder bis zum Songende. */
export interface SongRange {
  from: string;
  to: string | 'end';
}

let cached: { song: Song; range: SongRange; timeline: Timeline<string> | null } | null = null;

/**
 * Zeitplan eines Song-Abschnitts nach der Struktur: Groove mit Fortlauf, Fill statt Groove in überdeckten
 * Beats, Akzente zusätzlich (song-playback, design.md D2). Marken sind die Takt-IDs.
 * null, wenn Anfangs- oder Endtakt nicht (mehr) existieren. Das letzte Ergebnis wird zwischengespeichert.
 */
export function songTimeline(song: Song, range: SongRange): Timeline<string> | null {
  if (cached && cached.song === song && cached.range.from === range.from && cached.range.to === range.to) {
    return cached.timeline;
  }
  const timeline = computeSongTimeline(song, range);
  cached = { song, range: { ...range }, timeline };
  return timeline;
}

function computeSongTimeline(song: Song, range: SongRange): Timeline<string> | null {
  const bars = resolveSong(song);
  const first = bars.findIndex((b) => b.barId === range.from);
  const last = range.to === 'end' ? bars.length - 1 : bars.findIndex((b) => b.barId === range.to);
  if (first === -1 || last === -1 || last < first) return null;

  const patterns = new Map(song.patterns.map((p) => [p.id, p]));
  const origin = bars[first]!.start;
  const hits: PlaybackHit[] = [];
  const marks: Timeline<string>['marks'] = [];

  for (const bar of bars.slice(first, last + 1)) {
    const barStart = bar.start - origin;
    marks.push({ at: barStart, mark: bar.barId });
    const barHits: PlaybackHit[] = [];
    for (let i = 0; i < bar.beats; i++) {
      const fill = bar.fills.find((f) => i >= f.from && i < f.to);
      let source: { pattern: Pattern; beat: number } | null = null;
      if (fill) {
        const pattern = patterns.get(fill.patternId);
        if (pattern) source = { pattern, beat: fill.fillOffset + (i - fill.from) };
      } else if (bar.groove) {
        const pattern = patterns.get(bar.groove.patternId);
        if (pattern) source = { pattern, beat: (bar.groove.offset + i) % pattern.beats.length };
      }
      const beat = source?.pattern.beats[source.beat];
      if (source && beat) barHits.push(...beatHits(beat, source.beat, barStart + i));
    }
    // Akzente zusätzlich; derselbe Schlag an derselben Stelle klänge doppelt laut und entfällt
    for (const accent of bar.accents) {
      const at = barStart + accent.beat + accent.position / 4;
      if (barHits.some((h) => h.instrument === accent.instrument && Math.abs(h.at - at) < 1e-9)) continue;
      barHits.push({ at, instrument: accent.instrument, gain: 1, step: { beat: accent.beat, position: accent.position } });
    }
    hits.push(...barHits.sort((a, b) => a.at - b.at));
  }

  const length = bars.slice(first, last + 1).reduce((sum, b) => sum + b.beats, 0);
  return { length, hits, marks };
}
