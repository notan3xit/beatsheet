# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren.

## 1. Voraussetzung

- [ ] 1.1 `drum-samples` ist archiviert und die Anforderung „Menü“ in `openspec/specs/app-header/spec.md` enthält den Abschnitt „Klang“. Prüfen: `openspec list --json` führt `drum-samples` nicht mehr, `openspec validate theme-choice --strict` fehlerfrei

## 2. Geräte-Einstellung

- [ ] 2.1 Tests erfassen (rot), `src/state/deviceSetting.test.ts`: Vorgabe ohne Eintrag, gespeicherter Wert gilt im neuen Store über denselben Speicher, unbekannter Wert als Vorgabe, nicht nutzbarer Speicher nur für die Sitzung, `subscribe` (design.md D2). Prüfen: `npm test -- deviceSetting` rot
- [ ] 2.2 `createDeviceSetting` und `browserStorage` nach D2, `createSoundSetting` darauf umstellen. Prüfen: `deviceSetting` grün, `soundSetting.test.ts` unverändert grün

## 3. color-theme

- [ ] 3.1 Tests erfassen (rot): `src/ui/theme.test.ts` und `src/ui/styles.test.ts` auf `:root[data-theme='dark']` statt Media Query umstellen; neue Tests für `resolveTheme`, `connectTheme` und `createThemeSetting` mit Media-Nachbau: „Helle“ und „Dunkle Systemeinstellung“, „Wechsel zur Laufzeit“, „Hell trotz dunkler Systemeinstellung“, „Dunkel trotz heller Systemeinstellung“, „Systemwechsel bei fester Wahl“, Vorgabe „Wie System“ (D1, D5). Prüfen: `npm test -- theme styles` rot
- [ ] 3.2 `theme.ts` (CSS mit `data-theme`, `resolveTheme`, `connectTheme`, `createThemeSetting`) und Dunkel-Block in `styles.css` nach D1. Prüfen: Tests aus 3.1 grün
- [ ] 3.3 `main.tsx` verbindet die Wahl vor dem ersten Rendern, `App` nimmt `theme` an und stellt es über einen Kontext bereit (D3). Prüfen: `npm run build` fehlerfrei, `npm test` grün

## 4. Menü

- [ ] 4.1 Tests erfassen (rot), `src/ui/appMenu.test.tsx`: „Abschnitt Farbschema“ und „Abschnitt Klang“ (Farbschema nach dem Konto-Eintrag, Klang danach, je mit Trennstrich), „Vorgabe“, „Dunkel wählen“ (Markierung, `data-theme="dark"`, Menü geschlossen), „Zurück zu Wie System“, „Wahl bleibt erhalten“ über einen gemeinsamen Speicher. Prüfen: `npm test -- appMenu` rot
- [ ] 4.2 `MenuChoice` und Abschnitt „Farbschema“ in `AppMenu` nach D4, Klasse `app-menu-choice` in `styles.css`. Prüfen: Tests aus 4.1 sowie die Klang-Tests in `appMenu.test.tsx` grün

## 5. Abschluss

- [ ] 5.1 Im Headless-Chromium mit gebautem Server prüfen: bei heller Systemeinstellung „Dunkel“ wählen, neu laden, erstes Bild schon dunkel; „Wie System“ folgt einem Wechsel der emulierten Systemeinstellung; Menü in beiden Varianten per Screenshot
- [ ] 5.2 Gesamtprüfung: `openspec validate theme-choice --strict` fehlerfrei, `npm run build` und `npm test` grün

## Workflow follow-up

- Specs übernehmen und Change archivieren (`/opsx:archive`).
