import { useCallback, useRef, useState, useSyncExternalStore, type ChangeEvent, type ReactNode } from 'react';
import type { Sound } from '../audio/soundSetting';
import { newId } from '../domain/id';
import { exportFileName, parseNotebookFile, serializeNotebook } from '../persistence/fileFormat';
import { applyImport, planImport, type ImportEntry } from '../persistence/merge';
import { CHANGELOG } from './changelog';
import { ChangelogDialog } from './ChangelogDialog';
import { downloadFile } from './download';
import { CheckIcon, ExportIcon, ImportIcon, InfoIcon, MenuIcon, PersonIcon } from './icons';
import { ImportDialog } from './ImportDialog';
import { useSound } from './playback';
import { useReport } from './messages';
import { useDismiss } from './useDismiss';
import { useStore } from './useLibrary';
import { useThemeSetting } from './useTheme';
import type { ThemeChoice } from './theme';
import { useEmail } from './useWorkbooks';

type Pending = { plan: ImportEntry[]; fromNewerVersion: boolean };

/** Menü der Kopfzeile: Export und Import aller Songs, Anmelden bzw. Abmelden, Wahl von Farbschema und Klang, aktuelle Version. */
export function AppMenu({ onLogin, onLogout, loggingOut }: { onLogin: () => void; onLogout: () => void; loggingOut: boolean }) {
  const store = useStore();
  const report = useReport();
  const email = useEmail();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [changelogOpen, setChangelogOpen] = useState(false);
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
          <ThemeChoiceSection onChoose={() => setOpen(false)} />
          <hr />
          <SoundChoice onChoose={() => setOpen(false)} />
          <hr />
          <button type="button" role="menuitem" onClick={choose(() => setChangelogOpen(true))}>
            <InfoIcon />
            Version {CHANGELOG[0]!.version}
          </button>
        </div>
      )}
      {/* Außerhalb des aufklappbaren Teils: Die Dateiauswahl überdauert das Schließen des Menüs. */}
      <input ref={fileInput} type="file" accept=".json,application/json" aria-label="Importieren" hidden onChange={(e) => void importLibrary(e)} />
      {changelogOpen && <ChangelogDialog entries={CHANGELOG} onClose={() => setChangelogOpen(false)} />}
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

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/** Abschnitt mit Überschrift und genau einer gewählten Option; Wählen schließt das Menü (theme-choice, design.md D4). */
function MenuChoice<T extends string>({
  id,
  heading,
  options,
  chosen,
  onChoose,
  children,
}: {
  id: string;
  heading: string;
  options: ChoiceOption<T>[];
  chosen: T;
  onChoose: (value: T) => void;
  children?: ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={id} className="app-menu-choice">
      <span id={id} className="app-menu-heading">
        {heading}
      </span>
      {options.map(({ value, label, hint }) => (
        <button key={value} type="button" role="menuitemradio" aria-checked={chosen === value} onClick={() => onChoose(value)}>
          <span className="app-menu-check" aria-hidden="true">
            {chosen === value ? <CheckIcon /> : null}
          </span>
          <span>
            {label}
            {hint && <span className="app-menu-hint">{hint}</span>}
          </span>
        </button>
      ))}
      {children}
    </div>
  );
}

const THEMES: ChoiceOption<ThemeChoice>[] = [
  { value: 'system', label: 'Wie System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
];

/** Abschnitt „Farbschema“ (color-theme). */
function ThemeChoiceSection({ onChoose }: { onChoose: () => void }) {
  const setting = useThemeSetting();
  const chosen = useSyncExternalStore(setting.subscribe, setting.get);
  return (
    <MenuChoice
      id="app-menu-theme"
      heading="Farbschema"
      options={THEMES}
      chosen={chosen}
      onChoose={(value) => {
        onChoose();
        setting.set(value);
      }}
    />
  );
}

/** Abschnitt „Klang“: Wahl zwischen Aufnahmen und Synth, Hinweis und Namensnennung (drum-samples, design.md D7). */
function SoundChoice({ onChoose }: { onChoose: () => void }) {
  const { setting, loader } = useSound();
  const chosen = useSyncExternalStore(setting.subscribe, setting.get);
  const loaderState = useSyncExternalStore(loader.subscribe, loader.state);
  const sounds: ChoiceOption<Sound>[] = [
    { value: 'drs', label: 'DRSKit', hint: loaderState === 'unavailable' ? 'auf diesem Gerät nicht verfügbar' : undefined },
    { value: 'synth', label: 'Synth' },
  ];
  return (
    <MenuChoice
      id="app-menu-sound"
      heading="Klang"
      options={sounds}
      chosen={chosen}
      onChoose={(value) => {
        onChoose();
        setting.set(value);
      }}
    >
      <p className="app-menu-credit">
        <a href="https://drumgizmo.org/wiki/doku.php?id=kits:drskit" target="_blank" rel="noopener">
          DRSKit von DrumGizmo.org
        </a>
        {', '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">
          CC BY 4.0
        </a>
      </p>
    </MenuChoice>
  );
}
