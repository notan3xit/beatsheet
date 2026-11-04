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

export function createAccountSession(api: AccountApi): AccountSession {
  let email: string | null = null;
  const listeners = new Set<() => void>();

  const setEmail = (next: string | null) => {
    if (next === email) return;
    email = next;
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
