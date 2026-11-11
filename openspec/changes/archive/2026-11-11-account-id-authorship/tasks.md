# Tasks

## 1. Kennung auf dem Server (song-history, song-activity)

- [x] 1.1 Tests (rot), `server/auth.test.ts`, `server/workbooks.test.ts`, `server/sync.test.ts`: `verify` und `session` antworten mit `email` und `account` (= `users.id`, bei erneuter Anmeldung gleich); Workbook-Antwort liefert `members` als Liste `{ email, account?, profile? }`, Besitzer zuerst: `account` für Mitglieder mit Konto, nicht für eingeladene ohne Konto, nach Austritt und Entfernen kein Eintrag mehr, nach erneuter Einladung wieder dieselbe Kennung; `profile` nur Mitgliedern gemeinsamer Workbooks; kein Feld `profiles`; „Nur eigene gesehene Stände“ mit Kennungen: Eintrag unter eigener Kennung angenommen, unter fremder Kennung und unter der eigenen Adresse abgewiesen. Prüfen: `npm test -- server` rot
- [x] 1.2 `sessionAccount`, Antworten von `verify` und `session`, `account` in `WorkbookRequest`, Mitgliederliste in `present`, `changesAllowed` mit Kennung (design.md D2, D3, D6). Prüfen: `npm test -- server` grün

## 2. Kennung im Client (song-history)

- [x] 2.1 Tests (rot), `src/account/api.test.ts`, `src/account/session.test.ts`: API liefert `account` aus `verify` und `session`; Sitzung merkt Adresse und Kennung über einen Neustart; gespeicherter Wert einer älteren Version (nur Adresse) ergibt Adresse ohne Kennung, `refresh` ergänzt sie; Abmelden entfernt beides. Prüfen: `npm test -- account` rot
- [x] 2.2 `AccountApi` und `AccountSession` mit Kennung, Speicherung als JSON; Aufrufer von `getEmail`/`setEmail` anpassen (design.md D2). Prüfen: `npm test -- account sync` grün

## 3. Mitgliederliste im Client (workbooks)

- [x] 3.1 Testdaten der bestehenden Tests auf die neue Form von `members` umstellen, ohne Erwartungen zu ändern (`src/ui/workbooks.test.tsx`, `src/sync/*.test.ts` u. a.); dazu (rot) Typ und Cache: Liste übersteht das Speichern in IndexedDB. Prüfen: `npm test` rot nur wegen der Form
- [x] 3.2 Typ `Workbook`, `WorkbookCard`, `WorkbookArea` und Kopf/Liste der Mitglieder auf die Liste umstellen (design.md D3). Prüfen: `npm test -- workbooks sync repository` grün

## 4. Autor einer Änderung und Personen im Verlauf (song-history)

- [x] 4.1 Tests aus den Szenarien erfassen (rot), `src/persistence/repository.test.ts`, `src/ui/songHistory.test.tsx`: „Keine Adresse im Song“ (gespeicherte Bytes enthalten die Adresse nicht); „Offline nach Neustart“ (Autor ist die gemerkte Kennung); „Ohne Anmeldung“; „Änderung im Workbook“ (Kennung über die Mitgliederliste zu Profil bzw. Adresse aufgelöst); offline über die gespeicherte Liste; „Adresse als Autor“ (Profilname eines Mitglieds); „Eigene Adresse“ (Wiederherstellen nennt keine Änderungen anderer); „Ausgetretenes Mitglied“ mit Kennung und mit Adresse zeigt „Unbekannt“; „Wieder eingeladen“. Prüfen: `npm test -- repository songHistory` rot
- [x] 4.2 `author` in `main.tsx` mit Kennung, Auflösung von Kennung und Adresse über die Mitgliederliste, Vergleich mit eigener Kennung und Adresse in `SongHistory` und `restoreConsequences` (design.md D3, D4, D5). Prüfen: `npm test -- repository songHistory history` grün

## 5. Kachel und gesehene Stände (song-activity)

- [x] 5.1 Tests aus den Szenarien erfassen (rot), `src/ui/songActivity.test.tsx`, `src/persistence/activity.test.ts`, `src/persistence/workbookDoc.test.ts`, `src/sync/sync.test.ts`: „Gemeinsames Workbook“ (Name über die Mitgliederliste), „Autor nicht mehr Mitglied“ (kein Autor, mit Kennung und mit Adresse), Change mit Adresse eines Mitglieds nennt dessen Profilnamen; „Eigenes anderes Gerät“ mit Kennung und mit eigener Adresse (kein Punkt); „Keine Adresse im Workbook-Dokument“ (Eintrag unter der Kennung, Bytes ohne Adresse); vorhandener Eintrag unter der eigenen Adresse wird nicht gelesen, „Beginn ohne Markierungen“ legt den Eintrag unter der Kennung an. Prüfen: `npm test -- songActivity activity workbookDoc sync` rot
- [x] 5.2 `SongTile` mit derselben Auflösung wie der Verlauf, `isNew` mit eigener Kennung und Adresse, `markSeen`/`workbookSeen` in `sync.ts` mit Kennung (design.md D3, D5, D6). Prüfen: `npm test -- songActivity activity workbookDoc sync` grün

## 6. Integration

- [x] 6.1 Gesamtlauf. Prüfen: `npm run build` und `npm test` grün
