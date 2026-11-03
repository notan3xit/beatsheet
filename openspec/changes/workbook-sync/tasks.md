# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests bleiben unverändert, außer wo eine geänderte Anforderung es verlangt (`song-library`: Song-Liste).

## 1. Setup

- [ ] 1.1 Gemeinsamer Code nach design.md D1: `server/resolve.ts` und `server/register.ts`, Skript `server` als `node --import ./server/register.ts server/main.ts`, `server/tsconfig.json` mit `module: Preserve`/`moduleResolution: Bundler`. Prüfen: Ein Server-Test importiert `songOf` und `parseNotebookFile` aus `src/persistence` und läuft grün; `npm run server` startet; `npm run build` und `npm test` grün

## 2. Capability `workbooks`: Server

- [ ] 2.1 Tests aus den Szenarien erfassen (rot), `server/workbooks.test.ts` gegen `createApp` (In-Memory-Datenbank, feste Uhr, gesammelte Mails): Anlegen (mit/ohne Titel), Liste nur eigener Workbooks, Umbenennen (Besitzer, leerer Titel, Nicht-Besitzer 403), Löschen (leer, `not-empty`, Nicht-Besitzer), Einladen (sofort Mitglied, Mail mit Titel und Besitzer, ohne Konto, `invalid-email`, `already-member` ohne Mail), Begrenzung 20/Stunde je Besitzer und gemeinsame Gesamtgrenze mit Anmeldecodes, Entfernen, Verlassen, Besitzer kann nicht verlassen, Nichtmitglied erhält 404, ohne Sitzung 401. Prüfen: `npm test -- workbooks` rot
- [ ] 2.2 Tabellen nach D2, Endpunkte nach D3 (ohne Songs und Sync), Einladungsmail und Begrenzung nach D11 inkl. `--app-url`, Körpergrenze 2 MB für `/api/workbooks/**`. Prüfen: `npm test -- server` grün, `tsc -p server` fehlerfrei

## 3. Capability `workbook-sync`: Server

- [ ] 3.1 Tests erfassen (rot), `server/sync.test.ts`: Song hinzufügen (201, `exists`, `invalid-song`, falsche ID im Dokument), Löschen als Grabstein, Sync nach D4 (`ok` mit Rückgabe nur fremder Änderungen, `new`, `deleted`, `unrelated` bei leerem/unbekanntem `base`, `invalid` bei Formatfehler, Server-Stand danach unverändert), 413 über 2 MB, zwei Clients mit gleichzeitigen Änderungen ergeben nach Sync beider denselben Song. SSE nach D6: `workbook`-Ereignis an alle Mitglieder nach Sync mit Änderungen, `workbooks`-Ereignis an Entfernte, nichts an Nichtmitglieder, 401 ohne Sitzung. Prüfen: `npm test -- sync` rot
- [ ] 3.2 Songs, Sync, Prüfung (D5) und Ereigniskanal (D6) umsetzen. Prüfen: `npm test -- server` grün, `tsc -p server` fehlerfrei

## 4. Client: Speicher und Store

- [ ] 4.1 Tests erfassen (rot): `src/persistence/repository.test.ts` – Version 4 übernimmt Daten aus Version 3 unverändert (alle Songs lokal), Zugehörigkeit, `serverHeads` und Workbook-Liste überstehen Neuladen, `forgetWorkbookSongs` lässt lokale Songs unberührt; `receive` nach D8: Eine Store-Änderung, die während einer Anfrage entsteht, und die Server-Änderung bleiben beide erhalten, und `connectStore` erzeugt danach keine weitere Dokumentänderung. `src/state/notebookStore.test.ts` – `applyRemote` ohne Revisionserhöhung und ohne Ansichtswechsel, Wechsel zur Startseite, wenn der geöffnete Song entfernt wird, `place`, `createSong` mit Workbook. Prüfen: `npm test -- repository notebookStore` rot
- [ ] 4.2 Repository nach D7/D8, Store nach D8a, Account-Zustand `src/account/session.ts`, `AccountMenu` darauf umstellen. Prüfen: die Tests aus 4.1 und `npm test -- account` grün

## 5. Client: Sync

- [ ] 5.1 Tests erfassen (rot), `src/sync/sync.test.ts`: zwei Clients (eigene IndexedDB-Namen, eigene Sitzung) gegen `createApp` mit In-Memory-Datenbank auf freiem Port; Szenarien aus `workbook-sync`: Verschieben (inkl. Server nicht erreichbar), Anlegen im Workbook, Löschen für alle, offline geändert und inzwischen gelöscht, Zwei Geräte binnen 5 Sekunden (über das Ereignis, ohne 60-s-Abgleich), Neuer Song eines anderen Mitglieds, Gleichzeitig offline, Import vor dem Abgleich (Kopie in „Meine Songs“), Kaputte Daten; aus `workbooks`: Entfernt während offline, Weiterarbeiten nach dem Austritt, Erste Anmeldung nach der Einladung. Dazu D9: höchstens eine Anfrage je Workbook, 401 lässt Songs stehen. Prüfen: `npm test -- sync` rot
- [ ] 5.2 `src/sync/` nach D4, D9, D10 (HTTP-Client, `EventSource`, Auslöser, Abkoppeln), Anbindung in `src/main.tsx`. Prüfen: Tests aus 5.1 grün, `npm test` grün

## 6. Oberfläche

- [ ] 6.1 Tests erfassen (rot) mit Fake-Sync und Fake-Account: `src/ui/workbooks.test.tsx` – Workbook anlegen (mit/ohne Titel), Abgemeldet nur „Meine Songs“, Reihenfolge der Karten, Umbenennen (Besitzer, leer), Löschen nur leer mit Nachfrage, Mitglieder-Popover (Einladen mit Meldungen für `invalid-email`, `already-member`, `rate-limited`; Entfernen; Verlassen; kein Verlassen für den Besitzer), „Zu Workbook …“ nur angemeldet mit Workbooks und ohne den Song zu öffnen, „Song anlegen“ in der Karte, Hinweis nach Austritt, Abmelden (nur „Meine Songs“ danach; Nachfrage bei nicht übertragenen Änderungen, Ablehnen lässt angemeldet). Bestehende `src/ui/songList.test.tsx` an die geänderte Anforderung „Song-Liste“ anpassen (Tabelle in „Meine Songs“, neuer Song landet dort). Löschnachfrage für Workbook-Songs und Hinweis im Import-Dialog bei „Ersetzen“ (`persistence.test.tsx` bzw. Songbook-Tests); Export enthält Workbook-Songs. Prüfen: `npm test -- workbooks songList persistence` rot
- [ ] 6.2 Komponenten nach D12, Abmelden nach D13, Styles nur mit semantischen Tokens. Prüfen: Tests aus 6.1 und `npm test -- styles` grün, `npm test` grün

## 7. Integration

- [ ] 7.1 Vite-Proxy leitet `/api/events` als Stream durch (`curl -N` über den Dev-Server erhält `: ping`); `AGENTS.md`: Aufbau (`src/sync`, gemeinsamer Code mit dem Server, Resolve-Hook) und Befehle (`--app-url`). Prüfen: `npm test`, `npm run build` grün
- [ ] 7.2 Ende-zu-Ende mit artjom: Server mit `--insecure-cookie` und `--app-url`, Dev-Server auf einem freigegebenen Port; zwei Geräte bzw. Browser: Workbook anlegen, zweite Adresse einladen (Mail kommt an), Song verschieben, auf beiden gleichzeitig bearbeiten (Änderung erscheint binnen 5 s), offline bearbeiten und wieder verbinden, Mitglied entfernen (Songs abgekoppelt), Song löschen, Abmelden. Ergebnis in design.md festhalten
- [ ] 7.3 `openspec validate workbook-sync --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
