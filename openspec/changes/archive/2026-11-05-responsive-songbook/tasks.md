# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren.

## 1. Doppelseite und Maßstab

- [x] 1.1 Tests erfassen (rot), `src/ui/styles.test.ts`: „Tablet quer“, „Tablet hochkant“ (`.pages` umbrechend, Basisbreiten nach design.md D1) und „Smartphone hochkant“ (`.structure-page` als Container, `--beat` nach D2). Prüfen: `npm test -- styles` rot
- [x] 1.2 `.pages`, `.structure-page` und `.pattern-page` in `styles.css` nach D1 und D2, mit Kommentar zur Herkunft von `--structure-width` und 16rem. Prüfen: Tests aus 1.1 grün, `npm test -- songbook structureEditor` unverändert grün

## 2. Popover in der Seite

- [x] 2.1 Tests erfassen (rot), `src/ui/structureEditor.test.tsx`: „Popover am rechten Rand“ mit gestellten `getBoundingClientRect`. Fälle: Überstand, Begrenzung am linken Rand, kein Überstand (design.md D4, D6). Prüfen: `npm test -- structureEditor` rot
- [x] 2.2 `Popover` misst und verschiebt sich nach D4, `max-width: min(24rem, 100cqw)` in `styles.css`. `POPOVER_BEATS` und die Begrenzung in `barAnchor` entfallen. Prüfen: Tests aus 2.1 und alle bisherigen Popover-Tests grün

## 3. Patternseite

- [x] 3.1 Tests erfassen (rot): `src/ui/styles.test.ts` „Schmale Patternseite“ (eine Spalte ohne Bedingung, zwei in `@container (min-width: 28.5rem)`, `.wide` nur dort) und „Langer Name“ (`nowrap`, `ellipsis`, kein `overflow-wrap: anywhere` an `.pattern-name`); `src/ui/patternPage.test.tsx` „Langer Name“ (`title` mit vollem Namen). Prüfen: `npm test -- styles patternPage` rot
- [x] 3.2 `.pattern-grid`, `.pattern-card.wide`, `.pattern-card h3`, `.pattern-name`, `.pattern-meta` nach D3 und D5; `title` am Namensknopf in `PatternPage.tsx`. Prüfen: Tests aus 3.1 und die bestehenden Tests zu „Zweispaltige Patternseite“ und „Kompakte Pattern-Karten“ grün

## 4. Abschluss

- [x] 4.1 Im Headless-Chromium (`~/tools/playwright`, gebauter Server auf internem Port) bei 1400, 1024, 768 und 390 px prüfen, mit einem Song mit 16-Beat-Zeilen, einem 8-Beat-Groove und dem Groove „Verse-Beat mit Ghost Notes und offener Hi-Hat im Refrain“, entsperrt:
  - Seiten nebeneinander bzw. untereinander wie in den Szenarien,
  - `scrollWidth` gleich `clientWidth` für beide Seiten und das Dokument,
  - Popover des letzten Takts einer Zeile innerhalb der Strukturseite,
  - Kopfzeilen einzeilig, 4-Beat-Noten ungeschrumpft (außer bei 390 px),
  - Screenshots hell und dunkel.

  Ist die Zeile durch Rundung breiter als die Seite, die Formel nach dem Risiko in design.md anpassen.
- [x] 4.2 Gesamtprüfung: `openspec validate responsive-songbook --strict` fehlerfrei, `npm run build` und `npm test` grün

## 5. Viel Platz

- [x] 5.1 Tests erfassen (rot), `src/ui/styles.test.ts`: „Tablet quer“, „Tablet hochkant“ und „Großes Fenster“ nach design.md D1 (`.songbook` als Container, `.pages` ohne Bedingung untereinander, Schwelle gleich der Summe der Basisbreiten, darin 3:2 mit Höchstbreiten; Rechnung bei 1024, 768, 1650 px) und „Smartphone hochkant“ mit `--beat` bis 3rem nach D2. Die Tests aus 1.1 werden dafür angepasst (Anforderung geändert). Prüfen: `npm test -- styles` rot
- [x] 5.2 `.songbook`, `.pages`, `.structure-page`, `.pattern-page` in `styles.css` nach D1 und D2, mit Kommentaren zur Herkunft von Schwelle und Höchstbreiten; Ziehbild per Portal in `document.body` (D1). Prüfen: Tests aus 5.1 grün, `npm test -- songbook structureEditor patternPage` grün

## 6. Breite Karten nach Notenbreite

- [x] 6.1 Tests erfassen (rot): `src/notation/render/vexflow.test.ts` `naturalCardWidth` (4 Beats Achtel höchstens 222 px mit Kante und Einzug; 4 Beats 32tel und 8 Beats Achtel darüber; gleich der Breite des gezeichneten Karten-SVG) und `src/ui/patternPage.test.tsx` „Dichtes kurzes Pattern über beide Spalten“ (design.md D7). Prüfen: `npm test -- vexflow patternPage` rot
- [x] 6.2 `naturalCardWidth` aus der gemeinsamen Breitenrechnung von `renderNotation`, `PatternCard` setzt `wide` danach statt nach der Beat-Zahl. Prüfen: Tests aus 6.1 und die bestehenden Tests zu „Zweispaltige Patternseite“ und „Gleicher Maßstab“ grün

## 7. Abschluss

- [x] 7.1 Browser-Check wie 4.1, zusätzlich bei 1650 px und mit einem Groove mit 4 Beats in 32teln: bei 1650 px Struktur breiter als bei 1024 px und höchstens 3rem pro Beat, Patternseite höchstens zwei Spalten breit, 32tel-Karte über beide Spalten (darf darin schrumpfen, design.md Risiken); alle Prüfungen aus 4.1 weiter grün; Screenshots hell und dunkel
- [x] 7.2 Gesamtprüfung: `openspec validate responsive-songbook --strict` fehlerfrei, `npm run build` und `npm test` grün

## Workflow follow-up

- Specs übernehmen und Change archivieren (`/opsx:archive`).
