import type { AddressInfo } from 'node:net';
import { createServer, type Server } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app.ts';
import { openDatabase } from './db.ts';
import type { Mail } from './mail.ts';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const SECRET = Buffer.alloc(32, 7);

interface Harness {
  url: string;
  mails: Mail[];
  db: ReturnType<typeof openDatabase>;
  advance(ms: number): void;
  close(): Promise<void>;
}

const open: Harness[] = [];

async function start({ codes = [] as string[], secureCookie = true } = {}): Promise<Harness> {
  let time = Date.parse('2026-11-03T12:00:00.000Z');
  const mails: Mail[] = [];
  const db = openDatabase(':memory:');
  const pending = [...codes];
  let counter = 0;
  const handler = createApp({
    db,
    secret: SECRET,
    now: () => new Date(time),
    newCode: () => pending.shift() ?? String(100000 + ++counter),
    mail: { send: async (mail) => void mails.push(mail) },
    secureCookie,
  });
  const server: Server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const harness: Harness = {
    url: `http://127.0.0.1:${port}`,
    mails,
    db,
    advance: (ms) => void (time += ms),
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
  open.push(harness);
  return harness;
}

afterEach(async () => {
  await Promise.all(open.splice(0).map((h) => h.close()));
});

const post = (h: Harness, path: string, body: unknown, cookie?: string) =>
  fetch(`${h.url}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });

const requestCode = (h: Harness, email: string) => post(h, 'code', { email });
const verify = (h: Harness, email: string, code: string) => post(h, 'verify', { email, code });
const session = (h: Harness, cookie?: string) =>
  fetch(`${h.url}/api/auth/session`, { headers: cookie ? { Cookie: cookie } : {} });

const codeIn = (mail: Mail) => /\b(\d{6})\b/.exec(mail.text)![1]!;
const cookieOf = (response: Response) => response.headers.get('set-cookie')!.split(';')[0]!;
const errorOf = async (response: Response) => ((await response.json()) as { error: string }).error;

/** Fordert einen Code an und meldet sich damit an; liefert das Sitzungs-Cookie. */
async function login(h: Harness, email = 'ich@example.com'): Promise<string> {
  await requestCode(h, email);
  const response = await verify(h, email, codeIn(h.mails.at(-1)!));
  expect(response.status).toBe(200);
  return cookieOf(response);
}

describe('Spec account-auth › Anmeldecode anfordern', () => {
  it('Code anfordern', async () => {
    const h = await start({ codes: ['012345'] });
    const response = await requestCode(h, 'ich@example.com');
    expect(response.status).toBe(204);
    expect(h.mails).toHaveLength(1);
    expect(h.mails[0]!.to).toBe('ich@example.com');
    expect(codeIn(h.mails[0]!)).toBe('012345');
  });

  it('Ungültige Adresse', async () => {
    const h = await start();
    for (const email of ['keine-adresse', 'a@b', 'a b@example.com', `${'x'.repeat(250)}@example.com`, 'a@example.com\nBcc: x@y.z']) {
      const response = await requestCode(h, email);
      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe('invalid-email');
    }
    expect(h.mails).toEqual([]);
  });

  it('Neuer Code ersetzt den alten', async () => {
    const h = await start({ codes: ['111111', '222222'] });
    await requestCode(h, 'ich@example.com');
    h.advance(31_000);
    await requestCode(h, 'ich@example.com');
    expect(await errorOf(await verify(h, 'ich@example.com', '111111'))).toBe('wrong-code');
    expect((await verify(h, 'ich@example.com', '222222')).status).toBe(200);
  });

  it('antwortet für bekannte und unbekannte Adressen gleich', async () => {
    const h = await start();
    await login(h, 'bekannt@example.com');
    h.advance(31_000);
    const known = await requestCode(h, 'bekannt@example.com');
    const unknown = await requestCode(h, 'neu@example.com');
    expect([known.status, await known.text()]).toEqual([unknown.status, await unknown.text()]);
  });
});

describe('Spec account-auth › Mit Code anmelden', () => {
  it('Erste Anmeldung', async () => {
    const h = await start();
    await requestCode(h, 'ich@example.com');
    const response = await verify(h, 'ich@example.com', codeIn(h.mails[0]!));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ email: 'ich@example.com' });
    const current = await session(h, cookieOf(response));
    expect(await current.json()).toEqual({ email: 'ich@example.com' });
  });

  it('Erneute Anmeldung mit anderer Schreibweise', async () => {
    const h = await start();
    await login(h, 'ich@example.com');
    h.advance(31_000);
    await requestCode(h, ' Ich@Example.com ');
    const response = await verify(h, ' Ich@Example.com ', codeIn(h.mails.at(-1)!));
    expect(await response.json()).toEqual({ email: 'ich@example.com' });
    expect(h.db.prepare('SELECT COUNT(*) AS n FROM users').get()).toEqual({ n: 1 });
  });

  it('Code zweimal verwenden', async () => {
    const h = await start();
    await requestCode(h, 'ich@example.com');
    const code = codeIn(h.mails[0]!);
    await verify(h, 'ich@example.com', code);
    const again = await verify(h, 'ich@example.com', code);
    expect(again.status).toBe(400);
    expect(await errorOf(again)).toBe('no-code');
  });

  it('ohne angeforderten Code', async () => {
    const h = await start();
    expect(await errorOf(await verify(h, 'ich@example.com', '123456'))).toBe('no-code');
  });
});

describe('Spec account-auth › Falscher oder abgelaufener Code', () => {
  it('Falscher Code', async () => {
    const h = await start({ codes: ['111111'] });
    await requestCode(h, 'ich@example.com');
    const response = await verify(h, 'ich@example.com', '999999');
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe('wrong-code');
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('Abgelaufener Code', async () => {
    const h = await start();
    await requestCode(h, 'ich@example.com');
    h.advance(11 * MINUTE);
    expect(await errorOf(await verify(h, 'ich@example.com', codeIn(h.mails[0]!)))).toBe('expired');
  });

  it('Zu viele Fehlversuche', async () => {
    const h = await start({ codes: ['111111'] });
    await requestCode(h, 'ich@example.com');
    const errors = [];
    for (let i = 0; i < 5; i++) errors.push(await errorOf(await verify(h, 'ich@example.com', '999999')));
    expect(errors).toEqual(['wrong-code', 'wrong-code', 'wrong-code', 'wrong-code', 'too-many-attempts']);
    const correct = await verify(h, 'ich@example.com', '111111');
    expect(await errorOf(correct)).toBe('too-many-attempts');
  });
});

describe('Spec account-auth › Begrenzung der Code-Anforderungen', () => {
  it('Zweite Anforderung innerhalb von 30 Sekunden', async () => {
    const h = await start();
    await requestCode(h, 'ich@example.com');
    h.advance(29_000);
    const second = await requestCode(h, 'ich@example.com');
    expect(second.status).toBe(429);
    expect(await errorOf(second)).toBe('rate-limited');
    expect(h.mails).toHaveLength(1);
  });

  it('Elfte Anforderung in einer Stunde', async () => {
    const h = await start();
    const statuses = [];
    for (let i = 0; i < 11; i++) {
      statuses.push((await requestCode(h, 'ich@example.com')).status);
      h.advance(31_000);
    }
    expect(statuses).toEqual([...Array(10).fill(204), 429]);
    expect(h.mails).toHaveLength(10);
  });

  it('höchstens 50 Anmeldemails pro Stunde insgesamt', async () => {
    const h = await start();
    for (let i = 0; i < 50; i++) expect((await requestCode(h, `n${i}@example.com`)).status).toBe(204);
    expect((await requestCode(h, 'n50@example.com')).status).toBe(429);
    h.advance(61 * MINUTE);
    expect((await requestCode(h, 'n50@example.com')).status).toBe(204);
    expect(h.mails).toHaveLength(51);
  });
});

describe('Spec account-auth › Sitzung', () => {
  it('Neuladen', async () => {
    const h = await start();
    const cookie = await login(h);
    h.advance(89 * DAY);
    expect(await (await session(h, cookie)).json()).toEqual({ email: 'ich@example.com' });
  });

  it('Sitzung abgelaufen', async () => {
    const h = await start();
    const cookie = await login(h);
    h.advance(90 * DAY + 1000);
    expect((await session(h, cookie)).status).toBe(401);
  });

  it('ohne Cookie nicht angemeldet', async () => {
    const h = await start();
    expect((await session(h)).status).toBe(401);
    expect((await session(h, 'drumstuff_session=erfunden')).status).toBe(401);
  });
});

describe('Spec account-auth › Abmelden', () => {
  it('Abmelden', async () => {
    const h = await start();
    const cookie = await login(h);
    const response = await post(h, 'logout', {}, cookie);
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toMatch(/^drumstuff_session=;.*Max-Age=0/);
  });

  it('Alte Sitzung nach dem Abmelden', async () => {
    const h = await start();
    const cookie = await login(h);
    await post(h, 'logout', {}, cookie);
    expect((await session(h, cookie)).status).toBe(401);
  });
});

describe('Spec account-auth › Schutz von Codes und Sitzungen', () => {
  it('Gespeicherte Daten', async () => {
    const h = await start({ codes: ['123456', '654321'] });
    const cookie = await login(h);
    h.advance(31_000);
    await requestCode(h, 'ich@example.com');
    const token = cookie.split('=')[1]!;
    const tables = ['users', 'login_codes', 'code_requests', 'sessions'];
    const dump = JSON.stringify(tables.map((t) => h.db.prepare(`SELECT * FROM ${t}`).all()), (_k, v) =>
      v instanceof Uint8Array ? Buffer.from(v).toString('hex') : v,
    );
    for (const secret of ['123456', '654321', token]) expect(dump).not.toContain(secret);
  });

  it('Sitzungs-Cookie', async () => {
    const h = await start();
    await requestCode(h, 'ich@example.com');
    const header = (await verify(h, 'ich@example.com', codeIn(h.mails[0]!))).headers.get('set-cookie')!;
    const attributes = header.split(';').map((a) => a.trim());
    expect(attributes[0]).toMatch(/^drumstuff_session=[A-Za-z0-9_-]{43}$/);
    expect(attributes).toEqual(expect.arrayContaining(['HttpOnly', 'SameSite=Lax', 'Path=/api', 'Secure', `Max-Age=${90 * 24 * 3600}`]));
  });

  it('ohne Secure bei --insecure-cookie', async () => {
    const h = await start({ secureCookie: false });
    await requestCode(h, 'ich@example.com');
    const header = (await verify(h, 'ich@example.com', codeIn(h.mails[0]!))).headers.get('set-cookie')!;
    expect(header).not.toMatch(/Secure/);
  });
});

describe('Schnittstelle (design.md D4)', () => {
  it('lehnt Anfragen ohne JSON-Content-Type ab', async () => {
    const h = await start();
    const response = await fetch(`${h.url}/api/auth/code`, { method: 'POST', body: 'email=ich@example.com', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    expect(response.status).toBe(415);
    expect(h.mails).toEqual([]);
  });

  it('lehnt zu große oder ungültige Körper ab', async () => {
    const h = await start();
    expect((await post(h, 'code', { email: 'x'.repeat(5000) })).status).toBe(413);
    const broken = await fetch(`${h.url}/api/auth/code`, { method: 'POST', body: '{', headers: { 'Content-Type': 'application/json' } });
    expect(broken.status).toBe(400);
  });

  it('unbekannte Pfade ergeben 404', async () => {
    const h = await start();
    expect((await fetch(`${h.url}/api/unbekannt`)).status).toBe(404);
  });
});
