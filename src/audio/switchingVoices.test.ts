import { describe, expect, it } from 'vitest';
import { patternTimeline } from '../domain/playback';
import { patternOf } from '../test/patterns';
import { createScheduler } from './scheduler';
import type { LoaderState } from './sampleLoader';
import { createSoundSetting, type Sound } from './soundSetting';
import { createSwitchingVoices, samplesPlayable } from './switchingVoices';

/** Kick Drum auf jedem Beat, 120 BPM: ein Schlag alle 0,5 s. */
function setup(sound: Sound, initialState: LoaderState) {
  let now = 0;
  let tick: (() => void) | undefined;
  const heard: { by: 'synth' | 'samples'; time: number }[] = [];
  const silenced = { synth: 0, samples: 0 };
  const voices = (by: 'synth' | 'samples') => ({
    trigger: (_: unknown, time: number) => heard.push({ by, time }),
    silence: () => silenced[by]++,
  });
  const setting = createSoundSetting(null);
  setting.set(sound);
  const loader = { state: initialState };
  const switching = createSwitchingVoices(voices('synth'), voices('samples'), samplesPlayable(setting, { state: () => loader.state }));
  const scheduler = createScheduler(switching, {
    clock: () => now,
    setInterval: (fn) => ((tick = fn), 1),
    clearInterval: () => (tick = undefined),
    requestFrame: () => 1,
    cancelFrame: () => {},
  });
  const pattern = patternOf(Array.from({ length: 4 }, () => ({ hits: { kick: [1] } })));
  scheduler.start({ timeline: () => patternTimeline(pattern), tempo: () => 120, loop: true });
  const advanceTo = (time: number) => {
    while (now < time - 1e-9) {
      now = Math.min(time, now + 0.025);
      tick?.();
    }
  };
  const byAfter = (time: number) => heard.filter((h) => h.time > time).map((h) => h.by);
  const byBefore = (time: number) => heard.filter((h) => h.time <= time).map((h) => h.by);
  return { setting, loader, scheduler, advanceTo, heard, byAfter, byBefore, silenced, switching };
}

describe('Spec playback-sound › Klang wählen', () => {
  it('Synth wählen: die Schläge erklingen synthetisch', () => {
    const t = setup('synth', 'ready');
    t.advanceTo(2);
    expect(new Set(t.heard.map((h) => h.by))).toEqual(new Set(['synth']));
  });

  it('Wechsel während der Wiedergabe: ohne Neustart, folgende Schläge mit den Aufnahmen', () => {
    const t = setup('synth', 'ready');
    t.advanceTo(1.2);
    const switchedAt = 1.2;
    t.setting.set('drs');
    t.advanceTo(3);
    expect(t.scheduler.getState().playing).toBe(true);
    expect(new Set(t.byBefore(switchedAt))).toEqual(new Set(['synth']));
    // Was beim Wechsel schon geplant war (Vorlauf), bleibt synthetisch; danach nur Aufnahmen
    expect(new Set(t.byAfter(switchedAt + 0.2))).toEqual(new Set(['samples']));
  });
});

describe('Spec playback-sound › Laden im Hintergrund', () => {
  it('Abspielen vor dem Laden: synthetisch', () => {
    const t = setup('drs', 'loading');
    t.advanceTo(2);
    expect(new Set(t.heard.map((h) => h.by))).toEqual(new Set(['synth']));
  });

  it('Aufnahmen werden während der Wiedergabe bereit: folgende Schläge mit Aufnahmen, ohne Neustart', () => {
    const t = setup('drs', 'loading');
    t.advanceTo(1.2);
    t.loader.state = 'ready';
    t.advanceTo(3);
    expect(t.scheduler.getState().playing).toBe(true);
    expect(new Set(t.byBefore(1.2))).toEqual(new Set(['synth']));
    expect(new Set(t.byAfter(1.4))).toEqual(new Set(['samples']));
  });
});

describe('Spec playback-sound › Ersatz durch den Synth', () => {
  it('Aufnahmen nicht dekodierbar: synthetisch', () => {
    const t = setup('drs', 'unavailable');
    t.advanceTo(2);
    expect(new Set(t.heard.map((h) => h.by))).toEqual(new Set(['synth']));
  });
});

describe('createSwitchingVoices', () => {
  it('silence erreicht beide Stimmen', () => {
    const t = setup('drs', 'ready');
    t.scheduler.stop();
    expect(t.silenced).toEqual({ synth: 1, samples: 1 });
  });
});
