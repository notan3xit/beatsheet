import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpAccountApi } from './api';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function stubFetch(...responses: (Response | Error)[]) {
  const fetch = vi.fn(async () => {
    const next = responses.shift()!;
    if (next instanceof Error) throw next;
    return next;
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HTTP-Client der Anmeldung (server-auth, design.md D8)', () => {
  it('fordert einen Code mit JSON an', async () => {
    const fetch = stubFetch(json(204));
    expect(await createHttpAccountApi().requestCode('ich@example.com')).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith('/api/auth/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ich@example.com' }),
    });
  });

  it('bildet Fehlercodes des Servers ab', async () => {
    stubFetch(json(429, { error: 'rate-limited' }), json(400, { error: 'wrong-code' }), json(400, { error: 'expired' }));
    const api = createHttpAccountApi();
    expect(await api.requestCode('ich@example.com')).toEqual({ ok: false, error: 'rate-limited' });
    expect(await api.verify('ich@example.com', '123456')).toEqual({ ok: false, error: 'wrong-code' });
    expect(await api.verify('ich@example.com', '123456')).toEqual({ ok: false, error: 'expired' });
  });

  it('meldet den Server als nicht erreichbar bei Netzwerkfehler, 5xx oder fremder Antwort', async () => {
    stubFetch(new TypeError('Failed to fetch'), json(502), new Response('<html>', { status: 404 }));
    const api = createHttpAccountApi();
    expect(await api.requestCode('ich@example.com')).toEqual({ ok: false, error: 'unreachable' });
    expect(await api.verify('ich@example.com', '1')).toEqual({ ok: false, error: 'unreachable' });
    expect(await api.logout()).toEqual({ ok: false, error: 'unreachable' });
  });

  it('liefert nach der Anmeldung die Adresse', async () => {
    stubFetch(json(200, { email: 'ich@example.com' }));
    expect(await createHttpAccountApi().verify('ich@example.com', '123456')).toEqual({ ok: true, email: 'ich@example.com' });
  });

  it('fragt die Sitzung ab; ohne Sitzung oder Server ergibt das null', async () => {
    stubFetch(json(200, { email: 'ich@example.com' }), json(401, { error: 'unauthenticated' }), new TypeError('offline'));
    const api = createHttpAccountApi();
    expect(await api.session()).toBe('ich@example.com');
    expect(await api.session()).toBeNull();
    expect(await api.session()).toBeNull();
  });

  it('meldet ab', async () => {
    const fetch = stubFetch(json(204));
    expect(await createHttpAccountApi().logout()).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
  });
});
