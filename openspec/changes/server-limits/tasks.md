# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren.

## 1. Server: Speicher

- [x] 1.1 Tests erfassen (rot), `server/limits.test.ts` gegen `createApp` mit kleinen Grenzen: neuer Song über der Grenze (409 `quota-exceeded`, nichts gespeichert), Abgleich über der Grenze (`quota` mit Grund, Stand unverändert, andere Songs laufen weiter, kein Ereignis), Änderung ohne Wachstum und Löschen in vollem Bestand möglich, Löschen gibt Platz frei, Grabsteine zählen, Mitglied schreibt in fremdes Workbook zählt beim Besitzer, eigener Bestand zählt beim Account, `move` in volles Workbook, Gesamtgrenze (`server-full`, protokolliert). Prüfen: `npm test -- limits` rot
- [x] 1.2 `server/limits.ts`, Belegung und Prüfung nach D1, D2, D3 in `songs.ts`, `limits` in `AppDeps` und Testhilfe. Prüfen: `npm test -- server` grün, `tsc -p server` fehlerfrei

## 2. Server: Workbooks, Mitglieder, Verbindungen

- [x] 2.1 Tests erfassen (rot), `server/limits.test.ts`: 51. eigenes Workbook abgewiesen, eigener Bestand zählt nicht; 51. Mitglied abgewiesen ohne Mail und ohne Verbrauch des Mail-Kontingents (D5); elfte Verbindung 429, nach dem Schließen einer Verbindung wieder möglich; Gesamtgrenze der Verbindungen. Prüfen: `npm test -- limits` rot
- [x] 2.2 Prüfungen in `workbooks.ts` und `events.ts` umsetzen. Prüfen: `npm test -- server` grün, `tsc -p server` fehlerfrei

## 3. Client

- [x] 3.1 Tests erfassen (rot), `src/sync/limits.test.ts`, zwei Geräte gegen `createApp` mit kleinen Grenzen: Neuer Song über der Grenze bleibt lokal und geht nach Freigabe hinaus, Änderung wartet auf Platz ohne Kopie, Abmelden mit abgewiesener Änderung (`prepareLogout` falsch), Meldung erscheint einmal und nach Erfolg wieder neu, Verschieben in volles Workbook, abgewiesener Ereigniskanal mit weiterem Abgleich. Prüfen: `npm test -- src/sync/limits` rot
- [x] 3.2 `src/sync/api.ts`, `src/sync/sync.ts` nach D4. Prüfen: `npm test -- src/sync` grün, `tsc` fehlerfrei

## 4. Oberfläche

- [x] 4.1 Tests erfassen (rot), `src/ui/workbooks.test.tsx`: Meldungen für `quota-exceeded`, `server-full`, `too-many-workbooks`, `too-many-members` an den vorgesehenen Stellen (Stapel bzw. Popover). Prüfen: `npm test -- workbooks` rot
- [x] 4.2 Texte in `syncMessage`. Prüfen: Tests aus 4.1 grün, `npm test` grün

## 5. Integration

- [x] 5.1 `AGENTS.md` im Abschnitt `server/` um die Grenzen ergänzen. Prüfen: `npm test`, `npm run build` grün, `openspec validate server-limits --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
