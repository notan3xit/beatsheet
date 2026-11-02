# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests bleiben unverändert, außer „Takte, Groove-Namen, Fill-Block und Akzent erscheinen“ und „Kurzer Fill“ in `src/ui/songbook.test.tsx`, die den Fill-Namen als sichtbaren Text prüfen.

## 1. Kurzschrift-Funktion

- [x] 1.1 Tests aus den Szenarien von „Fill-Kurzschrift“ erfassen (rot), neue Datei `src/notation/shorthand.test.ts`: „Tom-Run“ (Zeiten, Stufen, Buchstaben), „Gleichzeitige Schläge“ (`'` und `k` an derselben Zeit), „Flam und Ghost Note“, „Hi-Hat entfällt“; dazu: Priorität `f` vor `k`, Tom-Flam bleibt `t`, `slot` bei Triolen = 1/3. Prüfen: `npm test -- shorthand` rot
- [x] 1.2 `src/notation/shorthand.ts` nach design.md D1. Prüfen: `npm test -- shorthand` grün

## 2. Layout

- [x] 2.1 Tests erfassen (rot) in `src/songbook/layout.test.ts`: `FillItem.marks` für einen kurzen Fill (x mittig im Rasterplatz), für einen über den Zeilenumbruch geteilten Fill (jeder Teil nur seine Zeichen, x relativ zum Teil) und für einen am Songanfang abgeschnittenen Fill (nur der sichtbare Teil). Prüfen: `npm test -- layout` rot
- [x] 2.2 `offset` an `FillInstance` und `marks` an `FillItem` nach D2. Prüfen: `npm test -- layout` grün

## 3. Capability `songbook-view`: Darstellung

- [x] 3.1 Tests anpassen bzw. erfassen (rot) in `src/ui/songbook.test.tsx`: „Kurzer Fill“ (Kurzschrift sichtbar, Name nur als `title`/`aria-label`, kein Text „f1“, keine Noten), „Takte, Groove-Namen, Fill-Block und Akzent erscheinen“ (Fill über `title` statt Text); neuer UI-Test „Fill über Zeilenumbruch“ zeigt in beiden Teilen Buchstaben. Prüfen: Tests rot
- [x] 3.2 `FillBlock` und CSS nach D3 (nur Tokens). Prüfen: Tests aus 3.1 grün, `npm test` grün

## 4. Integration

- [x] 4.1 `npm test`, `npm run build` grün und `openspec validate fill-shorthand --strict` fehlerfrei
- [x] 4.2 Im Browser (Release-Build) prüfen, hell und dunkel: Lesbarkeit der Buchstaben, Abstand zu Nachbarzeilen und Akzenten, Fill über Zeilenumbruch, Hervorhebung eines ausgewählten Fills. Ergebnis in design.md festhalten

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
