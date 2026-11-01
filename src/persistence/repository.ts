import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Pattern } from '../domain/types';
import type { LibraryStore } from '../state/libraryStore';

interface DrumstuffDB extends DBSchema {
  patterns: { key: string; value: Pattern };
}

export interface Changes {
  put: Pattern[];
  remove: string[];
}

export interface Repository {
  loadAll(): Promise<Pattern[]>;
  /** Schreibt alle Änderungen in einer Transaktion. */
  write(changes: Changes): Promise<void>;
  close(): void;
}

export async function openRepository(name = 'drumstuff'): Promise<Repository> {
  const db: IDBPDatabase<DrumstuffDB> = await openDB<DrumstuffDB>(name, 1, {
    upgrade(database) {
      database.createObjectStore('patterns', { keyPath: 'id' });
    },
  });
  return {
    loadAll: () => db.getAll('patterns'),
    async write({ put, remove }) {
      const tx = db.transaction('patterns', 'readwrite');
      await Promise.all([...put.map((p) => tx.store.put(p)), ...remove.map((id) => tx.store.delete(id)), tx.done]);
    },
    close: () => db.close(),
  };
}

export interface Connection {
  /** Schreibt ausstehende Änderungen sofort. */
  flush(): Promise<void>;
  disconnect(): void;
}

/** Speichert jede Änderung im Store entprellt im Repository (design.md D7). */
export function connectStore(store: LibraryStore, repo: Repository, { debounceMs = 300 } = {}): Connection {
  let saved = new Map(store.getState().patterns.map((p) => [p.id, p]));
  const pending = new Map<string, Pattern | null>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let writing = Promise.resolve();

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    if (pending.size > 0) {
      const changes: Changes = { put: [], remove: [] };
      for (const [id, pattern] of pending) {
        if (pattern) changes.put.push(pattern);
        else changes.remove.push(id);
      }
      pending.clear();
      writing = writing.then(() => repo.write(changes));
    }
    return writing;
  };

  const unsubscribe = store.subscribe(() => {
    const current = new Map(store.getState().patterns.map((p) => [p.id, p]));
    for (const [id, pattern] of current) if (saved.get(id) !== pattern) pending.set(id, pattern);
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
