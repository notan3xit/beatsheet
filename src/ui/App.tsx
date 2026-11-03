import { useState } from 'react';
import { createHttpAccountApi, type AccountApi } from '../account/api';
import { createWebAudioPlayer, type Player } from '../audio/player';
import type { NotebookStore } from '../state/notebookStore';
import { AccountMenu } from './AccountMenu';
import { ConfirmProvider } from './ConfirmDialog';
import { HitTestContext, type HitTest } from './dragPattern';
import { LibraryFileActions } from './LibraryFileActions';
import { PatternEditor } from './PatternEditor';
import { PlayerContext } from './playback';
import { SongList } from './SongList';
import { Songbook } from './Songbook';
import { StoreContext, useNotebook, useOpenSong } from './useLibrary';

function OpenPattern({ patternId }: { patternId: string }) {
  const pattern = useOpenSong().patterns.find((p) => p.id === patternId);
  return pattern ? (
    <main className="workspace" aria-label="Pattern">
      <PatternEditor pattern={pattern} />
    </main>
  ) : null;
}

function CurrentView() {
  const { view } = useNotebook();
  if (view.kind === 'book') return <Songbook />;
  if (view.kind === 'pattern') return <OpenPattern patternId={view.patternId} />;
  return <SongList />;
}

export function App({
  store,
  storagePersisted = true,
  hitTest,
  player: playerProp,
  account: accountProp,
}: {
  store: NotebookStore;
  storagePersisted?: boolean;
  /** Trefferprüfung beim Ziehen; nur für Tests (jsdom hat kein elementFromPoint). */
  hitTest?: HitTest;
  /** Audio-Wiedergabe; Vorgabe Web Audio, in Tests ein Nachbau. */
  player?: Player;
  /** Anmeldeserver; Vorgabe HTTP über `/api`, in Tests ein Nachbau. */
  account?: AccountApi;
}) {
  const [player] = useState(() => playerProp ?? createWebAudioPlayer());
  const [account] = useState(() => accountProp ?? createHttpAccountApi());
  const app = (
    <StoreContext.Provider value={store}>
      <PlayerContext.Provider value={player}>
        <ConfirmProvider>
          <div className="app">
            <header className="app-header">
              <h1>Drumstuff</h1>
              <LibraryFileActions />
              <AccountMenu api={account} />
            </header>
            {!storagePersisted && (
              <p role="note" className="storage-note">
                Der Browser hat keinen dauerhaften Speicher gewährt. Deine Daten könnten gelöscht werden. Sichere sie
                regelmäßig über „Exportieren“.
              </p>
            )}
            <CurrentView />
          </div>
        </ConfirmProvider>
      </PlayerContext.Provider>
    </StoreContext.Provider>
  );
  return hitTest ? <HitTestContext.Provider value={hitTest}>{app}</HitTestContext.Provider> : app;
}
