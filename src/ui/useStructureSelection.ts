import { useState } from 'react';
import { allBars } from '../domain/songPatterns';
import type { Song } from '../domain/types';

export type StructureSelection =
  | { kind: 'none' }
  | { kind: 'segment'; segmentId: string }
  | { kind: 'bars'; barIds: string[]; anchor: string };

const NONE: StructureSelection = { kind: 'none' };

/**
 * Auswahl der linken Seite (design.md D3): ein Segment oder Takte; Verschwundenes fällt heraus.
 * Das Popover der Auswahl kann geschlossen sein, während sie besteht (practice-playback, design.md D5).
 */
export function useStructureSelection(song: Song) {
  const [raw, setRaw] = useState<StructureSelection>(NONE);
  const [popoverOpen, setPopoverOpen] = useState(true);
  const order = allBars(song).map((b) => b.id);

  let selection = raw;
  if (raw.kind === 'segment' && !song.segments.some((s) => s.id === raw.segmentId)) selection = NONE;
  if (raw.kind === 'bars') {
    const barIds = raw.barIds.filter((id) => order.includes(id));
    selection = barIds.length > 0 ? { ...raw, barIds } : NONE;
  }

  /** Klick wählt einen Takt, Shift+Klick einen Bereich in Songreihenfolge ab dem Anker; Klick in die Auswahl öffnet ihr geschlossenes Popover. */
  const selectBar = (barId: string, extend: boolean) => {
    setPopoverOpen(true);
    if (!extend && !popoverOpen && selection.kind === 'bars' && selection.barIds.includes(barId)) return;
    if (extend && selection.kind === 'bars' && order.includes(selection.anchor)) {
      const [from, to] = [order.indexOf(selection.anchor), order.indexOf(barId)].sort((a, b) => a - b);
      setRaw({ kind: 'bars', barIds: order.slice(from!, to! + 1), anchor: selection.anchor });
    } else {
      setRaw({ kind: 'bars', barIds: [barId], anchor: barId });
    }
  };

  return {
    selection,
    selectBar,
    selectSegment: (segmentId: string) => {
      setPopoverOpen(true);
      setRaw({ kind: 'segment', segmentId });
    },
    clear: () => setRaw(NONE),
    popoverOpen,
    /** Schließt das Popover, die Auswahl bleibt. */
    closePopover: () => setPopoverOpen(false),
  };
}

export type StructureSelectionState = ReturnType<typeof useStructureSelection>;

/** Erster und letzter Takt der Auswahl in Songreihenfolge; null ohne Auswahl oder bei leerem Segment. */
export function selectionBounds(song: Song, selection: StructureSelection): { first: string; last: string } | null {
  const ids =
    selection.kind === 'bars'
      ? allBars(song).filter((b) => selection.barIds.includes(b.id)).map((b) => b.id)
      : selection.kind === 'segment'
        ? (song.segments.find((s) => s.id === selection.segmentId)?.blocks.flatMap((b) => b.bars.map((bar) => bar.id)) ?? [])
        : [];
  return ids.length > 0 ? { first: ids[0]!, last: ids.at(-1)! } : null;
}
