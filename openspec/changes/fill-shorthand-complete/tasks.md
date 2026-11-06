# Tasks

## 1. songbook-view: Fill-Kurzschrift

- [x] 1.1 Tests aus den Szenarien erfassen (rot): `src/notation/shorthand.test.ts` an das geänderte Delta anpassen und die neuen Szenarien ergänzen, in `src/songbook/layout.test.ts` den Crash auf `c` umstellen; `npx vitest run src/notation/shorthand.test.ts src/songbook/layout.test.ts` schlägt in genau diesen Fällen fehl
- [x] 1.2 `src/notation/shorthand.ts`: Zeichen und Reihenfolge je Stufe laut Spec ergänzen, Ghost Notes als `·` erst nach den normalen Schlägen vergeben; die Tests aus 1.1 sind grün
- [x] 1.3 Lesbarkeit im Headless-Browser prüfen: Screenshot eines Songs mit Fills mit Hi-Hat und Ghost Notes zeigt die neuen Zeichen auf den richtigen Stufen, ohne Überlappung bei Sechzehnteln
- [x] 1.4 `npm test` und `npm run build` laufen fehlerfrei durch

## Workflow follow-up

- Delta-Spec in die Haupt-Spec übernehmen und den Change archivieren (`/opsx:archive`).
