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

export interface Pattern {
  id: string;
  kind: PatternKind;
  name: string;
  /** Länge in Beats = beats.length (1..16). */
  beats: Beat[];
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export const MIN_LENGTH = 1;
export const MAX_LENGTH = 16;
export const DEFAULT_SUBDIVISION: Subdivision = 4;
