import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { SongActivity } from '../sync/songActivity';

/** Ohne Repository (etwa in Tests): keine Zeit, nichts Neues. */
export const NO_ACTIVITY: SongActivity = {
  lastChange: () => null,
  isNew: () => false,
  order: () => null,
  subscribe: () => () => {},
  getVersion: () => 0,
};

export const ActivityContext = createContext<SongActivity>(NO_ACTIVITY);

/** Letzte Änderung und Neues; rendert bei jeder Meldung neu (song-activity). */
export function useActivity(): SongActivity {
  const activity = useContext(ActivityContext);
  useSyncExternalStore(activity.subscribe, activity.getVersion);
  return activity;
}

/** Aktuelle Zeit in Millisekunden, jede Minute erneuert (song-activity, Zeitangabe). */
export function useMinute(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
