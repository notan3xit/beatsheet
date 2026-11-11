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
  floorTom: 'Floor Tom',
  kick: 'Kick Drum',
  hihatPedal: 'Hi-Hat-Pedal',
};

/** Reihenfolge der Auswahl: gerade Werte aufsteigend, dann Triolen. */
export const SUBDIVISIONS = [2, 4, 8, 3, 6, 12] as const;
export type Subdivision = (typeof SUBDIVISIONS)[number];

/** Kurze Bezeichnungen für die schmale Auswahl im Sequencer. */
export const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  2: '8tel',
  4: '16tel',
  8: '32tel',
  3: '8tel-Triolen',
  6: '16tel-Triolen',
  12: '32tel-Triolen',
};

/** Spielweise eines Schlags; fehlt sie, wird normal gespielt. */
export const ARTICULATIONS = ['flam', 'drag', 'ghost', 'rim', 'cross', 'bell', 'choke'] as const;
export type Articulation = (typeof ARTICULATIONS)[number];

export const ARTICULATION_LABELS: Record<Articulation, string> = {
  flam: 'Flam',
  drag: 'Drag',
  ghost: 'Ghost Note',
  rim: 'Rim Shot',
  cross: 'Cross-Stick',
  bell: 'Bell',
  choke: 'Choke',
};

const DRUM_ARTICULATIONS = ['flam', 'drag', 'ghost'] as const;

/** Zulässige Spielweisen je Instrument in der Reihenfolge des Durchschaltens; fehlende Instrumente haben keine. */
export const ARTICULATIONS_BY_INSTRUMENT: Partial<Record<Instrument, readonly Articulation[]>> = {
  snare: [...DRUM_ARTICULATIONS, 'rim', 'cross'],
  tom1: DRUM_ARTICULATIONS,
  tom2: DRUM_ARTICULATIONS,
  floorTom: DRUM_ARTICULATIONS,
  ride: ['bell'],
  crash: ['choke'],
};

export interface Beat {
  subdivision: Subdivision;
  /** 0-basierte Positionen je Instrument, sortiert und eindeutig. */
  hits: Partial<Record<Instrument, number[]>>;
  /**
   * Spielweise je Instrument und Position (nur für gesetzte Schläge, nur zulässige Werte).
   * Fehlt das Feld oder ein Eintrag, wird normal gespielt; leere Einträge werden entfernt.
   */
  articulations?: Partial<Record<Instrument, Record<number, Articulation>>>;
  /** Betonte Positionen je Instrument, sortiert (nur gesetzte Schläge, keine Ghost Notes); leere Einträge werden entfernt. */
  emphasis?: Partial<Record<Instrument, number[]>>;
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
  /** Eigene Taktart in Beats pro Takt, ein Wert aus METERS; fehlt sie, folgt das Pattern dem Song. */
  meter?: number;
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
  /** Tempo in BPM, ganzzahlig von MIN_TEMPO bis MAX_TEMPO. */
  tempo: number;
  /** Standard-Takt in Beats pro Takt, ein Wert aus METERS; fehlt er, gilt DEFAULT_METER. */
  meter?: number;
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

export const DEFAULT_TEMPO = 120;
export const MIN_TEMPO = 30;
export const MAX_TEMPO = 300;

/** Erlaubte Taktarten als Beats pro Takt; ein Beat ist eine Viertel. */
export const METERS = [3, 4, 5, 6, 7] as const;
export const DEFAULT_METER = 4;

/** Name und Farbe eines Accounts, unter denen ihn andere Mitglieder sehen (member-profiles). */
export interface MemberProfile {
  name: string;
  /** 1–2 Zeichen für die Kreise, aus dem Namen vorbelegt. */
  initials: string;
  color: PatternColor;
}

/** Mitglied eines Workbooks (account-id-authorship, design.md D3). */
export interface Member {
  email: string;
  /** Kennung des Kontos; fehlt, solange sich die Adresse nie angemeldet hat. */
  account?: string;
  profile?: MemberProfile;
}

/** Workbook, wie es der Server liefert; der Besitzer zuerst unter den Mitgliedern. */
export interface Workbook {
  id: string;
  title: string;
  /** Adresse des Besitzers. */
  owner: string;
  members: Member[];
  /** Der eigene Bestand des Accounts; erscheint als „Meine Songs“, nicht als Workbook. */
  personal?: boolean;
}
