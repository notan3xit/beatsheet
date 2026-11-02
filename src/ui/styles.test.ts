import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Unter jsdom ist import.meta.url keine file:-URL, daher über das Projektverzeichnis
const css = readFileSync(resolve(process.cwd(), 'src/ui/styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Wert eines Custom Property in der :root-Regel. */
const token = (name: string) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();

describe('Spec color-theme › Farben ausschließlich aus der Palette (Stylesheet)', () => {
  it('Oberfläche im Hell- und Dunkelmodus: keine Farbliterale, nur Palette-Variablen', () => {
    const literals = css.match(
      /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|(?<![-\w])(?:white|black|red|green|blue|gray|grey|orange|yellow)(?![-\w])/gi,
    );
    expect(literals ?? []).toEqual([]);
  });

  it('Jede verwendete Palette-Variable ist eine Catppuccin-Farbe', async () => {
    const { flavors } = await import('@catppuccin/palette');
    const names = new Set(Object.keys(flavors.latte.colors));
    const used = [...css.matchAll(/var\(--ctp-([a-z0-9]+)\)/g)].map((m) => m[1]!);
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((n) => !names.has(n))).toEqual([]);
  });
});

describe('Spec color-theme › Rot nur für Fehler und destruktive Aktionen', () => {
  it('Löschen und Fehler: --danger ist red, und nur --danger nutzt red', () => {
    expect(token('danger')).toBe('var(--ctp-red)');
    expect(css.match(/var\(--ctp-red\)/g)).toHaveLength(1);
  });

  it('Löschen und Fehler: Löschen-Button und Fehlermeldung nutzen --danger', () => {
    expect(css).toMatch(/button\.danger\s*\{[^}]*var\(--danger\)/);
    expect(css).toMatch(/\.message\.alert\s*\{[^}]*var\(--danger\)/);
  });

  it('Gesetzte Sequencer-Zelle: Akzent ist nicht red', () => {
    expect(token('accent')).toMatch(/^var\(--ctp-(?!red\b)[a-z0-9]+\)$/);
    expect(css).toMatch(/\.step\[aria-pressed='true'\]\s*\{[^}]*var\(--accent\)/);
  });
});

describe('Spec color-theme › Akzentflächen je nach Variante tonal oder voll', () => {
  const darkBlock = css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/)?.[1] ?? '';
  const dark = (name: string) => darkBlock.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
  const rule = (selector: string) =>
    css.match(new RegExp(`(?:^|\\})\\s*${selector.replace(/[.[\]()'*]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  const percent = (v: string | undefined) => Number(v?.replace('%', ''));

  it('Hauptbutton im Hellmodus: 25 % Akzent mit base gemischt, Beschriftung text, kein Rahmen', () => {
    expect(rule('button.primary')).toMatch(
      /background:\s*color-mix\(in srgb, var\(--accent\) var\(--accent-fill-mix\), var\(--bg\)\)/,
    );
    expect(rule('button.primary')).toMatch(/color:\s*var\(--on-accent-fill\)/);
    expect(token('accent-fill-mix')).toBe('25%');
    expect(token('on-accent-fill')).toBe('var(--text)');
    expect(token('bg')).toBe('var(--ctp-base)');
    expect(token('text')).toBe('var(--ctp-text)');
    expect(rule('button.primary')).not.toMatch(/border/);
    expect(rule('button')).toMatch(/border:\s*none/);
  });

  it('Hauptbutton im Dunkelmodus: voll in der Akzentfarbe, Beschriftung base', () => {
    expect(dark('accent-fill-mix')).toBe('100%');
    expect(dark('on-accent-fill')).toBe('var(--on-accent)');
    expect(token('on-accent')).toBe('var(--ctp-base)');
    expect(dark('step-on-mix')).toBe('100%');
  });

  it('Gesetzte Sequencer-Zelle im Hellmodus: gemischt, kräftiger als der Hauptbutton', () => {
    expect(rule(".step[aria-pressed='true']")).toMatch(
      /background:\s*color-mix\(in srgb, var\(--accent\) var\(--step-on-mix\), var\(--bg\)\)/,
    );
    const step = percent(token('step-on-mix'));
    expect(step).toBeGreaterThan(percent(token('accent-fill-mix')));
    expect(step).toBeLessThan(100);
  });

  it('Standard-Schaltfläche: kein Rahmen, Fläche surface0', () => {
    expect(rule('button')).toMatch(/border:\s*none/);
    expect(rule('button')).toMatch(/background:\s*var\(--control\)/);
    expect(token('control')).toBe('var(--ctp-surface0)');
  });
});

describe('Spec songbook-view › Kompakte Zeilen (Stylesheet)', () => {
  const rem = (rule: string, prop: string) => {
    const value = rule.match(new RegExp(`(?:^|;)\\s*${prop}:\\s*([\\d.]+)rem`))?.[1];
    return value === undefined ? undefined : Number(value);
  };
  const structureRow = css.match(/(?:^|\})\s*\.structure-row\s*\{([^}]*)\}/)?.[1] ?? '';

  it('Popover wird nicht abgeschnitten: Strukturseite ohne eigenen Scrollbereich', () => {
    const page = css.match(/(?:^|\})\s*\.structure-page\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(page).not.toMatch(/overflow/);
  });

  it('Zeilenmaße: höchstens 1,5rem hoch, höchstens 0,5rem Abstand', () => {
    expect(rem(structureRow, 'height')).toBeLessThanOrEqual(1.5);
    expect(rem(structureRow, 'margin-top')).toBeLessThanOrEqual(0.5);
  });
});
