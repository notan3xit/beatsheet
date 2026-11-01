import { createPattern, type Deps } from './pattern';
import type { Bar, Pattern, PatternKind, Song } from './types';

/** Alle Takte eines Songs in Reihenfolge. */
export function allBars(song: Song): Bar[] {
  return song.segments.flatMap((s) => s.blocks.flatMap((b) => b.bars));
}

/** Wendet eine Änderung auf jeden Takt an (unveränderte Takte bleiben dieselben Objekte). */
export function mapBars(song: Song, change: (bar: Bar) => Bar): Song {
  return {
    ...song,
    segments: song.segments.map((segment) => ({
      ...segment,
      blocks: segment.blocks.map((block) => ({ ...block, bars: block.bars.map(change) })),
    })),
  };
}

export function addPattern(
  song: Song,
  input: { kind: PatternKind; name?: string; length?: number },
  deps?: Deps,
): { song: Song; pattern: Pattern } {
  const pattern = createPattern(song.patterns, input, deps);
  return { song: { ...song, patterns: [...song.patterns, pattern] }, pattern };
}

/** Anzahl der Takte, die das Pattern als Groove oder Fill verwenden. */
export function patternUsage(song: Song, patternId: string): number {
  return allBars(song).filter((bar) => bar.grooveId === patternId || bar.fillId === patternId).length;
}

/** Entfernt das Pattern und alle Verweise darauf aus der Struktur. */
export function removePattern(song: Song, patternId: string): Song {
  const cleared = mapBars(song, (bar) =>
    bar.grooveId === patternId || bar.fillId === patternId
      ? {
          ...bar,
          grooveId: bar.grooveId === patternId ? null : bar.grooveId,
          fillId: bar.fillId === patternId ? null : bar.fillId,
        }
      : bar,
  );
  return { ...cleared, patterns: song.patterns.filter((p) => p.id !== patternId) };
}
