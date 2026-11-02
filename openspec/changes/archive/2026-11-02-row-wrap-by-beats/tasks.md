# Tasks

Test-first gemäß `AGENTS.md`: Zuerst die Szenarien der Delta-Spec als Tests erfassen, die rot sein müssen, dann implementieren. Bestehende Tests bleiben unverändert, außer wo die geänderte Anforderung es verlangt (1.3).

## 1. Capability `songbook-view`: Umbruch nach Beats

- [x] 1.1 Tests aus den Szenarien erfassen (rot) in `src/songbook/layout.test.ts`: „Kürzere Takte füllen die Zeile“ (3/4 ×4 + 4/4 → eine Zeile, Breite 16) und „Takt passt nicht mehr in die Zeile“ (3/4 ×6 → 5 + 1). Prüfen: `npm test -- layout` rot
- [x] 1.2 `BARS_PER_ROW` durch `BEATS_PER_ROW = 16` ersetzen und Zeilen in `layoutStructure` nach D1 füllen. Prüfen: `npm test -- layout` grün

- [x] 1.3 Fachlich betroffenen Test anpassen: „Takt am Blockanfang“ in `src/ui/structureShortcuts.test.tsx` nahm an, dass Takt 5 eines 3/4-Blocks in der zweiten Zeile steht; jetzt passen 5 × 3/4 in eine Zeile. Der Block hat dort nun 6 Takte, Takt 6 steht in der zweiten Zeile. Prüfen: `npm test` grün

## 2. Integration

- [x] 2.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 2.2 `openspec validate row-wrap-by-beats --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
