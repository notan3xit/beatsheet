import type { NotebookStore } from '../state/notebookStore';
import { hashOf, parseHash, routeOf, type Route } from '../state/route';

const same = (a: Route, b: Route) => hashOf(a) === hashOf(b);

/**
 * Hält Adresse (Hash) und Ansicht synchron (url-position, design.md D3):
 * Start und Zurück/Vor öffnen die genannte Ansicht, Navigation in der App legt einen Verlaufseintrag an,
 * unbekannte Adressen werden ohne Verlaufseintrag korrigiert. Liefert eine Funktion zum Trennen.
 */
export function connectUrl(store: NotebookStore, win: Window = window): () => void {
  let applying = false;

  /** Öffnet die Ansicht der Route, soweit Song und Pattern existieren. */
  const apply = (route: Route) => {
    const state = store.getState();
    if (same(route, routeOf(state))) return; // nichts tun, z. B. Undo-Historie behalten
    const song = route.kind === 'list' ? undefined : state.songs.find((s) => s.id === route.songId);
    applying = true;
    try {
      if (!song) {
        if (routeOf(state).kind !== 'list') store.backToList();
      } else if (route.kind === 'pattern' && song.patterns.some((p) => p.id === route.patternId)) {
        if (state.openSongId !== song.id) store.openSong(song.id);
        store.openPattern(route.patternId);
      } else if (state.openSongId !== song.id) {
        store.openSong(song.id);
      } else {
        store.backToBook();
      }
    } finally {
      applying = false;
    }
  };

  /** Adresse auf die tatsächlich gezeigte Ansicht korrigieren, ohne Verlaufseintrag. */
  const correct = () => {
    const hash = hashOf(routeOf(store.getState()));
    if (win.location.hash !== hash) win.history.replaceState(win.history.state, '', hash);
  };

  const fromAddress = () => {
    apply(parseHash(win.location.hash));
    correct();
  };

  fromAddress();

  const unsubscribe = store.subscribe(() => {
    if (applying) return;
    const hash = hashOf(routeOf(store.getState()));
    if (win.location.hash !== hash) win.history.pushState(null, '', hash);
  });
  win.addEventListener('popstate', fromAddress);
  win.addEventListener('hashchange', fromAddress);

  return () => {
    unsubscribe();
    win.removeEventListener('popstate', fromAddress);
    win.removeEventListener('hashchange', fromAddress);
  };
}
