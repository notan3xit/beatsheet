import type { Pattern } from '../domain/types';
import { createNotebookStore } from '../state/notebookStore';
import { songWith } from './songs';

/** Testhilfe: Notenbuch mit einem Song aus den Patterns; optional direkt im Pattern-Editor des ersten Patterns. Ein geöffneter Song ist entsperrt. */
export function notebookWith(patterns: Pattern[], open: 'list' | 'book' | 'pattern' = 'pattern') {
  const song = songWith({ title: 'Test', patterns });
  const store = createNotebookStore([song]);
  if (open !== 'list') {
    store.openSong(song.id);
    store.setLocked(false);
  }
  if (open === 'pattern' && patterns[0]) store.openPattern(patterns[0].id);
  const currentSong = () => store.getState().songs.find((s) => s.id === song.id)!;
  const patternsNow = () => currentSong().patterns;
  return { store, song, currentSong, patternsNow };
}
