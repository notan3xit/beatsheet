import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHttpAccountApi } from './account/api';
import { createAccountSession, type AccountSession } from './account/session';
import { connectStore, openRepository, requestPersistentStorage } from './persistence/repository';
import { initAutomerge } from './persistence/songDoc';
import { createNotebookStore, type NotebookStore } from './state/notebookStore';
import { createSyncApi, openEventSource } from './sync/api';
import { createSync, type Sync } from './sync/sync';
import { App } from './ui/App';
import { installTheme } from './ui/theme';
import { connectUrl } from './ui/urlSync';
import './ui/styles.css';

installTheme();
const root = createRoot(document.getElementById('root')!);

const renderApp = (store: NotebookStore, session: AccountSession, sync: Sync, storagePersisted: boolean) =>
  root.render(
    <StrictMode>
      <App store={store} session={session} sync={sync} storagePersisted={storagePersisted} />
    </StrictMode>,
  );

async function start() {
  try {
    await initAutomerge();
    const repo = await openRepository();
    const songs = await repo.loadAll();
    const store = createNotebookStore(songs, undefined, await repo.loadSyncState());
    const connection = connectStore(store, repo);
    const session = createAccountSession(createHttpAccountApi());
    const sync = createSync({ store, repo, connection, session, api: createSyncApi(), openEvents: openEventSource });
    sync.start();
    // Ansicht aus der Adresse öffnen, bevor gerendert wird (kein Aufblitzen der Song-Liste)
    connectUrl(store);
    renderApp(store, session, sync, true);
    // Manche Browser fragen den Nutzer; der Hinweis erscheint erst nach der Antwort
    if (!(await requestPersistentStorage())) renderApp(store, session, sync, false);
  } catch (error) {
    console.error(error);
    root.render(<p role="alert">Der lokale Speicher konnte nicht geöffnet werden. Beatsheet kann nicht starten.</p>);
  }
}

void start();
