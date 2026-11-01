import { resolveSong, type ResolvedBar } from '../domain/timeline';
import type { Instrument, Pattern, PatternColor, Song } from '../domain/types';

/** Höchstens so viele Takte pro Zeile. */
export const BARS_PER_ROW = 4;

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
export interface GrooveItem {
  kind: 'groove';
  x: number;
  width: number;
  barId: string;
  patternId: string;
  color: PatternColor;
  label: string;
  /** Startbeat im Groove (1-basiert), nur wenn der Groove länger als der Takt ist. */
  startBeat: number | null;
}

export interface EmptyItem {
  kind: 'empty';
  x: number;
  width: number;
  barId: string;
}

export interface FillItem {
  kind: 'fill';
  x: number;
  width: number;
  patternId: string;
  color: PatternColor;
  label: string;
  /** Fill ist kürzer als der Takt, in dem er endet: verkleinerte Noten im Block. */
  mini: boolean;
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
  blockStart: boolean;
}

export interface Row {
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
  mini: boolean;
}

/** Fill-Abschnitte zu zusammenhängenden Instanzen zusammenfassen (über Takte hinweg). */
function fillInstances(resolved: ResolvedBar[], lengths: Map<string, number>): FillInstance[] {
  const instances: FillInstance[] = [];
  for (const bar of resolved) {
    for (const span of bar.fills) {
      const start = bar.start + span.from;
      const end = bar.start + span.to;
      const last = instances.at(-1);
      if (last && last.patternId === span.patternId && last.end === start && span.fillOffset > 0) {
        last.end = end;
      } else {
        instances.push({ patternId: span.patternId, start, end, mini: false });
      }
    }
  }
  // mini: Fill ist insgesamt kürzer als der Takt, in dem er endet
  for (const instance of instances) {
    const endBar = resolved.find((b) => b.start < instance.end && instance.end <= b.start + b.beats);
    instance.mini = (lengths.get(instance.patternId) ?? 0) < (endBar?.beats ?? 0);
  }
  return instances;
}

/** Layout der linken Buchseite (design.md D3). */
export function layoutStructure(song: Song): SegmentLayout[] {
  const resolved = resolveSong(song);
  const patterns = new Map(song.patterns.map((p) => [p.id, p]));
  const lengths = new Map(song.patterns.map((p) => [p.id, p.beats.length]));
  const fills = fillInstances(resolved, lengths);
  const blockStarts = new Set(song.segments.flatMap((s) => s.blocks.map((b) => b.bars[0]?.id)));

  return song.segments.map((segment) => {
    const bars = resolved.filter((b) => b.segmentId === segment.id);
    const rows: Row[] = [];
    for (let i = 0; i < bars.length; i += BARS_PER_ROW) {
      rows.push(layoutRow(bars.slice(i, i + BARS_PER_ROW), patterns, fills, blockStarts));
    }
    return { segmentId: segment.id, name: segment.name, rows };
  });
}

function layoutRow(
  bars: ResolvedBar[],
  patterns: Map<string, Pattern>,
  fills: FillInstance[],
  blockStarts: Set<string | undefined>,
): Row {
  const rowStart = bars[0]!.start;
  const rowEnd = bars.at(-1)!.start + bars.at(-1)!.beats;
  const frames: BarFrame[] = [];
  const items: Item[] = [];

  for (const bar of bars) {
    const x = bar.start - rowStart;
    frames.push({ barId: bar.barId, index: bar.index, x, width: bar.beats, blockStart: blockStarts.has(bar.barId) });

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
        startBeat: groove.beats.length > bar.beats ? bar.groove.offset + 1 : null,
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
      mini: fill.mini,
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
