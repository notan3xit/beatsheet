import { describe, expect, it } from 'vitest';
import { patternOf } from '../test/patterns';
import { FakeAudioContext } from '../test/fakeAudio';
import { createWebAudioPlayer } from './player';

const source = { pattern: () => patternOf([{ hits: { kick: [1] } }]), tempo: () => 120 };

describe('Spec pattern-playback › Audio nicht verfügbar', () => {
  it('Browser ohne Web Audio: Player nicht verfügbar, start ohne Wirkung', () => {
    const player = createWebAudioPlayer({});
    expect(player.available).toBe(false);
    player.start(source);
    expect(player.getState()).toEqual({ playing: false, step: null });
  });
});

describe('createWebAudioPlayer', () => {
  it('erzeugt den AudioContext erst beim ersten Start und setzt ihn fort', () => {
    const created: FakeAudioContext[] = [];
    const AudioContext = class extends FakeAudioContext {
      constructor() {
        super();
        created.push(this);
      }
    };
    const player = createWebAudioPlayer({ AudioContext: AudioContext as unknown as typeof globalThis.AudioContext });
    expect(player.available).toBe(true);
    expect(created).toHaveLength(0);
    let notified = 0;
    player.subscribe(() => notified++);
    player.start(source);
    expect(created).toHaveLength(1);
    expect(created[0]!.state).toBe('running');
    expect(player.getState().playing).toBe(true);
    expect(notified).toBeGreaterThan(0);
    player.stop();
    player.start(source);
    expect(created).toHaveLength(1);
    player.stop();
    expect(player.getState()).toEqual({ playing: false, step: null });
  });
});
