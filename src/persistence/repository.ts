import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb';
import type { Pattern, Song } from '../domain/types';
import type { NotebookStore } from '../state/notebookStore';
import { songFromV1Patterns } from './fileFormat';

interface DrumstuffDB extends DBSchema {
  songs: { key: string; value: Song };
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

const DB_VERSION = 2;

/**
 * Version 1 (add-pattern-editor): Store "patterns", ein Datensatz pro Pattern.
 * Version 2: Store "songs"; vorhandene Patterns wandern genau einmal in den Song „Importierte Patterns“.
 */
async function upgradeFromV1(db: IDBPDatabase<DrumstuffDB>, tx: IDBPTransaction<DrumstuffDB, 'songs'[], 'versionchange'>) {
  const legacyDb = db as unknown as IDBPDatabase;
  const legacyTx = tx as unknown as IDBPTransaction<unknown, ['patterns'], 'versionchange'>;
  const patterns = (await legacyTx.objectStore('patterns').getAll()) as Omit<Pattern, 'color'>[];
  if (patterns.length > 0) await tx.objectStore('songs').put(songFromV1Patterns(patterns));
  legacyDb.deleteObjectStore('patterns');
}

export async function openRepository(name = 'drumstuff'): Promise<Repository> {
  const db: IDBPDatabase<DrumstuffDB> = await openDB<DrumstuffDB>(name, DB_VERSION, {
    async upgrade(database, oldVersion, _newVersion, tx) {
      database.createObjectStore('songs', { keyPath: 'id' });
      if (oldVersion === 1) await upgradeFromV1(database, tx);
    },
  });
  return {
    loadAll: () => db.getAll('songs'),
    async write({ put, remove }) {
      const tx = db.transaction('songs', 'readwrite');
      await Promise.all([...put.map((s) => tx.store.put(s)), ...remove.map((id) => tx.store.delete(id)), tx.done]);
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
