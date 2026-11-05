import { createContext, useContext } from 'react';
import type { ThemeSetting } from './theme';

/** Wahl des Farbschemas für das Menü (theme-choice, design.md D3). */
export const ThemeContext = createContext<ThemeSetting | null>(null);

export function useThemeSetting(): ThemeSetting {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('ThemeContext fehlt');
  return theme;
}
