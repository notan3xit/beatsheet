import { flavors, type ColorName } from '@catppuccin/palette';
import { describe, expect, it } from 'vitest';
import { buildThemeCss } from './theme';

const COLOR_NAMES = Object.keys(flavors.latte.colors) as ColorName[];

/** Teilt den CSS-Text in Basisregel und Dark-Media-Block. */
function blocks() {
  const css = buildThemeCss();
  const media = css.indexOf('@media (prefers-color-scheme: dark)');
  expect(media).toBeGreaterThan(0);
  return { light: css.slice(0, media), dark: css.slice(media) };
}

const declares = (block: string, name: string, value: string) =>
  new RegExp(`--ctp-${name}:\\s*${value};`, 'i').test(block);

describe('Spec color-theme › Farbschema folgt der Systemeinstellung', () => {
  it('Helle Systemeinstellung', () => {
    const { light } = blocks();
    expect(declares(light, 'base', flavors.latte.colors.base.hex)).toBe(true);
    expect(declares(light, 'text', flavors.latte.colors.text.hex)).toBe(true);
    expect(light).toMatch(/color-scheme:\s*light/);
  });

  it('Dunkle Systemeinstellung', () => {
    const { dark } = blocks();
    expect(declares(dark, 'base', flavors.mocha.colors.base.hex)).toBe(true);
    expect(declares(dark, 'text', flavors.mocha.colors.text.hex)).toBe(true);
    expect(dark).toMatch(/color-scheme:\s*dark/);
  });

  it('Wechsel zur Laufzeit: Umschaltung erfolgt über die Media Query, nicht über einmaliges JavaScript', () => {
    expect(buildThemeCss()).toContain('@media (prefers-color-scheme: dark)');
  });
});

describe('Spec color-theme › Farben ausschließlich aus der Palette', () => {
  it('Oberfläche im Hellmodus: alle 26 Latte-Farben als Variablen', () => {
    const { light } = blocks();
    for (const name of COLOR_NAMES) expect(declares(light, name, flavors.latte.colors[name].hex), name).toBe(true);
  });

  it('Oberfläche im Dunkelmodus: alle 26 Mocha-Farben als Variablen', () => {
    const { dark } = blocks();
    for (const name of COLOR_NAMES) expect(declares(dark, name, flavors.mocha.colors[name].hex), name).toBe(true);
  });
});
