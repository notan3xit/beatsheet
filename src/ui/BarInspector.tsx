import { useState } from 'react';
import { ValidationError } from '../domain/pattern';
import { allBars } from '../domain/songPatterns';
import {
  addAccent,
  addPlaceholder,
  appendBar,
  deleteBar,
  insertBarAfter,
  removeAccent,
  setBarProps,
  type BarProps,
} from '../domain/structure';
import { INSTRUMENT_LABELS, INSTRUMENTS, MAX_LENGTH, type Accent, type Instrument, type Song } from '../domain/types';
import { beatsLabel } from './patternStyle';
import { BEAT_OPTIONS, GrooveOptions, NEW } from './StructureToolbar';
import { useOpenSong, useStore } from './useLibrary';

const MIXED = '__mixed';

/** Gemeinsamer Wert aller Takte oder MIXED. */
function common<T>(values: T[]): T | typeof MIXED {
  return values.every((v) => v === values[0]) ? values[0]! : MIXED;
}

const blockOf = (song: Song, barId: string) =>
  song.segments.flatMap((s) => s.blocks).find((b) => b.bars.some((bar) => bar.id === barId))!;

function AccentEditor({ barId, beats, accents }: { barId: string; beats: number; accents: Accent[] }) {
  const store = useStore();
  const [instrument, setInstrument] = useState<Instrument>('crash');
  const [beat, setBeat] = useState(0);
  const [position, setPosition] = useState<Accent['position']>(0);

  return (
    <fieldset className="accent-editor">
      <legend>Akzente</legend>
      <ul className="accent-list">
        {accents.map((a) => {
          const label = `${INSTRUMENT_LABELS[a.instrument]} auf ${a.beat + 1}.${a.position + 1}`;
          return (
            <li key={label}>
              {label}
              <button
                type="button"
                className="link"
                aria-label={`${label} entfernen`}
                onClick={() => store.updateSong((s) => removeAccent(s, barId, a))}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <div className="accent-add">
        <select aria-label="Akzent-Instrument" value={instrument} onChange={(e) => setInstrument(e.target.value as Instrument)}>
          {INSTRUMENTS.map((i) => (
            <option key={i} value={i}>
              {INSTRUMENT_LABELS[i]}
            </option>
          ))}
        </select>
        <select aria-label="Akzent-Beat" value={Math.min(beat, beats - 1)} onChange={(e) => setBeat(Number(e.target.value))}>
          {Array.from({ length: beats }, (_, i) => (
            <option key={i} value={i}>
              {i + 1}
            </option>
          ))}
        </select>
        <select
          aria-label="Akzent-Position"
          value={position}
          onChange={(e) => setPosition(Number(e.target.value) as Accent['position'])}
        >
          {[0, 1, 2, 3].map((p) => (
            <option key={p} value={p}>
              {p + 1}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            store.updateSong((s) => addAccent(s, barId, { instrument, beat: Math.min(beat, beats - 1), position }))
          }
        >
          Akzent hinzufügen
        </button>
      </div>
    </fieldset>
  );
}

/** Eigenschaften der ausgewählten Takte (design.md D7). */
export function BarInspector({ selection, onDeleted }: { selection: string[]; onDeleted: () => void }) {
  const store = useStore();
  const song = useOpenSong();
  const [newGroove, setNewGroove] = useState<string | null>(null);
  const [newFill, setNewFill] = useState<{ name: string; length: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ordered = allBars(song);
  const bars = ordered.filter((b) => selection.includes(b.id));
  if (bars.length === 0) return null;
  const numbers = bars.map((b) => ordered.indexOf(b) + 1);
  const title = bars.length === 1 ? `Takt ${numbers[0]}` : `Takte ${numbers[0]}–${numbers.at(-1)}`;
  const last = bars.at(-1)!;

  const apply = (change: (s: Song) => Song) => {
    try {
      store.updateSong(change);
      setError(null);
    } catch (e) {
      if (e instanceof ValidationError) setError(e.message);
      else throw e;
    }
  };
  const setProps = (props: BarProps) => apply((s) => setBarProps(s, selection, props));

  const beats = common(bars.map((b) => b.beats));
  const groove = common(bars.map((b) => b.grooveId ?? ''));
  const fill = common(bars.map((b) => b.fillId ?? ''));

  return (
    <section className="bar-inspector" aria-label="Takt-Auswahl">
      <h3>{title}</h3>
      <div className="inspector-fields">
        <label className="field narrow">
          Beats pro Takt
          <select value={beats} onChange={(e) => setProps({ beats: Number(e.target.value) })}>
            {beats === MIXED && <option value={MIXED}>(gemischt)</option>}
            {BEAT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Groove
          <select
            value={newGroove !== null ? NEW : groove}
            onChange={(e) => {
              if (e.target.value === NEW) return setNewGroove('');
              setNewGroove(null);
              setProps({ grooveId: e.target.value || null });
            }}
          >
            {groove === MIXED && <option value={MIXED}>(gemischt)</option>}
            <GrooveOptions song={song} />
          </select>
        </label>
        {newGroove !== null && (
          <div className="inline-create">
            <label className="field">
              Name des neuen Grooves
              <input value={newGroove} onChange={(e) => setNewGroove(e.target.value)} />
            </label>
            <button
              type="button"
              onClick={() => {
                apply((s) => {
                  const created = addPlaceholder(s, { kind: 'groove', name: newGroove });
                  return setBarProps(created.song, selection, { grooveId: created.pattern.id });
                });
                setNewGroove(null);
              }}
            >
              Groove anlegen
            </button>
          </div>
        )}

        <label className="field">
          Fill am Taktende
          <select
            value={newFill !== null ? NEW : fill}
            onChange={(e) => {
              if (e.target.value === NEW) return setNewFill({ name: '', length: '1' });
              setNewFill(null);
              setProps({ fillId: e.target.value || null });
            }}
          >
            {fill === MIXED && <option value={MIXED}>(gemischt)</option>}
            <option value="">– kein –</option>
            {song.patterns
              .filter((p) => p.kind === 'fill')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {`${p.name} (${beatsLabel(p.beats.length)})`}
                </option>
              ))}
            <option value={NEW}>Neuer Fill …</option>
          </select>
        </label>
        {newFill !== null && (
          <div className="inline-create">
            <label className="field">
              Name des neuen Fills
              <input value={newFill.name} onChange={(e) => setNewFill({ ...newFill, name: e.target.value })} />
            </label>
            <label className="field narrow">
              Länge des neuen Fills (Beats)
              <input
                type="number"
                min={1}
                max={MAX_LENGTH}
                value={newFill.length}
                onChange={(e) => setNewFill({ ...newFill, length: e.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                apply((s) => {
                  const created = addPlaceholder(s, { kind: 'fill', name: newFill.name, length: Number(newFill.length) });
                  return setBarProps(created.song, selection, { fillId: created.pattern.id });
                });
                setNewFill(null);
              }}
            >
              Fill anlegen
            </button>
          </div>
        )}
      </div>

      {bars.length === 1 && <AccentEditor barId={last.id} beats={last.beats} accents={last.accents} />}

      <div className="inspector-actions">
        <button type="button" onClick={() => apply((s) => insertBarAfter(s, last.id))}>
          Takt danach einfügen
        </button>
        <button type="button" onClick={() => apply((s) => appendBar(s, blockOf(s, last.id).id))}>
          Takt am Blockende anfügen
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            apply((s) => selection.reduce(deleteBar, s));
            onDeleted();
          }}
        >
          Ausgewählte Takte löschen
        </button>
      </div>
      {error && (
        <p role="alert" className="message alert">
          {error}
        </p>
      )}
    </section>
  );
}
