# Tasks

## 1. Beispiel-Song (song-library)

- [x] 1.1 Tests aus den Szenarien erfassen (rot). `src/state/notebookStore.test.ts`: `createExampleSong` legt „Beispiel-Song“ mit Patterns und Segmenten an, mit neuer ID bei jedem Aufruf, Revision 1, ohne Workbook-Platzierung; die Datei wird von `parseNotebookFile` fehlerfrei gelesen und enthält die Patterns aus design.md D5. `src/ui/songList.test.tsx`: leeres „Meine Songs“ zeigt „+ Beispiel-Song“ vor „+ Song“ und keinen Hinweistext (die Prüfungen auf „Noch keine Songs“ folgen dem geänderten Szenario „Leere Liste“); Klick öffnet die Doppelseite von „Beispiel-Song“, danach fehlt die Kachel; mit einem Song fehlt sie; nach dem Löschen des letzten Songs ist sie wieder da. `src/sync/account.test.ts`: angemeldet angelegter Beispiel-Song wird wie ein neuer eigener Song übertragen. Prüfen: `npm test -- notebookStore songList account` rot
- [x] 1.2 `src/state/exampleSong.json` nach design.md D5 in der Form eines Exports anlegen (design.md D1). Prüfen: Test „Datei wird gelesen“ aus 1.1 grün
- [x] 1.3 `store.createExampleSong()` (design.md D2). Prüfen: `npm test -- notebookStore` grün
- [x] 1.4 Kachel „+ Beispiel-Song“ in `SongTiles`/`MySongs`, Hinweistext entfernen (design.md D3). Prüfen: `npm test -- songList account` grün

## 2. Hinweis auf der Pattern-Seite

- [x] 2.1 Hinweis „Noch keine Patterns …“ aus `src/ui/PatternPage.tsx` entfernen. Prüfen: `npm test -- patternPage songbook` grün

## 3. Erklärung der Workbooks (workbooks)

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/ui/workbooks.test.tsx`: Knopf „Was sind Workbooks?“ neben der Überschrift öffnet ein Popover (ohne Prüfung des Wortlauts); Escape, Klick außerhalb und erneuter Klick schließen es; ohne Workbook kein Hinweistext. Prüfen: `npm test -- workbooks` rot
- [x] 3.2 Knopf „?“ und Popover in `src/ui/WorkbookArea.tsx` mit Text aus design.md D4, Hinweistext entfernen, Stil mit semantischen Tokens und `--z-popover`. Prüfen: `npm test -- workbooks styles designSystem` grün

## 4. Integration

- [x] 4.1 Im Browser prüfen (Skript unter `~/tools/playwright`, hell und dunkel): leeres „Meine Songs“ mit beiden Kacheln, Beispiel-Song gesperrt geöffnet und abspielbar, Notation und Struktur wie in design.md D5, Popover „?“ bei den Workbooks, leere Pattern-Seite ohne Hinweis. Prüfen: Screenshots zeigen das erwartete Verhalten
- [x] 4.2 `openspec validate example-song --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
