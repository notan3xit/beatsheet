import * as A from '@automerge/automerge/slim';
import { describe, expect, it } from 'vitest';
import { setTempo } from '../domain/playback';
import type { Song } from '../domain/types';
import { songWith } from '../test/songs';
import { isNew, lastChange } from './activity';
import { applySong, changeMessage, createSongDoc, songOf, type SongDocument } from './songDoc';

const ME = 'artjom@example.org';
const MAX = 'max@example.org';

const by = (author: string | null) => changeMessage({ by: author ?? undefined });
/** Änderung am Song als Change eines Autors zu einer Zeit (Sekunden). */
const edit = (doc: SongDocument, author: string | null, change: (song: Song) => Song, time?: number) => {
  if (time === undefined) return applySong(doc, change(songOf(doc)), by(author));
  // Mit fester Zeit: nur das Tempo, als Change mit `time`
  return A.change(doc, { message: by(author), time }, (d) => {
    Object.assign(d, { tempo: change(songOf(doc)).tempo });
  });
};
const tempo = (bpm: number) => (song: Song) => setTempo(song, bpm);

describe('Letzte Änderung', () => {
  it('nennt Zeit und Autor des neuesten Changes', () => {
    const doc = edit(edit(createSongDoc(songWith({ title: 'Hysteria' }), by(ME)), ME, tempo(90), 1000), MAX, tempo(100), 2000);
    expect(lastChange(doc)).toEqual({ time: 2000, author: MAX });
  });

  it('wählt bei nebenläufigen Heads den spätesten', () => {
    const base = createSongDoc(songWith({ title: 'Hysteria' }), by(ME));
    const mine = edit(A.clone(base), ME, tempo(90), 3000);
    const his = edit(A.clone(base), MAX, tempo(100), 2000);
    const merged = A.merge(A.clone(mine), his);
    expect(A.getHeads(merged)).toHaveLength(2);
    expect(lastChange(merged)).toEqual({ time: 3000, author: ME });
  });

  it('kennt keinen Autor ohne Anmeldung', () => {
    const doc = edit(createSongDoc(songWith({})), null, tempo(90), 1000);
    expect(lastChange(doc)).toEqual({ time: 1000, author: null });
  });
});

describe('Spec song-activity › Neues auf der Kachel', () => {
  const start = () => createSongDoc(songWith({ title: 'Hysteria' }), by(ME));

  it('Max ändert', () => {
    const doc = start();
    const seen = A.getHeads(doc);
    expect(isNew(doc, seen, ME)).toBe(false);
    expect(isNew(edit(doc, MAX, tempo(90)), seen, ME)).toBe(true);
  });

  it('Hin und zurück', () => {
    const doc = start();
    const seen = A.getHeads(doc);
    const back = edit(edit(doc, MAX, tempo(90)), MAX, tempo(120));
    expect(isNew(back, seen, ME)).toBe(false);
  });

  it('Eigenes anderes Gerät', () => {
    const doc = start();
    expect(isNew(edit(doc, ME, tempo(90)), A.getHeads(doc), ME)).toBe(false);
  });

  it('Neuer Song eines anderen', () => {
    const doc = createSongDoc(songWith({ title: 'Neu' }), by(MAX));
    expect(isNew(doc, null, ME)).toBe(true);
    expect(isNew(start(), null, ME)).toBe(false);
  });

  it('Änderung ohne Autor zählt als fremd', () => {
    const doc = start();
    expect(isNew(edit(doc, null, tempo(90)), A.getHeads(doc), ME)).toBe(true);
  });
});

describe('Spec song-activity › Spät eintreffende Änderungen', () => {
  it('Offline-Änderung von Max', () => {
    const base = createSongDoc(songWith({ title: 'Hysteria' }), by(ME));
    const offline = edit(A.clone(base), MAX, tempo(90), 1000);
    const seen = A.getHeads(base);
    const arrived = A.merge(A.clone(base), offline);
    expect(isNew(arrived, seen, ME)).toBe(true);
  });

  it('Ein unbekannter Head im gesehenen Stand zeigt nichts als neu', () => {
    const doc = edit(createSongDoc(songWith({}), by(ME)), MAX, tempo(90));
    expect(isNew(doc, ['f'.repeat(64)], ME)).toBe(false);
  });
});
