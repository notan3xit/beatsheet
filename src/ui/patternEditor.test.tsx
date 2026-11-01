import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import { appendSegment } from '../domain/structure';
import type { Pattern } from '../domain/types';
import { notebookWith } from '../test/notebook';
import { App } from './App';

function seed(...specs: { kind: 'groove' | 'fill'; name: string; length?: number }[]): Pattern[] {
  const result: Pattern[] = [];
  for (const spec of specs) result.push(createPattern(result, spec));
  return result;
}

/** Song mit den Patterns, geöffnet auf der Doppelseite oder im Editor des ersten Patterns. */
function setup(patterns: Pattern[], open: 'book' | 'pattern' = 'pattern') {
  const notebook = notebookWith(patterns, open);
  const user = userEvent.setup();
  render(<App store={notebook.store} />);
  return { ...notebook, user };
}

const patternPage = () => screen.getByRole('region', { name: 'Patterns' });

describe('Spec pattern-library › Pattern anlegen (UI)', () => {
  it('Groove und Fill über die Patternseite anlegen', async () => {
    const { user, patternsNow } = setup([], 'book');
    await user.click(within(patternPage()).getByRole('button', { name: 'Neuer Groove' }));
    await user.click(screen.getByRole('button', { name: 'Zurück zum Song' }));
    await user.click(within(patternPage()).getByRole('button', { name: 'Neuer Fill' }));
    expect(patternsNow().map((p) => [p.kind, p.beats.length, p.name])).toEqual([
      ['groove', 4, 'Groove 1'],
      ['fill', 1, 'Fill 1'],
    ]);
    expect(screen.getByLabelText('Name')).toHaveValue('Fill 1');
  });
});

describe('Spec pattern-library › Pattern-Namen (UI)', () => {
  it('Leerer Name wird abgelehnt', async () => {
    const { user, patternsNow } = setup(seed({ kind: 'groove', name: 'Verse' }));
    const input = screen.getByLabelText('Name');
    await user.clear(input);
    await user.type(input, '   ');
    await user.tab();
    expect(patternsNow()[0]!.name).toBe('Verse');
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
    const { user, patternsNow } = setup(withSnareOnBeat3());
    await user.selectOptions(screen.getByLabelText('Länge (Beats)'), '2');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(patternsNow()[0]!.beats).toHaveLength(4);
    expect(screen.getByLabelText('Länge (Beats)')).toHaveValue('4');
  });

  it('Kürzen mit Inhalt: Bestätigung kürzt', async () => {
    const { user, patternsNow } = setup(withSnareOnBeat3());
    await user.selectOptions(screen.getByLabelText('Länge (Beats)'), '2');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(patternsNow()[0]!.beats).toHaveLength(2);
  });

  it('Kürzen ohne Inhalt', async () => {
    const { user, patternsNow } = setup(seed({ kind: 'groove', name: 'Verse' }));
    await user.selectOptions(screen.getByLabelText('Länge (Beats)'), '2');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(patternsNow()[0]!.beats).toHaveLength(2);
  });

  it('Verlängern', async () => {
    const { user, patternsNow } = setup(seed({ kind: 'groove', name: 'Verse' }));
    await user.selectOptions(screen.getByLabelText('Länge (Beats)'), '8');
    expect(patternsNow()[0]!.beats).toHaveLength(8);
  });
});

describe('Spec pattern-library › Pattern duplizieren (UI)', () => {
  it('Groove duplizieren', async () => {
    const { user, patternsNow } = setup(seed({ kind: 'groove', name: 'Verse' }));
    await user.click(screen.getByRole('button', { name: 'Duplizieren' }));
    expect(patternsNow().map((p) => p.name)).toEqual(['Verse', 'Verse (Kopie)']);
    expect(screen.getByLabelText('Name')).toHaveValue('Verse (Kopie)');
  });
});

describe('Spec pattern-library › Pattern löschen (UI)', () => {
  it('Löschen bestätigt', async () => {
    const { user, patternsNow } = setup(seed({ kind: 'groove', name: 'Verse' }, { kind: 'fill', name: 'Tom-Run' }));
    await user.click(screen.getByRole('button', { name: 'Löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(patternsNow().map((p) => p.name)).toEqual(['Tom-Run']);
    expect(within(patternPage()).queryByText('Verse')).not.toBeInTheDocument();
  });

  it('Löschen abgebrochen', async () => {
    const { user, patternsNow } = setup(seed({ kind: 'groove', name: 'Verse' }));
    await user.click(screen.getByRole('button', { name: 'Löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(patternsNow().map((p) => p.name)).toEqual(['Verse']);
  });

  it('Verwendetes Pattern löschen', async () => {
    const patterns = seed({ kind: 'groove', name: 'A' });
    const { store, user, currentSong } = setup(patterns, 'book');
    store.updateSong((song) => appendSegment(song, { name: 'Verse', bars: 12, grooveId: patterns[0]!.id }));
    store.openPattern(patterns[0]!.id);
    await user.click(await screen.findByRole('button', { name: 'Löschen' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('12 Takten');
    await user.click(within(dialog).getByRole('button', { name: 'Bestätigen' }));
    const bars = currentSong().segments[0]!.blocks[0]!.bars;
    expect(bars).toHaveLength(12);
    expect(bars.every((b) => b.grooveId === null)).toBe(true);
  });
});
