import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import type { Bar, Pattern, Song } from '../domain/types';
import { barOf, songWith } from '../test/songs';
import { historyMotif, songMotif } from './motif';

function song(patterns: Pattern[], ...segments: Bar[][][]): Song {
  return {
    ...songWith({ patterns }),
    segments: segments.map((blocks, s) => ({
      id: `seg-${s}`,
      name: `Segment ${s + 1}`,
      blocks: blocks.map((bars, b) => ({ id: `block-${s}-${b}`, bars })),
    })),
  };
}

const verse = createPattern([], { kind: 'groove', name: 'Verse' });
const chorus = createPattern([verse], { kind: 'groove', name: 'Chorus' });
const roll = createPattern([verse, chorus], { kind: 'fill', name: 'Roll', length: 2 });
const patterns = [verse, chorus, roll];
const bars = (n: number, overrides: Partial<Bar> = {}) => Array.from({ length: n }, () => barOf(overrides));

describe('Spec song-motif › Aufbau des Motivs', () => {
  it('Gleicher Groove über mehrere Takte', () => {
    const [row] = songMotif(song(patterns, [bars(4, { grooveId: verse.id })]));
    expect(row!.strokes).toEqual([{ x: 0, width: 16, color: verse.color, kind: 'groove' }]);
    expect(row!.dots).toEqual([]);
  });

  it('Fill am Ende einer Phrase', () => {
    const phrase = [...bars(3, { grooveId: verse.id }), barOf({ grooveId: verse.id, fillId: roll.id })];
    const [row] = songMotif(song(patterns, [phrase]));
    expect(row!.strokes).toEqual([
      { x: 0, width: 14, color: verse.color, kind: 'groove' },
      { x: 14, width: 2, color: roll.color, kind: 'fill' },
    ]);
  });

  it('Groove-Wechsel trennt die Striche', () => {
    const [row] = songMotif(song(patterns, [[...bars(2, { grooveId: verse.id }), ...bars(2, { grooveId: chorus.id })]]));
    expect(row!.strokes.map((s) => [s.x, s.width, s.color])).toEqual([
      [0, 8, verse.color],
      [8, 8, chorus.color],
    ]);
  });

  it('Leerer Takt', () => {
    const [row] = songMotif(song(patterns, [[...bars(2), ...bars(2, { grooveId: verse.id })]]));
    expect(row!.dots).toEqual([2, 6]);
    expect(row!.strokes).toEqual([{ x: 8, width: 8, color: verse.color, kind: 'groove' }]);
  });

  it('Blöcke und Segmente', () => {
    const block = () => bars(4, { grooveId: verse.id });
    expect(songMotif(song(patterns, [block(), block()], [block(), block()]))).toHaveLength(4);
  });

  it('Zeilenumbruch wie auf der Strukturseite', () => {
    expect(songMotif(song(patterns, [bars(6, { grooveId: verse.id })])).map((r) => r.strokes[0]!.width)).toEqual([16, 8]);
  });
});

describe('Spec song-motif › Darstellung des Motivs', () => {
  it('Langer Song: nur die ersten 12 Reihen', () => {
    const blocks = Array.from({ length: 30 }, () => bars(4, { grooveId: verse.id }));
    expect(songMotif(song(patterns, blocks))).toHaveLength(12);
  });
});

describe('Spec song-motif › Motiv eines leeren Songs', () => {
  it('Neuer Song', () => {
    expect(songMotif(songWith({}))).toEqual([]);
  });
});

describe('Spec song-history › Vergleich der Struktur (Motiv)', () => {
  it('Segmente mit Namen, Zeilen ohne Grenze, je Takt mit ID, Nummer, Groove und Fill', () => {
    const many = Array.from({ length: 14 }, () => [bars(4, { grooveId: verse.id })]);
    const intro = [bars(2, { grooveId: chorus.id }), [barOf({ grooveId: verse.id, fillId: roll.id }), barOf()]];
    const motif = historyMotif(song(patterns, intro, ...many));
    expect(motif).toHaveLength(15);
    expect(motif[0]!.name).toBe('Segment 1');
    // Jeder Block beginnt eine neue Zeile
    const [first, second] = motif[0]!.rows;
    expect(first!.map((b) => [b.number, b.x, b.width])).toEqual([[1, 0, 4], [2, 4, 4]]);
    expect(second![0]).toMatchObject({ number: 3, x: 0, width: 4, groove: { patternId: verse.id, color: verse.color } });
    expect(second![0]!.fill).toEqual({ patternId: roll.id, color: roll.color, x: 2, width: 2 });
    expect(second![1]).toMatchObject({ number: 4, groove: null, fill: null });
    expect(second![0]!.barId).toBe(intro[1]![0]!.id);
    expect(motif.flatMap((s) => s.rows)).toHaveLength(16);
  });

  it('Mehr als 16 Beats je Block brechen in eine neue Zeile um', () => {
    const [segment] = historyMotif(song(patterns, [bars(5, { grooveId: verse.id })]));
    expect(segment!.rows.map((row) => row.length)).toEqual([4, 1]);
  });
});
