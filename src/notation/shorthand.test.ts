import { describe, expect, it } from 'vitest';
import type { Beat } from '../domain/types';
import { patternOf } from '../test/patterns';
import { shorthand } from './shorthand';

/** Kurzform: [Zeit, Stufe, Buchstabe]. */
const marks = (pattern: ReturnType<typeof patternOf>) => shorthand(pattern).map((m) => [m.time, m.level, m.char]);

const withArticulations = (pattern: ReturnType<typeof patternOf>, articulations: Beat['articulations']) => ({
  ...pattern,
  beats: pattern.beats.map((b, i) => (i === 0 ? { ...b, articulations } : b)),
});

describe('Spec songbook-view › Fill-Kurzschrift', () => {
  it('Tom-Run', () => {
    const fill = patternOf([{ hits: { snare: [1, 2], tom1: [3, 4] } }, { hits: { floorTom: [1, 2, 3, 4] } }], 'fill');
    expect(marks(fill)).toEqual([
      [0, 1, 's'],
      [0.25, 1, 's'],
      [0.5, 0, 't'],
      [0.75, 0, 't'],
      [1, 2, 'f'],
      [1.25, 2, 'f'],
      [1.5, 2, 'f'],
      [1.75, 2, 'f'],
    ]);
  });

  it('Gleichzeitige Schläge', () => {
    expect(marks(patternOf([{ hits: { kick: [1], crash: [1] } }], 'fill'))).toEqual([
      [0, 0, "'"],
      [0, 2, 'k'],
    ]);
  });

  it('Flam und Ghost Note', () => {
    const fill = withArticulations(patternOf([{ hits: { snare: [1, 2] } }], 'fill'), { snare: { 0: 'flam', 1: 'ghost' } });
    expect(marks(fill)).toEqual([[0, 1, 'v']]);
  });

  it('Hi-Hat entfällt', () => {
    expect(marks(patternOf([{ hits: { hihat: [1, 2, 3, 4], hihatOpen: [], ride: [], hihatPedal: [1] } }], 'fill'))).toEqual([]);
  });

  it('Vorrang f vor k und Crash vor Tom', () => {
    expect(marks(patternOf([{ hits: { kick: [1], floorTom: [1], crash: [1], tom2: [1] } }], 'fill'))).toEqual([
      [0, 0, "'"],
      [0, 2, 'f'],
    ]);
  });

  it('Tom-Flam bleibt t, Ghost-Tom entfällt', () => {
    const fill = withArticulations(patternOf([{ hits: { tom1: [1, 3] } }], 'fill'), { tom1: { 0: 'flam', 2: 'ghost' } });
    expect(marks(fill)).toEqual([[0, 0, 't']]);
  });

  it('Rasterbreite bei Triolen', () => {
    const [first] = shorthand(patternOf([{ sub: 3, hits: { snare: [2] } }], 'fill'));
    expect(first!.time).toBeCloseTo(1 / 3);
    expect(first!.slot).toBeCloseTo(1 / 3);
  });
});

describe('Fill-Kurzschrift mit Zweiunddreißigsteln (thirty-second-notes)', () => {
  it('Snare-Roll: acht Zeichen mit Breite 1/8', () => {
    const roll = shorthand(patternOf([{ sub: 8, hits: { snare: [1, 2, 3, 4, 5, 6, 7, 8] } }], 'fill'));
    expect(roll.map((m) => [m.time, m.char])).toEqual(Array.from({ length: 8 }, (_, i) => [i / 8, 's']));
    expect(roll.every((m) => m.slot === 1 / 8)).toBe(true);
  });
});
