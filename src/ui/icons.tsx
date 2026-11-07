import type { ReactNode } from 'react';

function Icon({ filled, viewBox = '0 0 16 16', children }: { filled?: boolean; viewBox?: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} aria-hidden="true" focusable="false" className={filled ? 'icon filled' : 'icon'}>
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

/** Fünf Notenlinien mit dickem Balken links und Percussion-Schlüssel; 15 hoch, damit die Linien mittig auf Bildpunkten liegen. */
export function MeterIcon() {
  return (
    <Icon viewBox="0 0 16 15">
      <path d="M3 1.5h12M3 4.5h12M3 7.5h12M3 10.5h12M3 13.5h12" className="icon-staff" shapeRendering="crispEdges" />
      <path d="M1 1h2v13H1zM6 4h2v7H6zM10 4h2v7h-2z" fill="currentColor" stroke="none" shapeRendering="crispEdges" />
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

export function CheckIcon() {
  return (
    <Icon>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </Icon>
  );
}

export function InfoIcon() {
  return (
    <Icon>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.25v4M8 4.5v.25" />
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
