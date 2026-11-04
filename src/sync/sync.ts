import type { AccountSession } from '../account/session';
import { newId } from '../domain/id';
import type { Song } from '../domain/types';
import type { Connection, Repository } from '../persistence/repository';
import type { NotebookStore } from '../state/notebookStore';
import type { EventsConnection, EventsOpener, SyncApi, SyncError, SyncReply } from './api';

export type ActionResult = { ok: true } | { ok: false; error: SyncError };

export interface Notice {
  id: number;
  text: string;
}

/** Was die Oberfläche vom Abgleich braucht. */
export interface WorkbookActions {
  createWorkbook(title: string): Promise<ActionResult>;
  renameWorkbook(id: string, title: string): Promise<ActionResult>;
  deleteWorkbook(id: string): Promise<ActionResult>;
  invite(id: string, email: string): Promise<ActionResult>;
  /** Entfernt ein Mitglied; mit der eigenen Adresse: Workbook verlassen. */
  removeMember(id: string, email: string): Promise<ActionResult>;
  moveSong(songId: string, workbookId: string): Promise<ActionResult>;
  createSongIn(workbookId: string): Promise<ActionResult>;
  deleteSong(songId: string): Promise<ActionResult>;
  /** Überträgt alles Offene; `false`, wenn danach noch Änderungen nur auf diesem Gerät liegen. */
  prepareLogout(): Promise<boolean>;
  /** Entfernt die Workbook-Songs vom Gerät, nach erfolgreichem Abmelden. */
  afterLogout(): Promise<void>;
  getNotices(): Notice[];
  dismissNotice(id: number): void;
  /** Der Server ist zuletzt nicht erreichbar gewesen. */
  isOffline(): boolean;
  /** Meldet Änderungen an Hinweisen und Verbindungsstatus. */
  subscribe(listener: () => void): () => void;
}

export interface Sync extends WorkbookActions {
  start(): void;
  stop(): void;
  /** Gleicht Workbook-Liste und alle Workbooks ab; `false`, wenn etwas nicht gelang. */
  syncAll(): Promise<boolean>;
}

export interface SyncDeps {
  store: NotebookStore;
  repo: Repository;
  connection: Connection;
  session: AccountSession;
  api: SyncApi;
  openEvents: EventsOpener;
  pollMs?: number;
  debounceMs?: number;
}

/** Abgleich für einen angemeldeten Nutzer (workbook-sync, design.md D9, D10). */
export function createSync({ store, repo, connection, session, api, openEvents, pollMs = 60_000, debounceMs = 500 }: SyncDeps): Sync {
  let notices: Notice[] = [];
  let nextNotice = 0;
  let offline = false;
  const listeners = new Set<() => void>();
  let events: EventsConnection | undefined;
  /** Während der Sync selbst den Store ändert, löst das keinen weiteren Abgleich aus. */
  let applying = false;
  /** Steigt beim Abmelden: Antworten auf ältere Anfragen dürfen nichts mehr zurückbringen. */
  let generation = 0;

  const queues = new Map<string, Promise<unknown>>();
  const waiting = new Map<string, Promise<boolean>>();

  /** Je Workbook läuft höchstens eine Anfrage. */
  const exclusive = <T>(workbookId: string, task: () => Promise<T>): Promise<T> => {
    const run = (queues.get(workbookId) ?? Promise.resolve()).then(task, task);
    queues.set(workbookId, run.catch(() => undefined));
    return run;
  };

  const whileApplying = (change: () => void) => {
    applying = true;
    try {
      change();
    } finally {
      applying = false;
    }
  };

  const changed = () => listeners.forEach((listener) => listener());

  const notify = (text: string) => {
    notices = [...notices, { id: ++nextNotice, text }];
    changed();
  };

  const setOffline = (next: boolean) => {
    if (next === offline) return;
    offline = next;
    changed();
  };

  const songsIn = (workbookId: string) => {
    const { songs, placement } = store.getState();
    return songs.filter((s) => placement[s.id] === workbookId);
  };

  /** Löst die Songs eines verlorenen Workbooks: neue IDs, aktueller Stand, der Rest läuft über `connectStore`. */
  const detach = (workbookId: string, title: string) => {
    const songs = songsIn(workbookId);
    if (songs.length === 0) return;
    const copies = songs.map((song) => ({ ...song, id: newId(), title: `${song.title} (aus ${title})` }));
    whileApplying(() => store.applyRemote(copies, songs.map((s) => s.id)));
    notify(`Du bist nicht mehr Mitglied von „${title}“. Unter „Meine Songs“ liegen jetzt: ${copies.map((c) => c.title).join(', ')}.`);
  };

  const loseWorkbook = async (workbookId: string) => {
    const { workbooks } = store.getState();
    const remaining = workbooks.filter((w) => w.id !== workbookId);
    whileApplying(() => store.setWorkbooks(remaining));
    await repo.saveWorkbooks(remaining);
    detach(workbookId, workbooks.find((w) => w.id === workbookId)?.title ?? 'Workbook');
  };

  /** Eine abgelaufene Sitzung lässt die Songs stehen; der Sync ruht bis zur nächsten Anmeldung. */
  const noteFailure = (error: SyncError) => {
    setOffline(error === 'unreachable');
    if (error === 'unauthenticated') session.setEmail(null);
  };

  const copyOf = (song: Song): Song => ({ ...song, id: newId(), title: `${song.title} (Kopie)` });

  /** Wendet eine Antwort in einem Schritt an, ohne dass der Store zwischendurch anderes sieht (design.md D8). */
  const applyReplies = (workbookId: string, replies: SyncReply[]) => {
    const updated: Song[] = [];
    const removed: string[] = [];
    const placed: string[] = [];
    const { songs, placement } = store.getState();
    const current = new Map(songs.map((s) => [s.id, s]));

    for (const reply of replies) {
      const song = current.get(reply.id);
      if (reply.status === 'new') {
        if (song) updated.push(copyOf(song));
        updated.push(repo.adopt(reply.id, reply.doc, workbookId));
        placed.push(reply.id);
        continue;
      }
      // Inzwischen gelöst oder gelöscht: Die Antwort betrifft diesen Song nicht mehr
      if (!song || placement[reply.id] !== workbookId) continue;
      if (reply.status === 'deleted') {
        removed.push(reply.id);
      } else if (reply.status === 'ok') {
        if (reply.changes) updated.push(repo.receive(reply.id, song, { changes: reply.changes, heads: reply.heads }));
        else repo.place(reply.id, workbookId, reply.heads);
      } else {
        updated.push(copyOf(song), repo.adopt(reply.id, reply.doc, workbookId));
      }
    }

    if (updated.length === 0 && removed.length === 0) return;
    whileApplying(() => {
      store.applyRemote(updated, removed);
      placed.forEach((id) => store.place(id, workbookId));
    });
  };

  const syncWorkbook = async (workbookId: string, started: number): Promise<boolean> => {
    if (started !== generation) return false;
    await connection.flush();
    const outgoing = songsIn(workbookId).flatMap((song) => {
      const pending = repo.outgoing(song.id);
      return pending ? [{ id: song.id, ...pending }] : [];
    });
    const result = await api.sync(workbookId, outgoing);
    if (started !== generation) return false;
    if (result.ok) {
      setOffline(false);
      applyReplies(workbookId, result.songs);
      return true;
    }
    if (result.error === 'gone') await loseWorkbook(workbookId);
    noteFailure(result.error);
    return false;
  };

  /** Auslöser während einer laufenden Anfrage führen zu genau einer weiteren. */
  const requestSync = (workbookId: string): Promise<boolean> => {
    const queued = waiting.get(workbookId);
    if (queued) return queued;
    const started = generation;
    const run = exclusive(workbookId, () => {
      waiting.delete(workbookId);
      return syncWorkbook(workbookId, started);
    }).catch((error: unknown) => {
      console.error(error);
      return false;
    });
    waiting.set(workbookId, run);
    return run;
  };

  const syncAll = async (): Promise<boolean> => {
    if (!session.getEmail()) return false;
    const started = generation;
    const result = await api.listWorkbooks();
    if (started !== generation) return false;
    if (!result.ok) {
      noteFailure(result.error);
      return false;
    }
    setOffline(false);
    const { workbooks: known, placement } = store.getState();
    const listed = new Set(result.workbooks.map((w) => w.id));
    if (JSON.stringify(known) !== JSON.stringify(result.workbooks)) {
      whileApplying(() => store.setWorkbooks(result.workbooks));
      await repo.saveWorkbooks(result.workbooks);
    }
    for (const workbookId of new Set(Object.values(placement))) {
      if (!listed.has(workbookId)) detach(workbookId, known.find((w) => w.id === workbookId)?.title ?? 'Workbook');
    }
    const done = await Promise.all(result.workbooks.map((w) => requestSync(w.id)));
    return done.every(Boolean);
  };

  /** Aktion am Workbook; danach gilt der Stand des Servers. */
  const thenSync = async (result: ActionResult): Promise<ActionResult> => {
    if (result.ok) await syncAll();
    else noteFailure(result.error);
    return result.ok ? { ok: true } : result;
  };

  // --- Auslöser ------------------------------------------------------------------------

  let unsubscribes: (() => void)[] = [];

  const closeEvents = () => {
    events?.close();
    events = undefined;
  };

  const openEventsChannel = () => {
    closeEvents();
    events = openEvents(
      (event, data) => {
        if (event === 'workbook' && data.id && store.getState().workbooks.some((w) => w.id === data.id)) void requestSync(data.id);
        else void syncAll();
      },
      () => void syncAll(),
    );
  };

  const onTrigger = () => {
    if (session.getEmail()) {
      if (events?.isClosed()) openEventsChannel();
      void syncAll();
    } else {
      void probe();
    }
  };

  /** Ohne Sitzung, aber mit bekannten Workbooks: Vielleicht war der Server beim Start nicht erreichbar (design.md D9). */
  const probe = async () => {
    if (store.getState().workbooks.length === 0) return;
    const result = await api.listWorkbooks();
    setOffline(!result.ok && result.error === 'unreachable');
    if (result.ok) await session.refresh();
  };

  const watchStore = () => {
    let known = new Map(store.getState().songs.map((s) => [s.id, s]));
    const touched = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = store.subscribe(() => {
      const { songs, placement } = store.getState();
      if (!applying) {
        for (const song of songs) {
          const workbookId = placement[song.id];
          if (workbookId && known.get(song.id) !== song) touched.add(workbookId);
        }
        if (touched.size > 0) {
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (session.getEmail()) touched.forEach((id) => void requestSync(id));
            touched.clear();
          }, debounceMs);
        }
      }
      known = new Map(songs.map((s) => [s.id, s]));
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  };

  return {
    start() {
      const onVisibility = () => document.visibilityState === 'visible' && onTrigger();
      const onOffline = () => setOffline(true);
      const poll = setInterval(() => document.visibilityState === 'visible' && onTrigger(), pollMs);
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('online', onTrigger);
      window.addEventListener('offline', onOffline);
      const onSession = () => {
        if (session.getEmail()) {
          openEventsChannel();
          void syncAll();
        } else {
          closeEvents();
        }
      };
      unsubscribes = [
        session.subscribe(onSession),
        watchStore(),
        () => {
          clearInterval(poll);
          document.removeEventListener('visibilitychange', onVisibility);
          window.removeEventListener('online', onTrigger);
          window.removeEventListener('offline', onOffline);
          closeEvents();
        },
      ];
      if (!navigator.onLine) setOffline(true);
      if (session.getEmail()) onSession();
      else void probe();
    },
    stop() {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      unsubscribes = [];
    },
    syncAll,

    createWorkbook: async (title) => thenSync(await api.createWorkbook(title)),
    renameWorkbook: async (id, title) => thenSync(await api.renameWorkbook(id, title)),
    deleteWorkbook: async (id) => thenSync(await api.deleteWorkbook(id)),
    invite: async (id, email) => thenSync(await api.invite(id, email)),
    removeMember: async (id, email) => thenSync(await api.removeMember(id, email)),

    async moveSong(songId, workbookId) {
      const result = await exclusive(workbookId, async (): Promise<ActionResult> => {
        await connection.flush();
        const added = await api.addSong(workbookId, songId, repo.documentBytes(songId));
        if (!added.ok) return added;
        repo.place(songId, workbookId, added.heads);
        whileApplying(() => store.place(songId, workbookId));
        return { ok: true };
      });
      if (!result.ok) noteFailure(result.error);
      // Änderungen, die während der Anfrage entstanden sind, gehen gleich hinterher
      else await requestSync(workbookId);
      return result;
    },

    async createSongIn(workbookId) {
      const result = await exclusive(workbookId, async (): Promise<ActionResult> => {
        let song: Song | undefined;
        whileApplying(() => {
          song = store.createSong('', workbookId);
        });
        const { id } = song!;
        await connection.flush();
        const added = await api.addSong(workbookId, id, repo.documentBytes(id));
        if (!added.ok) {
          whileApplying(() => store.deleteSong(id));
          return added;
        }
        repo.place(id, workbookId, added.heads);
        return { ok: true };
      });
      if (!result.ok) noteFailure(result.error);
      return result;
    },

    async deleteSong(songId) {
      const workbookId = store.getState().placement[songId];
      if (!workbookId) throw new Error(`Song ${songId} gehört zu keinem Workbook`);
      const result = await exclusive(workbookId, async (): Promise<ActionResult> => {
        const deleted = await api.deleteSong(workbookId, songId);
        // Schon weg (`gone`) ist für den Nutzer dasselbe Ergebnis
        if (!deleted.ok && deleted.error !== 'gone') return deleted;
        whileApplying(() => store.deleteSong(songId));
        return { ok: true };
      });
      if (!result.ok) noteFailure(result.error);
      return result;
    },

    async prepareLogout() {
      await connection.flush();
      await syncAll();
      await connection.flush();
      return !repo.hasUnsent();
    },

    async afterLogout() {
      generation++;
      const placed = Object.keys(store.getState().placement);
      await repo.forgetWorkbookSongs();
      whileApplying(() => {
        store.applyRemote([], placed);
        store.setWorkbooks([]);
      });
    },

    getNotices: () => notices,
    dismissNotice(id) {
      notices = notices.filter((n) => n.id !== id);
      changed();
    },
    isOffline: () => offline,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
