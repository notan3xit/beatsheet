import { createContext, useCallback, useContext, useMemo, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { placeAt, slotAt } from '../domain/songOrder';
import type { Song } from '../domain/types';
import { HitTestContext } from './dragPattern';
import { SongMotif } from './SongMotif';
import { useSongTransfer } from './songTransfer';
import { useActivity } from './useActivity';
import { useNotebook } from './useLibrary';
import { useSync } from './useWorkbooks';

/** Ab dieser Bewegung (px) wird aus einem Klick ein Ziehen, wie bei den Pattern-Karten. */
const DRAG_THRESHOLD = 5;

/** Herkunft einer gezogenen Kachel: „Meine Songs“ oder die ID ihres Workbooks. */
export type DragSource = 'mine' | (string & {});

/** Bereich mit Kacheln: „Meine Songs“ oder ein Workbook. */
export type DropArea = { kind: 'workbook'; id: string } | { kind: 'mine' };

/** Fläche unter dem Zeiger; über Kacheln mit dem Platz der Einfügemarke (sort-songs, design.md D6). */
export type DropTarget = DropArea & { slot?: number };

export type DropEffect = 'move' | 'copy' | 'reorder';

/** Wirkung des Loslassens; `null`: kein Ziel (sort-songs, design.md D6). */
export function dropEffect(source: DragSource, target: DropTarget): DropEffect | null {
  if (source === 'mine') {
    if (target.kind === 'workbook') return 'move';
    return target.slot === undefined ? null : 'reorder';
  }
  if (target.kind === 'mine') return 'copy';
  return target.id === source && target.slot !== undefined ? 'reorder' : null;
}

interface Drag {
  song: Song;
  source: DragSource;
  x: number;
  y: number;
  /** Ziel unter dem Zeiger, nur wenn Loslassen dort wirkt. */
  target: DropTarget | null;
  effect: DropEffect | null;
}

interface SongDragValue {
  drag: Drag | null;
  begin: (song: Song, source: DragSource, e: ReactPointerEvent) => void;
}

const SongDragContext = createContext<SongDragValue | null>(null);

/** Kacheln eines Bereichs in Anzeigereihenfolge, ohne „+ Song“. */
const tilesIn = (area: Element) => [...(area.querySelector('.tiles')?.querySelectorAll<HTMLElement>(':scope > [data-song-id]') ?? [])];

const sameArea = (a: DropArea, b: DropArea) => a.kind === b.kind && (a.kind === 'mine' || (b.kind === 'workbook' && a.id === b.id));

/** Ziehen von Kacheln: zwischen „Meine Songs“ und Workbooks und innerhalb eines Bereichs (copy-song D4, sort-songs D6, D8). */
export function SongDragProvider({ children }: { children: ReactNode }) {
  const hitTest = useContext(HitTestContext);
  const { copy, move } = useSongTransfer();
  const { workbooks } = useNotebook();
  const sync = useSync();
  const activity = useActivity();
  const [drag, setDrag] = useState<Drag | null>(null);

  const targetAt = useCallback(
    (source: DragSource, x: number, y: number) => {
      const element = hitTest(x, y)?.closest('[data-drop-workbook], [data-drop-mine]');
      if (!element) return null;
      const id = element.getAttribute('data-drop-workbook');
      const area: DropArea = id ? { kind: 'workbook', id } : { kind: 'mine' };
      const hasTiles = element.querySelector('.tiles') !== null;
      const target: DropTarget = hasTiles ? { ...area, slot: slotAt(tilesIn(element).map((tile) => tile.getBoundingClientRect()), x, y) } : area;
      const effect = dropEffect(source, target);
      return effect ? { target, effect, element } : null;
    },
    [hitTest],
  );

  /** Stellt `songId` an den Platz des Ziels; `ids` ist die Anzeige beim Loslassen (sort-songs, design.md D8). */
  const placeIn = useCallback(
    (workbookId: string | undefined, ids: string[], songId: string, slot: number) => {
      const positions = workbookId ? activity.order(workbookId) : null;
      if (!sync || !workbookId || !positions) return;
      const from = ids.indexOf(songId);
      const list = ids.filter((id) => id !== songId);
      sync.reorder(workbookId, placeAt(list, positions, songId, from !== -1 && slot > from ? slot - 1 : slot));
    },
    [activity, sync],
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
        const hit = targetAt(source, ev.clientX, ev.clientY);
        state = { song, source, x: ev.clientX, y: ev.clientY, target: hit?.target ?? null, effect: hit?.effect ?? null };
        setDrag(state);
      };
      const onUp = (ev: PointerEvent) => {
        const dragged = state;
        finish();
        if (!dragged) return;
        swallowClick();
        const hit = targetAt(source, ev.clientX, ev.clientY);
        if (!hit) return;
        const { target, effect, element } = hit;
        const ids = tilesIn(element).map((tile) => tile.dataset.songId!);
        const slot = target.slot;
        const personalId = workbooks.find((w) => w.personal)?.id;
        if (effect === 'reorder') {
          const from = ids.indexOf(song.id);
          if (slot === undefined || slot === from || slot === from + 1) return;
          placeIn(target.kind === 'mine' ? personalId : target.id, ids, song.id, slot);
          return;
        }
        if (effect === 'copy') {
          void copy(song).then((created) => {
            if (created && slot !== undefined) placeIn(personalId, ids, created.id, slot);
          });
          return;
        }
        const workbook = target.kind === 'workbook' && workbooks.find((w) => w.id === target.id);
        if (!workbook) return;
        void move(song, workbook).then((moved) => {
          if (moved && slot !== undefined) placeIn(workbook.id, ids, song.id, slot);
        });
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
    [targetAt, placeIn, copy, move, workbooks],
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

/** Ob gerade über diesem Ziel gezogen wird und Loslassen dort verschiebt oder kopiert; Sortieren hebt nichts hervor. */
export function useIsDropTarget(area: DropArea): boolean {
  const drag = useContext(SongDragContext)?.drag;
  if (!drag?.target || (drag.effect !== 'move' && drag.effect !== 'copy')) return false;
  return sameArea(drag.target, area);
}

/** Platz der Einfügemarke in diesem Bereich; `null` ohne wirksames Ziel mit Platz (sort-songs, design.md D7). */
export function useDropSlot(area: DropArea | undefined): number | null {
  const target = useContext(SongDragContext)?.drag?.target;
  if (!area || !target || target.slot === undefined || !sameArea(target, area)) return null;
  return target.slot;
}
