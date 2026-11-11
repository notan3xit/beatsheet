import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { AccountApi } from '../account/api';
import { createAccountSession } from '../account/session';
import { createNotebookStore } from '../state/notebookStore';
import { fakePlayer } from '../test/fakePlayer';
import { App } from './App';
import { signedInAs } from '../test/accounts';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const css = read('src/ui/styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
const token = (name: string) => css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
const rule = (selector: string) =>
  css.match(new RegExp(`(?:^|\\})\\s*${selector.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

function setup() {
  const account: AccountApi = {
    session: vi.fn(async () => null),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, ...signedInAs('ich@example.com') })),
    logout: vi.fn(async () => ({ ok: true as const })),
  };
  const session = createAccountSession(account);
  session.setSession(null);
  render(<App store={createNotebookStore([])} session={session} player={fakePlayer().player} />);
  const heading = screen.getByRole('heading', { name: 'Beatsheet' });
  return { heading, beet: heading.querySelector('svg.logo-beet'), word: heading.querySelector('.logo-word') };
}

const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const es = (word: Element | null) => [...(word?.querySelectorAll('svg.logo-e') ?? [])];
const lines = (e: Element) => [...e.querySelectorAll('line')];
const num = (el: Element, attr: string) => Number(el.getAttribute(attr));

describe('Spec app-header › Logo in der Kopfzeile', () => {
  it('Aufbau: Menü-Knopf, Beeten-Symbol, Schriftzug, Konto-Symbol', () => {
    const { heading, beet, word } = setup();
    const menu = screen.getByRole('button', { name: 'Menü' });
    const account = screen.getByRole('button', { name: 'Anmelden' });
    expect(beet).toBeInTheDocument();
    expect(word).toBeInTheDocument();
    expect(follows(menu, heading)).toBe(true);
    expect(follows(beet!, word!)).toBe(true);
    expect(follows(heading, account)).toBe(true);
  });

  it('Zugänglicher Name: Überschrift „Beatsheet“, Symbol und Striche verborgen', () => {
    const { heading } = setup();
    expect(heading).toHaveAccessibleName('Beatsheet');
    const svgs = [...heading.querySelectorAll('svg')];
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) expect(svg.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('Spec app-header › Beeten-Symbol', () => {
  it('Farben im Hell- und Dunkelmodus: Knolle aus mauve und maroon, Blätter green', () => {
    const { beet } = setup();
    const bulb = beet!.querySelector('.logo-bulb');
    const leaves = beet!.querySelectorAll('.logo-leaf');
    expect(bulb).toHaveAttribute('fill', 'var(--logo-beet)');
    expect(leaves.length).toBeGreaterThan(0);
    for (const leaf of leaves) expect(leaf).toHaveAttribute('fill', 'var(--logo-leaf)');
    expect(token('logo-beet')).toMatch(/var\(--ctp-mauve\).*var\(--ctp-maroon\)/);
    expect(token('logo-leaf')).toBe('var(--ctp-green)');
  });

  it('Höher als die Kleinbuchstaben und vertikal zentriert', () => {
    expect(Number(rule('.logo-beet').match(/height:\s*([\d.]+)em/)?.[1])).toBeGreaterThan(1);
    expect(rule('.logo')).toMatch(/align-items:\s*center/);
  });
});

describe('Spec app-header › Schrift des Schriftzugs', () => {
  it('Schrift: Buchstaben als Text in Comfortaa fett, übrige Oberfläche unverändert', () => {
    const { word } = setup();
    const parts = [...word!.childNodes].map((n) => (n.nodeType === Node.TEXT_NODE ? n.textContent : 'e'));
    expect(parts.join('')).toBe('beatsheet');
    expect(parts[0]).toBe('beatsh');
    expect(rule('.logo-word')).toMatch(/font-family:\s*'Comfortaa',/);
    expect(rule('.logo-word')).toMatch(/font-weight:\s*700/);
    expect(css.match(/Comfortaa/g)).toHaveLength(1);
    expect(css.match(/:root\s*\{[^}]*font-family:\s*system-ui/)).not.toBeNull();
  });

  it('Keine fremde Quelle: Schrift aus dem eigenen Paket mit relativen Adressen', () => {
    expect(read('src/main.tsx')).toMatch(/import '@fontsource\/comfortaa\/700\.css';/);
    const urls = [...read('node_modules/@fontsource/comfortaa/700.css').matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]!);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((u) => !u.startsWith('./'))).toEqual([]);
    expect(read('index.html')).not.toMatch(/https?:\/\//);
  });
});

describe('Spec app-header › „e“ aus drei Strichen', () => {
  it('Form: drei waagerechte Striche, runde Enden, der mittlere kürzer und links bündig', () => {
    const { word } = setup();
    expect(es(word)).toHaveLength(2);
    for (const e of es(word)) {
      const [top, mid, bottom] = lines(e);
      expect(lines(e)).toHaveLength(3);
      for (const l of lines(e)) {
        expect(num(l, 'y1')).toBe(num(l, 'y2'));
        expect(l).toHaveAttribute('stroke-linecap', 'round');
      }
      expect(num(top!, 'x1')).toBe(num(mid!, 'x1'));
      expect(num(top!, 'x1')).toBe(num(bottom!, 'x1'));
      expect(num(top!, 'x2')).toBe(num(bottom!, 'x2'));
      expect(num(mid!, 'x2')).toBeLessThan(num(top!, 'x2'));
    }
  });

  it('Höhe wie die Kleinbuchstaben: Striche füllen genau 1 ex ab der Grundlinie', () => {
    const { word } = setup();
    for (const e of es(word)) {
      const height = Number(e.getAttribute('viewBox')!.split(' ')[3]);
      const [top, , bottom] = lines(e);
      const half = (l: Element) => num(l, 'stroke-width') / 2;
      expect(num(top!, 'y1') - half(top!)).toBe(0);
      expect(num(bottom!, 'y1') + half(bottom!)).toBe(height);
    }
    expect(rule('.logo-e')).toMatch(/height:\s*1ex/);
    expect(rule('.logo-e')).toMatch(/vertical-align:\s*baseline/);
  });

  it('Farben: Akzentfarbe ungleich red, je „e“ verschieden', () => {
    const { word } = setup();
    for (const e of es(word)) {
      const colors = lines(e).map((l) => {
        const name = l.getAttribute('stroke')?.match(/^var\(--(logo-e\d-\d)\)$/)?.[1];
        return name && token(name);
      });
      for (const c of colors) expect(c).toMatch(/^var\(--ctp-(?!red\b)[a-z]+\)$/);
      expect(new Set(colors).size).toBe(3);
    }
  });
});
