import { afterEach, describe, expect, it, vi } from 'vitest';
import { appendSegment } from './structure';
import { createNotebookStore } from '../state/notebookStore';
import { applyImport } from '../persistence/merge';
import { connectStore, openRepository } from '../persistence/repository';
import { songWith } from '../test/songs';
import { newId } from './id';

/** Browser über reines HTTP: `randomUUID` gibt es nur im sicheren Kontext, `getRandomValues` immer. */
function insecureContext() {
  const { getRandomValues } = crypto;
  vi.stubGlobal('crypto', { getRandomValues: getRandomValues.bind(crypto) });
}

afterEach(() => vi.unstubAllGlobals());

describe('IDs ohne sicheren Kontext', () => {
  it('newId liefert eindeutige UUIDs der Version 4', () => {
    insecureContext();
    const ids = Array.from({ length: 100 }, newId);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(new Set(ids).size).toBe(100);
  });

  it('Songs, Patterns und Struktur lassen sich anlegen und speichern', async () => {
    const repo = await openRepository(`id-test-${newId()}`);
    insecureContext();
    const store = createNotebookStore();
    const connection = connectStore(store, repo);
    const song = store.createSong('Hysteria');
    store.openSong(song.id);
    store.createPattern('groove');
    store.updateSong((s) => appendSegment(s, { name: 'Intro', bars: 2 }));
    await connection.flush();
    expect((await repo.loadAll())[0]!.title).toBe('Hysteria');
  });

  it('Der Import legt Kopien an', () => {
    const existing = songWith({ title: 'Intro' });
    insecureContext();
    const { songs } = applyImport([{ kind: 'existing', song: existing, existing, newer: 'file', choice: 'copy' }], { now: () => new Date(), newId });
    expect(songs[0]!.id).not.toBe(existing.id);
  });
});
