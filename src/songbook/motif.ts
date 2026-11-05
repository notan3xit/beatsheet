import type { PatternColor, Song } from '../domain/types';
import { layoutStructure } from './layout';

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
