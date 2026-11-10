import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import type { Accent, Bar, Pattern, Song } from '../domain/types';
import { barOf, songWith } from '../test/songs';
import { patternOf } from '../test/patterns';
import { layoutStructure, selectedPatterns, songPatternOrder, type FillItem, type Item } from './layout';

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
      { kind: 'accent', x: 0, label: 'Cr', place: 'top', barId: bars[0]!.id },
      { kind: 'accent', x: 5.5, label: 'Ri', place: 'top', barId: bars[1]!.id },
    ]);
  });

  const accentsOf = (accents: Accent[]) => {
    const [segment] = layoutStructure(song([], [[barOf({ accents })]]));
    return ofKind(segment!.rows[0]!.items, 'accent').map(({ x, label, place }) => ({ x, label, place }));
  };

  it('Hand und Fuß auf demselben Schlag', () => {
    const shown = accentsOf([
      { instrument: 'kick', beat: 0, position: 0 },
      { instrument: 'crash', beat: 0, position: 0 },
    ]);
    expect(shown).toHaveLength(2);
    expect(shown).toEqual(
      expect.arrayContaining([
        { x: 0, label: 'Cr', place: 'top' },
        { x: 0, label: 'BD', place: 'bottom' },
      ]),
    );
  });

  it('Mehrere Hand-Akzente in einem Beat', () => {
    expect(
      accentsOf([
        { instrument: 'snare', beat: 1, position: 0 },
        { instrument: 'crash', beat: 1, position: 2 },
      ]),
    ).toEqual([{ x: 1.5, label: 'Cr', place: 'top' }]);
  });

  it('Mehrere Fuß-Akzente in einem Beat', () => {
    expect(
      accentsOf([
        { instrument: 'kick', beat: 0, position: 0 },
        { instrument: 'hihatPedal', beat: 0, position: 0 },
      ]),
    ).toEqual([{ x: 0, label: 'HP', place: 'bottom' }]);
  });

  it('Verschiedene Beats', () => {
    expect(
      accentsOf([
        { instrument: 'crash', beat: 0, position: 0 },
        { instrument: 'ride', beat: 1, position: 0 },
      ]),
    ).toEqual([
      { x: 0, label: 'Cr', place: 'top' },
      { x: 1, label: 'Ri', place: 'top' },
    ]);
  });
});

describe('Spec songbook-view › Patternseite', () => {
  it('Reihenfolge', () => {
    const a = groove(4, 'A');
    const b = groove(4, 'B', [a]);
    const c = groove(4, 'C', [a, b]);
    const f1 = fill(1, 'f1', [a, b, c]);
    const f2 = fill(1, 'f2', [a, b, c, f1]);
    const s = song(
      [a, b, c, f1, f2],
      [[barOf({ grooveId: b.id }), barOf({ grooveId: b.id, fillId: f1.id }), barOf({ grooveId: a.id })]],
    );
    expect(songPatternOrder(s).map((p) => p.name)).toEqual(['B', 'f1', 'A', 'C', 'f2']);
  });

  it('Nicht verwendete Patterns: Grooves vor Fills, jeweils alphabetisch', () => {
    const y = fill(1, 'Y');
    const d = groove(4, 'd', [y]);
    const x = fill(1, 'X', [y, d]);
    const c = groove(4, 'C', [y, d, x]);
    expect(songPatternOrder(song([y, d, x, c], [[barOf({})]])).map((p) => p.name)).toEqual(['C', 'd', 'X', 'Y']);
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

describe('Spec songbook-view › Groove-Kennzeichnung im Takt (Name nur bei Wechsel)', () => {
  const shown = (segments: ReturnType<typeof layoutStructure>) =>
    segments.map((s) => s.rows.flatMap((r) => ofKind(r.items, 'groove').map((g) => (g.showLabel ? g.label : '-'))));

  it('Zweitaktiger Groove', () => {
    const a = groove(8, 'A');
    const layout = layoutStructure(song([a], [Array.from({ length: 4 }, () => barOf({ grooveId: a.id }))]));
    expect(shown(layout)).toEqual([['A', '-', '-', '-']]);
  });

  it('Eintaktiger Groove', () => {
    const a = groove(4, 'A');
    expect(shown(layoutStructure(song([a], [[barOf({ grooveId: a.id })]])))).toEqual([['A']]);
  });

  it('Groove-Wechsel', () => {
    const a = groove(4, 'A');
    const b = groove(4, 'B', [a]);
    const ids = [a, a, b, b, a].map((p) => p.id);
    const layout = layoutStructure(song([a, b], [ids.map((grooveId) => barOf({ grooveId }))]));
    expect(shown(layout)).toEqual([['A', '-', 'B', '-', 'A']]);
  });

  it('Neues Segment', () => {
    const a = groove(4, 'A');
    const layout = layoutStructure(song([a], [[barOf({ grooveId: a.id })]], [[barOf({ grooveId: a.id })]]));
    expect(shown(layout)).toEqual([['A'], ['A']]);
  });

  it('Takt ohne Groove dazwischen', () => {
    const a = groove(4, 'A');
    const layout = layoutStructure(song([a], [[barOf({ grooveId: a.id }), barOf(), barOf({ grooveId: a.id })]]));
    expect(shown(layout)).toEqual([['A', 'A']]);
  });

  it('Zeilen- und Blockgrenze im selben Segment zählen nicht als Wechsel', () => {
    const a = groove(4, 'A');
    const bars = () => Array.from({ length: 5 }, () => barOf({ grooveId: a.id }));
    const layout = layoutStructure(song([a], [bars(), bars()]));
    expect(shown(layout)).toEqual([['A', ...Array(9).fill('-')]]);
  });
});

describe('Fills ihren Takten zuordnen (selection-highlight D2)', () => {
  it('Fill über einen Teil des Vortakts gehört nur zu seinem Takt', () => {
    const f = fill(6, 'f', []);
    const bars = [barOf(), barOf({ fillId: f.id })];
    const [segment] = layoutStructure(song([f], [bars]));
    expect(ofKind(segment!.rows[0]!.items, 'fill')[0]!.barIds).toEqual([bars[1]!.id]);
  });

  it('Fill, der den Vortakt ganz überdeckt, gehört zu beiden', () => {
    const f = fill(8, 'f', []);
    const bars = [barOf(), barOf({ fillId: f.id })];
    const [segment] = layoutStructure(song([f], [bars]));
    expect(ofKind(segment!.rows[0]!.items, 'fill')[0]!.barIds).toEqual([bars[0]!.id, bars[1]!.id]);
  });

  it('über einen Zeilenumbruch tragen beide Teile alle Takte', () => {
    const f = fill(8, 'Build', []);
    const bars = [barOf(), barOf(), barOf(), barOf(), barOf({ fillId: f.id })];
    const [segment] = layoutStructure(song([f], [bars]));
    const parts = segment!.rows.map((r) => ofKind(r.items, 'fill')[0]!.barIds);
    expect(parts).toEqual([
      [bars[3]!.id, bars[4]!.id],
      [bars[3]!.id, bars[4]!.id],
    ]);
  });
});

describe('Spec songbook-view › Fill-Kurzschrift (Layout)', () => {
  /** Fill mit Schlägen; Positionen 1-basiert wie in patternOf. */
  const fillWith = (beats: Parameters<typeof patternOf>[0]) => ({ ...patternOf(beats, 'fill'), name: 'F' });

  it('kurzer Fill: Zeichen mittig im Rasterplatz', () => {
    const f = fillWith([{ sub: 2, hits: { snare: [1], tom1: [2] } }]);
    const bars = [barOf({ fillId: f.id })];
    const [segment] = layoutStructure(song([f], [bars]));
    expect(ofKind(segment!.rows[0]!.items, 'fill')[0]!.marks).toEqual([
      { x: 0.25, level: 1, char: 's' },
      { x: 0.75, level: 0, char: 't' },
    ]);
  });

  it('über den Zeilenumbruch geteilt: jeder Teil zeigt seine Zeichen', () => {
    const f = fillWith([...Array.from({ length: 4 }, () => ({ hits: { snare: [1] } })), ...Array.from({ length: 4 }, () => ({ hits: { kick: [1] } }))]);
    const bars = [barOf(), barOf(), barOf(), barOf(), barOf({ fillId: f.id })];
    const [segment] = layoutStructure(song([f], [bars]));
    const parts = segment!.rows.map((r) => ofKind(r.items, 'fill')[0]!.marks.map((m) => [m.x, m.char]));
    expect(parts).toEqual([
      [[0.125, 's'], [1.125, 's'], [2.125, 's'], [3.125, 's']],
      [[0.125, 'k'], [1.125, 'k'], [2.125, 'k'], [3.125, 'k']],
    ]);
  });

  it('am Songanfang abgeschnitten: nur der sichtbare Teil', () => {
    const f = fillWith([{ hits: { snare: [1] } }, { hits: { snare: [1] } }, { hits: { tom1: [1] } }, { hits: { floorTom: [1] } }, { hits: { kick: [1] } }, { hits: { crash: [1] } }]);
    const bars = [barOf({ fillId: f.id })];
    const [segment] = layoutStructure(song([f], [bars]));
    const fillItem = ofKind(segment!.rows[0]!.items, 'fill')[0]!;
    expect(fillItem.width).toBe(4);
    expect(fillItem.marks.map((m) => [m.x, m.char])).toEqual([
      [0.125, 't'],
      [1.125, 'f'],
      [2.125, 'k'],
      [3.125, 'c'],
    ]);
  });
});

describe('Spec songbook-view › Patterns ausgewählter Takte', () => {
  const a = groove(4, 'A');
  const b = groove(4, 'B', [a]);

  it('Takt mit Groove und Fill', () => {
    const f = fill(1, 'f1', [a, b]);
    const bars = [barOf({ grooveId: a.id, fillId: f.id })];
    expect(selectedPatterns(song([a, f], [bars]), [bars[0]!.id])).toEqual({ grooveId: a.id, fillId: f.id, patternIds: new Set([a.id, f.id]) });
  });

  it('Takt ohne Groove und Fill', () => {
    const bars = [barOf()];
    expect(selectedPatterns(song([], [bars]), [bars[0]!.id])).toEqual({ grooveId: null, fillId: null, patternIds: new Set() });
  });

  it('Von einem Fill überdeckter Takt', () => {
    const f = fill(8, 'f1', [a, b]);
    const bars = [barOf({ grooveId: a.id }), barOf({ grooveId: a.id, fillId: f.id })];
    expect(selectedPatterns(song([a, f], [bars]), [bars[0]!.id])).toEqual({ grooveId: a.id, fillId: f.id, patternIds: new Set([a.id, f.id]) });
  });

  it('Nur teilweise überdeckter Takt hat den Fill nicht', () => {
    const f = fill(6, 'f1', [a, b]);
    const bars = [barOf({ grooveId: a.id }), barOf({ grooveId: a.id, fillId: f.id })];
    expect(selectedPatterns(song([a, f], [bars]), [bars[0]!.id]).fillId).toBeNull();
  });

  it('Mehrere Takte mit gleichem Groove und verschiedenen Fills', () => {
    const f = fill(1, 'f1', [a, b]);
    const bars = [barOf({ grooveId: a.id }), barOf({ grooveId: a.id, fillId: f.id })];
    expect(selectedPatterns(song([a, f], [bars]), bars.map((x) => x.id))).toEqual({ grooveId: a.id, fillId: null, patternIds: new Set([a.id, f.id]) });
  });

  it('Mehrere Takte mit verschiedenen Grooves', () => {
    const bars = [barOf({ grooveId: a.id }), barOf({ grooveId: b.id })];
    expect(selectedPatterns(song([a, b], [bars]), bars.map((x) => x.id))).toEqual({ grooveId: null, fillId: null, patternIds: new Set([a.id, b.id]) });
  });
});

describe('Spec songbook-view › Wiederholte Blöcke', () => {
  const a = groove(4, 'A');
  const b = groove(4, 'B', [a]);
  const f1 = fill(1, 'f1', [a, b]);
  const f2 = fill(1, 'f2', [a, b, f1]);
  const patterns = [a, b, f1, f2];
  /** Block aus vier Takten Groove A, der letzte mit Fill. */
  const phrase = (fillId: string | null = f1.id) => [barOf({ grooveId: a.id }), barOf({ grooveId: a.id }), barOf({ grooveId: a.id }), barOf({ grooveId: a.id, fillId })];
  const flags = (layout: ReturnType<typeof layoutStructure>) => layout.map((s) => s.rows.map((r) => r.flat));

  it('Wiederholter Block', () => {
    expect(flags(layoutStructure(song(patterns, [phrase(), phrase(), phrase(), phrase()])))).toEqual([[false, true, true, true]]);
  });

  it('Block mit anderem Fill', () => {
    expect(flags(layoutStructure(song(patterns, [phrase(f1.id), phrase(f2.id)])))).toEqual([[false, false]]);
  });

  it('Früherer Block im selben Segment', () => {
    const other = [barOf({ grooveId: b.id }), barOf({ grooveId: b.id }), barOf({ grooveId: b.id }), barOf({ grooveId: b.id })];
    expect(flags(layoutStructure(song(patterns, [phrase(), other, phrase()])))).toEqual([[false, false, true]]);
  });

  it('Block aus einem früheren Segment', () => {
    const longer = () => [...phrase(), barOf({ grooveId: a.id, fillId: f2.id })];
    expect(flags(layoutStructure(song(patterns, [phrase(), phrase()], [phrase(), longer()])))).toEqual([
      [false, true],
      // zweiter Block mit 5 Takten: zwei volle Zeilen
      [true, false, false],
    ]);
  });

  it('Fill aus dem folgenden Block', () => {
    const long = fill(6, 'lang', patterns);
    const next = [barOf({ grooveId: b.id, fillId: long.id })];
    expect(flags(layoutStructure(song([...patterns, long], [phrase(), phrase(), next])))).toEqual([[false, false, false]]);
  });

  it('Wiederholtes Segment', () => {
    const chorus = () => [[barOf({ grooveId: b.id }), barOf({ grooveId: b.id, fillId: f2.id })]];
    const layout = layoutStructure(song(patterns, [phrase()], chorus(), [phrase()], chorus()));
    expect(flags(layout)).toEqual([[false], [false], [true], [true]]);
    expect(layout[2]!.name).toBe('Segment 3');
  });

  it('Gleiches Segment mit anderem Namen', () => {
    const s = song(patterns, [phrase(), phrase()], [phrase(), phrase()]);
    s.segments[0]!.name = 'Verse';
    s.segments[1]!.name = 'Solo';
    expect(flags(layoutStructure(s))).toEqual([
      [false, true],
      [true, true],
    ]);
  });

  it('Mehrzeiliger Block: alle Zeilen der Wiederholung sind flach', () => {
    const long = () => Array.from({ length: 6 }, () => barOf({ grooveId: a.id }));
    expect(flags(layoutStructure(song(patterns, [long(), long()])))).toEqual([[false, false, true, true]]);
  });
});

describe('Spec songbook-view › Leere Blöcke', () => {
  const a = groove(4, 'A');
  const empty = () => [barOf(), barOf(), barOf(), barOf()];
  const flags = (layout: ReturnType<typeof layoutStructure>) => layout.map((s) => s.rows.map((r) => r.flat));

  it('Leeres Intro', () => {
    expect(flags(layoutStructure(song([a], [empty()], [[barOf({ grooveId: a.id })]]), { locked: true }))).toEqual([[true], [false]]);
  });

  it('Entsperren', () => {
    expect(flags(layoutStructure(song([a], [empty()], [[barOf({ grooveId: a.id })]]), { locked: false }))).toEqual([[false], [false]]);
    expect(flags(layoutStructure(song([a], [empty()])))).toEqual([[false]]);
  });

  it('Neues leeres Segment', () => {
    expect(flags(layoutStructure(song([a], [empty()], [empty()])))).toEqual([[false], [false]]);
  });

  it('Leere Blöcke hintereinander', () => {
    expect(flags(layoutStructure(song([a], [empty(), empty()])))).toEqual([[false, false]]);
  });

  it('Wiederholtes Segment mit leerem Block: nur der gefüllte Block ist flach', () => {
    const filled = () => [barOf({ grooveId: a.id })];
    expect(flags(layoutStructure(song([a], [empty(), filled()], [empty(), filled()])))).toEqual([
      [false, false],
      [false, true],
    ]);
  });

  it('Leerer Takt mit Akzent', () => {
    const bars = [barOf({ accents: [{ instrument: 'crash', beat: 0, position: 0 }] })];
    expect(flags(layoutStructure(song([a], [bars]), { locked: true }))).toEqual([[false]]);
  });

  it('Teilweise leerer Block', () => {
    const bars = [barOf(), barOf(), barOf({ grooveId: a.id }), barOf({ grooveId: a.id })];
    expect(flags(layoutStructure(song([a], [bars]), { locked: true }))).toEqual([[false]]);
  });

  it('Vom Fill des folgenden Blocks erreichter Block ist nicht leer', () => {
    const f = fill(6, 'f', [a]);
    expect(flags(layoutStructure(song([a, f], [empty(), [barOf({ grooveId: a.id, fillId: f.id })]]), { locked: true }))).toEqual([[false, false]]);
  });
});

describe('Spec songbook-view › Struktur ausklappen', () => {
  it('Ausgeklappt ist keine Zeile flach, auch kein leerer Block im gesperrten Song', () => {
    const a = groove(4, 'A');
    const phrase = () => [barOf({ grooveId: a.id }), barOf({ grooveId: a.id })];
    const layout = layoutStructure(song([a], [[barOf(), barOf()]], [phrase(), phrase()], [phrase()]), { locked: true, expanded: true });
    expect(layout.flatMap((s) => s.rows.map((r) => r.flat))).toEqual([false, false, false, false]);
  });
});
