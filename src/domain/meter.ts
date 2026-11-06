import { DEFAULT_METER, METERS, type Pattern, type Song } from './types';

export const isValidMeter = (meter: number): boolean => (METERS as readonly number[]).includes(meter);

/** Standard-Takt des Songs. */
export const songMeter = (song: Song): number => song.meter ?? DEFAULT_METER;

/** Wirksame Taktart: die eigene des Patterns, sonst die des Songs. */
export const patternMeter = (pattern: Pattern, song: Song): number => pattern.meter ?? songMeter(song);

export const meterLabel = (meter: number): string => `${meter}/4`;

/** Neuer Standard-Takt; ungültig oder unverändert -> derselbe Song (keine Revision). */
export function setSongMeter(song: Song, meter: number): Song {
  if (!isValidMeter(meter) || meter === songMeter(song)) return song;
  return { ...song, meter };
}

/** Eigene Taktart setzen oder mit `undefined` entfernen; ungültig oder unverändert -> dasselbe Pattern. */
export function setPatternMeter(pattern: Pattern, meter: number | undefined): Pattern {
  if (meter === pattern.meter) return pattern;
  if (meter === undefined) {
    const { meter: _removed, ...rest } = pattern;
    return rest;
  }
  return isValidMeter(meter) ? { ...pattern, meter } : pattern;
}
