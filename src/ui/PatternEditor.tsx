import { useEffect } from 'react';
import { patternMeter } from '../domain/meter';
import { resizeWouldRemoveHits } from '../domain/pattern';
import { MAX_LENGTH, MIN_LENGTH, type Pattern } from '../domain/types';
import { Breadcrumbs } from './Breadcrumbs';
import { useConfirm } from './ConfirmDialog';
import { EditableHeading } from './EditableHeading';
import { LockToggle } from './lock';
import { PatternMeter } from './meter';
import { NotationView } from './NotationView';
import { beatsLabel } from './patternStyle';
import { Transport, usePlayback } from './playback';
import { Sequencer } from './Sequencer';
import { TempoMark } from './TempoMark';
import { useNotebook, useOpenSong, useStore } from './useLibrary';

const LENGTHS = Array.from({ length: MAX_LENGTH - MIN_LENGTH + 1 }, (_, i) => i + MIN_LENGTH);

function NameHeading({ pattern, readOnly }: { pattern: Pattern; readOnly: boolean }) {
  const store = useStore();
  return <EditableHeading label="Name" value={pattern.name} readOnly={readOnly} onCommit={(draft) => store.rename(pattern.id, draft)} />;
}

const isTextInput = (target: EventTarget | null) =>
  target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);

function useUndoShortcuts(enabled: boolean) {
  const store = useStore();
  useEffect(() => {
    if (!enabled) return;
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
  }, [store, enabled]);
}

export function PatternEditor({ pattern }: { pattern: Pattern }) {
  const store = useStore();
  const { canUndo, canRedo, locked } = useNotebook();
  const confirm = useConfirm();
  const song = useOpenSong();
  const playback = usePlayback(pattern, song.tempo);
  useUndoShortcuts(!locked);

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
    <section className="editor" aria-label={locked ? 'Pattern ansehen' : 'Pattern bearbeiten'}>
      <header className="page-header">
        <Breadcrumbs />
      </header>
      <div className="editor-header">
        <NameHeading key={pattern.id} pattern={pattern} readOnly={locked} />
        {locked ? (
          <span className="value-control value-length">{beatsLabel(pattern.beats.length)}</span>
        ) : (
          <select
            className="value-control value-length"
            aria-label="Länge (Beats)"
            value={pattern.beats.length}
            onChange={(e) => void changeLength(Number(e.target.value))}
          >
            {LENGTHS.map((n) => (
              <option key={n} value={n}>
                {beatsLabel(n)}
              </option>
            ))}
          </select>
        )}
        <PatternMeter pattern={pattern} />
        <span className="kind-badge">{pattern.kind === 'groove' ? 'Groove' : 'Fill'}</span>
        <Transport playback={playback} />
        <span className="tempo-field">
          <TempoMark /> (Song-Tempo)
        </span>
        {!locked && (
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
        )}
        <LockToggle />
      </div>
      <div className="sequencer-scroll">
        <Sequencer pattern={pattern} playhead={playback.step} readOnly={locked} />
      </div>
      <NotationView pattern={pattern} meter={patternMeter(pattern, song)} />
    </section>
  );
}
