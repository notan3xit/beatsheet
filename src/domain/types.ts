import type { AccentName } from '@catppuccin/palette';

/** Instrumente in der Reihenfolge der Sequencer-Zeilen (oben nach unten). */
export const INSTRUMENTS = [
  'crash',
  'ride',
  'hihat',
  'hihatOpen',
  'tom1',
  'tom2',
  'snare',
  'floorTom',
  'kick',
  'hihatPedal',
] as const;

export type Instrument = (typeof INSTRUMENTS)[number];

export const INSTRUMENT_LABELS: Record<Instrument, string> = {
  crash: 'Crash',
  ride: 'Ride',
  hihat: 'Hi-Hat (geschlossen)',
  hihatOpen: 'Hi-Hat (offen)',
  tom1: 'Tom 1',
  tom2: 'Tom 2',
  snare: 'Snare',
  floorTom: 'Standtom',
  kick: 'Bassdrum',
  hihatPedal: 'Hi-Hat-Pedal',
};

export const SUBDIVISIONS = [2, 4, 3, 6] as const;
export type Subdivision = (typeof SUBDIVISIONS)[number];

export const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  2: 'Achtel',
  4: 'Sechzehntel',
  3: 'Achteltriolen',
  6: 'Sechzehnteltriolen',
};

export interface Beat {
  subdivision: Subdivision;
  /** 0-basierte Positionen je Instrument, sortiert und eindeutig. */
  hits: Partial<Record<Instrument, number[]>>;
}

export type PatternKind = 'groove' | 'fill';

/** Catppuccin-Akzent als Name; red ist für Fehler reserviert. */
export type PatternColor = Exclude<AccentName, 'red'>;

/** Vergabereihenfolge der Pattern-Farben (größtmöglicher Abstand zuerst). */
export const PATTERN_COLORS: readonly PatternColor[] = [
  'blue',
  'green',
  'peach',
  'mauve',
  'teal',
  'yellow',
  'pink',
  'sapphire',
  'maroon',
  'lavender',
  'sky',
  'flamingo',
  'rosewater',
];

export interface Pattern {
  id: string;
  kind: PatternKind;
  name: string;
  color: PatternColor;
  /** Länge in Beats = beats.length (1..16). */
  beats: Beat[];
  createdAt: string;
  updatedAt: string;
  revision: number;
}

/** Zusätzlicher Schlag über Groove/Fill; Position im Sechzehntel-Raster des Takts. */
export interface Accent {
  instrument: Instrument;
  /** Beat im Takt, 0-basiert. */
  beat: number;
  /** Sechzehntel im Beat, 0-basiert. */
  position: 0 | 1 | 2 | 3;
}

export interface Bar {
  id: string;
  /** Länge in Beats (Viertel-Taktart), 1..16. */
  beats: number;
  grooveId: string | null;
  /** Fill, der am Ende dieses Takts endet und nach links überdeckt. */
  fillId: string | null;
  accents: Accent[];
}

/** Logische Gruppierung von Takten; Grooves beginnen am Blockanfang neu. */
export interface Block {
  id: string;
  bars: Bar[];
}

export interface Segment {
  id: string;
  name: string;
  blocks: Block[];
}

export interface Song {
  id: string;
  title: string;
  patterns: Pattern[];
  segments: Segment[];
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export const MAX_BAR_BEATS = 16;
export const MAX_SEGMENT_BARS = 64;

export const MIN_LENGTH = 1;
export const MAX_LENGTH = 16;
export const DEFAULT_SUBDIVISION: Subdivision = 4;
