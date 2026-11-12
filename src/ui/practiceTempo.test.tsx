import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setTempo } from '../domain/playback';
import { appendSegment } from '../domain/structure';
import type { Pattern, Song } from '../domain/types';
import { createPracticeStore } from '../state/practice';
import { fakePlayer } from '../test/fakePlayer';
import { notebookWith } from '../test/notebook';
import { patternOf } from '../test/patterns';
import { App } from './App';

const groove = (): Pattern => ({ ...patternOf(Array.from({ length: 4 }, () => ({ hits: { kick: [1] } }))), name: 'Verse' });

/** Song mit Groove „Verse“ und Segment „Chorus“ (2 Takte), entsperrt auf der Doppelseite; Übetempo ohne Gerätespeicher. */
function setup(open: 'book' | 'pattern' = 'book', practice = createPracticeStore(null)) {
  const verse = groove();
  const notebook = notebookWith([verse], open);
  act(() => notebook.store.updateSong((s) => appendSegment(s, { name: 'Chorus', bars: 2, grooveId: verse.id })));
  const fake = fakePlayer();
  const user = userEvent.setup();
  const view = render(<App store={notebook.store} player={fake.player} practice={practice} />);
  return { ...notebook, ...fake, user, verse, practice, view };
}

const toggle = () => screen.getByRole('button', { name: 'Tempo' });
const value = () => screen.getByRole('button', { name: /^Übetempo: \d+ BPM$/ });
const shown = () => Number(value().getAttribute('aria-label')!.match(/\d+/)![0]);
const step = (name: 'Übetempo verringern' | 'Übetempo erhöhen') => screen.getByRole('button', { name });
async function typePractice(user: ReturnType<typeof userEvent.setup>, keys: string) {
  await user.click(value());
  const field = screen.getByLabelText('Übetempo (BPM)');
  await user.clear(field);
  await user.type(field, keys);
}
const structure = () => screen.getByRole('region', { name: 'Struktur' });

describe('Spec practice-tempo › Übetempo-Steuerung', () => {
  it('Doppelseite', () => {
    setup();
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(value()).toHaveTextContent('♩ = 90');
    expect(toggle().closest('.practice-tempo')).not.toHaveClass('on');
  });

  it('Gleicher Stand im Pattern-Editor', async () => {
    const { user, store, verse } = setup();
    await user.click(toggle());
    await user.click(step('Übetempo erhöhen'));
    expect(toggle().closest('.practice-tempo')).toHaveClass('on');
    act(() => store.openPattern(verse.id));
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(shown()).toBe(95);
  });
});

describe('Spec practice-tempo › Übetempo-Steuerung (Hervorhebung)', () => {
  it('Hervorhebung nur für Tempo', async () => {
    const { user } = setup();
    await user.click(toggle());
    expect(toggle().closest('.practice-tempo')).toHaveClass('on');
    expect(toggle().closest('.practice')).not.toHaveClass('on');
    expect(screen.getByRole('button', { name: 'Metronom' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('Spec practice-tempo › Wiedergabe im Übetempo', () => {
  it('Pattern im Übetempo', async () => {
    const { user, source } = setup('pattern');
    await typePractice(user, '60{Enter}');
    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: 'In Schleife abspielen' }));
    expect(source().tempo()).toBe(60);
  });

  it('Aus dem Takt-Overlay', async () => {
    const { user, source } = setup();
    await user.click(toggle());
    await user.click(within(structure()).getByRole('button', { name: 'Takt 1' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Takt-Auswahl' })).getByRole('button', { name: 'In Schleife abspielen' }));
    expect(source().tempo()).toBe(90);
  });

  it('Ausschalten während der Wiedergabe', async () => {
    const { user, source, player } = setup();
    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: 'Song abspielen' }));
    expect(source().tempo()).toBe(90);
    await user.click(toggle());
    expect(source().tempo()).toBe(120);
    expect(player.start).toHaveBeenCalledTimes(1);
  });
});

describe('Spec practice-tempo › Übetempo ändern', () => {
  it('Wert eingeben', async () => {
    const { user } = setup();
    await typePractice(user, '96{Enter}');
    expect(value()).toHaveTextContent('♩ = 96');
  });

  it('Eingabe verwerfen', async () => {
    const { user } = setup();
    await typePractice(user, '96{Escape}');
    expect(shown()).toBe(90);
  });

  it('Über dem Song-Tempo', async () => {
    const { user, source } = setup();
    await typePractice(user, '140{Enter}');
    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: 'Song abspielen' }));
    expect(shown()).toBe(140);
    expect(source().tempo()).toBe(140);
  });

  it('Ungültiger Wert', async () => {
    const { user } = setup();
    await typePractice(user, '0');
    await user.tab();
    expect(shown()).toBe(90);
  });
});

describe('Spec practice-tempo › Übetempo in Schritten', () => {
  it('Erhöhen', async () => {
    const { user } = setup();
    await user.click(step('Übetempo erhöhen'));
    expect(shown()).toBe(95);
  });

  it('An der Obergrenze', async () => {
    const { user } = setup();
    await typePractice(user, '298{Enter}');
    await user.click(step('Übetempo erhöhen'));
    expect(shown()).toBe(300);
    expect(step('Übetempo erhöhen')).toBeDisabled();
  });

  it('An der Untergrenze', async () => {
    const { user } = setup();
    await typePractice(user, '30{Enter}');
    expect(step('Übetempo verringern')).toBeDisabled();
  });
});

describe('Spec practice-tempo › Übetempo unabhängig vom Song-Tempo', () => {
  it('Song-Tempo gesenkt', async () => {
    const { user, store, source } = setup();
    await typePractice(user, '100{Enter}');
    await user.click(toggle());
    await user.click(screen.getByRole('button', { name: 'Song abspielen' }));
    act(() => store.updateSong((s: Song) => setTempo(s, 80)));
    expect(shown()).toBe(100);
    expect(source().tempo()).toBe(100);
  });
});

describe('Spec practice-tempo › Übetempo bleibt auf dem Gerät', () => {
  it('Kein Teil des Songs', async () => {
    const { user, currentSong } = setup();
    const before = currentSong();
    await user.click(toggle());
    await user.click(step('Übetempo erhöhen'));
    await typePractice(user, '70{Enter}');
    expect(currentSong()).toBe(before);
  });

  it('Anderer Song', async () => {
    const { user, store } = setup();
    await typePractice(user, '85{Enter}');
    act(() => {
      const other = store.createSong('Andere');
      store.openSong(other.id);
    });
    expect(shown()).toBe(90);
  });
});

describe('Spec practice-tempo › Schalter gilt bis zum Neuladen', () => {
  it('Anderer Song', async () => {
    const { user, store } = setup();
    await user.click(toggle());
    act(() => {
      const other = store.createSong('Andere');
      store.openSong(other.id);
    });
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
  });

  it('Zurück zum Song', async () => {
    const { user, store, song } = setup();
    await user.click(toggle());
    act(() => store.backToList());
    act(() => store.openSong(song.id));
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Spec practice-tempo › Üben im gesperrten Song', () => {
  it('Gesperrter Song', async () => {
    const { user, store } = setup();
    act(() => store.setLocked(true));
    await user.click(toggle());
    await user.click(step('Übetempo erhöhen'));
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(shown()).toBe(95);
  });
});
