import { describe, expect, it } from 'vitest';
import { DRS_FORMATS } from './drsSamples';
import { SAMPLE_KEYS } from './sampleLoader';

describe('DRSKit-Aufnahmen', () => {
  it('Opus vor AAC, je eine URL für jeden normalen und leisen Schlag', () => {
    expect(DRS_FORMATS.map((f) => f.name)).toEqual(['opus', 'aac']);
    for (const format of DRS_FORMATS) {
      expect(Object.keys(format.urls).sort()).toEqual([...SAMPLE_KEYS].sort());
      expect(new Set(Object.values(format.urls)).size).toBe(SAMPLE_KEYS.length);
    }
    expect(DRS_FORMATS[0]!.urls['snare-normal']).toMatch(/snare-normal.*\.webm/);
    expect(DRS_FORMATS[1]!.urls['snare-normal']).toMatch(/snare-normal.*\.m4a/);
  });
});
