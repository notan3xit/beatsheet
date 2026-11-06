import { useEffect } from 'react';
import { allBars } from '../domain/songPatterns';
import { selectedPatterns } from '../songbook/layout';
import { Breadcrumbs } from './Breadcrumbs';
import { useConfirm } from './ConfirmDialog';
import { DragProvider } from './dragPattern';
import { EditableHeading } from './EditableHeading';
import { LockToggle, useLockGuard } from './lock';
import { useReport } from './messages';
import { PatternPage } from './PatternPage';
import { PlayButton } from './PlayButton';
import { StructurePage } from './StructurePage';
import { NoAudioNote, usePlayer, useSongPlayback } from './playback';
import { MeterMark } from './meter';
import { TempoMark } from './TempoMark';
import { useNotebook, useOpenSong, useStore } from './useLibrary';
import { useStructureSelection } from './useStructureSelection';
import { syncMessage, useSync } from './useWorkbooks';

/** Kopftaste: ganzen Song einmal abspielen; während jeder Song-Wiedergabe „Stopp“. */
function SongTransport() {
  const song = useOpenSong();
  const playback = useSongPlayback();
  const first = allBars(song)[0];
  return (
    <>
      <PlayButton
        symbol={playback.playing ? 'stop' : 'play'}
        label={playback.playing ? 'Stopp' : 'Song abspielen'}
        disabled={!playback.available || (!playback.playing && !first)}
        onClick={() => (playback.playing ? playback.stop() : first && playback.start({ from: first.id, to: 'end' }, false))}
      />
      {!playback.available && <NoAudioNote />}
    </>
  );
}

function SongHeader() {
  const store = useStore();
  const song = useOpenSong();
  const confirm = useConfirm();
  const sync = useSync();
  const { placement, workbooks, locked } = useNotebook();
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
        <EditableHeading key={song.id} label="Songtitel" value={song.title} readOnly={locked} onCommit={(draft) => store.renameSong(song.id, draft)} />
        <TempoMark />
        <MeterMark />
        <SongTransport />
        {!locked && (
          <button type="button" className="danger" onClick={() => void remove()}>
            Song löschen
          </button>
        )}
        <LockToggle />
      </div>
    </header>
  );
}

const NO_PATTERNS: ReadonlySet<string> = new Set();

/** Die beiden Seiten teilen sich die Auswahl: Rechts sind die Patterns der ausgewählten Takte hervorgehoben. */
function Pages() {
  const song = useOpenSong();
  const selectionState = useStructureSelection(song);
  const { selection } = selectionState;
  return (
    <div className="pages">
      <StructurePage selectionState={selectionState} />
      <PatternPage highlighted={selection.kind === 'bars' ? selectedPatterns(song, selection.barIds).patternIds : NO_PATTERNS} />
    </div>
  );
}

/** Doppelseite: links die Struktur, rechts die Patterns des Songs. */
export function Songbook() {
  const player = usePlayer();
  // Wer die Doppelseite verlässt, beendet die Song-Wiedergabe (song-playback, design.md D3)
  useEffect(() => () => player.stop(), [player]);
  const guard = useLockGuard();
  return (
    <main className="songbook" aria-label="Song" {...guard}>
      <SongHeader />
      <DragProvider>
        <Pages />
      </DragProvider>
    </main>
  );
}
