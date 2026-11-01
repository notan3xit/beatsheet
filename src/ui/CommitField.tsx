import { useState } from 'react';

/**
 * Textfeld, das erst beim Verlassen (oder Enter) übernimmt. Danach zeigt es den tatsächlich
 * gespeicherten Wert, z. B. den alten Namen, wenn eine leere Eingabe abgelehnt wurde.
 * Mit `key` an das bearbeitete Objekt binden, damit der Entwurf beim Wechsel zurückgesetzt wird.
 */
export function CommitField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (draft: string) => string;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <label className="field">
      {label}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => setDraft(onCommit(draft))}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </label>
  );
}
