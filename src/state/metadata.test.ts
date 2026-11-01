import { describe, expect, it } from 'vitest';
import { toggleHit } from '../domain/sequencer';
import { insertBarAfter, appendSegment } from '../domain/structure';
import { emptyBeats, patternOf } from '../test/patterns';
import { songWith } from '../test/songs';
import { createNotebookStore } from './notebookStore';

const NOW = '2026-11-01T12:00:00.000Z';
const deps = { now: () => new Date(NOW), newId: () => crypto.randomUUID() };

describe('Spec library-persistence › Änderungsmetadaten', () => {
  it('Revision nach Änderung', () => {
    const pattern = { ...patternOf(emptyBeats(4)), revision: 3, updatedAt: '2026-01-01T00:00:00.000Z' };
    const song = { ...songWith({ patterns: [pattern] }), revision: 5 };
    const store = createNotebookStore([song], deps);
    store.openSong(song.id);
    store.update(pattern.id, (p) => toggleHit(p, 0, 'snare', 0));
    const changedSong = store.getState().songs[0]!;
    const changed = changedSong.patterns[0]!;
    expect(changed.revision).toBe(4);
    expect(changed.updatedAt).toBe(NOW);
    expect(changed.createdAt).toBe(pattern.createdAt);
    expect(changedSong.revision).toBe(6);
    expect(changedSong.updatedAt).toBe(NOW);
  });

  it('Revision nach Strukturänderung', () => {
    const base = appendSegment(songWith({}), { name: 'Verse', bars: 2 });
    const song = { ...base, revision: 7 };
    const store = createNotebookStore([song], deps);
    store.openSong(song.id);
    store.updateSong((s) => insertBarAfter(s, s.segments[0]!.blocks[0]!.bars[0]!.id));
    expect(store.getState().songs[0]!.revision).toBe(8);
  });

  it('Neuer Song startet mit Revision 1 und Zeitstempeln', () => {
    const song = createNotebookStore([], deps).createSong('A');
    expect(song).toMatchObject({ revision: 1, createdAt: NOW, updatedAt: NOW });
  });

  it('Import übernimmt Metadaten unverändert', () => {
    const store = createNotebookStore();
    const incoming = { ...songWith({ title: 'X' }), revision: 9 };
    store.importSongs([incoming]);
    expect(store.getState().songs[0]).toEqual(incoming);
  });
});
