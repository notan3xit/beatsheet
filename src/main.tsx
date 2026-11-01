import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { connectStore, openRepository, requestPersistentStorage } from './persistence/repository';
import { createLibraryStore, type LibraryStore } from './state/libraryStore';
import { App } from './ui/App';
import { installTheme } from './ui/theme';
import './ui/styles.css';

installTheme();
const root = createRoot(document.getElementById('root')!);

const renderApp = (store: LibraryStore, storagePersisted: boolean) =>
  root.render(
    <StrictMode>
      <App store={store} storagePersisted={storagePersisted} />
    </StrictMode>,
  );

async function start() {
  try {
    const repo = await openRepository();
    const store = createLibraryStore(await repo.loadAll());
    connectStore(store, repo);
    renderApp(store, true);
    // Manche Browser fragen den Nutzer; der Hinweis erscheint erst nach der Antwort
    if (!(await requestPersistentStorage())) renderApp(store, false);
  } catch (error) {
    console.error(error);
    root.render(<p role="alert">Der lokale Speicher konnte nicht geöffnet werden. Drumstuff kann nicht starten.</p>);
  }
}

void start();
