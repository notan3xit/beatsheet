import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { StructureMarks } from '../domain/history';
import type { PatternColor, Song } from '../domain/types';
import { BEATS_PER_ROW } from '../songbook/layout';
import { historyMotif, type HistoryMotifBar } from '../songbook/motif';
import { OldNew } from './OldNew';
import { patternStyle } from './patternStyle';

const percent = (beats: number) => `${(beats / BEATS_PER_ROW) * 100}%`;

const SEGMENT_MARK_LABEL = { added: 'neu', removed: 'entfernt', moved: 'verschoben' } as const;

interface Tip {
  text: string;
  x: number;
  y: number;
}

/**
 * Motiv der Struktur im Verlauf (song-history › Vergleich der Struktur, Takte im Motiv): hervorgehoben in Patternfarbe
 * nur, was `marks` als geändert nennt oder was `patternId` verwendet; alles Übrige neutral. Beim Überfahren eines Takts
 * erscheint sofort ein Hinweis mit Groove und Fill.
 */
export function HistoryMotif({
  song,
  marks,
  patternId,
  previous,
  label,
}: {
  song: Song;
  marks?: StructureMarks;
  patternId?: string;
  /** Stand vorher, für die alten Namen umbenannter Segmente. */
  previous?: Song | null;
  label?: string;
}) {
  const segments = useMemo(() => historyMotif(song), [song]);
  const names = useMemo(() => new Map(song.patterns.map((p) => [p.id, p.name])), [song]);
  const oldNames = useMemo(() => new Map((previous?.segments ?? []).map((s) => [s.id, s.name])), [previous]);
  const [tip, setTip] = useState<Tip | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const describe = (bar: HistoryMotifBar) => {
    const groove = bar.groove ? `Groove „${names.get(bar.groove.patternId)}“` : null;
    const fill = bar.fill ? `Fill „${names.get(bar.fill.patternId)}“` : null;
    return `Takt ${bar.number}: ${[groove, fill].filter(Boolean).join(' + ') || 'leer'}`;
  };

  const highlight = (bar: HistoryMotifBar, segmentMarked: boolean) => ({
    groove: patternId ? bar.groove?.patternId === patternId : segmentMarked || (marks?.bars.has(bar.barId) ?? false),
    fill: patternId ? bar.fill?.patternId === patternId : segmentMarked || (marks?.bars.has(bar.barId) ?? false),
  });

  const onMove = (event: PointerEvent<HTMLElement>, text: string) => setTip({ text, x: event.clientX, y: event.clientY });

  return (
    <div className="history-motif" role={label ? 'group' : undefined} aria-label={label}>
      {segments.map((segment) => {
        const mark = marks?.segments.get(segment.segmentId);
        const whole = mark === 'added' || mark === 'removed';
        return (
          <div key={segment.segmentId} className={`history-motif-segment${mark ? ` marked ${mark}` : ''}`}>
            <div className="history-motif-name">
              {mark === 'renamed' ? <OldNew from={oldNames.get(segment.segmentId) ?? ''} to={segment.name} /> : segment.name}
              {mark && mark !== 'renamed' && <span className="history-segment-mark"> {SEGMENT_MARK_LABEL[mark]}</span>}
            </div>
            <div className="history-motif-rows">
              {segment.rows.map((row, r) => (
                <div key={r} className="motif-row history-motif-row">
                  {row.map((bar) => {
                    const lit = highlight(bar, whole);
                    const text = describe(bar);
                    const style = (x: number, width: number, color: PatternColor, on: boolean) =>
                      ({ left: percent(x), width: percent(width), ...(on ? patternStyle(color) : {}) }) as CSSProperties;
                    return (
                      <span key={bar.barId}>
                        {bar.groove ? (
                          <i className={`motif-stroke groove${lit.groove ? '' : ' neutral'}`} style={style(bar.x, bar.width, bar.groove.color, lit.groove)} />
                        ) : (
                          <i className={`motif-dot${lit.groove && !patternId ? ' marked' : ''}`} style={{ left: percent(bar.x + bar.width / 2) }} />
                        )}
                        {bar.fill && (
                          <i className={`motif-stroke fill${lit.fill ? '' : ' neutral'}`} style={style(bar.fill.x, bar.fill.width, bar.fill.color, lit.fill)} />
                        )}
                        <span
                          role="img"
                          aria-label={text}
                          className="history-motif-bar"
                          data-highlighted={lit.groove || lit.fill || undefined}
                          style={{ left: percent(bar.x), width: percent(bar.width) }}
                          onPointerMove={(event) => onMove(event, text)}
                          onPointerLeave={() => setTip(null)}
                        />
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {tip && (
        <div
          ref={tipRef}
          role="tooltip"
          className="history-tip"
          // Rechts und unten im Fenster halten; die Breite stammt aus dem vorigen Zeichnen
          style={{
            left: Math.max(0, Math.min(tip.x + 12, window.innerWidth - (tipRef.current?.offsetWidth ?? 0) - 8)),
            top: Math.max(0, Math.min(tip.y + 16, window.innerHeight - (tipRef.current?.offsetHeight ?? 0) - 8)),
          }}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
}
