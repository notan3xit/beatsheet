import { useEffect, useState } from 'react';
import { resizeWouldRemoveHits } from '../domain/pattern';
import { MAX_LENGTH, MIN_LENGTH, type Pattern } from '../domain/types';
import { useConfirm } from './ConfirmDialog';
import { NotationView } from './NotationView';
import { Sequencer } from './Sequencer';
import { useLibrary, useStore } from './useLibrary';

const LENGTHS = Array.from({ length: MAX_LENGTH - MIN_LENGTH + 1 }, (_, i) => i + MIN_LENGTH);

function NameField({ pattern }: { pattern: Pattern }) {
  const store = useStore();
  const [draft, setDraft] = useState(pattern.name);

  const commit = () => {
    store.rename(pattern.id, draft);
    setDraft(store.getState().patterns.find((p) => p.id === pattern.id)?.name ?? pattern.name);
  };

  return (
    <label className="field">
      Name
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </label>
  );
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
  const { canUndo, canRedo } = useLibrary();
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
    if (await confirm(`„${pattern.name}“ wirklich löschen?`)) store.remove(pattern.id);
  };

  return (
    <section className="editor" aria-label="Pattern bearbeiten">
      <div className="editor-header">
        <NameField key={pattern.id} pattern={pattern} />
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
