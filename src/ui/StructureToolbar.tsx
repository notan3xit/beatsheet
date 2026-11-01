import { useState } from 'react';
import { ValidationError } from '../domain/pattern';
import { addPlaceholder, appendSegment } from '../domain/structure';
import { MAX_BAR_BEATS, type Song } from '../domain/types';
import { useOpenSong, useStore } from './useLibrary';

export const NEW = '__new';
export const BEAT_OPTIONS = Array.from({ length: MAX_BAR_BEATS }, (_, i) => i + 1);

/** Auswahlliste für Grooves: keiner, bestehende, neuer Platzhalter. */
export function GrooveOptions({ song }: { song: Song }) {
  return (
    <>
      <option value="">– kein –</option>
      {song.patterns
        .filter((p) => p.kind === 'groove')
        .map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      <option value={NEW}>Neuer Groove …</option>
    </>
  );
}

/** Neues Segment anfügen: Name, Taktzahl, Taktlänge, Groove (auch neu als Platzhalter). */
export function StructureToolbar() {
  const store = useStore();
  const song = useOpenSong();
  const [name, setName] = useState('');
  const [bars, setBars] = useState('4');
  const [beats, setBeats] = useState(4);
  const [groove, setGroove] = useState('');
  const [newGroove, setNewGroove] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    try {
      store.updateSong((current) => {
        let next = current;
        let grooveId: string | null = groove || null;
        if (groove === NEW) {
          const created = addPlaceholder(next, { kind: 'groove', name: newGroove });
          next = created.song;
          grooveId = created.pattern.id;
        }
        return appendSegment(next, { name, bars: Number(bars), beats, grooveId });
      });
      setName('');
      setNewGroove('');
      if (groove === NEW) setGroove('');
      setError(null);
    } catch (e) {
      if (e instanceof ValidationError) setError(e.message);
      else throw e;
    }
  };

  return (
    <form
      className="structure-toolbar"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="field">
        Segmentname
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Segment ${song.segments.length + 1}`} />
      </label>
      <label className="field narrow">
        Takte
        <input type="number" min={1} max={64} value={bars} onChange={(e) => setBars(e.target.value)} />
      </label>
      <label className="field narrow">
        Beats/Takt
        <select value={beats} onChange={(e) => setBeats(Number(e.target.value))} aria-label="Beats pro Takt (neues Segment)">
          {BEAT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Groove für das Segment
        <select value={groove} onChange={(e) => setGroove(e.target.value)}>
          <GrooveOptions song={song} />
        </select>
      </label>
      {groove === NEW && (
        <label className="field">
          Name des neuen Grooves
          <input value={newGroove} onChange={(e) => setNewGroove(e.target.value)} />
        </label>
      )}
      <button type="submit" className="primary">
        Segment anfügen
      </button>
      {error && (
        <p role="alert" className="message alert">
          {error}
        </p>
      )}
    </form>
  );
}
