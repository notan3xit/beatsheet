import { useId } from 'react';
import type { ChangelogEntry } from './changelog';
import { useEscape } from './useDismiss';

/** Umstellen statt `Date`: Der Tag verschiebt sich so in keiner Zeitzone. */
const germanDate = (date: string) => date.split('-').reverse().join('.');

/** Dialog „Was ist neu“: Neuerungen je Version in der Reihenfolge der Liste. */
export function ChangelogDialog({ entries, onClose }: { entries: ChangelogEntry[]; onClose: () => void }) {
  const titleId = useId();
  useEscape(true, onClose);
  return (
    <div className="backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="dialog changelog-dialog">
        <h2 id={titleId}>Was ist neu</h2>
        <div className="changelog-list">
          {entries.map(({ version, date, items }) => (
            <article key={version} className="changelog-entry">
              <header>
                <h3>{version}</h3>
                <span className="changelog-date">{germanDate(date)}</span>
              </header>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="dialog-actions">
          <button type="button" autoFocus onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
