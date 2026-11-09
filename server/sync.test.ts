import * as A from '@automerge/automerge/slim';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Song } from '../src/domain/types.ts';
import { applySong, createSongDoc, initAutomerge, songOf, type SongDocument } from '../src/persistence/songDoc.ts';
import { markSeen, seenOf, type WorkbookDocument } from '../src/persistence/workbookDoc.ts';
import { errorOf, startServer, type Harness } from './testHarness.ts';

const OWNER = 'ich@example.com';
const ANNA = 'anna@example.com';

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

interface SyncEntry {
  id: string;
  status: string;
  doc?: string;
  changes?: string;
  heads?: string[];
}

let h: Harness;
let owner: string;
let workbook: string;

beforeAll(() => initAutomerge());

beforeEach(async () => {
  h = await startServer();
  owner = await h.login(OWNER);
  workbook = ((await (await h.api('POST', '/api/workbooks', { cookie: owner, body: { title: 'Band' } })).json()) as { id: string }).id;
});

afterEach(() => h.close());

const addSong = (doc: SongDocument, id = 'intro', cookie = owner, target = workbook) =>
  h.api('POST', `/api/workbooks/${target}/songs`, { cookie, body: { id, doc: toBase64(A.save(doc)) } });

const syncRaw = (songs: unknown, cookie = owner, target = workbook) =>
  h.api('POST', `/api/workbooks/${target}/sync`, { cookie, body: { songs } });

const sync = async (songs: unknown, cookie = owner) => {
  const response = await syncRaw(songs, cookie);
  expect(response.status).toBe(200);
  return ((await response.json()) as { songs: SyncEntry[] }).songs;
};

/** Überträgt den Stand eines Geräts und spielt die Antwort ein; liefert Dokument und neue Heads. */
async function syncDoc(doc: SongDocument, base: A.Heads, id = 'intro', cookie = owner) {
  const [entry] = await sync([{ id, base, changes: toBase64(A.saveSince(doc, base)) }], cookie);
  expect(entry!.status).toBe('ok');
  const next = entry!.changes ? A.loadIncremental(doc, fromBase64(entry!.changes)) : doc;
  return { doc: next, base: entry!.heads!, entry: entry! };
}

const serverSong = async (id = 'intro', cookie = owner) => {
  const [entry] = (await sync([], cookie)).filter((e) => e.id === id);
  return songOf(A.load(fromBase64(entry!.doc!)));
};

describe('Song hinzufügen', () => {
  it('nimmt ein gültiges Dokument an und liefert die Heads', async () => {
    const doc = createSongDoc(song());
    const response = await addSong(doc);
    expect(response.status).toBe(201);
    expect(((await response.json()) as { heads: string[] }).heads).toEqual(A.getHeads(doc));
    expect((await serverSong()).title).toBe('Intro');
  });

  it('weist eine bereits vergebene ID ab', async () => {
    await addSong(createSongDoc(song()));
    const response = await addSong(createSongDoc(song()));
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe('exists');
  });

  it('weist kaputte Daten und einen ungültigen Song ab', async () => {
    const kaputt = await h.api('POST', `/api/workbooks/${workbook}/songs`, { cookie: owner, body: { id: 'intro', doc: toBase64(new Uint8Array([1, 2, 3])) } });
    expect(kaputt.status).toBe(422);
    expect(await errorOf(kaputt)).toBe('invalid-song');

    const ungueltig = await addSong(createSongDoc(song('intro', { tempo: 100_000 })));
    expect(ungueltig.status).toBe(422);
    expect(await errorOf(ungueltig)).toBe('invalid-song');
  });

  it('weist ein Dokument ab, dessen ID nicht der Song-ID entspricht', async () => {
    const response = await addSong(createSongDoc(song('anders')), 'intro');
    expect(response.status).toBe(422);
    expect(await errorOf(response)).toBe('invalid-song');
  });

  it('lässt Nichtmitglieder nichts hinzufügen', async () => {
    const response = await addSong(createSongDoc(song()), 'intro', await h.login(ANNA));
    expect(response.status).toBe(404);
  });
});

describe('Song löschen', () => {
  it('hinterlässt einen Grabstein: Geräte mit dem Song erfahren es, die ID bleibt belegt', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    expect((await h.api('DELETE', `/api/workbooks/${workbook}/songs/intro`, { cookie: owner })).status).toBe(204);
    expect(await sync([{ id: 'intro', base: A.getHeads(doc) }])).toEqual([{ id: 'intro', status: 'deleted' }]);
    expect(await sync([])).toEqual([]);
    expect((await addSong(createSongDoc(song()))).status).toBe(409);
  });

  it('antwortet 404 für einen unbekannten oder bereits gelöschten Song', async () => {
    await addSong(createSongDoc(song()));
    await h.api('DELETE', `/api/workbooks/${workbook}/songs/intro`, { cookie: owner });
    expect((await h.api('DELETE', `/api/workbooks/${workbook}/songs/intro`, { cookie: owner })).status).toBe(404);
    expect((await h.api('DELETE', `/api/workbooks/${workbook}/songs/fremd`, { cookie: owner })).status).toBe(404);
  });

  it('erlaubt das Löschen eines Workbooks, dessen Songs alle gelöscht sind', async () => {
    await addSong(createSongDoc(song()));
    await h.api('DELETE', `/api/workbooks/${workbook}/songs/intro`, { cookie: owner });
    expect((await h.api('DELETE', `/api/workbooks/${workbook}`, { cookie: owner })).status).toBe(204);
  });
});

describe('Abgleich', () => {
  it('liefert einem Client, der den Song nicht nennt, das Dokument als new', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    const [entry] = await sync([]);
    expect(entry).toMatchObject({ id: 'intro', status: 'new' });
    expect(A.getHeads(A.load(fromBase64(entry!.doc!)))).toEqual(A.getHeads(doc));
  });

  it('speichert Änderungen und liefert dem Absender nichts zurück, was er selbst geschickt hat', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    const base = A.getHeads(doc);
    const changed = applySong(A.clone(doc), song('intro', { title: 'Neu', revision: 2 }));
    const { entry } = await syncDoc(changed, base);
    expect(entry.changes ?? '').toBe('');
    expect(entry.heads).toEqual(A.getHeads(changed));
    expect((await serverSong()).title).toBe('Neu');
  });

  it('liefert dem Absender genau die fremden Änderungen', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    const base = A.getHeads(doc);
    await syncDoc(applySong(A.clone(doc), song('intro', { tempo: 90, revision: 2 })), base);

    const mine = applySong(A.clone(doc), song('intro', { title: 'Neu', revision: 2 }));
    const { doc: merged, entry } = await syncDoc(mine, base);
    expect(entry.changes).toBeTruthy();
    expect(songOf(merged)).toMatchObject({ title: 'Neu', tempo: 90 });
    expect(A.getHeads(merged)).toEqual(entry.heads);
  });

  it('führt gleichzeitige Änderungen zweier Clients nach dem Abgleich beider zum selben Song', async () => {
    const start = createSongDoc(song());
    await addSong(start);
    const base = A.getHeads(start);
    let a = applySong(A.clone(start), song('intro', { title: 'Neu', revision: 2 }));
    let b = applySong(A.clone(start), song('intro', { tempo: 90, revision: 2 }));

    const first = await syncDoc(a, base);
    a = first.doc;
    const second = await syncDoc(b, base);
    b = second.doc;
    a = (await syncDoc(a, first.base)).doc;

    expect(songOf(a)).toEqual(songOf(b));
    expect(songOf(a)).toMatchObject({ title: 'Neu', tempo: 90 });
  });

  it('meldet ok ohne Änderungen, wenn nichts zu tun ist', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    const [entry] = await sync([{ id: 'intro', base: A.getHeads(doc) }]);
    expect(entry).toEqual({ id: 'intro', status: 'ok', heads: A.getHeads(doc) });
  });

  it('meldet unrelated bei leerem oder unbekanntem base mit dem Server-Dokument', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    const fremd = createSongDoc(song('intro', { title: 'Fremd' }));
    for (const base of [[], A.getHeads(fremd)]) {
      const [entry] = await sync([{ id: 'intro', base, changes: toBase64(A.save(fremd)) }]);
      expect(entry).toMatchObject({ id: 'intro', status: 'unrelated' });
      expect(songOf(A.load(fromBase64(entry!.doc!))).title).toBe('Intro');
    }
    expect((await serverSong()).title).toBe('Intro');
  });

  it('meldet einen unbekannten Song als deleted', async () => {
    expect(await sync([{ id: 'fremd', base: [] }])).toEqual([{ id: 'fremd', status: 'deleted' }]);
  });

  it('behandelt den Song eines anderen Workbooks wie unbekannt und gibt nichts davon heraus', async () => {
    const anna = await h.login(ANNA);
    const other = ((await (await h.api('POST', '/api/workbooks', { cookie: anna, body: { title: 'Anders' } })).json()) as { id: string }).id;
    const doc = createSongDoc(song());
    await addSong(doc, 'intro', anna, other);
    expect(await sync([{ id: 'intro', base: A.getHeads(doc) }])).toEqual([{ id: 'intro', status: 'deleted' }]);
  });

  it('meldet invalid bei Formatfehler und lässt den Server-Stand unverändert', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    const base = A.getHeads(doc);
    const kaputt = applySong(A.clone(doc), song('intro', { tempo: 100_000, revision: 2 }));
    const [entry] = await sync([{ id: 'intro', base, changes: toBase64(A.saveSince(kaputt, base)) }]);
    expect(entry).toMatchObject({ id: 'intro', status: 'invalid' });
    expect(A.getHeads(A.load(fromBase64(entry!.doc!)))).toEqual(base);
    expect((await serverSong()).tempo).toBe(120);
  });

  it('meldet invalid bei unlesbaren Daten und bei fehlenden Abhängigkeiten', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    const base = A.getHeads(doc);
    const [unlesbar] = await sync([{ id: 'intro', base, changes: toBase64(new Uint8Array([1, 2, 3])) }]);
    expect(unlesbar!.status).toBe('invalid');

    const zwischen = applySong(A.clone(doc), song('intro', { title: 'Zwischen', revision: 2 }));
    const zwischenHeads = A.getHeads(zwischen);
    const ende = applySong(zwischen, song('intro', { title: 'Ende', revision: 3 }));
    const [luecke] = await sync([{ id: 'intro', base, changes: toBase64(A.saveSince(ende, zwischenHeads)) }]);
    expect(luecke!.status).toBe('invalid');
    expect((await serverSong()).title).toBe('Intro');
  });

  it('weist eine Anfrage in falscher Form ab', async () => {
    for (const songs of ['nein', [{ id: 42, base: [] }], [{ id: 'a', base: 'x' }], [{ id: 'a', base: [], changes: 7 }]]) {
      const response = await syncRaw(songs);
      expect(response.status).toBe(400);
    }
  });

  it('weist Übertragungen über 2 MB ab und lässt den Song unverändert', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    const response = await syncRaw([{ id: 'intro', base: A.getHeads(doc), changes: 'A'.repeat(2 * 1024 * 1024) }]);
    expect(response.status).toBe(413);
    expect((await serverSong()).title).toBe('Intro');
  });

  it('lässt Nichtmitglieder nicht abgleichen und antwortet ohne Sitzung mit 401', async () => {
    expect((await syncRaw([], await h.login(ANNA))).status).toBe(404);
    expect((await h.api('POST', `/api/workbooks/${workbook}/sync`, { body: { songs: [] } })).status).toBe(401);
  });
});

/** Liest den Ereigniskanal mit; `events` wächst, `close` trennt. */
async function listen(cookie?: string) {
  const controller = new AbortController();
  const response = await fetch(`${h.url}/api/events`, { headers: cookie ? { Cookie: cookie } : {}, signal: controller.signal });
  const events: { event: string; data: unknown }[] = [];
  let text = '';
  if (response.ok) {
    void (async () => {
      const decoder = new TextDecoder();
      try {
        for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
          text += decoder.decode(chunk, { stream: true });
          const blocks = text.split('\n\n');
          text = blocks.pop()!;
          for (const block of blocks) {
            const event = /^event: (.*)$/m.exec(block)?.[1];
            const data = /^data: (.*)$/m.exec(block)?.[1];
            if (event) events.push({ event, data: data ? JSON.parse(data) : undefined });
          }
        }
      } catch {
        // abgebrochen
      }
    })();
  }
  return { response, events, close: () => controller.abort() };
}

const waitFor = async (condition: () => boolean) => {
  for (let i = 0; i < 100 && !condition(); i++) await new Promise((resolve) => setTimeout(resolve, 10));
  expect(condition()).toBe(true);
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('Ereigniskanal', () => {
  const invite = (email: string) => h.api('POST', `/api/workbooks/${workbook}/members`, { cookie: owner, body: { email } });

  it('antwortet ohne Sitzung mit 401', async () => {
    const { response } = await listen();
    expect(response.status).toBe(401);
  });

  it('liefert einen Datenstrom und meldet sich sofort mit einem Kommentar', async () => {
    const stream = await listen(owner);
    expect(stream.response.status).toBe(200);
    expect(stream.response.headers.get('content-type')).toContain('text/event-stream');
    stream.close();
  });

  it('meldet allen Mitgliedern das Workbook nach einem Abgleich mit Änderungen, Nichtmitgliedern nichts', async () => {
    await invite(ANNA);
    const anna = await listen(await h.login(ANNA));
    const fremd = await listen(await h.login('fremd@example.com'));
    const doc = createSongDoc(song());
    await addSong(doc);
    await waitFor(() => anna.events.length > 0);
    anna.events.length = 0;

    const base = A.getHeads(doc);
    await syncDoc(applySong(A.clone(doc), song('intro', { title: 'Neu', revision: 2 })), base);
    await waitFor(() => anna.events.length > 0);
    expect(anna.events).toEqual([{ event: 'workbook', data: { id: workbook } }]);
    expect(JSON.stringify(anna.events)).not.toContain('Neu');
    await settle();
    expect(fremd.events).toEqual([]);
    anna.close();
    fremd.close();
  });

  it('meldet nichts nach einem Abgleich ohne Änderungen', async () => {
    const doc = createSongDoc(song());
    await addSong(doc);
    const stream = await listen(owner);
    await sync([{ id: 'intro', base: A.getHeads(doc) }]);
    await settle();
    expect(stream.events).toEqual([]);
    stream.close();
  });

  it('meldet das Workbook nach Hinzufügen und Löschen eines Songs', async () => {
    const stream = await listen(owner);
    await addSong(createSongDoc(song()));
    await waitFor(() => stream.events.length === 1);
    await h.api('DELETE', `/api/workbooks/${workbook}/songs/intro`, { cookie: owner });
    await waitFor(() => stream.events.length === 2);
    expect(stream.events).toEqual([
      { event: 'workbook', data: { id: workbook } },
      { event: 'workbook', data: { id: workbook } },
    ]);
    stream.close();
  });

  it('meldet Änderungen an Workbooks auch an Entfernte', async () => {
    await invite(ANNA);
    const anna = await listen(await h.login(ANNA));
    const own = await listen(owner);
    await h.api('PATCH', `/api/workbooks/${workbook}`, { cookie: owner, body: { title: 'Band 2026' } });
    await waitFor(() => anna.events.length === 1 && own.events.length === 1);
    await h.api('DELETE', `/api/workbooks/${workbook}/members/${ANNA}`, { cookie: owner });
    await waitFor(() => anna.events.length === 2 && own.events.length === 2);
    expect(anna.events.map((e) => e.event)).toEqual(['workbooks', 'workbooks']);
    anna.close();
    own.close();
  });

  it('meldet Eingeladenen und allen Mitgliedern das Löschen eines Workbooks', async () => {
    const anna = await listen(await h.login(ANNA));
    await invite(ANNA);
    await waitFor(() => anna.events.length === 1);
    await h.api('DELETE', `/api/workbooks/${workbook}`, { cookie: owner });
    await waitFor(() => anna.events.length === 2);
    expect(anna.events.map((e) => e.event)).toEqual(['workbooks', 'workbooks']);
    anna.close();
  });

  it('meldet einem neuen Workbook seinem Besitzer auf allen Geräten', async () => {
    const stream = await listen(owner);
    await h.api('POST', '/api/workbooks', { cookie: owner, body: { title: 'Zweites' } });
    await waitFor(() => stream.events.length === 1);
    expect(stream.events[0]!.event).toBe('workbooks');
    stream.close();
  });
});

interface WorkbookEntry {
  status: string;
  doc?: string;
  changes?: string;
  heads?: string[];
}

describe('Workbook-Dokument', () => {
  const HEADS = ['a'.repeat(64)];
  const invite = (email: string) => h.api('POST', `/api/workbooks/${workbook}/members`, { cookie: owner, body: { email } });

  const syncPart = async (part: unknown, cookie = owner, target = workbook) => {
    const response = await h.api('POST', `/api/workbooks/${target}/sync`, { cookie, body: { songs: [], workbook: part } });
    expect(response.status).toBe(200);
    return ((await response.json()) as { workbook?: WorkbookEntry }).workbook;
  };

  /** Holt das Dokument wie ein Gerät, das es noch nicht hat. */
  const fetchDoc = async (cookie = owner) => {
    const entry = (await syncPart({ base: [] }, cookie))!;
    expect(entry.status).toBe('ok');
    return { doc: A.loadIncremental(A.init(), fromBase64(entry.changes!)) as WorkbookDocument, base: entry.heads! };
  };

  const push = async (doc: WorkbookDocument, base: string[], cookie = owner) => (await syncPart({ base, changes: toBase64(A.saveSince(doc, base)) }, cookie))!;

  it('legt das Dokument beim ersten Abgleich an und liefert es jedem Gerät gleich', async () => {
    const first = await fetchDoc();
    const second = await fetchDoc();
    expect(second.base).toEqual(first.base);
    expect(seenOf(first.doc, OWNER)).toBeNull();
  });

  it('nimmt eigene Einträge an und gibt sie anderen Mitgliedern weiter', async () => {
    await invite(ANNA);
    const anna = await h.login(ANNA);
    const { doc, base } = await fetchDoc();
    const entry = await push(markSeen(doc, OWNER, { intro: HEADS }), base);
    expect(entry.status).toBe('ok');
    expect(entry.changes).toBeUndefined();
    expect(seenOf((await fetchDoc(anna)).doc, OWNER)).toEqual({ intro: HEADS });
  });

  it('führt gleichzeitig gesehene Stände zweier Mitglieder zusammen', async () => {
    await invite(ANNA);
    const anna = await h.login(ANNA);
    const mine = await fetchDoc();
    const hers = await fetchDoc(anna);
    await push(markSeen(mine.doc, OWNER, { intro: HEADS }), mine.base);
    const reply = await push(markSeen(hers.doc, ANNA, { intro: HEADS }), hers.base, anna);
    expect(reply.status).toBe('ok');
    expect(reply.changes).toBeDefined();
    const { doc } = await fetchDoc();
    expect(seenOf(doc, OWNER)).toEqual({ intro: HEADS });
    expect(seenOf(doc, ANNA)).toEqual({ intro: HEADS });
  });

  it('weist die Änderung eines fremden Eintrags zurück und behält den Stand', async () => {
    await invite(ANNA);
    const anna = await h.login(ANNA);
    const mine = await fetchDoc();
    await push(markSeen(mine.doc, OWNER, { intro: HEADS }), mine.base);
    const hers = await fetchDoc(anna);
    const reply = await push(markSeen(hers.doc, OWNER, { intro: ['b'.repeat(64)] }), hers.base, anna);
    expect(reply.status).toBe('invalid');
    expect(reply.doc).toBeDefined();
    expect(seenOf((await fetchDoc()).doc, OWNER)).toEqual({ intro: HEADS });
  });

  it('weist ein Dokument in falscher Form ab', async () => {
    const { doc, base } = await fetchDoc();
    const broken = [
      A.change(A.clone(doc), (d: Record<string, unknown>) => void ((d.seen as Record<string, unknown>)[OWNER] = { intro: 'kaputt' })),
      A.change(A.clone(doc), (d: Record<string, unknown>) => void ((d.seen as Record<string, unknown>)[OWNER] = 'kaputt')),
    ];
    for (const next of broken) expect((await push(next, base)).status).toBe('invalid');
    expect(seenOf((await fetchDoc()).doc, OWNER)).toBeNull();
  });

  it('meldet unrelated bei unbekannter base mit dem Dokument des Servers', async () => {
    await fetchDoc();
    const reply = (await syncPart({ base: ['c'.repeat(64)] }))!;
    expect(reply.status).toBe('unrelated');
    expect(reply.doc).toBeDefined();
  });

  it('weist einen Teil in falscher Form ab', async () => {
    for (const part of ['nein', { base: 'x' }, { base: [], changes: 7 }]) {
      const response = await h.api('POST', `/api/workbooks/${workbook}/sync`, { cookie: owner, body: { songs: [], workbook: part } });
      expect(response.status).toBe(400);
    }
  });

  it('antwortet ohne Teil workbook wie bisher', async () => {
    const response = await syncRaw([]);
    expect(Object.keys((await response.json()) as object)).toEqual(['songs']);
  });

  it('führt kein Dokument für den eigenen Bestand', async () => {
    const list = (await (await h.api('GET', '/api/workbooks', { cookie: owner })).json()) as { workbooks: { id: string; personal?: boolean }[] };
    const personal = list.workbooks.find((w) => w.personal)!.id;
    expect(await syncPart({ base: [] }, owner, personal)).toBeUndefined();
    expect(h.db.prepare('SELECT COUNT(*) AS n FROM workbook_docs').get()).toEqual({ n: 0 });
  });

  it('lässt sich mit dem Workbook löschen und sperrt das Löschen nicht', async () => {
    await fetchDoc();
    expect((await h.api('DELETE', `/api/workbooks/${workbook}`, { cookie: owner })).status).toBe(204);
    expect(h.db.prepare('SELECT COUNT(*) AS n FROM workbook_docs').get()).toEqual({ n: 0 });
  });

  it('meldet den Mitgliedern das Workbook nach einer Änderung des Dokuments, nicht beim bloßen Abholen', async () => {
    const { doc, base } = await fetchDoc();
    const stream = await listen(owner);
    await fetchDoc();
    await settle();
    expect(stream.events).toEqual([]);
    await push(markSeen(doc, OWNER, { intro: HEADS }), base);
    await waitFor(() => stream.events.length === 1);
    expect(stream.events[0]).toEqual({ event: 'workbook', data: { id: workbook } });
    stream.close();
  });
});

describe('Spec workbook-sync › Abgleich nur mit aktueller App-Version', () => {
  beforeEach(async () => {
    await h.close();
    h = await startServer({ version: '0.9.0' });
    owner = await h.login(OWNER);
    workbook = ((await (await h.api('POST', '/api/workbooks', { cookie: owner, body: { title: 'Band' } })).json()) as { id: string }).id;
    expect((await addSong(createSongDoc(song()))).status).toBe(201);
  });

  /** Sendet eine Änderung an „Intro“ mit der Version `version` (`null`: ohne Angabe). */
  async function syncWith(version: string | null) {
    const [entry] = await sync([]);
    const doc = A.load<{ v: number }>(fromBase64(entry!.doc!));
    const changed = applySong(doc, { ...songOf(doc), title: 'Neu', revision: 2 });
    const changes = toBase64(A.saveSince(changed, A.getHeads(doc)));
    return h.api('POST', `/api/workbooks/${workbook}/sync`, { cookie: owner, version, body: { songs: [{ id: 'intro', base: A.getHeads(doc), changes }] } });
  }

  const addWith = (version: string | null) =>
    h.api('POST', `/api/workbooks/${workbook}/songs`, { cookie: owner, version, body: { id: 'outro', doc: toBase64(A.save(createSongDoc(song('outro')))) } });

  it.each([['mit älterer Version', '0.8.1'], ['ohne Versionsangabe', null], ['mit ungültiger Version', 'neu']])('Abgleich %s wird zurückgewiesen', async (_label, version) => {
    const response = await syncWith(version);
    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: string; songs?: unknown };
    expect(body.error).toBe('outdated');
    expect(body.songs).toBeUndefined();
    expect((await serverSong()).title).toBe('Intro');
  });

  it.each([['mit älterer Version', '0.8.10'], ['ohne Versionsangabe', null]])('Anlegen %s wird zurückgewiesen', async (_label, version) => {
    const response = await addWith(version);
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe('outdated');
    expect((await sync([])).map((e) => e.id)).toEqual(['intro']);
  });

  it.each([['gleicher Version', '0.9.0'], ['neuerer Version', '0.10.0']])('Abgleich und Anlegen mit %s werden angenommen', async (_label, version) => {
    expect((await syncWith(version)).status).toBe(200);
    expect((await serverSong()).title).toBe('Neu');
    expect((await addWith(version)).status).toBe(201);
  });
});
