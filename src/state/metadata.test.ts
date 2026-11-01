import { describe, expect, it } from 'vitest';
import { toggleHit } from '../domain/sequencer';
import { emptyBeats, patternOf } from '../test/patterns';
import { createLibraryStore } from './libraryStore';

describe('Spec library-persistence › Änderungsmetadaten', () => {
  it('Revision nach Änderung', () => {
    const pattern = { ...patternOf(emptyBeats(4)), revision: 3, updatedAt: '2026-01-01T00:00:00.000Z' };
    const store = createLibraryStore([pattern], {
      now: () => new Date('2026-11-01T12:00:00.000Z'),
      newId: () => crypto.randomUUID(),
    });
    store.update(pattern.id, (p) => toggleHit(p, 0, 'snare', 0));
    const changed = store.getState().patterns[0]!;
    expect(changed.revision).toBe(4);
    expect(changed.updatedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(changed.createdAt).toBe(pattern.createdAt);
  });

  it('Neues Pattern startet mit Revision 1 und Zeitstempeln', () => {
    const store = createLibraryStore();
    const p = store.createPattern('groove');
    expect(p.revision).toBe(1);
    expect(p.createdAt).toBe(p.updatedAt);
  });

  it('Import übernimmt Metadaten unverändert', () => {
    const store = createLibraryStore();
    const incoming = { ...patternOf(emptyBeats(4)), revision: 9 };
    store.importPatterns([incoming]);
    expect(store.getState().patterns[0]).toEqual(incoming);
  });
});
