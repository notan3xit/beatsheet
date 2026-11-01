import {
  createPattern as createDomainPattern,
  duplicatePattern,
  renamePattern,
  resizePattern,
  touch,
  type Deps,
} from '../domain/pattern';
import type { Pattern, PatternKind } from '../domain/types';

export const HISTORY_LIMIT = 50;

export interface LibraryState {
  patterns: Pattern[];
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
}

export interface LibraryStore {
  getState(): LibraryState;
  subscribe(listener: () => void): () => void;
  select(id: string | null): void;
  createPattern(kind: PatternKind): Pattern;
  rename(id: string, name: string): void;
  resize(id: string, length: number): void;
  duplicate(id: string): Pattern;
  remove(id: string): void;
  /** Wendet eine Änderung an; liefert die Funktion dasselbe Objekt zurück, passiert nichts. */
  update(id: string, change: (pattern: Pattern) => Pattern): void;
  /** Macht die letzte Änderung am geöffneten Pattern rückgängig. */
  undo(): void;
  redo(): void;
  /** Übernimmt importierte Patterns unverändert (ersetzt gleiche IDs, fügt neue an). */
  importPatterns(imported: Pattern[]): void;
}

/** Verlauf des geöffneten Patterns (design.md D9). */
interface History {
  past: Pattern[];
  future: Pattern[];
}

export function createLibraryStore(initial: Pattern[] = [], deps?: Deps): LibraryStore {
  let patterns = [...initial];
  let selectedId: string | null = null;
  let history: History = { past: [], future: [] };
  let state = snapshot();
  const listeners = new Set<() => void>();
  const now = () => deps?.now() ?? new Date();

  function snapshot(): LibraryState {
    return { patterns, selectedId, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
  }

  const emit = () => {
    state = snapshot();
    listeners.forEach((listener) => listener());
  };

  const find = (id: string) => {
    const pattern = patterns.find((p) => p.id === id);
    if (!pattern) throw new Error(`Pattern ${id} nicht gefunden`);
    return pattern;
  };

  const replace = (next: Pattern) => {
    patterns = patterns.map((p) => (p.id === next.id ? next : p));
  };

  const select = (id: string | null) => {
    if (id === selectedId) return;
    selectedId = id;
    history = { past: [], future: [] };
    emit();
  };

  const add = (pattern: Pattern) => {
    patterns = [...patterns, pattern];
    select(pattern.id);
    return pattern;
  };

  const update = (id: string, change: (pattern: Pattern) => Pattern) => {
    const current = find(id);
    const changed = change(current);
    if (changed === current) return;
    if (id === selectedId) {
      history = { past: [...history.past, current].slice(-HISTORY_LIMIT), future: [] };
    }
    replace(touch(changed, now()));
    emit();
  };

  /** Stellt einen Verlaufsstand wieder her; das ist selbst eine Änderung mit neuer Revision. */
  const restore = (target: Pattern, current: Pattern) => {
    replace(touch({ ...target, revision: current.revision }, now()));
    emit();
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    select,
    createPattern: (kind) => add(createDomainPattern(patterns, { kind }, deps)),
    rename: (id, name) => update(id, (p) => renamePattern(p, name)),
    resize: (id, length) => update(id, (p) => resizePattern(p, length)),
    duplicate: (id) => add(duplicatePattern(find(id), deps)),
    remove(id) {
      patterns = patterns.filter((p) => p.id !== id);
      if (selectedId === id) {
        selectedId = null;
        history = { past: [], future: [] };
      }
      emit();
    },
    update,
    undo() {
      const target = history.past.at(-1);
      if (!target || !selectedId) return;
      const current = find(selectedId);
      history = { past: history.past.slice(0, -1), future: [current, ...history.future] };
      restore(target, current);
    },
    redo() {
      const [target, ...future] = history.future;
      if (!target || !selectedId) return;
      const current = find(selectedId);
      history = { past: [...history.past, current], future };
      restore(target, current);
    },
    importPatterns(imported) {
      if (imported.length === 0) return;
      const byId = new Map(imported.map((p) => [p.id, p]));
      patterns = [
        ...patterns.map((p) => byId.get(p.id) ?? p),
        ...imported.filter((p) => !patterns.some((existing) => existing.id === p.id)),
      ];
      if (selectedId && byId.has(selectedId)) history = { past: [], future: [] };
      emit();
    },
  };
}
