import { describe, expect, it } from 'vitest';
import type { Song } from '../domain/types';
import { appendSegment } from '../domain/structure';
import { songWith } from '../test/songs';
import { mergeImport } from './merge';

function version(base: Song, revision: number, updatedAt = '2026-11-01T10:00:00.000Z', title = base.title): Song {
  return { ...base, revision, updatedAt, title };
}

describe('Spec library-persistence › Import einer Bibliothek', () => {
  it('Neue Patterns importieren', () => {
    const local = [songWith({ title: 'Lokal' })];
    const incoming = [songWith({ title: 'A', groove: true }), songWith({ title: 'B', groove: true })];
    const { items, changed, summary } = mergeImport(local, incoming);
    expect(items.map((s) => s.title)).toEqual(['Lokal', 'A', 'B']);
    expect(changed).toEqual(incoming);
    expect(summary).toEqual({ added: 2, updated: 0, unchanged: 0 });
  });

  it('Neuere Fassung gewinnt', () => {
    const base = songWith({ title: 'Hysteria', groove: true });
    const local = version(base, 2);
    const incoming = version(appendSegment(base, { name: 'Verse', bars: 8 }), 5, undefined, 'Importiert');
    const { items, summary } = mergeImport([local], [incoming]);
    expect(items).toEqual([incoming]);
    expect(summary).toEqual({ added: 0, updated: 1, unchanged: 0 });
  });

  it('Ältere Fassung wird ignoriert', () => {
    const base = songWith({ title: 'Hysteria' });
    const local = version(base, 5);
    const { items, changed, summary } = mergeImport([local], [version(base, 2, undefined, 'Alt')]);
    expect(items).toEqual([local]);
    expect(changed).toEqual([]);
    expect(summary).toEqual({ added: 0, updated: 0, unchanged: 1 });
  });

  it('Gleiche Revision: späterer Änderungszeitpunkt gewinnt', () => {
    const base = songWith({});
    const older = version(base, 3, '2026-11-01T10:00:00.000Z', 'Älter');
    const newer = version(base, 3, '2026-11-01T11:00:00.000Z', 'Neuer');
    expect(mergeImport([older], [newer]).items).toEqual([newer]);
    expect(mergeImport([newer], [older]).items).toEqual([newer]);
  });
});
