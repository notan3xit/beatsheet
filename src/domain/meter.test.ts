import { describe, expect, it } from 'vitest';
import { createNotebookStore } from '../state/notebookStore';
import { songWith, barOf } from '../test/songs';
import { emptyBeats, patternOf } from '../test/patterns';
import { meterLabel, patternMeter, setPatternMeter, setSongMeter, songMeter } from './meter';
import { normalizeSong } from './normalize';
import { createPattern, duplicatePattern } from './pattern';
import { addPattern, allBars } from './songPatterns';
import { addPlaceholder, appendBlockLike, appendSegment, assignPlaceholder, insertBarAfter, insertSegmentAfter } from './structure';
import { METERS, type Song } from './types';

const songIn = (meter: number, base: Song = songWith({})): Song => ({ ...base, meter });

describe('Spec song-meter › Standard-Takt des Songs', () => {
  it('Erlaubte Werte', () => {
    expect(METERS).toEqual([3, 4, 5, 6, 7]);
    expect(METERS.map(meterLabel)).toEqual(['3/4', '4/4', '5/4', '6/4', '7/4']);
  });

  it('Neuer Song', () => {
    const store = createNotebookStore([]);
    expect(songMeter(store.createSong('Neu'))).toBe(4);
  });

  it('Song ohne gespeicherten Standard-Takt', () => {
    expect(songMeter(songWith({}))).toBe(4);
  });

  it('Standard-Takt ändern', () => {
    const song = { ...songWith({}), revision: 4 };
    const store = createNotebookStore([song]);
    store.openSong(song.id);
    store.setLocked(false);
    store.updateSong((s) => setSongMeter(s, 3));
    const changed = store.getState().songs[0]!;
    expect(songMeter(changed)).toBe(3);
    expect(changed.revision).toBe(5);
  });

  it('Gleicher Wert', () => {
    const song = { ...songIn(3), revision: 4 };
    expect(setSongMeter(song, 3)).toBe(song);
    const standard = songWith({});
    expect(setSongMeter(standard, 4)).toBe(standard);
  });

  it.each([2, 8, 0, 3.5, Number.NaN])('Ungültiger Wert %s', (meter) => {
    const song = songWith({});
    expect(setSongMeter(song, meter)).toBe(song);
  });
});

describe('Spec song-meter › Wirksame Taktart eines Patterns', () => {
  it('Pattern folgt dem Song', () => {
    const groove = createPattern([], { kind: 'groove', name: 'A' });
    expect(patternMeter(groove, songWith({}))).toBe(4);
    expect(patternMeter(groove, songIn(3))).toBe(3);
  });

  it('Eigene Taktart bleibt', () => {
    const bridge = setPatternMeter(createPattern([], { kind: 'groove', name: 'Bridge' }), 7);
    expect(patternMeter(bridge, songWith({}))).toBe(7);
    expect(patternMeter(bridge, songIn(3))).toBe(7);
    expect(patternMeter(bridge, songIn(7))).toBe(7);
    expect(bridge.meter).toBe(7);
  });

  it('Fills werden wie Grooves behandelt', () => {
    const fill = createPattern([], { kind: 'fill', name: 'F' });
    expect(patternMeter(fill, songIn(5))).toBe(5);
    expect(patternMeter(setPatternMeter(fill, 3), songIn(5))).toBe(3);
  });

  it('Eigene Taktart entfernen und unveränderte Werte', () => {
    const groove = createPattern([], { kind: 'groove', name: 'A' });
    expect(setPatternMeter(groove, undefined)).toBe(groove);
    const own = setPatternMeter(groove, 7);
    expect(setPatternMeter(own, 7)).toBe(own);
    expect(setPatternMeter(own, 8)).toBe(own);
    const followed = setPatternMeter(own, undefined);
    expect(followed).not.toHaveProperty('meter');
  });
});

describe('Spec song-meter › Taktart ändert nur die Darstellung', () => {
  it('Vorhandene Takte und Patterns', () => {
    const groove = patternOf([{ hits: { snare: [1] } }, ...emptyBeats(3)]);
    const bars = [barOf({ grooveId: groove.id }), barOf({ grooveId: groove.id })];
    const base = songWith({ patterns: [groove] });
    const song: Song = { ...base, segments: [{ id: 's', name: 'Verse', blocks: [{ id: 'b', bars }] }] };
    const changed = setSongMeter(song, 3);
    expect(changed.patterns).toBe(song.patterns);
    expect(changed.segments).toBe(song.segments);
    const own = setPatternMeter(groove, 7);
    expect(own.beats).toBe(groove.beats);
  });
});

describe('Spec song-meter › Taktart in Kopien und Dateien', () => {
  it('Pattern duplizieren', () => {
    const groove = setPatternMeter(createPattern([], { kind: 'groove', name: 'A' }), 7);
    expect(duplicatePattern(groove, [groove]).meter).toBe(7);
  });
});

describe('song-meter design.md D8: regelwidrige Werte', () => {
  it('Verwirft regelwidrige Werte an Song und Pattern', () => {
    const groove = { ...createPattern([], { kind: 'groove', name: 'A' }), meter: 0 };
    const normalized = normalizeSong({ ...songWith({ patterns: [groove] }), meter: 9 });
    expect(normalized).not.toHaveProperty('meter');
    expect(normalized.patterns[0]).not.toHaveProperty('meter');
  });

  it('Ein gültiger Song bleibt dieselbe Referenz', () => {
    const groove = setPatternMeter(createPattern([], { kind: 'groove', name: 'A' }), 7);
    const song = songIn(3, songWith({ patterns: [groove] }));
    expect(normalizeSong(song)).toBe(song);
  });
});

describe('Spec pattern-library › Pattern anlegen (Taktart)', () => {
  it('Groove im Standard-Takt anlegen', () => {
    const { pattern } = addPattern(songIn(7), { kind: 'groove' });
    expect(pattern.beats).toHaveLength(7);
    expect(pattern).not.toHaveProperty('meter');
  });

  it('Groove in 4/4 anlegen', () => {
    expect(addPattern(songWith({}), { kind: 'groove' }).pattern.beats).toHaveLength(4);
  });

  it('Angegebene Länge gilt', () => {
    expect(addPattern(songIn(7), { kind: 'groove', length: 2 }).pattern.beats).toHaveLength(2);
  });

  it('Fill mit Standardwerten anlegen', () => {
    expect(addPattern(songIn(7), { kind: 'fill' }).pattern.beats).toHaveLength(1);
  });
});

describe('Spec song-structure › Taktart neuer Takte', () => {
  const beatsOf = (song: Song) => allBars(song).map((bar) => bar.beats);

  it('Erstes Segment im Standard-Takt', () => {
    expect(beatsOf(insertSegmentAfter(songIn(3), null))).toEqual([3, 3, 3, 3]);
  });

  it('Erstes Segment in 4/4', () => {
    expect(beatsOf(insertSegmentAfter(songWith({}), null))).toEqual([4, 4, 4, 4]);
  });

  it('Segment ohne Längenangabe im Standard-Takt', () => {
    expect(beatsOf(appendSegment(songIn(5), { name: 'Verse', bars: 2 }))).toEqual([5, 5]);
  });

  it('Block an Segment ohne Blöcke im Standard-Takt', () => {
    const song: Song = { ...songIn(7), segments: [{ id: 's', name: 'Verse', blocks: [] }] };
    expect(beatsOf(appendBlockLike(song, 's'))).toEqual([7, 7, 7, 7]);
  });

  it('Nachbartakt vor Standard-Takt', () => {
    const bar = barOf({ beats: 3 });
    const song: Song = { ...songIn(5), segments: [{ id: 's', name: 'Verse', blocks: [{ id: 'b', bars: [bar] }] }] };
    expect(beatsOf(insertBarAfter(song, bar.id))).toEqual([3, 3]);
  });

  it('Neuer Groove als Platzhalter im Standard-Takt', () => {
    expect(addPlaceholder(songIn(5), { kind: 'groove', name: '' }).pattern.beats).toHaveLength(5);
    const bar = barOf({ beats: 5 });
    const song: Song = { ...songIn(5), segments: [{ id: 's', name: 'Verse', blocks: [{ id: 'b', bars: [bar] }] }] };
    const assigned = assignPlaceholder(song, [bar.id], 'groove');
    expect(assigned.patterns[0]!.beats).toHaveLength(5);
  });

  it('Neuer Fill als Platzhalter bleibt bei 1 Beat', () => {
    const bar = barOf({ beats: 5 });
    const song: Song = { ...songIn(5), segments: [{ id: 's', name: 'Verse', blocks: [{ id: 'b', bars: [bar] }] }] };
    expect(assignPlaceholder(song, [bar.id], 'fill').patterns[0]!.beats).toHaveLength(1);
  });
});
