import { useId } from 'react';
import { useEscape } from './useDismiss';

/** Dialog „DRSKit nicht verfügbar“: Grund je versuchtem Format (playback-sound). */
export function SampleFailureDialog({ failures, onClose }: { failures: readonly string[]; onClose: () => void }) {
  const titleId = useId();
  useEscape(true, onClose);
  return (
    <div className="backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="dialog sample-failure-dialog">
        <h2 id={titleId}>DRSKit nicht verfügbar</h2>
        <ul>
          {failures.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="dialog-actions">
          <button type="button" autoFocus onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
