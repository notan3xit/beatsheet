import { allBars } from '../domain/songPatterns';
import { resolveSong, type ResolvedBar } from '../domain/timeline';
import { shorthand } from '../notation/shorthand';
import { INSTRUMENTS, type Accent, type Instrument, type Pattern, type PatternColor, type Song } from '../domain/types';

/** Höchstens so viele Beats pro Zeile (vier 4/4-Takte). Takte werden nie geteilt. */
export const BEATS_PER_ROW = 16;

export const ACCENT_LABELS: Record<Instrument, string> = {
  crash: 'Cr',
  ride: 'Ri',
  hihat: 'HH',
  hihatOpen: 'oHH',
  tom1: 'T1',
  tom2: 'T2',
  snare: 'SD',
  floorTom: 'FT',
  kick: 'BD',
  hihatPedal: 'HP',
};

/** Mit dem Fuß gespielt; ihre Akzente stehen unter dem Takt (accent-markers, design.md D1). */
export const FOOT_INSTRUMENTS: readonly Instrument[] = ['kick', 'hihatPedal'];

export type AccentPlace = 'top' | 'bottom';

/**
 * Je Beat höchstens ein Akzent oben (Hand, höchste Sequencer-Zeile) und einer unten (Fuß, niedrigste);
 * bei gleichem Instrument die frühere Position (accent-markers, design.md D2).
 */
export function shownAccents(accents: readonly Accent[]): { accent: Accent; place: AccentPlace }[] {
  const shown = new Map<string, { accent: Accent; place: AccentPlace }>();
  const row = (a: Accent) => INSTRUMENTS.indexOf(a.instrument);
  for (const accent of accents) {
    const place: AccentPlace = FOOT_INSTRUMENTS.includes(accent.instrument) ? 'bottom' : 'top';
    const key = `${accent.beat}:${place}`;
    const current = shown.get(key)?.accent;
    const better =
      !current ||
      (place === 'top' ? row(accent) < row(current) : row(accent) > row(current)) ||
      (row(accent) === row(current) && accent.position < current.position);
    if (better) shown.set(key, { accent, place });
  }
  return [...shown.values()].sort((a, b) => a.accent.beat - b.accent.beat || a.place.localeCompare(b.place));
}

// Alle Positionen und Breiten in Beats, relativ zum Zeilenanfang.

/** Ob Anfang bzw. Ende eines Balkens auf einer Taktgrenze liegt (sonst grenzt dort Groove an Fill im selben Takt). */
export interface BarEdges {
  atBarStart: boolean;
  atBarEnd: boolean;
}

export interface GrooveItem extends BarEdges {
  kind: 'groove';
  x: number;
  width: number;
  barId: string;
  patternId: string;
  color: PatternColor;
  label: string;
  /** Name sichtbar zeigen: erster Takt des Segments oder Groove-Wechsel zum vorigen Takt (sonst nur Tooltip). */
  showLabel: boolean;
  /** Startbeat im Groove (1-basiert), nur wenn der Groove länger als der Takt ist. */
  startBeat: number | null;
}

export interface EmptyItem {
  kind: 'empty';
  x: number;
  width: number;
  barId: string;
}

export interface FillItem extends BarEdges {
  kind: 'fill';
  x: number;
  width: number;
  patternId: string;
  color: PatternColor;
  label: string;
  continuesLeft: boolean;
  continuesRight: boolean;
  /** Taktstriche innerhalb des Fill-Blocks (Zeilenposition). */
  barlines: number[];
  /** Takt, zu dem der Fill gehört, und alle Takte, die er ganz überdeckt (für die Hervorhebung). */
  barIds: string[];
  /** Kurzschrift des sichtbaren Abschnitts; x in Beats relativ zum Block (Mitte des Rasterplatzes). */
  marks: ShorthandMarkItem[];
}

export interface ShorthandMarkItem {
  x: number;
  level: 0 | 1 | 2;
  char: string;
}

export interface AccentItem {
  kind: 'accent';
  x: number;
  label: string;
  place: AccentPlace;
  barId: string;
}

export type Item = GrooveItem | EmptyItem | FillItem | AccentItem;

export interface BarFrame {
  barId: string;
  /** Laufende Taktnummer im Song, 0-basiert. */
  index: number;
  x: number;
  width: number;
}

export interface Row {
  blockId: string;
  /** Erste Zeile eines Blocks, der nicht der erste des Segments ist. */
  blockStart: boolean;
  /** Erste Zeile eines Blocks (auch des ersten im Segment). */
  firstInBlock: boolean;
  /** Flach dargestellt: Wiederholung des vorigen Blocks bzw. eines früheren Segments oder, gesperrt, leerer Block. */
  flat: boolean;
  width: number;
  bars: BarFrame[];
  items: Item[];
}

export interface SegmentLayout {
  segmentId: string;
  name: string;
  rows: Row[];
}

interface FillInstance {
  patternId: string;
  /** Globale Beats [start, end) des sichtbaren Fills. */
  start: number;
  end: number;
  barIds: string[];
  /** Beat des Fill-Patterns, der bei `start` spielt (> 0, wenn der Anfang abgeschnitten ist). */
  offset: number;
}

/** Fill-Abschnitte zu zusammenhängenden Instanzen zusammenfassen (über Takte hinweg). */
function fillInstances(resolved: ResolvedBar[]): FillInstance[] {
  const instances: FillInstance[] = [];
  for (const bar of resolved) {
    for (const span of bar.fills) {
      const start = bar.start + span.from;
      const end = bar.start + span.to;
      const last = instances.at(-1);
      if (last && last.patternId === span.patternId && last.end === start && span.fillOffset > 0) {
        last.end = end;
      } else {
        instances.push({ patternId: span.patternId, start, end, barIds: [], offset: span.fillOffset });
      }
    }
  }
  // Fill gehört zum Takt, an dessen Ende er endet; dazu alle Takte, die er ganz überdeckt
  for (const fill of instances) {
    fill.barIds = resolved
      .filter((b) => (b.start >= fill.start && b.start + b.beats <= fill.end) || b.start + b.beats === fill.end)
      .map((b) => b.barId);
  }
  return instances;
}

/** Patterns ausgewählter Takte; `grooveId` und `fillId` nur, wenn alle Takte dasselbe Pattern haben. */
export function selectedPatterns(song: Song, barIds: readonly string[]) {
  const bars = allBars(song).filter((bar) => barIds.includes(bar.id));
  const fills = fillInstances(resolveSong(song));
  const fillsOfBars = bars.map((bar) => [...new Set(fills.filter((f) => f.barIds.includes(bar.id)).map((f) => f.patternId))]);
  const grooves = bars.map((bar) => bar.grooveId);
  const common = (ids: (string | null | undefined)[]) => (ids.every((id) => id === ids[0]) ? (ids[0] ?? null) : null);
  return {
    grooveId: common(grooves),
    fillId: common(fillsOfBars.map((ids) => (ids.length === 1 ? ids[0] : null))),
    patternIds: new Set([...grooves, ...fillsOfBars.flat()].filter((id) => id !== null)),
  };
}

/** Signatur eines Takts, wie er erscheint: Länge, Groove ab Beat, Fill-Abschnitte, Akzente (design.md D1). */
const barSignature = (bar: ResolvedBar) =>
  JSON.stringify([
    bar.beats,
    bar.groove && [bar.groove.patternId, bar.groove.offset],
    bar.fills.map((f) => [f.patternId, f.from, f.to, f.fillOffset]),
    bar.accents.map((a) => [a.instrument, a.beat, a.position]),
  ]);

const isEmpty = (bar: ResolvedBar) => !bar.groove && bar.fills.length === 0 && bar.accents.length === 0;

/** Flache Blöcke: leere nur im gesperrten Song, die übrigen, wenn ein früherer Block des Songs genauso aussieht. */
function flatBlocks(song: Song, resolved: ResolvedBar[], locked: boolean): Set<string> {
  const barsOf = new Map<string, ResolvedBar[]>();
  for (const bar of resolved) {
    const bars = barsOf.get(bar.blockId);
    if (bars) bars.push(bar);
    else barsOf.set(bar.blockId, [bar]);
  }
  const blockSignature = (blockId: string) => (barsOf.get(blockId) ?? []).map(barSignature).join('|');

  const flat = new Set<string>();
  const seen = new Set<string>();
  for (const block of song.segments.flatMap((s) => s.blocks)) {
    const signature = blockSignature(block.id);
    const empty = (barsOf.get(block.id) ?? []).every(isEmpty);
    if (empty ? locked : seen.has(signature)) flat.add(block.id);
    seen.add(signature);
  }
  return flat;
}

/**
 * Layout der linken Buchseite: Zeilen zu höchstens 16 Beats, jeder Block beginnt eine neue Zeile.
 * `locked`: Song gesperrt, dann sind auch leere Blöcke flach. `expanded`: ausgeklappt, keine Zeile ist flach.
 */
export function layoutStructure(song: Song, { locked = false, expanded = false }: { locked?: boolean; expanded?: boolean } = {}): SegmentLayout[] {
  const resolved = resolveSong(song);
  const patterns = new Map(song.patterns.map((p) => [p.id, p]));
  const fills = fillInstances(resolved);
  const flat = expanded ? new Set<string>() : flatBlocks(song, resolved, locked);

  return song.segments.map((segment) => {
    const rows: Row[] = [];
    // Groove-Name nur am Segmentanfang und bei Wechsel; maßgeblich ist die Zuordnung, nicht die Sichtbarkeit
    const labeled = new Set<string>();
    let previous: string | null | undefined;
    for (const bar of segment.blocks.flatMap((b) => b.bars)) {
      if (bar.grooveId !== previous) labeled.add(bar.id);
      previous = bar.grooveId;
    }
    segment.blocks.forEach((block, b) => {
      const bars = resolved.filter((r) => r.blockId === block.id);
      splitIntoRows(bars).forEach((rowBars, i) => {
        const row = layoutRow(rowBars, patterns, fills, labeled);
        rows.push({ blockId: block.id, blockStart: b > 0 && i === 0, firstInBlock: i === 0, flat: flat.has(block.id), ...row });
      });
    });
    return { segmentId: segment.id, name: segment.name, rows };
  });
}

/** Takte der Reihe nach auf Zeilen verteilen, solange sie vollständig in BEATS_PER_ROW passen. */
function splitIntoRows(bars: ResolvedBar[]): ResolvedBar[][] {
  const rows: ResolvedBar[][] = [];
  let beats = 0;
  for (const bar of bars) {
    const current = rows.at(-1);
    if (current && beats + bar.beats <= BEATS_PER_ROW) {
      current.push(bar);
      beats += bar.beats;
    } else {
      rows.push([bar]);
      beats = bar.beats;
    }
  }
  return rows;
}

const shorthandCache = new WeakMap<Pattern, ReturnType<typeof shorthand>>();
/** Kurzschrift je Pattern-Objekt nur einmal berechnen (Patterns sind unveränderlich). */
function shorthandOf(pattern: Pattern) {
  let marks = shorthandCache.get(pattern);
  if (!marks) shorthandCache.set(pattern, (marks = shorthand(pattern)));
  return marks;
}

function layoutRow(
  bars: ResolvedBar[],
  patterns: Map<string, Pattern>,
  fills: FillInstance[],
  labeled: ReadonlySet<string>,
): Omit<Row, 'blockId' | 'blockStart' | 'firstInBlock' | 'flat'> {
  const rowStart = bars[0]!.start;
  const rowEnd = bars.at(-1)!.start + bars.at(-1)!.beats;
  const frames: BarFrame[] = [];
  const items: Item[] = [];
  const barEdges = new Set(bars.flatMap((b) => [b.start - rowStart, b.start + b.beats - rowStart]));

  for (const bar of bars) {
    const x = bar.start - rowStart;
    frames.push({ barId: bar.barId, index: bar.index, x, width: bar.beats });

    const visible = bar.coveredFrom ?? bar.beats;
    const groove = bar.groove ? patterns.get(bar.groove.patternId) : undefined;
    if (visible > 0 && groove && bar.groove) {
      items.push({
        kind: 'groove',
        x,
        width: visible,
        barId: bar.barId,
        patternId: groove.id,
        color: groove.color,
        label: groove.name,
        showLabel: labeled.has(bar.barId),
        startBeat: groove.beats.length > bar.beats ? bar.groove.offset + 1 : null,
        atBarStart: true,
        atBarEnd: visible === bar.beats,
      });
    } else if (visible > 0) {
      items.push({ kind: 'empty', x, width: visible, barId: bar.barId });
    }
  }

  for (const fill of fills) {
    const from = Math.max(fill.start, rowStart);
    const to = Math.min(fill.end, rowEnd);
    const pattern = patterns.get(fill.patternId);
    if (from >= to || !pattern) continue;
    // Kurzschrift: Pattern-Zeit auf globale Beats abbilden, nur der sichtbare Abschnitt [from, to)
    const patternStart = fill.start - fill.offset;
    const marks = shorthandOf(pattern)
      .map((m) => ({ global: patternStart + m.time, m }))
      .filter(({ global }) => global >= from && global < to)
      .map(({ global, m }) => ({ x: global - from + m.slot / 2, level: m.level, char: m.char }));
    items.push({
      kind: 'fill',
      x: from - rowStart,
      width: to - from,
      patternId: pattern.id,
      color: pattern.color,
      label: pattern.name,
      atBarStart: barEdges.has(from - rowStart),
      atBarEnd: barEdges.has(to - rowStart),
      continuesLeft: fill.start < rowStart,
      continuesRight: fill.end > rowEnd,
      barlines: bars.map((b) => b.start).filter((start) => start > from && start < to).map((start) => start - rowStart),
      barIds: fill.barIds,
      marks,
    });
  }

  for (const bar of bars) {
    for (const { accent, place } of shownAccents(bar.accents)) {
      items.push({
        kind: 'accent',
        x: bar.start - rowStart + accent.beat + accent.position / 4,
        label: ACCENT_LABELS[accent.instrument],
        place,
        barId: bar.barId,
      });
    }
  }

  return { width: rowEnd - rowStart, bars: frames, items };
}

/**
 * Patterns in der Reihenfolge ihres ersten Auftretens im Song, Grooves und Fills gemischt; im selben
 * Takt der Groove vor dem Fill. Nicht verwendete danach, Grooves vor Fills, jeweils alphabetisch.
 */
export function songPatternOrder(song: Song): Pattern[] {
  const firstUse = new Map<string, number>();
  for (const bar of song.segments.flatMap((s) => s.blocks.flatMap((b) => b.bars))) {
    for (const id of [bar.grooveId, bar.fillId]) if (id && !firstUse.has(id)) firstUse.set(id, firstUse.size);
  }
  const rank = (p: Pattern) => firstUse.get(p.id)!;
  const unused = (kind: Pattern['kind']) =>
    song.patterns
      .filter((p) => p.kind === kind && !firstUse.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
  return [...song.patterns.filter((p) => firstUse.has(p.id)).sort((a, b) => rank(a) - rank(b)), ...unused('groove'), ...unused('fill')];
}
