import { Breadcrumbs } from './Breadcrumbs';
import { useConfirm } from './ConfirmDialog';
import { DragProvider } from './dragPattern';
import { EditableHeading } from './EditableHeading';
import { PatternPage } from './PatternPage';
import { StructurePage } from './StructurePage';
import { TempoMark } from './TempoMark';
import { useOpenSong, useStore } from './useLibrary';

function SongHeader() {
  const store = useStore();
  const song = useOpenSong();
  const confirm = useConfirm();

  const remove = async () => {
    if (await confirm(`„${song.title}“ löschen? Alle Patterns und die Struktur des Songs werden mitgelöscht.`)) {
      store.deleteSong(song.id);
    }
  };

  return (
    <header className="page-header songbook-header">
      <Breadcrumbs />
      <div className="page-title">
        <EditableHeading key={song.id} label="Songtitel" value={song.title} onCommit={(draft) => store.renameSong(song.id, draft)} />
        <TempoMark />
        <button type="button" className="danger" onClick={() => void remove()}>
          Song löschen
        </button>
      </div>
    </header>
  );
}

/** Doppelseite: links die Struktur, rechts die Patterns des Songs. */
export function Songbook() {
  return (
    <main className="songbook" aria-label="Song">
      <SongHeader />
      <DragProvider>
        <div className="pages">
          <StructurePage />
          <PatternPage />
        </div>
      </DragProvider>
    </main>
  );
}
