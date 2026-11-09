# Tasks

## 1. Reihenfolge im Workbook-Dokument (workbook-sync)

- [x] 1.1 Tests aus den Szenarien erfassen (rot). `src/persistence/workbookDoc.test.ts` (neu): `createWorkbookDoc` enthält `order`; Positionen setzen und lesen; `isValidWorkbookDoc` lehnt Positionen falscher Form ab; `changesAllowed` erlaubt `order` für jedes Mitglied und `seen` nur für eigene Einträge in gemeinsamen Workbooks; zwei gleichzeitig gesetzte Positionen desselben Songs ergeben nach dem Zusammenführen auf beiden Seiten denselben Wert. `server/sync.test.ts`: Der eigene Bestand hat ein Dokument (Test „führt kein Dokument für den eigenen Bestand“ entfällt, geänderte Anforderung); ein bestehendes Dokument ohne `order` erhält es beim Abgleich; Max darf eine Position ändern, die Artjom gesetzt hat; `seen` im eigenen Bestand wird zurückgewiesen. Prüfen: `npm test -- workbookDoc sync` rot
- [x] 1.2 `order` in `workbookDoc.ts`: anlegen, lesen, setzen, prüfen, `changesAllowed` (design.md D1, D2, D4). Prüfen: `npm test -- workbookDoc` grün
- [x] 1.3 Server: Teil `workbook` auch für den eigenen Bestand, `order` in bestehenden Dokumenten ergänzen (design.md D2, D3). Prüfen: `npm test -- server/sync` grün

## 2. Reihenfolge berechnen (song-order)

- [x] 2.1 `fractional-indexing` als Abhängigkeit aufnehmen. Prüfen: `npm install` ohne Fehler, Import in einem Test möglich
- [x] 2.2 Tests aus den Szenarien erfassen (rot), `src/domain/songOrder.test.ts`: `ordered` (Positionen zuerst, Gleichstand nach ID, ohne Position nach Titel); `placeAt` für Plätze im sortierten Anfang, direkt dahinter und in den Songs ohne Position, die übrigen Songs behalten ihre Reihenfolge, gleicher Zustand ergibt gleiche Werte; Szenarien „Verschiedene Songs verschoben“ und „Denselben Song verschoben“ über zwei zusammengeführte Dokumente; `slotAt` für Zeilen, Mitte der Kachel und Ende. Prüfen: `npm test -- songOrder` rot
- [x] 2.3 `ordered`, `placeAt`, `slotAt` in `src/domain/songOrder.ts` (design.md D5). Prüfen: `npm test -- songOrder` grün

## 3. Abgleich im Client (workbook-sync, song-order)

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/sync/sync.test.ts` und `src/persistence/repository.test.ts`: Das Dokument des eigenen Bestands wird abgeglichen, ohne gesehene Stände zu setzen; `reorder` setzt Positionen, speichert sie, benachrichtigt und überträgt sie, auch nach Offline-Arbeit; Sortieren ändert keinen Song und keine letzte Änderung; nach dem Abmelden gibt es keine Positionen. Prüfen: `npm test -- sync repository` rot
- [x] 3.2 `repo.orderOf`, `repo.setPositions`, `Sync.reorder`, Abgleich des Dokuments für jedes Workbook, gesehene Stände nur bei gemeinsamen Workbooks; `SongActivity.order` (design.md D3, D8, D9). Prüfen: `npm test -- sync repository` grün

## 4. Sortieren in der Oberfläche (song-order, song-library, workbook-sync)

- [x] 4.1 Tests aus den Szenarien erfassen (rot). `src/ui/dragSong.test.tsx` und `src/ui/songList.test.tsx`: Kacheln nach Positionen, ohne Position nach Titel, „+ Song“ zuletzt, abgemeldet nach Titel. `src/ui/dragSong.test.tsx` (Rechtecke der Kacheln vorgegeben): Sortieren in „Meine Songs“ und im Workbook ohne Rückfrage; Einfügemarke am Platz, Bereich und Eintrag dabei nicht hervorgehoben; Escape und Loslassen am eigenen Platz schreiben nichts; Verschieben in den Bereich und Kopieren nach „Meine Songs“ setzen die Position erst nach Bestätigung, scheiterndes Verschieben und Abbrechen setzen keine; Eintrag der Seitenleiste, Menü und Symbol setzen keine; `dropEffect` mit `reorder` (Tabelle in design.md D6). Bestehende Tests, die Loslassen im eigenen Bereich als wirkungslos prüfen, folgen den geänderten Szenarien. Prüfen: `npm test -- songList dragSong` rot
- [x] 4.2 `SongTiles` mit Positionen und `data-song-id`; „Meine Songs“ und Workbook-Karte lesen `SongActivity.order` (design.md D9). Prüfen: Reihenfolge-Tests aus 4.1 grün
- [x] 4.3 `DropTarget` mit `slot`, `targetAt` mit `slotAt`, `dropEffect` mit `reorder`, `copy` und `move` liefern ihr Ergebnis, Position nach der Aktion (design.md D6, D8). Prüfen: `npm test -- dragSong workbooks` grün
- [x] 4.4 Einfügemarke `drop-before` mit `--accent` und `--z-local-*`, Test in `src/ui/styles.test.ts` (design.md D7). Prüfen: `npm test -- styles` grün

## 5. Integration

- [x] 5.1 Im Browser prüfen (Skript unter `~/tools/playwright`, hell und dunkel, zwei Konten): Sortieren in „Meine Songs“ und im Workbook mit Einfügemarke, Ablegen an der Marke beim Verschieben und Kopieren, Reihenfolge erscheint beim anderen Mitglied, abgemeldet nach Titel. Prüfen: Screenshots zeigen das erwartete Verhalten
- [x] 5.2 `openspec validate sort-songs --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
