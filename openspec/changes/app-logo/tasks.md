# Tasks

## 1. Vorbereitung

- [x] 1.1 `@fontsource/comfortaa` als Abhängigkeit aufnehmen; `npm install` läuft durch und `node_modules/@fontsource/comfortaa/700.css` existiert

## 2. color-theme

- [x] 2.1 Tests aus den Szenarien erfassen (rot): in `src/ui/styles.test.ts` „Mischfarbe im Logo“ (Logo-Tokens nur Palettenvariable, Mischung mit `--bg` oder zweier Palettenvariablen außer red; `--ctp-red` weiter nur in `--danger`); `npm test` zeigt den neuen Test rot
- [x] 2.2 Logo-Tokens `--logo-beet`, `--logo-beet-light`, `--logo-leaf`, `--logo-e1-1` … `--logo-e3-3` in `src/ui/styles.css` anlegen (design.md D3); Tests aus 2.1 grün

## 3. app-header

- [x] 3.1 Tests aus den Szenarien erfassen (rot): Aufbau, Zugänglicher Name, Farben im Hell-/Dunkelmodus (Klassen und Tokens), Schrift, Keine fremde Quelle, Form, Höhe wie die Kleinbuchstaben, Farben der Striche (design.md D5); bestehende Tests in `src/ui/appMenu.test.tsx` finden die Überschrift „Beatsheet“ weiterhin; `npm test` zeigt die neuen Tests rot
- [x] 3.2 `src/ui/Logo.tsx` mit Beeten-SVG und Schriftzug samt „e“-SVGs umsetzen (design.md D1, D2); Tests zu Aufbau, Name und Form grün
- [x] 3.3 Stile für Logo, Schriftzug und „e“ in `src/ui/styles.css` (Comfortaa nur im Schriftzug, `height: 1ex`, `vertical-align: baseline`, Klassen mit `fill`/`stroke` auf Logo-Tokens); Tests zu Schrift, Höhe und Farben grün
- [x] 3.4 `@fontsource/comfortaa/700.css` in `src/main.tsx` importieren und `Logo` in `AppHeader` statt `<h1>Beatsheet</h1>` einsetzen; Test „Keine fremde Quelle“ grün
- [x] 3.5 Feinwerte (Strichstärke, Breite, Mittelstrich, Schriftgröße) im Browser in Latte und Mocha abstimmen und als Konstanten festhalten; Screenshot der Kopfzeile in beiden Varianten über `~/tools/playwright` zeigt Striche auf x-Höhe und Grundlinie

## 4. Abschluss

- [x] 4.1 `npm run build` ohne Fehler; die gebaute Oberfläche enthält die Comfortaa-woff2-Dateien unter `dist/assets`
- [x] 4.2 `npm test` vollständig grün

## Workflow follow-up

- Specs übernehmen (`/opsx:sync`) und Change archivieren (`/opsx:archive`).
