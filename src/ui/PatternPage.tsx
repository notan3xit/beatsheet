import { useDragSource } from './dragPattern';
import type { Pattern } from '../domain/types';
import { patternPageOrder } from '../songbook/layout';
import { beatsLabel, patternStyle } from './patternStyle';
import { NotationView } from './NotationView';
import { useNotebook, useOpenSong, useStore } from './useLibrary';

/** Patterns mit mehr Beats belegen beide Spalten der Patternseite. */
const BEATS_PER_COLUMN = 4;

function PatternCard({ pattern }: { pattern: Pattern }) {
  const store = useStore();
  const { locked } = useNotebook();
  const headingId = `pattern-${pattern.id}`;
  const drag = useDragSource({ kind: 'pattern', patternId: pattern.id });
  return (
    <article
      className={pattern.beats.length > BEATS_PER_COLUMN ? 'pattern-card wide' : 'pattern-card'}
      aria-labelledby={headingId} style={patternStyle(pattern.color)}>
      <header className="pattern-card-header" {...(locked ? {} : drag)}>
        <h3 id={headingId}>
          <button
            type="button"
            className="pattern-name"
            data-drag-handle=""
            data-read-safe=""
            aria-label={`${pattern.name} ${locked ? 'ansehen' : 'bearbeiten'}`}
            onClick={() => store.openPattern(pattern.id)}
          >
            {pattern.name}
          </button>
        </h3>
        <span className="pattern-meta">{beatsLabel(pattern.beats.length)}</span>
      </header>
      <NotationView pattern={pattern} size="card" />
    </article>
  );
}

/** Rechte Buchseite: jedes Pattern des Songs genau einmal, in Leserichtung der Struktur. */
export function PatternPage() {
  const store = useStore();
  const song = useOpenSong();
  const { locked } = useNotebook();
  const newGroove = useDragSource({ kind: 'new', patternKind: 'groove' });
  const newFill = useDragSource({ kind: 'new', patternKind: 'fill' });
  return (
    <section className="page pattern-page" aria-label="Patterns">
      {!locked && (
        <div className="page-actions">
          <button type="button" className="add-pattern" aria-label="Neuer Groove" {...newGroove} onClick={() => store.createPattern('groove')}>
            + Groove
          </button>
          <button type="button" className="add-pattern" aria-label="Neuer Fill" {...newFill} onClick={() => store.createPattern('fill')}>
            + Fill
          </button>
        </div>
      )}
      {!locked && song.patterns.length === 0 && <p className="hint">Noch keine Patterns. Lege Grooves und Fills hier oder beim Aufbau der Struktur an.</p>}
      <div className="pattern-grid">
        {patternPageOrder(song).map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </div>
    </section>
  );
}
