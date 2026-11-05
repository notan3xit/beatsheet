import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { allBars } from '../domain/songPatterns';
import { appendBlockLike, insertBarAfter, insertBarBefore, insertSegmentAfter } from '../domain/structure';
import type { Song } from '../domain/types';
import { layoutStructure, type BarEdges, type FillItem, type Item, type Row, type SegmentLayout } from '../songbook/layout';
import { useDropTargets } from './dragPattern';
import { patternStyle } from './patternStyle';
import { PlayheadLine, useSongPlayback } from './playback';
import { BarPopover, Popover, POPOVER_BEATS, SegmentPopover } from './StructurePopovers';
import { openSongOf } from '../state/notebookStore';
import { useNotebook, useOpenSong, useStore } from './useLibrary';
import { useStructureSelection, type StructureSelection } from './useStructureSelection';

/** Position und Breite in Beats als CSS (Einheit --beat). */
const place = (x: number, width?: number): CSSProperties => ({
  left: `calc(var(--beat) * ${x})`,
  ...(width !== undefined ? { width: `calc(var(--beat) * ${width})` } : {}),
});

/**
 * Wie place, aber an Taktgrenzen um --item-gap eingerückt, damit Balken nicht an Taktstriche stoßen.
 * Wo ein Fill im selben Takt an den Groove anschließt, bleibt die Kante bündig: der Fill übernimmt dort.
 */
const placeInset = (item: { x: number; width: number } & BarEdges): CSSProperties => {
  const left = item.atBarStart ? 1 : 0;
  const right = item.atBarEnd ? 1 : 0;
  return {
    left: `calc(var(--beat) * ${item.x} + var(--item-gap) * ${left})`,
    width: `calc(var(--beat) * ${item.width} - var(--item-gap) * ${left + right})`,
  };
};

function FillBlock({ item, highlighted }: { item: FillItem; highlighted: boolean }) {
  const classes = [
    'item',
    'fill',
    item.continuesLeft && 'continues-left',
    item.continuesRight && 'continues-right',
    highlighted && 'highlighted',
  ];
  return (
    <div
      className={classes.filter(Boolean).join(' ')}
      style={{ ...placeInset(item), ...patternStyle(item.color) }}
      title={item.label}
    >
      {item.barlines.map((x) => (
        // relativ zum Fill-Block; ist er links eingerückt, um --item-gap zurück auf die Taktgrenze
        <span
          key={x}
          className="inner-barline"
          style={{ left: `calc(var(--beat) * ${x - item.x} - var(--item-gap) * ${item.atBarStart ? 1 : 0})` }}
        />
      ))}
      {/* Kurzschrift statt Name (Name als Tooltip); wie die Taktstriche relativ zur Taktgrenze */}
      <span className="shorthand" aria-hidden="true">
        {item.marks.map((m, i) => (
          <span
            key={i}
            className={`mark level-${m.level}`}
            style={{ left: `calc(var(--beat) * ${m.x} - var(--item-gap) * ${item.atBarStart ? 1 : 0})` }}
          >
            {m.char}
          </span>
        ))}
      </span>
    </div>
  );
}

/** Hervorhebung von Auswahl und Ablegeziel an den Balken selbst (selection-highlight D1–D3). */
function RowItem({ item, isHighlighted }: { item: Item; isHighlighted: (barId: string) => boolean }) {
  switch (item.kind) {
    case 'groove':
      return (
        <div
          className={`item groove${isHighlighted(item.barId) ? ' highlighted' : ''}`}
          data-bar-id={item.barId}
          style={{ ...placeInset(item), ...patternStyle(item.color) }}
          title={item.label}
        >
          {/* Name nur am Segmentanfang und bei Groove-Wechsel, sonst nur als Tooltip */}
          {item.showLabel && <span className="item-label">{item.label}</span>}
          {item.startBeat !== null && (
            <span className="start-beat" title={`Takt beginnt mit Beat ${item.startBeat} des Grooves`}>
              ab {item.startBeat}
            </span>
          )}
        </div>
      );
    case 'empty':
      // unsichtbar, nur Platzhalter für die Taktbreite; hervorgehoben als grauer Schatten-Groove
      return isHighlighted(item.barId) ? (
        <div
          className="item ghost"
          data-bar-id={item.barId}
          style={placeInset({ ...item, atBarStart: true, atBarEnd: true })}
        />
      ) : (
        <div className="item empty" style={place(item.x, item.width)} />
      );
    case 'fill':
      return <FillBlock item={item} highlighted={item.barIds.some(isHighlighted)} />;
    case 'accent':
      return (
        <span className="accent" style={place(item.x)}>
          {item.label}
        </span>
      );
  }
}

interface Selection {
  current: StructureSelection;
  selectBar: (barId: string, extend: boolean) => void;
  selectSegment: (segmentId: string) => void;
  /** Hebt die Auswahl auf und schließt damit das Popover. */
  clear: () => void;
  /** Popover der Takt-Auswahl, wenn es in dieser Zeile verankert ist. */
  barPopover: (row: Row) => ReactNode;
  hover: Hover;
  setHover: (change: (hover: Hover) => Hover) => void;
  /** Takte, auf die ein gezogenes Pattern gerade fiele. */
  dropTargets: ReadonlySet<string>;
  /** Takt, den die Song-Wiedergabe gerade spielt. */
  playingBarId: string | null;
  locked: boolean;
}

/** Was die Maus gerade überfährt (design.md D1); Touch und Stift erzeugen keinen Hover. */
interface Hover {
  segmentId: string | null;
  rowKey: string | null;
}

const rowKey = (row: Row) => `${row.blockId}:${row.bars[0]!.barId}`;

/**
 * Hover nur bei Maus, über die nativen pointerenter/pointerleave des Elements. Die blubbern nicht
 * und hängen nicht wie Reacts onPointerEnter/-Leave vom relatedTarget von pointerover/-out ab.
 */
function useMouseHover<T extends HTMLElement>(enter: () => void, leave: () => void) {
  const ref = useRef<T>(null);
  const handlers = useRef({ enter, leave });
  handlers.current = { enter, leave };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnter = (e: PointerEvent) => e.pointerType === 'mouse' && handlers.current.enter();
    const onLeave = (e: PointerEvent) => e.pointerType === 'mouse' && handlers.current.leave();
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return ref;
}

/** Kreis mit Plus als SVG, damit es bei jedem Zoom scharf und mittig bleibt. */
function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7.5" strokeWidth="1" />
      <path d="M4.5 8h7M8 4.5v7" strokeWidth="1.75" />
    </svg>
  );
}

/** (+) auf den Taktstrichen einer überfahrenen Zeile. */
function BarInsertButtons({ row }: { row: Row }) {
  const store = useStore();
  const first = row.bars[0]!;
  return (
    <>
      {row.firstInBlock && (
        <button
          type="button"
          className="insert-bar"
          style={place(0)}
          aria-label={`Takt vor Takt ${first.index + 1} einfügen`}
          title="Takt davor einfügen"
          onClick={() => store.updateSong((s) => insertBarBefore(s, first.barId))}
        >
          <PlusIcon />
        </button>
      )}
      {row.bars.map((bar) => (
        <button
          key={bar.barId}
          type="button"
          className="insert-bar"
          style={place(bar.x + bar.width)}
          aria-label={`Takt nach Takt ${bar.index + 1} einfügen`}
          title="Takt einfügen"
          onClick={() => store.updateSong((s) => insertBarAfter(s, bar.barId))}
        >
          <PlusIcon />
        </button>
      ))}
    </>
  );
}

const barSelected = (selection: StructureSelection, barId: string) =>
  selection.kind === 'bars' && selection.barIds.includes(barId);

function StructureRow({ row, selection }: { row: Row; selection: Selection }) {
  const key = rowKey(row);
  const { hover, setHover } = selection;
  const isHighlighted = (barId: string) => barSelected(selection.current, barId) || selection.dropTargets.has(barId);
  const ref = useMouseHover<HTMLDivElement>(
    () => setHover((h) => ({ ...h, rowKey: key })),
    () => setHover((h) => (h.rowKey === key ? { ...h, rowKey: null } : h)),
  );
  return (
    <div
      ref={ref}
      className={`structure-row${row.blockStart ? ' block-start' : ''}`}
      style={{ width: `calc(var(--beat) * ${row.width})` }}
    >
      <span className="row-number" aria-hidden="true">
        {row.bars[0]!.index + 1}
      </span>
      {row.bars.map((bar) => (
        <button
          key={bar.barId}
          type="button"
          className={`bar-frame${selection.dropTargets.has(bar.barId) ? ' drop-target' : ''}${
            selection.playingBarId === bar.barId ? ' playing' : ''
          }`}
          data-bar-id={bar.barId}
          data-read-safe=""
          style={place(bar.x, bar.width)}
          aria-label={`Takt ${bar.index + 1}`}
          aria-pressed={barSelected(selection.current, bar.barId)}
          onClick={(e) => selection.selectBar(bar.barId, e.shiftKey)}
        />
      ))}
      {/* Schlussstrich als linke Kante bei x = Zeilenbreite, damit er auf derselben Linie liegt wie die Trennstriche */}
      <span className="row-end" style={place(row.width)} aria-hidden="true" />
      {row.items.map((item, i) => (
        <RowItem key={i} item={item} isHighlighted={isHighlighted} />
      ))}
      {row.bars
        .filter((bar) => bar.barId === selection.playingBarId)
        .map((bar) => (
          <PlayheadLine key={bar.barId} barId={bar.barId} x={bar.x} width={bar.width} />
        ))}
      {!selection.locked && hover.rowKey === key && <BarInsertButtons row={row} />}
      {selection.barPopover(row)}
    </div>
  );
}

function SegmentView({ segment, selection }: { segment: SegmentLayout; selection: Selection }) {
  const store = useStore();
  const id = segment.segmentId;
  const selected = selection.current.kind === 'segment' && selection.current.segmentId === id;
  const hovered = selection.hover.segmentId === id;

  const insertSegment = () => {
    store.updateSong((s) => insertSegmentAfter(s, id));
    const segments = openSongOf(store.getState())?.segments ?? [];
    const created = segments[segments.findIndex((s) => s.id === id) + 1];
    if (created) selection.selectSegment(created.id);
  };

  const ref = useMouseHover<HTMLDivElement>(
    () => selection.setHover((h) => ({ ...h, segmentId: id })),
    () => selection.setHover((h) => (h.segmentId === id ? { segmentId: null, rowKey: null } : h)),
  );

  return (
    <div ref={ref} className="segment">
      <div className="segment-head">
        <h3 className="segment-name">
          <button
            type="button"
            className="segment-select"
            data-read-safe=""
            aria-pressed={selected}
            onClick={() => selection.selectSegment(segment.segmentId)}
          >
            {segment.name}
          </button>
        </h3>
        {selected && (
          <Popover label={`Segment ${segment.name}`} x={0}>
            <SegmentPopover segmentId={segment.segmentId} onSelectSegment={selection.selectSegment} onPlay={selection.clear} />
          </Popover>
        )}
      </div>
      {segment.rows.map((row, r) => (
        <StructureRow key={r} row={row} selection={selection} />
      ))}
      {/* Nur beim Überfahren im DOM, damit die Leseansicht ohne Hover frei von Knöpfen bleibt */}
      <div className="insert-strips">
        {hovered && !selection.locked && (
          <>
            <button
              type="button"
              className="insert-strip"
              aria-label={`Block an ${segment.name} anfügen`}
              onClick={() => store.updateSong((s) => appendBlockLike(s, id))}
            >
              + Block
            </button>
            <button
              type="button"
              className="insert-strip"
              aria-label={`Segment nach ${segment.name} einfügen`}
              onClick={insertSegment}
            >
              + Segment
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Zeile und Position (in Beats) des Takt-Popovers: unter dem letzten ausgewählten Takt (design.md D4). */
function barAnchor(layout: SegmentLayout[], song: Song, barIds: readonly string[]) {
  const last = allBars(song).filter((b) => barIds.includes(b.id)).at(-1)?.id;
  const row = layout.flatMap((s) => s.rows).find((r) => r.bars.some((b) => b.barId === last));
  if (!row) return null;
  const x = row.bars.find((b) => barIds.includes(b.barId))!.x;
  return { row, x: Math.max(0, Math.min(x, row.width - POPOVER_BEATS)) };
}

/** Escape und Klick außerhalb von Struktur und Popover heben die Auswahl auf; offene Eingaben werden vorher übernommen. */
function useDismiss(active: boolean, inside: React.RefObject<HTMLElement | null>, clear: () => void) {
  useEffect(() => {
    if (!active) return;
    const dismiss = () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      clear();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss();
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element | null;
      // Ziehquellen lassen die Auswahl stehen, sonst ginge „auf die Auswahl ziehen“ nicht (design.md D3)
      if (inside.current?.contains(target) || target?.closest('.backdrop, [data-drag-source]')) return;
      dismiss();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [active, inside, clear]);
}

/** Linke Buchseite: die Song-Struktur kompakt und maßstabsgetreu; bearbeitet wird über die Auswahl. */
export function StructurePage() {
  const store = useStore();
  const song = useOpenSong();
  const { locked } = useNotebook();
  const layout = layoutStructure(song);
  const { selection, selectBar, selectSegment, clear } = useStructureSelection(song);
  const [hover, setHover] = useState<Hover>({ segmentId: null, rowKey: null });
  const dropTargets = useDropTargets((barId) =>
    selection.kind === 'bars' && selection.barIds.includes(barId) ? selection.barIds : [barId],
  );
  const page = useRef<HTMLElement>(null);
  useDismiss(selection.kind !== 'none', page, clear);
  const { barId: playingBarId } = useSongPlayback();
  // Laufenden Takt sichtbar halten; nearest scrollt nur, wenn er nicht ohnehin zu sehen ist (design.md D4)
  useEffect(() => {
    if (!playingBarId) return;
    page.current?.querySelector(`[data-bar-id="${CSS.escape(playingBarId)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [playingBarId]);

  const anchor = selection.kind === 'bars' ? barAnchor(layout, song, selection.barIds) : null;
  const barPopover = (row: Row) =>
    anchor?.row === row &&
    selection.kind === 'bars' && (
      <Popover label="Takt-Auswahl" x={anchor.x}>
        <BarPopover barIds={selection.barIds} onPlay={clear} />
      </Popover>
    );

  // Klick auf eine freie Stelle der Seite hebt die Auswahl ebenfalls auf
  const onPagePointerDown = (e: ReactPointerEvent) => {
    if (!(e.target as Element).closest('button, input, select, label, [role="dialog"]')) clear();
  };

  return (
    <section ref={page} className="page structure-page" aria-label="Struktur" onPointerDown={onPagePointerDown}>
      {!locked && layout.length === 0 && (
        <button
          type="button"
          className="primary"
          onClick={() => {
            store.updateSong((s) => insertSegmentAfter(s, null));
            const created = store.getState().songs.find((s) => s.id === song.id)?.segments[0];
            if (created) selectSegment(created.id);
          }}
        >
          Erstes Segment anlegen
        </button>
      )}
      {layout.map((segment) => (
        <SegmentView
          key={segment.segmentId}
          segment={segment}
          selection={{ current: selection, selectBar, selectSegment, clear, barPopover, hover, setHover, dropTargets, playingBarId, locked }}
        />
      ))}
    </section>
  );
}
