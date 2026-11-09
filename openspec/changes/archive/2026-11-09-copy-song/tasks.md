# Tasks

## 1. Song kopieren (song-library)

- [x] 1.1 Tests aus den Szenarien erfassen (rot). `src/state/notebookStore.test.ts`: `copySong` legt einen Song ohne Zuordnung mit neuer ID, Titel „<Titel> (Kopie)“, Revision 1 und Tempo, Standard-Takt, Patterns und Segmenten des Originals an; das Original bleibt unverändert; eine Änderung der Kopie ändert das Original nicht. `src/ui/songList.test.tsx` (abgemeldet) und `src/ui/workbooks.test.tsx`: Symbol „Kopieren“ an Kacheln in „Meine Songs“ und in einem Workbook; nach Bestätigung steht die Kopie in „Meine Songs“, der Workbook-Song bleibt im Workbook; Abbrechen und Escape ändern nichts; die Rückfrage für Workbook-Songs unterscheidet sich von der für eigene Songs (ohne Wortlaut zu prüfen). `src/persistence/repository.test.ts`: Der Verlauf der Kopie enthält keine Bearbeitung des Originals. Prüfen: `npm test -- notebookStore repository songList workbooks` rot
- [x] 1.2 `copySong` in `NotebookStore` (design.md D1). Prüfen: `npm test -- notebookStore` grün
- [x] 1.3 `useSongTransfer` mit `copy` in `src/ui/songTransfer.tsx`, `CopyIcon`, Knopf `tile-copy` in „Meine Songs“ und in der Workbook-Karte (design.md D2, D3). Prüfen: `npm test -- repository songList workbooks` grün

## 2. Rückfrage beim Verschieben (workbook-sync)

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/ui/workbooks.test.tsx` und `src/ui/dragSong.test.tsx`: „Zu Workbook …“ und Loslassen auf einem Workbook verschieben erst nach Bestätigung; Abbrechen und Escape in der Rückfrage rufen `moveSong` nicht auf. Bestehende Tests zum Verschieben bestätigen die Rückfrage (geänderte Szenarien). Prüfen: `npm test -- workbooks dragSong` rot
- [x] 2.2 `move` in `useSongTransfer`; `MoveMenu` und `SongDragProvider` rufen es auf (design.md D2). Prüfen: `npm test -- workbooks dragSong` grün

## 3. Aus einem Workbook ziehen (workbook-sync, workbooks)

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/ui/dragSong.test.tsx`: Workbook-Kachel auf „Meine Songs“ ziehen und bestätigen legt eine Kopie an; „Meine Songs“ ist dabei hervorgehoben, „+ Song“ nicht; Einträge der Seitenleiste und das eigene Workbook sind weder hervorgehoben noch wirksam, die App fragt dort nichts; Escape beim Ziehen fragt nichts; Kacheln aus „Meine Songs“ über „Meine Songs“ bewirken nichts. Den Test „Workbook-Kachel lässt sich nicht ziehen“ entfernen (Szenario entfällt). Unit-Test für `dropEffect` (Tabelle in design.md D4). Prüfen: `npm test -- dragSong` rot
- [x] 3.2 `DropTarget` und Quelle im Ziehen, `dropEffect`, `data-drop-mine` an „Meine Songs“, `useDropTarget` liefert nur wirksame Ziele; Workbook-Kacheln ziehbar (design.md D4, D5). Prüfen: `npm test -- dragSong` grün
- [x] 3.3 `.overview-section.drop-target` mit den Tokens von `.workbook-main.drop-target`, Test in `src/ui/styles.test.ts` ergänzt (design.md D6). Prüfen: `npm test -- styles` grün

## 4. Integration

- [x] 4.1 Im Browser prüfen (Skript unter `~/tools/playwright`, hell und dunkel): Symbol „Kopieren“ an Kacheln in „Meine Songs“ und im Workbook, beide Kopier-Rückfragen, Rückfrage beim Verschieben über Menü und Ziehen, Hervorhebung von „Meine Songs“ beim Ziehen aus einem Workbook. Prüfen: Screenshots zeigen das erwartete Verhalten
- [x] 4.2 `openspec validate copy-song --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
