import type { MouseEvent } from 'react';
import { useNotebook, useStore } from './useLibrary';

/**
 * Sicherheitsnetz für Song-Ansichten (song-read-lock, design.md D7): Bei gesperrtem Song bleiben
 * Knöpfe ohne `data-read-safe` wirkungslos. Enter und Leertaste lösen bei Knöpfen ebenfalls einen Klick aus.
 */
export function useLockGuard() {
  const { locked } = useNotebook();
  return {
    onClickCapture(e: MouseEvent) {
      const button = (e.target as Element).closest('button');
      if (locked && button && !button.hasAttribute('data-read-safe')) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}

/** Geschlossenes oder offenes Schloss als SVG, damit es bei jedem Zoom scharf bleibt. */
function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="2.75" y="7" width="10.5" height="7.5" rx="1.5" />
      <path d={locked ? 'M5 7V4.5a3 3 0 0 1 6 0V7' : 'M5 7V4.5a3 3 0 0 1 5.8-1.1'} />
    </svg>
  );
}

/** Schloss des geöffneten Songs. */
export function LockToggle() {
  const store = useStore();
  const { locked } = useNotebook();
  const label = locked ? 'Song entsperren' : 'Song sperren';
  return (
    <button
      type="button"
      className={`lock-toggle${locked ? '' : ' unlocked'}`}
      data-read-safe=""
      aria-label={label}
      title={label}
      onClick={() => store.setLocked(!locked)}
    >
      <LockIcon locked={locked} />
    </button>
  );
}
