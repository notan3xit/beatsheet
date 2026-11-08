import * as A from '@automerge/automerge/slim';
import { openDB } from 'idb';
import { describe, expect, it, vi } from 'vitest';
import { cycleArticulation, toggleHit } from '../domain/sequencer';
import { appendSegment } from '../domain/structure';
import type { Workbook } from '../domain/types';
import { createNotebookStore } from '../state/notebookStore';
import { emptyBeats, patternOf } from '../test/patterns';
import { createV2Database } from '../test/legacyDb';
import { songWith } from '../test/songs';
import { connectStore, openRepository, requestPersistentStorage } from './repository';
import { applySong, createSongDoc, songOf } from './songDoc';

const uniqueDb = () => `beatsheet-test-${crypto.randomUUID()}`;

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
    const { tempo: _tempo, ...legacy } = { ...songWith({ title: 'Alt' }), revision: 6 };
    await createV2Database(dbName, [legacy]);

    const [loaded] = await (await openRepository(dbName)).loadAll();
    expect(loaded).toEqual({ ...legacy, tempo: 120, revision: 6 });
  });
});

describe('Spec library-persistence › Übernahme lokal gespeicherter Songs in das Dokumentformat', () => {
  /** Zwei Songs der Vorversion: einer mit Revision 6, Flam, Tempo 96 und Struktur, einer ohne Tempo. */
  function legacySongs() {
    const groove = toggleHit(patternOf(emptyBeats(4)), 0, 'snare', 1);
    const withFlam = cycleArticulation(groove, 0, 'snare', 1);
    const song = { ...songWith({ title: 'Mit Flam', bars: 2, patterns: [withFlam], tempo: 96 }), revision: 6 };
    const { tempo: _tempo, ...withoutTempo } = songWith({ title: 'Ohne Tempo' });
    return { song, withoutTempo, expected: [song, { ...withoutTempo, tempo: 120 }] };
  }
  const byId = <T extends { id: string }>(list: T[]) => [...list].sort((a, b) => a.id.localeCompare(b.id));

  it('Vorhandene Songs', async () => {
    const dbName = uniqueDb();
    const { song, withoutTempo, expected } = legacySongs();
    await createV2Database(dbName, [song, withoutTempo]);
    const loaded = await (await openRepository(dbName)).loadAll();
    expect(byId(loaded)).toEqual(byId(expected));
    expect(loaded.find((s) => s.id === song.id)!.patterns[0]!.beats[0]!.articulations).toEqual({ snare: { 1: 'flam' } });
  });

  it('Zweiter Start', async () => {
    const dbName = uniqueDb();
    const { song, withoutTempo, expected } = legacySongs();
    await createV2Database(dbName, [song, withoutTempo]);
    (await openRepository(dbName)).close();
    const loaded = await (await openRepository(dbName)).loadAll();
    expect(byId(loaded)).toEqual(byId(expected));
  });

  it('Änderung nach der Übernahme', async () => {
    const dbName = uniqueDb();
    const { song } = legacySongs();
    await createV2Database(dbName, [song]);
    const repo = await openRepository(dbName);
    const store = createNotebookStore(await repo.loadAll());
    const connection = connectStore(store, repo);
    store.openSong(song.id);
    store.update(song.patterns[0]!.id, (p) => toggleHit(p, 1, 'kick', 0));
    await connection.flush();
    repo.close();

    const [loaded] = await (await openRepository(dbName)).loadAll();
    expect(loaded!.patterns[0]!.beats[1]!.hits.kick).toEqual([0]);
    expect(loaded!.revision).toBe(7);
  });

  it('Patterns aus der Version vor den Songs', async () => {
    const dbName = uniqueDb();
    await createV1Database(dbName, [patternOf(emptyBeats(4)), patternOf(emptyBeats(1), 'fill')]);
    const [loaded] = await (await openRepository(dbName)).loadAll();
    expect(loaded!.title).toBe('Importierte Patterns');
    expect(loaded!.patterns).toHaveLength(2);
  });

  it('danach sind die alten Stores verschwunden', async () => {
    const dbName = uniqueDb();
    await createV2Database(dbName, [legacySongs().song]);
    (await openRepository(dbName)).close();
    const raw = await openDB(dbName);
    expect([...raw.objectStoreNames]).toEqual(['documents', 'workbooks']);
    expect(raw.version).toBe(4);
    raw.close();
  });
});

describe('Spec workbook-sync › Client-Speicher', () => {
  const band: Workbook = { id: 'wb', title: 'Band', owner: 'ich@example.com', members: ['ich@example.com'] };

  async function storedSong(title: string) {
    const name = uniqueDb();
    const repo = await openRepository(name);
    const song = songWith({ title });
    await repo.write({ put: [song], remove: [] });
    return { name, repo, song };
  }

  it('Version 4 übernimmt Daten aus Version 3 unverändert, alle Songs sind lokal', async () => {
    const name = uniqueDb();
    const song = songWith({ title: 'Alt' });
    const old = await openDB(name, 3, {
      upgrade(database) {
        database.createObjectStore('documents', { keyPath: 'id' });
      },
    });
    await old.put('documents', { id: song.id, bytes: A.save(createSongDoc(song)) });
    old.close();

    const repo = await openRepository(name);
    expect((await repo.loadAll()).map((s) => s.title)).toEqual(['Alt']);
    expect(await repo.loadSyncState()).toEqual({ placement: {}, workbooks: [] });
    expect(repo.outgoing(song.id)).toBeNull();
  });

  it('Zugehörigkeit, Server-Stand und Workbook-Liste überstehen Neuladen', async () => {
    const { name, repo, song } = await storedSong('Intro');
    const heads = A.getHeads(A.load(repo.documentBytes(song.id)));
    repo.place(song.id, band.id, heads);
    await repo.saveWorkbooks([band]);
    await repo.settled();
    repo.close();

    const reopened = await openRepository(name);
    await reopened.loadAll();
    expect(await reopened.loadSyncState()).toEqual({ placement: { [song.id]: band.id }, workbooks: [band] });
    expect(reopened.outgoing(song.id)?.base).toEqual(heads);
  });

  it('Ein späteres Schreiben behält Zugehörigkeit und Server-Stand', async () => {
    const { name, repo, song } = await storedSong('Intro');
    const heads = A.getHeads(A.load(repo.documentBytes(song.id)));
    repo.place(song.id, band.id, heads);
    await repo.write({ put: [{ ...song, title: 'Neu', revision: 2 }], remove: [] });
    await repo.settled();
    repo.close();

    const reopened = await openRepository(name);
    await reopened.loadAll();
    expect((await reopened.loadSyncState()).placement).toEqual({ [song.id]: band.id });
  });

  it('outgoing liefert nur die Änderungen seit dem Server-Stand', async () => {
    const { repo, song } = await storedSong('Intro');
    const heads = A.getHeads(A.load(repo.documentBytes(song.id)));
    repo.place(song.id, band.id, heads);
    expect(repo.outgoing(song.id)!.changes).toHaveLength(0);
    expect(repo.hasUnsent()).toBe(false);
    await repo.write({ put: [{ ...song, title: 'Neu', revision: 2 }], remove: [] });
    expect(repo.outgoing(song.id)!.changes.length).toBeGreaterThan(0);
    expect(repo.hasUnsent()).toBe(true);
  });

  it('forgetWorkbookSongs entfernt Workbook-Songs und Liste, lokale Songs bleiben', async () => {
    const { name, repo, song } = await storedSong('Intro');
    const local = songWith({ title: 'Skizze' });
    await repo.write({ put: [local], remove: [] });
    repo.place(song.id, band.id, A.getHeads(A.load(repo.documentBytes(song.id))));
    await repo.saveWorkbooks([band]);
    expect(await repo.forgetWorkbookSongs()).toEqual([song.id]);
    repo.close();

    const reopened = await openRepository(name);
    expect((await reopened.loadAll()).map((s) => s.title)).toEqual(['Skizze']);
    expect(await reopened.loadSyncState()).toEqual({ placement: {}, workbooks: [] });
  });

  it('adopt übernimmt das Server-Dokument samt Zugehörigkeit und Server-Stand', async () => {
    const repo = await openRepository(uniqueDb());
    const server = createSongDoc(songWith({ title: 'Server' }));
    const song = repo.adopt(songOf(server).id, A.save(server), band.id);
    expect(song.title).toBe('Server');
    expect(repo.outgoing(song.id)).toEqual({ base: A.getHeads(server), changes: new Uint8Array() });
    expect((await repo.loadSyncState()).placement).toEqual({ [song.id]: band.id });
  });

  describe('receive (keine verlorenen Änderungen)', () => {
    it('Store-Änderung während der Anfrage und Server-Änderung bleiben beide erhalten, ohne weitere Dokumentänderung', async () => {
      const repo = await openRepository(uniqueDb());
      const store = createNotebookStore();
      const connection = connectStore(store, repo);
      const created = store.createSong('Intro');
      await connection.flush();
      const base = A.getHeads(A.load(repo.documentBytes(created.id)));
      repo.place(created.id, band.id, base);

      // Fremdes Gerät ändert das Tempo; der Server liefert genau das
      const foreign = applySong(A.load(repo.documentBytes(created.id)), { ...created, tempo: 90, revision: 2 });
      const foreignChanges = A.saveSince(foreign, base);
      const serverHeads = A.getHeads(foreign);

      // Während die Anfrage läuft, ändert der Nutzer den Titel; `connectStore` hat das noch nicht geschrieben
      store.renameSong(created.id, 'Eigener Titel');
      const current = store.getState().songs[0]!;
      const merged = repo.receive(created.id, current, { changes: foreignChanges, heads: serverHeads });
      store.applyRemote([merged], []);
      expect(store.getState().songs[0]).toMatchObject({ title: 'Eigener Titel', tempo: 90 });

      const before = A.getHeads(A.load(repo.documentBytes(created.id)));
      await connection.flush();
      expect(A.getHeads(A.load(repo.documentBytes(created.id)))).toEqual(before);
      expect(repo.outgoing(created.id)!.base).toEqual(serverHeads);
      // Die eigene Änderung ist noch nicht beim Server und geht beim nächsten Abgleich hinaus
      expect(repo.outgoing(created.id)!.changes.length).toBeGreaterThan(0);
    });

    it('Ein vor dem Empfang angestoßener Schreibvorgang schreibt keinen alten Stand zurück', async () => {
      const repo = await openRepository(uniqueDb());
      const store = createNotebookStore();
      const connection = connectStore(store, repo);
      const created = store.createSong('Intro');
      await connection.flush();
      const base = A.getHeads(A.load(repo.documentBytes(created.id)));
      repo.place(created.id, band.id, base);

      const foreign = applySong(A.load(repo.documentBytes(created.id)), { ...created, tempo: 90, revision: 2 });
      store.renameSong(created.id, 'Eigener Titel');
      // Schreibvorgang läuft, seine Speicherung ist noch nicht abgeschlossen
      const writing = connection.flush();
      const merged = repo.receive(created.id, store.getState().songs[0]!, { changes: A.saveSince(foreign, base), heads: A.getHeads(foreign) });
      store.applyRemote([merged], []);
      const heads = A.getHeads(A.load(repo.documentBytes(created.id)));
      await writing;
      await connection.flush();

      expect(A.getHeads(A.load(repo.documentBytes(created.id)))).toEqual(heads);
      expect(songOf(A.load(repo.documentBytes(created.id)))).toMatchObject({ title: 'Eigener Titel', tempo: 90 });
    });
  });
});

describe('Spec account-songs › Vorgemerktes Löschen', () => {
  const PERSONAL = 'persoenlich';

  async function placedSong(title = 'Skizze') {
    const name = uniqueDb();
    const repo = await openRepository(name);
    const song = songWith({ title });
    await repo.write({ put: [song], remove: [] });
    repo.place(song.id, PERSONAL, A.getHeads(A.load(repo.documentBytes(song.id))));
    return { name, repo, song };
  }

  it('übersteht Neuladen, und loadAll überspringt den Datensatz', async () => {
    const { name, repo, song } = await placedSong();
    repo.markDeleted(song.id);
    await repo.settled();
    repo.close();

    const reopened = await openRepository(name);
    expect(await reopened.loadAll()).toEqual([]);
    expect(reopened.pendingDeletes()).toEqual([{ id: song.id, workbookId: PERSONAL }]);
    expect((await reopened.loadSyncState()).placement).toEqual({});
  });

  it('ein späteres write mit remove lässt den Datensatz stehen', async () => {
    const { name, repo, song } = await placedSong();
    repo.markDeleted(song.id);
    await repo.write({ put: [], remove: [song.id] });
    await repo.settled();
    repo.close();

    const reopened = await openRepository(name);
    await reopened.loadAll();
    expect(reopened.pendingDeletes().map((d) => d.id)).toEqual([song.id]);
  });

  it('clearDeleted entfernt den Datensatz', async () => {
    const { name, repo, song } = await placedSong();
    repo.markDeleted(song.id);
    repo.clearDeleted(song.id);
    expect(repo.pendingDeletes()).toEqual([]);
    await repo.settled();
    repo.close();

    const reopened = await openRepository(name);
    await reopened.loadAll();
    expect(reopened.pendingDeletes()).toEqual([]);
  });

  it('hasUnsent zählt vorgemerktes Löschen', async () => {
    const { repo, song } = await placedSong();
    expect(repo.hasUnsent()).toBe(false);
    repo.markDeleted(song.id);
    expect(repo.hasUnsent()).toBe(true);
    repo.clearDeleted(song.id);
    expect(repo.hasUnsent()).toBe(false);
  });

  it('forgetWorkbookSongs entfernt vorgemerktes Löschen, lokale Songs ohne Zugehörigkeit bleiben', async () => {
    const { name, repo, song } = await placedSong();
    const local = songWith({ title: 'Lokal' });
    await repo.write({ put: [local], remove: [] });
    repo.markDeleted(song.id);
    await repo.settled();
    await repo.forgetWorkbookSongs();
    repo.close();

    const reopened = await openRepository(name);
    expect((await reopened.loadAll()).map((s) => s.title)).toEqual(['Lokal']);
    expect(reopened.pendingDeletes()).toEqual([]);
  });

  it('Lokale Songs ohne Zugehörigkeit zählen nicht als nicht übertragen', async () => {
    const repo = await openRepository(uniqueDb());
    await repo.write({ put: [songWith({ title: 'Lokal' })], remove: [] });
    expect(repo.hasUnsent()).toBe(false);
  });
});

describe('Spec song-history › Autor einer Änderung', () => {
  const messages = (bytes: Uint8Array) => A.getAllChanges(A.load(bytes)).map((c) => A.decodeChange(c).message);

  it('Änderung im Workbook: Der Autor steht in jeder geschriebenen Änderung', async () => {
    const repo = await openRepository(uniqueDb(), { author: () => 'max@example.org' });
    const store = createNotebookStore();
    const connection = connectStore(store, repo);
    const song = store.createSong('Hysteria');
    await connection.flush();
    store.openSong(song.id);
    store.updateSong((s) => ({ ...s, tempo: 90 }));
    await connection.flush();
    expect(messages(repo.documentBytes(song.id)).slice(1)).toEqual([JSON.stringify({ by: 'max@example.org' })]);
  });

  it('Auch das Anlegen eines Songs trägt den Autor', async () => {
    const repo = await openRepository(uniqueDb(), { author: () => 'max@example.org' });
    const store = createNotebookStore();
    const connection = connectStore(store, repo);
    const song = store.createSong('Hysteria');
    await connection.flush();
    expect(messages(repo.documentBytes(song.id))).toEqual([JSON.stringify({ by: 'max@example.org' })]);
    expect(songOf(A.load(repo.documentBytes(song.id)))).toEqual(store.getState().songs[0]);
  });

  it('Ohne Anmeldung', async () => {
    const repo = await openRepository(uniqueDb(), { author: () => null });
    const store = createNotebookStore();
    const connection = connectStore(store, repo);
    const song = store.createSong('Hysteria');
    store.openSong(song.id);
    store.updateSong((s) => ({ ...s, tempo: 90 }));
    await connection.flush();
    expect(messages(repo.documentBytes(song.id)).every((m) => m === null)).toBe(true);
  });

  it('receive schreibt eigene, noch nicht gespeicherte Änderungen mit Autor', async () => {
    const repo = await openRepository(uniqueDb(), { author: () => 'ich@example.com' });
    const store = createNotebookStore();
    const connection = connectStore(store, repo);
    const created = store.createSong('Intro');
    await connection.flush();
    const base = A.getHeads(A.load(repo.documentBytes(created.id)));
    repo.place(created.id, 'band', base);
    const foreign = applySong(A.load(repo.documentBytes(created.id)), { ...created, tempo: 90, revision: 2 }, JSON.stringify({ by: 'anna@example.com' }));
    store.renameSong(created.id, 'Eigener Titel');
    repo.receive(created.id, store.getState().songs[0]!, { changes: A.saveSince(foreign, base), heads: A.getHeads(foreign) });
    const all = messages(repo.documentBytes(created.id));
    expect(all).toContain(JSON.stringify({ by: 'anna@example.com' }));
    expect(all).toContain(JSON.stringify({ by: 'ich@example.com' }));
  });
});

describe('Spec song-history › Wiederherstellung als neue Änderung', () => {
  async function setup() {
    const repo = await openRepository(uniqueDb(), { author: () => 'max@example.org' });
    const store = createNotebookStore();
    const connection = connectStore(store, repo, { debounceMs: 10_000 });
    const song = store.createSong('Hysteria');
    await connection.flush();
    store.openSong(song.id);
    return { repo, store, connection, song };
  }

  it('Eigener Change mit Zielzeit, auch direkt nach einer Bearbeitung im selben Entprell-Fenster', async () => {
    const { repo, store, connection, song } = await setup();
    store.updateSong((s) => ({ ...s, title: 'Hysteria (live)' }));
    store.restoreSong({ ...store.getState().songs[0]!, tempo: 90 }, 1762559580);
    await connection.flush();

    const steps = repo.history(song.id)!.steps;
    expect(steps.slice(1).map(({ author, restore }) => ({ author, restore }))).toEqual([
      { author: 'max@example.org', restore: undefined },
      { author: 'max@example.org', restore: 1762559580 },
    ]);
    expect(repo.history(song.id)!.songAt(1)).toMatchObject({ title: 'Hysteria (live)', tempo: 120 });
  });

  it('Eintrag im Verlauf und Wiederherstellung zurücknehmen', async () => {
    const { repo, store, connection, song } = await setup();
    store.updateSong((s) => ({ ...s, tempo: 90 }));
    await connection.flush();
    const before = repo.history(song.id)!.songAt(0)!;
    store.restoreSong({ ...store.getState().songs[0]!, tempo: before.tempo }, 1);
    await connection.flush();
    expect(store.getState().songs[0]!.tempo).toBe(120);

    // Den Stand vor der Wiederherstellung zurückholen
    const history = repo.history(song.id)!;
    const beforeRestore = history.songAt(history.steps.length - 2)!;
    store.restoreSong({ ...store.getState().songs[0]!, tempo: beforeRestore.tempo }, 2);
    await connection.flush();
    expect(songOf(A.load(repo.documentBytes(song.id))).tempo).toBe(90);
    expect(repo.history(song.id)!.steps.map((s) => s.restore).filter(Boolean)).toEqual([1, 2]);
  });
});

describe('Spec song-history › Verlauf öffnen', () => {
  it('Beim Öffnen des Verlaufs werden ausstehende Änderungen sofort geschrieben', async () => {
    const repo = await openRepository(uniqueDb());
    const store = createNotebookStore();
    connectStore(store, repo, { debounceMs: 10_000 });
    const song = store.createSong('Hysteria');
    store.openSong(song.id);
    store.updateSong((s) => ({ ...s, tempo: 90 }));
    expect(repo.history(song.id)).toBeNull();
    store.openHistory();
    expect(repo.history(song.id)!.songAt(repo.history(song.id)!.steps.length - 1)!.tempo).toBe(90);
  });
});
