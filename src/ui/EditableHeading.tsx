import { useRef, useState } from 'react';

/**
 * Überschrift, die beim Anklicken zum Eingabefeld wird (navigation, design.md D2).
 * Enter oder Verlassen übernimmt, Escape verwirft. `onCommit` liefert den tatsächlich
 * gespeicherten Wert (bei abgelehntem Namen den alten).
 */
export function EditableHeading({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (draft: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const discard = useRef(false);

  if (draft === null) {
    return (
      // Klick irgendwo auf die Überschrift; der Knopf macht sie per Tastatur erreichbar (Klick bubbelt hierher)
      <h2
        className="editable-heading"
        onClick={() => {
          discard.current = false;
          setDraft(value);
        }}
      >
        <button type="button" className="heading-edit" title="Zum Umbenennen klicken">
          {value}
        </button>
      </h2>
    );
  }

  return (
    <h2 className="editable-heading">
      <input
        aria-label={label}
        value={draft}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (!discard.current) onCommit(draft);
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            discard.current = true;
            e.currentTarget.blur();
          }
        }}
      />
    </h2>
  );
}
