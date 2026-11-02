import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { nextColor } from '../domain/pattern';
import { assignPlaceholder, setBarProps } from '../domain/structure';
import type { PatternKind, Song } from '../domain/types';
import { openSongOf } from '../state/notebookStore';
import { patternStyle } from './patternStyle';
import { useOpenSong, useStore } from './useLibrary';

/** Was gezogen wird: ein bestehendes Pattern oder „neu“ (design.md D2). */
export type DragPayload = { kind: 'pattern'; patternId: string } | { kind: 'new'; patternKind: PatternKind };

/** Element unter dem Zeiger; Standard elementFromPoint, in Tests austauschbar. */
export type HitTest = (x: number, y: number) => Element | null;

const defaultHitTest: HitTest = (x, y) => document.elementFromPoint?.(x, y) ?? null;

/** Optionale Trefferprüfung, von App gesetzt (nur Tests weichen vom Standard ab). */
export const HitTestContext = createContext<HitTest>(defaultHitTest);

/** Ab dieser Bewegung (px) wird aus einem Klick ein Ziehen. */
const DRAG_THRESHOLD = 5;

interface DragState {
  payload: DragPayload;
  x: number;
  y: number;
  targets: string[];
}

type TargetResolver = (barId: string) => string[];

interface DragContextValue {
  /** Takt-IDs, auf die das Pattern beim Loslassen fiele. */
  targets: ReadonlySet<string>;
  begin: (payload: DragPayload, e: ReactPointerEvent) => void;
  /** Die Struktur bestimmt, welche Takte ein Treffer meint (Auswahl oder einzelner Takt). */
  setResolver: (resolver: TargetResolver | null) => void;
}

const DragContext = createContext<DragContextValue | null>(null);

function useDragContext(): DragContextValue {
  const value = useContext(DragContext);
  if (!value) throw new Error('DragProvider fehlt');
  return value;
}

/** Änderung am Song beim Loslassen auf Takten. */
function dropChange(song: Song, payload: DragPayload, targets: string[]): ((s: Song) => Song) | null {
  if (payload.kind === 'new') return (s) => assignPlaceholder(s, targets, payload.patternKind);
  const pattern = song.patterns.find((p) => p.id === payload.patternId);
  if (!pattern) return null;
  const props = pattern.kind === 'groove' ? { grooveId: pattern.id } : { fillId: pattern.id };
  return (s) => setBarProps(s, targets, props);
}

/** Ziehbild am Zeiger. */
function DragImage({ drag }: { drag: DragState }) {
  const song = useOpenSong();
  const { payload } = drag;
  const pattern = payload.kind === 'pattern' ? song.patterns.find((p) => p.id === payload.patternId) : undefined;
  const label = pattern?.name ?? (payload.kind === 'new' ? (payload.patternKind === 'groove' ? 'Neuer Groove' : 'Neuer Fill') : '');
  const color = pattern?.color ?? nextColor(song.patterns);
  return (
    <div
      className={`drag-image${payload.kind === 'new' ? ' new' : ''}`}
      style={{ left: drag.x, top: drag.y, ...patternStyle(color) }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

/** Ziehen von Patterns auf Takte innerhalb der Doppelseite (design.md D2). */
export function DragProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const hitTest = useContext(HitTestContext);
  const [drag, setDrag] = useState<DragState | null>(null);
  const resolver = useRef<TargetResolver | null>(null);

  const targetsAt = useCallback(
    (x: number, y: number) => {
      const barId = hitTest(x, y)?.closest('[data-bar-id]')?.getAttribute('data-bar-id');
      return barId && resolver.current ? resolver.current(barId) : [];
    },
    [hitTest],
  );

  const begin = useCallback(
    (payload: DragPayload, e: ReactPointerEvent) => {
      if (e.button !== 0 || e.pointerType === 'touch') return;
      // Knöpfe innerhalb einer Quelle (z. B. „Bearbeiten“ in der Karte) starten kein Ziehen
      const button = (e.target as Element).closest('button');
      if (button && button !== e.currentTarget && e.currentTarget.contains(button)) return;
      const start = { x: e.clientX, y: e.clientY };
      let state: DragState | null = null;

      const finish = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onCancel);
        document.removeEventListener('keydown', onKey);
        document.body.classList.remove('dragging-pattern');
        setDrag(null);
      };
      // Nach einem echten Ziehen den folgenden Klick einmalig verschlucken (z. B. „Neuer Groove“ nicht auslösen).
      // Der Abfänger endet mit diesem Klick oder spätestens beim nächsten pointerdown, falls kein Klick kommt.
      const swallowClick = () => {
        const onClick = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
          stop();
        };
        const stop = () => {
          document.removeEventListener('click', onClick, { capture: true });
          document.removeEventListener('pointerdown', stop, { capture: true });
        };
        document.addEventListener('click', onClick, { capture: true });
        document.addEventListener('pointerdown', stop, { capture: true });
      };
      const onMove = (ev: PointerEvent) => {
        if (!state && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_THRESHOLD) return;
        if (!state) document.body.classList.add('dragging-pattern');
        state = { payload, x: ev.clientX, y: ev.clientY, targets: targetsAt(ev.clientX, ev.clientY) };
        setDrag(state);
      };
      const onUp = (ev: PointerEvent) => {
        const dragged = state;
        finish();
        if (!dragged) return;
        swallowClick();
        const targets = targetsAt(ev.clientX, ev.clientY);
        if (targets.length === 0) return;
        const song = openSongOf(store.getState());
        const change = song && dropChange(song, payload, targets);
        if (change) store.updateSong(change);
      };
      const onCancel = () => {
        if (state) swallowClick();
        finish();
      };
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') onCancel();
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onCancel);
      document.addEventListener('keydown', onKey);
    },
    [store, targetsAt],
  );

  const setResolver = useCallback((r: TargetResolver | null) => {
    resolver.current = r;
  }, []);

  const value = useMemo<DragContextValue>(
    () => ({ targets: new Set(drag?.targets ?? []), begin, setResolver }),
    [drag, begin, setResolver],
  );

  return (
    <DragContext.Provider value={value}>
      {children}
      {drag && <DragImage drag={drag} />}
    </DragContext.Provider>
  );
}

/** Macht ein Element zur Ziehquelle; ein Klick ohne Bewegung bleibt ein Klick. */
export function useDragSource(payload: DragPayload) {
  const { begin } = useDragContext();
  return {
    'data-drag-source': '',
    onPointerDown: (e: ReactPointerEvent) => begin(payload, e),
  };
}

/** Für die Struktur: aktuelle Zieltakte und Registrierung des Resolvers. */
export function useDropTargets(resolver: TargetResolver): ReadonlySet<string> {
  const { targets, setResolver } = useDragContext();
  const current = useRef(resolver);
  current.current = resolver;
  useEffect(() => {
    setResolver((barId) => current.current(barId));
    return () => setResolver(null);
  }, [setResolver]);
  return targets;
}
