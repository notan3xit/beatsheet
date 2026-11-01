# Tasks

Test-first gemäß `AGENTS.md`: In jeder Capability-Gruppe werden zuerst die Szenarien der Spec als Tests erfasst. Diese Tests müssen rot sein, bevor implementiert wird. Eine Gruppe ist abgeschlossen, sobald ihre Tests grün sind. Tests werden nur bei fachlicher Änderung angepasst, und dann zuerst in der Spec.

## 1. Projekt-Setup

- [x] 1.1 Vite-Projekt mit React + TypeScript (strict) anlegen, Ordnerstruktur `src/{domain,notation,persistence,state,ui}` gemäß design.md D3. Prüfen: `npm run dev` startet, `npm run build` läuft fehlerfrei
- [x] 1.2 Vitest, @testing-library/react, jsdom und fake-indexeddb einrichten, dazu `npm test` mit einem Platzhaltertest. Prüfen: `npm test` läuft grün
- [x] 1.3 Laufzeitabhängigkeiten `vexflow`, `idb`, `zod` hinzufügen. Prüfen: Installation erfolgreich, Build läuft
- [x] 1.4 `AGENTS.md` um Tech-Stack und die Befehle `dev`/`build`/`test` ergänzen. Prüfen: Die dokumentierten Befehle laufen wie beschrieben

## 2. Spike: VexFlow-Percussion

- [x] 2.1 Wegwerf-Seite, die mit VexFlow einen fest codierten 4/4-Groove rendert: Percussion-Schlüssel, zwei Stimmen, x-Notenköpfe, Crash auf der Hilfslinie, Hi-Hat-Pedal unter dem System, eine Achteltriole in Beat 3. Prüfen: visuell im Browser. Probleme und Workarounds als Notiz in design.md (Risiken) festhalten, die Spike-Seite danach entfernen

## 3. Capability `pattern-library`

- [x] 3.1 Alle Szenarien aus `specs/pattern-library/spec.md` als Tests erfassen: Domain-Szenarien als Unit-Tests (`src/domain`), Bestätigungsdialoge und Übersicht als Komponententests. Prüfen: `npm test` zeigt die neuen Tests rot
- [x] 3.2 Domain-Funktionen implementieren: Anlegen mit Standardwerten und UUID, Validierung der Länge 1–16, Auto-Name „Typ N“, Umbenennen mit Leer-Schutz, Länge ändern inkl. „würde Schläge entfernen“, Duplizieren. Prüfen: Unit-Tests aus 3.1 grün
- [x] 3.3 Store-Anbindung und UI implementieren: Übersicht gruppiert/sortiert, Leerzustand, Anlegen, Umbenennen, Länge ändern mit Bestätigung, Duplizieren, Löschen mit Bestätigung. Prüfen: alle Tests aus 3.1 grün

## 4. Capability `drum-notation`

- [x] 4.1 Alle Szenarien aus `specs/drum-notation/spec.md` als Unit-Tests gegen das Notations-Zwischenmodell (design.md D5) erfassen. Prüfen: `npm test` zeigt die neuen Tests rot
- [x] 4.2 `notation/model.ts` implementieren: Instrument-Tabelle (Position, Notenkopf, Stimme), Takteinteilung zu 4 Beats, Notenwerte und Pausen aus dem Raster, Balkengruppen pro Beat, Tuplet-Kennzeichnung, leere Beats. Prüfen: Tests aus 4.1 grün
- [x] 4.3 VexFlow-Adapter `notation/render/vexflow.ts` und React-Komponente für die Notendarstellung implementieren. Prüfen: Smoke-Test (rendert SVG ohne Fehler) grün, dazu visuelle Kontrolle der Spec-Beispiele im Browser

## 5. Capability `pattern-sequencer`

- [x] 5.1 Alle Szenarien aus `specs/pattern-sequencer/spec.md` als Tests erfassen: Unterteilungswechsel, Hi-Hat-Exklusivität und Toggle als Unit-Tests, dazu Raster-Darstellung, Bestätigung bei Verlust, Undo/Redo und Live-Vorschau als Komponententests. Prüfen: `npm test` zeigt die neuen Tests rot
- [x] 5.2 Domain-Funktionen implementieren: Schlag umschalten, Hi-Hat-Exklusivität, Unterteilungswechsel über zeitliche Lage mit Liste verlorener Schläge (design.md D4). Prüfen: Unit-Tests aus 5.1 grün
- [x] 5.3 Undo/Redo im Store implementieren (50 Snapshots pro Pattern, design.md D9). Prüfen: Undo/Redo-Tests aus 5.1 grün
- [x] 5.4 Sequencer-UI implementieren: zehn Instrumentzeilen, Spalten je Unterteilung, Beat-Beschriftung, Unterteilungs-Auswahl pro Beat mit Bestätigungsdialog, Undo/Redo-Bedienung, Notenvorschau neben dem Raster. Prüfen: alle Tests aus 5.1 grün

## 6. Capability `library-persistence`

- [x] 6.1 Alle Szenarien aus `specs/library-persistence/spec.md` als Tests erfassen: Dateiformat und Merge als Unit-Tests, Speichern/Neuladen/erster Start/atomarer Import als Repository-Tests mit fake-indexeddb, Hinweise und Importmeldung als Komponententests. Prüfen: `npm test` zeigt die neuen Tests rot
- [x] 6.2 zod-Schema `drumstuff.library` v1 mit allen Strukturregeln und Export-Serialisierung implementieren (design.md D8). Prüfen: Format- und Export-Tests aus 6.1 grün
- [x] 6.3 Import-Merge (`persistence/merge.ts`) nach Revision und Änderungszeitpunkt inklusive Zählung hinzugefügt/aktualisiert/unverändert implementieren. Prüfen: Merge-Tests aus 6.1 grün
- [x] 6.4 IndexedDB-Repository mit entprelltem Schreiben, Flush bei `pagehide`/`visibilitychange`, Laden beim Start und atomarem Import implementieren. Revision und `updatedAt` im Store bei jeder Änderung fortschreiben. Prüfen: Repository- und Metadaten-Tests aus 6.1 grün
- [x] 6.5 `navigator.storage.persist()` beim Start aufrufen und Hinweis bei Verweigerung anzeigen, dazu Export-Download (`.drumbook.json`) und Import-Dialog mit Ergebnis- und Fehlermeldungen in der UI. Prüfen: alle Tests aus 6.1 grün

## 7. Integration

- [x] 7.1 Gesamten Testlauf und Build prüfen. Prüfen: `npm test` vollständig grün, `npm run build` fehlerfrei, jedes Spec-Szenario ist über den Testnamen einem Test zugeordnet
- [x] 7.2 Manueller Durchlauf im Browser (Chrome und Safari): Groove und Fill anlegen, mit gemischter Unterteilung füllen, Notenbild prüfen, neu laden, exportieren, in einem frischen Browserprofil importieren. Prüfen: Alle Schritte verhalten sich wie in den Specs beschrieben

## Workflow follow-up

- Nach Abschluss und Review: `/opsx:sync` und `/opsx:archive`
- Danach den Change `add-song-structure` vorschlagen (Song-Struktur, Fill-Blöcke, Akzent-Overlays, Tablet-Reader)
