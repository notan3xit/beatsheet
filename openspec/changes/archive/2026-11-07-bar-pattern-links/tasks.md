# Tasks

## 1. Zuordnung Takt zu Pattern

- [x] 1.1 Tests aus den Szenarien erfassen (rot): `selectedPatterns` in `src/songbook/layout.test.ts` für gesetzten Fill, überdeckten Takt, gleichen Groove mit verschiedenen Fills und verschiedene Grooves; `npx vitest run src/songbook/layout.test.ts` schlägt in genau diesen Fällen fehl
- [x] 1.2 `selectedPatterns` in `src/songbook/layout.ts` umsetzen, die Fill-Zuordnung dafür aus `layoutStructure` herausziehen; die Tests aus 1.1 und die übrigen Layout-Tests sind grün

## 2. songbook-view: Links im Takt-Popover

- [x] 2.1 Tests aus den Szenarien erfassen (rot): Szenarien von „Links zu Groove und Fill im Takt-Popover“ und „Links neben den Abspiel-Knöpfen“ in `src/ui/structureEditor.test.tsx`; der Testlauf der Datei schlägt in genau diesen Fällen fehl
- [x] 2.2 Links in `BarPopover` (`src/ui/StructurePopovers.tsx`) im Kopf ergänzen, Stil `.popover-link` in `src/ui/styles.css` nur mit Tokens; die Tests aus 2.1 und `src/ui/styles.test.ts` sind grün
- [x] 2.3 `.popover-link` auf den Stil des Pfads umstellen: zuerst ein roter Test in `src/ui/styles.test.ts`, danach grün; im Screenshot in hell und dunkel wie der Pfad

## 3. songbook-view: Karten hervorheben

- [x] 3.1 Tests aus den Szenarien erfassen (rot): Szenarien von „Hervorhebung der Patterns ausgewählter Takte“ in `src/ui/selectionHighlight.test.tsx`; der Testlauf der Datei schlägt in genau diesen Fällen fehl
- [x] 3.2 `useStructureSelection` nach `src/ui/Songbook.tsx` heben, `StructurePage` und `PatternPage` entsprechend anpassen, Karten-Stil in `src/ui/styles.css` mit `outline` ergänzen; die Tests aus 3.1 und `src/ui/structureEditor.test.tsx` sind grün
- [x] 3.3 Prüfen, dass `NotationView` bei einer Auswahländerung nicht neu zeichnet; nachvollzogen am Code oder per Test

## 4. song-lock: Links und Karten im gesperrten Song

- [x] 4.1 Tests aus den Szenarien erfassen (rot): „Link im gesperrten Song“, „Karten im gesperrten Song“ und die geänderten Szenarien in `src/ui/songLock.test.tsx`; der Testlauf der Datei schlägt in genau diesen Fällen fehl
- [x] 4.2 Links auch im gesperrten Popover zeigen, mit `data-read-safe`; die Tests aus 4.1 sind grün

## 5. Gesamtprüfung

- [x] 5.1 Im Headless-Browser prüfen, gesperrt und entsperrt, hell und dunkel: Screenshot zeigt Links im Popover-Kopf und hervorgehobene Karten, ohne dass sich die Karten verschieben
- [x] 5.2 `npm test` und `npm run build` laufen fehlerfrei durch

## Workflow follow-up

- Delta-Specs in die Haupt-Specs übernehmen und den Change archivieren (`/opsx:archive`).
