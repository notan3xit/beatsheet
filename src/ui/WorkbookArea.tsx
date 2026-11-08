import { useId, useState } from 'react';
import type { Song, Workbook } from '../domain/types';
import type { WorkbookActions } from '../sync/sync';
import { useDropTarget } from './dragSong';
import { NewDot, sortedByTitle } from './SongTile';
import { useActivity } from './useActivity';
import { useNotebook } from './useLibrary';
import { useEmail } from './useWorkbooks';
import { useReportedAction, WorkbookCard } from './WorkbookCard';

const KEY = 'beatsheet.workbook';
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Gewähltes Workbook; überdauert das Öffnen eines Songs, nur für diesen Tab (design.md D5). */
function useChosenWorkbook() {
  const [chosen, setChosen] = useState(() => sessionStorage.getItem(KEY));
  const choose = (id: string) => {
    sessionStorage.setItem(KEY, id);
    setChosen(id);
  };
  return [chosen, choose] as const;
}

function WorkbookEntry({ workbook, songs, hasNew, selected, onChoose }: { workbook: Workbook; songs: number; hasNew: boolean; selected: boolean; onChoose: () => void }) {
  const description = useId();
  const target = useDropTarget() === workbook.id;
  return (
    <li>
      <button
        type="button"
        className={`workbook-entry${target ? ' drop-target' : ''}`}
        aria-label={workbook.title}
        aria-describedby={description}
        aria-pressed={selected}
        data-drop-workbook={workbook.id}
        onClick={onChoose}
      >
        <b>
          {hasNew && <NewDot />}
          {workbook.title}
        </b>
        <span id={description}>
          {count(songs, 'Song', 'Songs')} · {count(workbook.members.length, 'Mitglied', 'Mitglieder')}
          {hasNew && <span className="visually-hidden"> · neu</span>}
        </span>
      </button>
    </li>
  );
}

/** Bereich „Workbooks“: Seitenleiste und gewähltes Workbook (song-overview-tiles, design.md D4). */
export function WorkbookArea({ sync, songs }: { sync: WorkbookActions; songs: readonly Song[] }) {
  const { workbooks, placement } = useNotebook();
  const email = useEmail();
  const run = useReportedAction();
  const [chosen, choose] = useChosenWorkbook();
  const activity = useActivity();
  const list = sortedByTitle(workbooks.filter((w) => !w.personal), (w) => w.title);
  const selected = list.find((w) => w.id === chosen) ?? list[0];
  if (!email && list.length === 0) return null;
  const songsOf = (id: string) => songs.filter((s) => placement[s.id] === id);

  const create = async () => {
    let id: string | undefined;
    await run(async () => {
      const result = await sync.createWorkbook('');
      if (result.ok) id = result.id;
      return result;
    });
    if (id) choose(id);
  };

  return (
    <section aria-label="Workbooks" className="overview-section">
      <h2>Workbooks</h2>
      <div className="workbook-layout">
        <nav aria-label="Workbooks" className="workbook-list">
          <ul>
            {list.map((workbook) => (
              <WorkbookEntry
                key={workbook.id}
                workbook={workbook}
                songs={songsOf(workbook.id).length}
                hasNew={songsOf(workbook.id).some((s) => activity.isNew(s.id))}
                selected={workbook === selected}
                onChoose={() => choose(workbook.id)}
              />
            ))}
            {email && (
              <li>
                <button type="button" className="workbook-entry workbook-add" onClick={() => void create()}>
                  + Workbook
                </button>
              </li>
            )}
          </ul>
        </nav>
        {selected ? (
          <WorkbookCard key={selected.id} workbook={selected} songs={songsOf(selected.id)} sync={sync} />
        ) : (
          <p className="hint workbook-empty">Mit „+ Workbook“ legst du eine Sammlung an, die du mit anderen teilen kannst.</p>
        )}
      </div>
    </section>
  );
}
