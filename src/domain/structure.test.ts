import { describe, expect, it } from 'vitest';
import { songWith } from '../test/songs';
import { allBars } from './songPatterns';
import {
  addAccent,
  addPlaceholder,
  appendBlockLike,
  appendSegment,
  assignPlaceholder,
  canChangeBarLength,
  changeBarLength,
  deleteBar,
  deleteSegment,
  duplicateSegment,
  insertBarAfter,
  insertBarBefore,
  insertSegmentAfter,
  moveSegment,
  removeAccent,
  renameSegment,
  setBarProps,
} from './structure';
import { nextColor, ValidationError } from './pattern';
import type { Song } from './types';

const names = (song: Song) => song.segments.map((s) => s.name);
const barsOf = (song: Song, segment = 0) => song.segments[segment]!.blocks.flatMap((b) => b.bars);

function withGrooves(...grooveNames: string[]) {
  let song = songWith({});
  const ids: string[] = [];
  for (const name of grooveNames) {
    const r = addPlaceholder(song, { kind: 'groove', name });
    song = r.song;
    ids.push(r.pattern.id);
  }
  return { song, ids };
}

describe('Spec song-structure › Segmente einfügen', () => {
  it('Erstes Segment', () => {
    const after = insertSegmentAfter(songWith({}), null);
    expect(names(after)).toEqual(['Segment 1']);
    expect(after.segments[0]!.blocks).toHaveLength(1);
    expect(barsOf(after).map((b) => [b.beats, b.grooveId, b.fillId])).toEqual(Array(4).fill([4, null, null]));
  });

  it('Segment dazwischen einfügen', () => {
    const song = ['Intro', 'Chorus'].reduce((s, name) => appendSegment(s, { name, bars: 1 }), songWith({}));
    expect(names(insertSegmentAfter(song, song.segments[0]!.id))).toEqual(['Intro', 'Segment 3', 'Chorus']);
  });
});

describe('appendSegment (Testhilfe)', () => {
  it('legt einen Block mit gleich langen Takten an', () => {
    const { song, ids } = withGrooves('A');
    const after = appendSegment(song, { name: 'Intro', bars: 4, beats: 3, grooveId: ids[0]! });
    expect(after.segments.at(-1)!.blocks).toHaveLength(1);
    expect(barsOf(after).map((b) => [b.beats, b.grooveId])).toEqual(Array(4).fill([3, ids[0]]));
  });

  it.each([0, 65])('ungültige Taktzahl %i', (bars) => {
    expect(() => appendSegment(songWith({}), { name: 'X', bars })).toThrow(/1 bis 64/);
  });

  it.each([0, 17])('ungültige Taktlänge %i', (beats) => {
    expect(() => appendSegment(songWith({}), { name: 'X', bars: 1, beats })).toThrow(/1 bis 16/);
  });
});

describe('Spec song-structure › Segmente bearbeiten', () => {
  const three = () =>
    ['Intro', 'Verse', 'Chorus'].reduce((s, name) => appendSegment(s, { name, bars: 2 }), songWith({}));

  it('Segment duplizieren', () => {
    const { song: base, ids } = withGrooves('A');
    let song = appendSegment(base, { name: 'Verse', bars: 4, grooveId: ids[0]! });
    const fill = addPlaceholder(song, { kind: 'fill', name: 'f1', length: 1 });
    song = setBarProps(fill.song, [barsOf(fill.song)[3]!.id], { fillId: fill.pattern.id });
    song = appendSegment(song, { name: 'Chorus', bars: 1 });

    const dup = duplicateSegment(song, song.segments[0]!.id);
    expect(names(dup)).toEqual(['Verse', 'Verse (Kopie)', 'Chorus']);
    const copyLast = barsOf(dup, 1)[3]!;
    expect(copyLast.fillId).toBe(fill.pattern.id);
    expect(copyLast.id).not.toBe(barsOf(dup, 0)[3]!.id);

    const edited = setBarProps(dup, [copyLast.id], { fillId: null });
    expect(barsOf(edited, 1)[3]!.fillId).toBeNull();
    expect(barsOf(edited, 0)[3]!.fillId).toBe(fill.pattern.id);
  });

  it('Segment verschieben', () => {
    const song = three();
    expect(names(moveSegment(song, song.segments[2]!.id, -1))).toEqual(['Intro', 'Chorus', 'Verse']);
    expect(names(moveSegment(song, song.segments[0]!.id, -1))).toEqual(['Intro', 'Verse', 'Chorus']);
  });

  it('Segment umbenennen (leer wird abgelehnt) und löschen', () => {
    const song = three();
    expect(names(renameSegment(song, song.segments[1]!.id, 'Strophe'))).toEqual(['Intro', 'Strophe', 'Chorus']);
    expect(names(renameSegment(song, song.segments[1]!.id, '  '))).toEqual(['Intro', 'Verse', 'Chorus']);
    expect(names(deleteSegment(song, song.segments[1]!.id))).toEqual(['Intro', 'Chorus']);
  });
});

describe('Spec song-structure › Blöcke und Takte bearbeiten', () => {
  it('Takt einfügen', () => {
    const { song: base, ids } = withGrooves('A', 'B');
    let song = appendSegment(base, { name: 'Verse', bars: 4, grooveId: ids[0]! });
    const bars = barsOf(song);
    song = setBarProps(song, [bars[1]!.id], { beats: 3, grooveId: ids[1]! });
    const after = insertBarAfter(song, bars[1]!.id);
    const block = after.segments[0]!.blocks[0]!;
    expect(block.bars).toHaveLength(5);
    expect(block.bars[2]).toMatchObject({ beats: 3, grooveId: ids[1], fillId: null, accents: [] });
  });

  it('Takt davor einfügen', () => {
    const { song: base, ids } = withGrooves('A');
    let song = appendSegment(base, { name: 'Verse', bars: 2, beats: 3, grooveId: ids[0]! });
    const first = barsOf(song)[0]!;
    const fill = addPlaceholder(song, { kind: 'fill', name: 'f', length: 1 });
    song = addAccent(setBarProps(fill.song, [first.id], { fillId: fill.pattern.id }), first.id, { instrument: 'crash', beat: 0, position: 0 });
    const after = insertBarBefore(song, first.id);
    const bars = barsOf(after);
    expect(bars).toHaveLength(3);
    expect(bars[0]).toMatchObject({ beats: 3, grooveId: ids[0], fillId: null, accents: [] });
    expect(bars[0]!.id).not.toBe(first.id);
    expect(bars[1]!.id).toBe(first.id);
  });

  it('Block unten anfügen', () => {
    const { song: base, ids } = withGrooves('A', 'B');
    let song = appendSegment(base, { name: 'Verse', bars: 2, grooveId: ids[0]! });
    song = appendBlockLike(song, song.segments[0]!.id);
    song = setBarProps(song, song.segments[0]!.blocks[1]!.bars.map((b) => b.id), { grooveId: ids[1]! });
    // letzter Block: 8 Takte, der letzte mit Groove B und Fill
    for (let i = 0; i < 6; i++) song = insertBarAfter(song, song.segments[0]!.blocks[1]!.bars.at(-1)!.id);
    const fill = addPlaceholder(song, { kind: 'fill', name: 'f', length: 1 });
    song = setBarProps(fill.song, [fill.song.segments[0]!.blocks[1]!.bars.at(-1)!.id], { fillId: fill.pattern.id });
    expect(song.segments[0]!.blocks[1]!.bars).toHaveLength(8);

    const after = appendBlockLike(song, song.segments[0]!.id);
    const added = after.segments[0]!.blocks[2]!;
    expect(after.segments[0]!.blocks).toHaveLength(3);
    expect(added.bars.map((b) => [b.beats, b.grooveId, b.fillId])).toEqual(Array(8).fill([4, ids[1], null]));
  });

  it('Block an Segment ohne Blöcke', () => {
    let song = appendSegment(songWith({}), { name: 'Verse', bars: 1 });
    song = deleteBar(song, barsOf(song)[0]!.id);
    expect(song.segments[0]!.blocks).toHaveLength(0);
    const after = appendBlockLike(song, song.segments[0]!.id);
    expect(after.segments[0]!.blocks).toHaveLength(1);
    expect(barsOf(after).map((b) => [b.beats, b.grooveId])).toEqual(Array(4).fill([4, null]));
  });

  it('Letzten Takt eines Blocks löschen', () => {
    let song = appendSegment(songWith({}), { name: 'Verse', bars: 1 });
    song = appendBlockLike(song, song.segments[0]!.id);
    const lonely = song.segments[0]!.blocks[1]!.bars[0]!;
    const after = deleteBar(song, lonely.id);
    expect(after.segments).toHaveLength(1);
    expect(after.segments[0]!.blocks).toHaveLength(1);

    const empty = deleteBar(after, barsOf(after)[0]!.id);
    expect(empty.segments).toHaveLength(1);
    expect(empty.segments[0]!.blocks).toHaveLength(0);
  });
});

describe('Spec song-structure › Takteigenschaften setzen', () => {
  it('Groove für Auswahl setzen', () => {
    const { song: base, ids } = withGrooves('A', 'B');
    const song = appendSegment(base, { name: 'Verse', bars: 8, grooveId: ids[0]! });
    const selection = barsOf(song).slice(4, 8).map((b) => b.id);
    const after = setBarProps(song, selection, { grooveId: ids[1]! });
    expect(barsOf(after).map((b) => b.grooveId)).toEqual([...Array(4).fill(ids[0]), ...Array(4).fill(ids[1])]);
  });

  it('Taktlänge ändern', () => {
    const song = appendSegment(songWith({}), { name: 'Verse', bars: 3 });
    const id = barsOf(song)[1]!.id;
    const after = changeBarLength(changeBarLength(song, [id], -1), [id], -1);
    expect(barsOf(after).map((b) => b.beats)).toEqual([4, 2, 4]);
  });

  it('Länge gemischter Auswahl erhöhen', () => {
    let song = appendSegment(songWith({}), { name: 'Verse', bars: 2 });
    song = setBarProps(song, [barsOf(song)[1]!.id], { beats: 3 });
    const ids = barsOf(song).map((b) => b.id);
    expect(canChangeBarLength(song, ids, 1)).toBe(true);
    expect(barsOf(changeBarLength(song, ids, 1)).map((b) => b.beats)).toEqual([5, 4]);
  });

  it('Grenze in gemischter Auswahl', () => {
    let song = appendSegment(songWith({}), { name: 'Verse', bars: 2 });
    song = setBarProps(song, [barsOf(song)[0]!.id], { beats: 16 });
    const ids = barsOf(song).map((b) => b.id);
    expect(canChangeBarLength(song, ids, 1)).toBe(false);
    expect(() => changeBarLength(song, ids, 1)).toThrow(ValidationError);
    expect(barsOf(song).map((b) => b.beats)).toEqual([16, 4]);
    const one = appendSegment(songWith({}), { name: 'V', bars: 1, beats: 1 });
    expect(canChangeBarLength(one, [barsOf(one)[0]!.id], -1)).toBe(false);
  });

  it('Kürzen entfernt Akzente außerhalb des Takts', () => {
    let song = appendSegment(songWith({}), { name: 'V', bars: 1 });
    const id = barsOf(song)[0]!.id;
    song = addAccent(song, id, { instrument: 'crash', beat: 3, position: 0 });
    expect(barsOf(changeBarLength(song, [id], -1))[0]!.accents).toEqual([]);
  });

  it('Fill setzen und entfernen', () => {
    const song = appendSegment(songWith({}), { name: 'V', bars: 4 });
    const fill = addPlaceholder(song, { kind: 'fill', name: 'f1', length: 1 });
    const id = barsOf(fill.song)[3]!.id;
    const withFill = setBarProps(fill.song, [id], { fillId: fill.pattern.id });
    expect(barsOf(withFill)[3]!.fillId).toBe(fill.pattern.id);
    expect(barsOf(setBarProps(withFill, [id], { fillId: null }))[3]!.fillId).toBeNull();
  });

  it('Nur Grooves als Groove und nur Fills als Fill', () => {
    const { song: base } = withGrooves('A');
    const fill = addPlaceholder(base, { kind: 'fill', name: 'f', length: 1 });
    const song = appendSegment(fill.song, { name: 'V', bars: 1 });
    const bar = barsOf(song)[0]!.id;
    expect(() => setBarProps(song, [bar], { grooveId: fill.pattern.id })).toThrow();
    expect(() => setBarProps(song, [bar], { fillId: song.patterns[0]!.id })).toThrow();
  });
});

describe('Spec song-structure › Platzhalter aus der Struktur anlegen', () => {
  it('Neuer Groove als Platzhalter', () => {
    const { song: base } = withGrooves('');
    expect(base.patterns.map((p) => p.name)).toEqual(['Groove 1']);
    const song = appendSegment(base, { name: 'Verse', bars: 8 });
    const color = nextColor(song.patterns);
    const after = assignPlaceholder(song, barsOf(song).slice(0, 4).map((b) => b.id), 'groove');
    const groove = after.patterns.at(-1)!;
    expect(groove).toMatchObject({ kind: 'groove', name: 'Groove 2', color });
    expect(groove.beats).toHaveLength(4);
    expect(groove.beats.every((b) => Object.keys(b.hits).length === 0)).toBe(true);
    expect(barsOf(after).map((b) => b.grooveId)).toEqual([...Array(4).fill(groove.id), ...Array(4).fill(null)]);
  });

  it('Neuer Fill als Platzhalter', () => {
    const song = appendSegment(songWith({}), { name: 'Verse', bars: 8 });
    const after = assignPlaceholder(song, [barsOf(song)[7]!.id], 'fill');
    const fill = after.patterns.at(-1)!;
    expect(fill).toMatchObject({ kind: 'fill', name: 'Fill 1' });
    expect(fill.beats).toHaveLength(1);
    expect(barsOf(after)[7]!.fillId).toBe(fill.id);
    expect(barsOf(after).slice(0, 7).every((b) => b.fillId === null)).toBe(true);
  });
});

describe('Spec song-structure › Akzente', () => {
  it('Crash auf der Eins', () => {
    const { song: base, ids } = withGrooves('A');
    const song = appendSegment(base, { name: 'V', bars: 1, grooveId: ids[0]! });
    const bar = barsOf(song)[0]!;
    const after = addAccent(song, bar.id, { instrument: 'crash', beat: 0, position: 0 });
    expect(barsOf(after)[0]!.accents).toEqual([{ instrument: 'crash', beat: 0, position: 0 }]);
    expect(barsOf(after)[0]!.grooveId).toBe(ids[0]);
    expect(after.patterns).toEqual(song.patterns);
    expect(barsOf(removeAccent(after, bar.id, { instrument: 'crash', beat: 0, position: 0 }))[0]!.accents).toEqual([]);
  });

  it('Akzent außerhalb des Takts', () => {
    let song = appendSegment(songWith({}), { name: 'V', bars: 1 });
    const bar = barsOf(song)[0]!.id;
    song = addAccent(song, bar, { instrument: 'crash', beat: 3, position: 0 });
    song = addAccent(song, bar, { instrument: 'ride', beat: 1, position: 2 });
    const after = setBarProps(song, [bar], { beats: 2 });
    expect(barsOf(after)[0]!.accents).toEqual([{ instrument: 'ride', beat: 1, position: 2 }]);
  });

  it('Akzent außerhalb des Takts kann nicht gesetzt werden', () => {
    const song = appendSegment(songWith({}), { name: 'V', bars: 1, beats: 2 });
    expect(() => addAccent(song, barsOf(song)[0]!.id, { instrument: 'crash', beat: 2, position: 0 })).toThrow();
  });
});

describe('Struktur-Operationen sind unveränderlich', () => {
  it('Original-Song bleibt unverändert', () => {
    const song = appendSegment(songWith({}), { name: 'V', bars: 2 });
    const before = structuredClone(song);
    setBarProps(song, [allBars(song)[0]!.id], { beats: 3 });
    duplicateSegment(song, song.segments[0]!.id);
    expect(song).toEqual(before);
  });
});
