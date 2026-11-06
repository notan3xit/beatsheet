import { ARTICULATIONS_BY_INSTRUMENT, type Articulation, type Beat, type Instrument, type Pattern, type Subdivision } from './types';

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

export function emphasisAt(beat: Beat, instrument: Instrument, position: number): boolean {
  return beat.emphasis?.[instrument]?.includes(position) ?? false;
}

/** Betonung einer Position setzen oder entfernen; leere Einträge und Felder werden entfernt. */
function withEmphasis(beat: Beat, instrument: Instrument, position: number, emphasized: boolean): Beat {
  const others = (beat.emphasis?.[instrument] ?? []).filter((p) => p !== position);
  const positions = emphasized ? [...others, position].sort((a, b) => a - b) : others;
  const emphasis = { ...beat.emphasis };
  if (positions.length > 0) emphasis[instrument] = positions;
  else delete emphasis[instrument];
  const { emphasis: _old, ...rest } = beat;
  return Object.keys(emphasis).length > 0 ? { ...rest, emphasis } : rest;
}

/** Entfernt Schlag, Spielweise und Betonung einer Position. */
function withoutHit(beat: Beat, instrument: Instrument, position: number): Beat {
  const hits = withPositions(beat.hits, instrument, (beat.hits[instrument] ?? []).filter((p) => p !== position));
  return withEmphasis(withArticulation({ ...beat, hits }, instrument, position, undefined), instrument, position, false);
}

/** Setzt einen normalen, unbetonten Schlag; die andere Hi-Hat-Variante entfällt. */
function withHit(beat: Beat, instrument: Instrument, position: number): Beat {
  const other = EXCLUSIVE[instrument];
  const base = other ? withoutHit(beat, other, position) : beat;
  const positions = [...(base.hits[instrument] ?? []), position].sort((a, b) => a - b);
  return { ...base, hits: withPositions(base.hits, instrument, positions) };
}

function replaceBeat(pattern: Pattern, index: number, beat: Beat): Pattern {
  return { ...pattern, beats: pattern.beats.map((b, i) => (i === index ? beat : b)) };
}

export function toggleHit(pattern: Pattern, beatIndex: number, instrument: Instrument, position: number): Pattern {
  const beat = pattern.beats[beatIndex]!;
  const isSet = beat.hits[instrument]?.includes(position) ?? false;
  return replaceBeat(pattern, beatIndex, isSet ? withoutHit(beat, instrument, position) : withHit(beat, instrument, position));
}

/** Shift-Klick: zulässige Spielweisen des Instruments der Reihe nach, dann wieder normal; leere Position -> Schlag mit der ersten. */
export function cycleArticulation(pattern: Pattern, beatIndex: number, instrument: Instrument, position: number): Pattern {
  const allowed = ARTICULATIONS_BY_INSTRUMENT[instrument];
  if (!allowed) return pattern;
  const beat = pattern.beats[beatIndex]!;
  if (!beat.hits[instrument]?.includes(position)) {
    return replaceBeat(pattern, beatIndex, withArticulation(withHit(beat, instrument, position), instrument, position, allowed[0]));
  }
  const current = articulationAt(beat, instrument, position);
  const next = allowed[current ? allowed.indexOf(current) + 1 : 0];
  const changed = withArticulation(beat, instrument, position, next);
  return replaceBeat(pattern, beatIndex, next === 'ghost' ? withEmphasis(changed, instrument, position, false) : changed);
}

/** Strg-Klick: Betonung umschalten; leere Position -> betonter normaler Schlag; Ghost Note bleibt unverändert. */
export function toggleEmphasis(pattern: Pattern, beatIndex: number, instrument: Instrument, position: number): Pattern {
  const beat = pattern.beats[beatIndex]!;
  if (!beat.hits[instrument]?.includes(position)) {
    return replaceBeat(pattern, beatIndex, withEmphasis(withHit(beat, instrument, position), instrument, position, true));
  }
  if (articulationAt(beat, instrument, position) === 'ghost') return pattern;
  return replaceBeat(pattern, beatIndex, withEmphasis(beat, instrument, position, !emphasisAt(beat, instrument, position)));
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
  const emphasized: [Instrument, number][] = [];
  for (const [instrument, positions] of Object.entries(beat.hits) as [Instrument, number[]][]) {
    const mapped: number[] = [];
    for (const position of positions) {
      const target = (position * subdivision) / beat.subdivision;
      if (Number.isInteger(target)) {
        mapped.push(target);
        // Spielweise und Betonung wandern mit ihrem Schlag; verlorene Schläge verlieren sie
        const articulation = articulationAt(beat, instrument, position);
        if (articulation) moved.push([instrument, target, articulation]);
        if (emphasisAt(beat, instrument, position)) emphasized.push([instrument, target]);
      } else lost.push({ instrument, position });
    }
    hits = withPositions(hits, instrument, mapped);
  }
  let next: Beat = { subdivision, hits };
  for (const [instrument, position, articulation] of moved) next = withArticulation(next, instrument, position, articulation);
  for (const [instrument, position] of emphasized) next = withEmphasis(next, instrument, position, true);
  return { pattern: replaceBeat(pattern, beatIndex, next), lost };
}
