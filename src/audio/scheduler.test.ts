import { describe, expect, it } from 'vitest';
import { DRAG_GRACES, EMPHASIS_GAIN, FLAM_GRACES, GRACE_GAIN, patternTimeline, type Timeline } from '../domain/playback';
import type { Instrument, Pattern } from '../domain/types';
import { patternOf } from '../test/patterns';
import { createScheduler, START_DELAY } from './scheduler';

interface Trigger {
  instrument: Instrument;
  time: number;
  gain: number;
}

/** Scheduler mit künstlicher Audio-Uhr, manuellem Timer und aufzeichnenden Stimmen. */
function setup(
  initial: Pattern,
  initialTempo = 120,
  options: { loop?: boolean; timeline?: () => Timeline<unknown> | null; metronome?: boolean; countIn?: number } = {},
) {
  let now = 0;
  let tick: (() => void) | undefined;
  let frame: (() => void) | undefined;
  const triggers: Trigger[] = [];
  const clicks: { time: number; accented: boolean }[] = [];
  let silenced = 0;
  let clicksSilenced = 0;
  const source = { current: initial, tempo: initialTempo, metronome: options.metronome ?? false };
  const scheduler = createScheduler(
    {
      trigger: (instrument, time, gain, technique) => triggers.push({ instrument, time, gain, ...(technique ? { technique } : {}) }),
      silence: () => silenced++,
    },
    {
      clock: () => now,
      setInterval: (fn) => ((tick = fn), 1),
      clearInterval: () => (tick = undefined),
      requestFrame: (fn) => ((frame = fn), 1),
      cancelFrame: () => (frame = undefined),
    },
    { click: (time, accented) => clicks.push({ time, accented }), silence: () => clicksSilenced++ },
  );
  // Pattern-Quelle über die allgemeine Schnittstelle (design.md D1)
  const start = () =>
    scheduler.start({
      timeline: options.timeline ?? (() => patternTimeline(source.current, 4)),
      tempo: () => source.tempo,
      loop: options.loop ?? true,
      metronome: () => source.metronome,
      countIn: options.countIn ?? 0,
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
  return {
    scheduler,
    source,
    start,
    advanceTo,
    triggers,
    timesOf,
    clicks,
    silenced: () => silenced,
    clicksSilenced: () => clicksSilenced,
    now: () => now,
  };
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
      { instrument: 'tom1', time: expect.closeTo(S - FLAM_GRACES[0]!, 9), gain: GRACE_GAIN },
      { instrument: 'tom1', time: S, gain: 1 },
    ]);
  });

  it('Drag auf dem ersten Schlag: beide Vorschläge liegen in der Zukunft', () => {
    const pattern = patternOf([{ hits: { snare: [1] } }]);
    pattern.beats[0] = { ...pattern.beats[0]!, articulations: { snare: { 0: 'drag' } } };
    const t = setup(pattern);
    t.start();
    expect(t.triggers.slice(0, 3)).toEqual([
      { instrument: 'snare', time: expect.closeTo(S - DRAG_GRACES[0]!, 9), gain: GRACE_GAIN },
      { instrument: 'snare', time: expect.closeTo(S - DRAG_GRACES[1]!, 9), gain: GRACE_GAIN },
      { instrument: 'snare', time: S, gain: 1 },
    ]);
    expect(S - DRAG_GRACES[0]!).toBeGreaterThan(0);
  });

  it('Betonter Flam: Vorschlag so leise wie sonst', () => {
    const pattern = patternOf([{ hits: { snare: [1] } }]);
    pattern.beats[0] = { ...pattern.beats[0]!, articulations: { snare: { 0: 'flam' } }, emphasis: { snare: [0] } };
    const t = setup(pattern);
    t.start();
    expect(t.triggers.slice(0, 2).map((x) => x.gain)).toEqual([GRACE_GAIN, EMPHASIS_GAIN]);
  });

  it('Klangvariante erreicht die Stimmen', () => {
    const pattern = patternOf([{ hits: { snare: [1] } }]);
    pattern.beats[0] = { ...pattern.beats[0]!, articulations: { snare: { 0: 'rim' } } };
    const t = setup(pattern);
    t.start();
    expect(t.triggers[0]).toEqual({ instrument: 'snare', time: S, gain: 1, technique: 'rim' });
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
    const t = setup(kickOnEveryBeat(4), 120, { timeline: () => (gone ? null : patternTimeline(kickOnEveryBeat(4), 4)) });
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
      timeline: () => ({ length: 4, hits: [], marks: [{ at: 0, mark: 'bar-1' }, { at: 2, mark: 'bar-2' }], downbeats: [0, 2] }),
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

describe('Spec playback-controls › Moduswechsel während der Wiedergabe', () => {
  it('Von Schleife zu einmal: läuft ohne Unterbrechung bis zum Ende des Durchlaufs und endet', () => {
    const t = setup(kickOnEveryBeat(4));
    t.start();
    expect(t.scheduler.getState().loop).toBe(true);
    t.advanceTo(S + 0.6); // Beat 2
    t.scheduler.setLoop(false);
    expect(t.scheduler.getState().loop).toBe(false);
    t.advanceTo(S + 4);
    expect(t.timesOf('kick')).toEqual([S, S + 0.5, S + 1, S + 1.5].map((x) => expect.closeTo(x, 9)));
    expect(t.scheduler.getState()).toEqual({ playing: false, mark: null });
    expect(t.silenced()).toBe(0);
  });

  it('Von einmal zu Schleife: nach dem Ende geht es mit Beat 1 weiter', () => {
    const t = setup(kickOnEveryBeat(2), 120, { loop: false });
    t.start();
    expect(t.scheduler.getState().loop).toBe(false);
    t.advanceTo(S + 0.2);
    t.scheduler.setLoop(true);
    t.advanceTo(S + 2.2);
    expect(t.scheduler.getState().playing).toBe(true);
    expect(t.timesOf('kick').slice(0, 5)).toEqual([S, S + 0.5, S + 1, S + 1.5, S + 2].map((x) => expect.closeTo(x, 9)));
  });

  it('Von einmal zu Schleife, nachdem das Ende schon geplant ist: nahtlos weiter', () => {
    const t = setup(kickOnEveryBeat(2), 120, { loop: false });
    t.start();
    t.advanceTo(S + 0.95); // Ende (S + 1) liegt im Vorlauf und ist geplant
    t.scheduler.setLoop(true);
    t.advanceTo(S + 2.2);
    expect(t.scheduler.getState().playing).toBe(true);
    expect(t.timesOf('kick').slice(0, 5)).toEqual([S, S + 0.5, S + 1, S + 1.5, S + 2].map((x) => expect.closeTo(x, 9)));
  });

  it('setLoop ohne laufende Wiedergabe bleibt wirkungslos', () => {
    const t = setup(kickOnEveryBeat(2));
    t.scheduler.setLoop(false);
    expect(t.scheduler.getState()).toEqual({ playing: false, mark: null });
  });
});

const at = (times: number[]) => times.map((x) => expect.closeTo(x, 9));
const silentTimeline = (length: number, downbeats: number[]) => () => ({ length, hits: [], marks: [], downbeats });

describe('Spec practice-click › Klick auf jedem Beat', () => {
  it('Takt in 4/4', () => {
    const t = setup(kickOnEveryBeat(4), 120, { loop: false, metronome: true });
    t.start();
    t.advanceTo(S + 3);
    expect(t.clicks.map((c) => c.time)).toEqual(at([S, S + 0.5, S + 1, S + 1.5]));
    expect(t.clicks.map((c) => c.accented)).toEqual([true, false, false, false]);
  });

  it('Wechselnde Taktlängen', () => {
    const t = setup(patternOf([{}]), 120, { loop: false, metronome: true, timeline: silentTimeline(7, [0, 4]) });
    t.start();
    t.advanceTo(S + 5);
    expect(t.clicks.map((c) => c.accented)).toEqual([true, false, false, false, true, false, false]);
  });

  it('Pattern länger als ein Takt', () => {
    const t = setup(kickOnEveryBeat(6), 120, { metronome: true });
    t.start();
    t.advanceTo(S + 5.8);
    const accented = t.clicks.filter((c) => c.accented).map((c) => c.time);
    expect(accented).toEqual(at([S, S + 2, S + 3, S + 5]));
    expect(t.clicks).toHaveLength(12);
  });

  it('Metronom aus', () => {
    const t = setup(kickOnEveryBeat(4), 120, { loop: false });
    t.start();
    t.advanceTo(S + 3);
    expect(t.clicks).toEqual([]);
  });
});

describe('Spec practice-click › Metronom während der Wiedergabe schalten', () => {
  it('Einschalten während der Wiedergabe', () => {
    const t = setup(kickOnEveryBeat(1), 120, { loop: false, timeline: silentTimeline(8, [0, 4]) });
    t.start();
    t.advanceTo(S + 0.6); // Beat 2 des ersten Takts
    t.source.metronome = true;
    t.advanceTo(S + 5);
    expect(t.clicks.map((c) => c.time)).toEqual(at([S + 2, S + 2.5, S + 3, S + 3.5]));
    expect(t.clicks.map((c) => c.accented)).toEqual([true, false, false, false]);
    expect(t.scheduler.getState().playing).toBe(false);
  });

  it('Einschalten in der Schleife', () => {
    const t = setup(kickOnEveryBeat(4), 120);
    t.start();
    t.advanceTo(S + 0.6);
    t.source.metronome = true;
    t.advanceTo(S + 2.7);
    expect(t.clicks.map((c) => c.time)).toEqual(at([S + 2, S + 2.5]));
    expect(t.clicks[0]!.accented).toBe(true);
    expect(t.timesOf('kick')).toEqual(at([0, 0.5, 1, 1.5, 2, 2.5].map((x) => S + x)));
  });

  it('Ausschalten während der Wiedergabe', () => {
    const t = setup(kickOnEveryBeat(4), 120, { loop: false, metronome: true });
    t.start();
    t.advanceTo(S + 0.6);
    t.source.metronome = false;
    t.advanceTo(S + 3);
    expect(t.clicks.map((c) => c.time)).toEqual(at([S, S + 0.5]));
    expect(t.timesOf('kick')).toEqual(at([S, S + 0.5, S + 1, S + 1.5]));
  });
});

describe('Spec practice-click › Einzählen vor dem Start', () => {
  it('Song in 4/4', () => {
    const t = setup(kickOnEveryBeat(4), 60, { loop: false, countIn: 4 });
    t.start();
    t.advanceTo(S + 5);
    expect(t.clicks.map((c) => c.time)).toEqual(at([S, S + 1, S + 2, S + 3]));
    expect(t.clicks.map((c) => c.accented)).toEqual([true, false, false, false]);
    expect(t.timesOf('kick')[0]).toBeCloseTo(S + 4, 9);
  });

  it('Einzählen ohne Metronom', () => {
    const t = setup(kickOnEveryBeat(4), 120, { loop: false, countIn: 3 });
    t.start();
    t.advanceTo(S + 5);
    expect(t.clicks.map((c) => c.time)).toEqual(at([S, S + 0.5, S + 1]));
    expect(t.timesOf('kick')).toEqual(at([S + 1.5, S + 2, S + 2.5, S + 3]));
  });

  it('Mit Metronom: Klicks laufen nach dem Einzählen weiter, Takt beginnt betont', () => {
    const t = setup(kickOnEveryBeat(4), 120, { loop: false, countIn: 4, metronome: true });
    t.start();
    t.advanceTo(S + 5);
    expect(t.clicks.map((c) => c.time)).toEqual(at([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((x) => S + x)));
    expect(t.clicks.map((c) => c.accented)).toEqual([true, false, false, false, true, false, false, false]);
  });

  it('Tempo-Wechsel während des Einzählens gilt ab dem nächsten Klick', () => {
    const t = setup(kickOnEveryBeat(4), 120, { loop: false, countIn: 4 });
    t.start();
    t.advanceTo(S + 0.3);
    t.source.tempo = 60;
    t.advanceTo(S + 6);
    const times = t.clicks.map((c) => c.time);
    expect(times[3]! - times[2]!).toBeCloseTo(1, 9);
    expect(t.timesOf('kick')[0]! - times[3]!).toBeCloseTo(1, 9);
  });
});

describe('Spec practice-click › Einzählen nur beim Start', () => {
  it('Schleife', () => {
    const t = setup(kickOnEveryBeat(4), 120, { countIn: 4 });
    t.start();
    t.advanceTo(S + 4.3);
    expect(t.clicks).toHaveLength(4);
    expect(t.timesOf('kick')).toEqual(at([2, 2.5, 3, 3.5, 4].map((x) => S + x)));
  });
});

describe('Spec practice-click › Anzeige während des Einzählens', () => {
  it('Während des Einzählens', () => {
    const t = setup(kickOnEveryBeat(4), 120, { countIn: 4 });
    t.start();
    t.advanceTo(S + 0.7);
    expect(t.scheduler.getState()).toEqual({ playing: true, mark: null, loop: true });
    expect(t.scheduler.getPosition()).toBe(0);
    t.advanceTo(S + 2.05);
    expect(t.scheduler.getState().mark).toEqual({ beat: 0, position: 0 });
  });

  it('Stopp beim Einzählen', () => {
    const t = setup(kickOnEveryBeat(4), 120, { countIn: 4 });
    t.start();
    t.advanceTo(S + 0.7);
    t.scheduler.stop();
    t.advanceTo(S + 4);
    expect(t.triggers).toEqual([]);
    expect(t.clicksSilenced()).toBe(1);
    expect(t.scheduler.getState()).toEqual({ playing: false, mark: null });
  });
});
