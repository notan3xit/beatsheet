import { useMemo, type CSSProperties } from 'react';
import type { Song } from '../domain/types';
import { BEATS_PER_ROW } from '../songbook/layout';
import { songMotif } from '../songbook/motif';
import { patternStyle } from './patternStyle';

const percent = (beats: number) => `${(beats / BEATS_PER_ROW) * 100}%`;

/** Punktmuster eines Songs ohne Segmente. */
const EMPTY_ROWS = 3;
const EMPTY_DOTS = [0.5, 2.5, 4.5];

/** Stilisiertes Motiv der Song-Struktur (song-overview-tiles, design.md D2); rein dekorativ. */
export function SongMotif({ song }: { song: Song }) {
  const rows = useMemo(() => songMotif(song), [song]);
  if (rows.length === 0) {
    return (
      <div className="motif empty" aria-hidden="true">
        {Array.from({ length: EMPTY_ROWS }, (_, r) => (
          <div key={r} className="motif-row">
            {EMPTY_DOTS.map((x) => (
              <i key={x} className="motif-dot" style={{ left: percent(x) }} />
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="motif" aria-hidden="true">
      {rows.map((row, r) => (
        <div key={r} className="motif-row">
          {row.strokes.map((stroke) => (
            <i
              key={stroke.x}
              className={`motif-stroke ${stroke.kind}`}
              style={
                {
                  left: `calc(${percent(stroke.x)} + var(--motif-gap))`,
                  width: `calc(${percent(stroke.width)} - 2 * var(--motif-gap))`,
                  ...patternStyle(stroke.color),
                } as CSSProperties
              }
            />
          ))}
          {row.dots.map((x) => (
            <i key={x} className="motif-dot" style={{ left: percent(x) }} />
          ))}
        </div>
      ))}
    </div>
  );
}
