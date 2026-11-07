import { flavors, type ColorName } from '@catppuccin/palette';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildThemeCss, connectTheme, createThemeSetting, resolveTheme, THEME_STORAGE_KEY, type ThemeMedia } from './theme';

const COLOR_NAMES = Object.keys(flavors.latte.colors) as ColorName[];
const DARK_SELECTOR = ":root[data-theme='dark']";

/** Teilt den CSS-Text in Basisregel und Dunkel-Regel. */
function blocks() {
  const css = buildThemeCss();
  const dark = css.indexOf(DARK_SELECTOR);
  expect(dark).toBeGreaterThan(0);
  return { light: css.slice(0, dark), dark: css.slice(dark) };
}

const declares = (block: string, name: string, value: string) =>
  new RegExp(`--ctp-${name}:\\s*${value};`, 'i').test(block);

/** Nachbau von `matchMedia('(prefers-color-scheme: dark)')` mit umschaltbarer Systemeinstellung. */
type FakeMedia = Omit<ThemeMedia, 'matches'> & { matches: boolean; setDark(value: boolean): void; listeners: Set<() => void> };

function fakeMedia(dark: boolean): FakeMedia {
  const listeners = new Set<() => void>();
  return {
    matches: dark,
    addEventListener: (_type, listener) => void listeners.add(listener),
    removeEventListener: (_type, listener) => void listeners.delete(listener),
    setDark(value) {
      this.matches = value;
      listeners.forEach((listener) => listener());
    },
    listeners,
  };
}

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

/** Wahl, Systemeinstellung und Wurzelelement verbunden; liefert das gesetzte Attribut. */
function connected(choice: string | null, systemDark: boolean) {
  const setting = createThemeSetting(memoryStorage(choice ? { [THEME_STORAGE_KEY]: choice } : {}));
  const media = fakeMedia(systemDark);
  const root = document.createElement('html');
  const disconnect = connectTheme(setting, root, media);
  return { setting, media, disconnect, theme: () => root.getAttribute('data-theme') };
}

describe('Spec color-theme › Farbschema folgt der Systemeinstellung', () => {
  it('Helle Systemeinstellung: Latte in der Basisregel', () => {
    const { light } = blocks();
    expect(declares(light, 'base', flavors.latte.colors.base.hex)).toBe(true);
    expect(declares(light, 'text', flavors.latte.colors.text.hex)).toBe(true);
    expect(light).toMatch(/color-scheme:\s*light/);
    expect(connected('system', false).theme()).toBe('light');
  });

  it('Dunkle Systemeinstellung: Mocha am Attribut dark', () => {
    const { dark } = blocks();
    expect(declares(dark, 'base', flavors.mocha.colors.base.hex)).toBe(true);
    expect(declares(dark, 'text', flavors.mocha.colors.text.hex)).toBe(true);
    expect(dark).toMatch(/color-scheme:\s*dark/);
    expect(connected('system', true).theme()).toBe('dark');
  });

  it('Farben hängen allein am Attribut, nicht an der Media Query', () => {
    expect(buildThemeCss()).not.toContain('prefers-color-scheme');
  });

  it('Wechsel zur Laufzeit', () => {
    const app = connected('system', false);
    app.media.setDark(true);
    expect(app.theme()).toBe('dark');
  });

  it('Hell trotz dunkler Systemeinstellung', () => {
    expect(connected('light', true).theme()).toBe('light');
  });

  it('Dunkel trotz heller Systemeinstellung', () => {
    expect(connected('dark', false).theme()).toBe('dark');
  });

  it('Systemwechsel bei fester Wahl', () => {
    const app = connected('light', false);
    app.media.setDark(true);
    expect(app.theme()).toBe('light');
  });

  it('ohne Systemabfrage gilt hell', () => {
    const root = document.createElement('html');
    connectTheme(createThemeSetting(null), root, null);
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('Auflösen der Wahl', () => {
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('Trennen meldet Wahl und Systemeinstellung ab', () => {
    const app = connected('system', false);
    app.disconnect();
    expect(app.media.listeners.size).toBe(0);
    app.setting.set('dark');
    expect(app.theme()).toBe('light');
  });
});

describe('Spec home-screen-app › Farbe der Systemleiste', () => {
  const LATTE = flavors.latte.colors.mantle.hex;
  const MOCHA = flavors.mocha.colors.mantle.hex;
  const metas = () => [...document.head.querySelectorAll('meta[name="theme-color"]')];
  const colors = () => metas().map((meta) => meta.getAttribute('content'));

  beforeEach(() => {
    for (const scheme of ['light', 'dark']) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.media = `(prefers-color-scheme: ${scheme})`;
      document.head.append(meta);
    }
  });
  afterEach(() => metas().forEach((meta) => meta.remove()));

  it('Wie System', () => {
    connected('system', true);
    expect(colors()).toEqual([MOCHA, MOCHA]);
  });

  it('Wahl weicht von der Systemeinstellung ab', () => {
    connected('light', true);
    expect(colors()).toEqual([LATTE, LATTE]);
  });

  it('Wahl ändern', () => {
    const app = connected('light', false);
    app.setting.set('dark');
    expect(colors()).toEqual([MOCHA, MOCHA]);
  });

  it('Systemeinstellung ändert sich', () => {
    const app = connected('system', false);
    app.media.setDark(true);
    expect(colors()).toEqual([MOCHA, MOCHA]);
  });
});

describe('Spec color-theme › Wahl des Farbschemas pro Gerät', () => {
  it('Vorgabe: ohne gespeicherte Wahl gilt „Wie System“', () => {
    expect(createThemeSetting(memoryStorage()).get()).toBe('system');
  });

  it('Wahl bleibt erhalten: neuer Store über denselben Speicher', () => {
    const storage = memoryStorage();
    createThemeSetting(storage).set('dark');
    expect(createThemeSetting(storage).get()).toBe('dark');
  });

  it('Dunkel wählen wirkt sofort', () => {
    const app = connected('system', false);
    app.setting.set('dark');
    expect(app.theme()).toBe('dark');
  });
});

describe('Spec design-system › Farben ausschließlich aus der Palette', () => {
  it('Oberfläche im Hellmodus: alle 26 Latte-Farben als Variablen', () => {
    const { light } = blocks();
    for (const name of COLOR_NAMES) expect(declares(light, name, flavors.latte.colors[name].hex), name).toBe(true);
  });

  it('Oberfläche im Dunkelmodus: alle 26 Mocha-Farben als Variablen', () => {
    const { dark } = blocks();
    for (const name of COLOR_NAMES) expect(declares(dark, name, flavors.mocha.colors[name].hex), name).toBe(true);
  });
});
