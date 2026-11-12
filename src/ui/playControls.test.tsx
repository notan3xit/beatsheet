import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { appendSegment } from '../domain/structure';
import type { Pattern } from '../domain/types';
import { fakePlayer } from '../test/fakePlayer';
import { notebookWith } from '../test/notebook';
import { patternOf } from '../test/patterns';
import { App } from './App';

const named = (name: string): Pattern => ({ ...patternOf(Array.from({ length: 4 }, () => ({ hits: { kick: [1] } }))), name });

/** Song mit den Grooves A und B und den Segmenten Verse und Chorus, geöffnet und entsperrt auf der Doppelseite. */
function setup(open: 'book' | 'pattern' = 'book') {
  const [a, b] = [named('A'), named('B')];
  const notebook = notebookWith([a, b], open);
  act(() =>
    notebook.store.updateSong((s) =>
      ['Verse', 'Chorus'].reduce((song, name) => appendSegment(song, { name, bars: 2, grooveId: a.id }), s),
    ),
  );
  const fake = fakePlayer();
  const user = userEvent.setup();
  render(<App store={notebook.store} player={fake.player} />);
  return { ...notebook, ...fake, user };
}

const structure = () => screen.getByRole('region', { name: 'Struktur' });
const bar = (n: number) => within(structure()).getByRole('button', { name: `Takt ${n}` });
const barPopover = () => screen.getByRole('dialog', { name: 'Takt-Auswahl' });
const segmentPopover = (name: string) => screen.getByRole('dialog', { name: `Segment ${name}` });
const button = (name: string, root: HTMLElement = document.body) => within(root).getByRole('button', { name });

function expectPlayButton(button: HTMLElement, symbol: 'play' | 'loop' | 'stop', label: string) {
  expect(button).toHaveAttribute('data-symbol', symbol);
  expect(button).toHaveTextContent('');
  expect(button.querySelector('svg')).not.toBeNull();
  expect(button).toHaveAccessibleName(label);
  expect(button).toHaveAttribute('title', label);
}

describe('Spec playback-controls › Abspiel-Symbole', () => {
  it('Kopf der Doppelseite', () => {
    setup();
    expectPlayButton(button('Song abspielen'), 'play', 'Song abspielen');
    expectPlayButton(button('Song in Schleife abspielen'), 'loop', 'Song in Schleife abspielen');
  });

  it('Sequencer', () => {
    setup('pattern');
    expectPlayButton(button('Einmal abspielen'), 'play', 'Einmal abspielen');
    expectPlayButton(button('In Schleife abspielen'), 'loop', 'In Schleife abspielen');
  });

  it('Takt-Overlay', async () => {
    const { user } = setup();
    await user.click(bar(1));
    expectPlayButton(button('Ab hier abspielen', barPopover()), 'play', 'Ab hier abspielen');
    expectPlayButton(button('In Schleife abspielen', barPopover()), 'loop', 'In Schleife abspielen');
  });

  it('Segment-Overlay', async () => {
    const { user } = setup();
    await user.click(within(structure()).getByRole('button', { name: 'Chorus' }));
    expectPlayButton(button('Ab hier abspielen', segmentPopover('Chorus')), 'play', 'Ab hier abspielen');
    expectPlayButton(button('In Schleife abspielen', segmentPopover('Chorus')), 'loop', 'In Schleife abspielen');
  });

  it('Während der Wiedergabe des Songs', async () => {
    const { user } = setup();
    await user.click(button('Song abspielen'));
    expectPlayButton(button('Stopp'), 'stop', 'Stopp');
  });

  it('Während der Wiedergabe eines Patterns', async () => {
    const { user } = setup('pattern');
    await user.click(button('In Schleife abspielen'));
    expectPlayButton(button('Stopp'), 'stop', 'Stopp');
    expectPlayButton(button('Einmal abspielen'), 'play', 'Einmal abspielen');
  });

  it('Während der Schleife des Songs', async () => {
    const { user } = setup();
    await user.click(button('Song in Schleife abspielen'));
    expectPlayButton(button('Stopp'), 'stop', 'Stopp');
    expectPlayButton(button('Song abspielen'), 'play', 'Song abspielen');
  });

  it('Overlay während der Wiedergabe', async () => {
    const { user, player, source } = setup();
    await user.click(button('Song abspielen'));
    await user.click(bar(1));
    expect(button('Ab hier abspielen', barPopover())).toHaveAttribute('data-symbol', 'play');
    expect(button('In Schleife abspielen', barPopover())).toHaveAttribute('data-symbol', 'loop');
    await user.click(button('In Schleife abspielen', barPopover()));
    expect(player.start).toHaveBeenCalledTimes(2);
    expect(source().loop).toBe(true);
  });
});

describe('Spec playback-controls › Overlay schließt beim Abspielen', () => {
  const nothingOpen = () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const selected = () =>
    [...structure().querySelectorAll('.bar-frame[aria-pressed="true"], .segment-select[aria-pressed="true"]')].map(
      (el) => el.getAttribute('aria-label') ?? el.textContent,
    );

  it('Aus dem Takt-Overlay', async () => {
    const { user, player, source, currentSong } = setup();
    await user.click(bar(2));
    await user.keyboard('{Shift>}');
    await user.click(bar(3));
    await user.keyboard('{/Shift}');
    await user.click(button('In Schleife abspielen', barPopover()));
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(source().loop).toBe(true);
    const ids = currentSong().segments.flatMap((s) => s.blocks).flatMap((b) => b.bars).map((b) => b.id);
    expect(source().timeline()!.marks.map((m) => m.mark)).toEqual(ids.slice(1, 3));
    nothingOpen();
    expect(selected()).toEqual(['Takt 2', 'Takt 3']);
    expect(player.stop).not.toHaveBeenCalled();
  });

  it('Aus dem Segment-Overlay', async () => {
    const { user, player } = setup();
    await user.click(within(structure()).getByRole('button', { name: 'Chorus' }));
    await user.click(button('Ab hier abspielen', segmentPopover('Chorus')));
    expect(player.start).toHaveBeenCalledTimes(1);
    nothingOpen();
    expect(selected()).toEqual(['Chorus']);
  });

  it('Popover wieder öffnen', async () => {
    const { user, player } = setup();
    await user.click(bar(2));
    await user.keyboard('{Shift>}');
    await user.click(bar(3));
    await user.keyboard('{/Shift}');
    await user.click(button('In Schleife abspielen', barPopover()));
    await user.click(bar(3));
    expect(within(barPopover()).getByRole('heading', { name: 'Takte 2–3' })).toBeInTheDocument();
    expect(selected()).toEqual(['Takt 2', 'Takt 3']);
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(player.stop).not.toHaveBeenCalled();
  });

  it('Im gesperrten Song', async () => {
    const { user, player, store } = setup();
    act(() => store.setLocked(true));
    await user.click(bar(1));
    await user.click(button('Ab hier abspielen', barPopover()));
    expect(player.start).toHaveBeenCalledTimes(1);
    nothingOpen();
    expect(selected()).toEqual(['Takt 1']);
  });
});

describe('Spec playback-controls › Farbe der Wiedergabe', () => {
  it('Nicht laufender Modus', async () => {
    const { user } = setup('pattern');
    expect(button('Einmal abspielen')).not.toHaveClass('idle');
    await user.click(button('In Schleife abspielen'));
    expect(button('Einmal abspielen')).toHaveClass('idle');
    expect(button('Stopp')).not.toHaveClass('idle');
  });
});

describe('Spec playback-controls › Moduswechsel während der Wiedergabe', () => {
  it('Von Schleife zu einmal', async () => {
    const { user, player } = setup('pattern');
    await user.click(button('In Schleife abspielen'));
    await user.click(button('Einmal abspielen'));
    expect(player.setLoop).toHaveBeenLastCalledWith(false);
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(player.stop).not.toHaveBeenCalled();
    expectPlayButton(button('Stopp'), 'stop', 'Stopp');
    expect(button('In Schleife abspielen')).toHaveClass('idle');
  });

  it('Von einmal zu Schleife', async () => {
    const { user, player } = setup();
    await user.click(button('Song abspielen'));
    await user.click(button('Song in Schleife abspielen'));
    expect(player.setLoop).toHaveBeenLastCalledWith(true);
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(button('Song abspielen')).toHaveClass('idle');
  });

  it('Bereich aus dem Overlay', async () => {
    const { user, player, source, currentSong } = setup();
    await user.click(bar(2));
    await user.keyboard('{Shift>}');
    await user.click(bar(3));
    await user.keyboard('{/Shift}');
    await user.click(button('In Schleife abspielen', barPopover()));
    await user.click(button('Song abspielen'));
    expect(player.setLoop).toHaveBeenLastCalledWith(false);
    expect(player.start).toHaveBeenCalledTimes(1);
    const ids = currentSong().segments.flatMap((s) => s.blocks).flatMap((b) => b.bars).map((b) => b.id);
    expect(source().timeline()!.marks.map((m) => m.mark)).toEqual(ids.slice(1, 3));
  });
});

describe('Spec playback-controls › Anordnung im Kopf', () => {
  const order = (root: HTMLElement, names: (string | RegExp)[]) => {
    const elements = names.map((name) => within(root).getByRole('button', { name }));
    elements.slice(1).forEach((el, i) => expect(elements[i]!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy());
  };

  it('Pattern-Editor', () => {
    setup('pattern');
    order(screen.getByRole('region', { name: 'Pattern bearbeiten' }), [/^Song-Tempo/, 'Einmal abspielen', 'In Schleife abspielen', 'Tempo']);
  });

  it('Doppelseite', () => {
    setup();
    order(document.querySelector('.songbook-header') as HTMLElement, [/^Song-Tempo/, 'Song abspielen', 'Song in Schleife abspielen', 'Tempo']);
  });
});

describe('Spec playback-controls › Gleicher Platz der Abspiel-Knöpfe', () => {
  it('Wiedergabe starten', async () => {
    const { user } = setup('pattern');
    const before = button('In Schleife abspielen');
    const className = before.className;
    await user.click(before);
    expect(button('Stopp')).toBe(before);
    expect(before.className).toBe(className);
  });
});

describe('Spec songbook-view › Aufbau des Takt-Popovers', () => {
  const sections = () => [...barPopover().querySelectorAll<HTMLElement>(':scope > .popover-section')];

  it('Einzelner Takt', async () => {
    const { user } = setup();
    await user.click(bar(1));
    const [head, patterns, accentSection, actions, ...rest] = sections();
    expect(rest).toEqual([]);
    expect(within(head!).getByRole('heading', { name: 'Takt 1' })).toBeInTheDocument();
    expect(within(head!).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual([
      'Ab hier abspielen',
      'In Schleife abspielen',
      'zum Groove',
    ]);
    expect(within(patterns!).getAllByRole('group').map((g) => g.getAttribute('aria-label'))).toEqual(['Groove', 'Fill', 'Länge']);
    expect(within(accentSection!).getByRole('group', { name: 'Akzente' })).toBeInTheDocument();
    expect(within(actions!).getAllByRole('button').map((b) => b.textContent)).toEqual(['Takt davor', 'Takt danach', 'Löschen']);
  });

  it('Mehrere Takte', async () => {
    const { user } = setup();
    await user.click(bar(1));
    await user.keyboard('{Shift>}');
    await user.click(bar(2));
    await user.keyboard('{/Shift}');
    expect(sections()).toHaveLength(3);
    expect(within(barPopover()).queryByRole('group', { name: 'Akzente' })).not.toBeInTheDocument();
    expect(within(sections()[2]!).getAllByRole('button').map((b) => b.textContent)).toEqual(['Takt davor', 'Takt danach', 'Löschen']);
  });
});

describe('Spec songbook-view › Abspiel-Knöpfe zuoberst', () => {
  it('Segment auswählen', async () => {
    const { user } = setup();
    await user.click(within(structure()).getByRole('button', { name: 'Chorus' }));
    const popover = segmentPopover('Chorus');
    const play = button('Ab hier abspielen', popover);
    expect(play.compareDocumentPosition(within(popover).getByLabelText('Segmentname')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(popover).getAllByRole('button')[0]).toBe(play);
  });
});

describe('Spec songbook-view › Einheitliche Zeilen für Groove, Fill und Länge', () => {
  const group = (name: string) => within(barPopover()).getByRole('group', { name });
  const names = (name: string) => within(group(name)).getAllByRole('button').map((b) => b.getAttribute('aria-label'));

  it('Reihenfolge bei den Grooves', async () => {
    const { user } = setup();
    await user.click(bar(1));
    expect(names('Groove')).toEqual(['Kein Groove', 'Neuer Groove', 'A', 'B']);
    expect(within(group('Groove')).getAllByRole('button').map((b) => b.textContent)).toEqual(['−', '+', '✓A', 'B']);
  });

  it('Reihenfolge beim Fill', async () => {
    const { user } = setup();
    await user.click(bar(1));
    expect(names('Fill')).toEqual(['Kein Fill', 'Neuer Fill']);
  });

  it('Reihenfolge bei der Länge', async () => {
    const { user } = setup();
    await user.click(bar(1));
    expect(names('Länge')).toEqual(['Taktlänge verringern', 'Taktlänge erhöhen']);
    const children = [...group('Länge').children];
    expect(children.map((c) => c.textContent)).toEqual(['Länge', '−', '+', '4/4']);
  });

  it('Gleich breite Knöpfe in allen Zeilen', async () => {
    const { user } = setup();
    await user.click(bar(1));
    for (const row of ['Groove', 'Fill', 'Länge']) {
      const [minus, plus] = within(group(row)).getAllByRole('button');
      expect(minus).toHaveClass('step-button');
      expect(plus).toHaveClass('step-button');
    }
  });
});

describe('Spec songbook-view › Kompakte Akzente im Takt-Popover', () => {
  const accents = () => within(barPopover()).getByRole('group', { name: 'Akzente' });

  it('Reihe für einen neuen Akzent', async () => {
    const { user } = setup();
    await user.click(bar(1));
    const row = accents().querySelector('.accent-add') as HTMLElement;
    expect([...row.children].map((c) => c.getAttribute('aria-label') ?? c.textContent)).toEqual([
      'Akzente',
      'Akzent-Instrument',
      'Akzent-Beat',
      'Akzent-Position',
      'Akzent hinzufügen',
    ]);
    expect(within(row).getByRole('button', { name: 'Akzent hinzufügen' })).toHaveTextContent(/^\+$/);
    expect(within(row).getByLabelText('Akzent-Beat')).toHaveAttribute('title', 'Beat');
    expect(within(row).getByLabelText('Akzent-Position')).toHaveAttribute('title', 'Position');
  });

  it('Chip eines Akzents', async () => {
    const { user } = setup();
    await user.click(bar(1));
    await user.click(within(accents()).getByRole('button', { name: 'Akzent hinzufügen' }));
    expect(within(accents()).getByRole('listitem')).toHaveTextContent(/^1\.1 Cr/);
    expect(within(accents()).getByRole('button', { name: 'Crash auf 1.1 entfernen' })).toBeInTheDocument();
  });

  it('Ohne Akzente', async () => {
    const { user } = setup();
    await user.click(bar(1));
    expect(within(accents()).queryByRole('list')).not.toBeInTheDocument();
  });
});

