import type { Beat, Instrument, Pattern, Subdivision } from './types';

const EXCLUSIVE: Partial<Record<Instrument, Instrument>> = { hihat: 'hihatOpen', hihatOpen: 'hihat' };

function withPositions(hits: Beat['hits'], instrument: Instrument, positions: number[]): Beat['hits'] {
  const next = { ...hits };
  if (positions.length > 0) next[instrument] = positions;
  else delete next[instrument];
  return next;
}

function replaceBeat(pattern: Pattern, index: number, beat: Beat): Pattern {
  return { ...pattern, beats: pattern.beats.map((b, i) => (i === index ? beat : b)) };
}

export function toggleHit(pattern: Pattern, beatIndex: number, instrument: Instrument, position: number): Pattern {
  const beat = pattern.beats[beatIndex]!;
  const current = beat.hits[instrument] ?? [];
  const isSet = current.includes(position);
  let hits = withPositions(
    beat.hits,
    instrument,
    isSet ? current.filter((p) => p !== position) : [...current, position].sort((a, b) => a - b),
  );
  const other = EXCLUSIVE[instrument];
  if (!isSet && other) {
    hits = withPositions(hits, other, (hits[other] ?? []).filter((p) => p !== position));
  }
  return replaceBeat(pattern, beatIndex, { ...beat, hits });
}

export interface LostHit {
  instrument: Instrument;
  position: number;
}

/** Überträgt Schläge über ihre zeitliche Lage in das neue Raster (design.md D4). */
export function changeSubdivision(
  pattern: Pattern,
  beatIndex: number,
  subdivision: Subdivision,
): { pattern: Pattern; lost: LostHit[] } {
  const beat = pattern.beats[beatIndex]!;
  const lost: LostHit[] = [];
  let hits: Beat['hits'] = {};
  for (const [instrument, positions] of Object.entries(beat.hits) as [Instrument, number[]][]) {
    const mapped: number[] = [];
    for (const position of positions) {
      const target = (position * subdivision) / beat.subdivision;
      if (Number.isInteger(target)) mapped.push(target);
      else lost.push({ instrument, position });
    }
    hits = withPositions(hits, instrument, mapped);
  }
  return { pattern: replaceBeat(pattern, beatIndex, { subdivision, hits }), lost };
}
