# Proposal

## Why

Beim ersten Aufruf ist „Meine Songs“ leer, und ein Hinweistext erklärt, wie man einen Song anlegt. Das Prinzip des Notenbuchs (Struktur links, jedes Pattern rechts nur einmal) zeigt sich aber erst an einem fertigen Song. Erklärende Hinweistexte in leeren Bereichen sollen zudem entfallen, die Oberfläche soll sich über Überschriften und Schaltflächen selbst erklären.

## What Changes

- Ist „Meine Songs“ leer, steht vor „+ Song“ die Kachel „+ Beispiel-Song“. Sie legt einen fertigen Beispiel-Song als gewöhnlichen eigenen Song an und öffnet seine Doppelseite. Sobald „Meine Songs“ einen Song enthält, entfällt die Kachel.
- Der Beispiel-Song liegt als Datei im Dateiformat im Repo: zwei Grooves, zwei Fills, vier Segmente, Akzente und Spielweisen.
- Der Hinweis im leeren „Meine Songs“ entfällt.
- Der Hinweis auf der leeren Pattern-Seite eines Songs entfällt.
- Der Hinweis im Bereich „Workbooks“ ohne Workbook entfällt. Stattdessen steht neben der Überschrift „Workbooks“ ein Knopf „?“, dessen Popover in wenigen Sätzen erklärt, wozu Workbooks dienen.

## Capabilities

### New Capabilities

### Modified Capabilities
- `song-library`: Das leere „Meine Songs“ zeigt statt eines Hinweises die Kachel „+ Beispiel-Song“; neue Anforderung zum Anlegen des Beispiel-Songs.
- `workbooks`: Neue Anforderung zur Erklärung der Workbooks über „?“ neben der Überschrift.

## Impact

- `src/ui/SongList.tsx` (Kachel, Hinweis), `src/ui/PatternPage.tsx` (Hinweis), `src/ui/WorkbookArea.tsx` (Hinweis, „?“ mit Popover), `src/ui/styles.css`
- `src/state/notebookStore.ts`: Anlegen des Beispiel-Songs
- Neue Datei mit dem Beispiel-Song im Dateiformat
- Kein Einfluss auf Dateiformat, Abgleich oder Server: Der Beispiel-Song ist nach dem Anlegen ein gewöhnlicher Song.
