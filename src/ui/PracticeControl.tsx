import { useSyncExternalStore, type ReactNode } from 'react';
import { isValidTempo } from '../domain/playback';
import { practiceTempo, stepPracticeTempo } from '../domain/practice';
import { MAX_TEMPO, MIN_TEMPO } from '../domain/types';
import { CountInIcon, MetronomeIcon } from './icons';
import { usePractice } from './playback';
import { BpmMark } from './TempoMark';
import { useOpenSong } from './useLibrary';

const STEP = 5;

/** Knopf mit Symbol für einen Schalter je Song (practice-click, design.md D6). */
function ClickToggle({ name, on, onToggle, children }: { name: string; on: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button type="button" className="practice-click" aria-label={name} title={name} aria-pressed={on} data-read-safe="" onClick={onToggle}>
      {children}
    </button>
  );
}

/**
 * Übe-Box des geöffneten Songs: Schalter „Tempo“, Übetempo mit −/+ (practice-tempo, design.md D5), dann „Metronom“ und
 * „Einzählen“ (practice-click). Ändert den Song nicht und ist deshalb auch im gesperrten Song bedienbar.
 */
export function PracticeControl() {
  const practice = usePractice();
  const song = useOpenSong();
  useSyncExternalStore(
    practice.subscribe,
    () => `${practice.enabled(song.id)}:${practice.tempo(song.id)}:${practice.metronome(song.id)}:${practice.countIn(song.id)}`,
  );
  const on = practice.enabled(song.id);
  const metronome = practice.metronome(song.id);
  const countIn = practice.countIn(song.id);
  const tempo = practiceTempo(practice.tempo(song.id), song.tempo);
  const set = (bpm: number) => practice.setTempo(song.id, bpm);

  return (
    <span className="practice">
      <span className={on ? 'practice-tempo on' : 'practice-tempo'}>
        <button type="button" className="practice-toggle" aria-pressed={on} data-read-safe="" onClick={() => practice.setEnabled(song.id, !on)}>
          <span className="practice-knob" aria-hidden="true" />
          Tempo
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
      <ClickToggle name="Metronom" on={metronome} onToggle={() => practice.setMetronome(song.id, !metronome)}>
        <MetronomeIcon />
      </ClickToggle>
      <ClickToggle name="Einzählen" on={countIn} onToggle={() => practice.setCountIn(song.id, !countIn)}>
        <CountInIcon />
      </ClickToggle>
    </span>
  );
}
