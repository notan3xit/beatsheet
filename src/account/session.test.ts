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

describe('Spec song-history › Autor einer Änderung', () => {
  it('Offline nach Neustart: Die Adresse ist vor einer Antwort des Servers bekannt', async () => {
    const storage = memoryStorage();
    createAccountSession(offline, { storage }).setEmail('ich@example.com');

    const restarted = createAccountSession(offline, { storage });
    expect(restarted.getEmail()).toBe('ich@example.com');
    await restarted.refresh();
    expect(restarted.getEmail()).toBe('ich@example.com');
  });

  it('Nach dem Abmelden ist die Adresse vergessen', () => {
    const storage = memoryStorage();
    createAccountSession(offline, { storage }).setEmail('ich@example.com');
    createAccountSession(offline, { storage }).setEmail(null);
    expect(createAccountSession(offline, { storage }).getEmail()).toBeNull();
  });

  it('Ohne Speicher beginnt die Sitzung abgemeldet', () => {
    expect(createAccountSession(offline).getEmail()).toBeNull();
  });
});
