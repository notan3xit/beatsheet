import type { PlaybackSound } from './deviceSound';
import { createSampleVoices } from './sampleVoices';
import { createScheduler, type PlaybackSource, type PlaybackState, type Scheduler, type Voices } from './scheduler';
import { createSwitchingVoices, samplesPlayable } from './switchingVoices';
import { createVoices } from './voices';

export type { PlaybackSource, PlaybackState } from './scheduler';

export interface Player {
  /** false, wenn der Browser kein Web Audio kann. */
  readonly available: boolean;
  start(source: PlaybackSource): void;
  stop(): void;
  /** Wechselt den Modus der laufenden Wiedergabe ohne Neustart. */
  setLoop(loop: boolean): void;
  getState(): PlaybackState;
  /** Position in Beats ab Quellenanfang; für flüssige Anzeigen pro Frame abfragen. */
  getPosition(): number | null;
  subscribe(listener: () => void): () => void;
}

const IDLE: PlaybackState = { playing: false, mark: null };

type AudioWindow = { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };

/**
 * Player über Web Audio. Der AudioContext entsteht erst beim ersten Start, also nach einer
 * Nutzeraktion (Autoplay-Regeln der Browser). Mit `sound` spielen die Aufnahmen, sobald gewählt und
 * geladen, sonst der Synth (drum-samples, design.md D1).
 */
export function createWebAudioPlayer(win: AudioWindow = globalThis as AudioWindow, sound?: PlaybackSound): Player {
  const Context = win.AudioContext ?? win.webkitAudioContext;
  const listeners = new Set<() => void>();
  let audio: { ctx: AudioContext; scheduler: Scheduler } | null = null;

  const ensureAudio = () => {
    if (audio) return audio;
    const ctx = new Context!();
    const synth = createVoices(ctx);
    const voices: Voices = sound
      ? createSwitchingVoices(synth, createSampleVoices(ctx, sound.loader.buffers), samplesPlayable(sound.setting, sound.loader))
      : synth;
    const scheduler = createScheduler(voices, {
      clock: () => ctx.currentTime,
      setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
      clearInterval: (handle) => globalThis.clearInterval(handle as ReturnType<typeof setInterval>),
      requestFrame: (fn) => globalThis.requestAnimationFrame(fn),
      cancelFrame: (handle) => globalThis.cancelAnimationFrame(handle as number),
    });
    scheduler.subscribe(() => listeners.forEach((listener) => listener()));
    audio = { ctx, scheduler };
    return audio;
  };

  return {
    available: Context !== undefined,
    start(source) {
      if (!Context) return;
      const { ctx, scheduler } = ensureAudio();
      // Ein angehaltener Kontext (Autoplay-Sperre, Tab im Hintergrund) läuft erst nach resume()
      void ctx.resume();
      scheduler.start(source);
    },
    stop: () => audio?.scheduler.stop(),
    setLoop: (loop) => audio?.scheduler.setLoop(loop),
    getState: () => audio?.scheduler.getState() ?? IDLE,
    getPosition: () => audio?.scheduler.getPosition() ?? null,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
