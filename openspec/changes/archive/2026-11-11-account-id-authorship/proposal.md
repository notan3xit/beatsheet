# Proposal

## Why

Song- und Workbook-Dokumente speichern die Mail-Adresse des Autors jeder Änderung (`by` in der Change-Message) und als Schlüssel der gesehenen Stände (`seen`). Die Automerge-Historie ist unveränderlich und liegt auf dem Server und allen Geräten der Mitglieder; eine spätere Account-Löschung könnte die Adresse daraus nicht entfernen. Mit einer zufälligen Account-ID statt der Adresse genügt es künftig, die Zuordnung ID → Adresse auf dem Server zu löschen.

## What Changes

- Jedes Konto wird in Dokumenten über seine Account-ID (`users.id`) bezeichnet, nicht über seine Adresse: Autor neuer Änderungen und Schlüssel der gesehenen Stände.
- Server liefert die eigene Account-ID mit Sitzung und Anmeldung, und je Workbook die Mitglieder als eine Liste mit Adresse, Account-ID (mit Konto) und Profil; sie ersetzt die bisherige Adressliste und `profiles`. Der Client merkt sich die ID mit der Adresse, damit auch Offline-Änderungen einen Autor tragen.
- Der Client löst Autoren lokal über die aktuellen Mitglieder des Workbooks auf: eine Kennung über diese Liste, eine Adresse aus bestehenden Historien direkt. Eigene Änderungen mit Adresse zählen als eigene. Ein Autor, der kein Mitglied ist, gilt als unbekannt: im Verlauf „Unbekannt“, auf der Kachel ohne Namen. Das gilt nach Entfernen, Austritt und einer späteren Account-Löschung gleichermaßen; der Server merkt sich keine ehemaligen Mitglieder. **BREAKING** für die Anzeige: Änderungen ehemaliger Mitglieder zeigen keinen Autor mehr statt ihrer Adresse.
- Der Server prüft gesehene Stände im Workbook-Dokument gegen die Account-ID. Bestehende Einträge unter Adressen bleiben im Dokument und werden nicht mehr gelesen; beim ersten Abgleich gilt „Beginn ohne Markierungen“, noch nicht angesehene Änderungen anderer verlieren dabei einmalig ihren Punkt.
- Bestehende Historien werden nicht umgeschrieben; Adressen darin bleiben gespeichert.

Nicht Teil dieses Changes: die Account-Löschung selbst.

## Capabilities

### New Capabilities

### Modified Capabilities
- `song-history`: Autor einer Änderung ist das Konto statt der Adresse; Adressen als Autor bleiben zuordenbar; Autoren ohne Mitgliedschaft erscheinen als „Unbekannt“.
- `song-activity`: Kachel nennt Autoren nur, wenn sie Mitglied sind; gesehene Stände stehen unter dem Konto.

## Impact

- `server/auth.ts`, `server/app.ts`: Account-ID zur Sitzung, in den Antworten von `verify` und `session`.
- `server/workbooks.ts`, `server/songs.ts`: Mitgliederliste mit Kennung und Profil in der Workbook-Antwort; `changesAllowed` mit Account-ID.
- `src/account`: Sitzung und API mit Account-ID, Speicherung im `localStorage`.
- `src/domain/types.ts` (`Workbook`), `src/main.tsx`, `src/sync`, `src/ui` (`WorkbookCard`, `WorkbookArea`, `SongHistory`, `SongTile`): Mitgliederliste, Autor und eigenes Konto über die ID.
- Ältere App-Versionen weist der Server als veraltet ab; sie schreiben nach dem Update keine Adressen mehr. Dateiformat (Export) bleibt unverändert.
