import { describe, expect, it } from 'vitest';
import { songWith } from '../test/songs';
import { patternOf } from '../test/patterns';
import { FLAM_GRACE_GAIN, FLAM_GRACE_SECONDS, GHOST_GAIN, patternHits, patternSteps, setTempo } from './playback';

describe('Spec song-library › Song-Tempo', () => {
  it('Tempo ändern', () => {
    const song = { ...songWith({}), tempo: 120 };
    expect(setTempo(song, 140).tempo).toBe(140);
  });

  it('Tempo außerhalb des Bereichs wird abgelehnt', () => {
    const song = { ...songWith({}), tempo: 120 };
    for (const bpm of [29, 301, 72.5, 0, Number.NaN]) expect(setTempo(song, bpm)).toBe(song);
    expect(setTempo(song, 30).tempo).toBe(30);
    expect(setTempo(song, 300).tempo).toBe(300);
  });

  it('Gleiches Tempo ändert nichts', () => {
    const song = { ...songWith({}), tempo: 120 };
    expect(setTempo(song, 120)).toBe(song);
  });
});

describe('Spec pattern-playback › Zeitliche Lage der Schläge', () => {
  it('Sechzehntel: Position 2 liegt 1/4 Beat nach dem Beginn', () => {
    const hits = patternHits(patternOf([{ hits: { hihat: [2] } }]));
    expect(hits).toEqual([{ at: 0.25, instrument: 'hihat', gain: 1, step: { beat: 0, position: 1 } }]);
  });

  it('Gemischte Unterteilung: Beat 2 in Achteltriolen, Position 3', () => {
    const [hit] = patternHits(patternOf([{}, { sub: 3, hits: { snare: [3] } }]));
    expect(hit!.at).toBeCloseTo(5 / 3);
    expect(hit!.step).toEqual({ beat: 1, position: 2 });
  });

  it('Gleichzeitige Schläge', () => {
    const hits = patternHits(patternOf([{ hits: { kick: [1], crash: [1] } }]));
    expect(hits.map((h) => [h.instrument, h.at])).toEqual([
      ['crash', 0],
      ['kick', 0],
    ]);
  });

  it('nach Zeit sortiert', () => {
    const hits = patternHits(patternOf([{ hits: { kick: [3], hihat: [1, 2, 3, 4] } }, { sub: 3, hits: { snare: [1] } }]));
    const times = hits.map((h) => h.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(hits).toHaveLength(6);
  });
});

describe('Spec pattern-playback › Klang der Spielweisen', () => {
  const withArticulations = () => {
    const pattern = patternOf([{ hits: { snare: [1, 3], tom1: [2] } }]);
    pattern.beats[0] = { ...pattern.beats[0]!, articulations: { snare: { 0: 'ghost' }, tom1: { 1: 'flam' } } };
    return patternHits(pattern);
  };

  it('Ghost Note ist leiser als ein normaler Schlag', () => {
    const snare = withArticulations().filter((h) => h.instrument === 'snare');
    expect(snare[0]!.gain).toBe(GHOST_GAIN);
    expect(snare[0]!.gain).toBeLessThan(snare[1]!.gain);
    expect(snare[0]!.graceBefore).toBeUndefined();
  });

  it('Flam: Vorschlag vor der Position, Hauptschlag normal auf der Position', () => {
    const tom = withArticulations().find((h) => h.instrument === 'tom1')!;
    expect(tom).toMatchObject({ at: 0.25, gain: 1, graceBefore: FLAM_GRACE_SECONDS });
    expect(FLAM_GRACE_GAIN).toBeLessThan(1);
  });
});

describe('Spec pattern-playback › Wiedergabeposition', () => {
  it('Leeres Pattern: keine Schläge, aber alle Rasterpositionen', () => {
    const pattern = patternOf([{}, { sub: 3 }]);
    expect(patternHits(pattern)).toEqual([]);
    const steps = patternSteps(pattern);
    expect(steps.map((s) => [s.beat, s.position])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2],
    ]);
    expect(steps[5]!.at).toBeCloseTo(4 / 3);
  });
});

describe('Wiedergabe mit Zweiunddreißigsteln (thirty-second-notes)', () => {
  it('Position 2 eines Zweiunddreißigstel-Beats liegt 1/8 Beat nach dem Beginn', () => {
    const pattern = patternOf([{ sub: 8, hits: { snare: [2] } }]);
    expect(patternHits(pattern)).toEqual([{ at: 0.125, instrument: 'snare', gain: 1, step: { beat: 0, position: 1 } }]);
    expect(patternSteps(pattern)).toHaveLength(8);
  });

  it('Position 2 eines Zweiunddreißigsteltriolen-Beats liegt 1/12 Beat nach dem Beginn', () => {
    const pattern = patternOf([{ sub: 12, hits: { snare: [2] } }]);
    expect(patternHits(pattern)[0]!.at).toBeCloseTo(1 / 12, 12);
    expect(patternSteps(pattern)).toHaveLength(12);
  });
});
