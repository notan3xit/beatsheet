import * as A from '@automerge/automerge/slim';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appendSegment } from '../domain/structure';
import type { Workbook } from '../domain/types';
import { setTempo } from '../domain/playback';
import { createAccountSession } from '../account/session';
import type { AccountApi } from '../account/api';
import { connectStore, openRepository, type Connection, type Repository } from '../persistence/repository';
import { createNotebookStore, type NotebookStore } from '../state/notebookStore';
import { songWith } from '../test/songs';
import { startServer, type Harness } from '../../server/testHarness';
import { createSyncApi, type EventsOpener, type SyncFetch } from './api';
import { createSync, type Sync } from './sync';

const OWNER = 'ich@example.com';
const ANNA = 'anna@example.com';

interface Device {
  store: NotebookStore;
  repo: Repository;
  connection: Connection;
  sync: Sync;
  /** Trennt das Gerät vom Netz oder verbindet es wieder. */
  setOnline(online: boolean): void;
  /** Laufende und höchstzeitig gleichzeitige Sync-Anfragen. */
  concurrency: { current: Map<string, number>; max: number };
  dbName: string;
  session: ReturnType<typeof createAccountSession>;
}

let h: Harness;
const devices: Device[] = [];
const streams: (() => void)[] = [];

afterEach(async () => {
  for (const device of devices.splice(0)) device.sync.stop();
  for (const stop of streams.splice(0)) stop();
  await h?.close();
});

const unreachable = () => new TypeError('fetch failed');

/** Ein Gerät mit eigener Datenbank und Sitzung gegen den echten Server. */
async function device(email: string, { live = true, dbName = `sync-test-${crypto.randomUUID()}`, cookie }: { live?: boolean; dbName?: string; cookie?: string } = {}): Promise<Device> {
  const sessionCookie = cookie ?? (await h.login(email));
  const concurrency = { current: new Map<string, number>(), max: 0 };
  let online = true;
  const fetcher: SyncFetch = async (path, init = {}) => {
    if (!online) throw unreachable();
    const isSync = path.endsWith('/sync');
    if (isSync) {
      concurrency.current.set(path, (concurrency.current.get(path) ?? 0) + 1);
      concurrency.max = Math.max(concurrency.max, concurrency.current.get(path)!);
    }
    try {
      return await fetch(`${h.url}${path}`, { ...init, headers: { ...init.headers, Cookie: sessionCookie } });
    } finally {
      if (isSync) concurrency.current.set(path, concurrency.current.get(path)! - 1);
    }
  };

  /** Echter Ereigniskanal, über fetch gelesen: jsdom hat kein EventSource. */
  const openEvents: EventsOpener = (onEvent) => {
    let closed = false;
    void (async () => {
      const response = await fetch(`${h.url}/api/events`, { headers: { Cookie: sessionCookie } });
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

  const api: AccountApi = {
    session: vi.fn(async () => (online ? email : null)),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, email })),
    logout: vi.fn(async () => ({ ok: true as const })),
  };
  const session = createAccountSession(api);
  const repo = await openRepository(dbName);
  const songs = await repo.loadAll();
  const store = createNotebookStore(songs, undefined, await repo.loadSyncState());
  const connection = connectStore(store, repo, { debounceMs: 10 });
  const sync = createSync({
    store,
    repo,
    connection,
    session,
    api: createSyncApi(fetcher),
    openEvents: live ? openEvents : () => ({ close: () => {}, isClosed: () => false }),
    pollMs: 3_600_000,
    debounceMs: 10,
  });
  session.setEmail(email);
  const result: Device = { store, repo, connection, sync, setOnline: (v) => void (online = v), concurrency, dbName, session };
  devices.push(result);
  return result;
}

const titles = (d: Device) => d.store.getState().songs.map((s) => s.title).sort();
const songNamed = (d: Device, title: string) => d.store.getState().songs.find((s) => s.title === title)!;
const workbookNamed = (d: Device, title: string) => d.store.getState().workbooks.find((w) => w.title === title)!;
const inWorkbook = (d: Device, workbook: string) =>
  d.store.getState().songs.filter((s) => d.store.getState().placement[s.id] === workbook).map((s) => s.title).sort();
/** Songs in „Meine Songs“: ohne Zugehörigkeit oder im eigenen Bestand. */
const local = (d: Device) => {
  const { songs, placement, workbooks } = d.store.getState();
  const personal = workbooks.find((w) => w.personal)?.id;
  return songs.filter((s) => !placement[s.id] || placement[s.id] === personal).map((s) => s.title).sort();
};
const shared = (workbooks: Workbook[]) => workbooks.filter((w) => !w.personal);

const eventually = (assertion: () => void, timeout = 5000) => vi.waitFor(assertion, { timeout, interval: 20 });

/** Zwei Mitglieder von „Band“, beide nach dem ersten Abgleich; nur mit `live` über den Ereigniskanal. */
async function band({ live = false } = {}) {
  h = await startServer();
  const me = await device(OWNER, { live });
  await me.sync.syncAll();
  expect(await me.sync.createWorkbook('Band')).toMatchObject({ ok: true });
  const workbook = workbookNamed(me, 'Band').id;
  expect(await me.sync.invite(workbook, ANNA)).toEqual({ ok: true });
  const anna = await device(ANNA, { live });
  await anna.sync.syncAll();
  return { me, anna, workbook };
}

/** „Intro“ liegt in „Band“ auf beiden Geräten. */
async function bandWithIntro(options = {}) {
  const ctx = await band(options);
  const intro = ctx.me.store.createSong('Intro');
  expect(await ctx.me.sync.moveSong(intro.id, ctx.workbook)).toEqual({ ok: true });
  await ctx.anna.sync.syncAll();
  expect(inWorkbook(ctx.anna, ctx.workbook)).toEqual(['Intro']);
  return { ...ctx, intro };
}

const edit = (d: Device, title: string, change: Parameters<NotebookStore['updateSong']>[0]) => {
  d.store.openSong(songNamed(d, title).id);
  d.store.updateSong(change);
  d.store.backToList();
};

describe('Spec workbook-sync › Song in ein Workbook verschieben', () => {
  it('Verschieben', async () => {
    const { me, anna, workbook } = await band();
    const uprising = me.store.createSong('Uprising');
    edit(me, 'Uprising', (s) => appendSegment(s, { name: 'Intro', bars: 4 }));
    expect(await me.sync.moveSong(uprising.id, workbook)).toEqual({ ok: true });
    expect(inWorkbook(me, workbook)).toEqual(['Uprising']);
    expect(local(me)).toEqual([]);
    expect(me.store.getState().songs[0]!.id).toBe(uprising.id);

    await anna.sync.syncAll();
    expect(inWorkbook(anna, workbook)).toEqual(['Uprising']);
    expect(anna.store.getState().songs[0]!.id).toBe(uprising.id);
    expect(anna.store.getState().songs[0]!.segments).toEqual(me.store.getState().songs[0]!.segments);
  });

  it('Server nicht erreichbar', async () => {
    const { me, workbook } = await band();
    const uprising = me.store.createSong('Uprising');
    me.setOnline(false);
    expect(await me.sync.moveSong(uprising.id, workbook)).toEqual({ ok: false, error: 'unreachable' });
    expect(local(me)).toEqual(['Uprising']);
  });

  it('Eine Änderung während des Verschiebens geht beim nächsten Abgleich hinaus', async () => {
    const { me, anna, workbook } = await band();
    const uprising = me.store.createSong('Uprising');
    const moving = me.sync.moveSong(uprising.id, workbook);
    await Promise.resolve();
    me.store.renameSong(uprising.id, 'Uprising 2');
    await moving;
    await me.connection.flush();
    await me.sync.syncAll();
    await anna.sync.syncAll();
    expect(inWorkbook(anna, workbook)).toEqual(['Uprising 2']);
  });
});

describe('Spec workbook-sync › Song in einem Workbook anlegen', () => {
  it('Anlegen in der Karte', async () => {
    const { me, anna, workbook } = await band();
    expect(await me.sync.createSongIn(workbook)).toMatchObject({ ok: true });
    expect(inWorkbook(me, workbook)).toEqual(['Neuer Song']);
    await anna.sync.syncAll();
    expect(inWorkbook(anna, workbook)).toEqual(['Neuer Song']);
  });

  it('Server nicht erreichbar: kein Song', async () => {
    const { me, workbook } = await band();
    me.setOnline(false);
    expect(await me.sync.createSongIn(workbook)).toEqual({ ok: false, error: 'unreachable' });
    expect(titles(me)).toEqual([]);
    expect(me.store.getState().placement).toEqual({});
  });
});

describe('Spec workbook-sync › Workbook-Song löschen', () => {
  it('Löschen für alle', async () => {
    const { me, anna, intro } = await bandWithIntro();
    expect(await me.sync.deleteSong(intro.id)).toEqual({ ok: true });
    expect(titles(me)).toEqual([]);
    await anna.sync.syncAll();
    expect(titles(anna)).toEqual([]);
  });

  it('Server nicht erreichbar: Der Song bleibt, damit er nicht wieder auftaucht', async () => {
    const { me, intro } = await bandWithIntro();
    me.setOnline(false);
    expect(await me.sync.deleteSong(intro.id)).toEqual({ ok: false, error: 'unreachable' });
    expect(titles(me)).toEqual(['Intro']);
  });

  it('Offline geändert, inzwischen gelöscht', async () => {
    const { me, anna, intro } = await bandWithIntro();
    anna.setOnline(false);
    anna.store.renameSong(intro.id, 'Offline');
    await anna.connection.flush();
    await me.sync.deleteSong(intro.id);
    anna.setOnline(true);
    await anna.sync.syncAll();
    expect(titles(anna)).toEqual([]);
  });
});

describe('Spec workbook-sync › Änderungen abgleichen', () => {
  it('Zwei Geräte: über das Ereignis, ohne regelmäßigen Abgleich', async () => {
    h = await startServer();
    const cookie = await h.login(OWNER);
    const first = await device(OWNER, { cookie });
    const second = await device(OWNER, { cookie });
    first.sync.start();
    second.sync.start();
    await first.sync.createWorkbook('Band');
    const workbook = workbookNamed(first, 'Band').id;
    await eventually(() => expect(workbookNamed(second, 'Band')).toBeDefined());
    const intro = first.store.createSong('Intro');
    await first.sync.moveSong(intro.id, workbook);
    await eventually(() => expect(titles(second)).toEqual(['Intro']));

    edit(first, 'Intro', (s) => appendSegment(s, { name: 'A', bars: 1 }));
    await eventually(() => expect(second.store.getState().songs[0]!.segments).toHaveLength(1));
  });

  it('Neuer Song eines anderen Mitglieds', async () => {
    const { me, anna, workbook } = await band({ live: true });
    me.sync.start();
    anna.sync.start();
    await anna.sync.createSongIn(workbook);
    await eventually(() => expect(inWorkbook(me, workbook)).toEqual(['Neuer Song']));
  });

  it('Fremde Änderungen erhöhen die Revision nicht und lassen die Ansicht stehen', async () => {
    const { me, anna, intro } = await bandWithIntro();
    anna.store.openSong(intro.id);
    edit(me, 'Intro', (s) => setTempo(s, 90));
    await me.connection.flush();
    await me.sync.syncAll();
    anna.store.openSong(intro.id);
    const revisionOnMe = me.store.getState().songs[0]!.revision;
    await anna.sync.syncAll();
    expect(anna.store.getState().view).toEqual({ kind: 'book' });
    expect(anna.store.getState().songs[0]).toMatchObject({ tempo: 90, revision: revisionOnMe });
  });

  it('Ein Abgleich ohne Änderungen ersetzt den Song im Store nicht', async () => {
    const { anna } = await bandWithIntro();
    const before = anna.store.getState().songs[0];
    await anna.sync.syncAll();
    expect(anna.store.getState().songs[0]).toBe(before);
  });
});

describe('Spec workbook-sync › Offline arbeiten', () => {
  it('Gleichzeitig offline', async () => {
    const { me, anna } = await bandWithIntro();
    me.setOnline(false);
    anna.setOnline(false);
    edit(me, 'Intro', (s) => setTempo(s, 90));
    edit(anna, 'Intro', (s) => appendSegment(s, { name: 'A', bars: 1 }));
    await me.connection.flush();
    await anna.connection.flush();
    me.setOnline(true);
    anna.setOnline(true);
    await me.sync.syncAll();
    await anna.sync.syncAll();
    await me.sync.syncAll();
    for (const d of [me, anna]) {
      expect(d.store.getState().songs[0]!.tempo).toBe(90);
      expect(d.store.getState().songs[0]!.segments).toHaveLength(1);
    }
  });

  it('Neuladen ohne Server', async () => {
    const { me, workbook } = await bandWithIntro();
    await me.connection.flush();
    await me.repo.settled();
    await vi.waitFor(async () => expect(shared((await me.repo.loadSyncState()).workbooks)).toHaveLength(1));
    me.sync.stop();
    me.repo.close();

    const repo = await openRepository(me.dbName);
    const store = createNotebookStore(await repo.loadAll(), undefined, await repo.loadSyncState());
    expect(shared(store.getState().workbooks).map((w) => w.title)).toEqual(['Band']);
    expect(store.getState().placement[store.getState().songs[0]!.id]).toBe(workbook);
    repo.close();
  });

  it('Offline geänderter Song überlebt Neuladen und bleibt als noch nicht übertragen bekannt', async () => {
    const { me, intro } = await bandWithIntro();
    me.setOnline(false);
    me.store.renameSong(intro.id, 'Offline');
    await me.connection.flush();
    me.sync.stop();
    me.repo.close();

    const repo = await openRepository(me.dbName);
    expect((await repo.loadAll()).map((s) => s.title)).toEqual(['Offline']);
    expect(repo.hasUnsent()).toBe(true);
    repo.close();
  });
});

describe('Spec workbook-sync › Hinweis ohne Verbindung', () => {
  it('erscheint bei nicht erreichbarem Server und verschwindet danach', async () => {
    const { me } = await bandWithIntro();
    expect(me.sync.isOffline()).toBe(false);
    me.setOnline(false);
    const listener = vi.fn();
    me.sync.subscribe(listener);
    await me.sync.syncAll();
    expect(me.sync.isOffline()).toBe(true);
    expect(listener).toHaveBeenCalled();
    me.setOnline(true);
    await me.sync.syncAll();
    expect(me.sync.isOffline()).toBe(false);
  });

  it('erscheint beim Browser-Ereignis offline', async () => {
    const { me } = await bandWithIntro();
    me.sync.start();
    window.dispatchEvent(new Event('offline'));
    expect(me.sync.isOffline()).toBe(true);
  });

  it('Eine fehlgeschlagene Aktion setzt den Status', async () => {
    const { me, workbook } = await band();
    const song = me.store.createSong('Neu');
    me.setOnline(false);
    await me.sync.moveSong(song.id, workbook);
    expect(me.sync.isOffline()).toBe(true);
  });

  it('Ein fachlicher Fehler setzt den Status nicht', async () => {
    const { me, workbook } = await band();
    await me.sync.invite(workbook, 'keine-adresse');
    expect(me.sync.isOffline()).toBe(false);
  });

  it('Ohne Sitzung, aber mit bekannten Workbooks: Der Auslöser erkennt den fehlenden Server', async () => {
    const { me } = await bandWithIntro();
    me.sync.start();
    me.session.setEmail(null);
    me.setOnline(false);
    window.dispatchEvent(new Event('online'));
    await eventually(() => expect(me.sync.isOffline()).toBe(true));
  });
});

describe('Spec workbook-sync › Unabhängig entstandene Fassung', () => {
  it('Import vor dem Abgleich', async () => {
    const { me, workbook, intro } = await bandWithIntro();
    const fresh = await device(ANNA, { live: false });
    // Die Datei enthält denselben Song in einem eigenen Dokument
    fresh.store.importSongs([{ ...intro, title: 'Intro', tempo: 77, revision: 9 }]);
    await fresh.connection.flush();
    await fresh.sync.syncAll();

    expect(inWorkbook(fresh, workbook)).toEqual(['Intro']);
    expect(local(fresh)).toEqual(['Intro (Kopie)']);
    expect(songNamed(fresh, 'Intro').tempo).toBe(me.store.getState().songs[0]!.tempo);
    const copy = songNamed(fresh, 'Intro (Kopie)');
    expect(copy.tempo).toBe(77);
    expect(copy.id).not.toBe(intro.id);
  });

  it('Eine Fassung mit unbekanntem Server-Stand wird zur Kopie', async () => {
    const { anna, workbook, intro } = await bandWithIntro();
    anna.store.renameSong(intro.id, 'Eigen');
    await anna.connection.flush();
    // Der gemerkte Stand ist dem Server unbekannt, weil er die Änderung nie bekommen hat
    anna.repo.place(intro.id, workbook, A.getHeads(A.load(anna.repo.documentBytes(intro.id))));
    await anna.sync.syncAll();
    expect(inWorkbook(anna, workbook)).toEqual(['Intro']);
    expect(local(anna)).toEqual(['Eigen (Kopie)']);
  });
});

describe('Spec workbook-sync › Ungültige Song-Daten', () => {
  it('Kaputte Daten: Die anderen sehen den Song unverändert, das Gerät behält seine Fassung als Kopie', async () => {
    const { me, anna, workbook, intro } = await bandWithIntro();
    const broken = { ...me.store.getState().songs[0]!, tempo: 100_000, revision: 5 };
    me.store.applyRemote([broken], []);
    await me.connection.flush();
    await me.sync.syncAll();

    await anna.sync.syncAll();
    expect(songNamed(anna, 'Intro').tempo).toBe(intro.tempo);
    expect(inWorkbook(me, workbook)).toEqual(['Intro']);
    expect(songNamed(me, 'Intro').tempo).toBe(intro.tempo);
    expect(songNamed(me, 'Intro (Kopie)').tempo).toBe(100_000);
    expect(local(me)).toEqual(['Intro (Kopie)']);
  });
});

describe('Spec workbooks › Songs nach dem Austritt', () => {
  it('Entfernt während offline', async () => {
    const { me, anna, workbook, intro } = await bandWithIntro();
    anna.setOnline(false);
    anna.store.renameSong(intro.id, 'Offline');
    await anna.connection.flush();
    await me.sync.removeMember(workbook, ANNA);
    anna.setOnline(true);
    await anna.sync.syncAll();

    expect(shared(anna.store.getState().workbooks)).toEqual([]);
    expect(local(anna)).toEqual(['Offline (aus Band)']);
    const [kept] = anna.store.getState().songs;
    expect(kept!.id).not.toBe(intro.id);
    expect(anna.sync.getNotices().map((n) => n.text)).toEqual(['Du bist nicht mehr Mitglied von „Band“. Unter „Meine Songs“ liegen jetzt: Offline (aus Band).']);

    await me.sync.syncAll();
    expect(inWorkbook(me, workbook)).toEqual(['Intro']);
  });

  it('Weiterarbeiten nach dem Austritt', async () => {
    const { me, anna, workbook } = await bandWithIntro();
    expect(await anna.sync.removeMember(workbook, ANNA)).toEqual({ ok: true });
    expect(local(anna)).toEqual(['Intro (aus Band)']);
    expect(anna.sync.getNotices()).toHaveLength(1);
    edit(anna, 'Intro (aus Band)', (s) => setTempo(s, 60));
    await anna.connection.flush();
    await anna.sync.syncAll();
    await me.sync.syncAll();
    expect(me.store.getState().songs[0]!.tempo).toBe(120);
  });

  it('Ein leeres Workbook verschwindet ohne Hinweis', async () => {
    const { me, anna, workbook } = await band();
    await me.sync.deleteWorkbook(workbook);
    await anna.sync.syncAll();
    expect(shared(anna.store.getState().workbooks)).toEqual([]);
    expect(anna.sync.getNotices()).toEqual([]);
  });
});

describe('Spec workbooks › Mitglied einladen', () => {
  it('Erste Anmeldung nach der Einladung', async () => {
    const { workbook, me } = await bandWithIntro();
    const newDevice = await device(ANNA);
    await newDevice.sync.syncAll();
    expect(workbookNamed(newDevice, 'Band').id).toBe(workbook);
    expect(inWorkbook(newDevice, workbook)).toEqual(['Intro']);
    expect(me.store.getState().workbooks[0]!.members).toEqual([OWNER, ANNA]);
  });
});

describe('Sync-Steuerung', () => {
  it('Je Workbook läuft höchstens eine Anfrage', async () => {
    const { me } = await bandWithIntro();
    me.concurrency.max = 0;
    await Promise.all([me.sync.syncAll(), me.sync.syncAll(), me.sync.syncAll(), me.sync.syncAll()]);
    expect(me.concurrency.max).toBe(1);
  });

  it('Eine Sitzung, die endet, lässt die Songs stehen und meldet ab', async () => {
    const { me, workbook } = await bandWithIntro();
    h.db.prepare('DELETE FROM sessions').run();
    await me.sync.syncAll();
    expect(me.session.getEmail()).toBeNull();
    expect(inWorkbook(me, workbook)).toEqual(['Intro']);
  });

  it('Wieder online gehen offline gemachte Änderungen hinaus', async () => {
    const { me, anna, intro } = await bandWithIntro();
    me.sync.start();
    me.setOnline(false);
    me.store.renameSong(intro.id, 'Offline');
    await me.connection.flush();
    me.setOnline(true);
    window.dispatchEvent(new Event('online'));
    await eventually(async () => {
      await anna.sync.syncAll();
      expect(titles(anna)).toEqual(['Offline']);
    });
  });

  it('Eine Store-Änderung am Workbook-Song löst nach der Entprellung einen Abgleich aus', async () => {
    const { me, anna, intro } = await bandWithIntro();
    me.sync.start();
    me.store.renameSong(intro.id, 'Neu');
    await eventually(async () => {
      await anna.sync.syncAll();
      expect(titles(anna)).toEqual(['Neu']);
    });
  });
});

describe('Spec workbook-sync › Abmelden mit Workbook-Songs', () => {
  it('Abmelden: Noch offene Änderungen gehen hinaus, danach zeigt die Startseite keine Workbook-Karten', async () => {
    const { me, anna, intro } = await bandWithIntro();
    me.store.renameSong(intro.id, 'Zuletzt');
    expect(await me.sync.prepareLogout()).toBe(true);
    await me.sync.afterLogout();
    expect(titles(me)).toEqual([]);
    expect(me.store.getState().workbooks).toEqual([]);
    expect(me.store.getState().placement).toEqual({});

    await anna.sync.syncAll();
    expect(titles(anna)).toEqual(['Zuletzt']);
  });

  it('Eine beim Abmelden laufende Anfrage bringt nichts zurück', async () => {
    const { me, anna, workbook } = await bandWithIntro();
    await anna.sync.createSongIn(workbook);
    const running = me.sync.syncAll();
    await me.sync.afterLogout();
    await running;
    expect(titles(me)).toEqual([]);
  });

  it('Der geöffnete Workbook-Song schließt beim Abmelden', async () => {
    const { me, intro } = await bandWithIntro();
    me.store.openSong(intro.id);
    await me.sync.prepareLogout();
    await me.sync.afterLogout();
    expect(me.store.getState().view).toEqual({ kind: 'list' });
  });

  it('Abmelden mit nicht übertragenen Änderungen', async () => {
    const { me, intro } = await bandWithIntro();
    me.setOnline(false);
    me.store.renameSong(intro.id, 'Offline');
    expect(await me.sync.prepareLogout()).toBe(false);
    expect(titles(me)).toEqual(['Offline']);
  });

  it('Nie übertragene Songs bleiben unberührt', async () => {
    const { me } = await band();
    const song = songWith({ title: 'Skizze' });
    me.setOnline(false);
    me.store.importSongs([song]);
    await me.sync.prepareLogout();
    await me.sync.afterLogout();
    expect(titles(me)).toEqual(['Skizze']);
  });
});
