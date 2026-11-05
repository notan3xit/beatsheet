/** Geometrie eines „e“ (app-logo, design.md D2): viewBox-Höhe 100 entspricht 1 ex. */
const E_HEIGHT = 100;
const E_WIDTH = 100;
const E_STROKE = 19;
const E_MIDDLE = 0.65;

function LogoE({ index }: { index: number }) {
  const half = E_STROKE / 2;
  const rows = [
    { y: half, length: 1 },
    { y: E_HEIGHT / 2, length: E_MIDDLE },
    { y: E_HEIGHT - half, length: 1 },
  ];
  return (
    <svg className="logo-e" viewBox={`0 0 ${E_WIDTH} ${E_HEIGHT}`} aria-hidden="true">
      {rows.map(({ y, length }, row) => (
        <line
          key={row}
          x1={half}
          x2={half + (E_WIDTH - E_STROKE) * length}
          y1={y}
          y2={y}
          stroke={`var(--logo-e${index}-${row + 1})`}
          strokeWidth={E_STROKE}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function Beet() {
  return (
    <svg className="logo-beet" viewBox="0 0 32 32" aria-hidden="true">
      <path className="logo-leaf" fill="var(--logo-leaf)" d="M15 12 C10 10 6.5 5 8.5 2 C13 3 15.2 7 15.6 12Z" />
      <path className="logo-leaf" fill="var(--logo-leaf)" d="M17 12 C22 10 25.5 5 23.5 2 C19 3 16.8 7 16.4 12Z" />
      <path className="logo-leaf" fill="var(--logo-leaf)" d="M16 11 C14.6 7 15 3.5 16 1 C17 3.5 17.4 7 16 11Z" />
      <path
        className="logo-bulb"
        fill="var(--logo-beet)"
        d="M16 10.5 C23 10.5 27 15 26 19.5 C25 24 19.5 26.5 16.6 29.5 C16.4 30.5 16.8 31.3 17.4 31.8 C15.6 31.6 15.3 30.4 15.4 29.5 C12.5 26.5 7 24 6 19.5 C5 15 9 10.5 16 10.5Z"
      />
      <ellipse className="logo-shine" fill="var(--logo-beet-light)" fillOpacity={0.6} cx="11.5" cy="16.5" rx="2" ry="3" transform="rotate(25 11.5 16.5)" />
    </svg>
  );
}

/** Logo der Kopfzeile: Rote Beete und Schriftzug „beatsheet“ mit Strich-„e“s; Name für Screenreader „Beatsheet“. */
export function Logo() {
  return (
    <h1 className="logo" aria-label="Beatsheet">
      <Beet />
      <span className="logo-word" aria-hidden="true">
        b<LogoE index={1} />
        atsh<LogoE index={2} />
        <LogoE index={3} />t
      </span>
    </h1>
  );
}
