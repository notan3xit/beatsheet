# Tasks

## 1. Grund im Lader

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `src/audio/sampleLoader.test.ts`: „Abruf scheitert“, „Beide Formate nicht dekodierbar“, „Mehrere Aufnahmen scheitern“, leere `failures()` beim „Zweiten Format“, dazu Ablehnung ohne Fehlerobjekt nach design.md D4. Prüfen: `npm test -- sampleLoader` rot
- [x] 1.2 `failures()` nach design.md D1 bis D4 in `createSampleLoader` umsetzen, `browserFetch` meldet `HTTP <Status>`. Prüfen: `npm test -- sampleLoader` grün
- [x] 1.3 Test aus dem Szenario „Browser kann gar nicht dekodieren“ erfassen (rot), dann `unavailableLoader` in `src/audio/deviceSound.ts` nach design.md D6 umsetzen. Prüfen: Der Test ist erst rot, dann grün

## 2. „Details“ und Dialog

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/ui/appMenu.test.tsx`: „Details öffnen“, „Dialog schließen“, „Kein Eintrag ohne Fehler“, Zeilen von `failures()` im Dialog; Nachbauten des Laders um `failures()` ergänzen. Prüfen: `npm test -- appMenu` rot
- [x] 2.2 `SampleFailureDialog` und den Eintrag „Details“ nach design.md D5 umsetzen. Prüfen: `npm test -- appMenu` und `npm test -- styles` grün

## 3. Gesamtprüfung

- [x] 3.1 Gesamten Stand prüfen. Prüfen: `npm test` und `npm run build` laufen fehlerfrei durch

## 4. Hinweis auf Neuladen

- [x] 4.1 Tests aus den Szenarien von „Hinweis auf Neuladen“ erfassen (rot), `src/audio/sampleLoader.test.ts`, `src/audio/deviceSound.test.ts` und `src/ui/appMenu.test.tsx`; Nachbauten des Laders um `reloadMayHelp()` ergänzen. Prüfen: `npm test -- sampleLoader deviceSound appMenu` rot
- [x] 4.2 `FetchStatusError`, `reloadMayHelp()` und den Hinweis im Dialog nach design.md D7 umsetzen. Prüfen: `npm test -- sampleLoader deviceSound appMenu` grün
- [x] 4.3 Gesamten Stand prüfen. Prüfen: `npm test` und `npm run build` laufen fehlerfrei durch

## Workflow follow-up

- Paket nach `~/deploy/beatsheet` veröffentlichen und den Grund auf dem iPad im Dialog ablesen.
- Die Ursache danach in einem eigenen Change beheben und die Testseite `~/pub/beatsheet-audio-test` löschen.
- Change archivieren.
