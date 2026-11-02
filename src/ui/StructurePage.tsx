import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { allBars } from '../domain/songPatterns';
import { insertSegmentAfter } from '../domain/structure';
import type { Song } from '../domain/types';
import { layoutStructure, type BarEdges, type FillItem, type Item, type Row, type SegmentLayout } from '../songbook/layout';
import { patternStyle } from './patternStyle';
import { BarPopover, Popover, POPOVER_BEATS, SegmentPopover } from './StructurePopovers';
import { useOpenSong, useStore } from './useLibrary';
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

function FillBlock({ item }: { item: FillItem }) {
  const classes = ['item', 'fill', item.continuesLeft && 'continues-left', item.continuesRight && 'continues-right'];
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
      <span className="item-label">{item.label}</span>
    </div>
  );
}

function RowItem({ item }: { item: Item }) {
  switch (item.kind) {
    case 'groove':
      return (
        <div className="item groove" style={{ ...placeInset(item), ...patternStyle(item.color) }} title={item.label}>
          <span className="item-label">{item.label}</span>
          {item.startBeat !== null && (
            <span className="start-beat">
              <span className="visually-hidden">ab Beat </span>
              {item.startBeat}
            </span>
          )}
        </div>
      );
    case 'empty':
      // unsichtbar, nur Platzhalter für die Taktbreite
      return <div className="item empty" style={place(item.x, item.width)} />;
    case 'fill':
      return <FillBlock item={item} />;
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
  /** Popover der Takt-Auswahl, wenn es in dieser Zeile verankert ist. */
  barPopover: (row: Row) => ReactNode;
}

const barSelected = (selection: StructureSelection, barId: string) =>
  selection.kind === 'bars' && selection.barIds.includes(barId);

function StructureRow({ row, selection }: { row: Row; selection: Selection }) {
  return (
    <div
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
          className="bar-frame"
          style={place(bar.x, bar.width)}
          aria-label={`Takt ${bar.index + 1}`}
          aria-pressed={barSelected(selection.current, bar.barId)}
          onClick={(e) => selection.selectBar(bar.barId, e.shiftKey)}
        />
      ))}
      {row.items.map((item, i) => (
        <RowItem key={i} item={item} />
      ))}
      {selection.barPopover(row)}
    </div>
  );
}

function SegmentView({ segment, selection }: { segment: SegmentLayout; selection: Selection }) {
  const selected = selection.current.kind === 'segment' && selection.current.segmentId === segment.segmentId;
  return (
    <div className="segment">
      <div className="segment-head">
        <h3 className="segment-name">
          <button
            type="button"
            className="segment-select"
            aria-pressed={selected}
            onClick={() => selection.selectSegment(segment.segmentId)}
          >
            {segment.name}
          </button>
        </h3>
        {selected && (
          <Popover label={`Segment ${segment.name}`} x={0}>
            <SegmentPopover segmentId={segment.segmentId} onSelectSegment={selection.selectSegment} />
          </Popover>
        )}
      </div>
      {segment.rows.map((row, r) => (
        <StructureRow key={r} row={row} selection={selection} />
      ))}
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
      if (inside.current?.contains(target) || target?.closest('.backdrop')) return;
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
  const layout = layoutStructure(song);
  const { selection, selectBar, selectSegment, clear } = useStructureSelection(song);
  const page = useRef<HTMLElement>(null);
  useDismiss(selection.kind !== 'none', page, clear);

  const anchor = selection.kind === 'bars' ? barAnchor(layout, song, selection.barIds) : null;
  const barPopover = (row: Row) =>
    anchor?.row === row &&
    selection.kind === 'bars' && (
      <Popover label="Takt-Auswahl" x={anchor.x}>
        <BarPopover barIds={selection.barIds} />
      </Popover>
    );

  // Klick auf eine freie Stelle der Seite hebt die Auswahl ebenfalls auf
  const onPagePointerDown = (e: ReactPointerEvent) => {
    if (!(e.target as Element).closest('button, input, select, label, [role="dialog"]')) clear();
  };

  return (
    <section ref={page} className="page structure-page" aria-label="Struktur" onPointerDown={onPagePointerDown}>
      {layout.length === 0 && (
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
          selection={{ current: selection, selectBar, selectSegment, barPopover }}
        />
      ))}
    </section>
  );
}
