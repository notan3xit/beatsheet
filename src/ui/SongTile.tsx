import type { ReactNode } from 'react';
import { allBars } from '../domain/songPatterns';
import type { Song } from '../domain/types';
import { useSongDragSource } from './dragSong';
import { SongMotif } from './SongMotif';
import { useStore } from './useLibrary';

export const sortedByTitle = <T,>(items: readonly T[], title: (item: T) => string) =>
  [...items].sort((a, b) => title(a).localeCompare(title(b), 'de', { sensitivity: 'base' }));

const barsLabel = (count: number) => (count === 1 ? '1 Takt' : `${count} Takte`);

/**
 * Kachel eines Songs (song-overview-tiles, design.md D3): ganze Fläche klickbar,
 * der Knopf im Titel dient Tastatur und Bildschirmleser. `action` öffnet den Song nicht.
 */
export function SongTile({ song, action, draggable = false }: { song: Song; action?: ReactNode; draggable?: boolean }) {
  const store = useStore();
  const source = useSongDragSource(song);
  return (
    <article
      className={`tile${source.dragging ? ' dragging' : ''}`}
      onClick={() => store.openSong(song.id)}
      {...(draggable ? source.props : {})}
    >
      <div className="motif-area">
        <SongMotif song={song} />
      </div>
      <div className="tile-text">
        <h4>
          <button type="button" className="tile-open">
            {song.title}
          </button>
        </h4>
        <span className="tile-meta">
          {barsLabel(allBars(song).length)} · ♩ = {song.tempo}
        </span>
      </div>
      {action && (
        <div className="tile-action" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      )}
    </article>
  );
}

/** Letzte Kachel eines Bereichs: legt einen Song an. */
export function AddSongTile({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="tile tile-add" onClick={onClick}>
      + Song
    </button>
  );
}

/** Kacheln eines Bereichs, alphabetisch, gefolgt von „+ Song“. */
export function SongTiles({
  songs,
  action,
  onAdd,
  draggable = false,
}: {
  songs: readonly Song[];
  action?: (song: Song) => ReactNode;
  onAdd: () => void;
  /** Kacheln lassen sich auf Workbooks ziehen (nur „Meine Songs“). */
  draggable?: boolean;
}) {
  return (
    <div className="tiles">
      {sortedByTitle(songs, (s) => s.title).map((song) => (
        <SongTile key={song.id} song={song} action={action?.(song)} draggable={draggable} />
      ))}
      <AddSongTile onClick={onAdd} />
    </div>
  );
}
