import { openDB } from 'idb';
import { describe, expect, it, vi } from 'vitest';
import { toggleHit } from '../domain/sequencer';
import { appendSegment } from '../domain/structure';
import { createNotebookStore } from '../state/notebookStore';
import { emptyBeats, patternOf } from '../test/patterns';
import { songWith } from '../test/songs';
import { connectStore, openRepository, requestPersistentStorage } from './repository';

const uniqueDb = () => `drumstuff-test-${crypto.randomUUID()}`;

/** Legt eine Datenbank im Format der Vorversion (v1, Store "patterns") an. */
async function createV1Database(name: string, patterns: ReturnType<typeof patternOf>[]) {
  const db = await openDB(name, 1, {
    upgrade(database) {
      database.createObjectStore('patterns', { keyPath: 'id' });
    },
  });
  for (const { color: _color, ...pattern } of patterns) await db.put('patterns', pattern);
  db.close();
}

describe('Spec library-persistence › Automatisches lokales Speichern', () => {
  it('Erster Start', async () => {
    const repo = await openRepository(uniqueDb());
    expect(await repo.loadAll()).toEqual([]);
  });

  it('Neuladen nach Änderung', async () => {
    const dbName = uniqueDb();
    const repo = await openRepository(dbName);
    const store = createNotebookStore(await repo.loadAll());
    const connection = connectStore(store, repo);
    const song = store.createSong('Hysteria');
    store.openSong(song.id);
    const pattern = store.createPattern('groove');
    store.update(pattern.id, (p) => toggleHit(p, 0, 'kick', 0));
    await connection.flush();
    repo.close();

    const reopened = await openRepository(dbName);
    const [loaded] = await reopened.loadAll();
    expect(loaded!.patterns[0]!.beats[0]!.hits.kick).toEqual([0]);
  });

  it('Neuladen nach Strukturänderung', async () => {
    const dbName = uniqueDb();
    const repo = await openRepository(dbName);
    const store = createNotebookStore();
    const connection = connectStore(store, repo);
    store.openSong(store.createSong('Hysteria').id);
    store.updateSong((song) => appendSegment(song, { name: 'Intro', bars: 4 }));
    await connection.flush();
    repo.close();

    const [loaded] = await (await openRepository(dbName)).loadAll();
    expect(loaded!.segments.map((s) => [s.name, s.blocks[0]!.bars.length])).toEqual([['Intro', 4]]);
  });

  it('Speichert ohne eigene Speicheraktion (entprellt)', async () => {
    const repo = await openRepository(uniqueDb());
    // Nur die Entprellung fälschen; fake-indexeddb braucht seine eigenen Timer
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const store = createNotebookStore();
      const write = vi.spyOn(repo, 'write');
      connectStore(store, repo, { debounceMs: 300 });
      store.createSong('A');
      expect(write).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(300);
      expect(write).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('Löschen wird gespeichert', async () => {
    const repo = await openRepository(uniqueDb());
    const store = createNotebookStore();
    const connection = connectStore(store, repo);
    const a = store.createSong('A');
    store.createSong('B');
    await connection.flush();
    store.deleteSong(a.id);
    await connection.flush();
    expect((await repo.loadAll()).map((s) => s.title)).toEqual(['B']);
  });

  it('Flush beim Verlassen der Seite', async () => {
    const repo = await openRepository(uniqueDb());
    const store = createNotebookStore();
    connectStore(store, repo, { debounceMs: 60_000 });
    store.createSong('A');
    window.dispatchEvent(new Event('pagehide'));
    await vi.waitFor(async () => expect(await repo.loadAll()).toHaveLength(1));
  });

  it('Importierte Songs werden in einer Transaktion gespeichert', async () => {
    const repo = await openRepository(uniqueDb());
    const store = createNotebookStore();
    const connection = connectStore(store, repo);
    const write = vi.spyOn(repo, 'write');
    store.importSongs([songWith({ title: 'A', groove: true }), songWith({ title: 'B' })]);
    await connection.flush();
    expect(write).toHaveBeenCalledTimes(1);
    expect(await repo.loadAll()).toHaveLength(2);
  });
});

describe('Spec library-persistence › Übernahme lokaler Daten aus der Vorversion', () => {
  it('Vorhandene Patterns', async () => {
    const dbName = uniqueDb();
    const patterns = [patternOf(emptyBeats(4)), patternOf([{ hits: { snare: [1] } }], 'fill')];
    await createV1Database(dbName, patterns);
    const songs = await (await openRepository(dbName)).loadAll();
    expect(songs).toHaveLength(1);
    expect(songs[0]!.title).toBe('Importierte Patterns');
    expect(songs[0]!.segments).toEqual([]);
    // IndexedDB liefert nach Schlüssel (zufällige UUID) sortiert; die Reihenfolge ist nicht Teil der Spec
    const byId = (list: { id: string; beats: unknown }[]) => [...list].sort((a, b) => a.id.localeCompare(b.id)).map((p) => [p.id, p.beats]);
    expect(byId(songs[0]!.patterns)).toEqual(byId(patterns));
    expect(new Set(songs[0]!.patterns.map((p) => p.color)).size).toBe(2);
  });

  it('Keine alten Daten', async () => {
    const dbName = uniqueDb();
    await createV1Database(dbName, []);
    expect(await (await openRepository(dbName)).loadAll()).toEqual([]);
  });

  it('Zweiter Start', async () => {
    const dbName = uniqueDb();
    await createV1Database(dbName, [patternOf(emptyBeats(4))]);
    (await openRepository(dbName)).close();
    const songs = await (await openRepository(dbName)).loadAll();
    expect(songs.filter((s) => s.title === 'Importierte Patterns')).toHaveLength(1);
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

describe('Spec library-persistence › Lokal gespeicherte Songs ohne Tempo', () => {
  it('Start nach dem Update', async () => {
    const dbName = uniqueDb();
    (await openRepository(dbName)).close();
    const { tempo: _tempo, ...legacy } = { ...songWith({ title: 'Alt' }), revision: 6 };
    const raw = await openDB(dbName, 2);
    await raw.put('songs', legacy);
    raw.close();

    const [loaded] = await (await openRepository(dbName)).loadAll();
    expect(loaded).toEqual({ ...legacy, tempo: 120, revision: 6 });
  });
});
