import { openSongOf } from '../state/notebookStore';
import { CommitField } from './CommitField';
import { useConfirm } from './ConfirmDialog';
import { DragProvider } from './dragPattern';
import { PatternPage } from './PatternPage';
import { StructurePage } from './StructurePage';
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
    <div className="songbook-header">
      <button type="button" className="back" onClick={() => store.backToList()}>
        Alle Songs
      </button>
      <CommitField
        key={song.id}
        label="Songtitel"
        value={song.title}
        onCommit={(draft) => {
          store.renameSong(song.id, draft);
          return openSongOf(store.getState())?.title ?? song.title;
        }}
      />
      <button type="button" className="danger" onClick={() => void remove()}>
        Song löschen
      </button>
    </div>
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
