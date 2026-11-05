import { describe, expect, it } from 'vitest';
import { patternTimeline } from '../domain/playback';
import { patternOf } from '../test/patterns';
import { FakeAudioContext } from '../test/fakeAudio';
import { createWebAudioPlayer } from './player';
import { SAMPLE_KEYS, type LoaderState, type SampleBuffers } from './sampleLoader';
import { createSoundSetting } from './soundSetting';

const source = { timeline: () => patternTimeline(patternOf([{ hits: { kick: [1] } }])), tempo: () => 120, loop: true };

describe('Spec pattern-playback › Audio nicht verfügbar', () => {
  it('Browser ohne Web Audio: Player nicht verfügbar, start ohne Wirkung', () => {
    const player = createWebAudioPlayer({});
    expect(player.available).toBe(false);
    player.start(source);
    expect(player.getState()).toEqual({ playing: false, mark: null });
  });
});

describe('Spec playback-sound › Klang der Aufnahmen', () => {
  it('mit gewähltem und geladenem DRSKit spielt der Player Aufnahmen statt Oszillatoren', () => {
    const created: FakeAudioContext[] = [];
    const AudioContext = class extends FakeAudioContext {
      constructor() {
        super();
        created.push(this);
      }
    };
    const buffers = Object.fromEntries(SAMPLE_KEYS.map((key) => [key, { key }])) as unknown as SampleBuffers;
    const setting = createSoundSetting(null);
    let state: LoaderState = 'ready';
    const loader = { state: () => state, buffers: () => buffers, load: async () => {}, subscribe: () => () => {} };
    const player = createWebAudioPlayer({ AudioContext: AudioContext as unknown as typeof globalThis.AudioContext }, { setting, loader });
    player.start(source);
    const ctx = created[0]!;
    const kickSources = () => ctx.nodes.filter((n) => n.kind === 'bufferSource' && (n as unknown as { buffer: { key?: string } }).buffer?.key);
    expect(kickSources().length).toBeGreaterThan(0);
    expect(ctx.nodes.some((n) => n.kind === 'oscillator')).toBe(false);
    player.stop();
    state = 'unavailable';
    player.start(source);
    expect(ctx.nodes.some((n) => n.kind === 'oscillator')).toBe(true);
    player.stop();
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
    expect(player.getState()).toEqual({ playing: false, mark: null });
  });
});
