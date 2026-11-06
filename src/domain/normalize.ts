import { isValidMeter } from './meter';
import { emptyBeat } from './pattern';
import {
  ARTICULATIONS_BY_INSTRUMENT,
  MAX_LENGTH,
  type Articulation,
  type Bar,
  type Beat,
  type Instrument,
  type Pattern,
  type PatternKind,
  type Song,
} from './types';

/** Wie `map`, liefert aber die Eingabe selbst, wenn kein Element sich geändert hat. */
function mapSame<T>(list: T[], change: (item: T) => T): T[] {
  let changed = false;
  const next = list.map((item) => {
    const result = change(item);
    if (result !== item) changed = true;
    return result;
  });
  return changed ? next : list;
}

function normalizeBeat(beat: Beat): Beat {
  let changed = false;
  const hits: Beat['hits'] = {};
  for (const [instrument, positions] of Object.entries(beat.hits) as [Instrument, number[]][]) {
    const closed = instrument === 'hihatOpen' ? (beat.hits.hihat ?? []) : [];
    const kept = positions.filter((p) => p < beat.subdivision && !closed.includes(p));
    if (kept.length !== positions.length) changed = true;
    if (kept.length > 0) hits[instrument] = kept;
  }

  const articulations: NonNullable<Beat['articulations']> = {};
  for (const [instrument, byPosition] of Object.entries(beat.articulations ?? {}) as [Instrument, Record<number, Articulation>][]) {
    const set = hits[instrument] ?? [];
    const allowed = ARTICULATIONS_BY_INSTRUMENT[instrument] ?? [];
    const kept = Object.fromEntries(Object.entries(byPosition).filter(([p, value]) => set.includes(Number(p)) && allowed.includes(value)));
    if (Object.keys(kept).length !== Object.keys(byPosition).length) changed = true;
    if (Object.keys(kept).length > 0) articulations[instrument] = kept;
  }
  if (beat.articulations && Object.keys(articulations).length === 0) changed = true;

  // Betonung nur auf gesetzten Schlägen; bei Widerspruch gewinnt die Ghost Note
  const emphasis: NonNullable<Beat['emphasis']> = {};
  for (const [instrument, positions] of Object.entries(beat.emphasis ?? {}) as [Instrument, number[]][]) {
    const kept = positions.filter((p) => (hits[instrument] ?? []).includes(p) && articulations[instrument]?.[p] !== 'ghost');
    if (kept.length !== positions.length) changed = true;
    if (kept.length > 0) emphasis[instrument] = kept;
  }
  if (beat.emphasis && Object.keys(emphasis).length === 0) changed = true;

  if (!changed) return beat;
  const { articulations: _articulations, emphasis: _emphasis, ...rest } = beat;
  return {
    ...rest,
    hits,
    ...(Object.keys(articulations).length > 0 ? { articulations } : {}),
    ...(Object.keys(emphasis).length > 0 ? { emphasis } : {}),
  };
}

function normalizePattern(pattern: Pattern): Pattern {
  let beats = mapSame(pattern.beats, normalizeBeat);
  if (beats.length > MAX_LENGTH) beats = beats.slice(0, MAX_LENGTH);
  if (beats.length === 0) beats = [emptyBeat()];
  const valid = withValidMeter(pattern);
  return beats === pattern.beats ? valid : { ...valid, beats };
}

/** Entfernt eine Taktart außerhalb von METERS; sonst dasselbe Objekt. */
function withValidMeter<T extends { meter?: number }>(owner: T): T {
  if (owner.meter === undefined || isValidMeter(owner.meter)) return owner;
  const { meter: _invalid, ...rest } = owner;
  return rest as T;
}

function normalizeBar(bar: Bar, kinds: ReadonlyMap<string, PatternKind>): Bar {
  const grooveId = bar.grooveId !== null && kinds.get(bar.grooveId) !== 'groove' ? null : bar.grooveId;
  const fillId = bar.fillId !== null && kinds.get(bar.fillId) !== 'fill' ? null : bar.fillId;
  const accents = bar.accents.some((a) => a.beat >= bar.beats) ? bar.accents.filter((a) => a.beat < bar.beats) : bar.accents;
  return grooveId === bar.grooveId && fillId === bar.fillId && accents === bar.accents
    ? bar
    : { ...bar, grooveId, fillId, accents };
}

/**
 * Stellt die Strukturregeln des Dateiformats her, etwa nach dem Zusammenführen zweier Fassungen (design.md D6).
 * Deterministisch; verwirft oder begrenzt nur regelwidrige Elemente. Ein gültiger Song bleibt dieselbe Referenz.
 */
export function normalizeSong(song: Song): Song {
  const patterns = mapSame(song.patterns, normalizePattern);
  const kinds = new Map(patterns.map((p) => [p.id, p.kind]));
  const segments = mapSame(song.segments, (segment) => {
    const mapped = mapSame(segment.blocks, (block) => {
      const bars = mapSame(block.bars, (bar) => normalizeBar(bar, kinds));
      return bars === block.bars ? block : { ...block, bars };
    });
    const blocks = mapped.some((b) => b.bars.length === 0) ? mapped.filter((b) => b.bars.length > 0) : mapped;
    return blocks === segment.blocks ? segment : { ...segment, blocks };
  });
  const valid = withValidMeter(song);
  return patterns === song.patterns && segments === song.segments ? valid : { ...valid, patterns, segments };
}
