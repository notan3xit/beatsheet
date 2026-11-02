import { afterEach, describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import { createNotebookStore, type NotebookStore } from '../state/notebookStore';
import { songWith } from '../test/songs';
import { connectUrl } from './urlSync';

const verse = createPattern([], { kind: 'groove', name: 'Verse' });
const hysteria = songWith({ title: 'Hysteria', patterns: [verse] });
const bookHash = `#/songs/${hysteria.id}`;
const patternHash = `${bookHash}/patterns/${verse.id}`;

let disconnect: (() => void) | undefined;
afterEach(() => {
  disconnect?.();
  disconnect = undefined;
  window.history.replaceState(null, '', '#/');
});

/** App-Start mit gegebener Adresse. */
function start(hash = '#/'): NotebookStore {
  window.history.replaceState(null, '', hash);
  const store = createNotebookStore([hysteria]);
  disconnect = connectUrl(store, window);
  return store;
}

/** Browser-Navigation (Zurück/Vor/Link) auf eine Adresse simulieren. */
function browserGoes(hash: string) {
  window.history.replaceState(null, '', hash);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const view = (store: NotebookStore) => {
  const { openSongId, view: v } = store.getState();
  return { openSongId, view: v };
};

describe('Spec navigation › Position in der Adresse', () => {
  it('Adresse folgt der Navigation', () => {
    const store = start();
    store.openSong(hysteria.id);
    expect(window.location.hash).toBe(bookHash);
    store.openPattern(verse.id);
    expect(window.location.hash).toBe(patternHash);
  });

  it('Neuladen im Pattern-Editor', () => {
    const store = start(patternHash);
    expect(view(store)).toEqual({ openSongId: hysteria.id, view: { kind: 'pattern', patternId: verse.id } });
    expect(window.location.hash).toBe(patternHash);
  });

  it('Link auf einen Song', () => {
    const store = start(bookHash);
    expect(view(store)).toEqual({ openSongId: hysteria.id, view: { kind: 'book' } });
  });

  it('Zur Song-Liste', () => {
    const store = start(bookHash);
    store.backToList();
    expect(window.location.hash).toBe('#/');
  });

  it('Inhaltsänderung legt keinen Verlaufseintrag an', () => {
    const store = start(patternHash);
    const before = window.history.length;
    store.rename(verse.id, 'Strophe');
    expect(window.history.length).toBe(before);
    expect(window.location.hash).toBe(patternHash);
  });
});

describe('Spec navigation › Browser-Verlauf', () => {
  it('Navigation legt Verlaufseinträge an', () => {
    const store = start();
    const before = window.history.length;
    store.openSong(hysteria.id);
    store.openPattern(verse.id);
    expect(window.history.length).toBe(before + 2);
  });

  it('Zurück aus dem Pattern-Editor', () => {
    const store = start(bookHash);
    store.openPattern(verse.id);
    const before = window.history.length;
    browserGoes(bookHash);
    expect(view(store)).toEqual({ openSongId: hysteria.id, view: { kind: 'book' } });
    expect(window.history.length).toBe(before);
  });

  it('Vor nach Zurück', () => {
    const store = start(bookHash);
    store.openPattern(verse.id);
    browserGoes(bookHash);
    browserGoes(patternHash);
    expect(view(store)).toEqual({ openSongId: hysteria.id, view: { kind: 'pattern', patternId: verse.id } });
  });

  it('auch hashchange (z. B. eingefügter Link) wechselt die Ansicht', () => {
    const store = start();
    window.history.replaceState(null, '', bookHash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(view(store)).toEqual({ openSongId: hysteria.id, view: { kind: 'book' } });
  });

  it('erneutes Anwenden derselben Adresse leert die Undo-Historie nicht', () => {
    const store = start(patternHash);
    store.rename(verse.id, 'Strophe');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(store.getState().canUndo).toBe(true);
  });
});

describe('Spec navigation › Unbekannte Adresse', () => {
  it('Gelöschter Song', () => {
    const before = window.history.length;
    const store = start('#/songs/gibt-es-nicht');
    expect(view(store)).toEqual({ openSongId: null, view: { kind: 'list' } });
    expect(window.location.hash).toBe('#/');
    expect(window.history.length).toBe(before);
  });

  it('Gelöschtes Pattern', () => {
    const before = window.history.length;
    const store = start(`${bookHash}/patterns/gibt-es-nicht`);
    expect(view(store)).toEqual({ openSongId: hysteria.id, view: { kind: 'book' } });
    expect(window.location.hash).toBe(bookHash);
    expect(window.history.length).toBe(before);
  });

  it('Nicht lesbare Adresse', () => {
    const store = start('#/irgendwas');
    expect(view(store)).toEqual({ openSongId: null, view: { kind: 'list' } });
    expect(window.location.hash).toBe('#/');
  });

  it('Unbekannter Song per Zurück', () => {
    const store = start(bookHash);
    browserGoes('#/songs/gibt-es-nicht');
    expect(view(store)).toEqual({ openSongId: null, view: { kind: 'list' } });
    expect(window.location.hash).toBe('#/');
  });

  it('Pattern löschen im Editor', () => {
    const store = start(patternHash);
    store.remove(verse.id);
    expect(window.location.hash).toBe(bookHash);
  });
});
