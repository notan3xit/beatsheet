import { useCallback, useRef, useState } from 'react';
import type { Song } from '../domain/types';
import type { WorkbookActions } from '../sync/sync';
import { SongTiles, sortedByTitle } from './SongTile';
import { MoveIcon } from './icons';
import { useDismiss } from './useDismiss';
import { useNotebook, useStore } from './useLibrary';
import { useEmail, useSync } from './useWorkbooks';
import { SongDragProvider, useIsDropTarget } from './dragSong';
import { CopyButton, useSongTransfer } from './songTransfer';
import { useActivity } from './useActivity';
import { WorkbookArea } from './WorkbookArea';

function MoveMenu({ song }: { song: Song }) {
  const { workbooks } = useNotebook();
  const { move } = useSongTransfer();
  const [open, setOpen] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  useDismiss(open, area, useCallback(() => setOpen(false), []));
  return (
    <div className="card-members" ref={area}>
      <button
        type="button"
        className="icon-button tile-move"
        aria-label="Zu Workbook …"
        title="Zu Workbook …"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoveIcon />
      </button>
      {open && (
        <div role="menu" className="card-popover move-menu">
          {sortedByTitle(workbooks.filter((w) => !w.personal), (w) => w.title).map((workbook) => (
            <button
              key={workbook.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void move(song, workbook);
              }}
            >
              {workbook.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MySongs({ songs, sync }: { songs: readonly Song[]; sync: WorkbookActions | null }) {
  const store = useStore();
  const { workbooks } = useNotebook();
  const email = useEmail();
  const canMove = sync && email && workbooks.some((w) => !w.personal);
  const target = useIsDropTarget({ kind: 'mine' });
  const activity = useActivity();
  const personalId = workbooks.find((w) => w.personal)?.id;
  // Abgemeldet gibt es keinen eigenen Bestand und damit keine Positionen (song-order)
  const positions = sync && email && personalId ? activity.order(personalId) : null;

  return (
    <section aria-label="Meine Songs" className={`overview-section${target ? ' drop-target' : ''}`} data-drop-mine>
      <h2>Meine Songs</h2>
      <SongTiles
        songs={songs}
        action={(song) => (
          <>
            <CopyButton song={song} />
            {canMove && <MoveMenu song={song} />}
          </>
        )}
        draggable={Boolean(sync && email)}
        positions={positions}
        area={{ kind: 'mine' }}
        onAdd={() => store.openSong(store.createSong('').id)}
        onAddExample={songs.length === 0 ? () => store.openSong(store.createExampleSong().id) : undefined}
      />
    </section>
  );
}

/** Startseite: oben „Meine Songs“, darunter die Workbooks (song-overview-tiles, design.md D3, D4). */
export function SongList() {
  const { songs, workbooks, placement } = useNotebook();
  const sync = useSync();
  const personalId = workbooks.find((w) => w.personal)?.id;
  const mine = songs.filter((s) => !placement[s.id] || placement[s.id] === personalId);
  return (
    <main className="song-list" aria-label="Songs">
      {sync ? (
        <SongDragProvider>
          <MySongs songs={mine} sync={sync} />
          <WorkbookArea sync={sync} songs={songs} />
        </SongDragProvider>
      ) : (
        <MySongs songs={mine} sync={null} />
      )}
    </main>
  );
}
