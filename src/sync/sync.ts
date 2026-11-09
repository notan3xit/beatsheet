import type { AccountSession } from '../account/session';
import { newId } from '../domain/id';
import type { Positions } from '../domain/songOrder';
import type { Song, Workbook } from '../domain/types';
import type { Connection, Repository } from '../persistence/repository';
import { sameSong } from '../persistence/songDoc';
import type { NotebookStore } from '../state/notebookStore';
import type { EventsConnection, EventsOpener, QuotaReason, SyncApi, SyncError, SyncReply, WorkbookDocReply } from './api';

export type ActionResult = { ok: true } | { ok: false; error: SyncError };
/** Ergebnis einer Aktion, die etwas anlegt: bei Erfolg mit dessen ID. */
export type CreatedResult = { ok: true; id: string } | { ok: false; error: SyncError };

export interface Notice {
  id: number;
  text: string;
}

/** Was die Oberfläche vom Abgleich braucht. */
export interface WorkbookActions {
  createWorkbook(title: string): Promise<CreatedResult>;
  renameWorkbook(id: string, title: string): Promise<ActionResult>;
  deleteWorkbook(id: string): Promise<ActionResult>;
  invite(id: string, email: string): Promise<ActionResult>;
  /** Entfernt ein Mitglied; mit der eigenen Adresse: Workbook verlassen. */
  removeMember(id: string, email: string): Promise<ActionResult>;
  moveSong(songId: string, workbookId: string): Promise<ActionResult>;
  createSongIn(workbookId: string): Promise<CreatedResult>;
  deleteSong(songId: string): Promise<ActionResult>;
  /** Setzt Positionen im Workbook-Dokument und überträgt sie, auch offline vorgemerkt (song-order, design.md D8). */
  reorder(workbookId: string, positions: Positions): void;
  /** Überträgt alles Offene; `false`, wenn danach noch Änderungen nur auf diesem Gerät liegen. */
  prepareLogout(): Promise<boolean>;
  /** Entfernt die Songs vom Gerät, die auf dem Server liegen, nach erfolgreichem Abmelden. */
  afterLogout(): Promise<void>;
  getNotices(): Notice[];
  dismissNotice(id: number): void;
  /** Der Server ist zuletzt nicht erreichbar gewesen. */
  isOffline(): boolean;
  /** Der Server ist neuer als die App; der Abgleich ruht bis zum Neuladen (outdated-app, design.md D3). */
  isOutdated(): boolean;
  /** Speichert Ausstehendes und lädt die App neu. */
  reload(): Promise<void>;
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
  /** Verzögerung, mit der ein offener Song nach Änderungen als gesehen gilt (song-activity, design.md D7). */
  seenDebounceMs?: number;
  /** Lädt die Seite neu, für Tests ersetzbar. */
  reload?: () => void;
}

/** Abgleich für einen angemeldeten Nutzer (workbook-sync, design.md D9, D10). */
export function createSync({
  store,
  repo,
  connection,
  session,
  api,
  openEvents,
  pollMs = 60_000,
  debounceMs = 500,
  seenDebounceMs = 1000,
  reload = () => location.reload(),
}: SyncDeps): Sync {
  let notices: Notice[] = [];
  let nextNotice = 0;
  let offline = false;
  /** Der Server hat die App als veraltet abgewiesen; endet erst mit dem Neuladen. */
  let outdated = false;
  const listeners = new Set<() => void>();
  let events: EventsConnection | undefined;
  /** Während der Sync selbst den Store ändert, löst das keinen weiteren Abgleich aus. */
  let applying = false;
  /** Steigt beim Abmelden: Antworten auf ältere Anfragen dürfen nichts mehr zurückbringen. */
  let generation = 0;

  /** Nach der Anmeldung meldet die App einmal, wie viele Songs in den Account gewandert sind (account-songs, design.md D5). */
  let announcing = true;
  let announced = 0;
  /** Vom Server abgewiesene Songs mit ihrer Revision: erst nach einer weiteren Änderung ein neuer Versuch. */
  const rejected = new Map<string, number>();
  /** Läuft `syncAll`, lädt es selbst zuletzt hoch (account-songs, design.md D3). */
  let syncAllRunning = 0;
  /** Workbook → Vorgänge, die gerade an einer Speichergrenze scheitern; gemeldet wird beim ersten (server-limits, design.md D4). */
  const atQuota = new Map<string, Set<'sync' | 'upload'>>();
  /** Workbooks, die nach der laufenden Antwort abzugleichen sind. */
  const followUps = new Set<string>();

  const queues = new Map<string, Promise<unknown>>();
  const waiting = new Map<string, Promise<boolean>>();
  let uploadWaiting: Promise<boolean> | undefined;

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

  const personalWorkbook = () => store.getState().workbooks.find((w) => w.personal);

  /** Gesehene Stände gibt es nur in gemeinsamen Workbooks (song-activity, design.md D2; sort-songs, design.md D3). */
  const isShared = (workbookId: string) => store.getState().workbooks.some((w) => w.id === workbookId && !w.personal);

  const unplaced = () => {
    const { songs, placement } = store.getState();
    return songs.filter((s) => !placement[s.id]);
  };

  /** Löst die Songs eines verlorenen Workbooks: neue IDs, aktueller Stand, der Rest läuft über `connectStore`. */
  const detach = (workbookId: string, workbook: Workbook | undefined) => {
    const songs = songsIn(workbookId);
    if (songs.length === 0) return;
    if (workbook?.personal) {
      // Der Bestand eines früheren Accounts: gilt als lokal und wandert in den angemeldeten (design.md D9)
      const local = songs.map((song) => ({ ...song, id: newId() }));
      whileApplying(() => store.applyRemote(local, songs.map((s) => s.id)));
      return;
    }
    const title = workbook?.title ?? 'Workbook';
    const copies = songs.map((song) => ({ ...song, id: newId(), title: `${song.title} (aus ${title})` }));
    whileApplying(() => store.applyRemote(copies, songs.map((s) => s.id)));
    notify(`Du bist nicht mehr Mitglied von „${title}“. Unter „Meine Songs“ liegen jetzt: ${copies.map((c) => c.title).join(', ')}.`);
  };

  const loseWorkbook = async (workbookId: string) => {
    repo.forgetWorkbook(workbookId);
    const { workbooks } = store.getState();
    const remaining = workbooks.filter((w) => w.id !== workbookId);
    whileApplying(() => store.setWorkbooks(remaining));
    await repo.saveWorkbooks(remaining);
    detach(workbookId, workbooks.find((w) => w.id === workbookId));
  };

  /** Eine abgelaufene Sitzung lässt die Songs stehen; der Sync ruht bis zur nächsten Anmeldung. */
  const noteFailure = (error: SyncError) => {
    if (error === 'outdated') {
      if (outdated) return;
      outdated = true;
      // Laufende Antworten bringen nichts mehr zurück
      generation++;
      changed();
      return;
    }
    setOffline(error === 'unreachable');
    if (error === 'unauthenticated') {
      announcing = true;
      session.setEmail(null);
    }
  };

  const quotaText = (workbookId: string, reason: QuotaReason) => {
    if (reason === 'server-full') return 'Der Server ist voll. Deine Änderungen bleiben auf diesem Gerät und werden später übertragen.';
    const workbook = store.getState().workbooks.find((w) => w.id === workbookId);
    if (workbook?.personal) return 'Dein Speicher ist voll. Deine Änderungen bleiben auf diesem Gerät und werden übertragen, sobald du durch Löschen von Songs Platz schaffst.';
    return `Der Speicher von „${workbook?.title ?? 'Workbook'}“ ist voll. Deine Änderungen bleiben auf diesem Gerät und werden übertragen, sobald dort wieder Platz ist.`;
  };

  const noteQuota = (workbookId: string, source: 'sync' | 'upload', reason: QuotaReason | undefined) => {
    const sources = atQuota.get(workbookId) ?? new Set();
    atQuota.set(workbookId, sources);
    if (!reason) {
      sources.delete(source);
      return;
    }
    if (sources.size === 0) notify(quotaText(workbookId, reason));
    sources.add(source);
  };

  const copyOf = (song: Song): Song => ({ ...song, id: newId(), title: `${song.title} (Kopie)` });

  /** Wendet eine Antwort in einem Schritt an, ohne dass der Store zwischendurch anderes sieht (design.md D8). */
  const applyReplies = (workbookId: string, replies: SyncReply[]): QuotaReason | undefined => {
    let quota: QuotaReason | undefined;
    const updated: Song[] = [];
    const removed: string[] = [];
    const placed: [string, string][] = [];
    const { songs, placement } = store.getState();
    const current = new Map(songs.map((s) => [s.id, s]));
    const deleting = new Set(repo.pendingDeletes().map((d) => d.id));

    for (const reply of replies) {
      const song = current.get(reply.id);
      if (reply.status === 'new') {
        if (deleting.has(reply.id)) continue;
        const elsewhere = song && placement[reply.id];
        if (elsewhere && elsewhere !== workbookId) {
          // Auf einem anderen Gerät verschoben: Das alte Workbook meldet `moved`, offene Änderungen bleiben (design.md D7)
          followUps.add(elsewhere);
          continue;
        }
        const adopted = repo.adopt(reply.id, reply.doc, workbookId);
        if (song && !sameSong(song, adopted)) updated.push(copyOf(song));
        updated.push(adopted);
        placed.push([reply.id, workbookId]);
        continue;
      }
      // Inzwischen gelöst oder gelöscht: Die Antwort betrifft diesen Song nicht mehr
      if (!song || placement[reply.id] !== workbookId) continue;
      if (reply.status === 'deleted') {
        removed.push(reply.id);
      } else if (reply.status === 'moved') {
        repo.place(reply.id, reply.to, repo.outgoing(reply.id)!.base);
        placed.push([reply.id, reply.to]);
        followUps.add(reply.to);
      } else if (reply.status === 'ok' || reply.status === 'quota') {
        // Bei `quota` bleiben die eigenen Änderungen im Dokument und gehen beim nächsten Abgleich wieder hinaus
        if (reply.status === 'quota') quota = reply.reason;
        if (reply.changes) updated.push(repo.receive(reply.id, song, { changes: reply.changes, heads: reply.heads }));
        else repo.place(reply.id, workbookId, reply.heads);
      } else {
        updated.push(copyOf(song), repo.adopt(reply.id, reply.doc, workbookId));
      }
    }

    if (updated.length > 0 || removed.length > 0 || placed.length > 0) {
      whileApplying(() => {
        if (updated.length > 0 || removed.length > 0) store.applyRemote(updated, removed);
        placed.forEach(([id, target]) => store.place(id, target));
      });
    }
    return quota;
  };

  /** Übernimmt die Antwort zum Workbook-Dokument; ohne eigenen Eintrag gilt alles Bekannte als gesehen (song-activity, design.md D8). */
  const applyWorkbookReply = (workbookId: string, reply: WorkbookDocReply) => {
    if ('doc' in reply) repo.adoptWorkbook(workbookId, reply.doc);
    else repo.receiveWorkbook(workbookId, reply);
    const email = session.getEmail();
    if (!email || !isShared(workbookId) || repo.workbookSeen(workbookId, email)) return;
    const entries = Object.fromEntries(songsIn(workbookId).flatMap((song) => {
      const heads = repo.songHeads(song.id);
      return heads ? [[song.id, heads]] : [];
    }));
    if (repo.markSeen(workbookId, email, entries)) followUps.add(workbookId);
  };

  const syncWorkbook = async (workbookId: string, started: number): Promise<boolean> => {
    if (outdated) return false;
    if (started !== generation) return false;
    await connection.flush();
    for (const { id, workbookId: from } of repo.pendingDeletes()) {
      if (from !== workbookId) continue;
      const deleted = await api.deleteSong(from, id);
      if (started !== generation) return false;
      if (!deleted.ok && deleted.error !== 'gone') {
        noteFailure(deleted.error);
        return false;
      }
      repo.clearDeleted(id);
    }
    const outgoing = songsIn(workbookId).flatMap((song) => {
      const pending = repo.outgoing(song.id);
      return pending ? [{ id: song.id, ...pending }] : [];
    });
    const result = await api.sync(workbookId, outgoing, repo.workbookOutgoing(workbookId));
    if (started !== generation) return false;
    if (result.ok) {
      setOffline(false);
      noteQuota(workbookId, 'sync', applyReplies(workbookId, result.songs));
      if (result.workbook) applyWorkbookReply(workbookId, result.workbook);
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
    })
      .then(async (done) => {
        await runFollowUps();
        if (syncAllRunning === 0 && session.getEmail() && unplaced().length > 0) await requestUpload();
        return done;
      })
      .catch((error: unknown) => {
        console.error(error);
        return false;
      });
    waiting.set(workbookId, run);
    return run;
  };

  const runFollowUps = async () => {
    const targets = [...followUps];
    followUps.clear();
    if (targets.length === 0) return;
    const { workbooks } = store.getState();
    if (targets.some((id) => !workbooks.some((w) => w.id === id))) await syncAll();
    else await Promise.all(targets.map(requestSync));
  };

  /** Bringt Songs ohne Zugehörigkeit ins persönliche Workbook (account-songs, design.md D3); `false`, wenn der Server fehlt. */
  const uploadLocal = async (personalId: string, started: number): Promise<{ done: boolean; uploaded: number }> => {
    if (outdated) return { done: false, uploaded: 0 };
    let uploaded = 0;
    let quota: QuotaReason | undefined;
    const queue = unplaced();
    for (const { id } of queue) {
      if (started !== generation || !session.getEmail()) return { done: false, uploaded };
      await connection.flush();
      const song = unplaced().find((s) => s.id === id);
      if (!song || rejected.get(id) === song.revision) continue;
      const added = await api.addSong(personalId, id, repo.documentBytes(id));
      if (started !== generation) return { done: false, uploaded };
      const now = unplaced().find((s) => s.id === id);
      if (added.ok) {
        if (now) {
          repo.place(id, personalId, added.heads);
          whileApplying(() => store.place(id, personalId));
          uploaded++;
        } else {
          // Während der Anfrage gelöscht
          await api.deleteSong(personalId, id);
        }
      } else if (added.error === 'exists') {
        if (!now) continue;
        const copy = copyOf(now);
        whileApplying(() => store.applyRemote([copy], [id]));
        queue.push(copy);
      } else if (added.error === 'quota-exceeded' || added.error === 'server-full') {
        // Bleibt lokal; der nächste Abgleich versucht es erneut, sobald Platz frei ist
        quota = added.error;
      } else if (added.error === 'invalid-song' || added.error === 'too-large') {
        if (!rejected.has(id)) notify(`„${song.title}“ konnte nicht in deinen Account übernommen werden und bleibt nur auf diesem Gerät.`);
        rejected.set(id, song.revision);
      } else {
        noteFailure(added.error);
        return { done: false, uploaded };
      }
    }
    noteQuota(personalId, 'upload', quota);
    return { done: true, uploaded };
  };

  const requestUpload = (): Promise<boolean> => {
    const personal = personalWorkbook();
    if (!personal || !session.getEmail()) return Promise.resolve(false);
    if (uploadWaiting) return uploadWaiting;
    const started = generation;
    const run = exclusive(personal.id, () => {
      uploadWaiting = undefined;
      return uploadLocal(personal.id, started);
    })
      .then(async ({ done, uploaded }) => {
        if (started !== generation) return false;
        if (announcing) announced += uploaded;
        if (done && announcing) {
          if (announced > 0) notify(`${announced === 1 ? '1 Song wurde' : `${announced} Songs wurden`} in deinen Account übernommen.`);
          announcing = false;
          announced = 0;
        }
        // Änderungen, die während des Hochladens entstanden sind, gehen gleich hinterher
        if (uploaded > 0) await requestSync(personal.id);
        return done;
      })
      .catch((error: unknown) => {
        console.error(error);
        return false;
      });
    uploadWaiting = run;
    return run;
  };

  const syncAll = async (): Promise<boolean> => {
    if (outdated || !session.getEmail()) return false;
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
      if (!listed.has(workbookId)) detach(workbookId, known.find((w) => w.id === workbookId));
    }
    for (const { id } of known) if (!listed.has(id)) repo.forgetWorkbook(id);
    // Vorgemerktes Löschen eines Workbooks, das es für dieses Konto nicht mehr gibt, hat sich erledigt
    for (const { id, workbookId } of repo.pendingDeletes()) if (!listed.has(workbookId)) repo.clearDeleted(id);
    syncAllRunning++;
    try {
      const done = await Promise.all(result.workbooks.map((w) => requestSync(w.id)));
      const uploaded = await requestUpload();
      return done.every(Boolean) && uploaded;
    } finally {
      syncAllRunning--;
    }
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
    let upload = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = store.subscribe(() => {
      const { songs, placement } = store.getState();
      if (!applying) {
        for (const song of songs) {
          if (known.get(song.id) === song) continue;
          const workbookId = placement[song.id];
          if (workbookId) touched.add(workbookId);
          else upload = true;
        }
        if (touched.size > 0 || upload) {
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (session.getEmail()) {
              touched.forEach((id) => void requestSync(id));
              if (upload) void requestUpload();
            }
            touched.clear();
            upload = false;
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

  /** Der geöffnete Song eines gemeinsamen Workbooks gilt als gesehen, sofern er Neues enthält oder noch keinen Eintrag hat (design.md D7). */
  const markOpenSeen = () => {
    const email = session.getEmail();
    const { openSongId, placement } = store.getState();
    const workbookId = openSongId ? placement[openSongId] : undefined;
    if (!email || !openSongId || !workbookId || !isShared(workbookId)) return;
    const heads = repo.songHeads(openSongId);
    const stored = repo.workbookSeen(workbookId, email)?.[openSongId] ?? null;
    if (!heads || (stored && !repo.isNew(openSongId, stored, email))) return;
    if (repo.markSeen(workbookId, email, { [openSongId]: heads })) void requestSync(workbookId);
  };

  const watchSeen = () => {
    let opened = store.getState().openSongId;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(markOpenSeen, seenDebounceMs);
    };
    const unsubscribeStore = store.subscribe(() => {
      const { openSongId } = store.getState();
      if (openSongId === opened) {
        if (openSongId) later();
        return;
      }
      opened = openSongId;
      clearTimeout(timer);
      markOpenSeen();
    });
    // Das Workbook-Dokument kann nach dem Öffnen eintreffen
    const unsubscribeActivity = repo.subscribeActivity(() => store.getState().openSongId && later());
    if (opened) markOpenSeen();
    return () => {
      clearTimeout(timer);
      unsubscribeStore();
      unsubscribeActivity();
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
        watchSeen(),
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

    async createWorkbook(title) {
      const created = await api.createWorkbook(title);
      const result = await thenSync(created);
      return result.ok && created.ok ? { ok: true, id: created.id } : (result as CreatedResult);
    },
    renameWorkbook: async (id, title) => thenSync(await api.renameWorkbook(id, title)),
    deleteWorkbook: async (id) => thenSync(await api.deleteWorkbook(id)),
    invite: async (id, email) => thenSync(await api.invite(id, email)),
    removeMember: async (id, email) => thenSync(await api.removeMember(id, email)),

    async moveSong(songId, workbookId) {
      const move = async (): Promise<ActionResult> => {
        await connection.flush();
        const personal = personalWorkbook();
        if (personal && store.getState().placement[songId] === personal.id) {
          const moved = await api.moveSong(personal.id, songId, workbookId);
          if (!moved.ok) return moved;
          // Die eigenen Server-Heads bleiben: Die der Antwort können unbekannte Änderungen einschließen
          repo.place(songId, workbookId, repo.outgoing(songId)!.base);
        } else {
          const added = await api.addSong(workbookId, songId, repo.documentBytes(songId));
          if (!added.ok) return added;
          repo.place(songId, workbookId, added.heads);
        }
        whileApplying(() => store.place(songId, workbookId));
        return { ok: true };
      };
      // In beiden Warteschlangen, damit Hochladen und Verschieben sich nicht überholen (design.md D7)
      const personal = personalWorkbook();
      const result = await (personal
        ? exclusive(personal.id, () => exclusive(workbookId, move))
        : exclusive(workbookId, move));
      if (!result.ok) noteFailure(result.error);
      // Änderungen, die während der Anfrage entstanden sind, gehen gleich hinterher
      else await requestSync(workbookId);
      return result;
    },

    async createSongIn(workbookId) {
      const result = await exclusive(workbookId, async (): Promise<CreatedResult> => {
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
        return { ok: true, id };
      });
      if (!result.ok) noteFailure(result.error);
      return result;
    },

    async deleteSong(songId) {
      const workbookId = store.getState().placement[songId];
      if (!workbookId) throw new Error(`Song ${songId} gehört zu keinem Workbook`);
      if (personalWorkbook()?.id === workbookId) {
        // Eigene Songs lassen sich auch ohne Verbindung löschen (account-songs, design.md D6)
        repo.markDeleted(songId);
        whileApplying(() => store.deleteSong(songId));
        void requestSync(workbookId);
        return { ok: true };
      }
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

    reorder(workbookId, positions) {
      if (repo.setPositions(workbookId, positions)) void requestSync(workbookId);
    },

    async prepareLogout() {
      await connection.flush();
      await syncAll();
      await connection.flush();
      return !repo.hasUnsent();
    },

    async afterLogout() {
      generation++;
      announcing = true;
      announced = 0;
      rejected.clear();
      followUps.clear();
      atQuota.clear();
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
    isOutdated: () => outdated,
    async reload() {
      await connection.flush();
      await repo.settled();
      reload();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
