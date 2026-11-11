import * as A from '@automerge/automerge/slim';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Song } from '../src/domain/types.ts';
import { applySong, createSongDoc, initAutomerge, songOf, type SongDocument } from '../src/persistence/songDoc.ts';
import { errorOf, startServer, type Harness } from './testHarness.ts';

const OWNER = 'ich@example.com';
const ANNA = 'anna@example.com';

interface Workbook {
  id: string;
  title: string;
  owner: string;
  members: { email: string }[];
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

let h: Harness;
let owner: string;

beforeAll(() => initAutomerge());

beforeEach(async () => {
  h = await startServer();
  owner = await h.login(OWNER);
});

afterEach(() => h.close());

const list = async (cookie = owner) => ((await (await h.api('GET', '/api/workbooks', { cookie })).json()) as { workbooks: Workbook[] }).workbooks;
const personalOf = async (cookie = owner) => (await list(cookie)).find((w) => w.personal)!;
const addSong = (workbook: string, doc: SongDocument, id = 'intro', cookie = owner) =>
  h.api('POST', `/api/workbooks/${workbook}/songs`, { cookie, body: { id, doc: toBase64(A.save(doc)) } });
const sync = async (workbook: string, songs: unknown, cookie = owner) => {
  const response = await h.api('POST', `/api/workbooks/${workbook}/sync`, { cookie, body: { songs } });
  expect(response.status).toBe(200);
  return ((await response.json()) as { songs: { id: string; status: string; doc?: string; to?: string; heads?: string[]; changes?: string }[] }).songs;
};

describe('Spec account-songs › Persönlicher Bestand', () => {
  it('liefert genau ein persönliches Workbook und legt es nur einmal an', async () => {
    const first = await list();
    const second = await list();
    expect(first.filter((w) => w.personal)).toHaveLength(1);
    expect(second).toEqual(first);
    expect(first[0]).toMatchObject({ owner: OWNER, members: [{ email: OWNER }], personal: true });
  });

  it('kennzeichnet nur das persönliche Workbook', async () => {
    await h.api('POST', '/api/workbooks', { cookie: owner, body: { title: 'Band' } });
    const band = (await list()).find((w) => w.title === 'Band')!;
    expect(band.personal).toBeUndefined();
  });

  it('jeder Account hat ein eigenes', async () => {
    const anna = await h.login(ANNA);
    expect((await personalOf(anna)).id).not.toBe((await personalOf()).id);
  });

  it('nimmt Songs an und gleicht sie ab wie andere Workbooks', async () => {
    const { id } = await personalOf();
    const doc = createSongDoc(song());
    expect((await addSong(id, doc)).status).toBe(201);
    const base = A.getHeads(doc);
    const changed = applySong(A.clone(doc), song('intro', { title: 'Neu', revision: 2 }));
    const [reply] = await sync(id, [{ id: 'intro', base, changes: toBase64(A.saveSince(changed, base)) }]);
    expect(reply).toMatchObject({ status: 'ok', heads: A.getHeads(changed) });
    const [entry] = await sync(id, []);
    expect(songOf(A.load(fromBase64(entry!.doc!))).title).toBe('Neu');
  });
});

describe('Spec account-songs › Zugriff auf eigene Songs', () => {
  it('Teilen ausgeschlossen', async () => {
    const before = await personalOf();
    const { id } = before;
    const attempts = [
      h.api('PATCH', `/api/workbooks/${id}`, { cookie: owner, body: { title: 'Meins' } }),
      h.api('DELETE', `/api/workbooks/${id}`, { cookie: owner }),
      h.api('POST', `/api/workbooks/${id}/members`, { cookie: owner, body: { email: ANNA } }),
      h.api('DELETE', `/api/workbooks/${id}/members/${encodeURIComponent(OWNER)}`, { cookie: owner }),
    ];
    for (const response of await Promise.all(attempts)) {
      expect(response.status).toBe(403);
      expect(await errorOf(response)).toBe('personal');
    }
    expect(await personalOf()).toEqual(before);
    expect(h.mails).toHaveLength(0);
  });

  it('Fremder Zugriff', async () => {
    const { id } = await personalOf();
    await addSong(id, createSongDoc(song()));
    const anna = await h.login(ANNA);
    const attempts = [
      h.api('POST', `/api/workbooks/${id}/sync`, { cookie: anna, body: { songs: [] } }),
      addSong(id, createSongDoc(song('fremd')), 'fremd', anna),
      h.api('DELETE', `/api/workbooks/${id}/songs/intro`, { cookie: anna }),
      h.api('PATCH', `/api/workbooks/${id}`, { cookie: anna, body: { title: 'Meins' } }),
      h.api('POST', `/api/workbooks/${id}/members`, { cookie: anna, body: { email: ANNA } }),
    ];
    for (const response of await Promise.all(attempts)) expect(response.status).toBe(404);
    expect((await sync(id, [])).map((s) => s.id)).toEqual(['intro']);
  });
});

describe('Spec account-songs › Eigenen Song in ein Workbook verschieben', () => {
  let personal: string;
  let band: string;
  let doc: SongDocument;
  const move = (songId = 'intro', from = personal, to: unknown = band, cookie = owner) =>
    h.api('POST', `/api/workbooks/${from}/songs/${songId}/move`, { cookie, body: { to } });

  beforeEach(async () => {
    personal = (await personalOf()).id;
    band = ((await (await h.api('POST', '/api/workbooks', { cookie: owner, body: { title: 'Band' } })).json()) as Workbook).id;
    doc = createSongDoc(song());
    await addSong(personal, doc);
  });

  it('ändert das Workbook und behält Dokument und Heads', async () => {
    const response = await move();
    expect(response.status).toBe(200);
    expect(((await response.json()) as { heads: string[] }).heads).toEqual(A.getHeads(doc));
    const [entry] = await sync(band, []);
    expect(entry).toMatchObject({ id: 'intro', status: 'new' });
    expect(A.getHeads(A.load(fromBase64(entry!.doc!)))).toEqual(A.getHeads(doc));
    expect(await sync(personal, [])).toEqual([]);
  });

  it('der Abgleich im alten Workbook meldet moved, danach übernimmt das Ziel offene Änderungen', async () => {
    const base = A.getHeads(doc);
    const offline = applySong(A.clone(doc), song('intro', { title: 'Offline', revision: 2 }));
    await move();
    expect(await sync(personal, [{ id: 'intro', base }])).toEqual([{ id: 'intro', status: 'moved', to: band }]);
    const [reply] = await sync(band, [{ id: 'intro', base, changes: toBase64(A.saveSince(offline, base)) }]);
    expect(reply).toMatchObject({ id: 'intro', status: 'ok' });
    const fresh = await h.login('ben@example.com');
    await h.api('POST', `/api/workbooks/${band}/members`, { cookie: owner, body: { email: 'ben@example.com' } });
    const [entry] = await sync(band, [], fresh);
    expect(songOf(A.load(fromBase64(entry!.doc!))).title).toBe('Offline');
  });

  it('meldet Nichtmitgliedern des Ziels deleted und nennt ihnen das Ziel nicht', async () => {
    const annaCookie = await h.login(ANNA);
    await h.api('POST', `/api/workbooks/${band}/members`, { cookie: owner, body: { email: ANNA } });
    const annaBand = ((await (await h.api('POST', '/api/workbooks', { cookie: annaCookie, body: { title: 'Annas' } })).json()) as Workbook).id;
    await move();
    expect(await sync(annaBand, [{ id: 'intro', base: A.getHeads(doc) }], annaCookie)).toEqual([{ id: 'intro', status: 'moved', to: band }]);
    await h.api('DELETE', `/api/workbooks/${band}/members/${encodeURIComponent(ANNA)}`, { cookie: owner });
    expect(await sync(annaBand, [{ id: 'intro', base: A.getHeads(doc) }], annaCookie)).toEqual([{ id: 'intro', status: 'deleted' }]);
  });

  it('meldet einen gelöschten Song nicht als moved', async () => {
    await move();
    await h.api('DELETE', `/api/workbooks/${band}/songs/intro`, { cookie: owner });
    expect(await sync(personal, [{ id: 'intro', base: A.getHeads(doc) }])).toEqual([{ id: 'intro', status: 'deleted' }]);
  });

  it('antwortet 404 ohne Mitgliedschaft in einem der Workbooks oder bei unbekanntem Song und ändert nichts', async () => {
    const anna = await h.login(ANNA);
    const annas = ((await (await h.api('POST', '/api/workbooks', { cookie: anna, body: { title: 'Annas' } })).json()) as Workbook).id;
    const attempts = [
      move('intro', personal, annas),
      move('intro', personal, 'gibt-es-nicht'),
      move('intro', personal, 42),
      move('intro', personal, personal),
      move('fremd'),
      move('intro', personal, band, anna),
    ];
    for (const response of await Promise.all(attempts)) expect(response.status).toBe(404);
    expect((await sync(personal, [])).map((s) => s.id)).toEqual(['intro']);
  });

  it('erlaubt das Verschieben nur aus dem eigenen Bestand', async () => {
    await move();
    const other = ((await (await h.api('POST', '/api/workbooks', { cookie: owner, body: { title: 'Zweites' } })).json()) as Workbook).id;
    const response = await move('intro', band, other);
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe('not-personal');
    expect((await sync(band, [])).map((s) => s.id)).toEqual(['intro']);
  });

  it('meldet das Ereignis workbook an beide Workbooks', async () => {
    const events: string[] = [];
    const controller = new AbortController();
    const stream = await fetch(`${h.url}/api/events`, { headers: { Cookie: owner }, signal: controller.signal });
    void (async () => {
      const decoder = new TextDecoder();
      try {
        for await (const chunk of stream.body as unknown as AsyncIterable<Uint8Array>) events.push(decoder.decode(chunk));
      } catch {
        // abgebrochen
      }
    })();
    await move();
    await expect.poll(() => events.join('')).toContain(`"id":"${band}"`);
    expect(events.join('')).toContain(`"id":"${personal}"`);
    controller.abort();
  });
});
