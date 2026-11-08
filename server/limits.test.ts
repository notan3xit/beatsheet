import * as A from '@automerge/automerge/slim';
import { randomBytes } from 'node:crypto';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Song } from '../src/domain/types.ts';
import { applySong, createSongDoc, initAutomerge, songOf, type SongDocument } from '../src/persistence/songDoc.ts';
import { SONG_OVERHEAD, type Limits } from './limits.ts';
import { errorOf, startServer, type Harness } from './testHarness.ts';

const ME = 'ich@example.com';
const ANNA = 'anna@example.com';

interface Workbook {
  id: string;
  title: string;
  personal?: boolean;
}

const song = (id = 'intro', fields: Partial<Song> = {}): Song => ({
  id,
  title: 'Intro',
  tempo: 120,
  patterns: [],
  segments: [],
  createdAt: '2026-11-04T10:00:00.000Z',
  updatedAt: '2026-11-04T10:00:00.000Z',
  revision: 1,
  ...fields,
});

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
const fromBase64 = (text: string) => new Uint8Array(Buffer.from(text, 'base64'));
/** Was ein neuer Song ungefähr belegt; IDs gleicher Länge belegen praktisch gleich viel. */
const footprint = () => A.save(createSongDoc(song())).length + SONG_OVERHEAD;

let h: Harness;
beforeAll(() => initAutomerge());
afterEach(() => h.close());

async function start(limits: Partial<Limits>) {
  h = await startServer({ limits });
  const me = await h.login(ME);
  return me;
}

const list = async (cookie: string) => ((await (await h.api('GET', '/api/workbooks', { cookie })).json()) as { workbooks: Workbook[] }).workbooks;
const personalOf = async (cookie: string) => (await list(cookie)).find((w) => w.personal)!.id;
const createWorkbook = (cookie: string, title = 'Band') => h.api('POST', '/api/workbooks', { cookie, body: { title } });
const bandOf = async (cookie: string, title = 'Band') => ((await (await createWorkbook(cookie, title)).json()) as Workbook).id;
const invite = (cookie: string, workbook: string, email: string) => h.api('POST', `/api/workbooks/${workbook}/members`, { cookie, body: { email } });
const addSong = (cookie: string, workbook: string, doc: SongDocument, id = 'intro') =>
  h.api('POST', `/api/workbooks/${workbook}/songs`, { cookie, body: { id, doc: toBase64(A.save(doc)) } });
const deleteSong = (cookie: string, workbook: string, id = 'intro') => h.api('DELETE', `/api/workbooks/${workbook}/songs/${id}`, { cookie });
const sync = async (cookie: string, workbook: string, songs: unknown) => {
  const response = await h.api('POST', `/api/workbooks/${workbook}/sync`, { cookie, body: { songs } });
  expect(response.status).toBe(200);
  return ((await response.json()) as { songs: { id: string; status: string; reason?: string; heads?: string[]; changes?: string; doc?: string }[] }).songs;
};
const stored = async (cookie: string, workbook: string, id = 'intro') => {
  const entry = (await sync(cookie, workbook, [])).find((s) => s.id === id)!;
  return songOf(A.load(fromBase64(entry.doc!)));
};
/** Große Änderung: Ein schlecht komprimierbarer Titel lässt das Dokument deutlich wachsen. */
const BIG_TITLE = randomBytes(1500).toString('base64');
const grown = (doc: SongDocument, id = 'intro') => applySong(A.clone(doc), song(id, { title: BIG_TITLE, revision: 2 }));

describe('Spec server-limits › Speichergrenze je Account', () => {
  it('Neuer Song über der Grenze: abgewiesen, nichts gespeichert', async () => {
    const me = await start({ accountBytes: Math.floor(footprint() * 1.5) });
    const personal = await personalOf(me);
    expect((await addSong(me, personal, createSongDoc(song()))).status).toBe(201);
    const response = await addSong(me, personal, createSongDoc(song('zweit')), 'zweit');
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe('quota-exceeded');
    expect((await sync(me, personal, [])).map((s) => s.id)).toEqual(['intro']);
  });

  it('Abgleich über der Grenze: quota mit Grund, Stand unverändert, andere Songs laufen weiter, kein Ereignis', async () => {
    const me = await start({ accountBytes: footprint() * 2 + 300 });
    const personal = await personalOf(me);
    const a = createSongDoc(song('song-a'));
    const b = createSongDoc(song('song-b'));
    await addSong(me, personal, a, 'song-a');
    await addSong(me, personal, b, 'song-b');
    const small = applySong(A.clone(b), song('song-b', { tempo: 90, revision: 2 }));
    const big = grown(a, 'song-a');
    const baseA = A.getHeads(a);
    const baseB = A.getHeads(b);
    const replies = await sync(me, personal, [
      { id: 'song-a', base: baseA, changes: toBase64(A.saveSince(big, baseA)) },
      { id: 'song-b', base: baseB, changes: toBase64(A.saveSince(small, baseB)) },
    ]);
    expect(replies.find((r) => r.id === 'song-a')).toEqual({ id: 'song-a', status: 'quota', reason: 'quota-exceeded', heads: baseA });
    expect(replies.find((r) => r.id === 'song-b')!.status).toBe('ok');
    expect((await stored(me, personal, 'song-a')).title).toBe('Intro');
    expect((await stored(me, personal, 'song-b')).tempo).toBe(90);
  });

  it('Eine abgewiesene Änderung löst kein Ereignis aus', async () => {
    const me = await start({ accountBytes: footprint() + 100 });
    const personal = await personalOf(me);
    const doc = createSongDoc(song());
    await addSong(me, personal, doc);
    const controller = new AbortController();
    const stream = await fetch(`${h.url}/api/events`, { headers: { Cookie: me }, signal: controller.signal });
    let text = '';
    void (async () => {
      const decoder = new TextDecoder();
      try {
        for await (const chunk of stream.body as unknown as AsyncIterable<Uint8Array>) text += decoder.decode(chunk);
      } catch {
        // abgebrochen
      }
    })();
    const base = A.getHeads(doc);
    await sync(me, personal, [{ id: 'intro', base, changes: toBase64(A.saveSince(grown(doc), base)) }]);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(text).not.toContain('event:');
    controller.abort();
  });

  it('Bei quota kommen Änderungen anderer trotzdem an', async () => {
    const me = await start({ accountBytes: footprint() + 200 });
    const band = await bandOf(me);
    await invite(me, band, ANNA);
    const anna = await h.login(ANNA);
    const doc = createSongDoc(song());
    await addSong(me, band, doc);
    const base = A.getHeads(doc);
    const foreign = applySong(A.clone(doc), song('intro', { tempo: 90, revision: 2 }));
    await sync(anna, band, [{ id: 'intro', base, changes: toBase64(A.saveSince(foreign, base)) }]);

    const mine = grown(doc);
    const [reply] = await sync(me, band, [{ id: 'intro', base, changes: toBase64(A.saveSince(mine, base)) }]);
    expect(reply).toMatchObject({ status: 'quota', heads: A.getHeads(foreign) });
    const merged = A.loadIncremental(mine, fromBase64(reply!.changes!));
    expect(songOf(merged)).toMatchObject({ tempo: 90, title: BIG_TITLE });
  });

  it('Wiederholte Übertragung und Abgleich ohne Änderung bleiben in vollem Bestand möglich', async () => {
    const me = await start({ accountBytes: footprint() + 300 });
    const personal = await personalOf(me);
    const doc = createSongDoc(song());
    await addSong(me, personal, doc);
    const base = A.getHeads(doc);
    const small = applySong(A.clone(doc), song('intro', { tempo: 90, revision: 2 }));
    const changes = toBase64(A.saveSince(small, base));
    expect((await sync(me, personal, [{ id: 'intro', base, changes }]))[0]!.status).toBe('ok');
    expect((await sync(me, personal, [{ id: 'intro', base, changes }]))[0]!.status).toBe('ok');
    expect((await sync(me, personal, [{ id: 'intro', base: A.getHeads(small) }]))[0]!.status).toBe('ok');
  });

  it('Löschen gibt Speicher frei; der Grabstein belegt weiter seinen Zuschlag', async () => {
    const me = await start({ accountBytes: footprint() + SONG_OVERHEAD + 100 });
    const personal = await personalOf(me);
    await addSong(me, personal, createSongDoc(song()));
    expect((await addSong(me, personal, createSongDoc(song('song-b')), 'song-b')).status).toBe(409);
    expect((await deleteSong(me, personal)).status).toBe(204);
    expect((await addSong(me, personal, createSongDoc(song('song-b')), 'song-b')).status).toBe(201);
  });

  it('Grabsteine zählen: Anlegen und Löschen füllt die Grenze', async () => {
    const me = await start({ accountBytes: footprint() + SONG_OVERHEAD * 2 + 100 });
    const personal = await personalOf(me);
    for (const id of ['song-a', 'song-b']) {
      expect((await addSong(me, personal, createSongDoc(song(id)), id)).status).toBe(201);
      await deleteSong(me, personal, id);
    }
    expect((await addSong(me, personal, createSongDoc(song('song-c')), 'song-c')).status).toBe(201);
    await deleteSong(me, personal, 'song-c');
    expect((await addSong(me, personal, createSongDoc(song('song-d')), 'song-d')).status).toBe(409);
  });

  it('Mitglied schreibt in ein fremdes Workbook: zählt beim Besitzer', async () => {
    const me = await start({ accountBytes: Math.floor(footprint() * 1.5) });
    const band = await bandOf(me);
    await invite(me, band, ANNA);
    const anna = await h.login(ANNA);
    await addSong(me, await personalOf(me), createSongDoc(song()));
    const response = await addSong(anna, band, createSongDoc(song('song-b')), 'song-b');
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe('quota-exceeded');
    // Annas eigener Bestand ist davon nicht betroffen
    expect((await addSong(anna, await personalOf(anna), createSongDoc(song('song-c')), 'song-c')).status).toBe(201);
  });

  it('Mitglied ändert in einem vollen Workbook: Stand bleibt für alle unverändert', async () => {
    const me = await start({ accountBytes: footprint() + 100 });
    const band = await bandOf(me);
    await invite(me, band, ANNA);
    const anna = await h.login(ANNA);
    const doc = createSongDoc(song());
    await addSong(me, band, doc);
    const base = A.getHeads(doc);
    const [reply] = await sync(anna, band, [{ id: 'intro', base, changes: toBase64(A.saveSince(grown(doc), base)) }]);
    expect(reply).toMatchObject({ status: 'quota', reason: 'quota-exceeded' });
    expect((await stored(me, band)).title).toBe('Intro');
  });

  it('Verschieben in ein volles Workbook: abgewiesen, der Song bleibt', async () => {
    const me = await start({ accountBytes: Math.floor(footprint() * 1.5) });
    const band = await bandOf(me);
    await invite(me, band, ANNA);
    await addSong(me, band, createSongDoc(song('voll')), 'voll');
    const anna = await h.login(ANNA);
    const personal = await personalOf(anna);
    await addSong(anna, personal, createSongDoc(song()));
    const response = await h.api('POST', `/api/workbooks/${personal}/songs/intro/move`, { cookie: anna, body: { to: band } });
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe('quota-exceeded');
    expect((await sync(anna, personal, [])).map((s) => s.id)).toEqual(['intro']);
  });

  it('Verschieben beim selben Besitzer ändert die Belegung nicht', async () => {
    const me = await start({ accountBytes: footprint() + 100 });
    const band = await bandOf(me);
    const personal = await personalOf(me);
    await addSong(me, personal, createSongDoc(song()));
    expect((await h.api('POST', `/api/workbooks/${personal}/songs/intro/move`, { cookie: me, body: { to: band } })).status).toBe(200);
  });

  it('Gesehene Stände belegen Speicher', async () => {
    const me = await start({ accountBytes: footprint() + 50 });
    const band = await bandOf(me);
    const response = await h.api('POST', `/api/workbooks/${band}/sync`, { cookie: me, body: { songs: [], workbook: { base: [] } } });
    expect(response.status).toBe(200);
    expect((await addSong(me, band, createSongDoc(song()))).status).toBe(409);
  });
});

describe('Spec server-limits › Gesamtgrenze für den Speicher', () => {
  it('Gesamtgrenze erreicht: abgewiesen und einmal protokolliert, Löschen bleibt möglich', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const me = await start({ totalBytes: Math.floor(footprint() * 1.5) });
      const personal = await personalOf(me);
      await addSong(me, personal, createSongDoc(song()));
      const anna = await h.login(ANNA);
      const annas = await personalOf(anna);
      const response = await addSong(anna, annas, createSongDoc(song('song-b')), 'song-b');
      expect(response.status).toBe(409);
      expect(await errorOf(response)).toBe('server-full');
      await addSong(anna, annas, createSongDoc(song('song-c')), 'song-c');
      expect(log).toHaveBeenCalledTimes(1);
      h.advance(3_600_001);
      await addSong(anna, annas, createSongDoc(song('song-d')), 'song-d');
      expect(log).toHaveBeenCalledTimes(2);
      expect((await deleteSong(me, personal)).status).toBe(204);
    } finally {
      log.mockRestore();
    }
  });

  it('Abgleich an der Gesamtgrenze nennt den Grund', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const me = await start({ totalBytes: footprint() + 100 });
      const personal = await personalOf(me);
      const doc = createSongDoc(song());
      await addSong(me, personal, doc);
      const base = A.getHeads(doc);
      const [reply] = await sync(me, personal, [{ id: 'intro', base, changes: toBase64(A.saveSince(grown(doc), base)) }]);
      expect(reply).toMatchObject({ status: 'quota', reason: 'server-full' });
    } finally {
      log.mockRestore();
    }
  });
});

describe('Spec server-limits › Grenzen für Workbooks und Mitglieder', () => {
  it('Zu viele Workbooks: abgewiesen, der eigene Bestand zählt nicht', async () => {
    const me = await start({ ownedWorkbooks: 2 });
    await list(me);
    expect((await createWorkbook(me, 'Eins')).status).toBe(201);
    expect((await createWorkbook(me, 'Zwei')).status).toBe(201);
    const response = await createWorkbook(me, 'Drei');
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe('too-many-workbooks');
    expect((await list(me)).map((w) => w.title)).not.toContain('Drei');
  });

  it('Zu viele Mitglieder: abgewiesen ohne Mail und ohne Verbrauch des Kontingents', async () => {
    const me = await start({ workbookMembers: 2 });
    const band = await bandOf(me);
    expect((await invite(me, band, ANNA)).status).toBe(204);
    h.mails.length = 0;
    const response = await invite(me, band, 'ben@example.com');
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe('too-many-members');
    expect(h.mails).toHaveLength(0);
    expect(h.db.prepare('SELECT COUNT(*) AS n FROM invitations').get()).toEqual({ n: 1 });
    expect(h.db.prepare('SELECT COUNT(*) AS n FROM members WHERE workbook_id = ?').get(band)).toEqual({ n: 2 });
  });

  it('Bereits Mitglied geht vor der Höchstzahl', async () => {
    const me = await start({ workbookMembers: 2 });
    const band = await bandOf(me);
    await invite(me, band, ANNA);
    expect(await errorOf(await invite(me, band, ANNA))).toBe('already-member');
  });

  it('Wer austritt, macht Platz', async () => {
    const me = await start({ workbookMembers: 2 });
    const band = await bandOf(me);
    await invite(me, band, ANNA);
    await h.api('DELETE', `/api/workbooks/${band}/members/${encodeURIComponent(ANNA)}`, { cookie: me });
    expect((await invite(me, band, 'ben@example.com')).status).toBe(204);
  });
});

describe('Spec server-limits › Grenzen für Ereignis-Verbindungen', () => {
  const connect = (cookie: string, signal?: AbortSignal) => fetch(`${h.url}/api/events`, { headers: { Cookie: cookie }, signal });

  it('Elfte Verbindung: abgewiesen, nach dem Schließen einer anderen wieder möglich', async () => {
    const me = await start({ accountConnections: 2 });
    const first = new AbortController();
    expect((await connect(me, first.signal)).status).toBe(200);
    const second = new AbortController();
    expect((await connect(me, second.signal)).status).toBe(200);
    const third = await connect(me);
    expect(third.status).toBe(429);
    expect(await errorOf(third)).toBe('too-many-connections');

    first.abort();
    await vi.waitFor(async () => {
      const again = await connect(me);
      expect(again.status).toBe(200);
      void again.body?.cancel();
    });
    second.abort();
  });

  it('Andere Accounts sind von der Grenze je Account nicht betroffen', async () => {
    const me = await start({ accountConnections: 1 });
    const own = new AbortController();
    await connect(me, own.signal);
    const anna = new AbortController();
    expect((await connect(await h.login(ANNA), anna.signal)).status).toBe(200);
    own.abort();
    anna.abort();
  });

  it('Gesamtgrenze der Verbindungen', async () => {
    const me = await start({ totalConnections: 1 });
    const own = new AbortController();
    await connect(me, own.signal);
    const other = await connect(await h.login(ANNA));
    expect(other.status).toBe(429);
    own.abort();
  });
});
