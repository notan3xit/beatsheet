import { createContext, useCallback, useContext, useMemo, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { Song } from '../domain/types';
import { HitTestContext } from './dragPattern';
import { SongMotif } from './SongMotif';
import { useSongTransfer } from './songTransfer';
import { useNotebook } from './useLibrary';

/** Ab dieser Bewegung (px) wird aus einem Klick ein Ziehen, wie bei den Pattern-Karten. */
const DRAG_THRESHOLD = 5;

/** Herkunft einer gezogenen Kachel: „Meine Songs“ oder die ID ihres Workbooks. */
export type DragSource = 'mine' | (string & {});

/** Fläche unter dem Zeiger, auf der sich etwas ablegen lässt (copy-song, design.md D4). */
export type DropTarget = { kind: 'workbook'; id: string } | { kind: 'mine' };

/** Wirkung des Loslassens; `null`: kein Ziel. */
export function dropEffect(source: DragSource, target: DropTarget): 'move' | 'copy' | null {
  if (source === 'mine') return target.kind === 'workbook' ? 'move' : null;
  return target.kind === 'mine' ? 'copy' : null;
}

interface Drag {
  song: Song;
  source: DragSource;
  x: number;
  y: number;
  /** Ziel unter dem Zeiger, nur wenn Loslassen dort wirkt. */
  target: DropTarget | null;
}

interface SongDragValue {
  drag: Drag | null;
  begin: (song: Song, source: DragSource, e: ReactPointerEvent) => void;
}

const SongDragContext = createContext<SongDragValue | null>(null);

/** Ziehen von Kacheln: aus „Meine Songs“ auf Workbooks, aus Workbooks auf „Meine Songs“ (copy-song, design.md D4). */
export function SongDragProvider({ children }: { children: ReactNode }) {
  const hitTest = useContext(HitTestContext);
  const { copy, move } = useSongTransfer();
  const { workbooks } = useNotebook();
  const [drag, setDrag] = useState<Drag | null>(null);

  const targetAt = useCallback(
    (source: DragSource, x: number, y: number): DropTarget | null => {
      const element = hitTest(x, y)?.closest('[data-drop-workbook], [data-drop-mine]');
      const id = element?.getAttribute('data-drop-workbook');
      const target: DropTarget | null = id ? { kind: 'workbook', id } : element ? { kind: 'mine' } : null;
      return target && dropEffect(source, target) ? target : null;
    },
    [hitTest],
  );

  const begin = useCallback(
    (song: Song, source: DragSource, e: ReactPointerEvent) => {
      if (e.button !== 0 || e.pointerType === 'touch') return;
      // Knöpfe der Kachel („Zu Workbook …“) starten kein Ziehen, der Titel schon
      const button = (e.target as Element).closest('button');
      if (button && !button.classList.contains('tile-open')) return;
      const start = { x: e.clientX, y: e.clientY };
      let state: Drag | null = null;

      const finish = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onCancel);
        document.removeEventListener('keydown', onKey);
        document.body.classList.remove('dragging-pattern');
        setDrag(null);
      };
      // Der Klick nach einem Ziehen öffnet den Song nicht; der Abfänger endet spätestens beim nächsten pointerdown
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
        // Dieselbe Klasse wie beim Ziehen von Patterns: kein Markieren von Text, Greif-Zeiger
        if (!state) {
          document.body.classList.add('dragging-pattern');
          window.getSelection()?.removeAllRanges();
        }
        state = { song, source, x: ev.clientX, y: ev.clientY, target: targetAt(source, ev.clientX, ev.clientY) };
        setDrag(state);
      };
      const onUp = (ev: PointerEvent) => {
        const dragged = state;
        finish();
        if (!dragged) return;
        swallowClick();
        const target = targetAt(source, ev.clientX, ev.clientY);
        if (!target) return;
        if (dropEffect(source, target) === 'copy') void copy(song);
        const workbook = target.kind === 'workbook' && workbooks.find((w) => w.id === target.id);
        if (workbook) void move(song, workbook);
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
    [targetAt, copy, move, workbooks],
  );

  const value = useMemo(() => ({ drag, begin }), [drag, begin]);
  return (
    <SongDragContext.Provider value={value}>
      {children}
      {drag && (
        <div className="drag-tile" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <div className="motif-area">
            <SongMotif song={drag.song} />
          </div>
          <div className="tile-text">
            <b>{drag.song.title}</b>
          </div>
        </div>
      )}
    </SongDragContext.Provider>
  );
}

/** Ziehquelle einer Kachel; ohne Provider (abgemeldet) bleibt sie eine gewöhnliche Kachel. */
export function useSongDragSource(song: Song, source: DragSource) {
  const context = useContext(SongDragContext);
  if (!context) return { dragging: false, props: {} };
  return {
    dragging: context.drag?.song.id === song.id,
    props: { onPointerDown: (e: ReactPointerEvent) => context.begin(song, source, e) },
  };
}

/** Ob gerade über diesem Ziel gezogen wird und Loslassen dort wirkt. */
export function useIsDropTarget(target: DropTarget): boolean {
  const current = useContext(SongDragContext)?.drag?.target;
  if (!current || current.kind !== target.kind) return false;
  return current.kind === 'mine' || (target.kind === 'workbook' && current.id === target.id);
}
