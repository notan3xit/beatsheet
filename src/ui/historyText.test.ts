import { describe, expect, it } from 'vitest';
import { formatRelative } from './historyText';

/** Ortszeit als Unixzeit in Sekunden. */
const at = (year: number, month: number, day: number, hour = 0, minute = 0, second = 0) => new Date(year, month, day, hour, minute, second).getTime() / 1000;
const NOW = new Date(2026, 10, 8, 14, 30).getTime();

describe('Spec song-activity › Zeitangabe', () => {
  it('unter einer Minute gerade eben', () => {
    expect(formatRelative(at(2026, 10, 8, 14, 29, 30), NOW)).toBe('gerade eben');
  });

  it('am selben Tag in Minuten bzw. Stunden', () => {
    expect(formatRelative(at(2026, 10, 8, 14, 25), NOW)).toBe('vor 5 Min.');
    expect(formatRelative(at(2026, 10, 8, 0, 10), NOW)).toBe('vor 14 Std.');
  });

  it('Gestern', () => {
    expect(formatRelative(at(2026, 10, 7, 21, 10), NOW)).toBe('gestern');
  });

  it('sonst als Datum, mit Jahr nur bei einem anderen Jahr', () => {
    expect(formatRelative(at(2026, 10, 3, 9), NOW)).toBe('3. Nov.');
    expect(formatRelative(at(2025, 11, 31, 9), NOW)).toBe('31. Dez. 2025');
  });

  it('Uhr eines Geräts geht vor', () => {
    expect(formatRelative(at(2026, 10, 9, 9), NOW)).toBe('gerade eben');
  });
});
