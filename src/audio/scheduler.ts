import { FLAM_GRACE_GAIN, type Timeline } from '../domain/playback';
import type { Instrument } from '../domain/types';

/** Wie weit im Voraus Schläge an die Audio-Uhr übergeben werden (pattern-playback, design.md D4). */
export const LOOKAHEAD = 0.1;
/** Abstand der Planungsschritte in Millisekunden. */
export const TICK_MS = 25;
/** Abstand zwischen Start und erstem Schlag, damit auch ein Flam-Vorschlag noch in der Zukunft liegt. */
export const START_DELAY = 0.05;

/**
 * Liefert bei jedem Planungsschritt den aktuellen Stand; so sind Änderungen ohne Neustart hörbar
 * (song-playback, design.md D1).
 */
export interface PlaybackSource<M = unknown> {
  /** null: Die Quelle gibt es nicht mehr, die Wiedergabe endet. */
  timeline(): Timeline<M> | null;
  tempo(): number;
  /** true: am Ende wieder von vorn; false: am Ende stoppen. */
  loop: boolean;
}

export interface PlaybackState {
  playing: boolean;
  /** Zuletzt erreichte Marke der Quelle; null, wenn nichts läuft oder die erste noch bevorsteht. */
  mark: unknown;
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
  /** Position in Beats ab Quellenanfang zur aktuellen Audiozeit; ohne Benachrichtigung. */
  getPosition(): number | null;
  subscribe(listener: () => void): () => void;
}

const IDLE: PlaybackState = { playing: false, mark: null };

/** Ab dieser Audiozeit gilt Beat `beat`, weiter mit `secondsPerBeat`. */
interface Anchor {
  time: number;
  beat: number;
  secondsPerBeat: number;
}

export function createScheduler(voices: Voices, deps: SchedulerDeps): Scheduler {
  let state = IDLE;
  const listeners = new Set<() => void>();
  let source: PlaybackSource | null = null;
  let timer: unknown;
  let frame: unknown;
  /** Audiozeit, bis zu der geplant ist, und die Beat-Position in der Quelle dazu. */
  let cursorTime = 0;
  let cursorBeat = 0;
  /** Einmal-Modus: Audiozeit des Endes, sobald alles geplant ist. */
  let endTime: number | null = null;
  /** Geplante Marken mit Audiozeit, für die Anzeige. */
  let marks: { time: number; mark: unknown }[] = [];
  let anchors: Anchor[] = [];

  const setState = (next: PlaybackState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  /** Plant alle Schläge bis `clock() + LOOKAHEAD`; liest Quelle und Tempo dabei neu. */
  const schedule = () => {
    if (!source || endTime !== null) return;
    const horizon = deps.clock() + LOOKAHEAD;
    while (cursorTime < horizon - 1e-9) {
      const timeline = source.timeline();
      if (!timeline) {
        stop();
        return;
      }
      const secondsPerBeat = 60 / source.tempo();
      const { length } = timeline;
      // Gekürzt: Rest des wegfallenden Beats bleibt stumm, Beat 1 kommt auf dem nächsten Grundschlag
      if (cursorBeat >= length - 1e-9) cursorBeat = cursorBeat - Math.ceil(cursorBeat - 1e-9);
      const endBeat = Math.min(length, cursorBeat + (horizon - cursorTime) / secondsPerBeat);
      const timeOf = (at: number) => cursorTime + (at - cursorBeat) * secondsPerBeat;
      const inWindow = (at: number) => at >= cursorBeat - 1e-9 && at < endBeat - 1e-9;

      anchors.push({ time: cursorTime, beat: cursorBeat, secondsPerBeat });
      for (const hit of timeline.hits) {
        if (!inWindow(hit.at)) continue;
        const time = timeOf(hit.at);
        if (hit.graceBefore) voices.trigger(hit.instrument, time - hit.graceBefore, hit.gain * FLAM_GRACE_GAIN);
        voices.trigger(hit.instrument, time, hit.gain);
      }
      for (const { at, mark } of timeline.marks) {
        if (inWindow(at)) marks.push({ time: timeOf(at), mark });
      }

      cursorTime = timeOf(endBeat);
      if (endBeat < length - 1e-9) {
        cursorBeat = endBeat;
      } else if (source.loop) {
        cursorBeat = 0;
      } else {
        endTime = cursorTime;
        return;
      }
    }
  };

  /** Meldet die Marke, deren Audiozeit erreicht ist; beendet den Einmal-Modus am Ende. */
  const showPosition = () => {
    const now = deps.clock();
    if (endTime !== null && now >= endTime - 1e-9) {
      halt(false);
      setState(IDLE);
      return;
    }
    let current = state.mark;
    while (marks.length > 0 && marks[0]!.time <= now + 1e-9) current = marks.shift()!.mark;
    if (current !== state.mark) setState({ playing: true, mark: current });
    frame = deps.requestFrame(showPosition);
  };

  const halt = (silence: boolean) => {
    if (!source) return;
    deps.clearInterval(timer);
    deps.cancelFrame(frame);
    source = null;
    marks = [];
    anchors = [];
    endTime = null;
    if (silence) voices.silence();
  };

  function stop() {
    if (!source) return;
    halt(true);
    setState(IDLE);
  }

  return {
    start(next) {
      halt(true);
      source = next;
      cursorTime = deps.clock() + START_DELAY;
      cursorBeat = 0;
      setState({ playing: true, mark: null });
      schedule();
      if (!source) return;
      timer = deps.setInterval(schedule, TICK_MS);
      frame = deps.requestFrame(showPosition);
    },
    stop,
    getState: () => state,
    getPosition() {
      if (!source) return null;
      const now = deps.clock();
      // Letzter Anker, dessen Zeit erreicht ist; vor dem ersten Schlag gilt der erste
      let anchor = anchors[0];
      if (!anchor) return null;
      while (anchors.length > 1 && anchors[1]!.time <= now + 1e-9) anchors.shift();
      anchor = anchors[0]!;
      return Math.max(0, anchor.beat + (now - anchor.time) / anchor.secondsPerBeat);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
