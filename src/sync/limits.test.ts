import * as A from '@automerge/automerge/slim';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAccountSession } from '../account/session';
import { connectStore, openRepository, type Connection, type Repository } from '../persistence/repository';
import { createSongDoc } from '../persistence/songDoc';
import { createNotebookStore, type NotebookStore } from '../state/notebookStore';
import { songWith } from '../test/songs';
import type { Limits } from '../../server/limits';
import { startServer, type Harness } from '../../server/testHarness';
import { createSyncApi, type EventsOpener, type ServerEvent, type SyncFetch } from './api';
import { createSync, type Sync } from './sync';

const ME = 'ich@example.com';
const ANNA = 'anna@example.com';
const OVERHEAD = 1024;
/** Platz für das Workbook-Dokument mit den gesehenen Ständen zweier Mitglieder. */
const WORKBOOK_DOC = 1024;

interface Device {
  store: NotebookStore;
  repo: Repository;
  connection: Connection;
  sync: Sync;
  opened: () => number;
}

let h: Harness;
const running: Device[] = [];
const closers: (() => void)[] = [];

afterEach(async () => {
  for (const d of running.splice(0)) d.sync.stop();
  for (const close of closers.splice(0)) close();
  await h.close();
});

async function device(email: string): Promise<Device> {
  const cookie = await h.login(email);
  const fetcher: SyncFetch = (path, init = {}) => fetch(`${h.url}${path}`, { ...init, headers: { ...init.headers, Cookie: cookie } });
  let opened = 0;
  /** Wie `EventSource`: Eine Fehlerantwort beendet die Verbindung endgültig. */
  const openEvents: EventsOpener = (onEvent) => {
    let closed = false;
    opened++;
    void (async () => {
      const response = await fetch(`${h.url}/api/events`, { headers: { Cookie: cookie } });
      if (!response.ok) {
        closed = true;
        return;
      }
      const reader = response.body!.getReader();
      closers.push(() => {
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
            if (event) onEvent(event as ServerEvent, JSON.parse(/^data: (.*)$/m.exec(block)?.[1] ?? '{}'));
          }
        }
      } catch {
        // Verbindung beendet
      }
    })();
    return {
      close() {
        closed = true;
      },
      isClosed: () => closed,
    };
  };
  const session = createAccountSession({
    session: vi.fn(async () => (email ? h.signedInAs(email) : null)),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, ...h.signedInAs(email) })),
    logout: vi.fn(async () => ({ ok: true as const })),
  });
  session.setSession(h.signedInAs(email));
  const repo = await openRepository(`limits-test-${crypto.randomUUID()}`);
  const store = createNotebookStore(await repo.loadAll(), undefined, await repo.loadSyncState());
  const connection = connectStore(store, repo, { debounceMs: 10 });
  const sync = createSync({ store, repo, connection, session, api: createSyncApi(fetcher), openEvents, pollMs: 3_600_000, debounceMs: 10 });
  await sync.syncAll();
  const result: Device = { store, repo, connection, sync, opened: () => opened };
  running.push(result);
  return result;
}

const start = async (limits: Partial<Limits>) => void (h = await startServer({ limits }));
const footprint = () => A.save(createSongDoc(songWith({ title: 'A' }))).length + OVERHEAD;
const bigTitle = () => Array.from(crypto.getRandomValues(new Uint8Array(1500)), (b) => b.toString(36)).join('');
const song = (d: Device, title: string) => d.store.getState().songs.find((s) => s.title === title);
const titles = (d: Device) => d.store.getState().songs.map((s) => s.title).sort();
const personal = (d: Device) => d.store.getState().workbooks.find((w) => w.personal)!.id;
const placedIn = (d: Device, title: string) => d.store.getState().placement[song(d, title)!.id];
const notices = (d: Device) => d.sync.getNotices().map((n) => n.text);
const FULL = 'Dein Speicher ist voll. Deine Änderungen bleiben auf diesem Gerät und werden übertragen, sobald du durch Löschen von Songs Platz schaffst.';

describe('Spec server-limits › Keine Datenverluste an einer Grenze', () => {
  it('Neuer Song über der Grenze: bleibt lokal, die App meldet das einmal, nach dem Freigeben geht er hinaus', async () => {
    await start({ accountBytes: footprint() + OVERHEAD + 300 });
    const d = await device(ME);
    const first = d.store.createSong('A');
    await d.sync.syncAll();
    d.store.createSong('B');
    await d.sync.syncAll();
    await d.sync.syncAll();
    expect(titles(d)).toEqual(['A', 'B']);
    expect(placedIn(d, 'B')).toBeUndefined();
    expect(notices(d)).toEqual([FULL]);

    await d.sync.deleteSong(first.id);
    await d.sync.syncAll();
    expect(placedIn(d, 'B')).toBe(personal(d));
  });

  /** Zwei Songs: Nur wenn der große gelöscht wird, passt danach eine große Änderung am kleinen. */
  async function nearlyFull() {
    const bigB = bigTitle();
    await start({ accountBytes: footprint() + A.save(createSongDoc(songWith({ title: bigB }))).length + OVERHEAD + 400 });
    const d = await device(ME);
    const a = d.store.createSong('A');
    const b = d.store.createSong(bigB);
    await d.sync.syncAll();
    expect(notices(d)).toEqual([]);
    return { d, a, b, bigB };
  }

  it('Änderung wartet auf Platz: keine Kopie, danach kommt sie an', async () => {
    const { d, a, b, bigB } = await nearlyFull();
    const title = bigTitle();
    d.store.renameSong(a.id, title);
    await d.sync.syncAll();
    expect(titles(d)).toEqual([title, bigB].sort());
    expect(d.repo.hasUnsent()).toBe(true);
    expect(notices(d)).toEqual([FULL]);

    const other = await device(ME);
    expect(titles(other)).toEqual(['A', bigB].sort());

    await d.sync.deleteSong(b.id);
    await d.sync.syncAll();
    expect(d.repo.hasUnsent()).toBe(false);
    await other.sync.syncAll();
    expect(titles(other)).toEqual([title]);
    expect(titles(d)).toEqual([title]);
  });

  it('Die Meldung kommt nach einem Erfolg und einer neuen Überschreitung wieder', async () => {
    const { d, a, b } = await nearlyFull();
    d.store.renameSong(a.id, bigTitle());
    await d.sync.syncAll();
    expect(notices(d)).toHaveLength(1);
    await d.sync.syncAll();
    expect(notices(d)).toHaveLength(1);
    await d.sync.deleteSong(b.id);
    await d.sync.syncAll();
    expect(d.repo.hasUnsent()).toBe(false);
    d.sync.dismissNotice(d.sync.getNotices()[0]!.id);

    d.store.renameSong(a.id, bigTitle() + bigTitle());
    await d.sync.syncAll();
    expect(notices(d)).toEqual([FULL]);
  });

  it('Änderungen anderer an einer Grenze: Das Gerät zeigt sie und behält seine eigene', async () => {
    // Das Workbook-Dokument von „Band“ belegt ebenfalls Speicher der Besitzerin
    await start({ accountBytes: footprint() + 400 + WORKBOOK_DOC });
    const me = await device(ME);
    await me.sync.createWorkbook('Band');
    const band = me.store.getState().workbooks.find((w) => w.title === 'Band')!.id;
    await me.sync.invite(band, ANNA);
    await me.sync.createSongIn(band);
    const anna = await device(ANNA);
    const { id } = me.store.getState().songs[0]!;

    anna.store.openSong(id);
    anna.store.updateSong((s) => ({ ...s, tempo: 90 }));
    anna.store.backToList();
    await anna.sync.syncAll();

    const title = bigTitle();
    me.store.renameSong(id, title);
    await me.sync.syncAll();
    expect(me.store.getState().songs[0]).toMatchObject({ title, tempo: 90 });
    expect(me.store.getState().songs).toHaveLength(1);
    expect(notices(me)).toEqual(['Der Speicher von „Band“ ist voll. Deine Änderungen bleiben auf diesem Gerät und werden übertragen, sobald dort wieder Platz ist.']);
    await anna.sync.syncAll();
    expect(anna.store.getState().songs[0]!.title).toBe('Neuer Song');
  });

  it('Abmelden mit abgewiesener Änderung: Die App muss nachfragen', async () => {
    await start({ accountBytes: footprint() + 300 });
    const d = await device(ME);
    const a = d.store.createSong('A');
    await d.sync.syncAll();
    d.store.renameSong(a.id, bigTitle());
    expect(await d.sync.prepareLogout()).toBe(false);
  });

  it('Ein wegen der Grenze nie übertragener Song blockiert das Abmelden nicht und bleibt lokal', async () => {
    await start({ accountBytes: 100 });
    const d = await device(ME);
    d.store.createSong('Lokal');
    expect(await d.sync.prepareLogout()).toBe(true);
    await d.sync.afterLogout();
    expect(titles(d)).toEqual(['Lokal']);
  });

  it('Gesamtgrenze: eigene Meldung', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await start({ totalBytes: 100 });
      const d = await device(ME);
      d.store.createSong('Lokal');
      await d.sync.syncAll();
      expect(notices(d)).toEqual(['Der Server ist voll. Deine Änderungen bleiben auf diesem Gerät und werden später übertragen.']);
      expect(placedIn(d, 'Lokal')).toBeUndefined();
    } finally {
      log.mockRestore();
    }
  });
});

describe('Spec server-limits › Speichergrenze je Account (Client)', () => {
  it('Verschieben in ein volles Workbook: Fehler, der Song bleibt in „Meine Songs“', async () => {
    await start({ accountBytes: Math.floor(footprint() * 1.5) });
    const me = await device(ME);
    await me.sync.createWorkbook('Band');
    const band = me.store.getState().workbooks.find((w) => w.title === 'Band')!.id;
    await me.sync.invite(band, ANNA);
    await me.sync.createSongIn(band);
    const anna = await device(ANNA);
    const { id } = anna.store.createSong('Eigen');
    await anna.sync.syncAll();
    expect(placedIn(anna, 'Eigen')).toBe(personal(anna));
    expect(await anna.sync.moveSong(id, band)).toEqual({ ok: false, error: 'quota-exceeded' });
    expect(placedIn(anna, 'Eigen')).toBe(personal(anna));
    expect(anna.sync.isOffline()).toBe(false);
  });

  it('Anlegen in einem vollen Workbook: Fehler, kein Song', async () => {
    await start({ accountBytes: 100 });
    const me = await device(ME);
    await me.sync.createWorkbook('Band');
    const band = me.store.getState().workbooks.find((w) => w.title === 'Band')!.id;
    expect(await me.sync.createSongIn(band)).toEqual({ ok: false, error: 'quota-exceeded' });
    expect(titles(me)).toEqual([]);
  });
});

describe('Spec server-limits › Grenzen für Workbooks und Mitglieder (Client)', () => {
  it('Die Fehlercodes kommen an', async () => {
    await start({ ownedWorkbooks: 1, workbookMembers: 1 });
    const me = await device(ME);
    expect(await me.sync.createWorkbook('Band')).toMatchObject({ ok: true });
    expect(await me.sync.createWorkbook('Zweites')).toEqual({ ok: false, error: 'too-many-workbooks' });
    const band = me.store.getState().workbooks.find((w) => w.title === 'Band')!.id;
    expect(await me.sync.invite(band, ANNA)).toEqual({ ok: false, error: 'too-many-members' });
  });
});

describe('Spec server-limits › Grenzen für Ereignis-Verbindungen (Client)', () => {
  it('Abgewiesen: Das Gerät gleicht weiter ab und versucht die Verbindung erneut', async () => {
    await start({ accountConnections: 1 });
    const first = await device(ME);
    const second = await device(ME);
    first.sync.start();
    await vi.waitFor(() => expect(closers).toHaveLength(1));
    second.sync.start();
    await new Promise((resolve) => setTimeout(resolve, 50));

    first.store.createSong('Neu');
    await first.sync.syncAll();
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(titles(second)).toEqual(['Neu']));
    expect(second.opened()).toBeGreaterThan(1);
    expect(second.sync.isOffline()).toBe(false);
  });
});
