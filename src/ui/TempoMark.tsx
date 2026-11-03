import { useRef, useState } from 'react';
import { MAX_TEMPO, MIN_TEMPO } from '../domain/types';
import { parseTempo, useSongTempo } from './playback';

/**
 * Tempo des Songs als Tempoangabe „♩ = 120“, die beim Anklicken zum Zahlenfeld wird
 * (wie die editierbare Überschrift daneben). Enter oder Verlassen übernimmt, Escape verwirft.
 */
export function TempoMark() {
  const { tempo, commit } = useSongTempo();
  const [draft, setDraft] = useState<string | null>(null);
  const discard = useRef(false);

  if (draft === null) {
    return (
      // Screenreader lesen „♩“ uneinheitlich vor, daher ein eigener Name (design.md D2)
      <button
        type="button"
        className="tempo-mark"
        aria-label={`Song-Tempo: ${tempo} BPM`}
        title="Zum Ändern klicken"
        onClick={() => {
          discard.current = false;
          setDraft(String(tempo));
        }}
      >
        ♩ = {tempo}
      </button>
    );
  }

  return (
    <input
      className="tempo-mark-input"
      type="number"
      inputMode="numeric"
      aria-label="Song-Tempo (BPM)"
      min={MIN_TEMPO}
      max={MAX_TEMPO}
      step={1}
      value={draft}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (!discard.current) commit(parseTempo(draft));
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
  );
}
