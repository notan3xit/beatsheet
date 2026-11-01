import { describe, expect, it, vi } from 'vitest';
import { toggleHit } from '../domain/sequencer';
import { createLibraryStore } from '../state/libraryStore';
import { emptyBeats, patternOf } from '../test/patterns';
import { connectStore, openRepository, requestPersistentStorage } from './repository';

const uniqueDb = () => `drumstuff-test-${crypto.randomUUID()}`;

describe('Spec library-persistence › Automatisches lokales Speichern', () => {
  it('Erster Start', async () => {
    const repo = await openRepository(uniqueDb());
    expect(await repo.loadAll()).toEqual([]);
  });

  it('Neuladen nach Änderung', async () => {
    const dbName = uniqueDb();
    const repo = await openRepository(dbName);
    const store = createLibraryStore(await repo.loadAll());
    const connection = connectStore(store, repo);

    const pattern = store.createPattern('groove');
    store.update(pattern.id, (p) => toggleHit(p, 0, 'kick', 0));
    await connection.flush();
    repo.close();

    // "Neu laden": frische Verbindung, frischer Store
    const reopened = await openRepository(dbName);
    const loaded = await reopened.loadAll();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.beats[0]!.hits.kick).toEqual([0]);
  });

  it('Speichert ohne eigene Speicheraktion (entprellt)', async () => {
    const repo = await openRepository(uniqueDb());
    // Nur die Entprellung fälschen; fake-indexeddb braucht seine eigenen Timer
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const store = createLibraryStore();
      const put = vi.spyOn(repo, 'write');
      connectStore(store, repo, { debounceMs: 300 });
      store.createPattern('groove');
      expect(put).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(300);
      expect(put).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('Löschen wird gespeichert', async () => {
    const dbName = uniqueDb();
    const repo = await openRepository(dbName);
    const store = createLibraryStore();
    const connection = connectStore(store, repo);
    const a = store.createPattern('groove');
    store.createPattern('fill');
    await connection.flush();
    store.remove(a.id);
    await connection.flush();
    expect((await repo.loadAll()).map((p) => p.kind)).toEqual(['fill']);
  });

  it('Flush beim Verlassen der Seite', async () => {
    const dbName = uniqueDb();
    const repo = await openRepository(dbName);
    const store = createLibraryStore();
    connectStore(store, repo, { debounceMs: 60_000 });
    store.createPattern('groove');
    window.dispatchEvent(new Event('pagehide'));
    await vi.waitFor(async () => expect(await repo.loadAll()).toHaveLength(1));
  });
});

describe('Spec library-persistence › Import einer Bibliothek (Speicher)', () => {
  it('Importierte Patterns werden in einer Transaktion gespeichert', async () => {
    const dbName = uniqueDb();
    const repo = await openRepository(dbName);
    const store = createLibraryStore();
    const connection = connectStore(store, repo);
    const write = vi.spyOn(repo, 'write');
    store.importPatterns([patternOf(emptyBeats(4)), patternOf(emptyBeats(1), 'fill')]);
    await connection.flush();
    expect(write).toHaveBeenCalledTimes(1);
    expect(await repo.loadAll()).toHaveLength(2);
  });
});

describe('Spec library-persistence › Dauerhaften Speicher anfordern', () => {
  it('fragt den Browser nach dauerhaftem Speicher', async () => {
    const persist = vi.fn().mockResolvedValue(false);
    expect(await requestPersistentStorage({ persist } as unknown as StorageManager)).toBe(false);
    expect(persist).toHaveBeenCalled();
  });

  it('ohne Storage-API gilt der Speicher als nicht dauerhaft', async () => {
    expect(await requestPersistentStorage(undefined)).toBe(false);
  });
});
