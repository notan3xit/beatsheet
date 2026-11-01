import { createContext, useContext, useSyncExternalStore } from 'react';
import type { LibraryState, LibraryStore } from '../state/libraryStore';

export const StoreContext = createContext<LibraryStore | null>(null);

export function useStore(): LibraryStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreContext fehlt');
  return store;
}

export function useLibrary(): LibraryState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState);
}
