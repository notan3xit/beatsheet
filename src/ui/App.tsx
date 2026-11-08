import { useEffect, useState, useSyncExternalStore } from 'react';
import { createHttpAccountApi, type AccountApi } from '../account/api';
import { createHttpProfileApi, type ProfileApi } from '../account/profile';
import { createAccountSession, type AccountSession } from '../account/session';
import { createDeviceSound, type PlaybackSound } from '../audio/deviceSound';
import { createWebAudioPlayer, type Player } from '../audio/player';
import type { NotebookStore } from '../state/notebookStore';
import type { WorkbookActions } from '../sync/sync';
import { AppHeader } from './AppHeader';
import { ConfirmProvider } from './ConfirmDialog';
import { HitTestContext, type HitTest } from './dragPattern';
import { useLockGuard } from './lock';
import { MessageRow, MessagesProvider, ReportedMessages } from './messages';
import { PatternEditor } from './PatternEditor';
import { PlayerContext, SoundContext } from './playback';
import { createThemeSetting, type ThemeSetting } from './theme';
import { ThemeContext } from './useTheme';
import { SongList } from './SongList';
import { Songbook } from './Songbook';
import { HistoryContext, SongHistory, type HistoryOf } from './SongHistory';
import { ActivityContext, NO_ACTIVITY } from './useActivity';
import type { SongActivity } from '../sync/songActivity';
import { StoreContext, useNotebook, useOpenSong } from './useLibrary';
import { SessionContext, SyncContext, useEmail } from './useWorkbooks';

function OpenPattern({ patternId }: { patternId: string }) {
  const pattern = useOpenSong().patterns.find((p) => p.id === patternId);
  const guard = useLockGuard();
  return pattern ? (
    <main className="workspace" aria-label="Pattern" {...guard}>
      <PatternEditor pattern={pattern} />
    </main>
  ) : null;
}

function CurrentView() {
  const { view } = useNotebook();
  if (view.kind === 'book') return <Songbook />;
  if (view.kind === 'pattern') return <OpenPattern patternId={view.patternId} />;
  if (view.kind === 'history') return <SongHistory />;
  return <SongList />;
}

/** Angemeldet liegen die Songs im Account; gefährdet ist nur, was noch nicht übertragen wurde. */
function StorageNote({ synced }: { synced: boolean }) {
  const email = useEmail();
  return (
    <p role="note" className="message note">
      Der Browser hat keinen dauerhaften Speicher gewährt.{' '}
      {synced && email
        ? 'Deine Songs liegen im Account, nur noch nicht übertragene Änderungen könnten verloren gehen.'
        : 'Deine Daten könnten gelöscht werden. Sichere sie regelmäßig über „Exportieren“ im Menü.'}
    </p>
  );
}

/** Ohne Anmeldung und Workbooks gibt es nichts abzugleichen, und der Hinweis entfällt. */
function OfflineNote({ sync }: { sync: WorkbookActions }) {
  const offline = useSyncExternalStore(sync.subscribe, sync.isOffline);
  const { workbooks } = useNotebook();
  const email = useEmail();
  if (!offline || (!email && workbooks.length === 0)) return null;
  return (
    <p role="status" className="message note">
      Keine Verbindung zum Server. Du kannst weiterarbeiten, deine Änderungen werden übertragen, sobald die Verbindung wieder steht.
    </p>
  );
}

/** Hinweise des Abgleichs, etwa nach dem Verlust einer Mitgliedschaft. */
function Notices({ sync }: { sync: WorkbookActions }) {
  const notices = useSyncExternalStore(sync.subscribe, sync.getNotices);
  return notices.map((notice) => <MessageRow key={notice.id} kind="status" text={notice.text} onClose={() => sync.dismissNotice(notice.id)} />);
}

const NO_HISTORY: HistoryOf = () => null;

export function App({
  store,
  storagePersisted = true,
  hitTest,
  player: playerProp,
  sound: soundProp,
  theme: themeProp,
  account: accountProp,
  profile: profileProp,
  session: sessionProp,
  sync,
  historyOf = NO_HISTORY,
  activity = NO_ACTIVITY,
}: {
  store: NotebookStore;
  storagePersisted?: boolean;
  /** Trefferprüfung beim Ziehen; nur für Tests (jsdom hat kein elementFromPoint). */
  hitTest?: HitTest;
  /** Audio-Wiedergabe; Vorgabe Web Audio, in Tests ein Nachbau. */
  player?: Player;
  /** Klangwahl und Aufnahmen; Vorgabe Gerätespeicher und DRSKit vom Server, in Tests ein Nachbau. */
  sound?: PlaybackSound;
  /** Wahl des Farbschemas; `main` verbindet sie vor dem ersten Rendern mit dem Dokument, in Tests ohne Speicher. */
  theme?: ThemeSetting;
  /** Anmeldeserver; Vorgabe HTTP über `/api`, in Tests ein Nachbau. */
  account?: AccountApi;
  /** Profil am Server; Vorgabe HTTP über `/api/auth/profile`, in Tests ein Nachbau. */
  profile?: ProfileApi;
  /** Anmeldestatus, wenn ihn auch andere Teile der App brauchen; sonst aus `account` erzeugt. */
  session?: AccountSession;
  /** Workbooks und Abgleich; ohne sie gibt es nur „Meine Songs“. */
  sync?: WorkbookActions;
  /** Historie eines Songs (song-history); in der App aus dem Repository. */
  historyOf?: HistoryOf;
  /** Letzte Änderung und Neues je Song (song-activity); in der App aus Repository und Sitzung. */
  activity?: SongActivity;
}) {
  const [sound] = useState(() => soundProp ?? createDeviceSound());
  const [theme] = useState(() => themeProp ?? createThemeSetting(null));
  const [player] = useState(() => playerProp ?? createWebAudioPlayer(undefined, sound));
  // Aufnahmen im Hintergrund laden, sobald DRSKit gewählt ist; ohne Web Audio gibt es nichts abzuspielen
  const chosen = useSyncExternalStore(sound.setting.subscribe, sound.setting.get);
  useEffect(() => {
    if (chosen === 'drs' && player.available) void sound.loader.load();
  }, [chosen, player, sound]);
  const [session] = useState(() => sessionProp ?? createAccountSession(accountProp ?? createHttpAccountApi()));
  const [profileApi] = useState(() => profileProp ?? createHttpProfileApi());
  const app = (
    <StoreContext.Provider value={store}>
      <PlayerContext.Provider value={player}>
        <SoundContext.Provider value={sound}>
        <ThemeContext.Provider value={theme}>
        <SessionContext.Provider value={session}>
        <SyncContext.Provider value={sync ?? null}>
        <HistoryContext.Provider value={historyOf}>
        <ActivityContext.Provider value={activity}>
        <ConfirmProvider>
        <MessagesProvider>
          <div className="app">
            <AppHeader session={session} profileApi={profileApi} />
            <div className="app-notes">
              {!storagePersisted && <StorageNote synced={sync !== undefined} />}
              {sync && <OfflineNote sync={sync} />}
              {sync && <Notices sync={sync} />}
              <ReportedMessages />
            </div>
            <CurrentView />
          </div>
        </MessagesProvider>
        </ConfirmProvider>
        </ActivityContext.Provider>
        </HistoryContext.Provider>
        </SyncContext.Provider>
        </SessionContext.Provider>
        </ThemeContext.Provider>
        </SoundContext.Provider>
      </PlayerContext.Provider>
    </StoreContext.Provider>
  );
  return hitTest ? <HitTestContext.Provider value={hitTest}>{app}</HitTestContext.Provider> : app;
}
