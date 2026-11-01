import { describe, expect, it } from 'vitest';
import { toggleHit } from '../domain/sequencer';
import { emptyBeats, patternOf } from '../test/patterns';
import { createLibraryStore } from './libraryStore';

function storeWithSelected() {
  const pattern = patternOf(emptyBeats(4));
  const store = createLibraryStore([pattern]);
  store.select(pattern.id);
  const current = () => store.getState().patterns[0]!;
  const setKick = (position: number) => store.update(pattern.id, (p) => toggleHit(p, 0, 'kick', position));
  return { store, current, setKick };
}

describe('Spec pattern-sequencer › Änderungen rückgängig machen', () => {
  it('Rückgängig und Wiederherstellen', () => {
    const { store, current, setKick } = storeWithSelected();
    setKick(0);
    expect(current().beats[0]!.hits.kick).toEqual([0]);
    store.undo();
    expect(current().beats[0]!.hits.kick).toBeUndefined();
    store.redo();
    expect(current().beats[0]!.hits.kick).toEqual([0]);
  });

  it('Mindestens 50 Schritte', () => {
    const { store, current, setKick } = storeWithSelected();
    for (let i = 0; i < 50; i++) setKick(i % 4);
    for (let i = 0; i < 50; i++) store.undo();
    expect(current().beats[0]!.hits).toEqual({});
    expect(store.getState().canUndo).toBe(false);
  });

  it('Neue Änderung verwirft Wiederherstellen', () => {
    const { store, setKick } = storeWithSelected();
    setKick(0);
    store.undo();
    setKick(1);
    expect(store.getState().canRedo).toBe(false);
  });

  it('Verlauf gilt nur für das geöffnete Pattern', () => {
    const { store, setKick } = storeWithSelected();
    setKick(0);
    const other = store.createPattern('fill');
    store.select(other.id);
    expect(store.getState().canUndo).toBe(false);
  });

  it('Rückgängig ist selbst eine Änderung (Revision steigt)', () => {
    const { store, current, setKick } = storeWithSelected();
    setKick(0);
    const before = current().revision;
    store.undo();
    expect(current().revision).toBe(before + 1);
  });
});
