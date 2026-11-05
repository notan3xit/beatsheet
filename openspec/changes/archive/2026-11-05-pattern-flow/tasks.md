# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren.

## 1. Reihenfolge

- [x] 1.1 Tests erfassen (rot): `src/songbook/layout.test.ts` „Reihenfolge“ (B, f1, A, C, f2; unbenutzte Grooves vor Fills, alphabetisch) mit `songPatternOrder`; `src/ui/structureEditor.test.tsx` „Chips in Reihenfolge des Songs“; `src/ui/patternPage.test.tsx` Karten in derselben Reihenfolge (design.md D1). Prüfen: `npm test -- layout structureEditor patternPage` rot
- [x] 1.2 `songPatternOrder` statt `patternPageOrder` in `layout.ts`, genutzt von `PatternPage` und `PatternChips`. Prüfen: Tests aus 1.1 grün, übrige Tests zu Chips und Patternseite grün

## 2. Karten im Fluss

- [x] 2.1 Tests erfassen (rot): `src/ui/styles.test.ts` „Kurze Patterns nebeneinander“, „Umbruch in Reihenfolge“, „Kurzer Fill“ nach D2 (`.pattern-grid` umbrechender Flex-Container mit Segmentabstand, `.pattern-card` mit natürlicher Breite, `min-width: min(7.5rem, 100%)`, `max-width: 100%`, Kopf mit `contain: inline-size`, kein `@container (min-width: 28.5rem)`). Die Tests zu „Zweispaltige Patternseite“ in `styles.test.ts` und `patternPage.test.tsx` sowie zu `naturalCardWidth` in `vexflow.test.ts` entfallen mit der Anforderung. Prüfen: `npm test -- styles` rot
- [x] 2.2 CSS nach D2; `wide`, `naturalCardWidth` und `container-type` an `.pattern-page` entfernen; `NotationView` mit optionalem `maxWidth`, `PatternPage` misst `.pattern-grid` und übergibt die Breite abzüglich Kante und Einzug (D3). Prüfen: Tests aus 2.1 grün, `npm test -- patternPage vexflow songbook` grün, `npm run build` fehlerfrei

## 3. Optik von Groove- und Fill-Karte

- [x] 3.1 Tests erfassen (rot): `src/ui/patternPage.test.tsx` „Fill und Groove unterscheiden“ (Klassen `fill` und `groove`); `src/ui/styles.test.ts` Rahmen und Tönung von `.pattern-card.fill`, nur Kante links bei `.pattern-card.groove` (D4). Prüfen: `npm test -- patternPage styles` rot
- [x] 3.2 Klassen in `PatternCard`, CSS nach D4. Prüfen: Tests aus 3.1 grün, Farbregel in `styles.test.ts` grün

## 4. Abschluss

- [x] 4.1 Browser-Check (`~/tools/playwright`, gebauter Server auf internem Port) bei 1650, 1024, 768 und 390 px mit einem Song, der Grooves und Fills gemischt verwendet, einen 8-Beat-Groove, einen 1-Beat-Fill und einen unbenutzten Groove enthält: Reihenfolge der Karten, keine Löcher, Kartenbreite gleich Notenbreite plus Kante, 4-Beat-Karten ungeschrumpft (außer 390 px), kurzer Fill mindestens 7,5rem mit ungekürzter Kopfzeile, Noten wachsen nach 390 → 1650 px wieder zusammen, Chips in derselben Reihenfolge; Screenshots hell und dunkel
- [x] 4.2 Gesamtprüfung: `openspec validate pattern-flow --strict` fehlerfrei, `npm run build` und `npm test` grün

## Workflow follow-up

- Specs übernehmen und Change archivieren (`/opsx:archive`).
