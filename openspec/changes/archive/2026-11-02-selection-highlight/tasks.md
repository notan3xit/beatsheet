# Tasks

Test-first gemäß `AGENTS.md`: Zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests bleiben unverändert (sie prüfen `aria-pressed` und `drop-target`, die erhalten bleiben).

## 1. Layout: Fills ihren Takten zuordnen

- [x] 1.1 Test erfassen (rot) in `src/songbook/layout.test.ts`: `FillItem.barIds` enthält den Takt, zu dem der Fill gehört, und vollständig überdeckte Takte, nicht aber einen nur teilweise überdeckten Takt (Fill mit 6 Beats am Ende von Takt 2 aus zwei 4/4-Takten → nur Takt 2; Fill mit 8 Beats → Takt 1 und 2). Prüfen: `npm test -- layout` rot
- [x] 1.2 `barIds` nach design.md D2 in `layoutRow`. Prüfen: `npm test -- layout` grün

## 2. Capability `songbook-view`: Hervorhebung

- [x] 2.1 Tests aus den Szenarien erfassen (rot), neue Datei `src/ui/selectionHighlight.test.tsx`: „Ausgewählte Takte“ (Klick Takt 2, Shift-Klick Takt 3 → genau zwei `.item.groove.highlighted`), „Fill im ausgewählten Takt“, „Leerer Takt“ (`.item.ghost` nur am ausgewählten leeren Takt), „Ablegeziel beim Ziehen“ (mit `hitTest` wie in `structureShortcuts.test.tsx`), „Gewählter Chip mit Haken“ (`.chip-check` nur im gewählten Chip). Prüfen: Tests rot
- [x] 2.2 `StructurePage` (D1, Schatten-Groove), `PatternChips` (Haken) und CSS nach D3, alte Rahmenregeln entfernen, neues Token `--ghost`. Prüfen: Tests aus 2.1 grün, `styles.test.ts` grün, `npm test` grün

## 3. Integration

- [x] 3.1 `npm test`, `npm run build` grün und `openspec validate selection-highlight --strict` fehlerfrei
- [x] 3.2 Im Browser (Release-Build) prüfen, hell und dunkel: Auswahl über mehrere Takte und über einen Groove-Wechsel, Fill im ausgewählten Takt, leerer Takt, Ziehen auf Takte, gewählte Chips auch bei hellen Patternfarben lesbar. Ergebnis in design.md festhalten

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
