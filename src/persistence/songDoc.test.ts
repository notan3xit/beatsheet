import * as A from '@automerge/automerge/slim';
import { describe, expect, it } from 'vitest';
import { createPattern, resizePattern, touch } from '../domain/pattern';
import { cycleArticulation, toggleEmphasis, toggleHit } from '../domain/sequencer';
import { removePattern } from '../domain/songPatterns';
import { addAccent, appendSegment, changeBarLength, setBarProps } from '../domain/structure';
import type { Instrument, Pattern, Song } from '../domain/types';
import { songWith } from '../test/songs';
import { parseNotebookFile, serializeNotebook } from './fileFormat';
import { planImport } from './merge';
import { applySong, changeMessage, createSongDoc, fromDocShape, mergeSongDocs, readChangeMessage, sameSong, songOf, toDocShape, type SongDocument } from './songDoc';

const NOW = new Date('2026-11-03T12:00:00.000Z');

/** Song mit den Grooves „Verse“ (4 Beats) und „Chorus“ und einem Segment aus zwei Takten ohne Groove. */
function baseSong(revision = 1): Song {
  const verse = createPattern([], { kind: 'groove', name: 'Verse' });
  const chorus = createPattern([verse], { kind: 'groove', name: 'Chorus' });
  return { ...songWith({ patterns: [verse, chorus], bars: 2 }), revision };
}

/** Ändert den Song wie `commitSong`: Revision +1, neuer Änderungszeitpunkt. */
function edit(doc: SongDocument, change: (song: Song) => Song): SongDocument {
  const song = songOf(doc);
  return applySong(doc, { ...change(song), revision: song.revision + 1, updatedAt: NOW.toISOString() });
}

/** Ändert ein Pattern wie `store.update`: Pattern per `touch`, dann Song. */
function editPattern(doc: SongDocument, name: string, change: (pattern: Pattern) => Pattern): SongDocument {
  return edit(doc, (song) => ({
    ...song,
    patterns: song.patterns.map((p) => (p.name === name ? touch(change(p), NOW) : p)),
  }));
}

const hit = (instrument: Instrument, position: number, beat = 0) => (p: Pattern) => toggleHit(p, beat, instrument, position);
const pattern = (song: Song, name: string) => song.patterns.find((p) => p.name === name)!;
const firstBeat = (song: Song, name = 'Verse') => pattern(song, name).beats[0]!;
const bars = (song: Song) => song.segments.flatMap((s) => s.blocks.flatMap((b) => b.bars));

/** Zwei unabhängige Fassungen aus einem gemeinsamen Stand. */
function forks(song: Song = baseSong()): [SongDocument, SongDocument] {
  const doc = createSongDoc(song);
  return [A.clone(doc), A.clone(doc)];
}

/** Führt in beiden Richtungen zusammen, prüft Gleichheit und Exportierbarkeit, liefert den Song. */
function merged(a: SongDocument, b: SongDocument): Song {
  const ab = songOf(mergeSongDocs(a, b));
  const ba = songOf(mergeSongDocs(b, a));
  expect(ab).toEqual(ba);
  const parsed = parseNotebookFile(serializeNotebook([ab], NOW));
  expect(parsed).toEqual({ ok: true, songs: [ab], fromNewerVersion: false });
  return ab;
}

describe('Spec song-merge › Änderungen an verschiedenen Stellen zusammenführen', () => {
  it('Verschiedene Patterns', () => {
    const [a, b] = forks();
    const song = merged(editPattern(a, 'Verse', hit('snare', 1)), editPattern(b, 'Chorus', hit('kick', 0)));
    expect(firstBeat(song, 'Verse').hits).toEqual({ snare: [1] });
    expect(firstBeat(song, 'Chorus').hits).toEqual({ kick: [0] });
  });

  it('Pattern und Struktur', () => {
    const [a, b] = forks();
    const song = merged(
      editPattern(a, 'Verse', hit('snare', 1)),
      edit(b, (s) => appendSegment(s, { name: 'Chorus', bars: 4 })),
    );
    expect(firstBeat(song).hits).toEqual({ snare: [1] });
    expect(song.segments.map((s) => s.name)).toEqual(['Verse', 'Chorus']);
  });

  it('Verschiedene Schläge im selben Beat', () => {
    const [a, b] = forks();
    const song = merged(editPattern(a, 'Verse', hit('snare', 0)), editPattern(b, 'Verse', hit('hihat', 0)));
    expect(firstBeat(song).hits).toEqual({ snare: [0], hihat: [0] });
  });

  it('Verschiedene Betonungen im selben Beat', () => {
    const withHits = editPattern(editPattern(createSongDoc(baseSong()), 'Verse', hit('kick', 0)), 'Verse', hit('snare', 2));
    const [a, b] = [A.clone(withHits), A.clone(withHits)];
    const changedA = editPattern(a, 'Verse', (p) => toggleEmphasis(p, 0, 'kick', 0));
    const changedB = editPattern(b, 'Verse', (p) => toggleEmphasis(p, 0, 'snare', 2));
    expect(firstBeat(merged(changedA, changedB)).emphasis).toEqual({ kick: [0], snare: [2] });
    expect(songOf(mergeSongDocs(changedA, changedB))).toEqual(songOf(mergeSongDocs(changedB, changedA)));
  });

  it('Verschiedene Spielweisen im selben Beat', () => {
    const withHits = editPattern(editPattern(createSongDoc(baseSong()), 'Verse', hit('ride', 0)), 'Verse', hit('crash', 0));
    const [a, b] = [A.clone(withHits), A.clone(withHits)];
    const song = merged(
      editPattern(a, 'Verse', (p) => cycleArticulation(p, 0, 'ride', 0)),
      editPattern(b, 'Verse', (p) => cycleArticulation(p, 0, 'crash', 0)),
    );
    expect(firstBeat(song).articulations).toEqual({ ride: { 0: 'bell' }, crash: { 0: 'choke' } });
  });

  it('Reihenfolge des Zusammenführens', () => {
    const [a, b] = forks();
    const changedA = edit(editPattern(a, 'Verse', hit('snare', 2)), (s) => ({ ...s, tempo: 96 }));
    const changedB = edit(editPattern(b, 'Chorus', hit('kick', 0)), (s) => appendSegment(s, { name: 'Bridge', bars: 2 }));
    expect(songOf(mergeSongDocs(changedA, changedB))).toEqual(songOf(mergeSongDocs(changedB, changedA)));
    expect(A.getHeads(mergeSongDocs(changedA, changedB)).sort()).toEqual(A.getHeads(mergeSongDocs(changedB, changedA)).sort());
  });
});

describe('Spec song-merge › Gleichzeitige Änderungen an derselben Stelle', () => {
  it('Titel in beiden Fassungen geändert', () => {
    const [a, b] = forks();
    const song = merged(edit(a, (s) => ({ ...s, title: 'Intro A' })), edit(b, (s) => ({ ...s, title: 'Intro B' })));
    expect(['Intro A', 'Intro B']).toContain(song.title);
  });

  it('Derselbe Schlag doppelt gesetzt', () => {
    const [a, b] = forks();
    const song = merged(editPattern(a, 'Verse', hit('snare', 2)), editPattern(b, 'Verse', hit('snare', 2)));
    expect(firstBeat(song).hits).toEqual({ snare: [2] });
  });

  it('Schlag entfernt und anderer gesetzt', () => {
    const start = createSongDoc(baseSong());
    const withSnare = editPattern(start, 'Verse', hit('snare', 2));
    const [a, b] = [A.clone(withSnare), A.clone(withSnare)];
    const song = merged(editPattern(a, 'Verse', hit('snare', 2)), editPattern(b, 'Verse', hit('snare', 3)));
    expect(firstBeat(song).hits).toEqual({ snare: [3] });
  });
});

describe('Spec song-merge › Fachliche Gültigkeit nach dem Zusammenführen', () => {
  it('Verweis auf gelöschtes Pattern', () => {
    const [a, b] = forks();
    const verseId = pattern(songOf(a), 'Verse').id;
    const barId = bars(songOf(b))[0]!.id;
    const song = merged(
      edit(a, (s) => removePattern(s, verseId)),
      edit(b, (s) => setBarProps(s, [barId], { grooveId: verseId })),
    );
    expect(song.patterns.map((p) => p.name)).toEqual(['Chorus']);
    expect(bars(song)[0]!.grooveId).toBeNull();
  });

  it('Spielweise ohne Schlag', () => {
    const withSnare = editPattern(createSongDoc(baseSong()), 'Verse', hit('snare', 1));
    const [a, b] = [A.clone(withSnare), A.clone(withSnare)];
    const song = merged(
      editPattern(a, 'Verse', hit('snare', 1)),
      editPattern(b, 'Verse', (p) => cycleArticulation(p, 0, 'snare', 1)),
    );
    expect(firstBeat(song)).toEqual({ subdivision: 4, hits: {} });
  });

  it('Betonung ohne Schlag', () => {
    const withSnare = editPattern(createSongDoc(baseSong()), 'Verse', hit('snare', 1));
    const [a, b] = [A.clone(withSnare), A.clone(withSnare)];
    const song = merged(
      editPattern(a, 'Verse', hit('snare', 1)),
      editPattern(b, 'Verse', (p) => toggleEmphasis(p, 0, 'snare', 1)),
    );
    expect(firstBeat(song)).toEqual({ subdivision: 4, hits: {} });
  });

  it('Betonung und Ghost Note', () => {
    const withSnare = editPattern(createSongDoc(baseSong()), 'Verse', hit('snare', 1));
    const [a, b] = [A.clone(withSnare), A.clone(withSnare)];
    const toGhost = (p: Pattern) => [0, 1, 2].reduce((next) => cycleArticulation(next, 0, 'snare', 1), p);
    const song = merged(
      editPattern(a, 'Verse', (p) => toggleEmphasis(p, 0, 'snare', 1)),
      editPattern(b, 'Verse', toGhost),
    );
    expect(firstBeat(song)).toEqual({ subdivision: 4, hits: { snare: [1] }, articulations: { snare: { 1: 'ghost' } } });
    expect(parseNotebookFile(serializeNotebook([song], NOW)).ok).toBe(true);
  });

  it('Offene und geschlossene Hi-Hat an derselben Position', () => {
    const [a, b] = forks();
    const song = merged(editPattern(a, 'Verse', hit('hihat', 0)), editPattern(b, 'Verse', hit('hihatOpen', 0)));
    expect(firstBeat(song).hits).toEqual({ hihat: [0] });
  });

  it('Pattern zu lang', () => {
    const start = editPattern(createSongDoc(baseSong()), 'Verse', (p) => resizePattern(p, 10));
    const [a, b] = [A.clone(start), A.clone(start)];
    const song = merged(
      editPattern(a, 'Verse', (p) => resizePattern(p, 16)),
      editPattern(b, 'Verse', (p) => resizePattern(p, 16)),
    );
    expect(pattern(song, 'Verse').beats.length).toBeLessThanOrEqual(16);
  });

  it('Akzent außerhalb des Takts', () => {
    const [a, b] = forks();
    const barId = bars(songOf(a))[0]!.id;
    const song = merged(
      edit(a, (s) => changeBarLength(s, [barId], -1)),
      edit(b, (s) => addAccent(s, barId, { instrument: 'crash', beat: 3, position: 0 })),
    );
    expect(bars(song)[0]).toMatchObject({ beats: 3, accents: [] });
  });
});

describe('Spec song-merge › Revision nach dem Zusammenführen', () => {
  const fiveAndOne = () => {
    const [a, b] = forks(baseSong(7));
    let changedA = a;
    for (const position of [0, 1, 2, 3, 0]) changedA = editPattern(changedA, 'Verse', hit('kick', position));
    const changedB = editPattern(b, 'Verse', hit('snare', 1));
    return { changedA, changedB, song: merged(changedA, changedB) };
  };

  it('Unterschiedlich viele Änderungen', () => {
    const { changedA, changedB, song } = fiveAndOne();
    expect(songOf(changedA).revision).toBe(12);
    expect(song.revision).toBeGreaterThan(12);
    const revisions = [changedA, changedB].map((d) => pattern(songOf(d), 'Verse').revision);
    expect(pattern(song, 'Verse').revision).toBeGreaterThan(Math.max(...revisions));
  });

  it('Import der Ausgangsfassung', () => {
    const { changedA, changedB, song } = fiveAndOne();
    for (const exported of [songOf(changedA), songOf(changedB)]) {
      expect(planImport([song], [exported], { fromNewerVersion: false })[0]).toMatchObject({ newer: 'local', choice: 'skip' });
    }
  });
});

describe('Dokumentform und Brücke (design.md D3, D4)', () => {
  function richSong(): Song {
    const song = baseSong(5);
    const verse = pattern(song, 'Verse');
    let p = toggleHit(toggleHit(verse, 0, 'snare', 1), 1, 'kick', 0);
    p = cycleArticulation(p, 0, 'snare', 1);
    p = { ...p, beats: [p.beats[0]!, { subdivision: 3, hits: { kick: [0, 2] } }, ...p.beats.slice(2)] };
    const [first, second] = bars(song);
    const accents = [
      { instrument: 'crash' as const, beat: 0, position: 0 as const },
      { instrument: 'snare' as const, beat: 2, position: 1 as const },
    ];
    return {
      ...setBarProps(addAccent(addAccent(song, first!.id, accents[0]!), first!.id, accents[1]!), [second!.id], { grooveId: verse.id }),
      tempo: 96,
      patterns: [p, pattern(song, 'Chorus')],
    };
  }

  it('Umwandlung hin und zurück ergibt den Song unverändert', () => {
    const song = richSong();
    expect(fromDocShape(toDocShape(song))).toEqual(song);
    expect(songOf(createSongDoc(song))).toEqual(song);
  });

  it('übersteht Speichern und Laden', () => {
    const song = richSong();
    expect(songOf(A.load(A.save(createSongDoc(song))))).toEqual(song);
  });

  it('ein Song ohne neue Felder hat die Dokumentform der Vorversion', () => {
    const beat = toDocShape(baseSong()).patterns[0]!.beats[0]!;
    expect(Object.keys(beat).sort()).toEqual(['articulations', 'hits', 'subdivision']);
    expect(Object.keys(beat.articulations).sort()).toEqual(['floorTom', 'snare', 'tom1', 'tom2']);
  });

  it('Betonungen und Spielweisen von Ride und Crash überstehen das Dokument', () => {
    const song = baseSong();
    const beat = {
      subdivision: 4 as const,
      hits: { snare: [0], ride: [1], crash: [2] },
      articulations: { snare: { 0: 'rim' as const }, ride: { 1: 'bell' as const }, crash: { 2: 'choke' as const } },
      emphasis: { snare: [0], ride: [1] },
    };
    const changed = { ...song, patterns: song.patterns.map((p, i) => (i === 0 ? { ...p, beats: [beat, ...p.beats.slice(1)] } : p)) };
    const doc = createSongDoc(changed);
    expect(firstBeat(songOf(doc))).toEqual(beat);
    expect(A.getHeads(applySong(doc, songOf(doc)))).toEqual(A.getHeads(doc));
  });

  it('ein unveränderter Song erzeugt keine Änderung', () => {
    const song = richSong();
    const doc = createSongDoc(song);
    expect(A.getHeads(applySong(doc, songOf(doc)))).toEqual(A.getHeads(doc));
  });

  it('übernimmt jede Änderung so, dass der Song danach genau dem Ziel entspricht', () => {
    const song = richSong();
    let doc = createSongDoc(baseSong(5));
    doc = applySong(doc, song);
    expect(songOf(doc)).toEqual(song);
    const reordered = { ...song, patterns: [...song.patterns].reverse(), segments: [] };
    expect(songOf(applySong(doc, reordered))).toEqual(reordered);
  });
});

describe('sameSong', () => {
  const base = (): Song => ({
    ...songWith({ title: 'Intro', groove: true, bars: 1 }),
    id: 'intro',
  });

  it('gleicher Inhalt in anderer Feldreihenfolge gilt als gleich', () => {
    const song = base();
    const reordered = JSON.parse(JSON.stringify(song), (_key, value: unknown) =>
      value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value,
    ) as Song;
    expect(JSON.stringify(reordered)).not.toBe(JSON.stringify(song));
    expect(sameSong(song, reordered)).toBe(true);
    expect(sameSong(song, songOf(createSongDoc(song)))).toBe(true);
  });

  it('anderer Inhalt gilt als verschieden', () => {
    const song = base();
    expect(sameSong(song, { ...song, tempo: song.tempo + 1 })).toBe(false);
    expect(sameSong(song, { ...song, title: 'Anders' })).toBe(false);
    expect(sameSong(song, { ...song, revision: song.revision + 1 })).toBe(false);
  });
});

describe('Spec song-history › Autor einer Änderung', () => {
  const lastMessage = (doc: SongDocument) => A.decodeChange(A.getLastLocalChange(doc)!).message;

  it('Änderung trägt die Nachricht mit dem Autor', () => {
    const song = baseSong();
    const doc = applySong(createSongDoc(song), { ...song, tempo: 90 }, changeMessage({ by: 'max@example.org' }));
    expect(readChangeMessage(lastMessage(doc))).toEqual({ by: 'max@example.org' });
  });

  it('Ohne Nachricht trägt die Änderung keinen Autor', () => {
    const song = baseSong();
    const doc = applySong(createSongDoc(song), { ...song, tempo: 90 });
    expect(readChangeMessage(lastMessage(doc))).toEqual({});
  });

  it('Wiederherstellung mit Zielzeit', () => {
    expect(readChangeMessage(changeMessage({ by: 'max@example.org', restore: 1762559580 }))).toEqual({ by: 'max@example.org', restore: 1762559580 });
  });

  it('Ungültige oder fremde Nachrichten gelten als ohne Autor, unbekannte Felder werden ignoriert', () => {
    expect(readChangeMessage(null)).toEqual({});
    expect(readChangeMessage('kein json')).toEqual({});
    expect(readChangeMessage('{"by":42}')).toEqual({});
    expect(readChangeMessage('[1,2]')).toEqual({});
    expect(readChangeMessage('{"by":"a@b.de","neu":true,"restore":"x"}')).toEqual({ by: 'a@b.de' });
  });

  it('Ohne Autor keine Nachricht', () => {
    expect(changeMessage({})).toBeUndefined();
  });
});
