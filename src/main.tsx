import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { connectStore, openRepository, requestPersistentStorage } from './persistence/repository';
import { initAutomerge } from './persistence/songDoc';
import { createNotebookStore, type NotebookStore } from './state/notebookStore';
import { App } from './ui/App';
import { installTheme } from './ui/theme';
import { connectUrl } from './ui/urlSync';
import './ui/styles.css';

installTheme();
const root = createRoot(document.getElementById('root')!);

const renderApp = (store: NotebookStore, storagePersisted: boolean) =>
  root.render(
    <StrictMode>
      <App store={store} storagePersisted={storagePersisted} />
    </StrictMode>,
  );

async function start() {
  try {
    await initAutomerge();
    const repo = await openRepository();
    const store = createNotebookStore(await repo.loadAll());
    connectStore(store, repo);
    // Ansicht aus der Adresse öffnen, bevor gerendert wird (kein Aufblitzen der Song-Liste)
    connectUrl(store);
    renderApp(store, true);
    // Manche Browser fragen den Nutzer; der Hinweis erscheint erst nach der Antwort
    if (!(await requestPersistentStorage())) renderApp(store, false);
  } catch (error) {
    console.error(error);
    root.render(<p role="alert">Der lokale Speicher konnte nicht geöffnet werden. Drumstuff kann nicht starten.</p>);
  }
}

void start();
