import { describe, expect, it } from 'vitest';
import { defaultPracticeTempo, practiceTempo, stepPracticeTempo } from './practice';
import { MAX_TEMPO, MIN_TEMPO } from './types';

describe('Spec practice-tempo › Vorgabe des Übetempos', () => {
  it('Vorgabe: 75 % des Song-Tempos, auf 5 gerundet', () => {
    expect(defaultPracticeTempo(130)).toBe(100);
    expect(defaultPracticeTempo(120)).toBe(90);
  });

  it('mindestens das kleinste gültige Tempo', () => {
    expect(defaultPracticeTempo(MIN_TEMPO)).toBe(MIN_TEMPO);
  });

  it('gespeicherter Wert vor Vorgabe', () => {
    expect(practiceTempo(85, 120)).toBe(85);
    expect(practiceTempo(undefined, 120)).toBe(90);
  });
});

describe('Spec practice-tempo › Übetempo in Schritten', () => {
  it('Erhöhen', () => {
    expect(stepPracticeTempo(90, 5)).toBe(95);
  });

  it('Über das Song-Tempo hinaus', () => {
    expect(stepPracticeTempo(120, 5)).toBe(125);
  });

  it('An der Obergrenze', () => {
    expect(stepPracticeTempo(298, 5)).toBe(MAX_TEMPO);
  });

  it('untere Grenze beim Verringern', () => {
    expect(stepPracticeTempo(MIN_TEMPO + 2, -5)).toBe(MIN_TEMPO);
  });
});

describe('Spec practice-tempo › Übetempo unabhängig vom Song-Tempo', () => {
  it('Song-Tempo gesenkt: gespeicherter Wert bleibt', () => {
    expect(practiceTempo(100, 80)).toBe(100);
  });
});
