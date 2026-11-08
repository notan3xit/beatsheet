import { useMemo } from 'react';
import { compareHits, hitKey } from '../domain/history';
import type { Step } from '../domain/playback';
import { articulationAt, changeSubdivision, cycleArticulation, emphasisAt, toggleEmphasis, toggleHit } from '../domain/sequencer';
import {
  ARTICULATION_LABELS,
  INSTRUMENT_LABELS,
  INSTRUMENTS,
  SUBDIVISION_LABELS,
  SUBDIVISIONS,
  type Pattern,
  type Subdivision,
} from '../domain/types';

/** Mindestbreite eines Beats in rem; 32tel und 32tel-Triolen brauchen Platz für acht bzw. zwölf bedienbare Zellen (design.md D3). */
const BEAT_MIN_WIDTH: Record<Subdivision, number> = { 2: 6.5, 3: 6.5, 4: 6.5, 6: 6.5, 8: 12, 12: 18 };
/** Anteil der Beatbreite in der kompakten Variante; die Zellen sind dort nur zum Ansehen. */
const COMPACT_SCALE = 0.6;
import { useConfirm } from './ConfirmDialog';
import { useStore } from './useLibrary';

/**
 * `playhead`: gerade erklingende Rasterposition, wird in allen Zeilen hervorgehoben.
 * `compare`: früherer Stand; Zellen tragen dann `data-mark` für neue, geänderte und entfernte Schläge (song-history).
 */
export function Sequencer({
  pattern,
  playhead = null,
  readOnly = false,
  compare,
  compact = false,
}: {
  pattern: Pattern;
  playhead?: Step | null;
  readOnly?: boolean;
  compare?: Pattern;
  /** Kleinere Zellen und Beschriftung, für den Vergleich im Verlauf. */
  compact?: boolean;
}) {
  const store = useStore();
  const marks = useMemo(() => (compare ? compareHits(compare, pattern) : null), [compare, pattern]);
  const confirm = useConfirm();

  const setSubdivision = async (beatIndex: number, subdivision: Subdivision) => {
    const { lost } = changeSubdivision(pattern, beatIndex, subdivision);
    if (lost.length > 0) {
      const count = lost.length === 1 ? 'geht 1 Schlag' : `gehen ${lost.length} Schläge`;
      const ok = await confirm(
        `Beim Wechsel von Beat ${beatIndex + 1} auf ${SUBDIVISION_LABELS[subdivision]} ${count} verloren. Trotzdem umstellen?`,
      );
      if (!ok) return;
    }
    store.update(pattern.id, (p) => changeSubdivision(p, beatIndex, subdivision).pattern);
  };

  return (
    <div
      role="grid"
      aria-label="Sequencer"
      className={compact ? 'sequencer compact' : 'sequencer'}
      style={{
        gridTemplateColumns: `${compact ? 7.5 : 10.5}rem ${pattern.beats
          .map((b) => `minmax(${BEAT_MIN_WIDTH[b.subdivision] * (compact ? COMPACT_SCALE : 1)}rem, 1fr)`)
          .join(' ')}`,
      }}
    >
      <div role="row" className="sequencer-row sequencer-head">
        <div role="columnheader" className="sequencer-corner" />
        {pattern.beats.map((beat, b) => (
          <div role="columnheader" key={b} className="beat-head">
            <span className="beat-number">Beat {b + 1}</span>
            {readOnly ? (
              <span className="value-control">{SUBDIVISION_LABELS[beat.subdivision]}</span>
            ) : (
              <select
                className="value-control"
                aria-label={`Unterteilung Beat ${b + 1}`}
                value={beat.subdivision}
                onChange={(e) => void setSubdivision(b, Number(e.target.value) as Subdivision)}
              >
                {SUBDIVISIONS.map((s) => (
                  <option key={s} value={s}>
                    {SUBDIVISION_LABELS[s]}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
      {INSTRUMENTS.map((instrument) => (
        <div role="row" key={instrument} aria-label={INSTRUMENT_LABELS[instrument]} className="sequencer-row">
          <div role="rowheader" className="instrument">
            {INSTRUMENT_LABELS[instrument]}
          </div>
          {pattern.beats.map((beat, b) => (
            <div role="gridcell" key={b} className={`beat-cells${b % 2 ? ' odd' : ''}`}>
              {Array.from({ length: beat.subdivision }, (_, position) => {
                const active = beat.hits[instrument]?.includes(position) ?? false;
                const articulation = articulationAt(beat, instrument, position);
                const emphasized = emphasisAt(beat, instrument, position);
                const label = [
                  `${INSTRUMENT_LABELS[instrument]}, Beat ${b + 1}, Position ${position + 1}`,
                  ...(articulation ? [ARTICULATION_LABELS[articulation]] : []),
                  ...(emphasized ? ['betont'] : []),
                ].join(', ');
                return (
                  <button
                    type="button"
                    key={position}
                    disabled={readOnly}
                    className={`step${position === 0 ? ' downbeat' : ''}${
                      playhead?.beat === b && playhead.position === position ? ' playing' : ''
                    }`}
                    aria-pressed={active}
                    aria-label={label}
                    data-articulation={articulation}
                    data-emphasis={emphasized || undefined}
                    data-mark={marks?.get(hitKey(b, beat.subdivision, position, instrument))}
                    // Klick: Schlag an/aus; Shift-Klick: Spielweise durchschalten; Strg-/Cmd-Klick: Betonung an/aus
                    onClick={(e) => {
                      const change = e.ctrlKey || e.metaKey ? toggleEmphasis : e.shiftKey ? cycleArticulation : toggleHit;
                      store.update(pattern.id, (p) => change(p, b, instrument, position));
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
