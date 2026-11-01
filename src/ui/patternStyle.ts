import type { CSSProperties } from 'react';
import type { PatternColor } from '../domain/types';

/** Setzt die Pattern-Farbe als CSS-Variable --pc (Wert aus der Catppuccin-Palette). */
export const patternStyle = (color: PatternColor): CSSProperties => ({ ['--pc' as string]: `var(--ctp-${color})` });

export const beatsLabel = (count: number) => (count === 1 ? '1 Beat' : `${count} Beats`);
