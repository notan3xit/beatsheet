import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import type { Pattern } from '../domain/types';
import { notebookWith } from '../test/notebook';
import { App } from './App';

function seed(): Pattern[] {
  const result: Pattern[] = [];
  for (const name of ['Verse', 'Chorus']) result.push(createPattern(result, { kind: 'groove', name }));
  return result;
}

function setup() {
  const notebook = notebookWith(seed(), 'book');
  const user = userEvent.setup();
  render(<App store={notebook.store} />);
  return { ...notebook, user };
}

const songHeader = () => document.querySelector('.songbook-header') as HTMLElement;
const tempoMark = (bpm: number) => within(songHeader()).getByRole('button', { name: `Song-Tempo: ${bpm} BPM` });
const tempoInput = () => within(songHeader()).getByLabelText('Song-Tempo (BPM)') as HTMLInputElement;

describe('Spec song-library › Tempo auf der Doppelseite', () => {
  it('Tempoangabe neben dem Songtitel', () => {
    setup();
    expect(tempoMark(120)).toHaveTextContent('♩ = 120');
    const title = within(songHeader()).getByRole('heading', { level: 2, name: 'Test' });
    expect(title.parentElement).toContainElement(tempoMark(120));
  });

  it('Tempo auf der Doppelseite ändern', async () => {
    const { user, store, currentSong, patternsNow } = setup();
    await user.click(tempoMark(120));
    expect(tempoInput().value).toBe('120');
    await user.clear(tempoInput());
    await user.type(tempoInput(), '96{Enter}');
    expect(tempoMark(96)).toHaveTextContent('♩ = 96');
    expect(currentSong().tempo).toBe(96);
    for (const pattern of patternsNow()) {
      act(() => store.openPattern(pattern.id));
      expect((screen.getByLabelText('Song-Tempo (BPM)') as HTMLInputElement).value).toBe('96');
    }
  });

  it('Eingabe verwerfen', async () => {
    const { user, currentSong } = setup();
    const before = currentSong();
    await user.click(tempoMark(120));
    await user.clear(tempoInput());
    await user.type(tempoInput(), '96{Escape}');
    expect(tempoMark(120)).toHaveTextContent('♩ = 120');
    expect(currentSong()).toBe(before);
  });

  it('Ungültiges Tempo auf der Doppelseite', async () => {
    const { user, currentSong } = setup();
    const before = currentSong();
    await user.click(tempoMark(120));
    await user.clear(tempoInput());
    await user.type(tempoInput(), '0');
    await user.tab();
    expect(tempoMark(120)).toHaveTextContent('♩ = 120');
    expect(currentSong()).toBe(before);
  });
});
