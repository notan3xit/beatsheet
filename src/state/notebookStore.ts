import {
  duplicatePattern,
  renamePattern,
  resizePattern,
  touch,
  type Deps,
} from '../domain/pattern';
import { newId } from '../domain/id';
import { addPattern, patternUsage, removePattern } from '../domain/songPatterns';
import { DEFAULT_TEMPO, type Pattern, type PatternKind, type Song, type Workbook } from '../domain/types';

export const HISTORY_LIMIT = 50;

export type View = { kind: 'list' } | { kind: 'book' } | { kind: 'pattern'; patternId: string } | { kind: 'history' };

export interface NotebookState {
  songs: Song[];
  workbooks: Workbook[];
  /** Song-ID → Workbook-ID; Songs ohne Eintrag stehen in „Meine Songs“. */
  placement: Record<string, string>;
  openSongId: string | null;
  view: View;
  /** Geöffneter Song gegen Bearbeiten gesperrt; gilt nur in diesem Tab und wird nicht gespeichert. */
  locked: boolean;
  /** Struktur des geöffneten Songs ausgeklappt, ohne flache Zeilen; gilt nur in diesem Tab und wird nicht gespeichert. */
  expanded: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export interface NotebookStore {
  getState(): NotebookState;
  subscribe(listener: () => void): () => void;

  // Songs und Navigation
  createSong(title: string, workbookId?: string): Song;
  /** Kopie in „Meine Songs“: neue ID, ohne Zuordnung, Revision 1 (song-library, copy-song design.md D1). */
  copySong(id: string): Song;
  renameSong(id: string, title: string): void;
  deleteSong(id: string): void;
  openSong(id: string): void;
  openPattern(patternId: string): void;
  backToBook(): void;
  /** Verlauf des geöffneten Songs (song-history). */
  openHistory(): void;
  backToList(): void;
  setLocked(locked: boolean): void;
  setExpanded(expanded: boolean): void;

  /** Ändert den geöffneten Song (Struktur, Platzhalter …); erhöht seine Revision. */
  updateSong(change: (song: Song) => Song): void;
  /** Übernimmt den Song wie `updateSong` als Wiederherstellung des Stands von `restoredFrom` (Unixzeit; song-history, design.md D3). */
  restoreSong(song: Song, restoredFrom: number): void;
  /** Wiederherstellungen seit dem letzten Aufruf, Song-ID → Zeit des Zielstands; für das Speichern. */
  takeRestoreNotes(): Map<string, number>;

  // Patterns des geöffneten Songs
  createPattern(kind: PatternKind): Pattern;
  rename(id: string, name: string): void;
  resize(id: string, length: number): void;
  duplicate(id: string): Pattern;
  remove(id: string): void;
  /** Takte im geöffneten Song, die das Pattern verwenden. */
  usage(id: string): number;
  /** Wendet eine Pattern-Änderung an; liefert die Funktion dasselbe Objekt zurück, passiert nichts. */
  update(id: string, change: (pattern: Pattern) => Pattern): void;
  undo(): void;
  redo(): void;

  /** Übernimmt Songs unverändert (Import, ersetzt gleiche IDs). */
  importSongs(imported: Song[]): void;

  // Abgleich mit dem Server
  /** Übernimmt Songs vom Server, ohne Revisionserhöhung; die Ansicht wechselt nur, wenn ihr Inhalt verschwindet. */
  applyRemote(changed: Song[], removedIds: string[]): void;
  setWorkbooks(workbooks: Workbook[]): void;
  place(songId: string, workbookId: string | null): void;
}

/** Verlauf des geöffneten Patterns (Undo/Redo). */
interface History {
  past: Pattern[];
  future: Pattern[];
}

const emptyHistory = (): History => ({ past: [], future: [] });

/** Der geöffnete Song, falls vorhanden. */
export function openSongOf(state: NotebookState): Song | undefined {
  return state.songs.find((s) => s.id === state.openSongId);
}

export function createNotebookStore(
  initial: Song[] = [],
  deps?: Deps,
  sync: { placement: Record<string, string>; workbooks: Workbook[] } = { placement: {}, workbooks: [] },
): NotebookStore {
  let songs = [...initial];
  let workbooks = sync.workbooks;
  let placement = sync.placement;
  let openSongId: string | null = null;
  let view: View = { kind: 'list' };
  const restoreNotes = new Map<string, number>();
  let locked = true;
  let expanded = false;
  let history = emptyHistory();
  let state = snapshot();
  const listeners = new Set<() => void>();
  const now = () => deps?.now() ?? new Date();
  const nextId = () => deps?.newId() ?? newId();

  function snapshot(): NotebookState {
    return { songs, workbooks, placement, openSongId, view, locked, expanded, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
  }

  const emit = () => {
    state = snapshot();
    listeners.forEach((listener) => listener());
  };

  const openSong = (): Song => {
    const song = songs.find((s) => s.id === openSongId);
    if (!song) throw new Error('Kein Song geöffnet');
    return song;
  };

  const findPattern = (id: string): Pattern => {
    const pattern = openSong().patterns.find((p) => p.id === id);
    if (!pattern) throw new Error(`Pattern ${id} nicht gefunden`);
    return pattern;
  };

  /** Ersetzt den geöffneten Song und markiert ihn als geändert. */
  const commitSong = (next: Song) => {
    const current = openSong();
    if (next === current) return;
    const touched = { ...next, revision: current.revision + 1, updatedAt: now().toISOString() };
    songs = songs.map((s) => (s.id === touched.id ? touched : s));
  };

  const setView = (next: View) => {
    view = next;
    history = emptyHistory();
  };

  const unplace = (ids: readonly string[]) => {
    if (ids.some((id) => id in placement)) {
      placement = Object.fromEntries(Object.entries(placement).filter(([id]) => !ids.includes(id)));
    }
  };

  const replacePattern = (song: Song, pattern: Pattern): Song => ({
    ...song,
    patterns: song.patterns.map((p) => (p.id === pattern.id ? pattern : p)),
  });

  const update = (id: string, change: (pattern: Pattern) => Pattern) => {
    const current = findPattern(id);
    const changed = change(current);
    if (changed === current) return;
    if (view.kind === 'pattern' && view.patternId === id) {
      history = { past: [...history.past, current].slice(-HISTORY_LIMIT), future: [] };
    }
    commitSong(replacePattern(openSong(), touch(changed, now())));
    emit();
  };

  /** Stellt einen Verlaufsstand wieder her; das ist selbst eine Änderung mit neuer Revision. */
  const restore = (target: Pattern, current: Pattern) => {
    commitSong(replacePattern(openSong(), touch({ ...target, revision: current.revision }, now())));
    emit();
  };

  const addAndOpen = (pattern: Pattern) => {
    commitSong({ ...openSong(), patterns: [...openSong().patterns, pattern] });
    setView({ kind: 'pattern', patternId: pattern.id });
    emit();
    return pattern;
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    createSong(title, workbookId) {
      const timestamp = now().toISOString();
      const song: Song = {
        id: nextId(),
        title: title.trim() || 'Neuer Song',
        tempo: DEFAULT_TEMPO,
        patterns: [],
        segments: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        revision: 1,
      };
      songs = [...songs, song];
      if (workbookId) placement = { ...placement, [song.id]: workbookId };
      emit();
      return song;
    },
    copySong(id) {
      const original = songs.find((s) => s.id === id);
      if (!original) throw new Error(`Song ${id} nicht gefunden`);
      const timestamp = now().toISOString();
      const copy: Song = { ...original, id: nextId(), title: `${original.title} (Kopie)`, createdAt: timestamp, updatedAt: timestamp, revision: 1 };
      songs = [...songs, copy];
      emit();
      return copy;
    },
    renameSong(id, title) {
      const trimmed = title.trim();
      const song = songs.find((s) => s.id === id);
      if (!song || !trimmed || trimmed === song.title) return;
      songs = songs.map((s) =>
        s.id === id ? { ...s, title: trimmed, revision: s.revision + 1, updatedAt: now().toISOString() } : s,
      );
      emit();
    },
    deleteSong(id) {
      songs = songs.filter((s) => s.id !== id);
      unplace([id]);
      if (openSongId === id) {
        openSongId = null;
        setView({ kind: 'list' });
      }
      emit();
    },
    openSong(id) {
      openSongId = id;
      const song = songs.find((s) => s.id === id);
      locked = !song || song.segments.length > 0 || song.patterns.length > 0;
      expanded = false;
      setView({ kind: 'book' });
      emit();
    },
    openPattern(patternId) {
      findPattern(patternId);
      setView({ kind: 'pattern', patternId });
      emit();
    },
    backToBook() {
      setView({ kind: 'book' });
      emit();
    },
    openHistory() {
      openSong();
      setView({ kind: 'history' });
      emit();
    },
    backToList() {
      openSongId = null;
      setView({ kind: 'list' });
      emit();
    },
    setLocked(next) {
      locked = next;
      emit();
    },
    setExpanded(next) {
      expanded = next;
      emit();
    },

    updateSong(change) {
      commitSong(change(openSong()));
      emit();
    },
    restoreSong(song, restoredFrom) {
      if (song.id !== openSongId) throw new Error(`Song ${song.id} ist nicht geöffnet`);
      commitSong(song);
      restoreNotes.set(song.id, restoredFrom);
      emit();
    },
    takeRestoreNotes() {
      const notes = new Map(restoreNotes);
      restoreNotes.clear();
      return notes;
    },

    createPattern: (kind) => addAndOpen(addPattern(openSong(), { kind }, deps).pattern),
    rename: (id, name) => update(id, (p) => renamePattern(p, name)),
    resize: (id, length) => update(id, (p) => resizePattern(p, length)),
    duplicate: (id) => addAndOpen(duplicatePattern(findPattern(id), openSong().patterns, deps)),
    remove(id) {
      commitSong(removePattern(openSong(), id));
      if (view.kind === 'pattern' && view.patternId === id) setView({ kind: 'book' });
      emit();
    },
    usage: (id) => patternUsage(openSong(), id),
    update,
    undo() {
      const target = history.past.at(-1);
      if (!target || view.kind !== 'pattern') return;
      const current = findPattern(view.patternId);
      history = { past: history.past.slice(0, -1), future: [current, ...history.future] };
      restore(target, current);
    },
    redo() {
      const [target, ...future] = history.future;
      if (!target || view.kind !== 'pattern') return;
      const current = findPattern(view.patternId);
      history = { past: [...history.past, current], future };
      restore(target, current);
    },

    importSongs(imported) {
      if (imported.length === 0) return;
      const byId = new Map(imported.map((s) => [s.id, s]));
      songs = [...songs.map((s) => byId.get(s.id) ?? s), ...imported.filter((s) => !songs.some((e) => e.id === s.id))];
      const replaced = openSongId ? byId.get(openSongId) : undefined;
      if (replaced) {
        const current = view;
        const stillThere = current.kind !== 'pattern' || replaced.patterns.some((p) => p.id === current.patternId);
        setView(stillThere ? current : { kind: 'book' });
      }
      emit();
    },

    applyRemote(changed, removedIds) {
      const byId = new Map(changed.map((s) => [s.id, s]));
      songs = [...songs.filter((s) => !removedIds.includes(s.id)).map((s) => byId.get(s.id) ?? s), ...changed.filter((s) => !songs.some((e) => e.id === s.id))];
      unplace(removedIds);
      const open = songs.find((s) => s.id === openSongId);
      if (openSongId && !open) {
        openSongId = null;
        setView({ kind: 'list' });
      } else if (open && view.kind === 'pattern') {
        const { patternId } = view;
        // Der Verlauf bleibt, solange das Pattern da ist; `setView` würde ihn leeren
        if (!open.patterns.some((p) => p.id === patternId)) setView({ kind: 'book' });
      }
      emit();
    },
    setWorkbooks(next) {
      workbooks = next;
      emit();
    },
    place(songId, workbookId) {
      if (workbookId) placement = { ...placement, [songId]: workbookId };
      else unplace([songId]);
      emit();
    },
  };
}
