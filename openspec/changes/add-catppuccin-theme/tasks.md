# Tasks

Test-first gemäß `AGENTS.md`: In jeder Capability-Gruppe werden zuerst die Szenarien der Spec als Tests erfasst. Diese Tests müssen rot sein, bevor implementiert wird. Eine Gruppe ist abgeschlossen, sobald ihre Tests grün sind. Tests werden nur bei fachlicher Änderung angepasst, und dann zuerst in der Spec.

## 1. Setup

- [x] 1.1 `@catppuccin/palette` als Laufzeitabhängigkeit hinzufügen. Prüfen: `import { flavors } from '@catppuccin/palette'` typisiert fehlerfrei (`npx tsc`), `npm run build` läuft

## 2. Capability `color-theme`

- [x] 2.1 Szenarien aus `specs/color-theme/spec.md` als Unit-Tests erfassen (design.md D4): `src/ui/theme.test.ts` (Latte in der Basisregel, Mocha im Dark-Media-Block, `color-scheme`, alle 26 Farben aus dem Paket) und `src/ui/styles.test.ts` (keine Farbliterale, `red` nur in `--danger`, `--accent` ≠ `red`). Prüfen: `npm test` zeigt die neuen Tests rot
- [x] 2.2 `src/ui/theme.ts` mit CSS-Erzeugung implementieren und in `main.tsx` vor dem ersten Rendern als `<style>` einfügen (D1). Prüfen: `theme.test.ts` grün
- [x] 2.3 `src/ui/styles.css` auf semantische Tokens nach D2 umstellen und alle fest codierten Farben entfernen. Prüfen: `styles.test.ts` grün, alle bestehenden Tests weiterhin grün
- [x] 2.4 `AGENTS.md` (Tech-Stack) um Catppuccin/`@catppuccin/palette` und die Regel „Farben nur über Tokens“ ergänzen. Prüfen: Abschnitt vorhanden und konsistent mit D2

## 3. Capability `drum-notation` (Notenbild in Textfarbe)

- [x] 3.1 Szenario „Keine fest vorgegebene Farbe“ als Test im Renderer-Smoke-Test erfassen: Muster mit Triole, Punktierung und offener Hi-Hat rendern, dann prüfen, dass jedes `fill`/`stroke` im SVG `currentColor` oder `none` ist. Prüfen: Test ist rot
- [x] 3.2 Renderer auf `currentColor` umstellen und `.notation` die Textfarbe geben (D3). Prüfen: Test aus 3.1 grün

## 4. Integration

- [x] 4.1 Gesamtlauf. Prüfen: `npm test` vollständig grün, `npx tsc` und `npm run build` fehlerfrei, jedes Spec-Szenario einem Test oder dem Browser-Check aus 4.2 zugeordnet
- [x] 4.2 Browser-Check headless (Chromium über CDP, D4) gegen den Produktions-Build: hell und dunkel emuliert, berechnete Farben von `body` und Notenbild, Wechsel ohne Neuladen, alle berechneten Farben aus der aktiven Palette, Screenshots beider Varianten. Prüfen: alle Checks OK, Screenshots visuell geprüft

## Workflow follow-up

- Nach Review: `/opsx:archive` mit Sync
- Danach `add-song-structure` vorschlagen (nutzt die Akzentfarben für Grooves)
