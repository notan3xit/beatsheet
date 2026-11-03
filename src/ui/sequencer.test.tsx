import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { NotationModel } from '../notation/model';
import * as renderer from '../notation/render/vexflow';
import { notebookWith } from '../test/notebook';
import { emptyBeats, patternOf } from '../test/patterns';
import type { Pattern } from '../domain/types';
import { App } from './App';

/** Pattern liegt in einem Song und ist im Pattern-Editor geöffnet. */
function setup(pattern: Pattern) {
  const { store, patternsNow } = notebookWith([pattern]);
  const user = userEvent.setup();
  render(<App store={store} />);
  const current = () => patternsNow()[0]!;
  return { store, user, current };
}

const grid = () => screen.getByRole('grid', { name: 'Sequencer' });
const row = (label: string) => within(grid()).getByRole('row', { name: new RegExp(`^${label}`) });
const cell = (instrument: string, beat: number, position: number) =>
  within(grid()).getByRole('button', { name: `${instrument}, Beat ${beat}, Position ${position}` });

describe('Spec pattern-sequencer › Instrumentenset', () => {
  it('Zeilen des Rasters', () => {
    setup(patternOf(emptyBeats(4)));
    const headers = within(grid()).getAllByRole('rowheader').map((h) => h.textContent);
    expect(headers).toEqual([
      'Crash',
      'Ride',
      'Hi-Hat (geschlossen)',
      'Hi-Hat (offen)',
      'Tom 1',
      'Tom 2',
      'Snare',
      'Standtom',
      'Bassdrum',
      'Hi-Hat-Pedal',
    ]);
  });
});

describe('Spec pattern-sequencer › Raster aus Beats und Positionen', () => {
  it('Gemischte Unterteilung', () => {
    setup(patternOf([{}, {}, { sub: 3 }, {}]));
    const snare = row('Snare');
    const perBeat = [1, 2, 3, 4].map(
      (beat) => within(snare).getAllByRole('button', { name: new RegExp(`Beat ${beat},`) }).length,
    );
    expect(perBeat).toEqual([4, 4, 3, 4]);
    expect(within(grid()).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining('Beat 1'), expect.stringContaining('Beat 4')]),
    );
  });
});

describe('Spec pattern-sequencer › Schläge setzen und entfernen (UI)', () => {
  it('Schlag setzen und entfernen', async () => {
    const { user, current } = setup(patternOf(emptyBeats(4)));
    await user.click(cell('Bassdrum', 1, 1));
    expect(current().beats[0]!.hits.kick).toEqual([0]);
    expect(cell('Bassdrum', 1, 1)).toHaveAttribute('aria-pressed', 'true');
    await user.click(cell('Bassdrum', 1, 1));
    expect(current().beats[0]!.hits.kick).toBeUndefined();
    expect(cell('Bassdrum', 1, 1)).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('Spec pattern-sequencer › Unterteilung pro Beat (UI)', () => {
  it('Beat auf Triolen umstellen', async () => {
    const { user, current } = setup(patternOf(emptyBeats(4)));
    await user.selectOptions(screen.getByLabelText('Unterteilung Beat 2'), '8tel-Triolen');
    expect(current().beats.map((b) => b.subdivision)).toEqual([4, 3, 4, 4]);
    expect(within(row('Snare')).getAllByRole('button', { name: /Beat 2,/ })).toHaveLength(3);
  });
});

describe('Spec pattern-sequencer › Unterteilung Zweiunddreißigstel (UI)', () => {
  it('Bezeichnungen in der Auswahl; Beat auf Zweiunddreißigstel umstellen', async () => {
    const { user, current } = setup(patternOf(emptyBeats(4)));
    const select = screen.getByLabelText('Unterteilung Beat 1');
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
      '8tel',
      '16tel',
      '32tel',
      '8tel-Triolen',
      '16tel-Triolen',
      '32tel-Triolen',
    ]);
    await user.selectOptions(select, '32tel');
    expect(current().beats.map((b) => b.subdivision)).toEqual([8, 4, 4, 4]);
    expect(within(row('Snare')).getAllByRole('button', { name: /Beat 1,/ })).toHaveLength(8);
  });

  it('Beat auf 32tel-Triolen umstellen', async () => {
    const { user, current } = setup(patternOf(emptyBeats(4)));
    await user.selectOptions(screen.getByLabelText('Unterteilung Beat 2'), '32tel-Triolen');
    expect(current().beats.map((b) => b.subdivision)).toEqual([4, 12, 4, 4]);
    expect(within(row('Snare')).getAllByRole('button', { name: /Beat 2,/ })).toHaveLength(12);
  });

  it('Zweiunddreißigstel nach Sechzehntel mit Verlust fragt nach', async () => {
    const { user, current } = setup(patternOf([{ sub: 8, hits: { snare: [1, 2] } }]));
    await user.selectOptions(screen.getByLabelText('Unterteilung Beat 1'), '16tel');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(current().beats[0]).toEqual({ subdivision: 4, hits: { snare: [0] } });
  });
});

describe('Spec pattern-sequencer › Schläge beim Wechsel der Unterteilung (UI)', () => {
  it('Sechzehntel nach Triole mit Verlust: Ablehnung', async () => {
    const { user, current } = setup(patternOf([{ hits: { kick: [1, 2] } }]));
    await user.selectOptions(screen.getByLabelText('Unterteilung Beat 1'), '8tel-Triolen');
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(/verloren/);
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(current().beats[0]).toEqual({ subdivision: 4, hits: { kick: [0, 1] } });
    expect(screen.getByLabelText('Unterteilung Beat 1')).toHaveValue('4');
  });

  it('Sechzehntel nach Triole mit Verlust: Bestätigung', async () => {
    const { user, current } = setup(patternOf([{ hits: { kick: [1, 2] } }]));
    await user.selectOptions(screen.getByLabelText('Unterteilung Beat 1'), '8tel-Triolen');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(current().beats[0]).toEqual({ subdivision: 3, hits: { kick: [0] } });
  });

  it('Ohne Verlust keine Nachfrage', async () => {
    const { user, current } = setup(patternOf([{ hits: { hihat: [1, 3] } }]));
    await user.selectOptions(screen.getByLabelText('Unterteilung Beat 1'), '8tel');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(current().beats[0]).toEqual({ subdivision: 2, hits: { hihat: [0, 1] } });
  });
});

describe('Spec pattern-sequencer › Änderungen rückgängig machen (UI)', () => {
  it('Rückgängig und Wiederherstellen', async () => {
    const { user, current } = setup(patternOf(emptyBeats(4)));
    expect(screen.getByRole('button', { name: 'Rückgängig' })).toBeDisabled();
    await user.click(cell('Snare', 2, 1));
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    expect(current().beats[1]!.hits.snare).toBeUndefined();
    await user.click(screen.getByRole('button', { name: 'Wiederherstellen' }));
    expect(current().beats[1]!.hits.snare).toEqual([0]);
  });

  it('Tastenkürzel Strg+Z und Strg+Y', async () => {
    const { user, current } = setup(patternOf(emptyBeats(4)));
    await user.click(cell('Snare', 2, 1));
    await user.keyboard('{Control>}z{/Control}');
    expect(current().beats[1]!.hits.snare).toBeUndefined();
    await user.keyboard('{Control>}y{/Control}');
    expect(current().beats[1]!.hits.snare).toEqual([0]);
  });
});

describe('Spec pattern-sequencer › Notenvorschau beim Bearbeiten', () => {
  it('Vorschau aktualisiert sich', async () => {
    const spy = vi.spyOn(renderer, 'renderNotation');
    const { user } = setup(patternOf(emptyBeats(4)));
    expect(screen.getByRole('img', { name: /Noten/ })).toBeInTheDocument();
    await user.click(cell('Snare', 2, 1));
    const model = spy.mock.lastCall![0] as NotationModel;
    const snareInBeat2 = model.measures[0]!.voices.up[1]!.events.some((e) =>
      e.keys.some((k) => k.instrument === 'snare'),
    );
    expect(snareInBeat2).toBe(true);
    spy.mockRestore();
  });
});

describe('Spec pattern-sequencer › Spielweise eines Schlags (UI)', () => {
  /** Zelle unabhängig vom Namenszusatz der Spielweise. */
  const cellAt = (instrument: string, beat: number, position: number) =>
    within(grid()).getByRole('button', { name: new RegExp(`^${instrument}, Beat ${beat}, Position ${position}(,|$)`) });
  const shiftClick = async (user: ReturnType<typeof userEvent.setup>, el: HTMLElement) => {
    await user.keyboard('{Shift>}');
    await user.click(el);
    await user.keyboard('{/Shift}');
  };

  it('Spielweise durchschalten', async () => {
    const { user, current } = setup(patternOf([{ hits: { snare: [1] } }]));
    const seen: [string | null, string][] = [];
    for (let i = 0; i < 3; i++) {
      await shiftClick(user, cellAt('Snare', 1, 1));
      const el = cellAt('Snare', 1, 1);
      seen.push([el.getAttribute('data-articulation'), el.getAttribute('aria-label')!]);
    }
    expect(seen).toEqual([
      ['flam', 'Snare, Beat 1, Position 1, Flam'],
      ['ghost', 'Snare, Beat 1, Position 1, Ghost Note'],
      [null, 'Snare, Beat 1, Position 1'],
    ]);
    expect(current().beats[0]!.hits.snare).toEqual([0]);
  });

  it('Flam auf leerer Zelle', async () => {
    const { user, current } = setup(patternOf(emptyBeats(1)));
    await shiftClick(user, cellAt('Tom 1', 1, 3));
    expect(current().beats[0]!.hits).toEqual({ tom1: [2] });
    expect(cellAt('Tom 1', 1, 3)).toHaveAttribute('aria-pressed', 'true');
    expect(cellAt('Tom 1', 1, 3)).toHaveAttribute('data-articulation', 'flam');
  });

  it('Shift-Klick auf der Hi-Hat', async () => {
    const { user, current } = setup(patternOf([{ hits: { hihat: [1] } }]));
    const before = current();
    await shiftClick(user, cellAt('Hi-Hat \\(geschlossen\\)', 1, 1));
    await shiftClick(user, cellAt('Hi-Hat \\(geschlossen\\)', 1, 2));
    expect(current()).toBe(before);
  });

  it('Anzeige in der Zelle', async () => {
    const { user } = setup(patternOf([{ hits: { snare: [1] } }]));
    await shiftClick(user, cellAt('Snare', 1, 1));
    await shiftClick(user, cellAt('Snare', 1, 1));
    expect(cellAt('Snare', 1, 1)).toHaveAccessibleName(/Ghost Note$/);
    expect(cellAt('Snare', 1, 1)).toHaveAttribute('data-articulation', 'ghost');
  });

  it('Rückgängig nach Shift-Klick', async () => {
    const { user, current } = setup(patternOf([{ hits: { snare: [1] } }]));
    await shiftClick(user, cellAt('Snare', 1, 1));
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    expect(current().beats[0]).toEqual({ subdivision: 4, hits: { snare: [0] } });
    expect(cellAt('Snare', 1, 1)).not.toHaveAttribute('data-articulation');
  });
});
