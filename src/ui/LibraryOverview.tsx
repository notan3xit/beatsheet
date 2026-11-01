import { groupLibrary } from '../domain/pattern';
import type { Pattern } from '../domain/types';
import { useLibrary, useStore } from './useLibrary';

export const beatsLabel = (count: number) => (count === 1 ? '1 Beat' : `${count} Beats`);

function PatternList({ title, patterns, selectedId }: { title: string; patterns: Pattern[]; selectedId: string | null }) {
  const store = useStore();
  const headingId = `library-${title}`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <ul className="pattern-list">
        {patterns.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className="pattern-item"
              aria-current={p.id === selectedId ? 'true' : undefined}
              onClick={() => store.select(p.id)}
            >
              <span className="pattern-name">{p.name}</span>
              <span className="pattern-length">{beatsLabel(p.beats.length)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LibraryOverview() {
  const store = useStore();
  const { patterns, selectedId } = useLibrary();
  const { grooves, fills } = groupLibrary(patterns);

  return (
    <nav aria-label="Bibliothek" className="library">
      <div className="library-actions">
        <button type="button" onClick={() => store.createPattern('groove')}>
          Neuer Groove
        </button>
        <button type="button" onClick={() => store.createPattern('fill')}>
          Neuer Fill
        </button>
      </div>
      {patterns.length === 0 ? (
        <p className="hint">Noch keine Patterns. Lege mit „Neuer Groove“ oder „Neuer Fill“ dein erstes Pattern an.</p>
      ) : (
        <>
          <PatternList title="Grooves" patterns={grooves} selectedId={selectedId} />
          <PatternList title="Fills" patterns={fills} selectedId={selectedId} />
        </>
      )}
    </nav>
  );
}
