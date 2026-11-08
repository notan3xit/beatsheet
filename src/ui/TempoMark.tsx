import { useRef, useState } from 'react';
import { MAX_TEMPO, MIN_TEMPO } from '../domain/types';
import { parseTempo, useSongTempo } from './playback';
import { useNotebook } from './useLibrary';

/**
 * Tempoangabe „♩ = 120“, die beim Anklicken zum Zahlenfeld wird (wie die editierbare Überschrift).
 * Enter oder Verlassen übernimmt, Escape verwirft. `name` ist der zugängliche Name ohne Wert.
 */
export function BpmMark({
  value,
  name,
  readOnly,
  readSafe,
  onCommit,
}: {
  value: number;
  name: string;
  readOnly?: boolean;
  /** Auch im gesperrten Song bedienbar, weil der Song unverändert bleibt. */
  readSafe?: boolean;
  onCommit: (bpm: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const discard = useRef(false);

  if (readOnly) {
    return (
      <span className="tempo-mark" role="img" aria-label={`${name}: ${value} BPM`}>
        ♩ = <span className="tempo-value">{value}</span>
      </span>
    );
  }

  if (draft === null) {
    return (
      // Screenreader lesen „♩“ uneinheitlich vor, daher ein eigener Name (design.md D2)
      <button
        type="button"
        className="tempo-mark"
        aria-label={`${name}: ${value} BPM`}
        title="Zum Ändern klicken"
        {...(readSafe ? { 'data-read-safe': '' } : {})}
        onClick={() => {
          discard.current = false;
          setDraft(String(value));
        }}
      >
        ♩ = <span className="tempo-value">{value}</span>
      </button>
    );
  }

  return (
    <span className="tempo-mark editing">
      ♩ ={' '}
      <input
        className="tempo-value tempo-mark-input"
        type="number"
        inputMode="numeric"
        aria-label={`${name} (BPM)`}
        min={MIN_TEMPO}
        max={MAX_TEMPO}
        step={1}
        value={draft}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (!discard.current) onCommit(parseTempo(draft));
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            discard.current = true;
            e.currentTarget.blur();
          }
        }}
      />
    </span>
  );
}

/** Tempo des Songs; im gesperrten Song nur Text. */
export function TempoMark() {
  const { tempo, commit } = useSongTempo();
  const { locked } = useNotebook();
  return <BpmMark value={tempo} name="Song-Tempo" readOnly={locked} onCommit={commit} />;
}
