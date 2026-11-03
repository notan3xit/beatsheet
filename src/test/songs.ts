import { createPattern } from '../domain/pattern';
import type { Bar, Pattern, Song } from '../domain/types';

let counter = 0;
const id = (prefix: string) => `${prefix}-${++counter}`;

export function barOf(overrides: Partial<Bar> = {}): Bar {
  return { id: id('bar'), beats: 4, grooveId: null, fillId: null, accents: [], ...overrides };
}

/** Testhilfe: Song mit optional einem Segment aus einem Block mit n Takten (ggf. mit einem Groove). */
export function songWith(opts: {
  title?: string;
  bars?: number;
  groove?: boolean;
  patterns?: Pattern[];
  tempo?: number;
}): Song {
  const patterns = [...(opts.patterns ?? [])];
  if (opts.groove) patterns.push(createPattern(patterns, { kind: 'groove', name: 'A' }));
  const grooveId = opts.groove ? patterns[patterns.length - 1]!.id : null;
  const now = '2026-11-01T10:00:00.000Z';
  return {
    id: id('song'),
    title: opts.title ?? 'Test',
    tempo: opts.tempo ?? 120,
    patterns,
    segments: opts.bars
      ? [
          {
            id: id('seg'),
            name: 'Verse',
            blocks: [{ id: id('block'), bars: Array.from({ length: opts.bars }, () => barOf({ grooveId })) }],
          },
        ]
      : [],
    createdAt: now,
    updatedAt: now,
    revision: 1,
  };
}
