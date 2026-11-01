import type { LibraryStore } from '../state/libraryStore';
import { ConfirmProvider } from './ConfirmDialog';
import { LibraryFileActions } from './LibraryFileActions';
import { LibraryOverview } from './LibraryOverview';
import { PatternEditor } from './PatternEditor';
import { StoreContext, useLibrary } from './useLibrary';

function Workspace() {
  const { patterns, selectedId } = useLibrary();
  const selected = patterns.find((p) => p.id === selectedId);
  return (
    <main className="workspace">
      {selected ? (
        <PatternEditor pattern={selected} />
      ) : (
        <p className="hint">Wähle links ein Pattern aus oder lege ein neues an.</p>
      )}
    </main>
  );
}

export function App({ store, storagePersisted = true }: { store: LibraryStore; storagePersisted?: boolean }) {
  return (
    <StoreContext.Provider value={store}>
      <ConfirmProvider>
        <div className="app">
          <header className="app-header">
            <h1>Drumstuff</h1>
            <LibraryFileActions />
          </header>
          {!storagePersisted && (
            <p role="note" className="storage-note">
              Der Browser hat keinen dauerhaften Speicher gewährt. Deine Daten könnten gelöscht werden. Sichere sie
              regelmäßig über „Exportieren“.
            </p>
          )}
          <LibraryOverview />
          <Workspace />
        </div>
      </ConfirmProvider>
    </StoreContext.Provider>
  );
}
