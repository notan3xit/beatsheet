import { useState } from 'react';
import { allBars } from '../domain/songPatterns';
import { useNotebook, useStore } from './useLibrary';


export function SongList() {
  const store = useStore();
  const { songs } = useNotebook();
  const [title, setTitle] = useState('');
  const sorted = [...songs].sort((a, b) => a.title.localeCompare(b.title, 'de', { sensitivity: 'base' }));

  const create = () => {
    store.createSong(title);
    setTitle('');
  };

  return (
    <main className="song-list" aria-label="Songs">
      <h2 className="page-heading">Songs</h2>
      <form
        className="song-create"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label className="field">
          Titel des neuen Songs
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Neuer Song" />
        </label>
        <button type="submit" className="primary">
          Song anlegen
        </button>
      </form>
      {sorted.length === 0 ? (
        <p className="hint">Noch keine Songs. Gib oben einen Titel ein und lege deinen ersten Song an.</p>
      ) : (
        <table className="songs">
          <thead>
            <tr>
              <th scope="col">Titel</th>
              <th scope="col" className="num">Takte</th>
              <th scope="col" className="num">Grooves</th>
              <th scope="col" className="num">Fills</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((song) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
