import type { AccountSession } from '../account/session';
import type { Positions } from '../domain/songOrder';
import type { LastChange } from '../persistence/activity';
import type { Repository } from '../persistence/repository';
import type { NotebookStore } from '../state/notebookStore';

/** Letzte Änderung und Neues je Song und Reihenfolge der Workbooks für die Startseite (song-activity, song-order). */
export interface SongActivity {
  lastChange(songId: string): LastChange | null;
  /** Nur in gemeinsamen Workbooks und angemeldet; vor dem ersten eigenen Eintrag nie (design.md D8). */
  isNew(songId: string): boolean;
  /** Positionen eines Workbooks; `null` ohne Dokument oder Reihenfolge (song-order, sort-songs design.md D9). */
  order(workbookId: string): Positions | null;
  subscribe(listener: () => void): () => void;
  /** Steigt mit jeder Meldung, für `useSyncExternalStore`. */
  getVersion(): number;
}

export function createSongActivity({ store, repo, session }: { store: NotebookStore; repo: Repository; session: AccountSession }): SongActivity {
  let version = 0;
  const listeners = new Set<() => void>();
  const notify = () => {
    version++;
    listeners.forEach((listener) => listener());
  };
  let unsubscribes: (() => void)[] = [];

  return {
    lastChange: (songId) => repo.lastChange(songId),
    isNew(songId) {
      const email = session.getEmail();
      const { placement, workbooks } = store.getState();
      const workbookId = placement[songId];
      if (!email || !workbookId || !workbooks.some((w) => w.id === workbookId && !w.personal)) return false;
      const seen = repo.workbookSeen(workbookId, email);
      return seen !== null && repo.isNew(songId, seen[songId] ?? null, email);
    },
    order: (workbookId) => repo.workbookOrder(workbookId),
    subscribe(listener) {
      if (listeners.size === 0) unsubscribes = [repo.subscribeActivity(notify), session.subscribe(notify)];
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        unsubscribes.forEach((unsubscribe) => unsubscribe());
        unsubscribes = [];
      };
    },
    getVersion: () => version,
  };
}
