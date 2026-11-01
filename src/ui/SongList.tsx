import { useState } from 'react';
import { allBars } from '../domain/songPatterns';
import { useNotebook, useStore } from './useLibrary';

const barsLabel = (count: number) => (count === 1 ? '1 Takt' : `${count} Takte`);

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
        <ul className="songs">
          {sorted.map((song) => (
            <li key={song.id}>
              <button type="button" className="song-item" onClick={() => store.openSong(song.id)}>
                <span className="song-title">{song.title}</span>
                <span className="song-bars">{barsLabel(allBars(song).length)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
