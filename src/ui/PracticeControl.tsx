import { useSyncExternalStore } from 'react';
import { isValidTempo } from '../domain/playback';
import { practiceTempo, stepPracticeTempo } from '../domain/practice';
import { MAX_TEMPO, MIN_TEMPO } from '../domain/types';
import { usePractice } from './playback';
import { BpmMark } from './TempoMark';
import { useOpenSong } from './useLibrary';

const STEP = 5;

/**
 * Übetempo des geöffneten Songs (practice-tempo, design.md D5): Schalter „Üben“, Wert, −/+.
 * Ändert den Song nicht und ist deshalb auch im gesperrten Song bedienbar.
 */
export function PracticeControl() {
  const practice = usePractice();
  const song = useOpenSong();
  useSyncExternalStore(practice.subscribe, () => `${practice.enabled(song.id)}:${practice.tempo(song.id)}`);
  const on = practice.enabled(song.id);
  const tempo = practiceTempo(practice.tempo(song.id), song.tempo);
  const set = (bpm: number) => practice.setTempo(song.id, bpm);

  return (
    <span className={on ? 'practice on' : 'practice'}>
      <button type="button" className="practice-toggle" aria-pressed={on} data-read-safe="" onClick={() => practice.setEnabled(song.id, !on)}>
        <span className="practice-knob" aria-hidden="true" />
        Üben
      </button>
      <button
        type="button"
        className="practice-step"
        aria-label="Übetempo verringern"
        title="Übetempo verringern"
        data-read-safe=""
        disabled={tempo <= MIN_TEMPO}
        onClick={() => set(stepPracticeTempo(tempo, -STEP))}
      >
        −
      </button>
      <BpmMark key={song.id} value={tempo} name="Übetempo" readSafe onCommit={(bpm) => isValidTempo(bpm) && set(bpm)} />
      <button
        type="button"
        className="practice-step"
        aria-label="Übetempo erhöhen"
        title="Übetempo erhöhen"
        data-read-safe=""
        disabled={tempo >= MAX_TEMPO}
        onClick={() => set(stepPracticeTempo(tempo, STEP))}
      >
        +
      </button>
    </span>
  );
}
