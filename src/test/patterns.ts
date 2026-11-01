import { createPattern } from '../domain/pattern';
import type { Beat, Instrument, Pattern, PatternKind, Subdivision } from '../domain/types';

/** Testhilfe: Pattern mit Beats aus kompakter Beschreibung. Positionen sind 1-basiert wie in den Specs. */
export function patternOf(
  beats: { sub?: Subdivision; hits?: Partial<Record<Instrument, number[]>> }[],
  kind: PatternKind = 'groove',
): Pattern {
  const pattern = createPattern([], { kind, length: beats.length });
  pattern.beats = beats.map(
    (b): Beat => ({
      subdivision: b.sub ?? 4,
      hits: Object.fromEntries(
        Object.entries(b.hits ?? {}).map(([instrument, positions]) => [instrument, positions.map((p) => p - 1)]),
      ),
    }),
  );
  return pattern;
}

export const emptyBeats = (count: number) => Array.from({ length: count }, () => ({}));
