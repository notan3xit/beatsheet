import { useNotebook, useOpenSong, useStore } from './useLibrary';

/** Pfad über der Überschrift: „Songs“ und im Pattern-Editor der Songtitel (navigation, design.md D1). */
export function Breadcrumbs() {
  const store = useStore();
  const { view } = useNotebook();
  const song = useOpenSong();
  return (
    <nav aria-label="Pfad" className="breadcrumbs">
      <ol>
        <li>
          <button type="button" data-read-safe="" onClick={() => store.backToList()}>
            Songs
          </button>
        </li>
        {view.kind === 'pattern' && (
          <li>
            <button type="button" data-read-safe="" onClick={() => store.backToBook()}>
              {song.title}
            </button>
          </li>
        )}
      </ol>
    </nav>
  );
}
