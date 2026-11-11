import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAccountSession } from '../account/session';
import { createPattern } from '../domain/pattern';
import { appendSegment } from '../domain/structure';
import type { Song } from '../domain/types';
import { parseNotebookFile, serializeNotebook } from '../persistence/fileFormat';
import { connectStore, openRepository, type Connection, type Repository } from '../persistence/repository';
import { createNotebookStore, type NotebookStore } from '../state/notebookStore';
import { songWith } from '../test/songs';
import { startServer, type Harness } from '../../server/testHarness';
import { createSyncApi, type EventsOpener, type SyncFetch } from './api';
import { createSync, type Sync } from './sync';

const ME = 'ich@example.com';
const ANNA = 'anna@example.com';

interface Device {
  store: NotebookStore;
  repo: Repository;
  connection: Connection;
  sync: Sync;
  session: ReturnType<typeof createAccountSession>;
  dbName: string;
  setOnline(online: boolean): void;
  /** Anmeldung am Server, wie nach dem Code. */
  login(email: string): Promise<void>;
  /** Der Ablauf aus dem Konto-Menü; `false`, wenn die App nachfragen müsste. */
  logout(): Promise<boolean>;
  /** Neuer Start der App auf demselben Gerät. */
  reload(): Promise<Device>;
  requests: string[];
}

let h: Harness;
const running: Device[] = [];
const streams: (() => void)[] = [];

afterEach(async () => {
  for (const d of running.splice(0)) d.sync.stop();
  for (const stop of streams.splice(0)) stop();
  await h.close();
});

async function device({ dbName = `account-test-${crypto.randomUUID()}`, cookie: startCookie, online: startOnline = true, email: startEmail }: { dbName?: string; cookie?: string; online?: boolean; email?: string } = {}): Promise<Device> {
  let cookie = startCookie;
  let online = startOnline;
  const requests: string[] = [];
  const fetcher: SyncFetch = async (path, init = {}) => {
    if (!online) throw new TypeError('fetch failed');
    requests.push(`${init.method ?? 'GET'} ${path}`);
    return fetch(`${h.url}${path}`, { ...init, headers: { ...init.headers, ...(cookie ? { Cookie: cookie } : {}) } });
  };
  const openEvents: EventsOpener = (onEvent) => {
    let closed = false;
    void (async () => {
      const response = await fetch(`${h.url}/api/events`, { headers: { Cookie: cookie! } });
      if (!response.ok) return;
      const reader = response.body!.getReader();
      streams.push(() => {
        closed = true;
        void reader.cancel().catch(() => {});
      });
      const decoder = new TextDecoder();
      let text = '';
      try {
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) return;
          text += decoder.decode(value, { stream: true });
          const blocks = text.split('\n\n');
          text = blocks.pop()!;
          for (const block of blocks) {
            const event = /^event: (.*)$/m.exec(block)?.[1];
            const data = /^data: (.*)$/m.exec(block)?.[1];
            if (online && event) onEvent(event as 'workbook' | 'workbooks', JSON.parse(data ?? '{}'));
          }
        }
      } catch {
        // Verbindung beendet
      }
    })();
    return { close: () => (closed = true), isClosed: () => closed };
  };
  const session = createAccountSession({
    session: vi.fn(async () => null),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, ...h.signedInAs(ME) })),
    logout: vi.fn(async () => ({ ok: true as const })),
  });
  const repo = await openRepository(dbName);
  const songs = await repo.loadAll();
  const store = createNotebookStore(songs, undefined, await repo.loadSyncState());
  const connection = connectStore(store, repo, { debounceMs: 10 });
  const sync = createSync({ store, repo, connection, session, api: createSyncApi(fetcher), openEvents, pollMs: 3_600_000, debounceMs: 10 });
  if (startEmail) session.setSession(h.signedInAs(startEmail));
  const result: Device = {
    store,
    repo,
    connection,
    sync,
    session,
    dbName,
    requests,
    setOnline: (v) => void (online = v),
    async login(email) {
      cookie = await h.login(email);
      session.setSession(h.signedInAs(email));
    },
    async logout() {
      const clean = await sync.prepareLogout();
      await sync.afterLogout();
      cookie = undefined;
      session.setSession(null);
      return clean;
    },
    async reload() {
      await connection.flush();
      await repo.settled();
      sync.stop();
      repo.close();
      return device({ dbName, cookie, online, email: session.getEmail() ?? undefined });
    },
  };
  running.push(result);
  return result;
}

async function loggedIn(email = ME) {
  const d = await device();
  await d.login(email);
  await d.sync.syncAll();
  return d;
}

const songNamed = (d: Device, title: string) => d.store.getState().songs.find((s) => s.title === title)!;
const titles = (d: Device) => d.store.getState().songs.map((s) => s.title).sort();
const personal = (d: Device) => d.store.getState().workbooks.find((w) => w.personal)!;
/** Songs in „Meine Songs“. */
const mine = (d: Device) => {
  const { songs, placement } = d.store.getState();
  return songs.filter((s) => !placement[s.id] || placement[s.id] === personal(d)?.id).map((s) => s.title).sort();
};
const inAccount = (d: Device, title: string) => d.store.getState().placement[songNamed(d, title).id] === personal(d).id;
const inWorkbook = (d: Device, id: string) => d.store.getState().songs.filter((s) => d.store.getState().placement[s.id] === id).map((s) => s.title).sort();
const notices = (d: Device) => d.sync.getNotices().map((n) => n.text);
const eventually = (assertion: () => void | Promise<void>) => vi.waitFor(assertion, { timeout: 5000, interval: 20 });
const edit = (d: Device, title: string, change: Parameters<NotebookStore['updateSong']>[0]) => {
  d.store.openSong(songNamed(d, title).id);
  d.store.updateSong(change);
  d.store.backToList();
};
/** Fassung wie aus einer Exportdatei: gleiche Daten, aber in der Feldreihenfolge des Dateiformats. */
const viaFile = (songs: Song[]) => {
  const parsed = parseNotebookFile(serializeNotebook(songs, new Date()));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.songs;
};
const start = async () => void (h = await startServer());

describe('Spec account-songs › Eigene Songs im Account', () => {
  it('Zweites Gerät', async () => {
    await start();
    const first = await loggedIn();
    first.store.createSong('Skizze');
    edit(first, 'Skizze', (s) => appendSegment(s, { name: 'Intro', bars: 4 }));
    await first.sync.syncAll();

    const second = await loggedIn();
    expect(mine(second)).toEqual(['Skizze']);
    expect(songNamed(second, 'Skizze').id).toBe(songNamed(first, 'Skizze').id);
    expect(songNamed(second, 'Skizze').segments).toEqual(songNamed(first, 'Skizze').segments);
  });

  it('Beispiel-Song angemeldet angelegt (song-library)', async () => {
    await start();
    const first = await loggedIn();
    const example = first.store.createExampleSong();
    await first.sync.syncAll();
    expect(inAccount(first, 'Beispiel-Song')).toBe(true);

    const second = await loggedIn();
    expect(mine(second)).toEqual(['Beispiel-Song']);
    expect(songNamed(second, 'Beispiel-Song')).toMatchObject({ id: example.id, patterns: example.patterns, segments: example.segments });
  });

  it('Neuer Song auf einem Gerät: über das Ereignis', async () => {
    await start();
    const first = await loggedIn();
    const second = await loggedIn();
    first.sync.start();
    second.sync.start();
    first.store.createSong('Neu');
    await eventually(() => expect(mine(second)).toEqual(['Neu']));
    expect(inAccount(first, 'Neu')).toBe(true);
  });

  it('Eine Änderung erreicht das andere Gerät', async () => {
    await start();
    const first = await loggedIn();
    first.store.createSong('Skizze');
    await first.sync.syncAll();
    const second = await loggedIn();
    first.sync.start();
    second.sync.start();
    edit(first, 'Skizze', (s) => appendSegment(s, { name: 'A', bars: 1 }));
    await eventually(() => expect(songNamed(second, 'Skizze').segments).toHaveLength(1));
  });

  it('Song gelöscht', async () => {
    await start();
    const first = await loggedIn();
    first.store.createSong('Skizze');
    await first.sync.syncAll();
    const second = await loggedIn();
    first.sync.start();
    second.sync.start();
    expect(await first.sync.deleteSong(songNamed(first, 'Skizze').id)).toEqual({ ok: true });
    expect(titles(first)).toEqual([]);
    await eventually(() => expect(titles(second)).toEqual([]));
  });

  it('Gleichzeitige Änderungen werden zusammengeführt', async () => {
    await start();
    const first = await loggedIn();
    first.store.createSong('Skizze');
    await first.sync.syncAll();
    const second = await loggedIn();
    first.setOnline(false);
    second.setOnline(false);
    edit(first, 'Skizze', (s) => ({ ...s, tempo: 90 }));
    edit(second, 'Skizze', (s) => appendSegment(s, { name: 'A', bars: 1 }));
    first.setOnline(true);
    second.setOnline(true);
    await first.sync.syncAll();
    await second.sync.syncAll();
    await first.sync.syncAll();
    for (const d of [first, second]) expect(songNamed(d, 'Skizze')).toMatchObject({ tempo: 90, segments: [{ name: 'A' }] });
  });
});

describe('Spec account-songs › Übernahme beim Anmelden', () => {
  it('Erste Anmeldung mit lokalen Songs', async () => {
    await start();
    const d = await device();
    const skizze = d.store.createSong('Skizze');
    d.store.createSong('Intro');
    await d.login(ME);
    await d.sync.syncAll();
    expect(mine(d)).toEqual(['Intro', 'Skizze']);
    expect(inAccount(d, 'Skizze') && inAccount(d, 'Intro')).toBe(true);
    expect(songNamed(d, 'Skizze').id).toBe(skizze.id);
    expect(notices(d)).toEqual(['2 Songs wurden in deinen Account übernommen.']);
  });

  it('Der Hinweis kommt einmal und nur für den Bestand bei der Anmeldung', async () => {
    await start();
    const d = await device();
    d.store.createSong('Skizze');
    await d.login(ME);
    await d.sync.syncAll();
    expect(notices(d)).toEqual(['1 Song wurde in deinen Account übernommen.']);
    d.store.createSong('Später');
    await d.sync.syncAll();
    expect(inAccount(d, 'Später')).toBe(true);
    expect(notices(d)).toHaveLength(1);
  });

  it('Ohne lokale Songs kein Hinweis', async () => {
    await start();
    expect(notices(await loggedIn())).toEqual([]);
  });

  it('Bestand zweier Geräte', async () => {
    await start();
    const first = await device();
    const second = await device();
    first.store.createSong('A');
    second.store.createSong('B');
    await first.login(ME);
    await first.sync.syncAll();
    await second.login(ME);
    await second.sync.syncAll();
    await first.sync.syncAll();
    expect(mine(first)).toEqual(['A', 'B']);
    expect(mine(second)).toEqual(['A', 'B']);
  });
});

describe('Spec account-songs › Fassungen beim Anmelden', () => {
  const songWithContent = () => {
    const patterns = [createPattern([], { kind: 'groove', name: 'Verse' })];
    return appendSegment(songWith({ title: 'Intro', patterns }), { name: 'A', bars: 2 });
  };

  it('Dieselbe Datei auf zwei Geräten', async () => {
    await start();
    const file = viaFile([songWithContent()]);
    const first = await device();
    const second = await device();
    first.store.importSongs(file);
    second.store.importSongs(file);
    await first.login(ME);
    await first.sync.syncAll();
    await second.login(ME);
    await second.sync.syncAll();
    expect(mine(first)).toEqual(['Intro']);
    expect(mine(second)).toEqual(['Intro']);
    expect(inAccount(second, 'Intro')).toBe(true);
  });

  it('Abweichende Fassung', async () => {
    await start();
    const song = songWithContent();
    const first = await device();
    first.store.importSongs([song]);
    await first.login(ME);
    await first.sync.syncAll();

    const second = await device();
    second.store.importSongs([{ ...song, tempo: 77, revision: 9 }]);
    await second.login(ME);
    await second.sync.syncAll();
    expect(mine(second)).toEqual(['Intro', 'Intro (Kopie)']);
    expect(songNamed(second, 'Intro').tempo).toBe(song.tempo);
    const copy = songNamed(second, 'Intro (Kopie)');
    expect(copy.tempo).toBe(77);
    expect(copy.id).not.toBe(song.id);
    expect(inAccount(second, 'Intro (Kopie)')).toBe(true);

    await first.sync.syncAll();
    expect(mine(first)).toEqual(['Intro', 'Intro (Kopie)']);
  });

  it('Im Account gelöschter Song', async () => {
    await start();
    const song = songWithContent();
    const first = await device();
    first.store.importSongs([song]);
    await first.login(ME);
    await first.sync.syncAll();
    await first.sync.deleteSong(song.id);
    await first.sync.syncAll();

    const second = await device();
    second.store.importSongs([{ ...song, revision: 9 }]);
    await second.login(ME);
    await second.sync.syncAll();
    expect(mine(second)).toEqual(['Intro (Kopie)']);
    expect(songNamed(second, 'Intro (Kopie)').id).not.toBe(song.id);
    expect(inAccount(second, 'Intro (Kopie)')).toBe(true);
  });

  it('Inhaltsgleich in einem Workbook: keine Kopie', async () => {
    await start();
    const song = songWithContent();
    const me = await device();
    me.store.importSongs([song]);
    await me.login(ME);
    await me.sync.syncAll();
    await me.sync.createWorkbook('Band');
    const band = me.store.getState().workbooks.find((w) => w.title === 'Band')!.id;
    await me.sync.moveSong(song.id, band);
    await me.sync.invite(band, ANNA);

    const anna = await device();
    anna.store.importSongs(viaFile([song]));
    await anna.login(ANNA);
    await anna.sync.syncAll();
    expect(inWorkbook(anna, band)).toEqual(['Intro']);
    expect(mine(anna)).toEqual([]);
  });
});

describe('Spec workbooks › Workbook anlegen (Client, song-overview-tiles D4)', () => {
  it('Anlegen liefert die IDs von Workbook und Song', async () => {
    await start();
    const me = await loggedIn();
    const created = await me.sync.createWorkbook('');
    const band = me.store.getState().workbooks.find((w) => w.title === 'Neues Workbook')!;
    expect(created).toEqual({ ok: true, id: band.id });
    const song = await me.sync.createSongIn(band.id);
    expect(song).toEqual({ ok: true, id: me.store.getState().songs.find((s) => me.store.getState().placement[s.id] === band.id)!.id });
  });
});

describe('Spec account-songs › Eigene Songs ohne Verbindung', () => {
  it('Anlegen ohne Verbindung', async () => {
    await start();
    const first = await loggedIn();
    const second = await loggedIn();
    first.setOnline(false);
    first.store.createSong('Offline');
    expect(await first.sync.syncAll()).toBe(false);
    expect(mine(first)).toEqual(['Offline']);
    first.setOnline(true);
    await first.sync.syncAll();
    await second.sync.syncAll();
    expect(mine(second)).toEqual(['Offline']);
  });

  it('Löschen ohne Verbindung, auch über ein Neuladen hinweg', async () => {
    await start();
    const first = await loggedIn();
    const { id } = first.store.createSong('Skizze');
    await first.sync.syncAll();
    const second = await loggedIn();
    expect(mine(second)).toEqual(['Skizze']);

    first.setOnline(false);
    expect(await first.sync.deleteSong(id)).toEqual({ ok: true });
    expect(titles(first)).toEqual([]);

    const reloaded = await first.reload();
    expect(titles(reloaded)).toEqual([]);
    expect(reloaded.repo.hasUnsent()).toBe(true);
    reloaded.setOnline(true);
    await reloaded.sync.syncAll();
    expect(titles(reloaded)).toEqual([]);
    expect(reloaded.repo.hasUnsent()).toBe(false);
    await second.sync.syncAll();
    expect(titles(second)).toEqual([]);
  });

  it('Eine laufende Anfrage bringt einen vorgemerkt gelöschten Song nicht zurück', async () => {
    await start();
    const first = await loggedIn();
    first.store.createSong('Skizze');
    await first.sync.syncAll();
    const second = await loggedIn();
    second.setOnline(false);
    await second.sync.deleteSong(songNamed(second, 'Skizze').id);
    second.setOnline(true);
    const running1 = second.sync.syncAll();
    const running2 = second.sync.syncAll();
    await Promise.all([running1, running2]);
    expect(titles(second)).toEqual([]);
  });
});

describe('Spec account-songs › Eigene Songs beim Abmelden', () => {
  it('Abmelden und wieder anmelden', async () => {
    await start();
    const d = await loggedIn();
    d.store.createSong('Skizze');
    expect(await d.logout()).toBe(true);
    expect(titles(d)).toEqual([]);
    expect(d.store.getState().workbooks).toEqual([]);

    const reloaded = await d.reload();
    expect(titles(reloaded)).toEqual([]);
    await reloaded.login(ME);
    await reloaded.sync.syncAll();
    expect(mine(reloaded)).toEqual(['Skizze']);
    expect(notices(reloaded)).toEqual([]);
  });

  it('Nicht übertragene Änderung an einem Song im Account: Die App muss nachfragen', async () => {
    await start();
    const d = await loggedIn();
    const { id } = d.store.createSong('Skizze');
    await d.sync.syncAll();
    d.setOnline(false);
    d.store.renameSong(id, 'Offline');
    expect(await d.sync.prepareLogout()).toBe(false);
    expect(mine(d)).toEqual(['Offline']);
  });

  it('Nie übertragener Song: bleibt lokal, ohne Nachfrage', async () => {
    await start();
    const d = await loggedIn();
    d.store.importSongs([songWith({ title: 'Kaputt', tempo: 100_000 })]);
    expect(await d.logout()).toBe(true);
    expect(mine(d)).toEqual(['Kaputt']);
    const reloaded = await d.reload();
    expect(titles(reloaded)).toEqual(['Kaputt']);
  });

  it('Noch nicht hochgeladener Song ohne Verbindung: bleibt lokal, ohne Nachfrage', async () => {
    await start();
    const d = await loggedIn();
    d.setOnline(false);
    d.store.createSong('Offline');
    expect(await d.sync.prepareLogout()).toBe(true);
  });

  it('Anderer Account auf demselben Gerät', async () => {
    await start();
    const d = await loggedIn();
    d.store.createSong('Meins');
    await d.logout();
    await d.login(ANNA);
    await d.sync.syncAll();
    expect(titles(d)).toEqual([]);
  });
});

describe('Spec account-songs › Eigene Songs ohne Anmeldung', () => {
  it('Abgemeldet anlegen', async () => {
    await start();
    const d = await device();
    d.sync.start();
    d.store.createSong('Skizze');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(await d.sync.syncAll()).toBe(false);
    expect(mine(d)).toEqual(['Skizze']);
    expect(d.requests).toEqual([]);
    expect(h.db.prepare('SELECT COUNT(*) AS n FROM songs').get()).toEqual({ n: 0 });
  });
});

describe('Spec account-songs › Eigenen Song in ein Workbook verschieben', () => {
  async function withBand() {
    await start();
    const first = await loggedIn();
    const { id } = first.store.createSong('Skizze');
    await first.sync.syncAll();
    const second = await loggedIn();
    await first.sync.createWorkbook('Band');
    const band = first.store.getState().workbooks.find((w) => w.title === 'Band')!.id;
    await first.sync.invite(band, ANNA);
    const anna = await loggedIn(ANNA);
    return { first, second, anna, band, id };
  }

  it('Verschieben behält die ID und erreicht die Mitglieder', async () => {
    const { first, anna, band, id } = await withBand();
    expect(await first.sync.moveSong(id, band)).toEqual({ ok: true });
    expect(inWorkbook(first, band)).toEqual(['Skizze']);
    expect(mine(first)).toEqual([]);
    await anna.sync.syncAll();
    expect(inWorkbook(anna, band)).toEqual(['Skizze']);
    expect(songNamed(anna, 'Skizze').id).toBe(id);
  });

  it('Noch nicht hochgeladener Song', async () => {
    const { first, anna, band } = await withBand();
    const { id } = first.store.createSong('Neu');
    expect(await first.sync.moveSong(id, band)).toEqual({ ok: true });
    await anna.sync.syncAll();
    expect(inWorkbook(anna, band)).toEqual(['Neu']);
  });

  it('Zweites Gerät mit offenen Änderungen', async () => {
    const { first, second, anna, band, id } = await withBand();
    second.setOnline(false);
    second.store.renameSong(id, 'Offline');
    await second.connection.flush();
    await first.sync.moveSong(id, band);

    second.setOnline(true);
    await second.sync.syncAll();
    expect(inWorkbook(second, band)).toEqual(['Offline']);
    expect(mine(second)).toEqual([]);
    await anna.sync.syncAll();
    expect(inWorkbook(anna, band)).toEqual(['Offline']);
  });

  it('Abgleich nur des Ziels: keine Kopie, offene Änderungen kommen an', async () => {
    const { first, second, anna, band, id } = await withBand();
    await second.sync.syncAll();
    second.setOnline(false);
    second.store.renameSong(id, 'Offline');
    await second.connection.flush();
    await first.sync.moveSong(id, band);

    // Der Ereigniskanal steht, das Gerät hört aber erst das Ereignis für „Band“, nicht das für den eigenen Bestand
    second.sync.start();
    await new Promise((resolve) => setTimeout(resolve, 50));
    second.setOnline(true);
    edit(first, 'Skizze', (s) => ({ ...s, tempo: 90 }));
    await first.sync.syncAll();

    await eventually(() => expect(inWorkbook(second, band)).toEqual(['Offline']));
    expect(mine(second)).toEqual([]);
    await eventually(() => expect(songNamed(second, 'Offline').tempo).toBe(90));
    await eventually(async () => {
      await anna.sync.syncAll();
      expect(inWorkbook(anna, band)).toEqual(['Offline']);
    });
  });

  it('Das Ziel ist dem Gerät noch unbekannt', async () => {
    await start();
    const first = await loggedIn();
    const { id } = first.store.createSong('Skizze');
    await first.sync.syncAll();
    const second = await loggedIn();
    await first.sync.createWorkbook('Band');
    const band = first.store.getState().workbooks.find((w) => w.title === 'Band')!.id;
    await first.sync.moveSong(id, band);
    await second.sync.syncAll();
    expect(inWorkbook(second, band)).toEqual(['Skizze']);
    expect(mine(second)).toEqual([]);
  });

  it('Austritt: Die Kopien gehören zum Account', async () => {
    const { first, band, id } = await withBand();
    await first.sync.moveSong(id, band);
    const anna = await loggedIn(ANNA);
    await anna.sync.removeMember(band, ANNA);
    await anna.sync.syncAll();
    expect(mine(anna)).toEqual(['Skizze (aus Band)']);
    expect(inAccount(anna, 'Skizze (aus Band)')).toBe(true);
  });
});

describe('account-songs › Nicht übertragbare Songs (design.md D3)', () => {
  it('Die App meldet das einmal, der Song bleibt und erreicht kein anderes Gerät', async () => {
    await start();
    const d = await loggedIn();
    d.store.importSongs([songWith({ title: 'Kaputt', tempo: 100_000 })]);
    await d.sync.syncAll();
    await d.sync.syncAll();
    expect(notices(d)).toEqual(['„Kaputt“ konnte nicht in deinen Account übernommen werden und bleibt nur auf diesem Gerät.']);
    expect(mine(d)).toEqual(['Kaputt']);
    expect(mine(await loggedIn())).toEqual([]);
  });

  it('Nach einer Korrektur geht der Song hinaus', async () => {
    await start();
    const d = await loggedIn();
    d.store.importSongs([songWith({ title: 'Kaputt', tempo: 100_000 })]);
    await d.sync.syncAll();
    edit(d, 'Kaputt', (s) => ({ ...s, tempo: 100 }));
    await d.sync.syncAll();
    expect(inAccount(d, 'Kaputt')).toBe(true);
  });
});

describe('account-songs › Anderes Konto nach abgelaufener Sitzung (design.md D9)', () => {
  it('Eigene Songs wandern mit neuen IDs in den neuen Account, ohne Hinweis zur Mitgliedschaft', async () => {
    await start();
    const d = await loggedIn();
    const { id } = d.store.createSong('Skizze');
    await d.sync.syncAll();
    h.db.prepare('DELETE FROM sessions').run();
    await d.sync.syncAll();
    expect(d.session.getEmail()).toBeNull();
    expect(mine(d)).toEqual(['Skizze']);

    await d.login(ANNA);
    await d.sync.syncAll();
    expect(mine(d)).toEqual(['Skizze']);
    expect(inAccount(d, 'Skizze')).toBe(true);
    expect(songNamed(d, 'Skizze').id).not.toBe(id);
    expect(notices(d)).toEqual(['1 Song wurde in deinen Account übernommen.']);
  });

  it('Vorgemerktes Löschen des alten Accounts blockiert das Abmelden nicht', async () => {
    await start();
    const d = await loggedIn();
    const { id } = d.store.createSong('Skizze');
    await d.sync.syncAll();
    d.setOnline(false);
    await d.sync.deleteSong(id);
    d.setOnline(true);
    h.db.prepare('DELETE FROM sessions').run();
    await d.sync.syncAll();
    await d.login(ANNA);
    expect(await d.sync.prepareLogout()).toBe(true);
  });
});
