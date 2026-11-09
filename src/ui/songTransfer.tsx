import type { Song, Workbook } from '../domain/types';
import { Consequences, useConfirm } from './ConfirmDialog';
import { CopyIcon } from './icons';
import { useNotebook, useStore } from './useLibrary';
import { useSync } from './useWorkbooks';
import { useReportedAction } from './WorkbookCard';

/** Kopieren und Verschieben von Songs, jeweils erst nach Rückfrage (copy-song, design.md D2); liefern ihr Ergebnis (sort-songs, design.md D8). */
export function useSongTransfer() {
  const store = useStore();
  const confirm = useConfirm();
  const { workbooks, placement } = useNotebook();
  const sync = useSync();
  const run = useReportedAction();

  /** Die Kopie; `null`, wenn abgebrochen. */
  const copy = async (song: Song): Promise<Song | null> => {
    const workbook = workbooks.find((w) => w.id === placement[song.id] && !w.personal);
    const ok = await confirm(
      workbook
        ? {
            title: `„${song.title}“ nach „Meine Songs“ kopieren?`,
            content: (
              <Consequences
                items={[
                  'Die Kopie ist zunächst privat und lässt sich durch Aufnahme in ein Workbook wieder teilen.',
                  `Der Song in „${workbook.title}“ bleibt unverändert.`,
                  'Die Kopie beginnt ohne Verlauf.',
                ]}
              />
            ),
            confirmLabel: 'Kopieren',
          }
        : {
            title: `„${song.title}“ kopieren?`,
            content: <Consequences items={['Die Kopie liegt in „Meine Songs“.', 'Das Original bleibt unverändert.', 'Die Kopie beginnt ohne Verlauf.']} />,
            confirmLabel: 'Kopieren',
          },
    );
    return ok ? store.copySong(song.id) : null;
  };

  /** Nur angemeldet, mit Abgleich; `true`, wenn der Song verschoben ist. */
  const move = async (song: Song, workbook: Workbook): Promise<boolean> => {
    if (!sync) return false;
    const ok = await confirm({
      title: `„${song.title}“ nach „${workbook.title}“ verschieben?`,
      content: (
        <Consequences
          items={[
            'Der Song wird ins Workbook verschoben. Zurück nach „Meine Songs“ geht nur als Kopie.',
            'Der Song wird mit den Mitgliedern des Workbooks geteilt.',
            'Der Verlauf wird ins Workbook übernommen.',
          ]}
        />
      ),
      confirmLabel: 'Verschieben',
    });
    return ok && (await run(() => sync.moveSong(song.id, workbook.id)));
  };

  return { copy, move };
}

/** Symbol „Kopieren“ an einer Song-Kachel (copy-song, design.md D3). */
export function CopyButton({ song }: { song: Song }) {
  const { copy } = useSongTransfer();
  return (
    <button type="button" className="icon-button tile-copy" aria-label="Kopieren" title="Kopieren" onClick={() => void copy(song)}>
      <CopyIcon />
    </button>
  );
}
