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
import { StructurePage } from './StructurePage';
import { StructureToggle } from './StructureToggle';
import { HistoryButton } from './HistoryButton';
import { Transport, usePlayer, useSongPlayback } from './playback';
import { PracticeControl } from './PracticeControl';
import { MeterMark } from './meter';
import { TempoMark } from './TempoMark';
import { useNotebook, useOpenSong, useStore } from './useLibrary';
import { selectionBounds, useStructureSelection, type StructureSelectionState } from './useStructureSelection';
import { syncMessage, useSync } from './useWorkbooks';

/**
 * Kopftasten: ganzen Song einmal oder in Schleife abspielen, mit Auswahl ab ihr bzw. die Auswahl in Schleife
 * wie im Popover; zeigen den Modus jeder Song-Wiedergabe.
 */
function SongTransport({ selectionState }: { selectionState: StructureSelectionState }) {
  const song = useOpenSong();
  const playback = useSongPlayback();
  const first = allBars(song)[0];
  const selected = playback.playing ? null : selectionBounds(song, selectionState.selection);
  const start = (loop: boolean) => {
    if (selected) {
      playback.start({ from: selected.first, to: loop ? selected.last : 'end' }, loop);
      selectionState.closePopover();
    } else if (first) {
      playback.start({ from: first.id, to: 'end' }, loop);
    }
  };
  return (
    <span className="song-transport" data-keeps-selection="">
      <Transport
        once={selected ? 'Ab Auswahl abspielen' : 'Song abspielen'}
        loop={selected ? 'Auswahl in Schleife abspielen' : 'Song in Schleife abspielen'}
        canStart={first !== undefined}
        onStart={start}
      />
      <PracticeControl />
    </span>
  );
}

function SongHeader({ selectionState }: { selectionState: StructureSelectionState }) {
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
        <SongTransport selectionState={selectionState} />
        <div className="header-end">
          {!locked && (
            <button type="button" className="danger" onClick={() => void remove()}>
              Song löschen
            </button>
          )}
          <HistoryButton />
          <StructureToggle />
          <LockToggle />
        </div>
      </div>
    </header>
  );
}

const NO_PATTERNS: ReadonlySet<string> = new Set();

/** Die beiden Seiten teilen sich die Auswahl: Rechts sind die Patterns der ausgewählten Takte hervorgehoben. */
function Pages({ selectionState }: { selectionState: StructureSelectionState }) {
  const song = useOpenSong();
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
  const song = useOpenSong();
  const selectionState = useStructureSelection(song);
  return (
    <main className="songbook" aria-label="Song" {...guard}>
      <SongHeader selectionState={selectionState} />
      <DragProvider>
        <Pages selectionState={selectionState} />
      </DragProvider>
    </main>
  );
}
