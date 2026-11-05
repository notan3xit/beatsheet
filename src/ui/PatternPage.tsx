import { useMemo } from 'react';
import { toNotation } from '../notation/model';
import { naturalCardWidth } from '../notation/render/vexflow';
import { useDragSource } from './dragPattern';
import type { Pattern } from '../domain/types';
import { patternPageOrder } from '../songbook/layout';
import { beatsLabel, patternStyle } from './patternStyle';
import { NotationView } from './NotationView';
import { useNotebook, useOpenSong, useStore } from './useLibrary';

/**
 * Kleinste Spalte bei zwei Spalten: (28,5rem − 0,75rem) / 2 (styles.css, .pattern-grid), abzüglich
 * Farbkante und Einzug der Karte (3px + 0,5rem). Breitere Noten belegen beide Spalten (design.md D7).
 */
const COLUMN_NOTATION_WIDTH = 222 - 11;

function PatternCard({ pattern }: { pattern: Pattern }) {
  const store = useStore();
  const { locked } = useNotebook();
  const headingId = `pattern-${pattern.id}`;
  const drag = useDragSource({ kind: 'pattern', patternId: pattern.id });
  const wide = useMemo(() => naturalCardWidth(toNotation(pattern)) > COLUMN_NOTATION_WIDTH, [pattern]);
  return (
    <article
      className={wide ? 'pattern-card wide' : 'pattern-card'}
      aria-labelledby={headingId} style={patternStyle(pattern.color)}>
      <header className="pattern-card-header" {...(locked ? {} : drag)}>
        <h3 id={headingId}>
          <button
            type="button"
            className="pattern-name"
            data-drag-handle=""
            data-read-safe=""
            aria-label={`${pattern.name} ${locked ? 'ansehen' : 'bearbeiten'}`}
            title={pattern.name}
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
