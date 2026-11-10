import type { ReactNode } from 'react';
import { ordered, type Positions } from '../domain/songOrder';
import { allBars } from '../domain/songPatterns';
import type { Song, Workbook } from '../domain/types';
import { useDropSlot, useSongDragSource, type DropArea } from './dragSong';
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
 * `marked`: Die Einfügemarke steht vor der Kachel (sort-songs, design.md D7).
 */
export function SongTile({
  song,
  action,
  draggable = false,
  now,
  shared,
  marked = false,
}: {
  song: Song;
  action?: ReactNode;
  draggable?: boolean;
  now: number;
  shared?: Workbook;
  marked?: boolean;
}) {
  const store = useStore();
  const source = useSongDragSource(song, shared?.id ?? 'mine');
  const activity = useActivity();
  const last = activity.lastChange(song.id);
  const author = shared && last?.author ? (shared.profiles?.[last.author]?.name ?? last.author) : null;
  return (
    <article
      className={`tile${source.dragging ? ' dragging' : ''}${marked ? ' drop-before' : ''}`}
      data-song-id={song.id}
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

/** Kachel, die einen Song anlegt. */
export function AddSongTile({ onClick, marked = false, children = '+ Song' }: { onClick: () => void; marked?: boolean; children?: ReactNode }) {
  return (
    <button type="button" className={`tile tile-add${marked ? ' drop-before' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * Kacheln eines Bereichs nach `song-order`, gefolgt von „+ Song“; ohne Positionen alphabetisch.
 * `onAddExample`: davor die Kachel „+ Beispiel-Song“ (example-song, design.md D3).
 */
export function SongTiles({
  songs,
  action,
  onAdd,
  onAddExample,
  draggable = false,
  positions = null,
  area,
}: {
  songs: readonly Song[];
  action?: (song: Song) => ReactNode;
  onAdd: () => void;
  onAddExample?: () => void;
  /** Kacheln lassen sich ziehen (copy-song, design.md D4, D5). */
  draggable?: boolean;
  /** Positionen des Bereichs (sort-songs, design.md D9). */
  positions?: Positions | null;
  /** Bereich als Ziel des Ziehens, für die Einfügemarke. */
  area?: DropArea;
}) {
  const now = useMinute();
  const { placement, workbooks } = useNotebook();
  const sharedOf = (song: Song) => workbooks.find((w) => w.id === placement[song.id] && !w.personal);
  const slot = useDropSlot(area);
  const shown = ordered(songs, positions);
  return (
    <div className="tiles">
      {shown.map((song, index) => (
        <SongTile key={song.id} song={song} action={action?.(song)} draggable={draggable} now={now} shared={sharedOf(song)} marked={slot === index} />
      ))}
      {onAddExample && <AddSongTile onClick={onAddExample}>+ Beispiel-Song</AddSongTile>}
      <AddSongTile onClick={onAdd} marked={slot === shown.length} />
    </div>
  );
}
