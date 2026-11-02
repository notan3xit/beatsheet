import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import type { Bar, Pattern, Song } from '../domain/types';
import { barOf, songWith } from '../test/songs';
import { layoutStructure, patternPageOrder, type FillItem, type Item } from './layout';

const groove = (beats: number, name: string, existing: Pattern[] = []) =>
  createPattern(existing, { kind: 'groove', name, length: beats });
const fill = (beats: number, name: string, existing: Pattern[] = []) =>
  createPattern(existing, { kind: 'fill', name, length: beats });

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

const ofKind = <K extends Item['kind']>(items: Item[], kind: K) =>
  items.filter((i): i is Extract<Item, { kind: K }> => i.kind === kind);

describe('Spec songbook-view › Maßstabsgetreue Struktur', () => {
  it('Unterschiedliche Taktlängen', () => {
    const [segment] = layoutStructure(song([], [[barOf(), barOf({ beats: 2 }), barOf()]]));
    expect(segment!.name).toBe('Segment 1');
    expect(segment!.rows[0]!.bars.map((b) => [b.x, b.width])).toEqual([
      [0, 4],
      [4, 2],
      [6, 4],
    ]);
  });

  it('Zeilenumbruch', () => {
    const [segment] = layoutStructure(song([], [Array.from({ length: 6 }, () => barOf())]));
    expect(segment!.rows.map((r) => r.bars.length)).toEqual([4, 2]);
    expect(segment!.rows[1]!.bars[0]!.x).toBe(0);
  });

  it('Kürzere Takte füllen die Zeile', () => {
    const block = [...Array.from({ length: 4 }, () => barOf({ beats: 3 })), barOf()];
    const [segment] = layoutStructure(song([], [block]));
    expect(segment!.rows.map((r) => [r.bars.length, r.width])).toEqual([[5, 16]]);
    expect(segment!.rows[0]!.bars.at(-1)!.x).toBe(12);
  });

  it('Takt passt nicht mehr in die Zeile', () => {
    const block = Array.from({ length: 6 }, () => barOf({ beats: 3 }));
    const [segment] = layoutStructure(song([], [block]));
    expect(segment!.rows.map((r) => r.bars.length)).toEqual([5, 1]);
    expect(segment!.rows.map((r) => r.firstInBlock)).toEqual([true, false]);
    expect(segment!.rows[1]!.bars[0]!.x).toBe(0);
  });

  it('Jedes Segment beginnt in einer neuen Zeile', () => {
    const layout = layoutStructure(song([], [[barOf(), barOf()]], [[barOf()]]));
    expect(layout.map((s) => s.rows.map((r) => r.bars.length))).toEqual([[2], [1]]);
  });

  it('Neuer Block in neuer Zeile', () => {
    const [segment] = layoutStructure(song([], [[barOf(), barOf()], [barOf(), barOf(), barOf(), barOf()]]));
    expect(segment!.rows.map((r) => [r.bars.length, r.blockId, r.blockStart])).toEqual([
      [2, 'block-0-0', false],
      [4, 'block-0-1', true],
    ]);
    expect(segment!.rows[1]!.bars[0]!.x).toBe(0);
  });

  it('Erste Zeile eines Blocks ist gekennzeichnet', () => {
    const block = Array.from({ length: 5 }, () => barOf());
    const [segment] = layoutStructure(song([], [block, [barOf()]]));
    expect(segment!.rows.map((r) => r.firstInBlock)).toEqual([true, false, true]);
  });

  it('Takte tragen ihre laufende Nummer; Zeilenumbruch im Block ist kein Blockanfang', () => {
    const [segment] = layoutStructure(song([], [[barOf(), barOf(), barOf(), barOf(), barOf()], [barOf()]]));
    expect(segment!.rows.map((r) => [r.bars.map((b) => b.index), r.blockStart])).toEqual([
      [[0, 1, 2, 3], false],
      [[4], false],
      [[5], true],
    ]);
    expect(segment!.rows[0]!.bars[0]).not.toHaveProperty('blockStart');
  });
});

describe('Spec songbook-view › Groove-Kennzeichnung im Takt', () => {
  it('Zweitaktiger Groove', () => {
    const a = groove(8, 'A');
    const [segment] = layoutStructure(song([a], [Array.from({ length: 4 }, () => barOf({ grooveId: a.id }))]));
    const grooves = ofKind(segment!.rows[0]!.items, 'groove');
    expect(grooves.map((g) => [g.label, g.color, g.startBeat])).toEqual(Array(2).fill([['A', a.color, 1], ['A', a.color, 5]]).flat());
  });

  it('Eintaktiger Groove', () => {
    const a = groove(4, 'A');
    const [segment] = layoutStructure(song([a], [[barOf({ grooveId: a.id })]]));
    expect(ofKind(segment!.rows[0]!.items, 'groove')).toEqual([
      expect.objectContaining({ label: 'A', startBeat: null, x: 0, width: 4 }),
    ]);
  });

  it('Takt ohne Groove ist neutral', () => {
    const [segment] = layoutStructure(song([], [[barOf()]]));
    expect(segment!.rows[0]!.items).toEqual([{ kind: 'empty', x: 0, width: 4, barId: expect.any(String) }]);
  });
});

describe('Spec songbook-view › Fill-Blöcke', () => {
  it('Kurzer Fill', () => {
    const a = groove(4, 'A');
    const f = fill(1, 'f1', [a]);
    const bars = [barOf({ grooveId: a.id }), barOf({ grooveId: a.id }), barOf({ grooveId: a.id }), barOf({ grooveId: a.id, fillId: f.id })];
    const [segment] = layoutStructure(song([a, f], [bars]));
    const items = segment!.rows[0]!.items;
    expect(ofKind(items, 'groove').at(-1)).toMatchObject({ x: 12, width: 3 });
    expect(ofKind(items, 'fill')).toEqual([
      expect.objectContaining({ x: 15, width: 1, label: 'f1', color: f.color, barlines: [], continuesLeft: false, continuesRight: false }),
    ]);
    expect(ofKind(items, 'fill')[0]).not.toHaveProperty('mini');
    // Fill übernimmt von rechts: an der Grenze Groove/Fill liegt keine Taktgrenze
    expect(ofKind(items, 'groove').at(-1)).toMatchObject({ atBarStart: true, atBarEnd: false });
    expect(ofKind(items, 'fill')[0]).toMatchObject({ atBarStart: false, atBarEnd: true });
    expect(ofKind(items, 'groove')[0]).toMatchObject({ atBarStart: true, atBarEnd: true });
  });

  it('Fill über Taktgrenze', () => {
    const a = groove(4, 'A');
    const f = fill(6, 'f4', [a]);
    const bars = [barOf({ grooveId: a.id }), barOf({ grooveId: a.id }), barOf({ grooveId: a.id }), barOf({ grooveId: a.id, fillId: f.id })];
    const [segment] = layoutStructure(song([a, f], [bars]));
    const items = segment!.rows[0]!.items;
    expect(ofKind(items, 'fill')).toEqual([expect.objectContaining({ x: 10, width: 6, barlines: [12] })]);
    expect(ofKind(items, 'fill')[0]).toMatchObject({ atBarStart: false, atBarEnd: true });
    expect(ofKind(items, 'groove').at(-1)).toMatchObject({ x: 8, width: 2, atBarStart: true, atBarEnd: false });
    expect(ofKind(items, 'groove').map((g) => [g.x, g.width])).toEqual([
      [0, 4],
      [4, 4],
      [8, 2],
    ]);
  });

  it('Fill über Zeilenumbruch', () => {
    const f = fill(8, 'Build', []);
    const bars = [barOf(), barOf(), barOf(), barOf(), barOf({ fillId: f.id })];
    const [segment] = layoutStructure(song([f], [bars]));
    const [first, second] = segment!.rows.map((r) => ofKind(r.items, 'fill'));
    expect(first).toEqual([expect.objectContaining({ x: 12, width: 4, continuesLeft: false, continuesRight: true })]);
    expect(second).toEqual([expect.objectContaining({ x: 0, width: 4, continuesLeft: true, continuesRight: false })]);
  });

  it('Reiner Fill-Takt', () => {
    const f = fill(4, 'f', []);
    const [segment] = layoutStructure(song([f], [[barOf({ fillId: f.id })]]));
    expect(ofKind(segment!.rows[0]!.items, 'fill')).toEqual([expect.objectContaining({ width: 4 })]);
    expect(ofKind(segment!.rows[0]!.items, 'empty')).toEqual([]);
  });

  it('Fill über Blockgrenze wird an der Zeile geteilt', () => {
    const f = fill(6, 'Build', []);
    const [segment] = layoutStructure(song([f], [[barOf(), barOf()], [barOf({ fillId: f.id })]]));
    const [first, second] = segment!.rows.map((r) => ofKind(r.items, 'fill'));
    expect(first).toEqual([expect.objectContaining({ x: 6, width: 2, continuesRight: true })]);
    expect(second).toEqual([expect.objectContaining({ x: 0, width: 4, continuesLeft: true })]);
  });
});

describe('Spec songbook-view › Akzent-Markierungen', () => {
  it('Crash auf der Eins', () => {
    const a = groove(4, 'A');
    const bars = [barOf({ grooveId: a.id, accents: [{ instrument: 'crash', beat: 0, position: 0 }] }), barOf({ accents: [{ instrument: 'ride', beat: 1, position: 2 }] })];
    const [segment] = layoutStructure(song([a], [bars]));
    expect(ofKind(segment!.rows[0]!.items, 'accent')).toEqual([
      { kind: 'accent', x: 0, label: 'Cr', barId: bars[0]!.id },
      { kind: 'accent', x: 5.5, label: 'Ri', barId: bars[1]!.id },
    ]);
  });
});

describe('Spec songbook-view › Patternseite', () => {
  it('Reihenfolge', () => {
    const a = groove(4, 'A');
    const b = groove(4, 'B', [a]);
    const c = groove(4, 'C', [a, b]);
    const z = fill(1, 'Z', [a, b, c]);
    const y = fill(1, 'Y', [a, b, c, z]);
    const s = song([a, b, c, z, y], [[barOf({ grooveId: b.id }), barOf({ grooveId: a.id, fillId: z.id })]]);
    expect(patternPageOrder(s).map((p) => p.name)).toEqual(['B', 'A', 'C', 'Z', 'Y']);
  });
});

describe('Fill-Element enthält alle Angaben für die Darstellung', () => {
  it('Fill-Element ist typisiert', () => {
    const f = fill(4, 'f', []);
    const [segment] = layoutStructure(song([f], [[barOf({ fillId: f.id })]]));
    const item = segment!.rows[0]!.items.find((i) => i.kind === 'fill') as FillItem;
    expect(item.patternId).toBe(f.id);
  });
});
