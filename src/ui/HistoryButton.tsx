import { useStore } from './useLibrary';

/** Pfeil gegen den Uhrzeigersinn um ein Zifferblatt mit Zeigern. */
function HistoryIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.25 8a5.75 5.75 0 1 0 1.7-4.1L2.25 5.6M2.25 2.6v3h3M8 4.75V8l2.25 1.5" />
    </svg>
  );
}

/** Öffnet den Verlauf des Songs (song-history); gesperrt wie entsperrt. */
export function HistoryButton() {
  const store = useStore();
  return (
    <button type="button" className="history-open" data-read-safe="" aria-label="Verlauf" title="Verlauf" onClick={() => store.openHistory()}>
      <HistoryIcon />
    </button>
  );
}
