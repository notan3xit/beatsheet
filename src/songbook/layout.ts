import { resolveSong, type ResolvedBar } from '../domain/timeline';
import type { Instrument, Pattern, PatternColor, Song } from '../domain/types';

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
}

export interface AccentItem {
  kind: 'accent';
  x: number;
  label: string;
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
        instances.push({ patternId: span.patternId, start, end });
      }
    }
  }
  return instances;
}

/** Layout der linken Buchseite: Zeilen zu höchstens 16 Beats, jeder Block beginnt eine neue Zeile. */
export function layoutStructure(song: Song): SegmentLayout[] {
  const resolved = resolveSong(song);
  const patterns = new Map(song.patterns.map((p) => [p.id, p]));
  const fills = fillInstances(resolved);

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
        rows.push({ blockId: block.id, blockStart: b > 0 && i === 0, firstInBlock: i === 0, ...row });
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

function layoutRow(
  bars: ResolvedBar[],
  patterns: Map<string, Pattern>,
  fills: FillInstance[],
  labeled: ReadonlySet<string>,
): Omit<Row, 'blockId' | 'blockStart' | 'firstInBlock'> {
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
    });
  }

  for (const bar of bars) {
    for (const accent of bar.accents) {
      items.push({
        kind: 'accent',
        x: bar.start - rowStart + accent.beat + accent.position / 4,
        label: ACCENT_LABELS[accent.instrument],
        barId: bar.barId,
      });
    }
  }

  return { width: rowEnd - rowStart, bars: frames, items };
}

/** Rechte Buchseite: Grooves vor Fills, jeweils nach erstem Auftreten, danach unbenutzte alphabetisch. */
export function patternPageOrder(song: Song): Pattern[] {
  const firstUse = new Map<string, number>();
  song.segments
    .flatMap((s) => s.blocks.flatMap((b) => b.bars))
    .forEach((bar, i) => {
      for (const id of [bar.grooveId, bar.fillId]) if (id && !firstUse.has(id)) firstUse.set(id, i);
    });
  const order = (a: Pattern, b: Pattern) => {
    const ua = firstUse.get(a.id);
    const ub = firstUse.get(b.id);
    if (ua !== undefined && ub !== undefined) return ua - ub;
    if (ua !== undefined) return -1;
    if (ub !== undefined) return 1;
    return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
  };
  return [
    ...song.patterns.filter((p) => p.kind === 'groove').sort(order),
    ...song.patterns.filter((p) => p.kind === 'fill').sort(order),
  ];
}
