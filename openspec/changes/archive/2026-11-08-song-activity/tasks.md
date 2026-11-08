# Tasks

## 1. Workbook-Dokument auf dem Server (workbook-sync)

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `server/sync.test.ts` bzw. `server/workbooks.test.ts`: erster Abgleich mit `workbook: { base: [] }` liefert ein neues Dokument; „Gleichzeitig gesehen“ (zwei Mitglieder, beide Einträge bleiben); „Fremden Eintrag ändern“ (`invalid`, Dokument unverändert); falsche Form; unbekannte `base` (`unrelated`); eigener Bestand ohne Teil `workbook`; „Anzahl der Songs“ und Löschsperre unberührt; Löschen des Workbooks entfernt das Dokument; Ereignis `workbook` nach Änderung; Anfrage ohne Teil `workbook` unverändert. Prüfen: `npm test -- server/sync server/workbooks` rot
- [x] 1.2 Tabelle `workbook_docs`, Anlegen beim ersten Abgleich, Prüfung von Form und Pfaden, Belegung, Antwort und Löschen (design.md D2, D3). Prüfen: `npm test -- server` grün

## 2. Workbook-Dokument im Client (workbook-sync)

- [x] 2.1 Tests (rot), `src/persistence/repository.test.ts` und `src/sync/sync.test.ts`: Upgrade 4 → 5 behält Songs; Dokument speichern, laden, eigenen Eintrag setzen und ausgehend senden; Antwort `ok`, `invalid`, `unrelated` anwenden; kein Teil `workbook` für den eigenen Bestand; Abmelden und Verlust des Workbooks entfernen das Dokument; „Neues Mitglied“ (Eintrag mit den Heads aller bekannten Songs nach dem ersten Abgleich, design.md D8). Prüfen: `npm test -- repository sync` rot
- [x] 2.2 Store `workbookDocs`, Repository-Funktionen, `api.sync` und `syncWorkbook` erweitern, Anfangseintrag (design.md D4, D8). Prüfen: `npm test -- repository sync` grün

## 3. Letzte Änderung und Neues (song-activity)

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/persistence/activity.test.ts`: letzte Änderung mit Zeit und Autor, auch bei nebenläufigen Heads; „Max ändert“, „Hin und zurück“, „Eigenes anderes Gerät“, „Neuer Song eines anderen“, „Offline-Änderung von Max“, unbekannter Head im gesehenen Stand, Change ohne Autor. Prüfen: `npm test -- activity` rot
- [x] 3.2 `persistence/activity.ts` und Zugriff mit Zwischenspeicher im Repository (design.md D5, D6). Prüfen: `npm test -- activity repository` grün
- [x] 3.3 Tests (rot), `src/ui/historyText.test.ts` (neu): `formatRelative` für gerade eben, Minuten, Stunden, „Gestern“, Datum mit und ohne Jahr, „Uhr eines Geräts geht vor“; ohne Prüfung ganzer Hinweistexte. Prüfen: `npm test -- historyText` rot
- [x] 3.4 `formatRelative` (design.md D9). Prüfen: `npm test -- historyText` grün

## 4. Gesehen (song-activity)

- [x] 4.1 Tests aus den Szenarien erfassen (rot), `src/sync/sync.test.ts`: „Song öffnen“ (Eintrag gesetzt, Punkt weg), „Während der Song offen ist“ (eintreffende Änderung wird gesehen), kein Eintrag in „Meine Songs“ und ohne Anmeldung, Eintrag nur bei geänderten Heads, „Anderes Gerät“ (eingehender Eintrag entfernt den Punkt). Prüfen: `npm test -- sync` rot
- [x] 4.2 Schreiben beim Öffnen und entprellt, solange der Song offen ist (design.md D7). Prüfen: `npm test -- sync` grün

## 5. Anzeige (song-activity, song-library)

- [x] 5.1 Tests aus den Szenarien erfassen (rot), `src/ui/songActivity.test.tsx` bzw. `songList.test.tsx` und `workbooks.test.tsx`: „Gemeinsames Workbook“ (Zeit und Name), „Meine Songs“ (Zeit, kein Autor, kein Punkt), Punkt mit zugänglichem Namen, „Songs mit Neuem“ und „Nichts Neues“ in der Seitenleiste, Zeitangabe folgt nach einer Minute (Fake-Timer). Prüfen: `npm test -- songActivity songList workbooks` rot
- [x] 5.2 Kachel und Seitenleiste nach design.md D9; Tokens und neue Paare aus Schrift und Fläche in `styles.css` bzw. `designSystem.test.ts`. Prüfen: `npm test` grün

## 6. Integration

- [x] 6.1 Ablauf mit zwei Konten im Browser prüfen (Skript unter `~/tools/playwright`, Screenshots hell und dunkel): Max ändert, die Punkte an Kachel und Eintrag erscheinen bei Artjom, Öffnen entfernt beide auf zwei Geräten. Prüfen: Screenshots zeigen das erwartete Verhalten
- [x] 6.2 `openspec validate song-activity --strict` und `npm run build`. Prüfen: beide fehlerfrei
