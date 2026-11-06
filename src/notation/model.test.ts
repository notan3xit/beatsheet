import { describe, expect, it } from 'vitest';
import { emptyBeats, patternOf } from '../test/patterns';
import type { Beat } from '../domain/types';
import { toNotation, type BeatGroup, type NotationEvent } from './model';

const summary = (events: NotationEvent[]) => events.map((e) => (e.kind === 'rest' ? `${e.duration}r` : e.duration));
const instrumentsOf = (event: NotationEvent) => event.keys.map((k) => k.instrument);

describe('Spec drum-notation › Notensystem', () => {
  it('Groove über zwei Takte', () => {
    const model = toNotation(patternOf(emptyBeats(8)));
    expect(model.clef).toBe('percussion');
    expect(model.measures.map((m) => m.beatCount)).toEqual([4, 4]);
  });

  it('Kurzer Fill', () => {
    const model = toNotation(patternOf([{ hits: { snare: [1, 2, 3, 4] } }], 'fill'));
    expect(model.measures).toHaveLength(1);
    expect(model.measures[0]!.beatCount).toBe(1);
    expect(model.measures[0]!.voices.up).toHaveLength(1);
    expect(model.measures[0]!.voices.down).toHaveLength(1);
  });

  it('Unvollständiger letzter Takt bei 6 Beats', () => {
    const model = toNotation(patternOf(emptyBeats(6)));
    expect(model.measures.map((m) => m.beatCount)).toEqual([4, 2]);
  });
});

describe('Spec drum-notation › Notensystem (Taktart)', () => {
  it('Ein Takt mit 6 Beats', () => {
    expect(toNotation(patternOf(emptyBeats(6)), 6).measures.map((m) => m.beatCount)).toEqual([6]);
  });

  it('Taktart kürzer als das Pattern', () => {
    expect(toNotation(patternOf(emptyBeats(7)), 3).measures.map((m) => m.beatCount)).toEqual([3, 3, 1]);
  });

  it('Taktart länger als das Pattern', () => {
    expect(toNotation(patternOf(emptyBeats(4)), 5).measures.map((m) => m.beatCount)).toEqual([4]);
  });
});

describe('Spec drum-notation › Pausen in anderen Taktarten', () => {
  const kickOnFirst = (length: number) => patternOf([{ hits: { kick: [1] } }, ...emptyBeats(length - 1)]);
  const downEmptyBeats = (length: number, meter: number) =>
    toNotation(kickOnFirst(length), meter).measures[0]!.voices.down.slice(1).map((g) => summary(g.events));

  it('Viertelpausen in anderen Taktarten', () => {
    expect(downEmptyBeats(6, 6)).toEqual(Array.from({ length: 5 }, () => ['qr']));
  });

  it('Unvollständiger Takt mit 4 Beats', () => {
    expect(downEmptyBeats(4, 5)).toEqual(Array.from({ length: 3 }, () => ['qr']));
  });

  it('Halbe Pause bleibt dem vollen 4/4-Takt vorbehalten', () => {
    const groups = toNotation(patternOf([{ hits: { kick: [1] } }, { hits: { kick: [1] } }, ...emptyBeats(2)]), 4).measures[0]!.voices.down;
    expect(summary(groups[2]!.events)).toEqual(['hr']);
  });

  it('Neuer Groove in 3/4', () => {
    const { up, down } = toNotation(patternOf(emptyBeats(3)), 3).measures[0]!.voices;
    expect(up.map((g) => summary(g.events))).toEqual([['qr'], ['qr'], ['qr']]);
    expect(down.every((g) => g.events.length === 0)).toBe(true);
  });

  it('Leerer Takt mit 4 Beats in 5/4', () => {
    const { up } = toNotation(patternOf(emptyBeats(4)), 5).measures[0]!.voices;
    expect(up.map((g) => summary(g.events))).toEqual([['qr'], ['qr'], ['qr'], ['qr']]);
  });
});

describe('Spec drum-notation › Systemposition je Instrument', () => {
  it('Snare und Bassdrum', () => {
    const model = toNotation(patternOf([{ hits: { snare: [1], kick: [1] } }]));
    const [upGroup] = model.measures[0]!.voices.up;
    const [downGroup] = model.measures[0]!.voices.down;
    // Linie 1 = Schritt 0, Zwischenraum 1 = Schritt 1, Zwischenraum 3 = Schritt 5
    expect(upGroup!.events[0]!.keys).toEqual([expect.objectContaining({ instrument: 'snare', staffStep: 5 })]);
    expect(downGroup!.events[0]!.keys).toEqual([expect.objectContaining({ instrument: 'kick', staffStep: 1 })]);
  });

  it('Alle Instrumente an ihrer festen Position', () => {
    const all = toNotation(
      patternOf([
        {
          hits: { crash: [1], ride: [2], hihat: [3], tom1: [1], tom2: [2], snare: [3], floorTom: [4], kick: [1], hihatPedal: [2] },
        },
        { hits: { hihatOpen: [1] } },
      ]),
    );
    const steps = new Map<string, number>();
    for (const measure of all.measures)
      for (const group of [...measure.voices.up, ...measure.voices.down])
        for (const event of group.events) for (const key of event.keys) steps.set(key.instrument, key.staffStep);
    expect(Object.fromEntries(steps)).toEqual({
      hihatPedal: -2,
      kick: 1,
      floorTom: 3,
      snare: 5,
      tom2: 6,
      tom1: 7,
      ride: 8,
      hihat: 9,
      hihatOpen: 9,
      crash: 10,
    });
  });
});

describe('Spec drum-notation › Notenköpfe', () => {
  it('Becken mit x-Notenkopf', () => {
    const model = toNotation(patternOf([{ hits: { ride: [1] } }]));
    expect(model.measures[0]!.voices.up[0]!.events[0]!.keys[0]).toMatchObject({ staffStep: 8, notehead: 'x' });
  });

  it('Offene Hi-Hat', () => {
    const model = toNotation(patternOf([{ hits: { hihatOpen: [1] } }]));
    expect(model.measures[0]!.voices.up[0]!.events[0]!.keys[0]).toMatchObject({
      staffStep: 9,
      notehead: 'x',
      open: true,
    });
  });

  it('Trommeln mit normalem, Hi-Hat-Pedal mit x-Notenkopf', () => {
    const model = toNotation(patternOf([{ hits: { snare: [1], hihatPedal: [1] } }]));
    expect(model.measures[0]!.voices.up[0]!.events[0]!.keys[0]!.notehead).toBe('normal');
    expect(model.measures[0]!.voices.down[0]!.events[0]!.keys[0]!.notehead).toBe('x');
  });
});

describe('Spec drum-notation › Hände und Füße als getrennte Stimmen', () => {
  it('Grundgroove', () => {
    const model = toNotation(patternOf([{ hits: { hihat: [1, 3], kick: [1], snare: [3] } }]));
    const up = model.measures[0]!.voices.up[0]!.events;
    const down = model.measures[0]!.voices.down[0]!.events;
    expect(up.map(instrumentsOf)).toEqual([['hihat'], ['snare', 'hihat']]);
    expect(down.filter((e) => e.kind === 'note').map(instrumentsOf)).toEqual([['kick']]);
  });
});

describe('Spec drum-notation › Notenwerte und Pausen aus dem Raster', () => {
  it('Achtel aus Sechzehntel-Raster', () => {
    const model = toNotation(patternOf([{ hits: { hihat: [1, 3] } }]));
    expect(summary(model.measures[0]!.voices.up[0]!.events)).toEqual(['8', '8']);
  });

  it('Pause vor Offbeat', () => {
    const model = toNotation(patternOf([{ hits: { snare: [3] } }]));
    expect(summary(model.measures[0]!.voices.up[0]!.events)).toEqual(['8r', '8']);
  });

  it('Leerer Beat für die Füße', () => {
    const model = toNotation(patternOf([{ hits: { kick: [1] } }, {}, { hits: { kick: [1] } }, {}]));
    expect(model.measures[0]!.voices.down.map((g) => summary(g.events))).toEqual([['q'], ['qr'], ['q'], ['qr']]);
  });

  it('Stimme ohne Schläge im Takt', () => {
    const model = toNotation(patternOf(Array.from({ length: 4 }, () => ({ hits: { hihat: [1, 3] } }))));
    expect(model.measures[0]!.voices.down.map((g) => g.events)).toEqual([[], [], [], []]);
  });

  it('Halbe Pause', () => {
    const model = toNotation(patternOf([{}, {}, { hits: { kick: [1] } }, { hits: { kick: [1] } }]));
    expect(model.measures[0]!.voices.down.map((g) => summary(g.events))).toEqual([['hr'], [], ['q'], ['q']]);
  });

  it('Halbe Pause auf 3 und 4', () => {
    const model = toNotation(patternOf([{ hits: { snare: [1] } }, {}, {}, {}]));
    expect(model.measures[0]!.voices.up.map((g) => summary(g.events))).toEqual([['q'], ['qr'], ['hr'], []]);
  });

  it('Taktmitte bleibt sichtbar', () => {
    const model = toNotation(patternOf([{ hits: { kick: [1] } }, {}, {}, { hits: { kick: [1] } }]));
    expect(model.measures[0]!.voices.down.map((g) => summary(g.events))).toEqual([['q'], ['qr'], ['qr'], ['q']]);
  });

  it('Unvollständiger Takt', () => {
    const model = toNotation(patternOf([...emptyBeats(4), {}, { hits: { kick: [1] } }]));
    expect(model.measures[1]!.voices.down.map((g) => summary(g.events))).toEqual([['qr'], ['q']]);
  });

  it('Sechzehntel-Figuren', () => {
    const model = toNotation(patternOf([{ hits: { kick: [1, 4] } }, { hits: { kick: [2] } }]));
    const [beat1, beat2] = model.measures[0]!.voices.down;
    expect(summary(beat1!.events)).toEqual(['8d', '16']);
    expect(summary(beat2!.events)).toEqual(['16r', '8d']);
  });
});

describe('Spec drum-notation › Notenwerte und Pausen aus dem Raster (Zweiunddreißigstel)', () => {
  const upEvents = (hits: number[]) =>
    toNotation(patternOf([{ sub: 8, hits: { snare: hits } }], 'fill')).measures[0]!.voices.up[0]!;

  it('Zweiunddreißigstel', () => {
    const group = upEvents([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(summary(group.events)).toEqual(Array(8).fill('32'));
    expect(group.beamed).toBe(true);
    expect(group.tuplet).toBeNull();
  });

  it('Punktierte Sechzehntel aus Zweiunddreißigstel-Raster', () => {
    expect(summary(upEvents([1, 4]).events)).toEqual(['16d', '8', '32r']);
  });

  it('Pause vor Zweiunddreißigstel', () => {
    const events = upEvents([8]).events;
    const units: Record<string, number> = { q: 8, '8d': 6, '8': 4, '16d': 3, '16': 2, '32': 1 };
    const rests = events.filter((e) => e.kind === 'rest');
    expect(rests.reduce((sum, e) => sum + units[e.duration]!, 0)).toBe(7);
    expect(events.at(-1)).toMatchObject({ kind: 'note', duration: '32' });
    expect(events.slice(0, -1).every((e) => e.kind === 'rest')).toBe(true);
  });
});

describe('Spec drum-notation › Balken pro Beat', () => {
  it('Sechzehntel im Beat', () => {
    const model = toNotation(patternOf([{ hits: { hihat: [1, 2, 3, 4] } }, { hits: { hihat: [1, 2, 3, 4] } }]));
    const groups = model.measures[0]!.voices.up;
    expect(groups).toHaveLength(2);
    for (const group of groups) {
      expect(group.beamed).toBe(true);
      expect(summary(group.events)).toEqual(['16', '16', '16', '16']);
    }
  });

  it('Einzelne Viertel wird nicht gebalkt', () => {
    const model = toNotation(patternOf([{ hits: { snare: [1] } }]));
    expect(model.measures[0]!.voices.up[0]!.beamed).toBe(false);
  });
});

describe('Spec drum-notation › Triolen kennzeichnen', () => {
  it('Zweiunddreißigsteltriole', () => {
    const model = toNotation(patternOf([{ sub: 12, hits: { snare: Array.from({ length: 12 }, (_, i) => i + 1) } }], 'fill'));
    const group = model.measures[0]!.voices.up[0]!;
    expect(summary(group.events)).toEqual(Array(12).fill('32'));
    expect(group.beamed).toBe(true);
    expect(group.tuplet).toBe(12);
  });

  it('Achteltriole', () => {
    const model = toNotation(patternOf([{}, {}, { sub: 3, hits: { snare: [1, 2, 3] } }, {}]));
    const group = model.measures[0]!.voices.up[2] as BeatGroup;
    expect(group.tuplet).toBe(3);
    expect(group.beamed).toBe(true);
    expect(summary(group.events)).toEqual(['8', '8', '8']);
  });

  it('Sechzehnteltriole', () => {
    const model = toNotation(patternOf([{ sub: 6, hits: { snare: [1, 2, 3, 4, 5, 6] } }]));
    expect(model.measures[0]!.voices.up[0]!.tuplet).toBe(6);
  });

  it('Gemischtes Pattern', () => {
    const model = toNotation(
      patternOf([
        { hits: { hihat: [1, 3] } },
        { hits: { hihat: [1, 3] } },
        { sub: 3, hits: { hihat: [1, 2, 3], kick: [1] } },
        { hits: { hihat: [1, 3] } },
      ]),
    );
    const voices = model.measures[0]!.voices;
    expect(voices.up.map((g) => g.tuplet)).toEqual([null, null, 3, null]);
    expect(voices.down.map((g) => g.tuplet)).toEqual([null, null, 3, null]);
  });

  it('Stimme ohne Noten im Triolen-Beat bekommt keine Kennzeichnung', () => {
    const model = toNotation(patternOf([{ sub: 3, hits: { snare: [1, 2, 3] } }]));
    expect(model.measures[0]!.voices.down[0]!.tuplet).toBeNull();
  });
});

describe('Spec drum-notation › Leeres Pattern', () => {
  it('Neuer Groove', () => {
    const model = toNotation(patternOf(emptyBeats(4)));
    const { up, down } = model.measures[0]!.voices;
    expect(up.map((g) => summary(g.events))).toEqual([['wr'], [], [], []]);
    expect(down.map((g) => g.events)).toEqual([[], [], [], []]);
  });

  it('Leerer kurzer Fill', () => {
    const model = toNotation(patternOf(emptyBeats(2), 'fill'));
    const { up, down } = model.measures[0]!.voices;
    expect(up.map((g) => summary(g.events))).toEqual([['qr'], ['qr']]);
    expect(down.map((g) => g.events)).toEqual([[], []]);
  });
});

describe('Spec drum-notation › Flam und Ghost Note (Modell)', () => {
  const withArt = (pattern: ReturnType<typeof patternOf>, articulations: Beat['articulations']) => ({
    ...pattern,
    beats: pattern.beats.map((b, i) => (i === 0 ? { ...b, articulations } : b)),
  });
  const keysAt = (model: ReturnType<typeof toNotation>, event = 0) =>
    model.measures[0]!.voices.up[0]!.events[event]!.keys.map((k) => [k.instrument, k.articulation]);

  it('Flam auf der Snare', () => {
    const model = toNotation(withArt(patternOf([{ hits: { snare: [1] } }]), { snare: { 0: 'flam' } }));
    expect(keysAt(model)).toEqual([['snare', 'flam']]);
  });

  it('Flam im Akkord', () => {
    const model = toNotation(withArt(patternOf([{ hits: { snare: [1], hihat: [1] } }]), { snare: { 0: 'flam' } }));
    expect(keysAt(model)).toEqual([
      ['snare', 'flam'],
      ['hihat', undefined],
    ]);
  });

  it('Ghost Note auf der Snare', () => {
    const model = toNotation(withArt(patternOf([{ hits: { snare: [2] } }]), { snare: { 1: 'ghost' } }));
    expect(keysAt(model, 1)).toEqual([['snare', 'ghost']]);
  });

  it('Ghost Note im Akkord', () => {
    const model = toNotation(withArt(patternOf([{ hits: { snare: [2], hihat: [2] } }]), { snare: { 1: 'ghost' } }));
    expect(keysAt(model, 1)).toEqual([
      ['snare', 'ghost'],
      ['hihat', undefined],
    ]);
  });
});
