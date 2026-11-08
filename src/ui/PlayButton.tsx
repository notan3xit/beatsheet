export type PlaySymbol = 'play' | 'loop' | 'stop';

/** Symbole als SVG, damit sie bei jedem Zoom scharf und auf jedem System gleich sind. */
const SYMBOLS: Record<PlaySymbol, string> = {
  play: 'M4.5 2.5v11l9-5.5z',
  stop: 'M4.5 3.5h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z',
  // Zwei Pfeile im Rechteck wie bei Musik-Playern; ein einzelner Kreispfeil läse sich als „neu laden“
  loop: 'M2.5 7.5V6a2 2 0 0 1 2-2h8M10.5 2l2 2-2 2M13.5 8.5V10a2 2 0 0 1-2 2h-8M5.5 10l-2 2 2 2',
};

/**
 * Abspiel-Knopf (playback-controls): nur Symbol, die Aktion steht im Namen und Tooltip. Ändert den Song nicht, daher freigegeben.
 * `idle`: grau, weil gerade der andere Modus läuft.
 */
export function PlayButton({
  symbol,
  label,
  disabled,
  idle,
  onClick,
}: {
  symbol: PlaySymbol;
  label: string;
  disabled?: boolean;
  idle?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={idle ? 'play-button idle' : 'play-button'}
      data-symbol={symbol}
      data-read-safe=""
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d={SYMBOLS[symbol]} />
      </svg>
    </button>
  );
}
