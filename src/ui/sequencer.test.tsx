import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { NotationModel } from '../notation/model';
import * as renderer from '../notation/render/vexflow';
import { notebookWith } from '../test/notebook';
import { emptyBeats, patternOf } from '../test/patterns';
import type { Pattern } from '../domain/types';
import { changeSubdivision, cycleArticulation, toggleHit } from '../domain/sequencer';
import { App } from './App';
import { ConfirmProvider } from './ConfirmDialog';
import { Sequencer } from './Sequencer';
import { StoreContext } from './useLibrary';

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
      'Floor Tom',
      'Kick Drum',
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
    await user.click(cell('Kick Drum', 1, 1));
    expect(current().beats[0]!.hits.kick).toEqual([0]);
    expect(cell('Kick Drum', 1, 1)).toHaveAttribute('aria-pressed', 'true');
    await user.click(cell('Kick Drum', 1, 1));
    expect(current().beats[0]!.hits.kick).toBeUndefined();
    expect(cell('Kick Drum', 1, 1)).toHaveAttribute('aria-pressed', 'false');
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
    for (let i = 0; i < 6; i++) {
      await shiftClick(user, cellAt('Snare', 1, 1));
      const el = cellAt('Snare', 1, 1);
      seen.push([el.getAttribute('data-articulation'), el.getAttribute('aria-label')!]);
    }
    expect(seen).toEqual([
      ['flam', 'Snare, Beat 1, Position 1, Flam'],
      ['drag', 'Snare, Beat 1, Position 1, Drag'],
      ['ghost', 'Snare, Beat 1, Position 1, Ghost Note'],
      ['rim', 'Snare, Beat 1, Position 1, Rim Shot'],
      ['cross', 'Snare, Beat 1, Position 1, Cross-Stick'],
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
    for (let i = 0; i < 3; i++) await shiftClick(user, cellAt('Snare', 1, 1));
    expect(cellAt('Snare', 1, 1)).toHaveAccessibleName(/Ghost Note$/);
    expect(cellAt('Snare', 1, 1)).toHaveAttribute('data-articulation', 'ghost');
  });

  it('Bell auf der Ride', async () => {
    const { user } = setup(patternOf([{ hits: { ride: [1] } }]));
    await shiftClick(user, cellAt('Ride', 1, 1));
    expect(cellAt('Ride', 1, 1)).toHaveAttribute('data-articulation', 'bell');
    expect(cellAt('Ride', 1, 1)).toHaveAccessibleName(/Bell$/);
    await shiftClick(user, cellAt('Ride', 1, 1));
    expect(cellAt('Ride', 1, 1)).not.toHaveAttribute('data-articulation');
  });

  it('Choke auf leerer Crash-Zelle', async () => {
    const { user, current } = setup(patternOf(emptyBeats(1)));
    await shiftClick(user, cellAt('Crash', 1, 2));
    expect(current().beats[0]).toEqual({ subdivision: 4, hits: { crash: [1] }, articulations: { crash: { 1: 'choke' } } });
    expect(cellAt('Crash', 1, 2)).toHaveAttribute('data-articulation', 'choke');
  });

  it('Rückgängig nach Shift-Klick', async () => {
    const { user, current } = setup(patternOf([{ hits: { snare: [1] } }]));
    await shiftClick(user, cellAt('Snare', 1, 1));
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    expect(current().beats[0]).toEqual({ subdivision: 4, hits: { snare: [0] } });
    expect(cellAt('Snare', 1, 1)).not.toHaveAttribute('data-articulation');
  });
});

describe('Spec pattern-sequencer › Betonung eines Schlags (UI)', () => {
  const cellAt = (instrument: string, beat: number, position: number) =>
    within(grid()).getByRole('button', { name: new RegExp(`^${instrument}, Beat ${beat}, Position ${position}(,|$)`) });
  const clickWith = async (user: ReturnType<typeof userEvent.setup>, key: string, el: HTMLElement) => {
    await user.keyboard(`{${key}>}`);
    await user.click(el);
    await user.keyboard(`{/${key}}`);
  };

  it('Betonung umschalten', async () => {
    const { user, current } = setup(patternOf([{ hits: { hihat: [1] } }]));
    await clickWith(user, 'Control', cellAt('Hi-Hat \\(geschlossen\\)', 1, 1));
    expect(current().beats[0]!.emphasis).toEqual({ hihat: [0] });
    expect(cellAt('Hi-Hat \\(geschlossen\\)', 1, 1)).toHaveAttribute('data-emphasis', 'true');
    await clickWith(user, 'Control', cellAt('Hi-Hat \\(geschlossen\\)', 1, 1));
    expect(current().beats[0]!.emphasis).toBeUndefined();
    expect(cellAt('Hi-Hat \\(geschlossen\\)', 1, 1)).not.toHaveAttribute('data-emphasis');
  });

  it('Mit Cmd auf dem Mac', async () => {
    const { user, current } = setup(patternOf([{ hits: { hihat: [1] } }]));
    await clickWith(user, 'Meta', cellAt('Hi-Hat \\(geschlossen\\)', 1, 1));
    expect(current().beats[0]!.emphasis).toEqual({ hihat: [0] });
  });

  it('Leere Zelle', async () => {
    const { user, current } = setup(patternOf(emptyBeats(1)));
    await clickWith(user, 'Control', cellAt('Kick Drum', 1, 1));
    expect(current().beats[0]).toEqual({ subdivision: 4, hits: { kick: [0] }, emphasis: { kick: [0] } });
    expect(cellAt('Kick Drum', 1, 1)).toHaveAttribute('aria-pressed', 'true');
  });

  it('Anzeige in der Zelle', async () => {
    const { user } = setup(patternOf([{ hits: { snare: [1] } }]));
    for (let i = 0; i < 4; i++) {
      await user.keyboard('{Shift>}');
      await user.click(cellAt('Snare', 1, 1));
      await user.keyboard('{/Shift}');
    }
    await clickWith(user, 'Control', cellAt('Snare', 1, 1));
    expect(cellAt('Snare', 1, 1)).toHaveAttribute('data-articulation', 'rim');
    expect(cellAt('Snare', 1, 1)).toHaveAttribute('data-emphasis', 'true');
    expect(cellAt('Snare', 1, 1)).toHaveAccessibleName('Snare, Beat 1, Position 1, Rim Shot, betont');
  });

  it('Betonung ohne Spielweise im zugänglichen Namen', async () => {
    const { user } = setup(patternOf([{ hits: { kick: [1] } }]));
    await clickWith(user, 'Control', cellAt('Kick Drum', 1, 1));
    expect(cellAt('Kick Drum', 1, 1)).toHaveAccessibleName('Kick Drum, Beat 1, Position 1, betont');
  });

  it('Rückgängig nach Strg-Klick', async () => {
    const { user, current } = setup(patternOf([{ hits: { kick: [1] } }]));
    await clickWith(user, 'Control', cellAt('Kick Drum', 1, 1));
    await user.click(screen.getByRole('button', { name: 'Rückgängig' }));
    expect(current().beats[0]).toEqual({ subdivision: 4, hits: { kick: [0] } });
  });
});

describe('Spec song-history › Markierungen im Vergleichs-Sequencer', () => {
  function renderCompare(pattern: Pattern, compare: Pattern | undefined) {
    const { store } = notebookWith([pattern], 'book');
    render(
      <StoreContext.Provider value={store}>
        <ConfirmProvider>
          <Sequencer pattern={pattern} compare={compare} readOnly />
        </ConfirmProvider>
      </StoreContext.Provider>,
    );
  }
  /** Zelle über den Anfang ihres Namens; Spielweise und Betonung hängen sich an. */
  const at = (instrument: string, beat: number, position: number) =>
    within(grid()).getByRole('button', { name: new RegExp(`^${instrument}, Beat ${beat}, Position ${position}(,|$)`) });
  const mark = (instrument: string, beat: number, position: number) => at(instrument, beat, position).dataset.mark;

  it('Spielweise geändert, neu und entfernt', () => {
    const before = cycleArticulation(toggleHit(toggleHit(patternOf(emptyBeats(2)), 0, 'snare', 1), 0, 'kick', 0), 0, 'snare', 1);
    const after = toggleHit(toggleHit(cycleArticulation(before, 0, 'snare', 1), 0, 'kick', 0), 1, 'kick', 2);
    renderCompare(after, before);
    expect(mark('Snare', 1, 2)).toBe('changed');
    // Das Zeichen der Spielweise bleibt wie im Pattern-Editor
    expect(at('Snare', 1, 2)).toHaveAttribute('data-articulation', 'drag');
    expect(mark('Kick Drum', 1, 1)).toBe('removed');
    expect(at('Kick Drum', 1, 1)).toHaveAttribute('aria-pressed', 'false');
    expect(mark('Kick Drum', 2, 3)).toBe('added');
    expect(mark('Kick Drum', 2, 1)).toBeUndefined();
  });

  it('Unterteilung gewechselt', () => {
    const before = toggleHit(patternOf(emptyBeats(1)), 0, 'snare', 1);
    const after = changeSubdivision(before, 0, 8).pattern;
    renderCompare(after, before);
    expect(mark('Snare', 1, 3)).toBeUndefined();
    expect(at('Snare', 1, 3)).toHaveAttribute('aria-pressed', 'true');
  });

  it('Ohne Vergleichsstand keine Markierungen', () => {
    renderCompare(toggleHit(patternOf(emptyBeats(1)), 0, 'kick', 0), undefined);
    expect(mark('Kick Drum', 1, 1)).toBeUndefined();
  });
});
