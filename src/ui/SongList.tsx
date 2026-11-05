import { useCallback, useRef, useState } from 'react';
import type { Song } from '../domain/types';
import type { WorkbookActions } from '../sync/sync';
import { SongTiles, sortedByTitle } from './SongTile';
import { MoveIcon } from './icons';
import { useDismiss } from './useDismiss';
import { useNotebook, useStore } from './useLibrary';
import { useEmail, useSync } from './useWorkbooks';
import { SongDragProvider } from './dragSong';
import { WorkbookArea } from './WorkbookArea';
import { useReportedAction } from './WorkbookCard';

function MoveMenu({ song, sync, run }: { song: Song; sync: WorkbookActions; run: ReturnType<typeof useReportedAction> }) {
  const { workbooks } = useNotebook();
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
                void run(() => sync.moveSong(song.id, workbook.id));
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
  const run = useReportedAction();
  const canMove = sync && email && workbooks.some((w) => !w.personal);

  return (
    <section aria-label="Meine Songs" className="overview-section">
      <h2>Meine Songs</h2>
      {songs.length === 0 && <p className="hint">Noch keine Songs. Lege mit „+ Song“ deinen ersten an.</p>}
      <SongTiles
        songs={songs}
        action={canMove ? (song) => <MoveMenu song={song} sync={sync} run={run} /> : undefined}
        draggable={Boolean(canMove)}
        onAdd={() => store.openSong(store.createSong('').id)}
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
        <SongDragProvider sync={sync}>
          <MySongs songs={mine} sync={sync} />
          <WorkbookArea sync={sync} songs={songs} />
        </SongDragProvider>
      ) : (
        <MySongs songs={mine} sync={null} />
      )}
    </main>
  );
}
