import type { ReactNode } from 'react';
import { allBars } from '../domain/songPatterns';
import type { Song } from '../domain/types';
import { useStore } from './useLibrary';

export const sortedByTitle = <T,>(items: readonly T[], title: (item: T) => string) =>
  [...items].sort((a, b) => title(a).localeCompare(title(b), 'de', { sensitivity: 'base' }));

/** Songs einer Karte; `action` ergänzt je Zeile eine eigene Spalte, die den Song nicht öffnet. */
export function SongTable({ songs, action }: { songs: readonly Song[]; action?: (song: Song) => ReactNode }) {
  const store = useStore();
  return (
    <table className="songs">
      <thead>
        <tr>
          <th scope="col">Titel</th>
          <th scope="col" className="num">Takte</th>
          <th scope="col" className="num">Grooves</th>
          <th scope="col" className="num">Fills</th>
          {action && (
            <th scope="col">
              <span className="visually-hidden">Aktionen</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {sortedByTitle(songs, (s) => s.title).map((song) => (
          // Ganze Zeile klickbar; der Knopf im Titel dient der Tastaturbedienung (design.md D4)
          <tr key={song.id} onClick={() => store.openSong(song.id)}>
            <td>
              <button type="button" className="song-open">
                {song.title}
              </button>
            </td>
            <td className="num">{allBars(song).length}</td>
            <td className="num">{song.patterns.filter((p) => p.kind === 'groove').length}</td>
            <td className="num">{song.patterns.filter((p) => p.kind === 'fill').length}</td>
            {action && (
              <td className="song-action" onClick={(e) => e.stopPropagation()}>
                {action(song)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
