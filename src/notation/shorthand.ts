import type { Articulation, Instrument, Pattern } from '../domain/types';

/** Ein Zeichen der Fill-Kurzschrift. */
export interface ShorthandMark {
  /** Zeitpunkt in Beats ab Pattern-Anfang. */
  time: number;
  /** Breite des Rasterplatzes in Beats (1 / Unterteilung). */
  slot: number;
  /** Höhenstufe: 0 oben (Becken, Toms), 1 Mitte (Snare), 2 unten (Floor Tom, Kick, Pedal). */
  level: 0 | 1 | 2;
  char: string;
}

/** Instrumente in Vorrangreihenfolge; je Stufe gewinnt der erste Treffer. */
const ORDER: {
  instrument: Instrument;
  level: ShorthandMark['level'];
  char: string;
  articulationChars?: Partial<Record<Articulation, string>>;
}[] = [
  { instrument: 'crash', level: 0, char: 'c' },
  { instrument: 'tom1', level: 0, char: 't' },
  { instrument: 'tom2', level: 0, char: 't' },
  { instrument: 'hihatOpen', level: 0, char: 'o' },
  { instrument: 'hihat', level: 0, char: 'x' },
  { instrument: 'ride', level: 0, char: 'r', articulationChars: { bell: 'b' } },
  { instrument: 'snare', level: 1, char: 's', articulationChars: { flam: 'v' } },
  { instrument: 'floorTom', level: 2, char: 'f' },
  { instrument: 'kick', level: 2, char: 'k' },
  { instrument: 'hihatPedal', level: 2, char: 'x' },
];

const GHOST_CHAR = '·';

/** Kurzschrift eines Patterns: Zeichen an ihren Zeitpunkten, normale Schläge vor Ghost Notes. */
export function shorthand(pattern: Pattern): ShorthandMark[] {
  const marks: ShorthandMark[] = [];
  pattern.beats.forEach((beat, b) => {
    const slot = 1 / beat.subdivision;
    for (let position = 0; position < beat.subdivision; position++) {
      const articulationOf = (instrument: Instrument) => beat.articulations?.[instrument]?.[position];
      const played = ORDER.filter((entry) => (beat.hits[entry.instrument] ?? []).includes(position));
      const isGhost = (entry: (typeof ORDER)[number]) => articulationOf(entry.instrument) === 'ghost';
      const found: ShorthandMark[] = [];
      const taken = new Set<number>();
      for (const entry of [...played.filter((e) => !isGhost(e)), ...played.filter(isGhost)]) {
        if (taken.has(entry.level)) continue;
        const articulation = articulationOf(entry.instrument);
        const char = isGhost(entry) ? GHOST_CHAR : ((articulation && entry.articulationChars?.[articulation]) ?? entry.char);
        taken.add(entry.level);
        found.push({ time: b + position * slot, slot, level: entry.level, char });
      }
      marks.push(...found.sort((x, y) => x.level - y.level));
    }
  });
  return marks;
}
