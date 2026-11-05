# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren.

## 1. Betreff der Anmeldemail

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `server/auth.test.ts`: „Code im Betreff“. Prüfen: `npm test -- server/auth` zeigt den Test rot
- [x] 1.2 Betreff nach design.md D7 umsetzen. Prüfen: die Tests aus 1.1 grün

## 2. Konto-Symbol und Konto-Popover

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/ui/account.test.tsx`: Anforderungen „Konto-Symbol“, „Konto-Popover angemeldet“, „Anmeldeformular schließen“; geänderte Szenarien von „Sitzung“ und der Adresse nach der Anmeldung; bestehende Tests nach D8 anpassen. Prüfen: `npm test -- account` zeigt diese Tests rot
- [x] 2.2 `AppHeader` und `useLogout` nach D1, `AccountMenu` nach D2 und D4, `PersonIcon` aus D5 samt CSS mit Tokens. Prüfen: die Tests aus 2.1 und `src/ui/styles.test.ts` grün
- [x] 2.3 Abmelde-Tests in `src/ui/workbooks.test.tsx` nach D8 anpassen, Erwartungen zum Abmelden bleiben. Prüfen: `npm test -- workbooks` grün, soweit nicht von Gruppe 4 abhängig

## 3. Code neu senden

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/ui/account.test.tsx`: Anforderung „Code neu senden“; `Neuen Code anfordern` nach D8 ersetzen. Prüfen: `npm test -- account` zeigt diese Tests rot
- [x] 3.2 Aufbau, CSS und Bestätigung nach D5 und D6 umsetzen. Prüfen: die Tests aus 3.1 und `src/ui/styles.test.ts` grün
- [x] 3.3 Einzeiligkeit in `src/ui/styles.test.ts` prüfen (`white-space: nowrap` an den Knöpfen des Anmeldeformulars). Prüfen: `npm test -- styles` grün

## 4. Menü

- [x] 4.1 Tests aus den Szenarien erfassen (rot), neu `src/ui/appMenu.test.tsx`: Anforderungen „Menü“, „Menü schließen“, „Export und Import über das Menü“, „Anmelden und Abmelden über das Menü“; `.app-menu` in die Ebenen-Tabelle von `src/ui/styles.test.ts`; `Exportieren` in `persistence.test.tsx` und `workbooks.test.tsx` nach D8 anpassen. Prüfen: `npm test -- appMenu styles` zeigt die neuen Tests rot
- [x] 4.2 `AppMenu` nach D3 und D4, übrige Symbole und CSS nach D5, `LibraryFileActions` und `.file-actions` entfernen. Prüfen: die Tests aus 4.1, `persistence` und `workbooks` grün

## 5. Speicherwarnung

- [x] 5.1 Tests aus den Szenarien erfassen (rot), `src/ui/workbooks.test.tsx`: geändertes Szenario „Speicher nicht dauerhaft“ mit Verweis auf das Menü. Prüfen: `npm test -- workbooks` zeigt den Test rot
- [x] 5.2 Text von `StorageNote` in `src/ui/App.tsx` ergänzen. Prüfen: die Tests aus 5.1 grün

## 6. Abschluss

- [x] 6.1 `AGENTS.md` prüfen, ob der Aufbau noch stimmt, und `openspec validate header-cleanup --strict` ausführen. Prüfen: Validierung fehlerfrei
- [x] 6.2 `npm run build` und `npm test`. Prüfen: beide grün

## 7. Dialog, Symbol und Trennstrich

- [x] 7.1 Tests aus den Szenarien erfassen (rot): in `src/ui/appMenu.test.tsx` „Trennstrich“, „Anmelden im Menü“ und „Schritt bleibt über beide Wege“; in `src/ui/account.test.tsx` „Anmeldedialog“, „Konto-Symbol“ (Kreis, Angemeldete) und „Anmeldeformular schließen“; in `src/ui/styles.test.ts` „Stabile Anordnung“ und die Knöpfe über `.login-form`. Prüfen: `npm test -- appMenu src/ui/account styles` zeigt diese Tests rot
- [x] 7.2 Dialog nach D2 und D9, Anordnung nach D10, `PersonIcon` und Trennstrich nach D5. Prüfen: die Tests aus 7.1 grün
- [x] 7.3 `npm run build`, `npm test` und `openspec validate header-cleanup --strict`. Prüfen: alle fehlerfrei

## 8. Modaler Dialog ohne Wegklicken, Kontrast, Überschrift

- [x] 8.1 Tests aus den Szenarien erfassen (rot): in `src/ui/account.test.tsx` „Klick auf den Hintergrund“ und „Escape im Code-Schritt“; in `src/ui/styles.test.ts` „Kontrast zum Hintergrund“ und die Regel von `.page-heading` (getrennt von `.lock-toggle`, wie `.editable-heading`). Prüfen: `npm test -- src/ui/account styles` zeigt diese Tests rot, soweit das Verhalten neu ist
- [x] 8.2 Hintergrund-Logik entfernen, Tokens und `.dialog` nach D9, Selektor `.page-heading` korrigieren. Prüfen: die Tests aus 8.1 grün
- [x] 8.3 `npm run build`, `npm test` und `openspec validate header-cleanup --strict`. Prüfen: alle fehlerfrei

## 9. Feste Größe des Dialogs, Farbe des Symbols

- [x] 9.1 Tests aus den Szenarien erfassen (rot): in `src/ui/account.test.tsx` „Schritt wechselt“, „Fehler ersetzt den Hinweis“, „Neu senden zu früh“; in `src/ui/styles.test.ts` freigehaltener Platz von `.login-message` und `.icon.filled` ohne eigene Farbe. Prüfen: `npm test -- src/ui/account styles` zeigt diese Tests rot
- [x] 9.2 Aufbau und CSS nach D10, Farbe nach D5. Prüfen: die Tests aus 9.1 grün
- [x] 9.3 `npm run build`, `npm test` und `openspec validate header-cleanup --strict`. Prüfen: alle fehlerfrei

## Workflow follow-up

- Artjom prüft Darstellung und Ablauf im Browser, Import über die Dateiauswahl und das Springen mit seinem Passwortmanager eingeschlossen.
- Specs übernehmen und Change archivieren.
