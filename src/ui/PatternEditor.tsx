import { useEffect } from 'react';
import { resizeWouldRemoveHits } from '../domain/pattern';
import { MAX_LENGTH, MIN_LENGTH, type Pattern } from '../domain/types';
import { Breadcrumbs } from './Breadcrumbs';
import { useConfirm } from './ConfirmDialog';
import { EditableHeading } from './EditableHeading';
import { NotationView } from './NotationView';
import { Sequencer } from './Sequencer';
import { useNotebook, useStore } from './useLibrary';

const LENGTHS = Array.from({ length: MAX_LENGTH - MIN_LENGTH + 1 }, (_, i) => i + MIN_LENGTH);

function NameHeading({ pattern }: { pattern: Pattern }) {
  const store = useStore();
  return <EditableHeading label="Name" value={pattern.name} onCommit={(draft) => store.rename(pattern.id, draft)} />;
}

const isTextInput = (target: EventTarget | null) =>
  target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);

function useUndoShortcuts() {
  const store = useStore();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || isTextInput(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) store.undo();
      else if (key === 'y' || (key === 'z' && e.shiftKey)) store.redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);
}

export function PatternEditor({ pattern }: { pattern: Pattern }) {
  const store = useStore();
  const { canUndo, canRedo } = useNotebook();
  const confirm = useConfirm();
  useUndoShortcuts();

  const changeLength = async (length: number) => {
    if (
      resizeWouldRemoveHits(pattern, length) &&
      !(await confirm(`Beim Kürzen auf ${length} Beats gehen Schläge verloren. Trotzdem kürzen?`))
    ) {
      return;
    }
    store.resize(pattern.id, length);
  };

  const remove = async () => {
    const used = store.usage(pattern.id);
    const message =
      used > 0
        ? `„${pattern.name}“ wird in ${used === 1 ? '1 Takt' : `${used} Takten`} verwendet. Diese Takte haben danach keinen ${pattern.kind === 'groove' ? 'Groove' : 'Fill'} mehr. Trotzdem löschen?`
        : `„${pattern.name}“ wirklich löschen?`;
    if (await confirm(message)) store.remove(pattern.id);
  };

  return (
    <section className="editor" aria-label="Pattern bearbeiten">
      <header className="page-header">
        <Breadcrumbs />
      </header>
      <div className="editor-header">
        <NameHeading key={pattern.id} pattern={pattern} />
        <label className="field">
          Länge (Beats)
          <select value={pattern.beats.length} onChange={(e) => void changeLength(Number(e.target.value))}>
            {LENGTHS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="kind-badge">{pattern.kind === 'groove' ? 'Groove' : 'Fill'}</span>
        <div className="editor-actions">
          <button type="button" disabled={!canUndo} onClick={() => store.undo()} title="Strg+Z">
            Rückgängig
          </button>
          <button type="button" disabled={!canRedo} onClick={() => store.redo()} title="Strg+Y">
            Wiederherstellen
          </button>
          <button type="button" onClick={() => store.duplicate(pattern.id)}>
            Duplizieren
          </button>
          <button type="button" className="danger" onClick={() => void remove()}>
            Löschen
          </button>
        </div>
      </div>
      <div className="sequencer-scroll">
        <Sequencer pattern={pattern} />
      </div>
      <NotationView pattern={pattern} />
    </section>
  );
}
