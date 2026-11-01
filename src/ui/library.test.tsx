import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import type { Pattern } from '../domain/types';
import { createLibraryStore } from '../state/libraryStore';
import { App } from './App';

function seed(...specs: { kind: 'groove' | 'fill'; name: string; length?: number }[]): Pattern[] {
  const result: Pattern[] = [];
  for (const spec of specs) result.push(createPattern(result, spec));
  return result;
}

function setup(patterns: Pattern[] = []) {
  const store = createLibraryStore(patterns);
  const user = userEvent.setup();
  render(<App store={store} />);
  return { store, user };
}

const library = () => screen.getByRole('navigation', { name: 'Bibliothek' });
const section = (name: 'Grooves' | 'Fills') => within(library()).getByRole('region', { name });

describe('Spec pattern-library › Bibliotheksübersicht (UI)', () => {
  it('Gruppierte Übersicht', () => {
    setup(seed({ kind: 'groove', name: 'Verse' }, { kind: 'groove', name: 'Chorus' }, { kind: 'fill', name: 'Tom-Run' }));
    const grooves = within(section('Grooves')).getAllByRole('listitem');
    expect(grooves.map((li) => li.textContent)).toEqual(['Chorus4 Beats', 'Verse4 Beats']);
    const fills = within(section('Fills')).getAllByRole('listitem');
    expect(fills.map((li) => li.textContent)).toEqual(['Tom-Run1 Beat']);
  });

  it('Leere Bibliothek', () => {
    setup();
    expect(within(library()).getByText(/Noch keine Patterns/)).toBeInTheDocument();
  });
});

describe('Spec pattern-library › Pattern anlegen (UI)', () => {
  it('Groove und Fill über die Bibliothek anlegen', async () => {
    const { store, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Neuer Groove' }));
    await user.click(screen.getByRole('button', { name: 'Neuer Fill' }));
    const kinds = store.getState().patterns.map((p) => [p.kind, p.beats.length]);
    expect(kinds).toEqual([
      ['groove', 4],
      ['fill', 1],
    ]);
    expect(within(section('Grooves')).getByText('Groove 1')).toBeInTheDocument();
  });
});

describe('Spec pattern-library › Pattern-Namen (UI)', () => {
  it('Leerer Name wird abgelehnt', async () => {
    const { store, user } = setup(seed({ kind: 'groove', name: 'Verse' }));
    await user.click(within(library()).getByText('Verse'));
    const input = screen.getByLabelText('Name');
    await user.clear(input);
    await user.type(input, '   ');
    await user.tab();
    expect(store.getState().patterns[0]!.name).toBe('Verse');
    expect(input).toHaveValue('Verse');
  });
});

describe('Spec pattern-library › Länge eines Patterns ändern (UI)', () => {
  function withSnareOnBeat3() {
    const [p] = seed({ kind: 'groove', name: 'Verse' });
    p!.beats[2] = { subdivision: 4, hits: { snare: [0] } };
    return [p!];
  }

  it('Kürzen mit Inhalt: Ablehnung lässt Pattern unverändert', async () => {
    const { store, user } = setup(withSnareOnBeat3());
    await user.click(within(library()).getByText('Verse'));
    await user.selectOptions(screen.getByLabelText('Länge (Beats)'), '2');
    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(store.getState().patterns[0]!.beats).toHaveLength(4);
    expect(screen.getByLabelText('Länge (Beats)')).toHaveValue('4');
  });

  it('Kürzen mit Inhalt: Bestätigung kürzt', async () => {
    const { store, user } = setup(withSnareOnBeat3());
    await user.click(within(library()).getByText('Verse'));
    await user.selectOptions(screen.getByLabelText('Länge (Beats)'), '2');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(store.getState().patterns[0]!.beats).toHaveLength(2);
  });

  it('Kürzen ohne Inhalt', async () => {
    const { store, user } = setup(seed({ kind: 'groove', name: 'Verse' }));
    await user.click(within(library()).getByText('Verse'));
    await user.selectOptions(screen.getByLabelText('Länge (Beats)'), '2');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(store.getState().patterns[0]!.beats).toHaveLength(2);
  });

  it('Verlängern', async () => {
    const { store, user } = setup(seed({ kind: 'groove', name: 'Verse' }));
    await user.click(within(library()).getByText('Verse'));
    await user.selectOptions(screen.getByLabelText('Länge (Beats)'), '8');
    expect(store.getState().patterns[0]!.beats).toHaveLength(8);
    expect(within(section('Grooves')).getByText('8 Beats')).toBeInTheDocument();
  });
});

describe('Spec pattern-library › Pattern duplizieren (UI)', () => {
  it('Groove duplizieren', async () => {
    const { store, user } = setup(seed({ kind: 'groove', name: 'Verse' }));
    await user.click(within(library()).getByText('Verse'));
    await user.click(screen.getByRole('button', { name: 'Duplizieren' }));
    const names = store.getState().patterns.map((p) => p.name);
    expect(names).toEqual(['Verse', 'Verse (Kopie)']);
    expect(within(section('Grooves')).getByText('Verse (Kopie)')).toBeInTheDocument();
  });
});

describe('Spec pattern-library › Pattern löschen (UI)', () => {
  it('Löschen bestätigt', async () => {
    const { store, user } = setup(seed({ kind: 'groove', name: 'Verse' }, { kind: 'fill', name: 'Tom-Run' }));
    await user.click(within(library()).getByText('Verse'));
    await user.click(screen.getByRole('button', { name: 'Löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(store.getState().patterns.map((p) => p.name)).toEqual(['Tom-Run']);
    expect(within(library()).queryByText('Verse')).not.toBeInTheDocument();
  });

  it('Löschen abgebrochen', async () => {
    const { store, user } = setup(seed({ kind: 'groove', name: 'Verse' }));
    await user.click(within(library()).getByText('Verse'));
    await user.click(screen.getByRole('button', { name: 'Löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(store.getState().patterns.map((p) => p.name)).toEqual(['Verse']);
  });
});
