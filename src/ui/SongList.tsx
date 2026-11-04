import { useCallback, useRef, useState } from 'react';
import type { Song } from '../domain/types';
import type { WorkbookActions } from '../sync/sync';
import { SongTable, sortedByTitle } from './SongTable';
import { useDismiss } from './useDismiss';
import { useNotebook, useStore } from './useLibrary';
import { useEmail, useSync } from './useWorkbooks';
import { useReportedAction, WorkbookCard } from './WorkbookCard';

function MoveMenu({ song, sync, run }: { song: Song; sync: WorkbookActions; run: ReturnType<typeof useReportedAction> }) {
  const { workbooks } = useNotebook();
  const [open, setOpen] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  useDismiss(open, area, useCallback(() => setOpen(false), []));
  return (
    <div className="card-members" ref={area}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Zu Workbook …
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
  const [title, setTitle] = useState('');
  const run = useReportedAction();
  const canMove = sync && email && workbooks.some((w) => !w.personal);

  return (
    <section aria-label="Meine Songs" className="card">
      <h3>Meine Songs</h3>
      <form
        className="song-create"
        onSubmit={(e) => {
          e.preventDefault();
          store.createSong(title);
          setTitle('');
        }}
      >
        <label className="field">
          Titel des neuen Songs
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Neuer Song" />
        </label>
        <button type="submit" className="primary">
          Song anlegen
        </button>
      </form>
      {songs.length === 0 ? (
        <p className="hint">Noch keine Songs. Gib oben einen Titel ein und lege deinen ersten Song an.</p>
      ) : (
        <SongTable songs={songs} action={canMove ? (song) => <MoveMenu song={song} sync={sync} run={run} /> : undefined} />
      )}
    </section>
  );
}

function NewWorkbook({ sync }: { sync: WorkbookActions }) {
  const [title, setTitle] = useState('');
  const run = useReportedAction();
  return (
    <form
      className="song-create"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => sync.createWorkbook(title)).then((ok) => ok && setTitle(''));
      }}
    >
      <label className="field">
        Titel des neuen Workbooks
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Neues Workbook" />
      </label>
      <button type="submit">Neues Workbook</button>
    </form>
  );
}

/** Startseite: je Workbook eine Karte, danach „Meine Songs“ (workbook-sync, design.md D12). */
export function SongList() {
  const { songs, workbooks, placement } = useNotebook();
  const sync = useSync();
  const email = useEmail();
  const personalId = workbooks.find((w) => w.personal)?.id;
  return (
    <main className="song-list" aria-label="Songs">
      <h2 className="page-heading">Songs</h2>
      {sync && email && <NewWorkbook sync={sync} />}
      {sync &&
        sortedByTitle(workbooks.filter((w) => !w.personal), (w) => w.title).map((workbook) => (
          <WorkbookCard key={workbook.id} workbook={workbook} songs={songs.filter((s) => placement[s.id] === workbook.id)} sync={sync} />
        ))}
      <MySongs songs={songs.filter((s) => !placement[s.id] || placement[s.id] === personalId)} sync={sync} />
    </main>
  );
}
