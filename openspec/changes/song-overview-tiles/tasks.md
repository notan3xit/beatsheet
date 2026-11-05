# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren.

## 1. Motiv

- [x] 1.1 Tests aus den Szenarien erfassen (rot), neu `src/songbook/motif.test.ts`: „Aufbau des Motivs“ (gleicher Groove, Fill am Ende einer Phrase, leerer Takt, Blöcke und Segmente) und „Motiv eines leeren Songs“ als leere Liste. Prüfen: `npm test -- motif` rot
- [x] 1.2 `songMotif` nach design.md D1. Prüfen: die Tests aus 1.1 grün
- [x] 1.3 Tests erfassen (rot): geändertes Szenario „Langer Song“ in `src/songbook/motif.test.ts` (12 Reihen) und `src/ui/songList.test.tsx` (feste Strichhöhe ohne Skalierung); danach Begrenzung nach D2. Prüfen: `npm test -- motif songList` erst rot, dann grün

## 2. Kacheln in „Meine Songs“

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/ui/songList.test.tsx`: „Song-Liste“ (Sortierte Liste, Leere Liste, Song öffnen, per Tastatur, Neuer Song landet in „Meine Songs“), „Song über die Kachel ‚+ Song‘ anlegen“, „Darstellung des Motivs“ (Striche mit Pattern-Farbe, keine Taktstriche, leerer Song mit Punkten); bestehende Tests nach D7 anpassen. Prüfen: `npm test -- songList` zeigt diese Tests rot
- [x] 2.2 `SongMotif` nach D2, `SongTile` und „+ Song“ nach D3, `SongList` für „Meine Songs“, CSS mit Tokens; `SongTable` entfernen. Prüfen: die Tests aus 2.1, `songLock`, `account` und `src/ui/styles.test.ts` grün

## 3. Bereich „Workbooks“

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/ui/workbooks.test.tsx`: geänderte Anforderungen von `workbooks` (anlegen, Startseite, umbenennen, löschen, einladen, entfernen), „Workbook wählen“, geänderte Szenarien von `workbook-sync` (Verschieben über „Zu Workbook …“, Anlegen in der Karte, Neuer Song eines anderen Mitglieds, Neuladen ohne Server, Abmelden) und von `app-messages`; Hilfsfunktionen nach D7 anpassen. Prüfen: `npm test -- workbooks` zeigt diese Tests rot
- [x] 3.2 `createWorkbook` und `createSongIn` liefern die ID nach D4, mit Tests in `src/sync/account.test.ts` bzw. den vorhandenen Sync-Tests. Prüfen: `npm test -- src/sync` grün
- [x] 3.3 `WorkbookArea` nach D4, Wahl nach D5, `WorkbookCard` darin aufgehen lassen, CSS mit Tokens. Prüfen: die Tests aus 3.1 und `src/ui/styles.test.ts` grün

## 4. Ziehen

- [x] 4.1 Tests aus den Szenarien erfassen (rot), neu `src/ui/dragSong.test.tsx` mit Trefferprüfung über `HitTestContext`: „Song in ein Workbook ziehen“ (auf einen Eintrag, ins gewählte Workbook, Ziel hervorgehoben, Abbrechen per Loslassen und Escape, Klick statt Ziehen, Workbook-Kachel); `.drag-tile` in die Ebenen-Tabelle von `src/ui/styles.test.ts`. Prüfen: `npm test -- dragSong styles` zeigt diese Tests rot
- [x] 4.2 `dragSong` nach D6. Prüfen: die Tests aus 4.1 grün

## 5. Abschluss

- [x] 5.1 `~/tools/playwright/beatsheet-check.mjs` um die Übersicht erweitern (Kacheln, Wahl eines Workbooks, Ziehen, Motiv eines langen Songs auf 12 Reihen begrenzt und gleich groß) und in hell und dunkel ausführen. Prüfen: alle Prüfungen bestanden, Screenshots angesehen
- [x] 5.2 `AGENTS.md` auf den Aufbau unter `src/` prüfen, `npm run build`, `npm test` und `openspec validate song-overview-tiles --strict`. Prüfen: alle fehlerfrei

## 6. Nachbesserungen nach dem Test im Browser

- [x] 6.1 Tests erfassen (rot): „Gewähltes Workbook als Ziel“ in `src/ui/dragSong.test.tsx` und Regeln in `src/ui/styles.test.ts` (Hervorhebung über Randfarbe, kein Hover von „+ Song“ beim Ziehen); „Mitglieder-Popover“ in `src/ui/workbooks.test.tsx`. Prüfen: `npm test -- dragSong styles workbooks` zeigt diese Tests rot
- [x] 6.2 Hervorhebung und Hover nach D6, Popover nach D4, Symbol „Zu Workbook …“ nach D3. Prüfen: die Tests aus 6.1 grün, `npm test` und `npm run build` fehlerfrei, Browser-Prüfung bestanden und Screenshots angesehen

## 7. Song-Liste ohne Überschrift

- [x] 7.1 Tests erfassen (rot): „Song-Liste ohne Überschrift“ in `src/ui/navigation.test.tsx`; die Prüfung der Überschrift „Songs“ in `src/ui/styles.test.ts` entfällt mit der Anforderung. Prüfen: `npm test -- navigation` zeigt den Test rot
- [x] 7.2 Überschrift aus `SongList` entfernen, „Meine Songs“ und „Workbooks“ werden `h2`, CSS anpassen, Browser-Prüfung nachziehen. Prüfen: `npm test`, `npm run build` und Browser-Prüfung fehlerfrei

## Workflow follow-up

- Artjom prüft Darstellung und Ziehen im Browser, auf Touch-Geräten das Verschieben über „Zu Workbook …“.
- Entwurf unter `~/pub/beatsheet-entwurf` löschen, sobald er nicht mehr gebraucht wird.
- Specs übernehmen und Change archivieren.
