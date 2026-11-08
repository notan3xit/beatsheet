import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { flavors } from '@catppuccin/palette';
import { describe, expect, it } from 'vitest';
import { PATTERN_COLORS, type PatternColor } from '../domain/types';

const css = readFileSync(resolve(process.cwd(), 'src/ui/styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

type Rgba = [number, number, number, number];
type Variant = 'latte' | 'mocha';

const declarations = (block: string) =>
  Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
const lightTokens = declarations(css.match(/:root\s*\{([^}]*)\}/)![1]!);
const darkTokens = declarations(css.match(/:root\[data-theme='dark'\]\s*\{([^}]*)\}/)![1]!);

/** Trennt an Kommas außerhalb von Klammern. */
function splitArguments(text: string): string[] {
  const parts = [''];
  let depth = 0;
  for (const char of text) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) parts.push('');
    else parts[parts.length - 1] += char;
  }
  return parts.map((p) => p.trim());
}

/** Rechnet einen CSS-Farbausdruck aus Tokens und Palette aus, wie der Browser `color-mix` in srgb. */
function colorResolver(variant: Variant, pattern: PatternColor) {
  const tokens: Record<string, string> = {
    ...lightTokens,
    ...(variant === 'mocha' ? darkTokens : {}),
    pc: `var(--ctp-${pattern})`,
  };
  const palette = (name: string): Rgba => {
    const { r, g, b } = flavors[variant].colors[name as keyof typeof flavors.latte.colors].rgb;
    return [r, g, b, 1];
  };
  const value = (expression: string): string => {
    const reference = expression.match(/^var\(--((?!ctp-)[a-z0-9-]+)\)$/);
    if (!reference) return expression;
    const token = tokens[reference[1]!];
    if (token === undefined) throw new Error(`Unbekanntes Token: ${reference[1]}`);
    return value(token);
  };
  const color = (expression: string): Rgba => {
    const text = value(expression);
    if (text === 'transparent') return [0, 0, 0, 0];
    const ctp = text.match(/^var\(--ctp-([a-z0-9]+)\)$/);
    if (ctp) return palette(ctp[1]!);
    const mix = text.match(/^color-mix\(in srgb, (.*)\)$/);
    if (!mix) throw new Error(`Unbekannter Farbausdruck: ${text}`);
    const [first, second] = splitArguments(mix[1]!);
    const split = first!.lastIndexOf(' ');
    const share = parseFloat(value(first!.slice(split + 1))) / 100;
    const [a, b] = [color(first!.slice(0, split)), color(second!)];
    const alpha = a[3] * share + b[3] * (1 - share);
    const channel = (i: number) => (alpha ? (a[i]! * a[3] * share + b[i]! * b[3] * (1 - share)) / alpha : 0);
    return [channel(0), channel(1), channel(2), alpha];
  };
  return color;
}

const over = (top: Rgba, under: Rgba): Rgba => {
  const blend = (i: number) => top[i]! * top[3] + under[i]! * (1 - top[3]);
  return [blend(0), blend(1), blend(2), 1];
};
const luminance = ([r, g, b]: Rgba) => {
  const linear = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};
const contrast = (a: Rgba, b: Rgba) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
};

/** Patternfarben, deren Paar den Mindestkontrast verfehlt. */
function failures(variant: Variant, foreground: string, background: string, page: string, minimum: number) {
  return PATTERN_COLORS.flatMap((pattern) => {
    const color = colorResolver(variant, pattern);
    const fill = over(color(background), color(page));
    const ratio = contrast(over(color(foreground), fill), fill);
    return ratio < minimum ? [`${pattern}: ${ratio.toFixed(2)}`] : [];
  });
}

const tint = (share: string) => `color-mix(in srgb, var(--pc) var(--${share}), transparent)`;
const onBase = (share: string) => `color-mix(in srgb, var(--pc) var(--${share}), var(--bg))`;
const toText = (share: string) => `color-mix(in srgb, var(--pc) var(--${share}), var(--text))`;
const soft = (color: string, share: number) => `color-mix(in srgb, var(--${color}) ${share}%, transparent)`;

const BG = 'var(--bg)';
const SURFACE = 'var(--surface)';

/** Schrift, Fläche und die Seite darunter. */
const READING: [string, string, string][] = [
  ['var(--text)', BG, BG],
  ['var(--text)', SURFACE, BG],
  ['var(--text)', 'var(--control)', BG],
  ['var(--muted)', BG, BG],
  ['var(--muted)', SURFACE, BG],
  // Übetempo eingeschaltet (practice-tempo)
  ['var(--text)', 'color-mix(in srgb, var(--playhead) var(--practice-on-mix), var(--bg))', BG],
  ['var(--danger-text)', BG, BG],
  ['var(--danger-text)', 'var(--control)', BG],
  ['var(--danger-text)', soft('danger', 15), BG],
  ['var(--text)', soft('success', 20), BG],
  ['var(--text)', soft('warning', 25), BG],
  ['var(--on-accent-fill)', 'color-mix(in srgb, var(--accent) var(--accent-fill-mix), var(--bg))', BG],
  ['var(--text)', tint('tint-groove'), SURFACE],
  ['var(--text)', tint('tint-fill'), SURFACE],
  ['var(--text)', tint('tint-strong'), SURFACE],
  ['var(--text)', tint('tint-card'), SURFACE],
  ['var(--text)', tint('tint-chip'), BG],
  ['var(--text)', onBase('tint-drag'), BG],
  ['var(--on-accent-fill)', onBase('chip-on-mix'), BG],
  ['var(--avatar-text)', onBase('avatar-mix'), BG],
  [toText('name-mix'), SURFACE, BG],
  [toText('name-tinted-mix'), tint('tint-card'), SURFACE],
  [toText('name-strong-mix'), tint('tint-strong'), SURFACE],
];

const TEXT_ROLES = [
  'var(--text)',
  'var(--muted)',
  'var(--danger-text)',
  'var(--on-accent-fill)',
  'var(--avatar-text)',
  // Beschriftung auf vollen Flächen in Textfarbe
  'var(--bg)',
  // Symbole der Abspiel-Knöpfe
  'var(--playhead)',
  'inherit',
];
const NAME_ROLE = /^color-mix\(in srgb, var\(--pc\) var\(--name[a-z-]*\), var\(--text\)\)$/;

describe.each(['latte', 'mocha'] as const)('Spec design-system › Kontraste in %s', (variant) => {
  it.each(READING)('Lesekontrast: %s auf %s', (foreground, background, page) => {
    expect(failures(variant, foreground, background, page, 4.5)).toEqual([]);
  });

  it('Zustandskontrast: Rahmen in Patternfarbe auf der Seitenfläche', () => {
    expect(failures(variant, toText('edge-mix'), SURFACE, BG, 3)).toEqual([]);
  });

  it('Zustandskontrast: Rahmen des eingeschalteten Übetempos', () => {
    expect(failures(variant, 'var(--playhead)', BG, BG, 3)).toEqual([]);
    expect(failures(variant, 'var(--playhead)', SURFACE, BG, 3)).toEqual([]);
  });

  it('Zustandskontrast: Symbol des grauen Abspiel-Knopfs', () => {
    expect(failures(variant, 'var(--muted)', 'var(--control)', BG, 3)).toEqual([]);
  });

  it('Zustandskontrast: Rahmen der laufenden Teil-Schleife auf ihrer Fläche', () => {
    const fill = 'color-mix(in srgb, var(--ghost) var(--loop-range-mix), transparent)';
    expect(failures(variant, 'var(--loop-range-edge)', fill, SURFACE, 3)).toEqual([]);
  });

  // Markierungen im Vergleichs-Sequencer (song-history) und Punkt für Neues (song-activity), gegen die Seitenflächen
  it.each(['var(--mark-added)', 'var(--mark-changed)', 'var(--mark-removed)', 'var(--new-mark)'])('Zustandskontrast: %s', (mark) => {
    expect(failures(variant, mark, BG, BG, 3)).toEqual([]);
    expect(failures(variant, mark, SURFACE, BG, 3)).toEqual([]);
  });
});

describe('Spec design-system › Rollen der Schriftfarben', () => {
  it('Jede Schriftfarbe im Stylesheet ist eine Text-Rolle', () => {
    const colors = [...css.matchAll(/(?:^|[\s;{])color:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(colors.length).toBeGreaterThan(0);
    expect(colors.filter((c) => !TEXT_ROLES.includes(c) && !NAME_ROLE.test(c))).toEqual([]);
  });

  it('Mischungen mit der Patternfarbe nennen ihren Anteil über ein Token', () => {
    expect(css.match(/var\(--pc(?:,[^)]*\)?)?\)\s+\d+%/g) ?? []).toEqual([]);
  });
});
