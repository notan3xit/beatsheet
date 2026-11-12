import { describe, expect, it } from 'vitest';
import { FakeAudioContext, type FakeGain, type FakeNode } from '../test/fakeAudio';
import { createClick } from './click';
import { RECIPES, TECHNIQUE_RECIPES } from './voices';

function setup() {
  const ctx = new FakeAudioContext();
  const click = createClick(ctx as unknown as BaseAudioContext);
  return { ctx, click };
}

const oscillatorAt = (ctx: FakeAudioContext, time: number) => ctx.sourcesAt(time).find((s) => s.kind === 'oscillator')!;
const envelopeOf = (node: FakeNode) => node.outputs.find((n) => (n as FakeNode).kind === 'gain') as FakeGain;
const peak = (gain: FakeGain) => gain.gain.events.find((e) => e.type === 'set')!.value!;
const reaches = (node: FakeNode, target: FakeNode): boolean =>
  node === target || (node.outputs as FakeNode[]).some((out) => reaches(out, target));

describe('Spec practice-click › Klang des Metronoms', () => {
  it('Betonter Klick ist höher und lauter', () => {
    const { ctx, click } = setup();
    click.click(0, true);
    click.click(1, false);
    const [accented, plain] = [oscillatorAt(ctx, 0), oscillatorAt(ctx, 1)];
    expect(accented.frequency.events[0]!.value).toBeGreaterThan(plain.frequency.events[0]!.value!);
    expect(peak(envelopeOf(accented))).toBeGreaterThan(peak(envelopeOf(plain)));
    expect(reaches(accented, ctx.destination)).toBe(true);
  });

  it('Eigener Klang: keine Tonhöhe eines Instruments', () => {
    const { ctx, click } = setup();
    click.click(0, true);
    click.click(1, false);
    const tones = [...Object.values(RECIPES), ...Object.values(TECHNIQUE_RECIPES)].flat().map((l) => l.frequency);
    for (const time of [0, 1]) expect(tones).not.toContain(oscillatorAt(ctx, time).frequency.events[0]!.value);
  });

  it('silence trennt geplante Klicks vom Ausgang, spätere klingen wieder', () => {
    const { ctx, click } = setup();
    click.click(5, true);
    click.silence();
    expect(reaches(oscillatorAt(ctx, 5), ctx.destination)).toBe(false);
    click.click(6, false);
    expect(reaches(oscillatorAt(ctx, 6), ctx.destination)).toBe(true);
  });
});
