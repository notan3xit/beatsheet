import { describe, expect, it } from 'vitest';
import { INSTRUMENTS, type Instrument } from '../domain/types';
import { FakeAudioContext, FakeSource, type FakeGain, type FakeNode } from '../test/fakeAudio';
import { createVoices, RECIPES, TECHNIQUE_RECIPES } from './voices';

function setup() {
  const ctx = new FakeAudioContext();
  const voices = createVoices(ctx as unknown as BaseAudioContext);
  return { ctx, voices };
}

/** Hüllkurven-Gains, die von den Quellen eines Schlags zur Zeit `time` gespeist werden. */
function envelopesAt(ctx: FakeAudioContext, time: number): FakeGain[] {
  const reach = (node: FakeNode): FakeGain | undefined => {
    for (const out of node.outputs as FakeNode[]) {
      if (out.kind === 'gain') return out as FakeGain;
      const found = reach(out);
      if (found) return found;
    }
    return undefined;
  };
  return ctx.sourcesAt(time).map((s) => reach(s)!);
}

const peak = (gain: FakeGain) => gain.gain.events.find((e) => e.type === 'set')!.value!;
const toneFrequency = (instrument: Instrument) => RECIPES[instrument].find((l) => l.wave !== 'noise')!.frequency!;

describe('Spec pattern-playback › Klang der Instrumente', () => {
  it('Jedes Instrument klingt, mit eigener Rezeptur', () => {
    const { ctx, voices } = setup();
    INSTRUMENTS.forEach((instrument, i) => voices.trigger(instrument, i, 1));
    INSTRUMENTS.forEach((_, i) => expect(ctx.sourcesAt(i).length).toBeGreaterThan(0));
    expect(new Set(INSTRUMENTS.map((i) => JSON.stringify(RECIPES[i]))).size).toBe(INSTRUMENTS.length);
  });

  it('Schläge erreichen den Ausgang', () => {
    const { ctx, voices } = setup();
    voices.trigger('kick', 0, 1);
    const reachesDestination = (node: FakeNode): boolean =>
      node === ctx.destination || (node.outputs as FakeNode[]).some(reachesDestination);
    expect(ctx.sourcesAt(0).every(reachesDestination)).toBe(true);
  });

  it('Tonhöhe der Toms: Tom 1 > Tom 2 > Standtom', () => {
    expect(toneFrequency('tom1')).toBeGreaterThan(toneFrequency('tom2'));
    expect(toneFrequency('tom2')).toBeGreaterThan(toneFrequency('floorTom'));
    const { ctx, voices } = setup();
    (['tom1', 'tom2', 'floorTom'] as const).forEach((tom, i) => voices.trigger(tom, i, 1));
    const started = [0, 1, 2].map((t) => ctx.sourcesAt(t).find((s) => s.kind === 'oscillator')!.frequency.events[0]!.value!);
    expect(started[0]).toBeGreaterThan(started[1]!);
    expect(started[1]).toBeGreaterThan(started[2]!);
  });

  it('Pegel des Ereignisses skaliert den Klang (Ghost Note leiser)', () => {
    const { ctx, voices } = setup();
    voices.trigger('snare', 0, 1);
    voices.trigger('snare', 1, 0.3);
    const normal = envelopesAt(ctx, 0).map(peak);
    const ghost = envelopesAt(ctx, 1).map(peak);
    ghost.forEach((g, i) => expect(g).toBeCloseTo(normal[i]! * 0.3, 9));
  });
});

describe('Spec pattern-playback › Offene Hi-Hat klingt nach', () => {
  const lastStop = (ctx: FakeAudioContext, time: number) => Math.max(...ctx.sourcesAt(time).map((s) => s.stoppedAt!));

  it('offene Hi-Hat klingt länger als geschlossene', () => {
    const { ctx, voices } = setup();
    voices.trigger('hihat', 0, 1);
    voices.trigger('hihatOpen', 10, 1);
    expect(lastStop(ctx, 10) - 10).toBeGreaterThan(lastStop(ctx, 0) * 3);
  });

  it.each(['hihatPedal', 'hihat'] as const)('Abgestoppt durch %s', (closer) => {
    const { ctx, voices } = setup();
    voices.trigger('hihatOpen', 0, 1);
    voices.trigger(closer, 0.5, 1);
    for (const envelope of envelopesAt(ctx, 0)) {
      const events = envelope.gain.events;
      expect(events).toContainEqual({ type: 'cancel', time: 0.5 });
      expect(events.at(-1)).toMatchObject({ type: 'target', value: 0, time: 0.5 });
    }
  });

  it('Pedal auf derselben Position stoppt die offene Hi-Hat nicht', () => {
    const { ctx, voices } = setup();
    voices.trigger('hihatOpen', 0, 1);
    voices.trigger('hihatPedal', 0, 1);
    for (const envelope of envelopesAt(ctx, 0)) {
      expect(envelope.gain.events.some((e) => e.type === 'cancel')).toBe(false);
    }
  });
});

describe('Spec pattern-playback › Wiedergabe stoppen', () => {
  it('silence trennt bereits geplante Klänge vom Ausgang', () => {
    const { ctx, voices } = setup();
    voices.trigger('crash', 0.05, 1);
    const masters = ctx.nodes.filter((n) => n.outputs.length > 0 && !(n instanceof FakeSource));
    voices.silence();
    expect(masters.some((n) => n.disconnected)).toBe(true);
    voices.trigger('kick', 1, 1);
    const reachesDestination = (node: FakeNode): boolean =>
      node === ctx.destination || (node.outputs as FakeNode[]).some(reachesDestination);
    expect(ctx.sourcesAt(1).every(reachesDestination)).toBe(true);
    expect(ctx.sourcesAt(0.05).some(reachesDestination)).toBe(false);
  });
});

describe('Spec pattern-playback › Klang der Spielweisen (Synth)', () => {
  const key = (layers: unknown) => JSON.stringify(layers);

  it('Rim Shot, Cross-Stick und Glocke haben eigene Rezepturen', () => {
    expect(key(TECHNIQUE_RECIPES.rim)).not.toBe(key(RECIPES.snare));
    expect(key(TECHNIQUE_RECIPES.cross)).not.toBe(key(RECIPES.snare));
    expect(key(TECHNIQUE_RECIPES.cross)).not.toBe(key(TECHNIQUE_RECIPES.rim));
    expect(key(TECHNIQUE_RECIPES.bell)).not.toBe(key(RECIPES.ride));
  });

  it('Rim Shot ist lauter, Cross-Stick leiser und kürzer als die Snare', () => {
    const total = (layers: { level: number }[]) => layers.reduce((sum, l) => sum + l.level, 0);
    const longest = (layers: { decay: number }[]) => Math.max(...layers.map((l) => l.decay));
    expect(total(TECHNIQUE_RECIPES.rim)).toBeGreaterThan(total(RECIPES.snare));
    expect(total(TECHNIQUE_RECIPES.cross)).toBeLessThan(total(RECIPES.snare));
    expect(longest(TECHNIQUE_RECIPES.cross)).toBeLessThan(longest(RECIPES.snare));
  });

  it.each([
    ['snare', 'rim'],
    ['snare', 'cross'],
    ['ride', 'bell'],
  ] as const)('%s mit %s spielt die eigene Rezeptur', (instrument, technique) => {
    const { ctx, voices } = setup();
    voices.trigger(instrument, 1, 1, technique);
    expect(ctx.sourcesAt(1)).toHaveLength(TECHNIQUE_RECIPES[technique].length);
  });

  it('Choke: jede Schicht der Crash endet kurz nach dem Einsatz', () => {
    const { ctx, voices } = setup();
    voices.trigger('crash', 1, 1, 'choke');
    for (const envelope of envelopesAt(ctx, 1)) {
      expect(envelope.gain.events.at(-1)).toMatchObject({ type: 'target', value: 0, time: expect.closeTo(1.12, 9) });
    }
  });
});
