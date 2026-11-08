import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import { songWith } from '../test/songs';
import { createNotebookStore } from './notebookStore';
import { hashOf, parseHash, routeOf, type Route } from './route';

describe('Routen: Ansicht <-> Hash', () => {
  const routes: [Route, string][] = [
    [{ kind: 'list' }, '#/'],
    [{ kind: 'book', songId: 'song-1' }, '#/songs/song-1'],
    [{ kind: 'pattern', songId: 'song-1', patternId: 'p-2' }, '#/songs/song-1/patterns/p-2'],
    [{ kind: 'history', songId: 'song-1' }, '#/songs/song-1/history'],
    [{ kind: 'pattern', songId: 'a/b c', patternId: 'ä#?' }, '#/songs/a%2Fb%20c/patterns/%C3%A4%23%3F'],
  ];

  it.each(routes)('Hin- und Rückweg %o', (route, hash) => {
    expect(hashOf(route)).toBe(hash);
    expect(parseHash(hash)).toEqual(route);
  });

  it.each(['', '#', '#/foo', '#/songs/', '#/songs/x/patterns/', '#/songs/x/y/z', '#/songs/x/history/y', '#/songs/%E0%A4%A'])(
    'nicht lesbarer Hash %j führt zur Liste',
    (hash) => {
      expect(parseHash(hash)).toEqual({ kind: 'list' });
    },
  );

  it('routeOf aus dem Store-Zustand', () => {
    const pattern = createPattern([], { kind: 'groove', name: 'Verse' });
    const song = songWith({ title: 'Hysteria', patterns: [pattern] });
    const store = createNotebookStore([song]);
    expect(routeOf(store.getState())).toEqual({ kind: 'list' });
    store.openSong(song.id);
    expect(routeOf(store.getState())).toEqual({ kind: 'book', songId: song.id });
    store.openPattern(pattern.id);
    expect(routeOf(store.getState())).toEqual({ kind: 'pattern', songId: song.id, patternId: pattern.id });
    store.openHistory();
    expect(routeOf(store.getState())).toEqual({ kind: 'history', songId: song.id });
  });
});
