import type { Step } from '../domain/playback';
import { articulationAt, changeSubdivision, cycleArticulation, toggleHit } from '../domain/sequencer';
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
import { useConfirm } from './ConfirmDialog';
import { useStore } from './useLibrary';

/** `playhead`: gerade erklingende Rasterposition, wird in allen Zeilen hervorgehoben. */
export function Sequencer({
  pattern,
  playhead = null,
  readOnly = false,
}: {
  pattern: Pattern;
  playhead?: Step | null;
  readOnly?: boolean;
}) {
  const store = useStore();
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
      className="sequencer"
      style={{
        gridTemplateColumns: `10.5rem ${pattern.beats.map((b) => `minmax(${BEAT_MIN_WIDTH[b.subdivision]}rem, 1fr)`).join(' ')}`,
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
                const label = `${INSTRUMENT_LABELS[instrument]}, Beat ${b + 1}, Position ${position + 1}`;
                return (
                  <button
                    type="button"
                    key={position}
                    disabled={readOnly}
                    className={`step${position === 0 ? ' downbeat' : ''}${
                      playhead?.beat === b && playhead.position === position ? ' playing' : ''
                    }`}
                    aria-pressed={active}
                    aria-label={articulation ? `${label}, ${ARTICULATION_LABELS[articulation]}` : label}
                    data-articulation={articulation}
                    // Klick: Schlag an/aus; Shift-Klick: Spielweise durchschalten (nur Snare und Toms)
                    onClick={(e) =>
                      store.update(pattern.id, (p) =>
                        e.shiftKey ? cycleArticulation(p, b, instrument, position) : toggleHit(p, b, instrument, position),
                      )
                    }
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
