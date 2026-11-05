import { createContext, useCallback, useContext, useMemo, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { Song } from '../domain/types';
import type { WorkbookActions } from '../sync/sync';
import { HitTestContext } from './dragPattern';
import { SongMotif } from './SongMotif';
import { useReportedAction } from './WorkbookCard';

/** Ab dieser Bewegung (px) wird aus einem Klick ein Ziehen, wie bei den Pattern-Karten. */
const DRAG_THRESHOLD = 5;

interface Drag {
  song: Song;
  x: number;
  y: number;
  /** Workbook unter dem Zeiger, falls dort ein Ziel liegt. */
  target: string | null;
}

interface SongDragValue {
  drag: Drag | null;
  begin: (song: Song, e: ReactPointerEvent) => void;
}

const SongDragContext = createContext<SongDragValue | null>(null);

/** Ziehen von Kacheln aus „Meine Songs“ auf Workbooks (song-overview-tiles, design.md D6). */
export function SongDragProvider({ sync, children }: { sync: WorkbookActions; children: ReactNode }) {
  const hitTest = useContext(HitTestContext);
  const run = useReportedAction();
  const [drag, setDrag] = useState<Drag | null>(null);

  const targetAt = useCallback(
    (x: number, y: number) => hitTest(x, y)?.closest('[data-drop-workbook]')?.getAttribute('data-drop-workbook') ?? null,
    [hitTest],
  );

  const begin = useCallback(
    (song: Song, e: ReactPointerEvent) => {
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
        state = { song, x: ev.clientX, y: ev.clientY, target: targetAt(ev.clientX, ev.clientY) };
        setDrag(state);
      };
      const onUp = (ev: PointerEvent) => {
        const dragged = state;
        finish();
        if (!dragged) return;
        swallowClick();
        const target = targetAt(ev.clientX, ev.clientY);
        if (target) void run(() => sync.moveSong(song.id, target));
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
    [targetAt, run, sync],
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

/** Ziehquelle einer Kachel; ohne Provider (keine Workbooks) bleibt sie eine gewöhnliche Kachel. */
export function useSongDragSource(song: Song) {
  const context = useContext(SongDragContext);
  if (!context) return { dragging: false, props: {} };
  return {
    dragging: context.drag?.song.id === song.id,
    props: { onPointerDown: (e: ReactPointerEvent) => context.begin(song, e) },
  };
}

/** Workbook, über dem gerade gezogen wird. */
export function useDropTarget(): string | null {
  return useContext(SongDragContext)?.drag?.target ?? null;
}
