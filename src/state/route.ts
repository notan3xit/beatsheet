import type { NotebookState } from './notebookStore';

/** Ansicht als Adresse (url-position, design.md D1/D2); ohne Browser-APIs. */
export type Route =
  | { kind: 'list' }
  | { kind: 'book'; songId: string }
  | { kind: 'pattern'; songId: string; patternId: string };

const LIST: Route = { kind: 'list' };

export function routeOf(state: NotebookState): Route {
  if (state.openSongId === null || state.view.kind === 'list') return LIST;
  if (state.view.kind === 'pattern') return { kind: 'pattern', songId: state.openSongId, patternId: state.view.patternId };
  return { kind: 'book', songId: state.openSongId };
}

export function hashOf(route: Route): string {
  switch (route.kind) {
    case 'list':
      return '#/';
    case 'book':
      return `#/songs/${encodeURIComponent(route.songId)}`;
    case 'pattern':
      return `#/songs/${encodeURIComponent(route.songId)}/patterns/${encodeURIComponent(route.patternId)}`;
  }
}

/** Liest einen Hash; alles Unlesbare führt zur Song-Liste. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  try {
    const [songs, songId, patterns, patternId, ...rest] = parts.map(decodeURIComponent);
    if (rest.length > 0 || songs !== 'songs' || !songId) return LIST;
    if (patterns === undefined) return { kind: 'book', songId };
    if (patterns === 'patterns' && patternId) return { kind: 'pattern', songId, patternId };
    return LIST;
  } catch {
    return LIST; // ungültige Prozent-Kodierung
  }
}
