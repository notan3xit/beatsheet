import { describe, expect, it } from 'vitest';
import type { AccountApi } from './api';
import { createAccountSession } from './session';

/** Server, der nicht antwortet: `session()` liefert keine Sitzung. */
const offline: AccountApi = {
  session: async () => null,
  requestCode: async () => ({ ok: false, error: 'unreachable' }),
  verify: async () => ({ ok: false, error: 'unreachable' }),
  logout: async () => ({ ok: false, error: 'unreachable' }),
};

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
}

const ACCOUNT = '0f8fad5b-d9cb-469f-a165-70867728950e';
const online = (current: { email: string; account: string }): AccountApi => ({ ...offline, session: async () => current });

describe('Spec song-history › Autor einer Änderung', () => {
  it('Offline nach Neustart: Adresse und Kennung sind vor einer Antwort des Servers bekannt', async () => {
    const storage = memoryStorage();
    createAccountSession(offline, { storage }).setSession({ email: 'ich@example.com', account: ACCOUNT });

    const restarted = createAccountSession(offline, { storage });
    expect(restarted.getEmail()).toBe('ich@example.com');
    expect(restarted.getAccount()).toBe(ACCOUNT);
    await restarted.refresh();
    expect(restarted.getAccount()).toBe(ACCOUNT);
  });

  it('Ein gespeicherter Wert nur mit Adresse gilt als angemeldet ohne Kennung, bis der Server sie liefert', async () => {
    const storage = memoryStorage();
    storage.setItem('beatsheet.account', 'ich@example.com');
    const session = createAccountSession(online({ email: 'ich@example.com', account: ACCOUNT }), { storage });
    expect(session.getEmail()).toBe('ich@example.com');
    expect(session.getAccount()).toBeNull();
    await session.refresh();
    expect(session.getAccount()).toBe(ACCOUNT);
    expect(createAccountSession(offline, { storage }).getAccount()).toBe(ACCOUNT);
  });

  it('Nach dem Abmelden sind Adresse und Kennung vergessen', () => {
    const storage = memoryStorage();
    createAccountSession(offline, { storage }).setSession({ email: 'ich@example.com', account: ACCOUNT });
    createAccountSession(offline, { storage }).setSession(null);
    const restarted = createAccountSession(offline, { storage });
    expect(restarted.getEmail()).toBeNull();
    expect(restarted.getAccount()).toBeNull();
  });

  it('Ohne Speicher beginnt die Sitzung abgemeldet', () => {
    expect(createAccountSession(offline).getEmail()).toBeNull();
    expect(createAccountSession(offline).getAccount()).toBeNull();
  });
});
