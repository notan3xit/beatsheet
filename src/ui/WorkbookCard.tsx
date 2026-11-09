import { useCallback, useId, useRef, useState } from 'react';
import type { Song, Workbook } from '../domain/types';
import type { ActionResult, WorkbookActions } from '../sync/sync';
import { useConfirm } from './ConfirmDialog';
import { EditableHeading } from './EditableHeading';
import { useReport } from './messages';
import { useIsDropTarget } from './dragSong';
import { SongTiles } from './SongTile';
import { CopyButton } from './songTransfer';
import { useDismiss } from './useDismiss';
import { MemberAvatar } from './MemberAvatar';
import { useStore } from './useLibrary';
import { useEmail, syncMessage } from './useWorkbooks';

/** Aktion, deren Fehler im Stapel oben erscheint; `true` bei Erfolg. */
export function useReportedAction() {
  const report = useReport();
  return async (action: () => Promise<ActionResult>) => {
    const result = await action();
    if (result.ok) report();
    else report('alert', syncMessage(result.error));
    return result.ok;
  };
}

/** Aktion aus einem Formular: Der Fehler bleibt am Feld. */
function useActionError() {
  const [error, setError] = useState<string | null>(null);
  /** Führt die Aktion aus und zeigt ihren Fehler; `true` bei Erfolg. */
  const run = async (action: () => Promise<ActionResult>) => {
    const result = await action();
    setError(result.ok ? null : syncMessage(result.error));
    return result.ok;
  };
  return [error, run] as const;
}

function ActionError({ text }: { text: string | null }) {
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
  const membersHeading = useId();
  const addHeading = useId();

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
    <div role="dialog" aria-label={`Mitglieder von ${workbook.title}`} className="card-popover members-popover">
      <section aria-labelledby={membersHeading}>
        <h4 id={membersHeading}>Mitglieder</h4>
        <ul className="member-list">
          {workbook.members.map((member) => (
            <li key={member}>
              <span className="member-name">
                <MemberAvatar email={member} profile={workbook.profiles?.[member]} />
                {workbook.profiles?.[member] ? (
                  labelOf(workbook, member)
                ) : (
                  <span className="member-pending">
                    {member}
                    {/* Der Besitzer hat ein Konto, auch wenn sein Profil noch fehlt */}
                    {member !== workbook.owner && <small>noch nicht angemeldet</small>}
                  </span>
                )}
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
      </section>
      {isOwner && (
        <section aria-labelledby={addHeading}>
          <h4 id={addHeading}>Hinzufügen</h4>
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
        </section>
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

const labelOf = (workbook: Workbook, member: string) => workbook.profiles?.[member]?.name ?? member;

/** Das gewählte Workbook neben der Seitenleiste (song-overview-tiles, design.md D4). */
export function WorkbookCard({ workbook, songs, sync }: { workbook: Workbook; songs: readonly Song[]; sync: WorkbookActions }) {
  const store = useStore();
  const email = useEmail();
  const confirm = useConfirm();
  const [membersOpen, setMembersOpen] = useState(false);
  const membersArea = useRef<HTMLDivElement>(null);
  useDismiss(membersOpen, membersArea, useCallback(() => setMembersOpen(false), []));
  const run = useReportedAction();
  const isOwner = workbook.owner === email;
  const target = useIsDropTarget({ kind: 'workbook', id: workbook.id });

  const rename = (draft: string) => {
    const title = draft.trim();
    if (title && title !== workbook.title) void run(() => sync.renameWorkbook(workbook.id, title));
  };
  const remove = async () => {
    if (await confirm(`Workbook „${workbook.title}“ für alle Mitglieder löschen?`)) await run(() => sync.deleteWorkbook(workbook.id));
  };
  const addSong = async () => {
    let id: string | undefined;
    await run(async () => {
      const result = await sync.createSongIn(workbook.id);
      if (result.ok) id = result.id;
      return result;
    });
    // Der Abgleich kann den Song inzwischen entfernt haben
    if (id && store.getState().songs.some((s) => s.id === id)) store.openSong(id);
  };

  return (
    <section aria-label={workbook.title} className={`workbook-main${target ? ' drop-target' : ''}`} data-drop-workbook={workbook.id}>
      <div className="card-header">
        {isOwner ? (
          <EditableHeading level={3} label={`Titel von ${workbook.title}`} value={workbook.title} onCommit={rename} />
        ) : (
          <h3>{workbook.title}</h3>
        )}
        <div className="card-members" ref={membersArea}>
          <button
            type="button"
            className="avatars"
            aria-label="Mitglieder"
            title={workbook.members.map((member) => labelOf(workbook, member)).join(', ')}
            aria-expanded={membersOpen}
            onClick={() => setMembersOpen((open) => !open)}
          >
            {workbook.members.slice(0, 4).map((member) => (
              <MemberAvatar key={member} email={member} profile={workbook.profiles?.[member]} />
            ))}
            {workbook.members.length > 4 && (
              <span className="avatar" aria-hidden="true">
                +{workbook.members.length - 4}
              </span>
            )}
          </button>
          {membersOpen && <MembersPopover workbook={workbook} sync={sync} />}
        </div>
      </div>
      <SongTiles songs={songs} action={(song) => <CopyButton song={song} />} draggable onAdd={() => void addSong()} />
      {isOwner && songs.length === 0 && (
        <div className="card-actions">
          <button type="button" className="danger" onClick={() => void remove()}>
            Workbook löschen
          </button>
        </div>
      )}
    </section>
  );
}
