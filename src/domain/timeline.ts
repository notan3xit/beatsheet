import type { Accent, Song } from './types';

/** Abschnitt eines Fills innerhalb eines Takts (Beats relativ zum Taktanfang). */
export interface FillSpan {
  patternId: string;
  from: number;
  to: number;
  /** Ab welchem Beat des Fills dieser Abschnitt spielt. */
  fillOffset: number;
}

export interface ResolvedBar {
  barId: string;
  segmentId: string;
  blockId: string;
  /** Laufende Taktnummer im Song, 0-basiert. */
  index: number;
  /** Globale Beat-Position des Taktanfangs. */
  start: number;
  beats: number;
  /** Startbeat im Groove (0-basiert) nach dem Fortlauf über gleiche Takte im Block. */
  groove: { patternId: string; offset: number } | null;
  /** Ab welchem Beat im Takt ein Fill überdeckt; null ohne Fill. */
  coveredFrom: number | null;
  fills: FillSpan[];
  accents: Accent[];
}

/** Löst die Struktur auf: Groove-Fortlauf und Fill-Überdeckung (design.md D2). */
export function resolveSong(song: Song): ResolvedBar[] {
  const lengths = new Map(song.patterns.map((p) => [p.id, p.beats.length]));
  const resolved: ResolvedBar[] = [];
  let start = 0;

  for (const segment of song.segments) {
    for (const block of segment.blocks) {
      let previous: { patternId: string; offset: number; beats: number } | null = null;
      for (const bar of block.bars) {
        let groove: ResolvedBar['groove'] = null;
        const length = bar.grooveId ? lengths.get(bar.grooveId) : undefined;
        if (bar.grooveId && length) {
          const offset: number = previous?.patternId === bar.grooveId ? (previous.offset + previous.beats) % length : 0;
          groove = { patternId: bar.grooveId, offset };
          previous = { patternId: bar.grooveId, offset, beats: bar.beats };
        } else {
          previous = null;
        }
        resolved.push({
          barId: bar.id,
          segmentId: segment.id,
          blockId: block.id,
          index: resolved.length,
          start,
          beats: bar.beats,
          groove,
          coveredFrom: null,
          fills: [],
          accents: bar.accents,
        });
        start += bar.beats;
      }
    }
  }

  // Fills in Songreihenfolge auftragen: ein später endender Fill überschreibt frühere Abschnitte
  const allBars = song.segments.flatMap((s) => s.blocks.flatMap((b) => b.bars));
  allBars.forEach((bar, i) => {
    const length = bar.fillId ? lengths.get(bar.fillId) : undefined;
    if (!bar.fillId || !length) return;
    const end = resolved[i]!.start + resolved[i]!.beats;
    const fillStart = end - length;
    for (const target of resolved) {
      const from = Math.max(fillStart, target.start);
      const to = Math.min(end, target.start + target.beats);
      if (from >= to) continue;
      const span: FillSpan = {
        patternId: bar.fillId,
        from: from - target.start,
        to: to - target.start,
        fillOffset: from - fillStart,
      };
      target.fills = [...cut(target.fills, span.from, span.to), span].sort((a, b) => a.from - b.from);
    }
  });

  for (const bar of resolved) {
    bar.coveredFrom = bar.fills.length > 0 ? Math.min(...bar.fills.map((f) => f.from)) : null;
  }
  return resolved;
}

/** Entfernt den Bereich [from, to) aus bestehenden Abschnitten. */
function cut(spans: FillSpan[], from: number, to: number): FillSpan[] {
  const result: FillSpan[] = [];
  for (const span of spans) {
    if (span.to <= from || span.from >= to) {
      result.push(span);
      continue;
    }
    if (span.from < from) result.push({ ...span, to: from });
    if (span.to > to) result.push({ ...span, from: to, fillOffset: span.fillOffset + (to - span.from) });
  }
  return result;
}
