import type { ReactNode } from 'react';

function Icon({ filled, children }: { filled?: boolean; children: ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={filled ? 'icon filled' : 'icon'}>
      {children}
    </svg>
  );
}

export function PersonIcon({ filled }: { filled?: boolean }) {
  return (
    <Icon filled={filled}>
      <circle cx="8" cy="8" r="6.5" fill="none" />
      <circle cx="8" cy="6" r="2.25" />
      <path d="M3.31 12.5c.9-1.8 2.6-2.6 4.69-2.6s3.79.8 4.69 2.6A6.5 6.5 0 0 1 3.31 12.5z" />
    </Icon>
  );
}

/** Pfeil nach rechts in eine Box: Song in ein Workbook verschieben. */
export function MoveIcon() {
  return (
    <Icon>
      <path d="M9 2.5h3.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9M1.5 8h8M7 5.25 9.75 8 7 10.75" />
    </Icon>
  );
}

export function MenuIcon() {
  return (
    <Icon>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </Icon>
  );
}

export function ExportIcon() {
  return (
    <Icon>
      <path d="M8 2v8M5 7.25 8 10.25l3-3M2.5 13.5h11" />
    </Icon>
  );
}

export function ImportIcon() {
  return (
    <Icon>
      <path d="M8 10.25v-8M5 5l3-3 3 3M2.5 13.5h11" />
    </Icon>
  );
}
