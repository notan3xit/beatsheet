import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
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

describe('Spec songbook-view › Zweispaltige Patternseite', () => {
  it('Kurze Patterns nebeneinander', () => {
    setup(seed({ kind: 'groove', name: 'A', length: 4 }, { kind: 'groove', name: 'B', length: 4 }));
    for (const name of ['A', 'B']) {
      expect(cardOf(name).parentElement).toHaveClass('pattern-grid');
      expect(cardOf(name)).not.toHaveClass('wide');
    }
  });

  it('Langes Pattern über beide Spalten', () => {
    setup(seed({ kind: 'groove', name: 'A', length: 8 }, { kind: 'fill', name: 'f1', length: 2 }));
    expect(cardOf('A')).toHaveClass('wide');
    expect(cardOf('f1')).not.toHaveClass('wide');
    expect(cardOf('f1').parentElement).toHaveClass('pattern-grid');
  });
});

describe('Spec songbook-view › Kompakte Pattern-Karten (UI)', () => {
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

  it('Name öffnet den Editor', async () => {
    const { user } = setup(seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'Verse-Beat' }));
    await user.click(within(cardOf('Verse-Beat')).getByText('Verse-Beat'));
    expect(screen.getByRole('region', { name: 'Pattern bearbeiten' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Verse-Beat');
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
    await user.click(screen.getByRole('button', { name: 'Zurück zum Song' }));
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
