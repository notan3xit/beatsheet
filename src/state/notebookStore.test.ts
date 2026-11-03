import { describe, expect, it } from 'vitest';
import { toggleHit } from '../domain/sequencer';
import { setTempo } from '../domain/playback';
import { appendSegment } from '../domain/structure';
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
