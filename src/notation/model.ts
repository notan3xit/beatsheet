import { INSTRUMENTS, type Beat, type Instrument, type Pattern, type Subdivision } from '../domain/types';

/** Systemschritt: 0 = Linie 1 (unten), 1 = Zwischenraum 1, ... 8 = Linie 5; negativ = unter dem System. */
export interface NoteKey {
  instrument: Instrument;
  staffStep: number;
  notehead: 'x' | 'normal';
  open?: true;
}

export type Duration = 'q' | '8d' | '8' | '16';

export type NotationEvent =
  | { kind: 'note'; duration: Duration; keys: NoteKey[] }
  | { kind: 'rest'; duration: Duration; keys: [] };

export interface BeatGroup {
  /** Beat-Index im Pattern (0-basiert). */
  beat: number;
  tuplet: 3 | 6 | null;
  beamed: boolean;
  events: NotationEvent[];
}

export type VoiceName = 'up' | 'down';

export interface Measure {
  beatCount: number;
  voices: Record<VoiceName, BeatGroup[]>;
}

export interface NotationModel {
  clef: 'percussion';
  measures: Measure[];
}

export const BEATS_PER_MEASURE = 4;

const STAFF: Record<Instrument, { staffStep: number; notehead: NoteKey['notehead']; voice: VoiceName }> = {
  hihatPedal: { staffStep: -2, notehead: 'x', voice: 'down' },
  kick: { staffStep: 1, notehead: 'normal', voice: 'down' },
  floorTom: { staffStep: 3, notehead: 'normal', voice: 'up' },
  snare: { staffStep: 5, notehead: 'normal', voice: 'up' },
  tom2: { staffStep: 6, notehead: 'normal', voice: 'up' },
  tom1: { staffStep: 7, notehead: 'normal', voice: 'up' },
  ride: { staffStep: 8, notehead: 'x', voice: 'up' },
  hihat: { staffStep: 9, notehead: 'x', voice: 'up' },
  hihatOpen: { staffStep: 9, notehead: 'x', voice: 'up' },
  crash: { staffStep: 10, notehead: 'x', voice: 'up' },
};

/**
 * Darstellbare Dauern je Unterteilung in Rastereinheiten, größte zuerst.
 * Bei Triolen gelten die Notenwerte innerhalb der Tuplet-Klammer.
 */
const DURATIONS: Record<Subdivision, [units: number, duration: Duration][]> = {
  2: [[2, 'q'], [1, '8']],
  4: [[4, 'q'], [3, '8d'], [2, '8'], [1, '16']],
  3: [[2, 'q'], [1, '8']],
  6: [[4, 'q'], [3, '8d'], [2, '8'], [1, '16']],
};

function split(units: number, subdivision: Subdivision): Duration[] {
  const result: Duration[] = [];
  let rest = units;
  for (const [size, duration] of DURATIONS[subdivision]) {
    while (rest >= size) {
      result.push(duration);
      rest -= size;
    }
  }
  return result;
}

function keyFor(instrument: Instrument): NoteKey {
  const { staffStep, notehead } = STAFF[instrument];
  return instrument === 'hihatOpen' ? { instrument, staffStep, notehead, open: true } : { instrument, staffStep, notehead };
}

function beatGroup(beat: Beat, index: number, voice: VoiceName): BeatGroup {
  const byPosition = new Map<number, NoteKey[]>();
  for (const instrument of INSTRUMENTS) {
    if (STAFF[instrument].voice !== voice) continue;
    for (const position of beat.hits[instrument] ?? []) {
      const keys = byPosition.get(position) ?? [];
      keys.push(keyFor(instrument));
      byPosition.set(position, keys);
    }
  }

  const positions = [...byPosition.keys()].sort((a, b) => a - b);
  if (positions.length === 0) {
    return { beat: index, tuplet: null, beamed: false, events: [{ kind: 'rest', duration: 'q', keys: [] }] };
  }

  const { subdivision } = beat;
  const events: NotationEvent[] = split(positions[0]!, subdivision).map((duration) => ({
    kind: 'rest',
    duration,
    keys: [],
  }));
  positions.forEach((position, i) => {
    const end = positions[i + 1] ?? subdivision;
    const [first, ...rests] = split(end - position, subdivision);
    const keys = byPosition.get(position)!.sort((a, b) => a.staffStep - b.staffStep);
    events.push({ kind: 'note', duration: first!, keys });
    for (const duration of rests) events.push({ kind: 'rest', duration, keys: [] });
  });

  const beamable = events.filter((e) => e.kind === 'note' && e.duration !== 'q').length;
  return {
    beat: index,
    tuplet: subdivision === 3 || subdivision === 6 ? subdivision : null,
    beamed: beamable >= 2,
    events,
  };
}

export function toNotation(pattern: Pattern): NotationModel {
  const measures: Measure[] = [];
  for (let start = 0; start < pattern.beats.length; start += BEATS_PER_MEASURE) {
    const beats = pattern.beats.slice(start, start + BEATS_PER_MEASURE);
    measures.push({
      beatCount: beats.length,
      voices: {
        up: beats.map((beat, i) => beatGroup(beat, start + i, 'up')),
        down: beats.map((beat, i) => beatGroup(beat, start + i, 'down')),
      },
    });
  }
  return { clef: 'percussion', measures };
}
