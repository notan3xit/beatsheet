import { describe, expect, it } from 'vitest';
import { addPlaceholder, appendSegment, addAccent, setBarProps } from '../domain/structure';
import type { Song } from '../domain/types';
import { emptyBeats, patternOf } from '../test/patterns';
import { songWith } from '../test/songs';
import { exportFileName, parseNotebookFile, serializeNotebook } from './fileFormat';

const NOW = new Date('2026-11-01T12:00:00.000Z');

/** Song mit Groove (Triole, offene HH), Fill, Struktur, Fill-Zuordnung und Akzent. */
function richSong(title = 'Hysteria'): Song {
  const groove = patternOf([
    { hits: { kick: [1, 3], hihat: [1, 2, 3, 4] } },
    { sub: 3, hits: { snare: [1, 2, 3] } },
    { sub: 2, hits: { hihatOpen: [1] } },
    { sub: 6, hits: { tom1: [1, 6] } },
  ]);
  let song = songWith({ title, patterns: [{ ...groove, name: 'Verse', revision: 7 }] });
  const fill = addPlaceholder(song, { kind: 'fill', name: 'Tom-Run', length: 2 });
  song = appendSegment(fill.song, { name: 'Verse', bars: 4, grooveId: groove.id });
  const bars = song.segments[0]!.blocks[0]!.bars;
  song = setBarProps(song, [bars[3]!.id], { fillId: fill.pattern.id, beats: 3 });
  return addAccent(song, bars[0]!.id, { instrument: 'crash', beat: 0, position: 0 });
}

/** Exportdatei als Objekt, um einzelne Stellen gezielt zu verändern. */
const fileOf = (songs: Song[]) => JSON.parse(serializeNotebook(songs, NOW));

/** Erfolgreiches Ergebnis einer Datei der eigenen oder einer älteren Version. */
const imported = (songs: Song[]) => ({ ok: true, songs, fromNewerVersion: false });

describe('Spec library-persistence › Export der Bibliothek', () => {
  it('Export herunterladen: Dateiname und Inhalt', () => {
    expect(exportFileName(NOW)).toBe('beatsheet-2026-11-01.json');
    const file = fileOf([richSong(), songWith({ title: 'Leer' })]);
    expect(file).toMatchObject({ format: 'beatsheet.library', schemaVersion: 4, exportedAt: NOW.toISOString() });
    expect(file.songs.map((s: Song) => s.title)).toEqual(['Hysteria', 'Leer']);
    expect(Object.keys(file.songs[0]).sort()).toEqual(
      ['createdAt', 'id', 'patterns', 'revision', 'segments', 'tempo', 'title', 'updatedAt'].sort(),
    );
  });

  it('Export ist verlustfrei', () => {
    const songs = [richSong(), songWith({ title: 'Leer' })];
    expect(parseNotebookFile(serializeNotebook(songs, NOW))).toEqual(imported(songs));
  });
});

describe('Spec library-persistence › Tempo im Format', () => {
  it('Tempo im Export', () => {
    const songs = [songWith({ title: 'Langsam', tempo: 96 })];
    const result = parseNotebookFile(serializeNotebook(songs, NOW));
    expect(result).toEqual(imported(songs));
    expect(result.ok && result.songs[0]!.tempo).toBe(96);
  });

  it.each([0, 72.5, 29, 301, '120'])('Ungültiges Tempo %s', (tempo) => {
    const file = fileOf([richSong()]);
    file.songs[0].tempo = tempo;
    const result = parseNotebookFile(JSON.stringify(file));
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });

  it('Export ohne Tempo importieren (Schemaversion 3)', () => {
    const song = songWithArticulations();
    const file = fileOf([song]);
    delete file.songs[0].tempo;
    expect(file.schemaVersion).toBe(4);
    expect(parseNotebookFile(JSON.stringify(file))).toEqual(imported([{ ...song, tempo: 120 }]));
  });

  it('Datei der Schemaversion 2', () => {
    const song = songWith({ title: 'Alt', tempo: 140 });
    const file = { ...fileOf([song]), schemaVersion: 2 };
    delete file.songs[0].tempo;
    expect(parseNotebookFile(JSON.stringify(file))).toEqual(imported([{ ...song, tempo: 120 }]));
  });
});

describe('Spec library-persistence › Unbekannte Felder in Importdateien', () => {
  it('Zusätzliches Feld aus einer neueren Version', () => {
    const song = richSong();
    const file = fileOf([song]);
    file.producer = 'beatsheet 9';
    file.songs[0].key = 'E-Moll';
    file.songs[0].segments[0].mood = 'ruhig';
    file.songs[0].segments[0].blocks[0].repeat = 2;
    file.songs[0].segments[0].blocks[0].bars[0].dynamics = 'p';
    file.songs[0].segments[0].blocks[0].bars[0].accents[0].velocity = 0.8;
    file.songs[0].patterns[0].swing = 0.6;
    file.songs[0].patterns[0].beats[0].humanize = true;
    const result = parseNotebookFile(JSON.stringify(file));
    expect(result).toEqual(imported([song]));
  });
});

describe('Spec library-persistence › Ungültige Importdateien', () => {
  it('Neuere Schemaversion', () => {
    const songs = [richSong()];
    const result = parseNotebookFile(JSON.stringify({ ...fileOf(songs), schemaVersion: 5 }));
    expect(result).toEqual({ ok: true, songs, fromNewerVersion: true });
  });

  it('Neuere Schemaversion: Strukturregeln gelten weiter', () => {
    const file = { ...fileOf([richSong()]), schemaVersion: 5 };
    file.songs[0].patterns[0].beats = [];
    const result = parseNotebookFile(JSON.stringify(file));
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });

  it('Keine erkennbaren Songs', () => {
    for (const data of [{ format: 'drumstuff.library', schemaVersion: 3 }, { songs: 'nein' }, [], 42]) {
      expect(parseNotebookFile(JSON.stringify(data))).toEqual({
        ok: false,
        error: 'Die Datei enthält keine importierbaren Songs.',
      });
    }
  });

  it('Beschädigte Datei', () => {
    const file = fileOf([richSong()]);
    file.songs[0].patterns[0].beats = [];
    expect(parseNotebookFile(JSON.stringify(file)).ok).toBe(false);
    const result = parseNotebookFile(JSON.stringify(file));
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });

  it('Verweis auf fremdes Pattern', () => {
    const other = richSong('Anderer');
    const file = fileOf([richSong(), other]);
    file.songs[0].segments[0].blocks[0].bars[0].grooveId = other.patterns[0]!.id;
    const result = parseNotebookFile(JSON.stringify(file));
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });

  it.each([
    ['Groove-Verweis auf einen Fill', (f: any) => (f.songs[0].segments[0].blocks[0].bars[0].grooveId = f.songs[0].patterns[1].id)],
    ['Fill-Verweis auf einen Groove', (f: any) => (f.songs[0].segments[0].blocks[0].bars[0].fillId = f.songs[0].patterns[0].id)],
    ['Akzent außerhalb des Takts', (f: any) => (f.songs[0].segments[0].blocks[0].bars[0].accents[0].beat = 4)],
    ['Taktlänge 0', (f: any) => (f.songs[0].segments[0].blocks[0].bars[0].beats = 0)],
    ['unbekannte Farbe', (f: any) => (f.songs[0].patterns[0].color = 'red')],
    ['leerer Songtitel', (f: any) => (f.songs[0].title = ' ')],
  ])('Strukturregel verletzt: %s', (_, mutate) => {
    const file = fileOf([richSong()]);
    mutate(file);
    const result = parseNotebookFile(JSON.stringify(file));
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });

  it('Kein gültiges JSON', () => {
    expect(parseNotebookFile('{ nope')).toMatchObject({ ok: false, error: expect.stringMatching(/kein gültiges JSON/) });
  });

  it('Fehlermeldungen nennen keinen Projektnamen', () => {
    const file = fileOf([richSong()]);
    file.songs[0].title = ' ';
    for (const text of ['{ nope', '{}', JSON.stringify(file)]) {
      const result = parseNotebookFile(text);
      expect(!result.ok && result.error).not.toMatch(/beatsheet/i);
    }
  });
});

describe('Spec library-persistence › Exporte unter dem früheren Namen', () => {
  it('Alter Export', () => {
    const songs = [richSong(), songWith({ title: 'Leer' })];
    const old = { ...fileOf(songs), format: 'drumstuff.library' };
    const result = parseNotebookFile(JSON.stringify(old));
    expect(result).toEqual(imported(songs));
    expect(result.ok && result.songs.map((s) => s.id)).toEqual(songs.map((s) => s.id));
  });
});

describe('Spec library-persistence › Formatkennung und Schemaversion beim Import', () => {
  it('Fremde Formatkennung', () => {
    const songs = [richSong()];
    expect(parseNotebookFile(JSON.stringify({ ...fileOf(songs), format: 'anderes.format' }))).toEqual(imported(songs));
  });

  it('Ohne Formatkennung und Schemaversion', () => {
    const songs = [richSong()];
    expect(parseNotebookFile(JSON.stringify({ songs: fileOf(songs).songs }))).toEqual(imported(songs));
  });

  it('Schemaversion keine Zahl', () => {
    const songs = [richSong()];
    expect(parseNotebookFile(JSON.stringify({ ...fileOf(songs), schemaVersion: '9' }))).toEqual(imported(songs));
  });

  it('Altes Format ohne Schemaversion', () => {
    const patterns = [patternOf(emptyBeats(4)), patternOf(emptyBeats(1), 'fill')];
    const result = parseNotebookFile(JSON.stringify({ patterns: patterns.map(({ color: _color, ...rest }) => rest) }));
    expect(result.ok && result.fromNewerVersion).toBe(false);
    if (!result.ok) return;
    expect(result.songs.map((s) => s.title)).toEqual(['Importierte Patterns']);
    expect(result.songs[0]!.patterns.map((p) => p.id)).toEqual(patterns.map((p) => p.id));
  });

  it('Struktur hat Vorrang vor der Schemaversion', () => {
    const songs = [richSong()];
    expect(parseNotebookFile(JSON.stringify({ ...fileOf(songs), schemaVersion: 1 }))).toEqual(imported(songs));
  });

  it('Export schreibt Formatkennung und Schemaversion', () => {
    expect(fileOf([])).toMatchObject({ format: 'beatsheet.library', schemaVersion: 4 });
  });
});

describe('Spec library-persistence › Import von Dateien der Schemaversion 1', () => {
  it('Alte Exportdatei importieren', () => {
    const patterns = [patternOf(emptyBeats(4)), patternOf(emptyBeats(4)), patternOf(emptyBeats(1), 'fill')];
    const v1 = JSON.stringify({
      format: 'drumstuff.library',
      schemaVersion: 1,
      exportedAt: NOW.toISOString(),
      patterns: patterns.map(({ color: _color, ...rest }) => rest),
    });
    const result = parseNotebookFile(v1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.songs).toHaveLength(1);
    const [song] = result.songs;
    expect(song!.title).toBe('Importierte Patterns');
    expect(song!.segments).toEqual([]);
    expect(song!.patterns.map((p) => p.id)).toEqual(patterns.map((p) => p.id));
    expect(song!.patterns.map((p) => p.beats)).toEqual(patterns.map((p) => p.beats));
    expect(new Set(song!.patterns.map((p) => p.color)).size).toBe(3);
  });

  it('Ungültige v1-Datei wird abgewiesen', () => {
    const v1 = JSON.stringify({
      format: 'drumstuff.library',
      schemaVersion: 1,
      exportedAt: NOW.toISOString(),
      patterns: [{ ...patternOf(emptyBeats(4)), beats: [] }],
    });
    expect(parseNotebookFile(v1).ok).toBe(false);
  });
});

/** Song mit Snare-Flam und Ghost Note im ersten Beat des Grooves. */
function songWithArticulations(): Song {
  const groove = patternOf([{ hits: { snare: [1, 2], hihat: [1, 3] } }, ...emptyBeats(3)]);
  groove.beats[0] = { ...groove.beats[0]!, articulations: { snare: { 0: 'flam', 1: 'ghost' } } };
  return songWith({ title: 'Ghosts', patterns: [groove] });
}

describe('Spec library-persistence › Spielweisen (Schemaversion 3)', () => {
  it('Spielweisen im Export', () => {
    const songs = [songWithArticulations()];
    const result = parseNotebookFile(serializeNotebook(songs, NOW));
    expect(result).toEqual(imported(songs));
    expect(result.ok && result.songs[0]!.patterns[0]!.beats[0]!.articulations).toEqual({ snare: { 0: 'flam', 1: 'ghost' } });
  });

  it('Spielweise ohne Schlag', () => {
    const file = fileOf([songWithArticulations()]);
    file.songs[0].patterns[0].beats[0].articulations = { snare: { 3: 'flam' } };
    expect(parseNotebookFile(JSON.stringify(file)).ok).toBe(false);
  });

  it('Spielweise auf der Hi-Hat', () => {
    const file = fileOf([songWithArticulations()]);
    file.songs[0].patterns[0].beats[0].articulations = { hihat: { 0: 'flam' } };
    expect(parseNotebookFile(JSON.stringify(file)).ok).toBe(false);
  });

  it('Unbekannte Spielweise', () => {
    const file = fileOf([songWithArticulations()]);
    file.songs[0].patterns[0].beats[0].articulations = { snare: { 0: 'buzz' } };
    expect(parseNotebookFile(JSON.stringify(file)).ok).toBe(false);
  });
});

/** Song mit allen neuen Spielweisen und Betonungen im ersten Beat des Grooves. */
function songWithHitTypes(): Song {
  const groove = patternOf([{ hits: { snare: [1, 2], ride: [1], crash: [2], hihat: [3], tom1: [4] } }, ...emptyBeats(3)]);
  groove.beats[0] = {
    ...groove.beats[0]!,
    articulations: { snare: { 0: 'rim', 1: 'drag' }, ride: { 0: 'bell' }, crash: { 1: 'choke' }, tom1: { 3: 'drag' } },
    emphasis: { snare: [0], hihat: [2] },
  };
  return songWith({ title: 'Neue Schläge', patterns: [groove] });
}

describe('Spec library-persistence › Spielweisen und Betonung (Schemaversion 4)', () => {
  it('Neue Spielweisen und Betonung im Export', () => {
    const songs = [songWithHitTypes()];
    const result = parseNotebookFile(serializeNotebook(songs, NOW));
    expect(result).toEqual(imported(songs));
    const beat = result.ok ? result.songs[0]!.patterns[0]!.beats[0]! : null;
    expect(beat?.articulations).toEqual({ snare: { 0: 'rim', 1: 'drag' }, ride: { 0: 'bell' }, crash: { 1: 'choke' }, tom1: { 3: 'drag' } });
    expect(beat?.emphasis).toEqual({ snare: [0], hihat: [2] });
  });

  it.each([
    ['Rim Shot auf Tom 1', { tom1: { 3: 'rim' } }],
    ['Flam auf der Ride', { ride: { 0: 'flam' } }],
    ['Glocke auf der Snare', { snare: { 0: 'bell' } }],
    ['Choke auf der Ride', { ride: { 0: 'choke' } }],
  ])('Spielweise auf einem unpassenden Instrument: %s', (_name, articulations) => {
    const file = fileOf([songWithHitTypes()]);
    file.songs[0].patterns[0].beats[0].articulations = articulations;
    expect(parseNotebookFile(JSON.stringify(file)).ok).toBe(false);
  });

  it('Betonung ohne Schlag', () => {
    const file = fileOf([songWithHitTypes()]);
    file.songs[0].patterns[0].beats[0].emphasis = { kick: [0] };
    expect(parseNotebookFile(JSON.stringify(file)).ok).toBe(false);
  });

  it('Betonte Ghost Note', () => {
    const file = fileOf([songWithArticulations()]);
    file.songs[0].patterns[0].beats[0].emphasis = { snare: [1] };
    expect(parseNotebookFile(JSON.stringify(file)).ok).toBe(false);
  });
});

describe('Spec library-persistence › Import von Dateien der Schemaversion 3', () => {
  it('Datei der Schemaversion 3', () => {
    const songs = [songWithArticulations()];
    const result = parseNotebookFile(JSON.stringify({ ...fileOf(songs), schemaVersion: 3 }));
    expect(result).toEqual(imported(songs));
    expect(result.ok && result.songs[0]!.patterns[0]!.beats[0]!.emphasis).toBeUndefined();
  });
});

describe('Spec library-persistence › Import von Dateien der Schemaversion 2', () => {
  it('Export der Vorversion importieren', () => {
    const songs = [richSong()];
    const result = parseNotebookFile(JSON.stringify({ ...fileOf(songs), schemaVersion: 2 }));
    expect(result).toEqual(imported(songs));
  });
});

describe('Dateiformat mit Zweiunddreißigsteln (thirty-second-notes)', () => {
  const rollSong = () => songWith({ title: 'Roll', patterns: [patternOf([{ sub: 8, hits: { snare: [1, 2, 3, 4, 5, 6, 7, 8] } }], 'fill')] });

  it('Rundlauf mit Unterteilung 8 bei Schemaversion 3', () => {
    const songs = [rollSong()];
    const file = serializeNotebook(songs, NOW);
    expect(JSON.parse(file).schemaVersion).toBe(4);
    expect(parseNotebookFile(file)).toEqual(imported(songs));
  });

  it('Rundlauf mit Unterteilung 12', () => {
    const songs = [songWith({ title: 'Triolen', patterns: [patternOf([{ sub: 12, hits: { snare: [1, 5, 9, 12] } }], 'fill')] })];
    expect(parseNotebookFile(serializeNotebook(songs, NOW))).toEqual(imported(songs));
  });

  it('Position außerhalb des Zweiunddreißigstel-Rasters wird abgewiesen', () => {
    const file = fileOf([rollSong()]);
    file.songs[0].patterns[0].beats[0].hits.snare = [8];
    const result = parseNotebookFile(JSON.stringify(file));
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });
});
