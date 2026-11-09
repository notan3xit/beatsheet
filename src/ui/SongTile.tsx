import type { ReactNode } from 'react';
import { allBars } from '../domain/songPatterns';
import type { Song, Workbook } from '../domain/types';
import { useSongDragSource } from './dragSong';
import { formatRelative } from './historyText';
import { SongMotif } from './SongMotif';
import { useActivity, useMinute } from './useActivity';
import { useNotebook, useStore } from './useLibrary';

export const sortedByTitle = <T,>(items: readonly T[], title: (item: T) => string) =>
  [...items].sort((a, b) => title(a).localeCompare(title(b), 'de', { sensitivity: 'base' }));

const barsLabel = (count: number) => (count === 1 ? '1 Takt' : `${count} Takte`);

/** Punkt für Neues seit dem letzten Ansehen (song-activity). */
export function NewDot() {
  return <span className="new-dot" role="img" aria-label="neu" />;
}

/**
 * Kachel eines Songs (song-overview-tiles, design.md D3): ganze Fläche klickbar,
 * der Knopf im Titel dient Tastatur und Bildschirmleser. `action` öffnet den Song nicht.
 * `shared`: das gemeinsame Workbook des Songs; nur dort erscheinen Autor und Punkt (song-activity).
 */
export function SongTile({ song, action, draggable = false, now, shared }: { song: Song; action?: ReactNode; draggable?: boolean; now: number; shared?: Workbook }) {
  const store = useStore();
  const source = useSongDragSource(song, shared?.id ?? 'mine');
  const activity = useActivity();
  const last = activity.lastChange(song.id);
  const author = shared && last?.author ? (shared.profiles?.[last.author]?.name ?? last.author) : null;
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
          {shared && activity.isNew(song.id) && <NewDot />}
          <button type="button" className="tile-open">
            {song.title}
          </button>
        </h4>
        <span className="tile-meta">
          {barsLabel(allBars(song).length)} · ♩ = {song.tempo}
        </span>
        {last && (
          <span className="tile-meta">
            {formatRelative(last.time, now)}
            {author && ` · ${author}`}
          </span>
        )}
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
  /** Kacheln lassen sich ziehen (copy-song, design.md D4, D5). */
  draggable?: boolean;
}) {
  const now = useMinute();
  const { placement, workbooks } = useNotebook();
  const sharedOf = (song: Song) => workbooks.find((w) => w.id === placement[song.id] && !w.personal);
  return (
    <div className="tiles">
      {sortedByTitle(songs, (s) => s.title).map((song) => (
        <SongTile key={song.id} song={song} action={action?.(song)} draggable={draggable} now={now} shared={sharedOf(song)} />
      ))}
      <AddSongTile onClick={onAdd} />
    </div>
  );
}
