import * as A from '@automerge/automerge/slim';
import { generateKeyBetween } from 'fractional-indexing';
import { beforeAll, describe, expect, it } from 'vitest';
import { initAutomerge } from '../persistence/songDoc';
import { createWorkbookDoc, orderOf, setPositions, type WorkbookDocument } from '../persistence/workbookDoc';
import { ordered, placeAt, slotAt, type Positions } from './songOrder';

beforeAll(initAutomerge);

const song = (id: string, title = id) => ({ id, title });
const titles = (songs: readonly { title: string }[]) => songs.map((s) => s.title);

/** Platziert und liefert die neue Anzeige. */
function moved(ids: string[], positions: Positions, songId: string, slot: number) {
  const list = ids.filter((id) => id !== songId);
  const next = { ...positions, ...placeAt(list, positions, songId, slot) };
  return titles(ordered(ids.map((id) => song(id)), next));
}

describe('Spec song-order › Reihenfolge der Kacheln', () => {
  it('ordnet ohne Positionen nach Titel', () => {
    expect(titles(ordered([song('u', 'Uprising'), song('h', 'Hysteria')], null))).toEqual(['Hysteria', 'Uprising']);
    expect(titles(ordered([song('u', 'Uprising'), song('h', 'Hysteria')], {}))).toEqual(['Hysteria', 'Uprising']);
  });

  it('stellt Songs mit Position voran, die übrigen nach Titel', () => {
    const songs = [song('a', 'Alpha'), song('b', 'Beta'), song('c', 'Gamma'), song('d', 'Delta')];
    expect(titles(ordered(songs, { c: 'a0', b: 'a1' }))).toEqual(['Gamma', 'Beta', 'Alpha', 'Delta']);
  });

  it('ordnet gleiche Positionen nach ID', () => {
    expect(titles(ordered([song('y', 'Eins'), song('x', 'Zwei')], { x: 'a0', y: 'a0' }))).toEqual(['Zwei', 'Eins']);
  });
});

describe('Spec song-order › Sortieren durch Ziehen', () => {
  it('setzt im sortierten Anfang nur den gezogenen Song', () => {
    const positions = { a: 'a0', b: 'a1', c: 'a2' };
    const written = placeAt(['a', 'b'], positions, 'c', 1);
    expect(Object.keys(written)).toEqual(['c']);
    expect(moved(['a', 'b', 'c'], positions, 'c', 1)).toEqual(['a', 'c', 'b']);
    expect(moved(['a', 'b', 'c'], positions, 'c', 0)).toEqual(['c', 'a', 'b']);
  });

  it('setzt direkt hinter dem sortierten Anfang nur den gezogenen Song', () => {
    const positions = { a: 'a0', b: 'a1' };
    expect(Object.keys(placeAt(['a', 'b', 'x', 'y'], positions, 'z', 2))).toEqual(['z']);
    expect(moved(['a', 'b', 'x', 'y', 'z'], positions, 'z', 2)).toEqual(['a', 'b', 'z', 'x', 'y']);
  });

  it('setzt in den Songs ohne Position auch die davor', () => {
    expect(placeAt(['h', 'o'], {}, 'u', 0)).toEqual({ u: expect.any(String) });
    expect(moved(['h', 'o', 'u'], {}, 'u', 0)).toEqual(['u', 'h', 'o']);
    expect(Object.keys(placeAt(['h', 's'], {}, 'x', 1)).sort()).toEqual(['h', 'x']);
    expect(moved(['h', 's'], {}, 'h', 1)).toEqual(['s', 'h']);
    expect(moved(['a', 'b', 'c', 'd'], { a: 'a0' }, 'b', 3)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('platziert zwischen zwei Songs mit gleicher Position', () => {
    const positions = { a: 'a0', b: 'a1', c: 'a1', d: 'a2' };
    expect(moved(['a', 'b', 'c', 'd', 'x'], positions, 'x', 2)).toEqual(['a', 'b', 'x', 'c', 'd']);
  });

  it('ergibt bei gleichem Zustand gleiche Werte', () => {
    expect(placeAt(['h', 'o', 's'], { h: 'a0' }, 'u', 3)).toEqual(placeAt(['h', 'o', 's'], { h: 'a0' }, 'u', 3));
  });

  it('erzeugt Positionen, die die Bibliothek fortsetzen kann', () => {
    const written = placeAt(['a'], { a: 'a0' }, 'b', 0);
    expect(() => generateKeyBetween(written.b, 'a0')).not.toThrow();
  });
});

describe('Spec song-order › Gleichzeitig sortiert', () => {
  const sorted = (ids: string[]) => {
    const positions = placeAt(ids.slice(0, -1), {}, ids.at(-1)!, ids.length - 1);
    return setPositions(createWorkbookDoc(), positions);
  };
  const apply = (doc: WorkbookDocument, actor: string, songId: string, slot: number, ids: string[]) => {
    const positions = orderOf(doc)!;
    const list = titles(ordered(ids.map((id) => song(id)), positions)).filter((id) => id !== songId);
    return setPositions(A.clone(doc, { actor }), placeAt(list, positions, songId, slot));
  };
  const both = (left: WorkbookDocument, right: WorkbookDocument, ids: string[]) =>
    [A.merge(A.clone(left), right), A.merge(A.clone(right), left)].map((doc) => titles(ordered(ids.map((id) => song(id)), orderOf(doc))));

  it('Verschiedene Songs verschoben', () => {
    const ids = ['A', 'B', 'C', 'D'];
    const doc = sorted(ids);
    expect(titles(ordered(ids.map((id) => song(id)), orderOf(doc)))).toEqual(ids);
    const artjom = apply(doc, '01'.repeat(16), 'D', 0, ids);
    const max = apply(doc, '02'.repeat(16), 'C', 1, ids);
    expect(both(artjom, max, ids)).toEqual([
      ['D', 'A', 'C', 'B'],
      ['D', 'A', 'C', 'B'],
    ]);
  });

  it('Denselben Song verschoben', () => {
    const ids = ['H', 'O', 'U'];
    const doc = sorted(ids);
    const artjom = apply(doc, '01'.repeat(16), 'U', 0, ids);
    const max = apply(doc, '02'.repeat(16), 'U', 2, ids);
    const [left, right] = both(artjom, max, ids);
    expect(left).toEqual(right);
    expect(left!.filter((id) => id === 'U')).toHaveLength(1);
  });
});

describe('slotAt', () => {
  // Zwei Zeilen: a b c, darunter d
  const rect = (left: number, top: number) => ({ left, top, width: 100, height: 80 });
  const rects = [rect(0, 0), rect(110, 0), rect(220, 0), rect(0, 90)];

  it('liefert den Platz vor der Kachel, deren linke Hälfte unter dem Zeiger liegt', () => {
    expect(slotAt(rects, 10, 40)).toBe(0);
    expect(slotAt(rects, 120, 40)).toBe(1);
    expect(slotAt(rects, 180, 40)).toBe(2);
  });

  it('liefert hinter der letzten Kachel einer Zeile den Platz am Anfang der nächsten', () => {
    expect(slotAt(rects, 300, 40)).toBe(3);
    expect(slotAt(rects, 600, 40)).toBe(3);
  });

  it('liefert in der letzten Zeile hinter der letzten Kachel das Ende', () => {
    expect(slotAt(rects, 80, 120)).toBe(4);
    expect(slotAt(rects, 300, 120)).toBe(4);
    expect(slotAt([], 0, 0)).toBe(0);
  });
});
