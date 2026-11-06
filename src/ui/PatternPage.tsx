import { useRef } from 'react';
import { useDragSource } from './dragPattern';
import { meterLabel, patternMeter, songMeter } from '../domain/meter';
import type { Pattern } from '../domain/types';
import { songPatternOrder } from '../songbook/layout';
import { beatsLabel, patternStyle } from './patternStyle';
import { NotationView, useWidth } from './NotationView';
import { useNotebook, useOpenSong, useStore } from './useLibrary';

/** Rand und Einzug der Karte in px (styles.css): Groove Kante 3px und Einzug 0,5rem, Fill Rahmen 1px und Einzug 0,5rem je Seite. */
const CARD_EDGE = { groove: 3 + 8, fill: 2 * (1 + 8) };

/** Umbruchbreite der Noten: Breite der Patternseite, nicht der Karte, die sich nach den Noten richtet (design.md D3). */
function PatternCard({ pattern, flowWidth }: { pattern: Pattern; flowWidth: number | undefined }) {
  const store = useStore();
  const { locked } = useNotebook();
  const song = useOpenSong();
  const deviates = pattern.meter !== undefined && pattern.meter !== songMeter(song);
  const headingId = `pattern-${pattern.id}`;
  const drag = useDragSource({ kind: 'pattern', patternId: pattern.id });
  return (
    <article
      className={`pattern-card ${pattern.kind}`}
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
        <span className="pattern-meta">
          {beatsLabel(pattern.beats.length)}
          {deviates && ` · ${meterLabel(pattern.meter!)}`}
        </span>
      </header>
      <NotationView pattern={pattern} meter={patternMeter(pattern, song)} size="card" maxWidth={flowWidth && flowWidth - CARD_EDGE[pattern.kind]} />
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
  const grid = useRef<HTMLDivElement>(null);
  const flowWidth = useWidth(grid);
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
      <div ref={grid} className="pattern-grid">
        {songPatternOrder(song).map((p) => (
          <PatternCard key={p.id} pattern={p} flowWidth={flowWidth} />
        ))}
      </div>
    </section>
  );
}
