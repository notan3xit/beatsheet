# Tasks

Test-first gemäß `AGENTS.md`: Zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests bleiben unverändert, außer „Takte, Groove-Namen, Fill-Block und Akzent erscheinen“ in `src/ui/songbook.test.tsx`, das den Namen in allen vier Takten erwartet.

## 1. Capability `songbook-view`: Layout

- [x] 1.1 Tests aus den Szenarien erfassen (rot) in `src/songbook/layout.test.ts`: „Zweitaktiger Groove“ (`showLabel` true, false, false, false), „Eintaktiger Groove“ (true), „Groove-Wechsel“ (A, A, B, B, A → true, false, true, false, true), „Neues Segment“ (erster Takt von Chorus true), „Takt ohne Groove dazwischen“ (true, –, true), dazu: Folgetakt über eine Zeilengrenze im selben Block bleibt false. Prüfen: `npm test -- layout` rot
- [x] 1.2 `showLabel` nach design.md D1 in `layoutStructure`. Prüfen: `npm test -- layout` grün

## 2. Capability `songbook-view`: Darstellung

- [x] 2.1 Tests erfassen bzw. anpassen (rot) in `src/ui/songbook.test.tsx`: „Takte, Groove-Namen …“ erwartet „A“ genau einmal als Text; „Folgetakt mit Tooltip“ (zweiter Takt hat `title` „A“, aber keinen Text „A“). Prüfen: Tests rot
- [x] 2.2 `StructurePage` nach D2. Prüfen: Tests aus 2.1 grün, `npm test` grün

## 3. Integration

- [x] 3.1 `npm test`, `npm run build` grün und `openspec validate groove-label-on-change --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
