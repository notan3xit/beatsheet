import { describe, expect, it } from 'vitest';
import { createPattern, duplicatePattern } from './pattern';
import { addPattern, patternUsage, removePattern } from './songPatterns';
import { PATTERN_COLORS, type Song } from './types';
import { songWith } from '../test/songs';

describe('Spec pattern-library › Pattern anlegen (Song)', () => {
  it('Pattern gehört zum Song', () => {
    const hysteria = songWith({ title: 'Hysteria' });
    const uprising = songWith({ title: 'Uprising' });
    const { song } = addPattern(hysteria, { kind: 'groove' });
    expect(song.patterns).toHaveLength(1);
    expect(uprising.patterns).toHaveLength(0);
    expect(hysteria.patterns).toHaveLength(0);
  });
});

describe('Spec pattern-library › Pattern-Namen (Song)', () => {
  it('Automatischer Name: Nummerierung pro Song', () => {
    let song: Song = songWith({});
    for (let i = 0; i < 3; i++) song = addPattern(song, { kind: 'groove' }).song;
    expect(song.patterns.map((p) => p.name)).toEqual(['Groove 1', 'Groove 2', 'Groove 3']);
    const other = addPattern(songWith({}), { kind: 'groove' }).song;
    expect(other.patterns[0]!.name).toBe('Groove 1');
  });
});

describe('Spec pattern-library › Pattern-Farbe', () => {
  it('Erste Patterns eines Songs', () => {
    let song: Song = songWith({});
    song = addPattern(song, { kind: 'groove' }).song;
    song = addPattern(song, { kind: 'groove' }).song;
    song = addPattern(song, { kind: 'fill' }).song;
    expect(song.patterns.map((p) => p.color)).toEqual(PATTERN_COLORS.slice(0, 3));
  });

  it('Freie Farbe wird wiederverwendet', () => {
    let song: Song = songWith({});
    song = addPattern(song, { kind: 'groove' }).song;
    song = addPattern(song, { kind: 'groove' }).song;
    song = removePattern(song, song.patterns[0]!.id);
    song = addPattern(song, { kind: 'fill' }).song;
    expect(song.patterns.map((p) => p.color)).toEqual([PATTERN_COLORS[1], PATTERN_COLORS[0]]);
  });

  it('Alle Farben vergeben: Reihenfolge beginnt von vorn', () => {
    const existing = PATTERN_COLORS.map((_, i) => ({ ...createPattern([], { kind: 'groove' }), color: PATTERN_COLORS[i]! }));
    const next = createPattern(existing, { kind: 'groove' });
    expect(next.color).toBe(PATTERN_COLORS[0]);
  });

  it('Farbe ist nie red', () => {
    let song: Song = songWith({});
    for (let i = 0; i < 30; i++) song = addPattern(song, { kind: 'groove' }).song;
    expect(song.patterns.some((p) => (p.color as string) === 'red')).toBe(false);
  });
});

describe('Spec pattern-library › Pattern duplizieren (Song)', () => {
  it('Groove duplizieren: eigene Farbe', () => {
    const song = addPattern(songWith({}), { kind: 'groove', name: 'Verse' }).song;
    const original = song.patterns[0]!;
    const copy = duplicatePattern(original, song.patterns);
    expect(copy.name).toBe('Verse (Kopie)');
    expect(copy.color).not.toBe(original.color);
    expect(copy.color).toBe(PATTERN_COLORS[1]);
  });
});

describe('Spec pattern-library › Pattern löschen (Song)', () => {
  it('Verwendetes Pattern löschen', () => {
    const song = songWith({ bars: 12, groove: true });
    const grooveId = song.patterns[0]!.id;
    expect(patternUsage(song, grooveId)).toBe(12);
    const after = removePattern(song, grooveId);
    expect(after.patterns).toHaveLength(0);
    const bars = after.segments.flatMap((s) => s.blocks.flatMap((b) => b.bars));
    expect(bars).toHaveLength(12);
    expect(bars.every((b) => b.grooveId === null)).toBe(true);
  });

  it('Verwendeter Fill wird aus den Takten entfernt', () => {
    let song = songWith({ bars: 4, groove: true });
    const added = addPattern(song, { kind: 'fill' });
    song = added.song;
    const bar = song.segments[0]!.blocks[0]!.bars[3]!;
    bar.fillId = added.pattern.id;
    expect(patternUsage(song, added.pattern.id)).toBe(1);
    const after = removePattern(song, added.pattern.id);
    expect(after.segments[0]!.blocks[0]!.bars[3]!.fillId).toBeNull();
  });

  it('Löschen bestätigt: Pattern nicht mehr im Song', () => {
    const song = addPattern(songWith({}), { kind: 'fill' }).song;
    expect(removePattern(song, song.patterns[0]!.id).patterns).toEqual([]);
  });
});
