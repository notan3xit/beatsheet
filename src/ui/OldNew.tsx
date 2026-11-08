import type { ReactNode } from 'react';

/** Geänderter Wert: alt durchgestrichen, neu hervorgehoben (song-history, design.md D9). */
export function OldNew({ from, to }: { from: ReactNode; to: ReactNode }) {
  return (
    <span className="old-new">
      <del className="old-value">{from}</del> <ins className="new-value">{to}</ins>
    </span>
  );
}
