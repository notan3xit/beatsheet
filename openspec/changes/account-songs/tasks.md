# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests ändern sich nur, wo eine geänderte Anforderung es verlangt (Abschnitte `MODIFIED` der Delta-Specs).

## 1. Server: persönliches Workbook

- [x] 1.1 Tests erfassen (rot), `server/personal.test.ts` gegen `createApp`: Liste liefert genau ein Workbook mit `personal: true` und legt es nur einmal an; Songs hinzufügen und Abgleich wie in anderen Workbooks; `PATCH`, `DELETE`, Einladen, Entfernen und Verlassen ergeben 403 `personal` ohne Änderung; ein anderer Account erhält 404 und ändert nichts. Prüfen: `npm test -- personal` rot
- [x] 1.2 Tabelle und Schutz nach D1 umsetzen. Bestehende Tests, die die Workbook-Liste exakt vergleichen, um das persönliche Workbook ergänzen. Prüfen: `npm test -- server` grün, `tsc -p server` fehlerfrei

## 2. Server: Verschieben

- [x] 2.1 Tests erfassen (rot), `server/personal.test.ts`: `move` ändert das Workbook, behält Heads und Dokument; ohne Mitgliedschaft in einem der Workbooks oder bei unbekanntem Song 404 und keine Änderung; Ereignis `workbook` an beide Workbooks; `sync` im alten Workbook antwortet `moved` mit `to`, für Nichtmitglieder des Ziels `deleted`; danach übernimmt `sync` im Ziel offene Änderungen. Der bestehende Test „behandelt den Song eines anderen Workbooks wie unbekannt“ prüft den Fall ohne Mitgliedschaft im Ziel. Prüfen: `npm test -- personal` rot
- [x] 2.2 Endpunkt und Antwort nach D7 umsetzen. Prüfen: `npm test -- server` grün, `tsc -p server` fehlerfrei

## 3. Client: Speicher

- [x] 3.1 Tests erfassen (rot), `src/persistence/repository.test.ts`: `markDeleted` übersteht Neuladen, `loadAll` überspringt den Datensatz, ein späteres `write` mit `remove` lässt ihn stehen, `clearDeleted` entfernt ihn, `hasUnsent` zählt ihn, `forgetWorkbookSongs` entfernt ihn; lokale Songs ohne Zugehörigkeit überstehen `forgetWorkbookSongs`. Prüfen: `npm test -- repository` rot
- [x] 3.2 Repository nach D6 und D8 umsetzen. Prüfen: `npm test -- repository` grün

## 4. Client: Sync

- [x] 4.1 Tests erfassen (rot), `src/sync/account.test.ts`, zwei Geräte gegen `createApp`: alle Szenarien aus `account-songs` außer der Oberfläche (Zweites Gerät, Neuer Song auf einem Gerät über das Ereignis, Song gelöscht, Erste Anmeldung mit lokalen Songs mit Hinweis, Bestand zweier Geräte, Dieselbe Datei auf zwei Geräten, Abweichende Fassung, im Account gelöschte ID, Anlegen und Löschen ohne Verbindung einschließlich Neuladen, Abmelden und wieder anmelden, Nie übertragener Song, Anderer Account auf demselben Gerät, Abgemeldet anlegen, Zweites Gerät mit offenen Änderungen beim Verschieben); dazu D3 `invalid-song` mit einmaliger Meldung und D9. Prüfen: `npm test -- src/sync/account` rot
- [x] 4.2 `src/sync/` und `api.ts` nach D3 bis D9 umsetzen. Bestehende Tests in `src/sync/sync.test.ts` anpassen, wo sie „Meine Songs“ als Songs ohne Zugehörigkeit prüfen (Hilfsfunktion `local`, Abmelden). Prüfen: `npm test -- src/sync` grün, `tsc` fehlerfrei

## 5. Oberfläche

- [x] 5.1 Tests erfassen (rot), `src/ui/workbooks.test.tsx` mit Fake-Sync: persönliches Workbook erscheint nicht als Karte und nicht in „Zu Workbook …“; seine Songs stehen in „Meine Songs“; „Zu Workbook …“ fehlt ohne weitere Workbooks; Löschnachfrage und Import-Hinweis nennen bei eigenen Songs keine Mitglieder; Löschen eines eigenen Songs ruft `deleteSong`; Hinweis nach der Übernahme erscheint. `src/ui/account.test.tsx` an die geänderte Anforderung „Abmelden“ anpassen, soweit nötig. Prüfen: `npm test -- workbooks account` rot
- [x] 5.2 Filter und Texte nach D2 umsetzen. Prüfen: Tests aus 5.1 und `npm test -- styles` grün, `npm test` grün
- [x] 5.3 Tests erfassen (rot), `src/ui/workbooks.test.tsx`: Hinweis auf fehlenden dauerhaften Speicher abgemeldet mit Verweis auf „Exportieren“, angemeldet mit Account und nicht übertragenen Änderungen, ohne Export; Wechsel beim Anmelden und Abmelden. Prüfen: `npm test -- workbooks` rot
- [x] 5.4 Hinweis nach `library-persistence` umsetzen. Prüfen: Tests aus 5.3 grün, `npm test` grün
- [x] 5.5 Tests erfassen (rot), `src/ui/workbooks.test.tsx`: Szenarien aus `app-messages`; bestehende Tests zu Fehlern in Karten an die Anforderung anpassen. Prüfen: `npm test -- workbooks` rot
- [x] 5.6 Stapel nach D10 umsetzen, Styles nur mit semantischen Tokens. Prüfen: Tests aus 5.5 und `npm test -- styles` grün, `npm test` grün
- [x] 5.7 Tests erfassen (rot), `src/ui/styles.test.ts`: Jedes `z-index` verweist auf ein Token `--z-*`, Reihenfolge der Ebenen, Zuordnung von Stapel, Popovern, Dialogen und gezogenem Element. Prüfen: `npm test -- styles` rot
- [x] 5.8 Ebenen nach D11 umsetzen, Regel in `AGENTS.md`. Prüfen: `npm test` grün

## 6. Integration

- [x] 6.1 `AGENTS.md` im Abschnitt zu `sync` und `server/` um den persönlichen Bestand ergänzen. Prüfen: `npm test`, `npm run build` grün, `openspec validate account-songs --strict` fehlerfrei
- [x] 6.2 Ende-zu-Ende mit artjom: Server und Dev-Server auf einem freigegebenen Port, zwei Browser mit demselben Login: lokale Songs vor dem Anmelden anlegen, anmelden (Hinweis), Songs erscheinen auf dem zweiten Browser, Änderung und Löschen binnen 5 s, offline anlegen und löschen, dann wieder verbinden, Song nach „Band“ verschieben, abmelden und wieder anmelden, zweiter Account auf demselben Browser. Ergebnis in design.md festhalten

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
