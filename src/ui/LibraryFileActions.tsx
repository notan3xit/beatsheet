import { useState, type ChangeEvent } from 'react';
import { exportFileName, parseLibraryFile, serializeLibrary } from '../persistence/fileFormat';
import { mergeImport } from '../persistence/merge';
import { downloadFile } from './download';
import { useStore } from './useLibrary';

type Message = { kind: 'status' | 'alert'; text: string };

export function LibraryFileActions() {
  const store = useStore();
  const [message, setMessage] = useState<Message | null>(null);

  const exportLibrary = () => {
    const now = new Date();
    downloadFile(exportFileName(now), serializeLibrary(store.getState().patterns, now));
  };

  const importLibrary = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const parsed = parseLibraryFile(await file.text());
    if (!parsed.ok) {
      setMessage({ kind: 'alert', text: `Import fehlgeschlagen: ${parsed.error}` });
      return;
    }
    const { changed, summary } = mergeImport(store.getState().patterns, parsed.patterns);
    store.importPatterns(changed);
    setMessage({
      kind: 'status',
      text: `Import abgeschlossen: ${summary.added} hinzugefügt, ${summary.updated} aktualisiert, ${summary.unchanged} unverändert.`,
    });
  };

  return (
    <div className="file-actions">
      <button type="button" onClick={exportLibrary}>
        Exportieren
      </button>
      <label className="button-like">
        Importieren
        <input
          type="file"
          accept=".json,application/json"
          className="visually-hidden"
          onChange={(e) => void importLibrary(e)}
        />
      </label>
      {message && (
        <div role={message.kind} className={`message ${message.kind}`}>
          <span>{message.text}</span>
          <button type="button" className="message-close" aria-label="Meldung schließen" onClick={() => setMessage(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
