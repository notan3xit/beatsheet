import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Pattern } from '../domain/types';
import { serializeLibrary } from '../persistence/fileFormat';
import { createLibraryStore } from '../state/libraryStore';
import { emptyBeats, patternOf } from '../test/patterns';
import { App } from './App';
import * as download from './download';

function setup(patterns: Pattern[] = [], storagePersisted = true) {
  const store = createLibraryStore(patterns);
  const user = userEvent.setup();
  render(<App store={store} storagePersisted={storagePersisted} />);
  return { store, user };
}

const fileOf = (content: string) => new File([content], 'backup.drumbook.json', { type: 'application/json' });

describe('Spec library-persistence › Dauerhaften Speicher anfordern (UI)', () => {
  it('Speicher nicht dauerhaft', () => {
    setup([], false);
    const hint = screen.getByRole('note');
    expect(hint).toHaveTextContent(/gelöscht/);
    expect(hint).toHaveTextContent(/Export/);
  });

  it('Kein Hinweis bei dauerhaftem Speicher', () => {
    setup([], true);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});

describe('Spec library-persistence › Export der Bibliothek (UI)', () => {
  it('Export herunterladen', async () => {
    const save = vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    const patterns = [patternOf(emptyBeats(4)), patternOf(emptyBeats(1), 'fill')];
    const { user } = setup(patterns);
    await user.click(screen.getByRole('button', { name: 'Exportieren' }));
    expect(save).toHaveBeenCalledTimes(1);
    const [name, content] = save.mock.calls[0]!;
    expect(name).toMatch(/\.drumbook\.json$/);
    expect(JSON.parse(content).patterns.map((p: Pattern) => p.id)).toEqual(patterns.map((p) => p.id));
    save.mockRestore();
  });
});

describe('Spec library-persistence › Import einer Bibliothek (UI)', () => {
  it('Neue Patterns importieren', async () => {
    const { store, user } = setup([patternOf(emptyBeats(4))]);
    const incoming = [patternOf(emptyBeats(4)), patternOf(emptyBeats(1), 'fill')];
    await user.upload(screen.getByLabelText('Importieren'), fileOf(serializeLibrary(incoming, new Date())));
    expect(await screen.findByRole('status')).toHaveTextContent('2 hinzugefügt, 0 aktualisiert, 0 unverändert');
    expect(store.getState().patterns).toHaveLength(3);
  });
});

describe('Spec library-persistence › Ungültige Importdateien (UI)', () => {
  it('Neuere Schemaversion', async () => {
    const local = [patternOf(emptyBeats(4))];
    const { store, user } = setup(local);
    const file = JSON.stringify({ ...JSON.parse(serializeLibrary([], new Date())), schemaVersion: 2 });
    await user.upload(screen.getByLabelText('Importieren'), fileOf(file));
    expect(await screen.findByRole('alert')).toHaveTextContent(/neueren Version/);
    expect(store.getState().patterns).toEqual(local);
  });

  it('Beschädigte Datei', async () => {
    const { store, user } = setup();
    const valid = patternOf(emptyBeats(4));
    const broken = { ...patternOf(emptyBeats(4)), beats: [] };
    const file = JSON.stringify({ ...JSON.parse(serializeLibrary([], new Date())), patterns: [valid, broken] });
    await user.upload(screen.getByLabelText('Importieren'), fileOf(file));
    expect(await screen.findByRole('alert')).toHaveTextContent(/beschädigt/);
    expect(store.getState().patterns).toEqual([]);
  });
});
