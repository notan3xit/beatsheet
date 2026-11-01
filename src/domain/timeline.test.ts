import { describe, expect, it } from 'vitest';
import { barOf, songWith } from '../test/songs';
import { createPattern } from './pattern';
import { resolveSong } from './timeline';
import type { Bar, Pattern, Song } from './types';

const groove = (beats: number, name = 'A') => createPattern([], { kind: 'groove', name, length: beats });
const fill = (beats: number, name = 'f') => createPattern([], { kind: 'fill', name, length: beats });

/** Song aus Blöcken (Liste von Takten) in einem oder mehreren Segmenten. */
function song(patterns: Pattern[], ...segments: Bar[][][]): Song {
  return {
    ...songWith({ patterns }),
    segments: segments.map((blocks, s) => ({
      id: `seg-${s}`,
      name: `S${s}`,
      blocks: blocks.map((bars, b) => ({ id: `block-${s}-${b}`, bars })),
    })),
  };
}

describe('Spec song-structure › Fortlauf mehrtaktiger Grooves', () => {
  it('Zweitaktiger Groove', () => {
    const a = groove(8);
    const s = song([a], [Array.from({ length: 4 }, () => barOf({ grooveId: a.id }))]);
    expect(resolveSong(s).map((r) => r.groove?.offset)).toEqual([0, 4, 0, 4]);
  });

  it('Ungerade Taktlängen', () => {
    const a = groove(8);
    const s = song([a], [[barOf({ grooveId: a.id }), barOf({ grooveId: a.id, beats: 2 }), barOf({ grooveId: a.id })]]);
    const resolved = resolveSong(s);
    expect(resolved.map((r) => r.groove?.offset)).toEqual([0, 4, 6]);
    expect(resolved.map((r) => [r.start, r.beats])).toEqual([
      [0, 4],
      [4, 2],
      [6, 4],
    ]);
  });

  it('Neustart am Blockanfang', () => {
    const a = groove(8);
    const s = song([a], [[barOf({ grooveId: a.id })], [barOf({ grooveId: a.id })]]);
    expect(resolveSong(s).map((r) => r.groove?.offset)).toEqual([0, 0]);
  });

  it('Neustart bei Groove-Wechsel und nach Takt ohne Groove', () => {
    const a = groove(8);
    const b = groove(4, 'B');
    const s = song(
      [a, b],
      [
        [
          barOf({ grooveId: a.id }),
          barOf({ grooveId: b.id }),
          barOf({ grooveId: a.id }),
          barOf({ grooveId: a.id }),
          barOf(),
          barOf({ grooveId: a.id }),
        ],
      ],
    );
    expect(resolveSong(s).map((r) => r.groove?.offset ?? null)).toEqual([0, 0, 0, 4, null, 0]);
  });
});

describe('Spec song-structure › Fill überlagert von rechts', () => {
  it('Fill über einen Beat', () => {
    const a = groove(4);
    const f1 = fill(1);
    const bars = [1, 2, 3].map(() => barOf({ grooveId: a.id }));
    const s = song([a, f1], [[...bars, barOf({ grooveId: a.id, fillId: f1.id })]]);
    const last = resolveSong(s)[3]!;
    expect(last.groove).toEqual({ patternId: a.id, offset: 0 });
    expect(last.coveredFrom).toBe(3);
    expect(last.fills).toEqual([{ patternId: f1.id, from: 3, to: 4, fillOffset: 0 }]);
  });

  it('Fill über Taktgrenze', () => {
    const a = groove(4);
    const f4 = fill(6);
    const s = song([a, f4], [[barOf({ grooveId: a.id }), barOf({ grooveId: a.id }), barOf({ grooveId: a.id }), barOf({ grooveId: a.id, fillId: f4.id })]]);
    const r = resolveSong(s);
    expect(r[1]!.fills).toEqual([]);
    expect(r[2]!.coveredFrom).toBe(2);
    expect(r[2]!.fills).toEqual([{ patternId: f4.id, from: 2, to: 4, fillOffset: 0 }]);
    expect(r[3]!.coveredFrom).toBe(0);
    expect(r[3]!.fills).toEqual([{ patternId: f4.id, from: 0, to: 4, fillOffset: 2 }]);
  });

  it('Reiner Fill-Takt', () => {
    const f = fill(4);
    const r = resolveSong(song([f], [[barOf({ fillId: f.id })]]))[0]!;
    expect(r.groove).toBeNull();
    expect(r.coveredFrom).toBe(0);
    expect(r.fills).toEqual([{ patternId: f.id, from: 0, to: 4, fillOffset: 0 }]);
  });

  it('Fill über Segmentgrenze', () => {
    const f = fill(6);
    const r = resolveSong(song([f], [[barOf()]], [[barOf({ fillId: f.id })]]));
    expect(r[0]!.fills).toEqual([{ patternId: f.id, from: 2, to: 4, fillOffset: 0 }]);
    expect(r[1]!.fills).toEqual([{ patternId: f.id, from: 0, to: 4, fillOffset: 2 }]);
  });

  it('Fill über den Songanfang wird abgeschnitten', () => {
    const f = fill(6);
    const r = resolveSong(song([f], [[barOf({ fillId: f.id })]]))[0]!;
    expect(r.fills).toEqual([{ patternId: f.id, from: 0, to: 4, fillOffset: 2 }]);
  });

  it('Überlappende Fills: der später endende gewinnt', () => {
    const f6 = fill(6, 'früh');
    const g6 = fill(6, 'spät');
    const r = resolveSong(song([f6, g6], [[barOf(), barOf({ fillId: f6.id }), barOf({ fillId: g6.id })]]));
    expect(r[1]!.fills).toEqual([
      { patternId: f6.id, from: 0, to: 2, fillOffset: 2 },
      { patternId: g6.id, from: 2, to: 4, fillOffset: 0 },
    ]);
    expect(r[0]!.fills).toEqual([{ patternId: f6.id, from: 2, to: 4, fillOffset: 0 }]);
  });
});

describe('Spec song-structure › Akzente (Timeline)', () => {
  it('Crash auf der Eins wird zusätzlich gespielt', () => {
    const a = groove(4);
    const accent = { instrument: 'crash' as const, beat: 0, position: 0 as const };
    const r = resolveSong(song([a], [[barOf({ grooveId: a.id, accents: [accent] })]]))[0]!;
    expect(r.accents).toEqual([accent]);
    expect(r.groove).toEqual({ patternId: a.id, offset: 0 });
  });
});
