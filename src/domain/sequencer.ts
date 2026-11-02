import { ARTICULATED, type Articulation, type Beat, type Instrument, type Pattern, type Subdivision } from './types';

const EXCLUSIVE: Partial<Record<Instrument, Instrument>> = { hihat: 'hihatOpen', hihatOpen: 'hihat' };

function withPositions(hits: Beat['hits'], instrument: Instrument, positions: number[]): Beat['hits'] {
  const next = { ...hits };
  if (positions.length > 0) next[instrument] = positions;
  else delete next[instrument];
  return next;
}

export function articulationAt(beat: Beat, instrument: Instrument, position: number): Articulation | undefined {
  return beat.articulations?.[instrument]?.[position];
}

/** Spielweise einer Position setzen (undefined = normal); leere Einträge und Felder werden entfernt. */
function withArticulation(beat: Beat, instrument: Instrument, position: number, articulation: Articulation | undefined): Beat {
  const forInstrument = { ...beat.articulations?.[instrument] };
  if (articulation) forInstrument[position] = articulation;
  else delete forInstrument[position];
  const articulations = { ...beat.articulations };
  if (Object.keys(forInstrument).length > 0) articulations[instrument] = forInstrument;
  else delete articulations[instrument];
  const { articulations: _old, ...rest } = beat;
  return Object.keys(articulations).length > 0 ? { ...rest, articulations } : rest;
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
  // Mit dem Schlag entfällt auch seine Spielweise; ein neuer Schlag ist normal
  return replaceBeat(pattern, beatIndex, withArticulation({ ...beat, hits }, instrument, position, undefined));
}

const NEXT: Record<Articulation | 'normal', Articulation | undefined> = { normal: 'flam', flam: 'ghost', ghost: undefined };

/** Shift-Klick: normal -> Flam -> Ghost Note -> normal; leere Position -> Schlag mit Flam; nur Snare und Toms. */
export function cycleArticulation(pattern: Pattern, beatIndex: number, instrument: Instrument, position: number): Pattern {
  if (!ARTICULATED.includes(instrument)) return pattern;
  const beat = pattern.beats[beatIndex]!;
  const current = beat.hits[instrument] ?? [];
  if (!current.includes(position)) {
    const hits = withPositions(beat.hits, instrument, [...current, position].sort((a, b) => a - b));
    return replaceBeat(pattern, beatIndex, withArticulation({ ...beat, hits }, instrument, position, 'flam'));
  }
  const next = NEXT[articulationAt(beat, instrument, position) ?? 'normal'];
  return replaceBeat(pattern, beatIndex, withArticulation(beat, instrument, position, next));
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
  const moved: [Instrument, number, Articulation][] = [];
  for (const [instrument, positions] of Object.entries(beat.hits) as [Instrument, number[]][]) {
    const mapped: number[] = [];
    for (const position of positions) {
      const target = (position * subdivision) / beat.subdivision;
      if (Number.isInteger(target)) {
        mapped.push(target);
        // Spielweise wandert mit ihrem Schlag; verlorene Schläge verlieren sie
        const articulation = articulationAt(beat, instrument, position);
        if (articulation) moved.push([instrument, target, articulation]);
      } else lost.push({ instrument, position });
    }
    hits = withPositions(hits, instrument, mapped);
  }
  let next: Beat = { subdivision, hits };
  for (const [instrument, position, articulation] of moved) next = withArticulation(next, instrument, position, articulation);
  return { pattern: replaceBeat(pattern, beatIndex, next), lost };
}
