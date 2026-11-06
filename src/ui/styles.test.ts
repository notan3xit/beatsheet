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

describe('Spec color-theme › Farbschema folgt der Systemeinstellung (Stylesheet)', () => {
  it('Dunkle Werte hängen am Attribut, nicht an der Media Query', () => {
    expect(css).toMatch(/:root\[data-theme='dark'\]\s*\{/);
    expect(css).not.toContain('prefers-color-scheme');
  });
});

describe('Spec color-theme › Akzentflächen je nach Variante tonal oder voll', () => {
  const darkBlock = css.match(/:root\[data-theme='dark'\]\s*\{([^}]*)\}/)?.[1] ?? '';
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

  it('gesetzte Sequencer-Zellen bleiben beim Überfahren im Akzentton', () => {
    expect(rule(".step[aria-pressed='true']:hover:not(:disabled)")).toMatch(
      /background:\s*color-mix\(in srgb, var\(--accent\) var\(--step-on-hover-mix\), var\(--bg\)\)/,
    );
    expect(rule(".step[data-articulation='ghost']:hover:not(:disabled)")).toMatch(/background:\s*color-mix\(in srgb, var\(--accent\) \d+%, var\(--bg\)\)/);
    // Hell dunkler als die gesetzte Zelle, dunkel gedämpft: in beiden Fällen sichtbar, nie grau
    expect(percent(token('step-on-hover-mix'))).toBeGreaterThan(percent(token('step-on-mix')));
    expect(percent(dark('step-on-hover-mix'))).toBeLessThan(percent(dark('step-on-mix')));
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

/** Stylesheet ohne @container-Blöcke: nur Regeln auf oberster Ebene. */
const topLevel = (() => {
  let out = '';
  let i = 0;
  for (let start = css.indexOf('@container'); start >= 0; start = css.indexOf('@container', i)) {
    out += css.slice(i, start);
    let depth = 0;
    i = css.indexOf('{', start);
    do {
      if (css[i] === '{') depth++;
      if (css[i] === '}') depth--;
      i++;
    } while (depth > 0);
  }
  return out + css.slice(i);
})();

/** Deklarationen einer Regel mit genau diesem Selektor, auf oberster Ebene oder im übergebenen Block. */
const ruleBody = (selector: string, scope = topLevel) =>
  scope.match(new RegExp(`(?:^|[}{])\\s*${selector.replace(/[.()[\]'*+?^$|]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
const decl = (body: string, prop: string) => body.match(new RegExp(`(?:^|;)\\s*${prop}:\\s*([^;]+);`))?.[1]?.trim();
/** Inhalt eines @container-Blocks mit dieser Bedingung (eine Verschachtelungsebene). */
const containerBlock = (condition: string) => {
  const start = css.indexOf(`@container ${condition}`);
  if (start < 0) return '';
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return '';
};
const remOf = (value: string | undefined) => Number(value?.match(/^([\d.]+)rem$/)?.[1]);

describe('Spec songbook-view › Doppelseite (Stylesheet)', () => {
  // Maße in rem bei 16px; Fensterbreite minus Rand der Doppelseite (.songbook) links und rechts
  const songbookPadding = remOf(css.match(/\.songbook,\s*\.workspace\s*\{[^}]*padding:\s*[\d.]+rem ([\d.]+rem);/)?.[1]);
  const available = (px: number) => px / 16 - 2 * songbookPadding;
  const gutter = remOf(decl(ruleBody('.structure-page'), '--row-gutter'));
  /** Wert eines calc()-Ausdrucks in rem (rem, px, var(--row-gutter)). */
  const evalRem = (value = '') =>
    Number(
      new Function(
        `return ${value
          .replace(/^calc/, '')
          .replace(/var\(--row-gutter\)/g, String(gutter))
          .replace(/([\d.]+)px/g, '($1 / 16)')
          .replace(/([\d.]+)rem/g, '$1')}`,
      )(),
    );

  const threshold = Number(css.match(/@container \(min-width: ([\d.]+)rem\)\s*\{\s*\.pages\s*\{/)?.[1]);
  const wide = containerBlock(`(min-width: ${threshold}rem)`);
  const structure = ruleBody('.structure-page', wide);
  const patterns = ruleBody('.pattern-page', wide);
  const gap = remOf(decl(ruleBody('.pages'), 'gap'));
  const structureBasis = evalRem(decl(ruleBody('.structure-page'), '--structure-width'));
  const structureMax = evalRem(decl(ruleBody('.structure-page'), '--structure-max'));
  const patternBasis = remOf(decl(patterns, 'flex')?.split(' ')[2]);
  const patternMax = evalRem(decl(patterns, 'max-width'));

  /** Breiten beider Seiten in rem, nachgerechnet wie Flexbox mit Wachstum 3:2 und Höchstbreiten. */
  function layout(px: number) {
    const width = available(px);
    if (width < threshold) return { side: false, structure: width, patterns: width };
    const free = width - gap - structureBasis - patternBasis;
    let s = structureBasis + (free * 3) / 5;
    let p = patternBasis + (free * 2) / 5;
    if (s > structureMax) [s, p] = [structureMax, Math.min(patternMax, width - gap - structureMax)];
    if (p > patternMax) [s, p] = [Math.min(structureMax, width - gap - patternMax), patternMax];
    return { side: true, structure: s, patterns: p };
  }

  it('Ohne Bedingung untereinander; nebeneinander ab der Summe der Basisbreiten, 3:2 mit Höchstbreiten', () => {
    expect(css).toMatch(/\.songbook\s*\{[^}]*container-type:\s*inline-size/);
    expect(decl(ruleBody('.pages'), 'flex-direction')).toBe('column');
    expect(decl(ruleBody('.pages', wide), 'flex-direction')).toBe('row');
    expect(decl(ruleBody('.structure-page'), '--structure-width')).toBe('calc(16 * 2.25rem + var(--row-gutter) + 2rem + 2px)');
    expect(decl(ruleBody('.structure-page'), '--structure-max')).toBe('calc(16 * 3rem + var(--row-gutter) + 2rem + 2px)');
    expect(decl(structure, 'flex')).toBe('3 1 var(--structure-width)');
    expect(decl(structure, 'max-width')).toBe('var(--structure-max)');
    expect(decl(patterns, 'flex')).toMatch(/^2 1 [\d.]+rem$/);
    expect(threshold).toBeCloseTo(structureBasis + gap + patternBasis, 5);
  });

  it('Tablet quer: bei 1024 px nebeneinander, die Struktur in voller Breite pro Beat', () => {
    const at = layout(1024);
    expect(at.side).toBe(true);
    expect(at.structure).toBeGreaterThanOrEqual(structureBasis);
  });

  it('Tablet hochkant: bei 768 px untereinander, gleich breit, mindestens volle Breite pro Beat', () => {
    const at = layout(768);
    expect(at.side).toBe(false);
    expect(at.structure).toBe(at.patterns);
    expect(at.structure).toBeGreaterThanOrEqual(structureBasis);
  });

  it('Großes Fenster: bei 1650 px Struktur breiter als bei 1024 px, Patternseite höchstens zwei Spalten', () => {
    expect(layout(1650).structure).toBeGreaterThan(layout(1024).structure);
    expect(layout(1650).patterns).toBeLessThanOrEqual(patternMax);
    // Inhalt der Patternseite an der Höchstbreite: zwei Spalten zu 15rem samt Spaltenabstand
    expect(decl(patterns, 'max-width')).toBe('calc(2 * 15rem + 0.75rem + 2rem + 2px)');
  });
});

describe('Spec songbook-view › Maßstabsgetreue Struktur (Stylesheet)', () => {
  it('Smartphone hochkant: --beat folgt der Breite der Strukturseite, höchstens 3rem', () => {
    const page = ruleBody('.structure-page');
    expect(decl(page, 'container-type')).toBe('inline-size');
    expect(decl(page, '--beat')).toBe('min(3rem, (100cqw - var(--row-gutter)) / 16)');
    expect(decl(ruleBody('.page'), 'min-width')).toBe('0');
  });
});

describe('Spec songbook-view › Karten im Fluss (Stylesheet)', () => {
  const grid = () => ruleBody('.pattern-grid');
  const card = () => ruleBody('.pattern-card');

  it('Kurze Patterns nebeneinander: Karten in natürlicher Breite in umbrechenden Zeilen', () => {
    expect(decl(grid(), 'display')).toBe('flex');
    expect(decl(grid(), 'flex-wrap')).toBe('wrap');
    expect(decl(card(), 'flex')).toBe('0 1 auto');
    expect(decl(card(), 'width')).toBeUndefined();
  });

  it('Umbruch in Reihenfolge: keine Spalten, kein Umsortieren, Zeilenabstand wie zwischen Segmenten', () => {
    expect(css).not.toMatch(/grid-auto-flow|(?<![-\w])order:/);
    expect(css).not.toMatch(/\.pattern-card\.wide/);
    expect(css).not.toMatch(/@container \(min-width: 28\.5rem\)/);
    const segmentGap = decl(ruleBody('.segment + .segment'), 'margin-top');
    expect(decl(grid(), 'gap')?.split(' ')[0]).toBe(segmentGap);
  });

  it('Langes Pattern: höchstens so breit wie die Patternseite, Noten schrumpfen erst darüber', () => {
    expect(decl(card(), 'max-width')).toBe('100%');
    expect(decl(ruleBody('.notation-card svg'), 'max-width')).toBe('100%');
  });

  it('Kurzer Fill: mindestens 7,5rem, Kopfzeile ohne Einfluss auf die Kartenbreite', () => {
    expect(decl(card(), 'min-width')).toBe('min(7.5rem, 100%)');
    expect(decl(ruleBody('.pattern-card-header'), 'contain')).toBe('inline-size');
  });
});

describe('Spec songbook-view › Kompakte Pattern-Karten (Stylesheet): Fill und Groove unterscheiden', () => {
  it('Fill-Karte ringsum gerahmt und getönt, wie die Fill-Blöcke der Struktur', () => {
    const fill = ruleBody('.pattern-card.fill');
    expect(decl(fill, 'border')).toBe('1px solid var(--pc)');
    expect(decl(fill, 'background')).toMatch(/^color-mix\(in srgb, var\(--pc\) \d+%, transparent\)$/);
    expect(decl(ruleBody('.item.fill'), 'border')).toBe('1px solid var(--pc)');
  });

  it('Groove-Karte nur mit Kante links, ohne Tönung', () => {
    const groove = ruleBody('.pattern-card.groove');
    expect(decl(groove, 'border-left')).toBe('3px solid var(--pc)');
    expect(decl(groove, 'background')).toBeUndefined();
    expect(decl(ruleBody('.pattern-card'), 'border-left')).toBeUndefined();
  });
});

describe('Spec songbook-view › Kompakte Pattern-Karten (Stylesheet)', () => {
  it('Langer Name: einzeilig, mit „…“ gekürzt statt umgebrochen', () => {
    const name = ruleBody('.pattern-name');
    expect(decl(name, 'white-space')).toBe('nowrap');
    expect(decl(name, 'overflow')).toBe('hidden');
    expect(decl(name, 'text-overflow')).toBe('ellipsis');
    expect(name).not.toMatch(/overflow-wrap/);
    expect(decl(ruleBody('.pattern-card h3'), 'min-width')).toBe('0');
    expect(decl(ruleBody('.pattern-meta'), 'flex')).toBe('none');
  });
});

describe('Spec app-messages › Ebenen der Oberfläche (Stylesheet)', () => {
  const zIndexOf = (selector: string) =>
    new RegExp(`(?:^|\\n)${selector.replace(/[.]/g, '\\.')} \\{[^}]*z-index: ([^;]+);`).exec(css)?.[1]?.trim();
  const level = (name: string) => Number(token(`z-${name}`));

  it('Jedes z-index verweist auf ein Token', () => {
    const values = [...css.matchAll(/z-index:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(values.length).toBeGreaterThan(0);
    expect(values.filter((value) => !/^var\(--z-[a-z0-9-]+\)$/.test(value))).toEqual([]);
  });

  it('Jedes verwendete Token ist definiert', () => {
    for (const [, name] of css.matchAll(/var\(--z-([a-z0-9-]+)\)/g)) expect(Number.isInteger(level(name!))).toBe(true);
  });

  it('Reihenfolge: Inhalt, Meldungen, Popover, Dialoge, gezogene Elemente', () => {
    const order = ['local-1', 'local-2', 'local-3', 'messages', 'popover', 'modal', 'drag'].map(level);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(new Set(order).size).toBe(order.length);
  });

  it.each([
    ['.app-notes', 'messages'],
    ['.account-form', 'popover'],
    ['.app-menu', 'popover'],
    ['.card-popover', 'popover'],
    ['.structure-popover', 'popover'],
    ['.backdrop', 'modal'],
    ['.drag-image', 'drag'],
    ['.drag-tile', 'drag'],
  ])('%s liegt auf der Ebene %s', (selector, name) => {
    expect(zIndexOf(selector)).toBe(`var(--z-${name})`);
  });
});

describe('Spec account-auth › Stabile Anordnung im Anmeldedialog (Stylesheet)', () => {
  it.each(['.login-form', '.login-form .field'])('%s ist ein Block ohne gap: Eingefügtes bekommt keinen Abstand', (selector) => {
    const rule = css.match(new RegExp(`${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`))?.[1];
    expect(rule).toMatch(/display:\s*block/);
    expect(rule).not.toMatch(/gap/);
  });
});

describe('Spec app-header › Anmeldedialog (Stylesheet)', () => {
  it('Kontrast zum Hintergrund: Der Schleier dunkelt in beiden Farbschemata ab', () => {
    expect(token('backdrop')).toContain('--ctp-text');
    expect(css.match(/:root\[data-theme='dark'\][\s\S]*?--backdrop:\s*([^;]+);/)?.[1]).toContain('--ctp-crust');
  });

  it('Kontrast zum Hintergrund: Dialoge heben sich mit Rand ab', () => {
    const rule = css.match(/(?:^|\n)\.dialog\s*\{([^}]*)\}/)?.[1];
    expect(rule).toMatch(/background:\s*var\(--bg\)/);
    expect(rule).toMatch(/border:\s*1px solid var\(--border\)/);
  });
});

describe('Spec account-auth › Stabile Anordnung: freigehaltener Platz (Stylesheet)', () => {
  it('Die Meldungsstelle reserviert zwei Zeilen', () => {
    expect(css.match(/\.login-message\s*\{([^}]*)\}/)?.[1]).toMatch(/min-height:\s*calc\(2 \* /);
  });
});

describe('Spec workbook-sync › Hervorhebung beim Ziehen (Stylesheet)', () => {
  const rule = (selector: string) => css.match(new RegExp(`(?:^|\\n|,\\s*)${selector.replace(/[.[\]'=]/g, (c) => `\\${c}`)}\\s*(?:,[^{]*)?\\{([^}]*)\\}`))?.[1] ?? '';

  it('Gewähltes Workbook als eine Fläche: Randfarbe statt outline, die Kante zum Bereich bleibt offen', () => {
    const target = rule('.workbook-entry.drop-target');
    expect(target).toMatch(/border-color:\s*var\(--accent\)/);
    expect(target).not.toMatch(/outline/);
    expect(rule('.workbook-main.drop-target')).toMatch(/border-color:\s*var\(--accent\)/);
    expect(rule(".workbook-entry[aria-pressed='true'].drop-target")).toMatch(/border-right-color:\s*var\(--drop-fill\)/);
  });

  it('Beim Ziehen hebt nichts außer dem Ziel sich hervor', () => {
    expect(css).toMatch(/body\.dragging-pattern \.tile-add:hover[^{]*\{[^}]*background:\s*none/);
    expect(css).toMatch(/body\.dragging-pattern \.tile:hover[^{]*\{[^}]*border-color:\s*var\(--border\)/);
  });
});

describe('Spec app-header › Konto-Symbol (Stylesheet)', () => {
  it('Angemeldet ohne eigene Farbe', () => {
    expect(css.match(/\.icon\.filled\s*\{([^}]*)\}/)?.[1]).not.toMatch(/(?:^|\s)color:/);
  });
});

describe('Spec account-auth › Code neu senden (Stylesheet)', () => {
  it('Knöpfe des Anmeldeformulars bleiben einzeilig', () => {
    expect(css).toMatch(/\.login-form \.dialog-actions button\s*\{[^}]*white-space:\s*nowrap/);
  });

  it('Textknopf ohne Hintergrund steht links', () => {
    const rule = css.match(/\.text-button\s*\{([^}]*)\}/)?.[1];
    expect(rule).toMatch(/background:\s*none/);
    expect(rule).toMatch(/margin-right:\s*auto/);
  });
});

describe('Spec navigation › Gleiche Höhe der Kopfzeile', () => {
  it('Doppelseite und Pattern-Editor teilen ihren Innenabstand', () => {
    expect(css).toMatch(/\.songbook,\s*\.workspace\s*\{[^}]*padding:/);
    expect(css).not.toMatch(/(?<!,\s*)\n\.(songbook|workspace)\s*\{[^}]*padding:/);
  });
});

describe('Spec playback-controls › Farbe der Wiedergabe', () => {
  const rule = (selector: string) => css.match(new RegExp(`(?:^|\\n)${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

  it('Abspiel-Knöpfe tragen die Farbe der Wiedergabeposition', () => {
    expect(rule('\\.play-button')).toMatch(/color:\s*var\(--playhead\)/);
    expect(rule('\\.playhead-line')).toContain('var(--playhead)');
    expect(rule('\\.play-button')).not.toContain('--accent');
    expect(rule('\\.play-button')).not.toContain('--danger');
  });
});

describe('Spec song-lock › Gleiche Anordnung beim Entsperren', () => {
  it('Höhe der Kopfzeile: Knöpfe teilen sich eine feste Höhe', () => {
    const shared = css.match(/\.play-button,\s*\.lock-toggle,\s*\.page-title \.danger,\s*\.editor-actions button\s*\{[^}]*\}/)?.[0] ?? '';
    expect(shared).toMatch(/height:\s*2rem/);
  });
});

describe('Spec color-theme › Farben ausschließlich aus der Palette: Mischfarbe im Logo', () => {
  const logoTokens = [...css.matchAll(/--(logo-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()] as const);
  const palette = /^var\(--ctp-(?!red\b)[a-z0-9]+\)$/;
  const mixWithBase = /^color-mix\(in srgb, var\(--(?:ctp-(?!red\b)[a-z0-9]+|logo-[a-z0-9-]+)\) \d+%, var\(--bg\)\)$/;
  const mixOfTwo = /^color-mix\(in srgb, var\(--ctp-(?!red\b)[a-z0-9]+\) \d+%, var\(--ctp-(?!red\b)[a-z0-9]+\)\)$/;

  it('Jede Logo-Farbe ist Palettenfarbe, Mischung mit base oder Mischung zweier Palettenfarben außer red', () => {
    expect(logoTokens.length).toBeGreaterThan(0);
    const invalid = logoTokens.filter(([, v]) => !palette.test(v) && !mixWithBase.test(v) && !mixOfTwo.test(v));
    expect(invalid).toEqual([]);
  });

  it('Die Beete mischt mauve und maroon', () => {
    expect(token('logo-beet')).toMatch(/^color-mix\(in srgb, var\(--ctp-mauve\) \d+%, var\(--ctp-maroon\)\)$/);
  });

  it('red bleibt allein --danger vorbehalten', () => {
    expect(css.match(/var\(--ctp-red\)/g)).toHaveLength(1);
  });
});
