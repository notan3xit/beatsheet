import type { AccountApi } from './api';

/** Gemerktes Konto; ohne Kennung, bis der Server sie liefert (account-id-authorship, design.md D2). */
export interface StoredAccount {
  email: string;
  account?: string;
}

/** Anmeldestatus, den Menü, Karten und Sync teilen. */
export interface AccountSession {
  api: AccountApi;
  getEmail(): string | null;
  /** Kennung des Kontos, Autor eigener Änderungen. */
  getAccount(): string | null;
  subscribe(listener: () => void): () => void;
  /** Fragt den Server. Antwortet er nicht mit einer Sitzung, bleibt der Status, weil das auch ein Netzwerkfehler sein kann. */
  refresh(): Promise<void>;
  setSession(next: StoredAccount | null): void;
}

const STORAGE_KEY = 'beatsheet.account';

export interface AccountSessionOptions {
  /** Merkt das Konto über einen Neustart hinweg, damit auch Offline-Änderungen einen Autor tragen (song-history, design.md D2). */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

export function createAccountSession(api: AccountApi, { storage }: AccountSessionOptions = {}): AccountSession {
  let current: StoredAccount | null = read(storage);
  const listeners = new Set<() => void>();

  const setSession = (next: StoredAccount | null) => {
    if (next?.email === current?.email && next?.account === current?.account) return;
    current = next && { email: next.email, ...(next.account ? { account: next.account } : {}) };
    write(storage, current);
    listeners.forEach((listener) => listener());
  };

  return {
    api,
    getEmail: () => current?.email ?? null,
    getAccount: () => current?.account ?? null,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async refresh() {
      const next = await api.session();
      if (next) setSession(next);
    },
    setSession,
  };
}

/** Ältere Versionen speicherten nur die Adresse. */
function read(storage: AccountSessionOptions['storage']): StoredAccount | null {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    if (!value) return null;
    if (!value.startsWith('{')) return { email: value };
    const { email, account } = JSON.parse(value) as { email?: unknown; account?: unknown };
    if (typeof email !== 'string') return null;
    return typeof account === 'string' ? { email, account } : { email };
  } catch {
    return null;
  }
}

function write(storage: AccountSessionOptions['storage'], value: StoredAccount | null) {
  try {
    if (value) storage?.setItem(STORAGE_KEY, JSON.stringify(value));
    else storage?.removeItem(STORAGE_KEY);
  } catch {
    // Ohne Speicher gilt das Konto nur bis zum Neustart
  }
}

/** Autor eigener Änderungen: die Kennung, nie die Adresse (account-id-authorship, design.md D1). */
export const authorOf = (session: Pick<AccountSession, 'getAccount'>) => () => session.getAccount();
