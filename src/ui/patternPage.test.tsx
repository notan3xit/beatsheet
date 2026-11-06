import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setSongMeter } from '../domain/meter';
import { createPattern } from '../domain/pattern';
import { allBars } from '../domain/songPatterns';
import { appendSegment, setBarProps } from '../domain/structure';
import type { Pattern } from '../domain/types';
import { notebookWith } from '../test/notebook';
import { App } from './App';

function seed(...specs: { kind: 'groove' | 'fill'; name: string; length?: number }[]): Pattern[] {
  const result: Pattern[] = [];
  for (const spec of specs) result.push(createPattern(result, spec));
  return result;
}

function setup(patterns: Pattern[]) {
  const notebook = notebookWith(patterns, 'book');
  const user = userEvent.setup();
  // Trefferprüfung beim Ziehen: nie ein Takt (jsdom hat kein elementFromPoint)
  render(<App store={notebook.store} hitTest={() => null} />);
  return { ...notebook, user };
}

const patternPage = () => screen.getByRole('region', { name: 'Patterns' });
const cardOf = (name: string) =>
  within(patternPage())
    .getAllByRole('article')
    .find((card) => within(card).getByRole('heading').textContent === name)!;

describe('Spec songbook-view › Patternseite (UI)', () => {
  it('Reihenfolge: Karten wie im Song, Grooves und Fills gemischt', () => {
    const [a, b, f1] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' }, { kind: 'fill', name: 'f1' });
    const { store } = setup([a!, b!, f1!]);
    act(() =>
      store.updateSong((s) => {
        const withBars = appendSegment(s, { name: 'V', bars: 3, grooveId: b!.id });
        const [, second, third] = allBars(withBars);
        return setBarProps(setBarProps(withBars, [second!.id], { fillId: f1!.id }), [third!.id], { grooveId: a!.id });
      }),
    );
    const names = within(patternPage())
      .getAllByRole('article')
      .map((card) => within(card).getByRole('heading').textContent);
    expect(names).toEqual(['B', 'f1', 'A']);
  });
});

describe('Spec songbook-view › Kompakte Pattern-Karten (UI)', () => {
  it('Fill und Groove unterscheiden', () => {
    setup(seed({ kind: 'groove', name: 'Verse-Beat' }, { kind: 'fill', name: 'Tom-Fill' }));
    expect(cardOf('Tom-Fill')).toHaveClass('pattern-card', 'fill');
    expect(cardOf('Tom-Fill')).not.toHaveClass('groove');
    expect(cardOf('Verse-Beat')).toHaveClass('pattern-card', 'groove');
    expect(cardOf('Verse-Beat')).not.toHaveClass('fill');
  });

  it('Kopfzeile', () => {
    setup(seed({ kind: 'groove', name: 'Verse-Beat', length: 4 }));
    const header = cardOf('Verse-Beat').querySelector('header')!;
    expect(header).toHaveTextContent(/^Verse-Beat4 Beats$/);
    expect(header).not.toHaveTextContent('Groove');
    expect(header).not.toHaveTextContent('Bearbeiten');
    const buttons = within(header).getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName('Verse-Beat bearbeiten');
    expect(buttons[0]).toHaveTextContent(/^Verse-Beat$/);
  });

  it('Langer Name: der vollständige Name ist als Tooltip verfügbar', () => {
    setup(seed({ kind: 'groove', name: 'Verse-Beat mit Ghost Notes', length: 4 }));
    const name = within(cardOf('Verse-Beat mit Ghost Notes').querySelector('header')!).getByRole('button');
    expect(name).toHaveAttribute('title', 'Verse-Beat mit Ghost Notes');
  });

  it('Name öffnet den Editor', async () => {
    const { user } = setup(seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'Verse-Beat' }));
    await user.click(within(cardOf('Verse-Beat')).getByText('Verse-Beat'));
    expect(screen.getByRole('region', { name: 'Pattern bearbeiten' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Verse-Beat' })).toBeInTheDocument();
  });

  it('Anlegen-Knöpfe', () => {
    setup([]);
    const page = within(patternPage());
    expect(page.getByRole('button', { name: 'Neuer Groove' })).toHaveTextContent(/^\+ Groove$/);
    expect(page.getByRole('button', { name: 'Neuer Fill' })).toHaveTextContent(/^\+ Fill$/);
  });

  it('Noten der Karte ohne Rahmen in Kartengröße', async () => {
    const { user } = setup(seed({ kind: 'groove', name: 'A' }));
    await user.click(within(cardOf('A')).getByRole('button', { name: 'A bearbeiten' }));
    await user.click(screen.getByRole('button', { name: 'Snare, Beat 1, Position 1' }));
    expect(screen.getByRole('img', { name: 'Noten: A' })).toHaveClass('notation');
    await user.click(within(screen.getByRole('navigation', { name: 'Pfad' })).getAllByRole('button').at(-1)!);
    const notes = within(cardOf('A')).getByRole('img', { name: 'Noten: A' });
    expect(notes).toHaveClass('notation-card');
    expect(notes).not.toHaveClass('notation');
  });

  it('Ziehen am Namen öffnet den Editor nicht', () => {
    const { currentSong } = setup(seed({ kind: 'groove', name: 'A' }));
    const name = within(cardOf('A')).getByRole('button', { name: 'A bearbeiten' });
    const mouse = { pointerType: 'mouse', button: 0, pointerId: 1 };
    fireEvent.pointerDown(name, { ...mouse, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(document, { ...mouse, clientX: 40, clientY: 30 });
    fireEvent.pointerUp(document, { ...mouse, clientX: 40, clientY: 30 });
    fireEvent.click(name);
    expect(screen.queryByRole('region', { name: 'Pattern bearbeiten' })).not.toBeInTheDocument();
    expect(currentSong().patterns).toHaveLength(1);
  });
});

describe('Spec drum-notation › Notensystem (Taktart im Notenbild)', () => {
  const staves = (name: string) => cardOf(name).querySelectorAll('.vf-stave').length;

  it('Taktart des Songs ändern', () => {
    const { store } = setup(seed({ kind: 'groove', name: 'Verse', length: 4 }));
    expect(staves('Verse')).toBe(1);
    act(() => store.updateSong((s) => setSongMeter(s, 3)));
    expect(staves('Verse')).toBe(2);
  });

  it('Eigene Taktart bestimmt die Taktstriche', () => {
    const [groove] = seed({ kind: 'groove', name: 'Refrain', length: 6 });
    setup([{ ...groove!, meter: 6 }]);
    expect(staves('Refrain')).toBe(1);
  });
});
