import { createContext, useContext, useSyncExternalStore } from 'react';
import { openSongOf, type NotebookState, type NotebookStore } from '../state/notebookStore';
import type { Song } from '../domain/types';

export const StoreContext = createContext<NotebookStore | null>(null);

export function useStore(): NotebookStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreContext fehlt');
  return store;
}

export function useNotebook(): NotebookState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState);
}

/** Der geöffnete Song; nur innerhalb von Song-Ansichten verwenden. */
export function useOpenSong(): Song {
  const song = openSongOf(useNotebook());
  if (!song) throw new Error('Kein Song geöffnet');
  return song;
}
