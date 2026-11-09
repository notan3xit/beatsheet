# Tasks

## 1. Felder neuerer Versionen erhalten (library-persistence)

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `src/persistence/songDoc.test.ts`: unbekannte Felder an Song, Pattern, Segment, Block, Takt und Beat sowie ein unbekanntes Instrument in `hits` überstehen `applySong` mit einer Änderung, die nur den neuen Takt umfasst; empfangener Song mit unbekanntem Feld erzeugt beim Zurückschreiben keinen Change; eigene Taktart eines Patterns, Schläge, Akzente, Spielweisen und Betonungen lassen sich weiterhin entfernen; jeder Schlüssel aus `toDocShape` eines vollständig belegten Songs ist besessen (design.md D1). Prüfen: `npm test -- songDoc` rot
- [x] 1.2 Beschreibung der besessenen Schlüssel je Ebene in `songDoc.ts`, `syncMap` löscht nur diese (design.md D1). Prüfen: `npm test` grün
- [x] 1.3 AGENTS.md, Abschnitt „Dateiformat erweitern“: Ein neues Feld kommt auch in die Beschreibung der besessenen Schlüssel in `songDoc.ts`. Prüfen: Abschnitt nennt es

## 2. Versionsprüfung auf dem Server (workbook-sync)

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `server/sync.test.ts`: Abgleich und Anlegen eines Songs mit älterer, fehlender oder ungültiger Version → `409 outdated`, gespeicherte Songs unverändert, keine Songs in der Antwort; gleiche und neuere Version angenommen. Bestehende Anfragen dieser Tests senden die Version des Servers. Prüfen: `npm test -- server/sync` rot
- [x] 2.2 Version aus `package.json` beim Start lesen, Prüfung für `POST …/sync` und `POST …/songs` in `server/workbooks.ts` (design.md D2). Prüfen: `npm test` grün

## 3. Pause und Hinweis in der App (workbook-sync)

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/sync/sync.test.ts`: Header `Beatsheet-Version` mit der Version der App; nach `outdated` keine weiteren Anfragen an den Server, auch nicht nach Ereignis, Sichtbarkeit oder lokaler Änderung; lokale Änderung bleibt gespeichert; Änderung eines anderen Mitglieds erscheint nicht; ein neues Gerät mit derselben Datenbank überträgt die Änderung. `src/ui/workbooks.test.tsx`: Hinweis mit „Neu laden“ ohne Schließen, kein Offline-Hinweis daneben; „Neu laden“ lädt erst nach dem Speichern neu. Prüfen: `npm test -- sync workbooks` rot
- [x] 3.2 `outdated` in `api.ts`, Header in `createSyncApi`, Zustand und Pause in `createSync`, `isOutdated()` (design.md D2, D3). Prüfen: `npm test -- sync` grün
- [x] 3.3 `OutdatedNote` in `App.tsx` mit „Neu laden“ (design.md D4). Prüfen: `npm test` grün

## 4. Integration

- [x] 4.1 Im Browser prüfen (Skript unter `~/tools/playwright`, hell und dunkel): Server mit höherer Version in `package.json` neu starten, offener Tab zeigt nach dem nächsten Abgleich den Hinweis mit „Neu laden“; lokale Änderung übersteht „Neu laden“. Prüfen: Screenshots zeigen das erwartete Verhalten
- [x] 4.2 `openspec validate outdated-app --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
