import { FLAM_GRACE_GAIN, patternHits, patternSteps, type Step } from '../domain/playback';
import type { Instrument, Pattern } from '../domain/types';

/** Wie weit im Voraus Schläge an die Audio-Uhr übergeben werden (design.md D4). */
export const LOOKAHEAD = 0.1;
/** Abstand der Planungsschritte in Millisekunden. */
export const TICK_MS = 25;
/** Abstand zwischen Start und erstem Schlag, damit auch ein Flam-Vorschlag noch in der Zukunft liegt. */
export const START_DELAY = 0.05;

/** Liefert bei jedem Planungsschritt den aktuellen Stand; so sind Änderungen ohne Neustart hörbar. */
export interface PlaybackSource {
  pattern(): Pattern;
  tempo(): number;
}

export interface PlaybackState {
  playing: boolean;
  /** Gerade erklingende Rasterposition, null wenn nichts läuft oder der erste Schritt noch bevorsteht. */
  step: Step | null;
}

export interface Voices {
  /** Schlag eines Instruments zur Audiozeit `time` mit Pegel `gain` (normal 1). */
  trigger(instrument: Instrument, time: number, gain: number): void;
  /** Bereits geplante Klänge sofort verstummen lassen. */
  silence(): void;
}

export interface SchedulerDeps {
  /** Audiozeit in Sekunden. */
  clock(): number;
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
  requestFrame(fn: () => void): unknown;
  cancelFrame(handle: unknown): void;
}

export interface Scheduler {
  start(source: PlaybackSource): void;
  stop(): void;
  getState(): PlaybackState;
  subscribe(listener: () => void): () => void;
}

const IDLE: PlaybackState = { playing: false, step: null };

export function createScheduler(voices: Voices, deps: SchedulerDeps): Scheduler {
  let state = IDLE;
  const listeners = new Set<() => void>();
  let source: PlaybackSource | null = null;
  let timer: unknown;
  let frame: unknown;
  /** Audiozeit, bis zu der geplant ist, und die Beat-Position im Durchlauf dazu. */
  let cursorTime = 0;
  let cursorBeat = 0;
  /** Geplante Rasterpositionen mit Audiozeit, für die Anzeige. */
  let marks: { time: number; step: Step }[] = [];

  const setState = (next: PlaybackState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  /** Plant alle Schläge bis `clock() + LOOKAHEAD`; liest Pattern und Tempo dabei neu. */
  const schedule = () => {
    if (!source) return;
    const horizon = deps.clock() + LOOKAHEAD;
    while (cursorTime < horizon - 1e-9) {
      const pattern = source.pattern();
      const secondsPerBeat = 60 / source.tempo();
      const length = pattern.beats.length;
      // Gekürzt: Rest des wegfallenden Beats bleibt stumm, Beat 1 kommt auf dem nächsten Grundschlag
      if (cursorBeat >= length - 1e-9) cursorBeat = cursorBeat - Math.ceil(cursorBeat - 1e-9);
      const endBeat = Math.min(length, cursorBeat + (horizon - cursorTime) / secondsPerBeat);
      const timeOf = (at: number) => cursorTime + (at - cursorBeat) * secondsPerBeat;
      const inWindow = (at: number) => at >= cursorBeat - 1e-9 && at < endBeat - 1e-9;

      for (const hit of patternHits(pattern)) {
        if (!inWindow(hit.at)) continue;
        const time = timeOf(hit.at);
        if (hit.graceBefore) voices.trigger(hit.instrument, time - hit.graceBefore, hit.gain * FLAM_GRACE_GAIN);
        voices.trigger(hit.instrument, time, hit.gain);
      }
      for (const step of patternSteps(pattern)) {
        if (inWindow(step.at)) marks.push({ time: timeOf(step.at), step: { beat: step.beat, position: step.position } });
      }

      cursorTime = timeOf(endBeat);
      cursorBeat = endBeat >= length - 1e-9 ? 0 : endBeat;
    }
  };

  /** Meldet die Rasterposition, deren Audiozeit erreicht ist. */
  const showPosition = () => {
    const now = deps.clock();
    let current = state.step;
    while (marks.length > 0 && marks[0]!.time <= now + 1e-9) current = marks.shift()!.step;
    if (current !== state.step) setState({ playing: true, step: current });
    frame = deps.requestFrame(showPosition);
  };

  const halt = () => {
    if (!source) return;
    deps.clearInterval(timer);
    deps.cancelFrame(frame);
    source = null;
    marks = [];
    voices.silence();
  };

  return {
    start(next) {
      halt();
      source = next;
      cursorTime = deps.clock() + START_DELAY;
      cursorBeat = 0;
      setState({ playing: true, step: null });
      schedule();
      timer = deps.setInterval(schedule, TICK_MS);
      frame = deps.requestFrame(showPosition);
    },
    stop() {
      if (!source) return;
      halt();
      setState(IDLE);
    },
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
