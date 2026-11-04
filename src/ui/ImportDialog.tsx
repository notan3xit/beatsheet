import { useId, useState, type KeyboardEvent } from 'react';
import type { Song } from '../domain/types';
import type { ExistingEntry, ImportEntry } from '../persistence/merge';

interface Props {
  plan: ImportEntry[];
  fromNewerVersion: boolean;
  /** Titel des Workbooks, zu dem ein Song gehört. */
  workbookTitleOf: (songId: string) => string | undefined;
  onCancel: () => void;
  onConfirm: (plan: ImportEntry[]) => void;
}

const NEW_OPTIONS = [
  ['add', 'Hinzufügen'],
  ['skip', 'Überspringen'],
] as const;

const EXISTING_OPTIONS = [
  ['replace', 'Ersetzen'],
  ['copy', 'Als Kopie'],
  ['skip', 'Überspringen'],
] as const;

const BULK = [
  ['replace', 'Alle ersetzen'],
  ['copy', 'Alle als Kopie'],
  ['skip', 'Alle überspringen'],
] as const;

const describe = (song: Song) =>
  `Revision ${song.revision}, ${new Date(song.updatedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}`;

/** Auswahl vor jeder Übernahme einer Importdatei (design.md D3). */
export function ImportDialog({ plan: initial, fromNewerVersion, workbookTitleOf, onCancel, onConfirm }: Props) {
  const [plan, setPlan] = useState(initial);
  const titleId = useId();
  const name = useId();
  const existing = plan.some((e) => e.kind === 'existing');

  const choose = (index: number, choice: ImportEntry['choice']) =>
    setPlan((current) => current.map((e, i) => (i === index ? ({ ...e, choice } as ImportEntry) : e)));
  const chooseAll = (choice: ExistingEntry['choice']) =>
    setPlan((current) => current.map((e) => (e.kind === 'existing' ? { ...e, choice } : e)));

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="dialog import-dialog" onKeyDown={onKeyDown}>
        <h2 id={titleId}>Songs importieren</h2>
        {fromNewerVersion && (
          <p className="import-warning">
            Die Datei stammt aus einer neueren Version. Inhalte können fehlen oder abweichen; vorhandene Songs werden
            deshalb zunächst als Kopie übernommen.
          </p>
        )}
        <div className="import-list">
          {plan.map((entry, index) => {
            const options = entry.kind === 'new' ? NEW_OPTIONS : EXISTING_OPTIONS;
            const sharedIn = entry.choice === 'replace' ? workbookTitleOf(entry.song.id) : undefined;
            return (
              <fieldset key={`${entry.song.id}-${index}`} className="import-entry">
                <legend>{entry.song.title}</legend>
                <p className="import-info">
                  {entry.kind === 'new' ? (
                    'Neu'
                  ) : (
                    <>
                      <strong>{entry.newer === 'file' ? 'Datei neuer' : 'Lokal neuer'}</strong>
                      {` · Datei: ${describe(entry.song)} · Lokal: ${describe(entry.existing)}`}
                    </>
                  )}
                </p>
                <div className="import-options">
                  {options.map(([value, label]) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name={`${name}-${index}`}
                        value={value}
                        checked={entry.choice === value}
                        onChange={() => choose(index, value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {sharedIn && <p className="import-warning">„Ersetzen“ betrifft alle Mitglieder von „{sharedIn}“.</p>}
              </fieldset>
            );
          })}
        </div>
        {existing && (
          <div className="import-bulk">
            {BULK.map(([value, label]) => (
              <button key={value} type="button" onClick={() => chooseAll(value)}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="dialog-actions">
          <button type="button" onClick={onCancel}>
            Abbrechen
          </button>
          <button type="button" className="primary" autoFocus onClick={() => onConfirm(plan)}>
            Importieren
          </button>
        </div>
      </div>
    </div>
  );
}
