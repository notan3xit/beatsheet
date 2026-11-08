import type { AccountApi } from './api';

/** Anmeldestatus, den Menü, Karten und Sync teilen. */
export interface AccountSession {
  api: AccountApi;
  getEmail(): string | null;
  subscribe(listener: () => void): () => void;
  /** Fragt den Server. Antwortet er nicht mit einer Sitzung, bleibt der Status, weil das auch ein Netzwerkfehler sein kann. */
  refresh(): Promise<void>;
  setEmail(email: string | null): void;
}

const STORAGE_KEY = 'beatsheet.account';

export interface AccountSessionOptions {
  /** Merkt die Adresse über einen Neustart hinweg, damit auch Offline-Änderungen einen Autor tragen (song-history, design.md D2). */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

export function createAccountSession(api: AccountApi, { storage }: AccountSessionOptions = {}): AccountSession {
  let email: string | null = read(storage);
  const listeners = new Set<() => void>();

  const setEmail = (next: string | null) => {
    if (next === email) return;
    email = next;
    write(storage, next);
    listeners.forEach((listener) => listener());
  };

  return {
    api,
    getEmail: () => email,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async refresh() {
      const current = await api.session();
      if (current) setEmail(current);
    },
    setEmail,
  };
}

function read(storage: AccountSessionOptions['storage']): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function write(storage: AccountSessionOptions['storage'], email: string | null) {
  try {
    if (email) storage?.setItem(STORAGE_KEY, email);
    else storage?.removeItem(STORAGE_KEY);
  } catch {
    // Ohne Speicher gilt die Adresse nur bis zum Neustart
  }
}
