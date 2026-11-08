import { act } from '@testing-library/react';
import { vi } from 'vitest';
import type { PlaybackSource, PlaybackState, Player } from '../audio/player';

/** Testhilfe: Player ohne Audio; zeichnet Aufrufe auf, Marken, Position und Ende steuert der Test. */
export function fakePlayer(available = true) {
  let state: PlaybackState = { playing: false, mark: null };
  let position: number | null = null;
  let source: PlaybackSource | null = null;
  const listeners = new Set<() => void>();
  const set = (next: PlaybackState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  const player = {
    available,
    start: vi.fn((s: PlaybackSource) => {
      source = s;
      set({ playing: true, mark: null, loop: s.loop });
    }),
    setLoop: vi.fn((loop: boolean) => {
      if (state.playing) set({ ...state, loop });
    }),
    stop: vi.fn(() => {
      position = null;
      set({ playing: false, mark: null });
    }),
    getState: () => state,
    getPosition: () => position,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } satisfies Player;
  return {
    player,
    source: () => source!,
    /** Die Wiedergabe erreicht eine Marke (Rasterposition, Takt-ID …) und steht bei `beat`. */
    reach: (mark: unknown, beat: number | null = null) =>
      act(() => {
        position = beat;
        set({ ...state, playing: true, mark });
      }),
    /** Die Wiedergabe endet von selbst (Einmal-Modus). */
    end: () =>
      act(() => {
        position = null;
        set({ playing: false, mark: null });
      }),
  };
}
