import { describe, expect, it } from 'vitest';
import { GRACE_GAIN, GHOST_GAIN } from '../domain/playback';
import { FakeAudioContext, type FakeGain, type FakeNode, type FakeSource } from '../test/fakeAudio';
import { SAMPLE_KEYS, type SampleBuffers } from './sampleLoader';
import { createSampleVoices } from './sampleVoices';

/** Kennung statt Audiodaten: jede Aufnahme ist ein Objekt mit ihrem Schlüssel. */
const BUFFERS = Object.fromEntries(SAMPLE_KEYS.map((key) => [key, { key }])) as unknown as SampleBuffers;

function setup() {
  const ctx = new FakeAudioContext();
  const voices = createSampleVoices(ctx as unknown as BaseAudioContext, () => BUFFERS);
  return { ctx, voices };
}

const played = (ctx: FakeAudioContext, time: number) =>
  ctx.sourcesAt(time).map((s) => (s.buffer as { key: string }).key);
const envelopeOf = (source: FakeSource) => source.outputs[0] as FakeGain;
const level = (ctx: FakeAudioContext, time: number) => envelopeOf(ctx.sourcesAt(time)[0]!).gain.events.find((e) => e.type === 'set')!.value!;

describe('Spec playback-sound › Klang der Aufnahmen', () => {
  it('Normaler Schlag: Aufnahme des normalen Snare-Schlags mit vollem Pegel', () => {
    const { ctx, voices } = setup();
    voices.trigger('snare', 1, 1);
    expect(played(ctx, 1)).toEqual(['snare-normal']);
    expect(level(ctx, 1)).toBe(1);
  });

  it('Ghost Note: Aufnahme des leisen Snare-Schlags, unverändert im Pegel', () => {
    const { ctx, voices } = setup();
    voices.trigger('snare', 1, GHOST_GAIN);
    expect(played(ctx, 1)).toEqual(['snare-soft']);
    expect(level(ctx, 1)).toBeCloseTo(1, 9);
  });

  it('Flam: Vorschlag mit dem leisen, Hauptschlag mit dem normalen Tom-1-Schlag', () => {
    const { ctx, voices } = setup();
    voices.trigger('tom1', 0.97, GRACE_GAIN);
    voices.trigger('tom1', 1, 1);
    expect(played(ctx, 0.97)).toEqual(['tom1-soft']);
    expect(played(ctx, 1)).toEqual(['tom1-normal']);
    expect(level(ctx, 0.97)).toBeLessThanOrEqual(1);
  });

  it('jedes Instrument spielt seine eigene Aufnahme und erreicht den Ausgang', () => {
    const { ctx, voices } = setup();
    const instruments = [...new Set(SAMPLE_KEYS.map((k) => k.split('-')[0]!))];
    instruments.forEach((instrument, i) => voices.trigger(instrument as never, i, 1));
    expect(instruments.map((_, i) => played(ctx, i)[0])).toEqual(instruments.map((i) => `${i}-normal`));
    const reaches = (node: FakeNode): boolean => node === ctx.destination || (node.outputs as FakeNode[]).some(reaches);
    expect(ctx.sourcesAt(0).every(reaches)).toBe(true);
  });

  it('ohne geladene Aufnahmen klingt nichts', () => {
    const ctx = new FakeAudioContext();
    const voices = createSampleVoices(ctx as unknown as BaseAudioContext, () => null);
    voices.trigger('kick', 0, 1);
    expect(ctx.sourcesAt(0)).toEqual([]);
  });
});

describe('Spec pattern-playback › Offene Hi-Hat mit Aufnahmen abgestoppt', () => {
  it.each(['hihat', 'hihatPedal'] as const)('durch %s', (closer) => {
    const { ctx, voices } = setup();
    voices.trigger('hihatOpen', 0, 1);
    voices.trigger(closer, 0.5, 1);
    const events = envelopeOf(ctx.sourcesAt(0)[0]!).gain.events;
    expect(events).toContainEqual({ type: 'cancel', time: 0.5 });
    expect(events.at(-1)).toMatchObject({ type: 'target', value: 0, time: 0.5 });
  });

  it('ein späterer Schlag derselben offenen Hi-Hat bleibt unberührt', () => {
    const { ctx, voices } = setup();
    voices.trigger('hihatOpen', 0, 1);
    voices.trigger('hihat', 0.5, 1);
    voices.trigger('hihat', 0.75, 1);
    const events = envelopeOf(ctx.sourcesAt(0)[0]!).gain.events;
    expect(events.filter((e) => e.type === 'cancel')).toHaveLength(1);
  });
});

describe('Spec pattern-playback › Wiedergabe stoppen', () => {
  it('silence trennt bereits geplante Klänge vom Ausgang', () => {
    const { ctx, voices } = setup();
    voices.trigger('crash', 2, 1);
    voices.silence();
    const reaches = (node: FakeNode): boolean => node === ctx.destination || (node.outputs as FakeNode[]).some(reaches);
    expect(ctx.sourcesAt(2).some(reaches)).toBe(false);
    voices.trigger('kick', 3, 1);
    expect(ctx.sourcesAt(3).every(reaches)).toBe(true);
  });
});

describe('Spec playback-sound › Klang der Aufnahmen (eigene Aufnahmen der Spielweisen)', () => {
  it.each([
    ['snare', 'rim', 'snare-rim'],
    ['snare', 'cross', 'snare-cross'],
    ['ride', 'bell', 'ride-bell'],
  ] as const)('%s mit %s spielt %s', (instrument, technique, key) => {
    const { ctx, voices } = setup();
    voices.trigger(instrument, 1, 1, technique);
    expect(played(ctx, 1)).toEqual([key]);
    expect(level(ctx, 1)).toBe(1);
  });

  it('Betonte Spielweise behält die Aufnahme und wird lauter', () => {
    const { ctx, voices } = setup();
    voices.trigger('snare', 1, 1.6, 'rim');
    expect(played(ctx, 1)).toEqual(['snare-rim']);
    expect(level(ctx, 1)).toBe(1.6);
  });

  it('Choke: Aufnahme des normalen Crash-Schlags, endet kurz nach dem Einsatz', () => {
    const { ctx, voices } = setup();
    voices.trigger('crash', 1, 1, 'choke');
    expect(played(ctx, 1)).toEqual(['crash-normal']);
    const fade = envelopeOf(ctx.sourcesAt(1)[0]!).gain.events.find((e) => e.type === 'target')!;
    expect(fade).toMatchObject({ value: 0, time: expect.closeTo(1.12, 9) });
  });

  it('Normaler Crash wird nicht abgeschnitten', () => {
    const { ctx, voices } = setup();
    voices.trigger('crash', 1, 1);
    expect(envelopeOf(ctx.sourcesAt(1)[0]!).gain.events.some((e) => e.type === 'target')).toBe(false);
  });

  it('Betonter normaler Schlag spielt die normale Aufnahme lauter', () => {
    const { ctx, voices } = setup();
    voices.trigger('hihat', 1, 1.6);
    expect(played(ctx, 1)).toEqual(['hihat-normal']);
    expect(level(ctx, 1)).toBe(1.6);
  });
});
