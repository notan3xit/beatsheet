import { beatHasHits } from '../domain/pattern';
import { useDragSource } from './dragPattern';
import type { Pattern } from '../domain/types';
import { patternPageOrder } from '../songbook/layout';
import { beatsLabel, patternStyle } from './patternStyle';
import { NotationView } from './NotationView';
import { useOpenSong, useStore } from './useLibrary';

export const isEmptyPattern = (pattern: Pattern) => !pattern.beats.some(beatHasHits);

function PatternCard({ pattern }: { pattern: Pattern }) {
  const store = useStore();
  const headingId = `pattern-${pattern.id}`;
  const drag = useDragSource({ kind: 'pattern', patternId: pattern.id });
  return (
    <article className="pattern-card" aria-labelledby={headingId} style={patternStyle(pattern.color)}>
      <header className="pattern-card-header" {...drag}>
        <h3 id={headingId}>{pattern.name}</h3>
        <span className="pattern-meta">{pattern.kind === 'groove' ? 'Groove' : 'Fill'}</span>
        <span className="pattern-meta">{beatsLabel(pattern.beats.length)}</span>
        <button
          type="button"
          className="pattern-edit"
          aria-label={`${pattern.name} bearbeiten`}
          onClick={() => store.openPattern(pattern.id)}
        >
          Bearbeiten
        </button>
      </header>
      {isEmptyPattern(pattern) ? <p className="hint">noch leer</p> : <NotationView pattern={pattern} />}
    </article>
  );
}

/** Rechte Buchseite: jedes Pattern des Songs genau einmal, in Leserichtung der Struktur. */
export function PatternPage() {
  const store = useStore();
  const song = useOpenSong();
  const newGroove = useDragSource({ kind: 'new', patternKind: 'groove' });
  const newFill = useDragSource({ kind: 'new', patternKind: 'fill' });
  return (
    <section className="page pattern-page" aria-label="Patterns">
      <div className="page-actions">
        <button type="button" {...newGroove} onClick={() => store.createPattern('groove')}>
          Neuer Groove
        </button>
        <button type="button" {...newFill} onClick={() => store.createPattern('fill')}>
          Neuer Fill
        </button>
      </div>
      {song.patterns.length === 0 && <p className="hint">Noch keine Patterns. Lege Grooves und Fills hier oder beim Aufbau der Struktur an.</p>}
      {patternPageOrder(song).map((p) => (
        <PatternCard key={p.id} pattern={p} />
      ))}
    </section>
  );
}
