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
