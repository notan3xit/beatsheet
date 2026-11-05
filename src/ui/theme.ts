import { flavors, type CatppuccinFlavor } from '@catppuccin/palette';
import { createDeviceSetting, type DeviceSetting, type SettingStorage } from '../state/deviceSetting';

/** Gewähltes Farbschema: der Systemeinstellung folgen oder fest hell bzw. dunkel (color-theme). */
export type ThemeChoice = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';
export type ThemeSetting = DeviceSetting<ThemeChoice>;

export const THEME_STORAGE_KEY = 'beatsheet.theme';

/** Systemabfrage wie `matchMedia('(prefers-color-scheme: dark)')`. */
export type ThemeMedia = Pick<MediaQueryList, 'matches'> & {
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
};

/** Alle Palettenfarben einer Variante als --ctp-<name>. */
function variables(flavor: CatppuccinFlavor): string {
  return flavor.colorEntries.map(([name, color]) => `  --ctp-${name}: ${color.hex};`).join('\n');
}

/** Catppuccin Latte (Standard) und Mocha am Attribut `data-theme="dark"` (theme-choice, design.md D1). */
export function buildThemeCss(): string {
  return [
    `:root {\n  color-scheme: light;\n${variables(flavors.latte)}\n}`,
    `:root[data-theme='dark'] {\n  color-scheme: dark;\n${variables(flavors.mocha)}\n}`,
  ].join('\n');
}

/** Fügt das Farbschema einmalig in das Dokument ein; vor dem ersten Rendern aufrufen. */
export function installTheme(doc: Document = document): void {
  if (doc.getElementById('ctp-theme')) return;
  const style = doc.createElement('style');
  style.id = 'ctp-theme';
  style.textContent = buildThemeCss();
  doc.head.prepend(style);
}

/** Wahl des Farbschemas pro Gerät, Vorgabe „Wie System“ (theme-choice, design.md D2). */
export function createThemeSetting(storage: SettingStorage | null): ThemeSetting {
  return createDeviceSetting({ key: THEME_STORAGE_KEY, values: ['system', 'light', 'dark'], fallback: 'system' }, storage);
}

export function resolveTheme(choice: ThemeChoice, systemDark: boolean): Theme {
  if (choice === 'system') return systemDark ? 'dark' : 'light';
  return choice;
}

/** Hält `data-theme` am Wurzelelement passend zu Wahl und Systemeinstellung; liefert die Abmeldung. */
export function connectTheme(setting: ThemeSetting, root: HTMLElement, media: ThemeMedia | null): () => void {
  const apply = () => root.setAttribute('data-theme', resolveTheme(setting.get(), media?.matches ?? false));
  apply();
  const unsubscribe = setting.subscribe(apply);
  media?.addEventListener('change', apply);
  return () => {
    unsubscribe();
    media?.removeEventListener('change', apply);
  };
}

/** Systemabfrage des Browsers, falls vorhanden. */
export function browserThemeMedia(): ThemeMedia | null {
  return typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia('(prefers-color-scheme: dark)') : null;
}
