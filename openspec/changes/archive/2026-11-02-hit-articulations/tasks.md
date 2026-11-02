# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe werden zuerst die Szenarien der Delta-Specs als Tests erfasst. Diese Tests müssen rot sein, bevor implementiert wird. Eine Gruppe ist abgeschlossen, sobald ihre Tests grün sind. Bestehende Tests bleiben unverändert, außer denen, deren Szenario sich fachlich ändert: Export mit `schemaVersion: 2` in `src/persistence/fileFormat.test.ts` sowie „Neuere Schemaversion“ (Datei mit Version 3) in `src/persistence/fileFormat.test.ts` und `src/ui/persistence.test.tsx`.

## 1. Capability `pattern-sequencer`: Domäne

- [x] 1.1 Tests aus den Szenarien erfassen (rot) in `src/domain/sequencer.test.ts`: „Flam entfernen und neu setzen“ (`toggleHit` zweimal → kein `articulations`), „Spielweise durchschalten“ (`cycleArticulation` dreimal: flam, ghost, normal ohne Feld), „Flam auf leerer Zelle“ (Tom 1), „Shift-Klick auf der Hi-Hat“ (Pattern unverändert, auch auf leerer Zelle), „Spielweise folgt dem Schlag“ (`changeSubdivision` 4 → 2: Ghost von Position 2 auf 1), dazu: verlorener Schlag verliert seine Spielweise. Prüfen: `npm test -- sequencer` rot
- [x] 1.2 Typen und Domäne nach design.md D1/D2: `Articulation`, `ARTICULATIONS`, `ARTICULATED`, `Beat.articulations`, `articulationAt`, `cycleArticulation`, Anpassung von `toggleHit` und `changeSubdivision`. Prüfen: `npm test -- sequencer` grün, `npx tsc --noEmit` fehlerfrei

## 2. Capability `pattern-sequencer`: Sequencer-Zelle

- [x] 2.1 Tests aus den Szenarien erfassen (rot) in `src/ui/sequencer.test.tsx`: Shift-Klick über `user.keyboard('{Shift>}')` + `user.click`: „Spielweise durchschalten“ (Zelle zeigt nacheinander Flam, Ghost Note, normal über `data-articulation` und zugänglichen Namen), „Flam auf leerer Zelle“, „Shift-Klick auf der Hi-Hat“ (keine Änderung), „Anzeige in der Zelle“ (Name endet auf „Ghost Note“), Undo nach Shift-Klick stellt den vorherigen Zustand her. Prüfen: Tests rot
- [x] 2.2 `Sequencer.tsx` und CSS nach D3 (Shift-Klick, `data-articulation`, Namenszusatz, Darstellung von Flam und Ghost Note in der Zelle, `user-select: none`, nur Tokens). Prüfen: Tests aus 2.1 grün, `styles.test.ts` und bestehende Sequencer-Tests grün

## 3. Capability `drum-notation`: Flam und Ghost Note

- [x] 3.1 Tests aus den Szenarien erfassen (rot): in `src/notation/model.test.ts` „Flam auf der Snare“ und „Ghost Note auf der Snare“ (Key mit `articulation`), „Flam im Akkord“/„Ghost Note im Akkord“ (nur der Snare-Key trägt die Spielweise); in `src/notation/render/vexflow.test.ts`: Flam erzeugt genau eine Vorschlaggruppe (`.vf-gracenotegroup` bzw. Grace-Notenköpfe) mit Schrägstrich, Ghost Note genau ein Klammerpaar, im Akkord nur am Snare-Kopf; Farbtest mit Flam und Ghost Note weiter grün. Prüfen: `npm test -- notation` rot
- [x] 3.2 Modell (`NoteKey.articulation`) und Renderer nach D4 (`GraceNoteGroup` mit `slash`, `Parenthesis` pro Index). Prüfen: `npm test -- notation` grün

## 4. Capability `library-persistence`: Schemaversion 3

- [x] 4.1 Tests erfassen bzw. anpassen (rot) in `src/persistence/fileFormat.test.ts`: Export trägt `schemaVersion: 3`, „Spielweisen im Export“ (Roundtrip mit Flam und Ghost Note), „Neuere Schemaversion“ mit Version 4 (auch in `src/ui/persistence.test.tsx`), „Spielweise ohne Schlag“, „Spielweise auf der Hi-Hat“, „Export der Vorversion importieren“ (Datei mit Version 2). Prüfen: Tests rot
- [x] 4.2 Dateiformat nach D5 (`SCHEMA_VERSION = 3`, optionales `articulations` mit Validierung, Version 2 und 3 mit demselben Schema). Prüfen: Tests aus 4.1 grün, `npm test` grün

## 5. Integration

- [x] 5.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 5.2 Im Browser (Release-Build) prüfen, hell und dunkel: Shift-Klick schaltet Spielweisen in Snare und Toms durch, Anzeige in der Zelle ist klar unterscheidbar, Flam-Vorschlag und Ghost-Klammern sind in Editor, Patternkarte und Fill-Mini-Darstellung lesbar und nicht abgeschnitten, Shift-Klick markiert keinen Text, Export und Import einer Datei mit Flams. Ergebnis in design.md festhalten
- [x] 5.3 `openspec validate hit-articulations --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
