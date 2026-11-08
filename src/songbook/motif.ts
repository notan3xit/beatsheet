import type { PatternColor, Song } from '../domain/types';
import { BEATS_PER_ROW, layoutStructure } from './layout';

/** Strich des Motivs; Lage und Länge in Beats, relativ zum Zeilenanfang. */
export interface MotifStroke {
  x: number;
  width: number;
  color: PatternColor;
  kind: 'groove' | 'fill';
}

/** Eine Reihe des Motivs je Zeile der Strukturseite; Punkte für leere Takte (Taktmitte in Beats). */
export interface MotifRow {
  strokes: MotifStroke[];
  dots: number[];
}

/** Mehr Reihen zeigt keine Kachel; längere Songs zeigen ihren Anfang (design.md D2). */
export const MOTIF_MAX_ROWS = 12;

/** Stilisiertes Motiv eines Songs (song-overview-tiles, design.md D1): Zeilen wie die Strukturseite, ohne Taktraster. */
export function songMotif(song: Song): MotifRow[] {
  return layoutStructure(song).flatMap((segment) =>
    segment.rows.map((row) => {
      const strokes: (MotifStroke & { patternId: string })[] = [];
      const dots: number[] = [];
      for (const item of row.items) {
        if (item.kind === 'empty') dots.push(item.x + item.width / 2);
        if (item.kind !== 'groove' && item.kind !== 'fill') continue;
        const last = strokes.at(-1);
        if (item.kind === 'groove' && last?.kind === 'groove' && last.patternId === item.patternId && last.x + last.width === item.x) {
          last.width += item.width;
        } else {
          strokes.push({ x: item.x, width: item.width, color: item.color, kind: item.kind, patternId: item.patternId });
        }
      }
      strokes.sort((a, b) => a.x - b.x);
      return { strokes: strokes.map(({ patternId: _, ...stroke }) => stroke), dots };
    }),
  ).slice(0, MOTIF_MAX_ROWS);
}

/** Ein Takt im Motiv des Verlaufs; Lage und Länge in Beats, relativ zum Zeilenanfang. */
export interface HistoryMotifBar {
  barId: string;
  /** Laufende Taktnummer im Song, ab 1. */
  number: number;
  x: number;
  width: number;
  groove: { patternId: string; color: PatternColor } | null;
  /** Der Fill endet am Taktende und reicht höchstens über den Takt. */
  fill: { patternId: string; color: PatternColor; x: number; width: number } | null;
}

export interface HistoryMotifSegment {
  segmentId: string;
  name: string;
  rows: HistoryMotifBar[][];
}

/**
 * Motiv für den Vergleich im Verlauf (song-history, design.md D8): wie die Kachel Zeilen zu 16 Beats, jeder Block in
 * einer neuen Zeile, aber mit Segmentnamen, ohne Zeilengrenze und je Takt ein Element.
 */
export function historyMotif(song: Song): HistoryMotifSegment[] {
  const patterns = new Map(song.patterns.map((p) => [p.id, p]));
  let number = 0;
  return song.segments.map((segment) => {
    const rows: HistoryMotifBar[][] = [];
    for (const block of segment.blocks) {
      let row: HistoryMotifBar[] = [];
      let x = 0;
      for (const bar of block.bars) {
        if (row.length > 0 && x + bar.beats > BEATS_PER_ROW) {
          rows.push(row);
          row = [];
          x = 0;
        }
        const groove = bar.grooveId ? patterns.get(bar.grooveId) : undefined;
        const fill = bar.fillId ? patterns.get(bar.fillId) : undefined;
        const fillWidth = fill ? Math.min(fill.beats.length, bar.beats) : 0;
        row.push({
          barId: bar.id,
          number: ++number,
          x,
          width: bar.beats,
          groove: groove ? { patternId: groove.id, color: groove.color } : null,
          fill: fill ? { patternId: fill.id, color: fill.color, x: x + bar.beats - fillWidth, width: fillWidth } : null,
        });
        x += bar.beats;
      }
      if (row.length > 0) rows.push(row);
    }
    return { segmentId: segment.id, name: segment.name, rows };
  });
}
