import { useCallback, useRef, useState } from 'react';
import type { Song, Workbook } from '../domain/types';
import type { ActionResult, WorkbookActions } from '../sync/sync';
import { useConfirm } from './ConfirmDialog';
import { EditableHeading } from './EditableHeading';
import { SongTable } from './SongTable';
import { useDismiss } from './useDismiss';
import { useEmail, syncMessage } from './useWorkbooks';

export function useActionError() {
  const [error, setError] = useState<string | null>(null);
  /** Führt die Aktion aus und zeigt ihren Fehler; `true` bei Erfolg. */
  const run = async (action: () => Promise<ActionResult>) => {
    const result = await action();
    setError(result.ok ? null : syncMessage(result.error));
    return result.ok;
  };
  return [error, run] as const;
}

export function ActionError({ text }: { text: string | null }) {
  return text ? (
    <p role="alert" className="message alert">
      {text}
    </p>
  ) : null;
}

function MembersPopover({ workbook, sync }: { workbook: Workbook; sync: WorkbookActions }) {
  const email = useEmail();
  const confirm = useConfirm();
  const [input, setInput] = useState('');
  const [error, run] = useActionError();
  const isOwner = workbook.owner === email;

  const invite = async () => {
    if (await run(() => sync.invite(workbook.id, input))) setInput('');
  };
  const removeMember = async (member: string) => {
    if (await confirm(`${member} aus „${workbook.title}“ entfernen? Die Person behält die Songs als eigene Kopien.`)) {
      await run(() => sync.removeMember(workbook.id, member));
    }
  };
  const leave = async () => {
    if (await confirm(`„${workbook.title}“ verlassen? Die Songs bleiben dir unter „Meine Songs“ erhalten.`)) {
      await run(() => sync.removeMember(workbook.id, email!));
    }
  };

  return (
    <div role="dialog" aria-label={`Mitglieder von ${workbook.title}`} className="card-popover">
      <ul className="member-list">
        {workbook.members.map((member) => (
          <li key={member}>
            <span>
              {member}
              {member === workbook.owner && ' (Besitzer)'}
            </span>
            {isOwner && member !== workbook.owner && (
              <button type="button" aria-label={`${member} entfernen`} onClick={() => void removeMember(member)}>
                Entfernen
              </button>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <form
          className="member-invite"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void invite();
          }}
        >
          <label className="field">
            Mail-Adresse
            <input type="email" value={input} onChange={(e) => setInput(e.target.value)} />
          </label>
          <button type="submit" className="primary">
            Einladen
          </button>
        </form>
      )}
      {email && !isOwner && (
        <button type="button" onClick={() => void leave()}>
          Workbook verlassen
        </button>
      )}
      <ActionError text={error} />
    </div>
  );
}

/** Karte eines Workbooks auf der Startseite (workbook-sync, design.md D12). */
export function WorkbookCard({ workbook, songs, sync }: { workbook: Workbook; songs: readonly Song[]; sync: WorkbookActions }) {
  const email = useEmail();
  const confirm = useConfirm();
  const [membersOpen, setMembersOpen] = useState(false);
  const membersArea = useRef<HTMLDivElement>(null);
  useDismiss(membersOpen, membersArea, useCallback(() => setMembersOpen(false), []));
  const [error, run] = useActionError();
  const isOwner = workbook.owner === email;

  const rename = (draft: string) => {
    const title = draft.trim();
    if (title && title !== workbook.title) void run(() => sync.renameWorkbook(workbook.id, title));
  };
  const remove = async () => {
    if (await confirm(`Workbook „${workbook.title}“ für alle Mitglieder löschen?`)) await run(() => sync.deleteWorkbook(workbook.id));
  };

  return (
    <section aria-label={workbook.title} className="card">
      <div className="card-header">
        {isOwner ? (
          <EditableHeading level={3} label={`Titel von ${workbook.title}`} value={workbook.title} onCommit={rename} />
        ) : (
          <h3>{workbook.title}</h3>
        )}
        <div className="card-members" ref={membersArea}>
          <button type="button" aria-expanded={membersOpen} onClick={() => setMembersOpen((open) => !open)}>
            Mitglieder
          </button>
          {membersOpen && <MembersPopover workbook={workbook} sync={sync} />}
        </div>
      </div>
      <p className="hint">{workbook.members.join(', ')}</p>
      {songs.length > 0 && <SongTable songs={songs} />}
      <div className="card-actions">
        <button type="button" onClick={() => void run(() => sync.createSongIn(workbook.id))}>
          Song anlegen
        </button>
        {isOwner && songs.length === 0 && (
          <button type="button" className="danger" onClick={() => void remove()}>
            Workbook löschen
          </button>
        )}
      </div>
      <ActionError text={error} />
    </section>
  );
}
