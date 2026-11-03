import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import type { Player } from '../audio/player';
import { patternTimeline, setTempo, songTimeline, type SongRange, type Step } from '../domain/playback';
import { DEFAULT_TEMPO, MAX_TEMPO, MIN_TEMPO, type Pattern } from '../domain/types';
import { openSongOf } from '../state/notebookStore';
import { useOpenSong, useStore } from './useLibrary';

export const PlayerContext = createContext<Player | null>(null);

export function usePlayer(): Player {
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
    step: state.mark as Step | null,
    toggle: () =>
      state.playing
        ? player.stop()
        : player.start({
            timeline: () => patternTimeline(latest.current.pattern),
            tempo: () => latest.current.tempo,
            loop: true,
          }),
  };
}

/**
 * Wiedergabe des geöffneten Songs (song-playback, design.md D3). Die Quelle liest den Song bei jedem
 * Planungsschritt aus dem Store, damit Änderungen sofort hörbar sind. Der Bereich steht ab dem Start fest.
 */
/** Bereich der laufenden Song-Wiedergabe je Player; die Linie braucht den Taktanfang relativ dazu (design.md D4). */
const activeRanges = new WeakMap<Player, SongRange>();

export function useSongPlayback() {
  const player = usePlayer();
  const store = useStore();
  const state = useSyncExternalStore(player.subscribe, player.getState);
  return {
    available: player.available,
    playing: state.playing,
    /** Laufender Takt; nur Song-Marken sind Takt-IDs. */
    barId: typeof state.mark === 'string' ? state.mark : null,
    start(range: SongRange, loop: boolean) {
      const song = () => openSongOf(store.getState());
      activeRanges.set(player, range);
      player.start({
        timeline: () => {
          const current = song();
          return current ? songTimeline(current, range) : null;
        },
        tempo: () => song()?.tempo ?? DEFAULT_TEMPO,
        loop,
      });
    },
    stop: () => player.stop(),
  };
}

/**
 * Linie an der aktuellen Wiedergabeposition im laufenden Takt (Takt bei `x`, `width` Beats breit).
 * Eigene Frame-Schleife, setzt `left` direkt: kein React-Render pro Frame (design.md D4).
 */
export function PlayheadLine({ barId, x, width }: { barId: string; x: number; width: number }) {
  const player = usePlayer();
  const store = useStore();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const range = activeRanges.get(player);
      const song = openSongOf(store.getState());
      const position = player.getPosition();
      const start = range && song ? songTimeline(song, range)?.marks.find((m) => m.mark === barId)?.at : undefined;
      const offset = position !== null && start !== undefined ? Math.min(Math.max(position - start, 0), width) : 0;
      if (ref.current) ref.current.style.left = `calc(var(--beat) * ${x + offset})`;
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [player, store, barId, x, width]);
  return <span ref={ref} className="playhead-line" aria-hidden="true" />;
}

/** Hinweis, wenn der Browser kein Web Audio kann. */
export function NoAudioNote() {
  return (
    <p role="note" className="hint">
      Die Wiedergabe ist in diesem Browser nicht möglich, weil er kein Web Audio unterstützt.
    </p>
  );
}

/** Tempo des geöffneten Songs; `commit` übernimmt ein neues Tempo und liefert das danach gespeicherte. */
export function useSongTempo() {
  const store = useStore();
  const song = useOpenSong();
  return {
    tempo: song.tempo,
    title: song.title,
    commit(bpm: number): number {
      store.updateSong((s) => setTempo(s, bpm));
      return openSongOf(store.getState())!.tempo;
    },
  };
}

/** Eingabe als Tempo lesen; leer zählt als ungültig. */
export const parseTempo = (draft: string) => (draft.trim() === '' ? Number.NaN : Number(draft));

/** Zahlenfeld, das erst beim Verlassen (oder Enter) übernimmt und danach den gespeicherten Wert zeigt. */
function TempoField({ tempo, title, onCommit }: { tempo: number; title: string; onCommit: (bpm: number) => number }) {
  const [draft, setDraft] = useState(String(tempo));
  const hintId = useId();
  useEffect(() => setDraft(String(tempo)), [tempo]);
  return (
    <div className="tempo-field">
      <label className="field">
        Song-Tempo (BPM)
        <input
          aria-describedby={hintId}
          type="number"
          inputMode="numeric"
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setDraft(String(onCommit(parseTempo(draft))))}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </label>
      {/* Das Tempo gehört zum Song, nicht zum Pattern (design.md D3) */}
      <span id={hintId} className="hint tempo-hint">
        gilt für alle Patterns von „{title}“
      </span>
    </div>
  );
}

/** Abspiel-Taste und Tempo im Kopf des Pattern-Editors. */
export function Transport({ playback }: { playback: ReturnType<typeof usePlayback> }) {
  const { tempo, title, commit } = useSongTempo();
  return (
    <div className="transport">
      <button type="button" className="primary play" disabled={!playback.available} onClick={playback.toggle}>
        {playback.playing ? 'Stopp' : 'Abspielen'}
      </button>
      <TempoField tempo={tempo} title={title} onCommit={commit} />
      {!playback.available && <NoAudioNote />}
    </div>
  );
}
