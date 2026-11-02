import { useState } from 'react';
import { addAccent, removeAccent } from '../domain/structure';
import { INSTRUMENT_LABELS, INSTRUMENTS, type Accent, type Instrument } from '../domain/types';
import { useStore } from './useLibrary';

/** Akzente eines Takts: Liste mit Entfernen und Auswahl für einen neuen Akzent. */
export function AccentEditor({ barId, beats, accents }: { barId: string; beats: number; accents: Accent[] }) {
  const store = useStore();
  const [instrument, setInstrument] = useState<Instrument>('crash');
  const [beat, setBeat] = useState(0);
  const [position, setPosition] = useState<Accent['position']>(0);

  return (
    <fieldset className="accent-editor">
      <legend>Akzente</legend>
      <ul className="accent-list">
        {accents.map((a) => {
          const label = `${INSTRUMENT_LABELS[a.instrument]} auf ${a.beat + 1}.${a.position + 1}`;
          return (
            <li key={label}>
              {label}
              <button
                type="button"
                className="link"
                aria-label={`${label} entfernen`}
                onClick={() => store.updateSong((s) => removeAccent(s, barId, a))}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <div className="accent-add">
        <select aria-label="Akzent-Instrument" value={instrument} onChange={(e) => setInstrument(e.target.value as Instrument)}>
          {INSTRUMENTS.map((i) => (
            <option key={i} value={i}>
              {INSTRUMENT_LABELS[i]}
            </option>
          ))}
        </select>
        <select aria-label="Akzent-Beat" value={Math.min(beat, beats - 1)} onChange={(e) => setBeat(Number(e.target.value))}>
          {Array.from({ length: beats }, (_, i) => (
            <option key={i} value={i}>
              {i + 1}
            </option>
          ))}
        </select>
        <select
          aria-label="Akzent-Position"
          value={position}
          onChange={(e) => setPosition(Number(e.target.value) as Accent['position'])}
        >
          {[0, 1, 2, 3].map((p) => (
            <option key={p} value={p}>
              {p + 1}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            store.updateSong((s) => addAccent(s, barId, { instrument, beat: Math.min(beat, beats - 1), position }))
          }
        >
          Akzent hinzufügen
        </button>
      </div>
    </fieldset>
  );
}
