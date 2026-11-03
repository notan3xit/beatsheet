import * as A from '@automerge/automerge/slim';
import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb';
import { DEFAULT_TEMPO, type Pattern, type Song } from '../domain/types';
import type { NotebookStore } from '../state/notebookStore';
import { songFromV1Patterns } from './fileFormat';
import { applySong, createSongDoc, songOf, type SongDocument } from './songDoc';

/** Ein Datensatz pro Song: das gespeicherte Automerge-Dokument (design.md D8). */
interface DocumentRecord {
  id: string;
  bytes: Uint8Array;
}

interface DrumstuffDB extends DBSchema {
  documents: { key: string; value: DocumentRecord };
}

export interface Changes {
  put: Song[];
  remove: string[];
}

export interface Repository {
  loadAll(): Promise<Song[]>;
  /** Schreibt alle Änderungen in einer Transaktion. */
  write(changes: Changes): Promise<void>;
  close(): void;
}

const DB_VERSION = 3;

type UpgradeTx = IDBPTransaction<DrumstuffDB, 'documents'[], 'versionchange'>;

const recordOf = (song: Song): DocumentRecord => ({ id: song.id, bytes: A.save(createSongDoc(song)) });

/**
 * Version 1 (add-pattern-editor): Store "patterns", ein Datensatz pro Pattern.
 * Version 2: Store "songs", ein Song als JSON pro Datensatz.
 * Version 3: Store "documents"; vorhandene Daten wandern genau einmal hinein.
 */
async function upgradeLegacy(db: IDBPDatabase<DrumstuffDB>, tx: UpgradeTx, oldVersion: number) {
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
export async function openRepository(name = 'drumstuff'): Promise<Repository> {
  const db: IDBPDatabase<DrumstuffDB> = await openDB<DrumstuffDB>(name, DB_VERSION, {
    async upgrade(database, oldVersion, _newVersion, tx) {
      database.createObjectStore('documents', { keyPath: 'id' });
      if (oldVersion === 1 || oldVersion === 2) await upgradeLegacy(database, tx, oldVersion);
    },
  });
  const docs = new Map<string, SongDocument>();
  return {
    async loadAll() {
      const records = await db.getAll('documents');
      return records.map(({ id, bytes }) => {
        const doc = A.load<{ v: number }>(bytes);
        docs.set(id, doc);
        return songOf(doc);
      });
    },
    async write({ put, remove }) {
      const records = put.map((song) => {
        const current = docs.get(song.id);
        const doc = current ? applySong(current, song) : createSongDoc(song);
        docs.set(song.id, doc);
        return { id: song.id, bytes: A.save(doc) };
      });
      for (const id of remove) docs.delete(id);
      const tx = db.transaction('documents', 'readwrite');
      await Promise.all([...records.map((r) => tx.store.put(r)), ...remove.map((id) => tx.store.delete(id)), tx.done]);
    },
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
      writing = writing.then(() => repo.write(changes));
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
