import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import type { PlaybackSound } from '../audio/deviceSound';
import type { Player } from '../audio/player';
import { patternTimeline, setTempo, songTimeline, type SongRange, type Step } from '../domain/playback';
import { practiceTempo } from '../domain/practice';
import { allBars } from '../domain/songPatterns';
import { DEFAULT_TEMPO, type Pattern, type Song } from '../domain/types';
import { openSongOf } from '../state/notebookStore';
import type { PracticeStore } from '../state/practice';
import { PlayButton } from './PlayButton';
import { useOpenSong, useStore } from './useLibrary';

export const PlayerContext = createContext<Player | null>(null);

/** Tempo der Wiedergabe: bei eingeschaltetem „Üben“ das Übetempo, sonst das Song-Tempo (practice-tempo, design.md D2). */
function playbackTempo(practice: PracticeStore, song: Song): number {
  return practice.enabled(song.id) ? practiceTempo(practice.tempo(song.id), song.tempo) : song.tempo;
}

/** Klangwahl und Aufnahmen für das Menü (drum-samples, design.md D7). */
export const SoundContext = createContext<PlaybackSound | null>(null);

/** Übetempo je Song (practice-tempo, design.md D4). */
export const PracticeContext = createContext<PracticeStore | null>(null);

export function usePractice(): PracticeStore {
  const practice = useContext(PracticeContext);
  if (!practice) throw new Error('PracticeContext fehlt');
  return practice;
}

export function useSound(): PlaybackSound {
  const sound = useContext(SoundContext);
  if (!sound) throw new Error('SoundContext fehlt');
  return sound;
}

export function usePlayer(): Player {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('PlayerContext fehlt');
  return player;
}

/**
 * Wiedergabe des geöffneten Patterns. Die Quelle liest bei jedem Planungsschritt den aktuellen Stand,
 * damit Änderungen ohne Neustart hörbar sind. Endet beim Verlassen und beim Wechsel des Patterns.
 */
export function usePlayback(pattern: Pattern, song: Song) {
  const player = usePlayer();
  const practice = usePractice();
  const latest = useRef({ pattern, song });
  latest.current = { pattern, song };
  const state = useSyncExternalStore(player.subscribe, player.getState);
  useEffect(() => () => player.stop(), [player, pattern.id]);
  return {
    step: state.mark as Step | null,
    start: (loop: boolean) =>
      player.start({
        timeline: () => patternTimeline(latest.current.pattern),
        tempo: () => playbackTempo(practice, latest.current.song),
        loop,
      }),
  };
}

/**
 * Wiedergabe des geöffneten Songs (song-playback, design.md D3). Die Quelle liest den Song bei jedem
 * Planungsschritt aus dem Store, damit Änderungen sofort hörbar sind. Der Bereich steht ab dem Start fest.
 */
/** Bereich der laufenden Song-Wiedergabe je Player; die Linie braucht den Taktanfang relativ dazu (design.md D4). */
const activeRanges = new WeakMap<Player, SongRange>();

const NO_BARS: ReadonlySet<string> = new Set();

/** Takte des Bereichs, wenn er nicht den ganzen Song umfasst. */
function partialRange(song: Song, range: SongRange): ReadonlySet<string> {
  const ids = songTimeline(song, range)?.marks.map((m) => m.mark) ?? [];
  return ids.length === allBars(song).length ? NO_BARS : new Set(ids);
}

export function useSongPlayback() {
  const player = usePlayer();
  const practice = usePractice();
  const store = useStore();
  const state = useSyncExternalStore(player.subscribe, player.getState);
  const range = state.playing ? activeRanges.get(player) : undefined;
  const song = useOpenSong();
  return {
    available: player.available,
    playing: state.playing,
    /** Laufender Takt; nur Song-Marken sind Takt-IDs. */
    barId: typeof state.mark === 'string' ? state.mark : null,
    /** Takte einer laufenden Schleife über einen Teil des Songs; leer bei einmaliger Wiedergabe und Schleife über den ganzen Song. */
    loopRange: state.loop && range ? partialRange(song, range) : NO_BARS,
    start(range: SongRange, loop: boolean) {
      const song = () => openSongOf(store.getState());
      activeRanges.set(player, range);
      player.start({
        timeline: () => {
          const current = song();
          return current ? songTimeline(current, range) : null;
        },
        tempo: () => {
          const current = song();
          return current ? playbackTempo(practice, current) : DEFAULT_TEMPO;
        },
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
    commit(bpm: number): number {
      store.updateSong((s) => setTempo(s, bpm));
      return openSongOf(store.getState())!.tempo;
    },
  };
}

/** Eingabe als Tempo lesen; leer zählt als ungültig. */
export const parseTempo = (draft: string) => (draft.trim() === '' ? Number.NaN : Number(draft));

/**
 * Abspiel-Knöpfe im Kopf von Doppelseite und Pattern-Editor (playback-controls, design.md D5): einmal und in Schleife.
 * Während der Wiedergabe ist der Knopf des laufenden Modus „Stopp“, der andere grau und wechselt den Modus.
 */
export function Transport({
  once,
  loop,
  canStart = true,
  onStart,
}: {
  /** Namen der Knöpfe in Ruhe. */
  once: string;
  loop: string;
  canStart?: boolean;
  onStart: (loop: boolean) => void;
}) {
  const player = usePlayer();
  const state = useSyncExternalStore(player.subscribe, player.getState);
  const running = state.playing ? (state.loop ? 'loop' : 'once') : null;
  const disabled = !player.available || (!running && !canStart);
  const button = (mode: 'once' | 'loop') =>
    running === mode ? (
      <PlayButton symbol="stop" label="Stopp" disabled={disabled} onClick={() => player.stop()} />
    ) : (
      <PlayButton
        symbol={mode === 'once' ? 'play' : 'loop'}
        label={mode === 'once' ? once : loop}
        disabled={disabled}
        idle={running !== null}
        onClick={() => (running ? player.setLoop(mode === 'loop') : onStart(mode === 'loop'))}
      />
    );
  return (
    <div className="transport">
      {button('once')}
      {button('loop')}
      {!player.available && <NoAudioNote />}
    </div>
  );
}
