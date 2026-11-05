import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from './db.ts';
import { errorOf, startServer, type Harness } from './testHarness.ts';

const ME = 'ich@example.com';
const ANNA = 'anna@example.com';

let h: Harness;
let me: string;

beforeEach(async () => {
  h = await startServer();
  me = await h.login(ME);
});

afterEach(() => h.close());

const load = (cookie?: string) => h.api('GET', '/api/auth/profile', { cookie });
const save = (body: unknown, cookie = me) => h.api('PUT', '/api/auth/profile', { cookie, body });
const profileOf = async (cookie: string) => ((await (await load(cookie)).json()) as { profile: unknown }).profile;

/** Ereignisse der Verbindung mitlesen. */
async function listen(cookie: string) {
  const controller = new AbortController();
  const response = await fetch(`${h.url}/api/events`, { headers: { Cookie: cookie }, signal: controller.signal });
  const events: string[] = [];
  void (async () => {
    const decoder = new TextDecoder();
    try {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
        for (const match of decoder.decode(chunk, { stream: true }).matchAll(/^event: (.*)$/gm)) events.push(match[1]!);
      }
    } catch {
      // abgebrochen
    }
  })();
  return { events, close: () => controller.abort() };
}

const waitFor = async (condition: () => boolean) => {
  for (let i = 0; i < 100 && !condition(); i++) await new Promise((resolve) => setTimeout(resolve, 10));
  expect(condition()).toBe(true);
};

describe('Spec account-profile › Profil anlegen (Server)', () => {
  it('Ein neuer Account hat kein Profil', async () => {
    const response = await load(me);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ profile: null });
  });

  it('Speichern und Laden', async () => {
    const response = await save({ name: '  Artjom  ', initials: 'AR', color: 'green' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ profile: { name: 'Artjom', initials: 'AR', color: 'green' } });
    expect(await profileOf(me)).toEqual({ name: 'Artjom', initials: 'AR', color: 'green' });
  });

  it('Das Profil gilt für alle Sitzungen des Accounts', async () => {
    await save({ name: 'Artjom', initials: 'AR', color: 'green' });
    expect(await profileOf(await h.login(ME))).toEqual({ name: 'Artjom', initials: 'AR', color: 'green' });
  });

  it('Ohne Sitzung', async () => {
    expect((await load()).status).toBe(401);
    const response = await h.api('PUT', '/api/auth/profile', { body: { name: 'X', initials: 'X', color: 'green' } });
    expect(response.status).toBe(401);
  });
});

describe('Spec account-profile › Vorbelegung des Kürzels (Server)', () => {
  it('Gespeichertes Profil ohne Kürzel', async () => {
    h.db.prepare('UPDATE users SET name = ?, initials = NULL, color = ? WHERE email = ?').run('Artjom Weyand', 'green', ME);
    expect(await profileOf(me)).toEqual({ name: 'Artjom Weyand', initials: 'AW', color: 'green' });
  });
});

describe('Spec account-profile › Name und Farbe (Server)', () => {
  it('Leerer Name, zu langer Name, Zeilenumbruch und falsche Farben werden abgelehnt', async () => {
    for (const body of [
      { name: '   ', initials: 'AB', color: 'green' },
      { name: 'x'.repeat(41), initials: 'AB', color: 'green' },
      { name: 'Anna\nBcc: x@example.com', initials: 'AX', color: 'green' },
      { name: 42, initials: 'AB', color: 'green' },
      { name: 'Anna', initials: 'AN', color: 'red' },
      { name: 'Anna', initials: 'AN', color: 'chartreuse' },
      { name: 'Anna' },
      { name: 'Anna', initials: '', color: 'green' },
      { name: 'Anna', initials: 'ABC', color: 'green' },
      { name: 'Anna', initials: 'A B', color: 'green' },
      { name: 'Anna', initials: 'A\u0001', color: 'green' },
      { name: 'Anna', color: 'green' },
    ]) {
      const response = await save(body);
      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe('invalid-profile');
    }
    expect(await profileOf(me)).toBeNull();
  });

  it('40 Zeichen sind erlaubt', async () => {
    expect((await save({ name: 'x'.repeat(40), initials: 'AB', color: 'blue' })).status).toBe(200);
  });

  it('Gleicher Name', async () => {
    await save({ name: 'Anna', initials: 'AN', color: 'green' });
    const anna = await h.login(ANNA);
    expect((await save({ name: 'Anna', initials: 'AN', color: 'blue' }, anna)).status).toBe(200);
  });
});

describe('Spec workbooks › Geänderte Profile erscheinen bei allen (Server)', () => {
  it('Nach dem Speichern erhalten die Mitglieder gemeinsamer Workbooks das Ereignis workbooks', async () => {
    const band = (await (await h.api('POST', '/api/workbooks', { cookie: me, body: { title: 'Band' } })).json()) as { id: string };
    await h.api('POST', `/api/workbooks/${band.id}/members`, { cookie: me, body: { email: ANNA } });
    const anna = await h.login(ANNA);
    const stranger = await h.login('fremd@example.com');
    const annaEvents = await listen(anna);
    const strangerEvents = await listen(stranger);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await save({ name: 'Artjom', initials: 'AR', color: 'green' });
    await waitFor(() => annaEvents.events.includes('workbooks'));
    expect(strangerEvents.events).not.toContain('workbooks');
    annaEvents.close();
    strangerEvents.close();
  });
});

describe('Datenbank: Migration für Profile', () => {
  it('Eine Datenbank ohne die Spalten erhält sie, vorhandene Accounts bleiben', async () => {
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');
    const dir = mkdtempSync(join(tmpdir(), 'beatsheet-'));
    const path = join(dir, 'alt.sqlite');
    const old = new DatabaseSync(path);
    old.exec('CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL)');
    old.prepare('INSERT INTO users VALUES (?, ?, ?)').run('u1', ME, 1);
    old.close();
    const db = openDatabase(path);
    expect(db.prepare('SELECT email, name, color FROM users').get()).toEqual({ email: ME, name: null, color: null });
    db.close();
    openDatabase(path).close();
    rmSync(dir, { recursive: true });
  });
});
