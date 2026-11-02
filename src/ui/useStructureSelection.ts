import { useState } from 'react';
import { allBars } from '../domain/songPatterns';
import type { Song } from '../domain/types';

export type StructureSelection =
  | { kind: 'none' }
  | { kind: 'segment'; segmentId: string }
  | { kind: 'bars'; barIds: string[]; anchor: string };

const NONE: StructureSelection = { kind: 'none' };

/** Auswahl der linken Seite (design.md D3): ein Segment oder Takte; Verschwundenes fällt heraus. */
export function useStructureSelection(song: Song) {
  const [raw, setRaw] = useState<StructureSelection>(NONE);
  const order = allBars(song).map((b) => b.id);

  let selection = raw;
  if (raw.kind === 'segment' && !song.segments.some((s) => s.id === raw.segmentId)) selection = NONE;
  if (raw.kind === 'bars') {
    const barIds = raw.barIds.filter((id) => order.includes(id));
    selection = barIds.length > 0 ? { ...raw, barIds } : NONE;
  }

  /** Klick wählt einen Takt, Shift+Klick einen Bereich in Songreihenfolge ab dem Anker. */
  const selectBar = (barId: string, extend: boolean) => {
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
    selectSegment: (segmentId: string) => setRaw({ kind: 'segment', segmentId }),
    clear: () => setRaw(NONE),
  };
}
