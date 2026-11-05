import { useCallback, useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react';
import type { Sound } from '../audio/soundSetting';
import { newId } from '../domain/id';
import { exportFileName, parseNotebookFile, serializeNotebook } from '../persistence/fileFormat';
import { applyImport, planImport, type ImportEntry } from '../persistence/merge';
import { downloadFile } from './download';
import { CheckIcon, ExportIcon, ImportIcon, MenuIcon, PersonIcon } from './icons';
import { ImportDialog } from './ImportDialog';
import { useSound } from './playback';
import { useReport } from './messages';
import { useDismiss } from './useDismiss';
import { useStore } from './useLibrary';
import { useEmail } from './useWorkbooks';

type Pending = { plan: ImportEntry[]; fromNewerVersion: boolean };

/** Menü der Kopfzeile: Export und Import aller Songs, Anmelden bzw. Abmelden, Wahl des Klangs. */
export function AppMenu({ onLogin, onLogout, loggingOut }: { onLogin: () => void; onLogout: () => void; loggingOut: boolean }) {
  const store = useStore();
  const report = useReport();
  const email = useEmail();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useDismiss(open, area, useCallback(() => setOpen(false), []));

  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const workbookTitleOf = (songId: string) => {
    const { placement, workbooks } = store.getState();
    return workbooks.find((w) => w.id === placement[songId] && !w.personal)?.title;
  };

  const exportLibrary = () => {
    const now = new Date();
    downloadFile(exportFileName(now), serializeNotebook(store.getState().songs, now));
  };

  const importLibrary = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const parsed = parseNotebookFile(await file.text());
    if (!parsed.ok) {
      report('alert', `Import fehlgeschlagen: ${parsed.error}`);
      return;
    }
    report();
    const { fromNewerVersion } = parsed;
    setPending({ plan: planImport(store.getState().songs, parsed.songs, { fromNewerVersion }), fromNewerVersion });
  };

  const confirmImport = (plan: ImportEntry[]) => {
    setPending(null);
    const { songs, summary } = applyImport(plan, { now: () => new Date(), newId });
    store.importSongs(songs);
    report('status', `Import abgeschlossen (Songs): ${summary.added} hinzugefügt, ${summary.replaced} ersetzt, ${summary.copied} als Kopie, ${summary.skipped} übersprungen.`);
  };

  return (
    <div className="app-menu-area" ref={area}>
      <button
        type="button"
        className="icon-button"
        aria-label="Menü"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Menü"
        onClick={() => setOpen((v) => !v)}
      >
        <MenuIcon />
      </button>
      {open && (
        <div role="menu" aria-label="Menü" className="app-menu">
          <button type="button" role="menuitem" onClick={choose(exportLibrary)}>
            <ExportIcon />
            Exportieren
          </button>
          <button type="button" role="menuitem" onClick={choose(() => fileInput.current?.click())}>
            <ImportIcon />
            Importieren
          </button>
          <hr />
          {email ? (
            <button type="button" role="menuitem" disabled={loggingOut} onClick={choose(onLogout)}>
              <PersonIcon />
              Abmelden
            </button>
          ) : (
            <button type="button" role="menuitem" onClick={choose(onLogin)}>
              <PersonIcon />
              Anmelden
            </button>
          )}
          <hr />
          <SoundChoice onChoose={() => setOpen(false)} />
        </div>
      )}
      {/* Außerhalb des aufklappbaren Teils: Die Dateiauswahl überdauert das Schließen des Menüs. */}
      <input ref={fileInput} type="file" accept=".json,application/json" aria-label="Importieren" hidden onChange={(e) => void importLibrary(e)} />
      {pending && (
        <ImportDialog
          plan={pending.plan}
          fromNewerVersion={pending.fromNewerVersion}
          workbookTitleOf={workbookTitleOf}
          onCancel={() => setPending(null)}
          onConfirm={confirmImport}
        />
      )}
    </div>
  );
}

const SOUNDS: { value: Sound; label: string }[] = [
  { value: 'drs', label: 'DRSKit' },
  { value: 'synth', label: 'Synth' },
];

/** Abschnitt „Klang“: Wahl zwischen Aufnahmen und Synth, Hinweis und Namensnennung (drum-samples, design.md D7). */
function SoundChoice({ onChoose }: { onChoose: () => void }) {
  const { setting, loader } = useSound();
  const chosen = useSyncExternalStore(setting.subscribe, setting.get);
  const loaderState = useSyncExternalStore(loader.subscribe, loader.state);
  return (
    <div role="group" aria-labelledby="app-menu-sound" className="app-menu-sound">
      <span id="app-menu-sound" className="app-menu-heading">
        Klang
      </span>
      {SOUNDS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="menuitemradio"
          aria-checked={chosen === value}
          onClick={() => {
            onChoose();
            setting.set(value);
          }}
        >
          <span className="app-menu-check" aria-hidden="true">
            {chosen === value ? <CheckIcon /> : null}
          </span>
          <span>
            {label}
            {value === 'drs' && loaderState === 'unavailable' && <span className="app-menu-hint">auf diesem Gerät nicht verfügbar</span>}
          </span>
        </button>
      ))}
      <p className="app-menu-credit">
        <a href="https://drumgizmo.org/wiki/doku.php?id=kits:drskit" target="_blank" rel="noopener">
          DRSKit von DrumGizmo.org
        </a>
        {', '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">
          CC BY 4.0
        </a>
      </p>
    </div>
  );
}
