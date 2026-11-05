import { describe, expect, it } from 'vitest';
import { toggleHit } from '../domain/sequencer';
import { setTempo } from '../domain/playback';
import { appendSegment } from '../domain/structure';
import type { Workbook } from '../domain/types';
import { notebookWith } from '../test/notebook';
import { emptyBeats, patternOf } from '../test/patterns';
import { createNotebookStore } from './notebookStore';

describe('Spec song-library › Song anlegen', () => {
  it('Song mit Titel anlegen', () => {
    const store = createNotebookStore();
    const song = store.createSong('Hysteria');
    expect(store.getState().songs).toEqual([song]);
    expect(song).toMatchObject({ title: 'Hysteria', patterns: [], segments: [], revision: 1 });
  });

  it('Song ohne Titel anlegen', () => {
    const store = createNotebookStore();
    expect(store.createSong('').title).toBe('Neuer Song');
    expect(store.createSong('   ').title).toBe('Neuer Song');
  });
});

describe('Spec song-library › Song-Tempo', () => {
  it('Tempo eines neuen Songs', () => {
    expect(createNotebookStore().createSong('Hysteria').tempo).toBe(120);
  });

  it('Tempo ändern erhöht die Revision', () => {
    const { store, currentSong } = notebookWith([], 'book');
    const before = currentSong().revision;
    store.updateSong((s) => setTempo(s, 140));
    expect(currentSong()).toMatchObject({ tempo: 140, revision: before + 1 });
  });

  it('Tempo außerhalb des Bereichs und gleiches Tempo lassen die Revision unverändert', () => {
    const { store, currentSong } = notebookWith([], 'book');
    const before = currentSong();
    store.updateSong((s) => setTempo(s, 301));
    store.updateSong((s) => setTempo(s, 29));
    store.updateSong((s) => setTempo(s, before.tempo));
    expect(currentSong()).toBe(before);
  });
});

describe('Spec song-library › Song umbenennen', () => {
  it('Titel ändern und leeren Titel ablehnen', () => {
    const store = createNotebookStore();
    const song = store.createSong('');
    store.renameSong(song.id, 'Uprising');
    expect(store.getState().songs[0]!.title).toBe('Uprising');
    store.renameSong(song.id, '  ');
    expect(store.getState().songs[0]!.title).toBe('Uprising');
  });
});

describe('Spec song-library › Song löschen', () => {
  it('Löschen entfernt Song samt Patterns und schließt ihn', () => {
    const { store, song } = notebookWith([patternOf(emptyBeats(4))], 'book');
    store.deleteSong(song.id);
    expect(store.getState().songs).toEqual([]);
    expect(store.getState().view).toEqual({ kind: 'list' });
  });
});

describe('Spec song-library › Song-Liste (Navigation)', () => {
  it('Song öffnen, Pattern öffnen, zurück', () => {
    const p = patternOf(emptyBeats(4));
    const { store, song } = notebookWith([p], 'list');
    expect(store.getState().view).toEqual({ kind: 'list' });
    store.openSong(song.id);
    expect(store.getState()).toMatchObject({ openSongId: song.id, view: { kind: 'book' } });
    store.openPattern(p.id);
    expect(store.getState().view).toEqual({ kind: 'pattern', patternId: p.id });
    store.backToBook();
    expect(store.getState().view).toEqual({ kind: 'book' });
    store.backToList();
    expect(store.getState()).toMatchObject({ openSongId: null, view: { kind: 'list' } });
  });
});

describe('Pattern-API wirkt im geöffneten Song', () => {
  it('Neues Pattern landet nur im geöffneten Song', () => {
    const store = createNotebookStore();
    const a = store.createSong('A');
    const b = store.createSong('B');
    store.openSong(a.id);
    store.createPattern('groove');
    const [songA, songB] = [a.id, b.id].map((id) => store.getState().songs.find((s) => s.id === id)!);
    expect(songA!.patterns).toHaveLength(1);
    expect(songB!.patterns).toHaveLength(0);
  });

  it('Pattern-Änderung erhöht Revision von Pattern und Song', () => {
    const { store, currentSong, patternsNow } = notebookWith([{ ...patternOf(emptyBeats(4)), revision: 3 }]);
    const songRevision = currentSong().revision;
    store.update(patternsNow()[0]!.id, (p) => toggleHit(p, 0, 'snare', 0));
    expect(patternsNow()[0]!.revision).toBe(4);
    expect(currentSong().revision).toBe(songRevision + 1);
  });

  it('Strukturänderung erhöht die Revision des Songs', () => {
    const { store, currentSong } = notebookWith([], 'book');
    const before = currentSong().revision;
    store.updateSong((song) => appendSegment(song, { name: 'Intro', bars: 4 }));
    expect(currentSong().segments).toHaveLength(1);
    expect(currentSong().revision).toBe(before + 1);
  });

  it('Rückgängig und Wiederherstellen im geöffneten Pattern', () => {
    const { store, patternsNow } = notebookWith([patternOf(emptyBeats(4))]);
    const id = patternsNow()[0]!.id;
    store.update(id, (p) => toggleHit(p, 0, 'kick', 0));
    store.undo();
    expect(patternsNow()[0]!.beats[0]!.hits.kick).toBeUndefined();
    store.redo();
    expect(patternsNow()[0]!.beats[0]!.hits.kick).toEqual([0]);
  });

  it('Mindestens 50 Schritte rückgängig', () => {
    const { store, patternsNow } = notebookWith([patternOf(emptyBeats(4))]);
    const id = patternsNow()[0]!.id;
    for (let i = 0; i < 50; i++) store.update(id, (p) => toggleHit(p, 0, 'kick', i % 4));
    for (let i = 0; i < 50; i++) store.undo();
    expect(patternsNow()[0]!.beats[0]!.hits).toEqual({});
    expect(store.getState().canUndo).toBe(false);
  });

  it('Verlauf gilt nur für das geöffnete Pattern', () => {
    const { store, patternsNow } = notebookWith([patternOf(emptyBeats(4)), patternOf(emptyBeats(1), 'fill')]);
    store.update(patternsNow()[0]!.id, (p) => toggleHit(p, 0, 'kick', 0));
    store.openPattern(patternsNow()[1]!.id);
    expect(store.getState().canUndo).toBe(false);
  });

  it('Duplizieren öffnet die Kopie, Löschen kehrt zur Doppelseite zurück', () => {
    const { store, patternsNow } = notebookWith([patternOf(emptyBeats(4))]);
    const copy = store.duplicate(patternsNow()[0]!.id);
    expect(store.getState().view).toEqual({ kind: 'pattern', patternId: copy.id });
    store.remove(copy.id);
    expect(patternsNow()).toHaveLength(1);
    expect(store.getState().view).toEqual({ kind: 'book' });
  });

  it('Löschen entfernt Verweise in der Struktur', () => {
    const { store, currentSong, patternsNow } = notebookWith([patternOf(emptyBeats(4))]);
    const id = patternsNow()[0]!.id;
    store.updateSong((song) => appendSegment(song, { name: 'V', bars: 3, grooveId: id }));
    expect(store.usage(id)).toBe(3);
    store.remove(id);
    const bars = currentSong().segments[0]!.blocks[0]!.bars;
    expect(bars.every((b) => b.grooveId === null)).toBe(true);
  });
});

describe('Spec workbook-sync › Store', () => {
  const band: Workbook = { id: 'wb', title: 'Band', owner: 'ich@example.com', members: ['ich@example.com'] };

  it('applyRemote übernimmt Songs ohne Revisionserhöhung und ohne Ansichtswechsel', () => {
    const store = createNotebookStore();
    const song = store.createSong('Intro');
    store.openSong(song.id);
    store.applyRemote([{ ...song, title: 'Neu', revision: 7 }], []);
    expect(store.getState().songs[0]).toMatchObject({ title: 'Neu', revision: 7 });
    expect(store.getState().view).toEqual({ kind: 'book' });
    expect(store.getState().openSongId).toBe(song.id);
  });

  it('applyRemote fügt unbekannte Songs hinzu und entfernt genannte', () => {
    const store = createNotebookStore();
    const song = store.createSong('Intro');
    const other = { ...song, id: 'anders', title: 'Anders' };
    store.applyRemote([other], [song.id]);
    expect(store.getState().songs.map((s) => s.id)).toEqual(['anders']);
  });

  it('wechselt zur Startseite, wenn der geöffnete Song entfernt wird', () => {
    const store = createNotebookStore();
    const song = store.createSong('Intro');
    store.openSong(song.id);
    store.applyRemote([], [song.id]);
    expect(store.getState().view).toEqual({ kind: 'list' });
    expect(store.getState().openSongId).toBeNull();
  });

  it('wechselt zur Doppelseite, wenn das geöffnete Pattern fremd entfernt wird', () => {
    const store = createNotebookStore();
    const song = store.createSong('Intro');
    store.openSong(song.id);
    const pattern = store.createPattern('groove');
    expect(store.getState().view).toEqual({ kind: 'pattern', patternId: pattern.id });
    store.applyRemote([{ ...store.getState().songs[0]!, patterns: [] }], []);
    expect(store.getState().view).toEqual({ kind: 'book' });
  });

  it('place setzt und löst die Zugehörigkeit', () => {
    const store = createNotebookStore();
    const song = store.createSong('Intro');
    store.place(song.id, band.id);
    expect(store.getState().placement).toEqual({ [song.id]: band.id });
    store.place(song.id, null);
    expect(store.getState().placement).toEqual({});
  });

  it('createSong mit Workbook legt den Song dort an', () => {
    const store = createNotebookStore();
    const song = store.createSong('', band.id);
    expect(song.title).toBe('Neuer Song');
    expect(store.getState().placement).toEqual({ [song.id]: band.id });
  });

  it('Entfernte Songs verlieren ihre Zugehörigkeit', () => {
    const store = createNotebookStore();
    const first = store.createSong('A', band.id);
    const second = store.createSong('B', band.id);
    store.deleteSong(first.id);
    store.applyRemote([], [second.id]);
    expect(store.getState().placement).toEqual({});
  });

  it('setWorkbooks und Anfangszustand', () => {
    const song = createNotebookStore().createSong('A');
    const store = createNotebookStore([song], undefined, { placement: { [song.id]: band.id }, workbooks: [band] });
    expect(store.getState().workbooks).toEqual([band]);
    expect(store.getState().placement).toEqual({ [song.id]: band.id });
    store.setWorkbooks([]);
    expect(store.getState().workbooks).toEqual([]);
  });
});

describe('Spec song-lock › Sperrzustand im Store', () => {
  const withContent = () => notebookWith([patternOf(emptyBeats(4))], 'list');

  it('Song mit Inhalt öffnet gesperrt, auch nach vorherigem Entsperren', () => {
    const { store, song } = withContent();
    store.openSong(song.id);
    expect(store.getState().locked).toBe(true);
    store.setLocked(false);
    expect(store.getState().locked).toBe(false);
    store.backToList();
    store.openSong(song.id);
    expect(store.getState().locked).toBe(true);
  });

  it('Song ohne Segmente und Patterns öffnet entsperrt', () => {
    const store = createNotebookStore();
    store.openSong(store.createSong('Neu').id);
    expect(store.getState().locked).toBe(false);
  });

  it('Song nur mit Patterns öffnet gesperrt', () => {
    const { store, song } = withContent();
    expect(song.segments).toEqual([]);
    store.openSong(song.id);
    expect(store.getState().locked).toBe(true);
  });

  it('Song nur mit Segmenten öffnet gesperrt', () => {
    const store = createNotebookStore();
    const song = store.createSong('Neu');
    store.openSong(song.id);
    store.updateSong((s) => appendSegment(s, { name: 'Verse', bars: 1 }));
    store.backToList();
    store.openSong(song.id);
    expect(store.getState().locked).toBe(true);
  });

  it.each([true, false])('Navigation im Song, Abgleich und Import lassen den Zustand %s unverändert', (locked) => {
    const { store, song, currentSong, patternsNow } = withContent();
    store.openSong(song.id);
    store.setLocked(locked);
    store.openPattern(patternsNow()[0]!.id);
    expect(store.getState().locked).toBe(locked);
    store.backToBook();
    expect(store.getState().locked).toBe(locked);
    store.applyRemote([{ ...currentSong(), title: 'Fremd' }], []);
    expect(store.getState().locked).toBe(locked);
    store.importSongs([{ ...currentSong(), title: 'Importiert' }]);
    expect(store.getState().locked).toBe(locked);
  });

  it('Sperren und Entsperren ändern weder Revision noch Änderungszeit', () => {
    const { store, song, currentSong } = withContent();
    store.openSong(song.id);
    const before = currentSong();
    store.setLocked(false);
    store.setLocked(true);
    expect(currentSong()).toBe(before);
  });
});
