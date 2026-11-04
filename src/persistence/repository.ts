import * as A from '@automerge/automerge/slim';
import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb';
import { DEFAULT_TEMPO, type Pattern, type Song, type Workbook } from '../domain/types';
import type { NotebookStore } from '../state/notebookStore';
import { songFromV1Patterns } from './fileFormat';
import { applySong, createSongDoc, songOf, type SongDocument } from './songDoc';

/** Ein Datensatz pro Song: das gespeicherte Automerge-Dokument (design.md D8). */
interface DocumentRecord {
  id: string;
  bytes: Uint8Array;
  /** Nur bei Workbook-Songs: die Zugehörigkeit und der letzte mit dem Server geteilte Stand. */
  workbookId?: string;
  serverHeads?: A.Heads;
  /** Gelöscht, dem Server aber noch nicht gemeldet; ohne Inhalt (account-songs, design.md D6). */
  pendingDelete?: boolean;
}

interface BeatsheetDB extends DBSchema {
  documents: { key: string; value: DocumentRecord };
  workbooks: { key: string; value: Workbook };
}

export interface Changes {
  put: Song[];
  remove: string[];
}

export interface SyncState {
  /** Song-ID → Workbook-ID. */
  placement: Record<string, string>;
  workbooks: Workbook[];
}

export interface ServerResponse {
  changes?: Uint8Array;
  heads: A.Heads;
}

export interface Repository {
  loadAll(): Promise<Song[]>;
  /** Zugehörigkeit und Workbooks; nach `loadAll` aufrufen. */
  loadSyncState(): Promise<SyncState>;
  /** Überträgt die Songs sofort in ihre Dokumente; die Speicherung folgt in einer Transaktion. */
  write(changes: Changes): Promise<void>;
  /** Vollständiges Dokument, zum Übertragen an den Server. */
  documentBytes(id: string): Uint8Array;
  /** `null`, solange der Song keinen Server-Stand hat. */
  outgoing(id: string): { base: A.Heads; changes: Uint8Array } | null;
  /** Noch nicht übertragene Änderungen und vorgemerktes Löschen; Songs ohne Server-Stand zählen nicht. Vorher `flush`. */
  hasUnsent(): boolean;
  /** Wendet eine Server-Antwort im selben Schritt an; liefert den Song für den Store (design.md D8). */
  receive(id: string, current: Song, response: ServerResponse): Song;
  /** Ersetzt das Dokument durch das des Servers; liefert den Song für den Store. */
  adopt(id: string, bytes: Uint8Array, workbookId: string): Song;
  place(id: string, workbookId: string, heads: A.Heads): void;
  /** Merkt das Löschen eines Songs für den nächsten Kontakt mit dem Server vor. */
  markDeleted(id: string): void;
  pendingDeletes(): { id: string; workbookId: string }[];
  clearDeleted(id: string): void;
  saveWorkbooks(workbooks: readonly Workbook[]): Promise<void>;
  /** Entfernt Workbook-Songs und die Workbook-Liste, beim Abmelden; liefert die entfernten Song-IDs. */
  forgetWorkbookSongs(): Promise<string[]>;
  /** Abgeschlossen, sobald alle bisher angestoßenen Speicherungen durch sind. */
  settled(): Promise<void>;
  close(): void;
}

const DB_VERSION = 4;

type UpgradeTx = IDBPTransaction<BeatsheetDB, ('documents' | 'workbooks')[], 'versionchange'>;

const recordOf = (song: Song): DocumentRecord => ({ id: song.id, bytes: A.save(createSongDoc(song)) });

/**
 * Version 1 (add-pattern-editor): Store "patterns", ein Datensatz pro Pattern.
 * Version 2: Store "songs", ein Song als JSON pro Datensatz.
 * Version 3: Store "documents"; vorhandene Daten wandern genau einmal hinein.
 * Version 4: Store "workbooks"; `documents` bekommt optionale Felder, vorhandene Songs gelten als lokal.
 */
async function upgradeLegacy(db: IDBPDatabase<BeatsheetDB>, tx: UpgradeTx, oldVersion: number) {
  const legacyDb = db as unknown as IDBPDatabase;
  const legacyTx = tx as unknown as IDBPTransaction<unknown, string[], 'versionchange'>;
  const songs: Song[] = [];
  if (oldVersion === 1) {
    const patterns = (await legacyTx.objectStore('patterns').getAll()) as Omit<Pattern, 'color'>[];
    if (patterns.length > 0) songs.push(songFromV1Patterns(patterns));
    legacyDb.deleteObjectStore('patterns');
  } else {
    // Songs aus Versionen ohne Tempo bekommen die Vorgabe, ohne dass ihre Revision steigt
    for (const song of (await legacyTx.objectStore('songs').getAll()) as Song[]) {
      songs.push({ ...song, tempo: song.tempo ?? DEFAULT_TEMPO });
    }
    legacyDb.deleteObjectStore('songs');
  }
  for (const song of songs) await tx.objectStore('documents').put(recordOf(song));
}

/** Automerge muss vorher initialisiert sein (`initAutomerge`), weil das Upgrade Dokumente erzeugt. */
export async function openRepository(name = 'beatsheet'): Promise<Repository> {
  const db: IDBPDatabase<BeatsheetDB> = await openDB<BeatsheetDB>(name, DB_VERSION, {
    async upgrade(database, oldVersion, _newVersion, tx) {
      database.createObjectStore('workbooks', { keyPath: 'id' });
      if (oldVersion >= 3) return;
      database.createObjectStore('documents', { keyPath: 'id' });
      if (oldVersion === 1 || oldVersion === 2) await upgradeLegacy(database, tx, oldVersion);
    },
  });
  const docs = new Map<string, SongDocument>();
  const placements = new Map<string, { workbookId: string; serverHeads: A.Heads }>();
  const deletions = new Map<string, string>();
  let saving = Promise.resolve();

  const recordOfDoc = (id: string, doc: SongDocument): DocumentRecord => ({ id, bytes: A.save(doc), ...placements.get(id) });

  /** Speichert den Stand von jetzt; die Reihenfolge der Transaktionen entspricht der Reihenfolge der Aufrufe. */
  const track = (saved: Promise<unknown>) => {
    saving = saving.then(() => saved.then(() => undefined)).catch((error: unknown) => console.error(error));
  };
  const persist = (id: string) => track(db.put('documents', recordOfDoc(id, docs.get(id)!)));

  const docOf = (id: string) => {
    const doc = docs.get(id);
    if (!doc) throw new Error(`Dokument ${id} nicht gefunden`);
    return doc;
  };

  return {
    async loadAll() {
      const records = await db.getAll('documents');
      return records.flatMap(({ id, bytes, workbookId, serverHeads, pendingDelete }) => {
        if (pendingDelete) {
          deletions.set(id, workbookId!);
          return [];
        }
        const doc = A.load<{ v: number }>(bytes);
        docs.set(id, doc);
        if (workbookId && serverHeads) placements.set(id, { workbookId, serverHeads });
        return [songOf(doc)];
      });
    },
    async loadSyncState() {
      const placement = Object.fromEntries([...placements].map(([id, p]) => [id, p.workbookId]));
      return { placement, workbooks: await db.getAll('workbooks') };
    },
    async write({ put, remove }) {
      const records = put.map((song) => {
        const current = docs.get(song.id);
        const doc = current ? applySong(current, song) : createSongDoc(song);
        docs.set(song.id, doc);
        return recordOfDoc(song.id, doc);
      });
      for (const id of remove) {
        docs.delete(id);
        placements.delete(id);
      }
      const tx = db.transaction('documents', 'readwrite');
      await Promise.all([...records.map((r) => tx.store.put(r)), ...remove.filter((id) => !deletions.has(id)).map((id) => tx.store.delete(id)), tx.done]);
    },
    documentBytes: (id) => A.save(docOf(id)),
    outgoing(id) {
      const placed = placements.get(id);
      const doc = docs.get(id);
      return placed && doc ? { base: placed.serverHeads, changes: A.saveSince(doc, placed.serverHeads) } : null;
    },
    hasUnsent() {
      return deletions.size > 0 || [...placements].some(([id, { serverHeads }]) => A.saveSince(docOf(id), serverHeads).length > 0);
    },
    receive(id, current, { changes, heads }) {
      let doc = applySong(docOf(id), current);
      if (changes && changes.length > 0) doc = A.loadIncremental(doc, changes);
      docs.set(id, doc);
      placements.set(id, { workbookId: placements.get(id)!.workbookId, serverHeads: heads });
      persist(id);
      return songOf(doc);
    },
    adopt(id, bytes, workbookId) {
      const doc = A.load<{ v: number }>(bytes);
      docs.set(id, doc);
      placements.set(id, { workbookId, serverHeads: A.getHeads(doc) });
      persist(id);
      return songOf(doc);
    },
    place(id, workbookId, heads) {
      placements.set(id, { workbookId, serverHeads: heads });
      persist(id);
    },
    markDeleted(id) {
      const placed = placements.get(id);
      if (!placed) throw new Error(`Song ${id} liegt nicht auf dem Server`);
      docs.delete(id);
      placements.delete(id);
      deletions.set(id, placed.workbookId);
      track(db.put('documents', { id, bytes: new Uint8Array(), workbookId: placed.workbookId, pendingDelete: true }));
    },
    pendingDeletes: () => [...deletions].map(([id, workbookId]) => ({ id, workbookId })),
    clearDeleted(id) {
      deletions.delete(id);
      track(db.delete('documents', id));
    },
    async saveWorkbooks(workbooks) {
      const tx = db.transaction('workbooks', 'readwrite');
      await Promise.all([tx.store.clear(), ...workbooks.map((w) => tx.store.put(w)), tx.done]);
    },
    async forgetWorkbookSongs() {
      const ids = [...placements.keys()];
      for (const id of ids) {
        docs.delete(id);
        placements.delete(id);
      }
      const deleted = [...deletions.keys()];
      deletions.clear();
      const tx = db.transaction(['documents', 'workbooks'], 'readwrite');
      await Promise.all([...[...ids, ...deleted].map((id) => tx.objectStore('documents').delete(id)), tx.objectStore('workbooks').clear(), tx.done]);
      return ids;
    },
    settled: () => saving,
    close: () => db.close(),
  };
}

export interface Connection {
  /** Schreibt ausstehende Änderungen sofort. */
  flush(): Promise<void>;
  disconnect(): void;
}

/** Speichert jede Änderung im Store entprellt im Repository, ein Datensatz pro Song (design.md D6). */
export function connectStore(store: NotebookStore, repo: Repository, { debounceMs = 300 } = {}): Connection {
  let saved = new Map(store.getState().songs.map((s) => [s.id, s]));
  const pending = new Map<string, Song | null>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let writing = Promise.resolve();

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    if (pending.size > 0) {
      const changes: Changes = { put: [], remove: [] };
      for (const [id, song] of pending) {
        if (song) changes.put.push(song);
        else changes.remove.push(id);
      }
      pending.clear();
      // Sofort aufrufen: Das Dokument muss vor jeder Server-Antwort den Stand kennen (design.md D8)
      writing = Promise.all([writing, repo.write(changes)]).then(() => undefined);
    }
    return writing;
  };

  const unsubscribe = store.subscribe(() => {
    const current = new Map(store.getState().songs.map((s) => [s.id, s]));
    for (const [id, song] of current) if (saved.get(id) !== song) pending.set(id, song);
    for (const id of saved.keys()) if (!current.has(id)) pending.set(id, null);
    saved = current;
    if (pending.size > 0 && timer === undefined) timer = setTimeout(() => void flush(), debounceMs);
  });

  const onHide = () => void flush();
  const onVisibility = () => document.visibilityState === 'hidden' && onHide();
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', onVisibility);

  return {
    flush,
    disconnect() {
      unsubscribe();
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

/** Fordert dauerhaften Speicher an; ohne Storage-API gilt er als nicht dauerhaft. */
export async function requestPersistentStorage(storage: StorageManager | undefined = navigator.storage): Promise<boolean> {
  if (!storage?.persist) return false;
  try {
    return (await storage.persisted?.()) || (await storage.persist());
  } catch {
    return false;
  }
}
