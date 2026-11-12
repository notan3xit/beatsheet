import { describe, expect, it } from 'vitest';
import { songWith } from '../test/songs';
import { patternOf } from '../test/patterns';
import { addAccent, appendSegment, setBarProps } from './structure';
import { allBars } from './songPatterns';
import type { Beat, Instrument, Pattern, Song } from './types';
import { DRAG_GRACES, EMPHASIS_GAIN, FLAM_GRACES, GHOST_GAIN, GRACE_GAIN, patternHits, patternSteps, patternTimeline, setTempo, songTimeline } from './playback';

describe('Spec song-library › Song-Tempo', () => {
  it('Tempo ändern', () => {
    const song = { ...songWith({}), tempo: 120 };
    expect(setTempo(song, 140).tempo).toBe(140);
  });

  it('Tempo außerhalb des Bereichs wird abgelehnt', () => {
    const song = { ...songWith({}), tempo: 120 };
    for (const bpm of [29, 301, 72.5, 0, Number.NaN]) expect(setTempo(song, bpm)).toBe(song);
    expect(setTempo(song, 30).tempo).toBe(30);
    expect(setTempo(song, 300).tempo).toBe(300);
  });

  it('Gleiches Tempo ändert nichts', () => {
    const song = { ...songWith({}), tempo: 120 };
    expect(setTempo(song, 120)).toBe(song);
  });
});

describe('Spec pattern-playback › Zeitliche Lage der Schläge', () => {
  it('Sechzehntel: Position 2 liegt 1/4 Beat nach dem Beginn', () => {
    const hits = patternHits(patternOf([{ hits: { hihat: [2] } }]));
    expect(hits).toEqual([{ at: 0.25, instrument: 'hihat', gain: 1, step: { beat: 0, position: 1 } }]);
  });

  it('Gemischte Unterteilung: Beat 2 in Achteltriolen, Position 3', () => {
    const [hit] = patternHits(patternOf([{}, { sub: 3, hits: { snare: [3] } }]));
    expect(hit!.at).toBeCloseTo(5 / 3);
    expect(hit!.step).toEqual({ beat: 1, position: 2 });
  });

  it('Gleichzeitige Schläge', () => {
    const hits = patternHits(patternOf([{ hits: { kick: [1], crash: [1] } }]));
    expect(hits.map((h) => [h.instrument, h.at])).toEqual([
      ['crash', 0],
      ['kick', 0],
    ]);
  });

  it('nach Zeit sortiert', () => {
    const hits = patternHits(patternOf([{ hits: { kick: [3], hihat: [1, 2, 3, 4] } }, { sub: 3, hits: { snare: [1] } }]));
    const times = hits.map((h) => h.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(hits).toHaveLength(6);
  });
});

describe('Spec pattern-playback › Klang der Spielweisen', () => {
  const withArticulations = () => {
    const pattern = patternOf([{ hits: { snare: [1, 3], tom1: [2] } }]);
    pattern.beats[0] = { ...pattern.beats[0]!, articulations: { snare: { 0: 'ghost' }, tom1: { 1: 'flam' } } };
    return patternHits(pattern);
  };

  it('Ghost Note ist leiser als ein normaler Schlag', () => {
    const snare = withArticulations().filter((h) => h.instrument === 'snare');
    expect(snare[0]!.gain).toBe(GHOST_GAIN);
    expect(snare[0]!.gain).toBeLessThan(snare[1]!.gain);
    expect(snare[0]!.graces).toBeUndefined();
  });

  it('Flam: Vorschlag vor der Position, Hauptschlag normal auf der Position', () => {
    const tom = withArticulations().find((h) => h.instrument === 'tom1')!;
    expect(tom).toMatchObject({ at: 0.25, gain: 1, graces: FLAM_GRACES });
    expect(GRACE_GAIN).toBeLessThan(1);
  });
});

describe('Spec pattern-playback › Wiedergabeposition', () => {
  it('Leeres Pattern: keine Schläge, aber alle Rasterpositionen', () => {
    const pattern = patternOf([{}, { sub: 3 }]);
    expect(patternHits(pattern)).toEqual([]);
    const steps = patternSteps(pattern);
    expect(steps.map((s) => [s.beat, s.position])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2],
    ]);
    expect(steps[5]!.at).toBeCloseTo(4 / 3);
  });
});

describe('Wiedergabe mit Zweiunddreißigsteln (thirty-second-notes)', () => {
  it('Position 2 eines Zweiunddreißigstel-Beats liegt 1/8 Beat nach dem Beginn', () => {
    const pattern = patternOf([{ sub: 8, hits: { snare: [2] } }]);
    expect(patternHits(pattern)).toEqual([{ at: 0.125, instrument: 'snare', gain: 1, step: { beat: 0, position: 1 } }]);
    expect(patternSteps(pattern)).toHaveLength(8);
  });

  it('Position 2 eines Zweiunddreißigsteltriolen-Beats liegt 1/12 Beat nach dem Beginn', () => {
    const pattern = patternOf([{ sub: 12, hits: { snare: [2] } }]);
    expect(patternHits(pattern)[0]!.at).toBeCloseTo(1 / 12, 12);
    expect(patternSteps(pattern)).toHaveLength(12);
  });
});

describe('Spec practice-click › Klick auf jedem Beat (Taktanfänge im Pattern)', () => {
  const beats = (n: number) => patternOf(Array.from({ length: n }, () => ({})));

  it('Pattern länger als ein Takt: 6 Beats in 4/4', () => {
    expect(patternTimeline(beats(6), 4).downbeats).toEqual([0, 4]);
  });

  it('Kurzer Fill: 2 Beats in 4/4', () => {
    expect(patternTimeline(beats(2), 4).downbeats).toEqual([0]);
  });

  it('Pattern in 3/4', () => {
    expect(patternTimeline(beats(6), 3).downbeats).toEqual([0, 3]);
  });
});

/** Song aus Patterns und Segmenten; `bars` je Segment mit 4-Beat-Takten. */
function songOf(patterns: Pattern[], segments: { name: string; bars: number; grooveId?: string | null }[]): Song {
  return segments.reduce((song, segment) => appendSegment(song, segment), songWith({ patterns }));
}
const barIds = (song: Song) => allBars(song).map((b) => b.id);
const whole = (song: Song) => ({ from: barIds(song)[0]!, to: 'end' as const });
const hitsAt = (song: Song, range = whole(song)) =>
  songTimeline(song, range)!.hits.map((h) => [h.at, h.instrument]);

describe('Spec song-playback › Klang aus der Struktur', () => {
  it('Groove-Fortlauf: 8-Beat-Groove über zwei Takte', () => {
    const groove = { ...patternOf([{}, {}, {}, {}, { hits: { snare: [1] } }, {}, {}, {}]), kind: 'groove' as const };
    const song = songOf([groove], [{ name: 'Verse', bars: 2, grooveId: groove.id }]);
    expect(hitsAt(song)).toEqual([[4, 'snare']]);
    expect(songTimeline(song, whole(song))!.length).toBe(8);
  });

  it('Fill überdeckt den Groove', () => {
    const groove = patternOf(Array.from({ length: 4 }, () => ({ hits: { kick: [1] } })));
    const fill = patternOf([{ hits: { snare: [1] } }], 'fill');
    let song = songOf([groove, fill], [{ name: 'Verse', bars: 2, grooveId: groove.id }]);
    song = setBarProps(song, [barIds(song)[1]!], { fillId: fill.id });
    expect(hitsAt(song).filter(([at]) => at === 7)).toEqual([[7, 'snare']]);
    expect(hitsAt(song).filter(([, i]) => i === 'kick').map(([at]) => at)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('Akzent im leeren Takt', () => {
    let song = songOf([], [{ name: 'Intro', bars: 1 }]);
    song = addAccent(song, barIds(song)[0]!, { instrument: 'crash', beat: 0, position: 0 });
    expect(hitsAt(song)).toEqual([[0, 'crash']]);
  });

  it('Akzent zusätzlich zum Groove; gleiches Instrument an gleicher Stelle entfällt', () => {
    const groove = patternOf([{ hits: { kick: [1], crash: [3] } }, {}, {}, {}]);
    let song = songOf([groove], [{ name: 'Verse', bars: 1, grooveId: groove.id }]);
    const [bar] = barIds(song);
    song = addAccent(song, bar!, { instrument: 'crash', beat: 0, position: 0 });
    song = addAccent(song, bar!, { instrument: 'crash', beat: 0, position: 2 });
    song = addAccent(song, bar!, { instrument: 'ride', beat: 2, position: 1 });
    expect(hitsAt(song)).toEqual([
      [0, 'kick'],
      [0, 'crash'],
      [0.5, 'crash'],
      [2.25, 'ride'],
    ]);
  });

  it('Spielweisen aus Groove und Fill bleiben erhalten', () => {
    const groove = patternOf([{ hits: { snare: [1, 3] } }, {}, {}, {}]);
    groove.beats[0] = { ...groove.beats[0]!, articulations: { snare: { 0: 'ghost', 2: 'flam' } } };
    const song = songOf([groove], [{ name: 'Verse', bars: 1, grooveId: groove.id }]);
    const hits = songTimeline(song, whole(song))!.hits;
    expect(hits[0]).toMatchObject({ at: 0, gain: GHOST_GAIN });
    expect(hits[1]).toMatchObject({ at: 0.5, gain: 1, graces: FLAM_GRACES });
  });
});

describe('Spec song-playback › Ab hier und Schleife (Bereich)', () => {
  const kicks = patternOf(Array.from({ length: 4 }, () => ({ hits: { kick: [1] } })));
  const fourBars = () => songOf([kicks], [{ name: 'Verse', bars: 4, grooveId: kicks.id }]);

  it('Ab einem Takt: Zeiten relativ zum Bereichsanfang, Länge bis Songende', () => {
    const song = fourBars();
    const timeline = songTimeline(song, { from: barIds(song)[2]!, to: 'end' })!;
    expect(timeline.length).toBe(8);
    expect(timeline.hits.map((h) => h.at)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(timeline.marks).toEqual([
      { at: 0, mark: barIds(song)[2] },
      { at: 4, mark: barIds(song)[3] },
    ]);
  });

  it('„end“ ist dynamisch: angefügte Takte spielen mit', () => {
    const song = fourBars();
    const range = { from: barIds(song)[2]!, to: 'end' as const };
    const longer = appendSegment(song, { name: 'Outro', bars: 1 });
    expect(songTimeline(longer, range)!.length).toBe(12);
  });

  it('Schleifenbereich Takte 2–3', () => {
    const song = fourBars();
    const timeline = songTimeline(song, { from: barIds(song)[1]!, to: barIds(song)[2]! })!;
    expect(timeline.length).toBe(8);
    expect(timeline.marks.map((m) => m.mark)).toEqual([barIds(song)[1], barIds(song)[2]]);
  });

  it('Fehlender Anfangs- oder Endtakt: null', () => {
    const song = fourBars();
    expect(songTimeline(song, { from: 'weg', to: 'end' })).toBeNull();
    expect(songTimeline(song, { from: barIds(song)[0]!, to: 'weg' })).toBeNull();
  });

  it('Taktanfänge des Bereichs, auch bei wechselnden Taktlängen (practice-click)', () => {
    let song = fourBars();
    song = setBarProps(song, [barIds(song)[2]!], { beats: 3 });
    expect(songTimeline(song, whole(song))!.downbeats).toEqual([0, 4, 8, 11]);
    expect(songTimeline(song, { from: barIds(song)[2]!, to: 'end' })!.downbeats).toEqual([0, 3]);
  });

  it('Zwischenspeicher: gleicher Song und Bereich liefern dasselbe Objekt', () => {
    const song = fourBars();
    const range = whole(song);
    expect(songTimeline(song, { ...range })).toBe(songTimeline(song, { ...range }));
  });
});

describe('Spec pattern-playback › Klang der neuen Spielweisen und der Betonung', () => {
  const hitOf = (instrument: Instrument, beat: Partial<Beat>) => {
    const pattern = patternOf([{ hits: { [instrument]: [1] } }]);
    pattern.beats[0] = { ...pattern.beats[0]!, ...beat };
    return patternHits(pattern)[0]!;
  };

  it('Drag: zwei Vorschläge in zeitlicher Reihenfolge, Hauptschlag normal', () => {
    const hit = hitOf('snare', { articulations: { snare: { 0: 'drag' } } });
    expect(hit).toMatchObject({ at: 0, gain: 1, graces: DRAG_GRACES });
    expect(DRAG_GRACES).toHaveLength(2);
    expect(DRAG_GRACES[0]!).toBeGreaterThan(DRAG_GRACES[1]!);
    expect(hit.technique).toBeUndefined();
  });

  it.each([
    ['snare', 'rim'],
    ['snare', 'cross'],
    ['ride', 'bell'],
    ['crash', 'choke'],
  ] as const)('%s mit %s nennt die Klangvariante', (instrument, articulation) => {
    const hit = hitOf(instrument, { articulations: { [instrument]: { 0: articulation } } });
    expect(hit).toMatchObject({ gain: 1, technique: articulation });
    expect(hit.graces).toBeUndefined();
  });

  it('Betonter Schlag ist lauter', () => {
    expect(EMPHASIS_GAIN).toBeGreaterThan(1);
    expect(hitOf('hihat', { emphasis: { hihat: [0] } }).gain).toBe(EMPHASIS_GAIN);
    expect(hitOf('hihat', {}).gain).toBe(1);
  });

  it('Betonter Flam: Hauptschlag lauter, Vorschläge unverändert', () => {
    const hit = hitOf('snare', { articulations: { snare: { 0: 'flam' } }, emphasis: { snare: [0] } });
    expect(hit).toMatchObject({ gain: EMPHASIS_GAIN, graces: FLAM_GRACES });
  });

  it('Betonte Spielweise behält ihren Klang', () => {
    expect(hitOf('snare', { articulations: { snare: { 0: 'rim' } }, emphasis: { snare: [0] } })).toMatchObject({ gain: EMPHASIS_GAIN, technique: 'rim' });
  });

  it('Betonung gilt auch in der Song-Wiedergabe', () => {
    const groove = patternOf([{ hits: { kick: [1] } }, {}, {}, {}]);
    groove.beats[0] = { ...groove.beats[0]!, emphasis: { kick: [0] } };
    const song = songOf([groove], [{ name: 'Verse', bars: 1, grooveId: groove.id }]);
    expect(songTimeline(song, whole(song))!.hits[0]).toMatchObject({ gain: EMPHASIS_GAIN });
  });
});
