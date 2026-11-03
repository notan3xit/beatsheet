import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Player } from '../audio/player';
import { setTempo } from '../domain/playback';
import { MAX_TEMPO, MIN_TEMPO, type Pattern } from '../domain/types';
import { openSongOf } from '../state/notebookStore';
import { useOpenSong, useStore } from './useLibrary';

export const PlayerContext = createContext<Player | null>(null);

function usePlayer(): Player {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('PlayerContext fehlt');
  return player;
}

/**
 * Wiedergabe des geöffneten Patterns. Die Quelle liest bei jedem Planungsschritt den aktuellen Stand,
 * damit Änderungen ohne Neustart hörbar sind. Endet beim Verlassen und beim Wechsel des Patterns.
 */
export function usePlayback(pattern: Pattern, tempo: number) {
  const player = usePlayer();
  const latest = useRef({ pattern, tempo });
  latest.current = { pattern, tempo };
  const state = useSyncExternalStore(player.subscribe, player.getState);
  useEffect(() => () => player.stop(), [player, pattern.id]);
  return {
    available: player.available,
    playing: state.playing,
    step: state.step,
    toggle: () =>
      state.playing
        ? player.stop()
        : player.start({ pattern: () => latest.current.pattern, tempo: () => latest.current.tempo }),
  };
}

/** Zahlenfeld, das erst beim Verlassen (oder Enter) übernimmt und danach den gespeicherten Wert zeigt. */
function TempoField({ tempo, onCommit }: { tempo: number; onCommit: (bpm: number) => number }) {
  const [draft, setDraft] = useState(String(tempo));
  useEffect(() => setDraft(String(tempo)), [tempo]);
  return (
    <label className="field tempo-field">
      Tempo (BPM)
      <input
        type="number"
        inputMode="numeric"
        min={MIN_TEMPO}
        max={MAX_TEMPO}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => setDraft(String(onCommit(draft.trim() === '' ? Number.NaN : Number(draft))))}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </label>
  );
}

/** Abspiel-Taste und Tempo im Kopf des Pattern-Editors. */
export function Transport({ playback }: { playback: ReturnType<typeof usePlayback> }) {
  const store = useStore();
  const song = useOpenSong();
  const commitTempo = (bpm: number) => {
    store.updateSong((s) => setTempo(s, bpm));
    return openSongOf(store.getState())!.tempo;
  };
  return (
    <div className="transport">
      <button type="button" className="primary play" disabled={!playback.available} onClick={playback.toggle}>
        {playback.playing ? 'Stopp' : 'Abspielen'}
      </button>
      <TempoField tempo={song.tempo} onCommit={commitTempo} />
      {!playback.available && (
        <p role="note" className="hint">
          Die Wiedergabe ist in diesem Browser nicht möglich, weil er kein Web Audio unterstützt.
        </p>
      )}
    </div>
  );
}
