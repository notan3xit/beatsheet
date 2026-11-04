import { useEffect } from 'react';
import { allBars } from '../domain/songPatterns';
import { Breadcrumbs } from './Breadcrumbs';
import { useConfirm } from './ConfirmDialog';
import { DragProvider } from './dragPattern';
import { EditableHeading } from './EditableHeading';
import { useReport } from './messages';
import { PatternPage } from './PatternPage';
import { StructurePage } from './StructurePage';
import { NoAudioNote, usePlayer, useSongPlayback } from './playback';
import { TempoMark } from './TempoMark';
import { useNotebook, useOpenSong, useStore } from './useLibrary';
import { syncMessage, useSync } from './useWorkbooks';

/** Kopftaste: ganzen Song einmal abspielen; während jeder Song-Wiedergabe „Stopp“. */
function SongTransport() {
  const song = useOpenSong();
  const playback = useSongPlayback();
  const first = allBars(song)[0];
  return (
    <>
      <button
        type="button"
        className="primary play"
        disabled={!playback.available || (!playback.playing && !first)}
        onClick={() => (playback.playing ? playback.stop() : first && playback.start({ from: first.id, to: 'end' }, false))}
      >
        {playback.playing ? 'Stopp' : 'Song abspielen'}
      </button>
      {!playback.available && <NoAudioNote />}
    </>
  );
}

function SongHeader() {
  const store = useStore();
  const song = useOpenSong();
  const confirm = useConfirm();
  const sync = useSync();
  const { placement, workbooks } = useNotebook();
  const report = useReport();
  const workbook = workbooks.find((w) => w.id === placement[song.id]);

  const remove = async () => {
    const reach = workbook && !workbook.personal ? ` Der Song wird für alle Mitglieder von „${workbook.title}“ gelöscht.` : '';
    if (!(await confirm(`„${song.title}“ löschen?${reach} Alle Patterns und die Struktur des Songs werden mitgelöscht.`))) return;
    if (!sync || !placement[song.id]) return store.deleteSong(song.id);
    const result = await sync.deleteSong(song.id);
    if (!result.ok) report('alert', syncMessage(result.error));
  };

  return (
    <header className="page-header songbook-header">
      <Breadcrumbs />
      <div className="page-title">
        <EditableHeading key={song.id} label="Songtitel" value={song.title} onCommit={(draft) => store.renameSong(song.id, draft)} />
        <TempoMark />
        <SongTransport />
        <button type="button" className="danger" onClick={() => void remove()}>
          Song löschen
        </button>
      </div>
    </header>
  );
}

/** Doppelseite: links die Struktur, rechts die Patterns des Songs. */
export function Songbook() {
  const player = usePlayer();
  // Wer die Doppelseite verlässt, beendet die Song-Wiedergabe (song-playback, design.md D3)
  useEffect(() => () => player.stop(), [player]);
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
