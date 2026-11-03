import { describe, expect, it } from 'vitest';
import { parseNotebookFile, serializeNotebook } from '../persistence/fileFormat';
import { songWith } from '../test/songs';
import { normalizeSong } from './normalize';
import { createPattern, emptyBeat } from './pattern';
import type { Beat, Pattern, Song } from './types';

const grooveAndFill = (): Song => {
  const groove = createPattern([], { kind: 'groove', name: 'Verse' });
  const fill = createPattern([groove], { kind: 'fill', name: 'Fill' });
  const song = songWith({ patterns: [groove, fill], bars: 2 });
  return withBar(song, 0, { grooveId: groove.id, fillId: fill.id });
};

function withBar(song: Song, index: number, props: Partial<Song['segments'][0]['blocks'][0]['bars'][0]>): Song {
  const block = song.segments[0]!.blocks[0]!;
  const bars = block.bars.map((bar, i) => (i === index ? { ...bar, ...props } : bar));
  return { ...song, segments: [{ ...song.segments[0]!, blocks: [{ ...block, bars }] }] };
}

function withBeat(song: Song, beat: Beat): Song {
  const pattern = song.patterns[0]!;
  return { ...song, patterns: [{ ...pattern, beats: [beat, ...pattern.beats.slice(1)] }, ...song.patterns.slice(1)] };
}

const firstBar = (song: Song) => song.segments[0]!.blocks[0]!.bars[0]!;
const firstBeat = (song: Song) => song.patterns[0]!.beats[0]!;

function expectValidFile(song: Song) {
  const parsed = parseNotebookFile(serializeNotebook([song], new Date('2026-11-03T10:00:00.000Z')));
  expect(parsed.ok).toBe(true);
}

describe('normalizeSong (design.md D6)', () => {
  it('gibt einen gültigen Song unverändert als dieselbe Referenz zurück', () => {
    const song = grooveAndFill();
    expect(normalizeSong(song)).toBe(song);
  });

  it('entfernt Verweise auf fehlende Patterns', () => {
    const song = withBar(grooveAndFill(), 1, { grooveId: 'weg', fillId: 'auch-weg' });
    const result = normalizeSong(song);
    expect(result.segments[0]!.blocks[0]!.bars[1]).toMatchObject({ grooveId: null, fillId: null });
    expect(firstBar(result).grooveId).toBe(song.patterns[0]!.id);
    expectValidFile(result);
  });

  it('entfernt Verweise auf ein Pattern der falschen Art', () => {
    const song = grooveAndFill();
    const [groove, fill] = song.patterns;
    const result = normalizeSong(withBar(song, 0, { grooveId: fill!.id, fillId: groove!.id }));
    expect(firstBar(result)).toMatchObject({ grooveId: null, fillId: null });
  });

  it('entfernt Positionen außerhalb des Rasters', () => {
    const song = withBeat(grooveAndFill(), { subdivision: 2, hits: { snare: [1, 3], kick: [0] } });
    expect(firstBeat(normalizeSong(song)).hits).toEqual({ snare: [1], kick: [0] });
  });

  it('lässt bei offener und geschlossener Hi-Hat an derselben Position die geschlossene stehen', () => {
    const song = withBeat(grooveAndFill(), { subdivision: 4, hits: { hihat: [0, 2], hihatOpen: [2, 3] } });
    const result = normalizeSong(song);
    expect(firstBeat(result).hits).toEqual({ hihat: [0, 2], hihatOpen: [3] });
    expectValidFile(result);
  });

  it('entfernt Spielweisen ohne Schlag und auf nicht artikulierbaren Instrumenten', () => {
    const beat: Beat = {
      subdivision: 4,
      hits: { snare: [1], hihat: [0] },
      articulations: { snare: { 1: 'flam', 2: 'ghost' }, hihat: { 0: 'flam' } },
    };
    const result = normalizeSong(withBeat(grooveAndFill(), beat));
    expect(firstBeat(result)).toEqual({ subdivision: 4, hits: { snare: [1], hihat: [0] }, articulations: { snare: { 1: 'flam' } } });
    expectValidFile(result);
  });

  it('entfernt das Feld der Spielweisen, wenn keine übrig bleibt', () => {
    const beat: Beat = { subdivision: 4, hits: {}, articulations: { snare: { 1: 'flam' } } };
    expect(firstBeat(normalizeSong(withBeat(grooveAndFill(), beat)))).toEqual({ subdivision: 4, hits: {} });
  });

  it('kürzt Patterns mit mehr als 16 Beats am Ende', () => {
    const song = grooveAndFill();
    const marked: Beat = { subdivision: 4, hits: { kick: [0] } };
    const long: Pattern = { ...song.patterns[0]!, beats: [...Array.from({ length: 16 }, () => marked), ...Array.from({ length: 6 }, emptyBeat)] };
    const result = normalizeSong({ ...song, patterns: [long, song.patterns[1]!] });
    expect(result.patterns[0]!.beats).toHaveLength(16);
    expect(result.patterns[0]!.beats.every((b) => b.hits.kick?.[0] === 0)).toBe(true);
    expectValidFile(result);
  });

  it('gibt einem Pattern ohne Beats einen leeren Beat', () => {
    const song = grooveAndFill();
    const result = normalizeSong({ ...song, patterns: [{ ...song.patterns[0]!, beats: [] }, song.patterns[1]!] });
    expect(result.patterns[0]!.beats).toEqual([emptyBeat()]);
  });

  it('entfernt Akzente außerhalb des Takts', () => {
    const song = withBar(grooveAndFill(), 0, {
      beats: 3,
      accents: [
        { instrument: 'crash', beat: 0, position: 0 },
        { instrument: 'snare', beat: 3, position: 0 },
      ],
    });
    const result = normalizeSong(song);
    expect(firstBar(result).accents).toEqual([{ instrument: 'crash', beat: 0, position: 0 }]);
    expectValidFile(result);
  });

  it('entfernt Blöcke ohne Takte und behält das Segment', () => {
    const song = grooveAndFill();
    const segment = song.segments[0]!;
    const withEmpty: Song = {
      ...song,
      segments: [{ ...segment, blocks: [...segment.blocks, { id: 'leer', bars: [] }] }, { id: 'nur-leer', name: 'Outro', blocks: [{ id: 'leer-2', bars: [] }] }],
    };
    const result = normalizeSong(withEmpty);
    expect(result.segments.map((s) => s.blocks.map((b) => b.id))).toEqual([[segment.blocks[0]!.id], []]);
    expectValidFile(result);
  });

  it('lässt unbetroffene Patterns und Takte als dieselben Objekte stehen', () => {
    const song = withBar(grooveAndFill(), 1, { grooveId: 'weg' });
    const result = normalizeSong(song);
    expect(result.patterns[0]).toBe(song.patterns[0]);
    expect(firstBar(result)).toBe(firstBar(song));
  });
});

