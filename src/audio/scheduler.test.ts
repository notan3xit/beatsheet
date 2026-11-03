import { describe, expect, it } from 'vitest';
import { FLAM_GRACE_GAIN, FLAM_GRACE_SECONDS, patternTimeline, type Timeline } from '../domain/playback';
import type { Instrument, Pattern } from '../domain/types';
import { patternOf } from '../test/patterns';
import { createScheduler, START_DELAY } from './scheduler';

interface Trigger {
  instrument: Instrument;
  time: number;
  gain: number;
}

/** Scheduler mit künstlicher Audio-Uhr, manuellem Timer und aufzeichnenden Stimmen. */
function setup(initial: Pattern, initialTempo = 120, options: { loop?: boolean; timeline?: () => Timeline<unknown> | null } = {}) {
  let now = 0;
  let tick: (() => void) | undefined;
  let frame: (() => void) | undefined;
  const triggers: Trigger[] = [];
  let silenced = 0;
  const source = { current: initial, tempo: initialTempo };
  const scheduler = createScheduler(
    {
      trigger: (instrument, time, gain) => triggers.push({ instrument, time, gain }),
      silence: () => silenced++,
    },
    {
      clock: () => now,
      setInterval: (fn) => ((tick = fn), 1),
      clearInterval: () => (tick = undefined),
      requestFrame: (fn) => ((frame = fn), 1),
      cancelFrame: () => (frame = undefined),
    },
  );
  // Pattern-Quelle über die allgemeine Schnittstelle (design.md D1)
  const start = () =>
    scheduler.start({
      timeline: options.timeline ?? (() => patternTimeline(source.current)),
      tempo: () => source.tempo,
      loop: options.loop ?? true,
    });
  /** Lässt die Zeit in 25-ms-Schritten laufen, wie Timer und Bildwiederholung im Browser. */
  const advanceTo = (time: number) => {
    while (now < time - 1e-9) {
      now = Math.min(time, now + 0.025);
      tick?.();
      const f = frame;
      frame = undefined;
      f?.();
    }
  };
  const timesOf = (instrument: Instrument) => triggers.filter((t) => t.instrument === instrument).map((t) => t.time);
  return { scheduler, source, start, advanceTo, triggers, timesOf, silenced: () => silenced, now: () => now };
}

const S = START_DELAY;
const kickOnEveryBeat = (beats: number) => patternOf(Array.from({ length: beats }, () => ({ hits: { kick: [1] } })));

describe('Spec pattern-playback › Wiedergabe starten und stoppen', () => {
  it('Wiedergabe starten: erster Schlag zur Startzeit, Zustand läuft', () => {
    const t = setup(patternOf([{ hits: { kick: [1] } }]));
    expect(t.scheduler.getState()).toEqual({ playing: false, mark: null });
    t.start();
    expect(t.scheduler.getState().playing).toBe(true);
    expect(t.triggers[0]).toEqual({ instrument: 'kick', time: S, gain: 1 });
  });

  it('Wiedergabe stoppen: keine weiteren Schläge, geplante verstummen', () => {
    const t = setup(kickOnEveryBeat(4));
    t.start();
    t.advanceTo(0.6);
    t.scheduler.stop();
    const count = t.triggers.length;
    t.advanceTo(3);
    expect(t.triggers).toHaveLength(count);
    expect(t.silenced()).toBe(1);
    expect(t.scheduler.getState()).toEqual({ playing: false, mark: null });
  });

  it('Leeres Pattern: läuft ohne Klang, Position wandert', () => {
    const t = setup(patternOf([{}, {}]));
    t.start();
    t.advanceTo(S + 0.6);
    expect(t.triggers).toEqual([]);
    expect(t.scheduler.getState().mark).toEqual({ beat: 1, position: 0 });
  });

  it('Abonnenten erfahren Änderungen', () => {
    const t = setup(kickOnEveryBeat(1));
    let calls = 0;
    const unsubscribe = t.scheduler.subscribe(() => calls++);
    t.start();
    expect(calls).toBeGreaterThan(0);
    unsubscribe();
    const before = calls;
    t.scheduler.stop();
    expect(calls).toBe(before);
  });
});

describe('Spec pattern-playback › Wiedergabe in der Schleife', () => {
  it('Zweiter Durchlauf beginnt 2 Sekunden später (4 Beats, 120 BPM)', () => {
    const t = setup(patternOf([{ hits: { kick: [1] } }, {}, {}, {}]));
    t.start();
    t.advanceTo(4.5);
    expect(t.timesOf('kick')).toEqual([S, S + 2, S + 4].map((x) => expect.closeTo(x, 9)));
  });
});

describe('Spec pattern-playback › Zeitliche Lage der Schläge', () => {
  it('Sechzehntel: Position 2 bei 120 BPM nach 0,125 s', () => {
    const t = setup(patternOf([{ hits: { hihat: [2] } }]));
    t.start();
    t.advanceTo(0.3);
    expect(t.timesOf('hihat')[0]).toBeCloseTo(S + 0.125, 9);
  });

  it('Gemischte Unterteilung: Triole in Beat 2, Position 3 bei 60 BPM nach 1⅔ s', () => {
    const t = setup(patternOf([{}, { sub: 3, hits: { snare: [3] } }]), 60);
    t.start();
    t.advanceTo(2);
    expect(t.timesOf('snare')[0]).toBeCloseTo(S + 5 / 3, 9);
  });

  it('Flam: Vorschlag leiser und kurz vor dem Hauptschlag', () => {
    const pattern = patternOf([{ hits: { tom1: [1] } }]);
    pattern.beats[0] = { ...pattern.beats[0]!, articulations: { tom1: { 0: 'flam' } } };
    const t = setup(pattern);
    t.start();
    expect(t.triggers.slice(0, 2)).toEqual([
      { instrument: 'tom1', time: expect.closeTo(S - FLAM_GRACE_SECONDS, 9), gain: FLAM_GRACE_GAIN },
      { instrument: 'tom1', time: S, gain: 1 },
    ]);
  });
});

describe('Spec pattern-playback › Änderungen während der Wiedergabe', () => {
  it('Schlag während der Wiedergabe setzen', () => {
    const t = setup(patternOf([{}, {}, {}, {}]));
    t.start();
    t.advanceTo(0.3);
    t.source.current = patternOf([{}, {}, { hits: { snare: [1] } }, {}]);
    t.advanceTo(1.5);
    expect(t.timesOf('snare')).toEqual([expect.closeTo(S + 1, 9)]);
  });

  it('Pattern kürzen während der Wiedergabe: weiter mit Beat 1 im Puls', () => {
    const t = setup(kickOnEveryBeat(4));
    t.start();
    t.advanceTo(S + 1.6); // in Beat 4
    t.source.current = kickOnEveryBeat(2);
    t.advanceTo(S + 3.1);
    const kicks = t.timesOf('kick');
    kicks.slice(1).forEach((time, i) => expect(time - kicks[i]!).toBeCloseTo(0.5, 9));
    expect(kicks.at(-1)).toBeCloseTo(S + 3, 9);
    expect(t.scheduler.getState().mark).toEqual({ beat: 0, position: 0 });
  });

  it('Tempo während der Wiedergabe', () => {
    const t = setup(kickOnEveryBeat(4));
    t.start();
    t.advanceTo(S + 0.8);
    t.source.tempo = 60;
    t.advanceTo(S + 5);
    const kicks = t.timesOf('kick');
    const gaps = kicks.slice(1).map((time, i) => time - kicks[i]!);
    expect(gaps[0]).toBeCloseTo(0.5, 9);
    expect(gaps.at(-1)).toBeCloseTo(1, 9);
  });
});

describe('Spec pattern-playback › Wiedergabeposition im Sequencer', () => {
  it('Position folgt der Audiozeit', () => {
    const t = setup(patternOf([{}, { sub: 3 }]));
    t.start();
    expect(t.scheduler.getState().mark).toBeNull();
    t.advanceTo(S + 0.13);
    expect(t.scheduler.getState().mark).toEqual({ beat: 0, position: 1 });
    t.advanceTo(S + 0.5 + 0.34);
    expect(t.scheduler.getState().mark).toEqual({ beat: 1, position: 2 });
  });

  it('Keine Hervorhebung nach Stopp', () => {
    const t = setup(patternOf([{}]));
    t.start();
    t.advanceTo(S + 0.2);
    t.scheduler.stop();
    expect(t.scheduler.getState().mark).toBeNull();
  });
});

describe('Einmal-Modus, Quelle und Position (song-playback, design.md D1)', () => {
  it('Einmal-Modus: endet nach der Länge, letzter Schlag klingt aus', () => {
    const t = setup(kickOnEveryBeat(2), 120, { loop: false });
    t.start();
    t.advanceTo(S + 0.9);
    expect(t.scheduler.getState().playing).toBe(true);
    t.advanceTo(S + 3);
    expect(t.timesOf('kick')).toEqual([S, S + 0.5].map((x) => expect.closeTo(x, 9)));
    expect(t.scheduler.getState()).toEqual({ playing: false, mark: null });
    expect(t.silenced()).toBe(0);
  });

  it('Einmal-Modus: Zustand bleibt bis zum Ende der Audiozeit „läuft“', () => {
    const t = setup(kickOnEveryBeat(2), 120, { loop: false });
    t.start();
    t.advanceTo(S + 0.95);
    expect(t.scheduler.getState().playing).toBe(true);
    t.advanceTo(S + 1.01);
    expect(t.scheduler.getState().playing).toBe(false);
  });

  it('Quelle liefert null: Wiedergabe endet', () => {
    let gone = false;
    const t = setup(kickOnEveryBeat(4), 120, { timeline: () => (gone ? null : patternTimeline(kickOnEveryBeat(4))) });
    t.start();
    t.advanceTo(S + 0.3);
    gone = true;
    const count = t.triggers.length;
    t.advanceTo(S + 2);
    expect(t.scheduler.getState()).toEqual({ playing: false, mark: null });
    expect(t.triggers).toHaveLength(count);
  });

  it('Beliebige Marken werden gemeldet', () => {
    const t = setup(kickOnEveryBeat(1), 120, {
      timeline: () => ({ length: 4, hits: [], marks: [{ at: 0, mark: 'bar-1' }, { at: 2, mark: 'bar-2' }] }),
    });
    t.start();
    t.advanceTo(S + 0.1);
    expect(t.scheduler.getState().mark).toBe('bar-1');
    t.advanceTo(S + 1.05);
    expect(t.scheduler.getState().mark).toBe('bar-2');
  });

  it('getPosition folgt der Audiozeit, auch nach Tempowechsel und Schleifenumbruch', () => {
    const t = setup(kickOnEveryBeat(2));
    expect(t.scheduler.getPosition()).toBeNull();
    t.start();
    t.advanceTo(S + 0.25);
    expect(t.scheduler.getPosition()).toBeCloseTo(0.5, 6);
    t.advanceTo(S + 1.25); // Umbruch nach 2 Beats = 1 s
    expect(t.scheduler.getPosition()).toBeCloseTo(0.5, 6);
    t.source.tempo = 60;
    t.advanceTo(S + 3);
    const before = t.scheduler.getPosition()!;
    t.advanceTo(S + 3.5);
    const after = t.scheduler.getPosition()!;
    expect((after - before + 2) % 2).toBeCloseTo(0.5, 6);
    t.scheduler.stop();
    expect(t.scheduler.getPosition()).toBeNull();
  });
});
