import { useNotebook, useStore } from './useLibrary';

/** Zwei Linien mit Pfeil: eingeklappt eng mit Pfeil nach oben darunter, ausgeklappt auseinander mit Pfeil nach unten dazwischen. */
function StructureIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {expanded ? (
        <path d="M2.5 2.5h11M2.5 13.5h11M8 5v5M5.75 7.75 8 10l2.25-2.25" />
      ) : (
        <path d="M2.5 3h11M2.5 6h11M8 14V9M5.75 11.25 8 9l2.25 2.25" />
      )}
    </svg>
  );
}

/** Schalter der Doppelseite: klappt die Struktur aus (keine flachen Zeilen) und wieder ein. */
export function StructureToggle() {
  const store = useStore();
  const { expanded } = useNotebook();
  const label = expanded ? 'Struktur einklappen' : 'Struktur ausklappen';
  return (
    <button
      type="button"
      className={`structure-toggle${expanded ? ' expanded' : ''}`}
      data-read-safe=""
      aria-label={label}
      aria-pressed={expanded}
      title={label}
      onClick={() => store.setExpanded(!expanded)}
    >
      <StructureIcon expanded={expanded} />
    </button>
  );
}
