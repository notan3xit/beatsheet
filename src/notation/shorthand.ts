import type { Instrument, Pattern } from '../domain/types';

/** Ein Buchstabe der Fill-Kurzschrift (fill-shorthand, design.md D1). */
export interface ShorthandMark {
  /** Zeitpunkt in Beats ab Pattern-Anfang. */
  time: number;
  /** Breite des Rasterplatzes in Beats (1 / Unterteilung). */
  slot: number;
  /** Höhenstufe: 0 oben (Crash, Toms), 1 Mitte (Snare), 2 unten (Floor Tom, Kick). */
  level: 0 | 1 | 2;
  char: string;
}

/** Instrumente in Vorrangreihenfolge; je Stufe gewinnt der erste Treffer. Nicht genannte entfallen. */
const ORDER: { instrument: Instrument; level: ShorthandMark['level']; char: string; flamChar?: string }[] = [
  { instrument: 'crash', level: 0, char: "'" },
  { instrument: 'tom1', level: 0, char: 't' },
  { instrument: 'tom2', level: 0, char: 't' },
  { instrument: 'snare', level: 1, char: 's', flamChar: 'v' },
  { instrument: 'floorTom', level: 2, char: 'f' },
  { instrument: 'kick', level: 2, char: 'k' },
];

/** Kurzschrift eines Patterns: Buchstaben an ihren Zeitpunkten, Ghost Notes zählen nicht. */
export function shorthand(pattern: Pattern): ShorthandMark[] {
  const marks: ShorthandMark[] = [];
  pattern.beats.forEach((beat, b) => {
    const slot = 1 / beat.subdivision;
    for (let position = 0; position < beat.subdivision; position++) {
      const found: ShorthandMark[] = [];
      const taken = new Set<number>();
      for (const entry of ORDER) {
        if (taken.has(entry.level) || !(beat.hits[entry.instrument] ?? []).includes(position)) continue;
        const articulation = beat.articulations?.[entry.instrument]?.[position];
        if (articulation === 'ghost') continue;
        const char = articulation === 'flam' && entry.flamChar ? entry.flamChar : entry.char;
        taken.add(entry.level);
        found.push({ time: b + position * slot, slot, level: entry.level, char });
      }
      marks.push(...found.sort((x, y) => x.level - y.level));
    }
  });
  return marks;
}
