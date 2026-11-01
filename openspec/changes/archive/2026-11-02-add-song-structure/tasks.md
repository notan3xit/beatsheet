# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe werden zuerst die Szenarien der jeweiligen Spec als Tests erfasst. Diese Tests müssen rot sein, bevor implementiert wird. Eine Gruppe ist abgeschlossen, sobald ihre Tests grün sind. Tests werden nur bei fachlicher Änderung angepasst, und dann zuerst in der Spec. Die Anpassung der Change-1-Tests in Gruppe 1 ist eine solche fachliche Änderung (MODIFIED/REMOVED in `pattern-library`).

## 1. Capability `pattern-library` (geändert): Patterns im Song, Farben

- [x] 1.1 Datenmodell-Typen nach design.md D1 anlegen (`Song`, `Segment`, `Block`, `Bar`, `Accent`, `PatternColor`, `PATTERN_COLORS`). Prüfen: `npx tsc` fehlerfrei
- [x] 1.2 Tests erfassen: Szenarien aus `specs/pattern-library/spec.md` auf Song-Ebene (Anlegen im Song, Nummerierung pro Song, Duplizieren mit eigener Farbe, Löschen mit Verwendungszahl und Entfernen der Verweise, Farbvergabe inkl. Wiederverwendung). Tests zur entfernten globalen Übersicht löschen bzw. auf den Song umstellen. Prüfen: neue Tests rot
- [x] 1.3 Domain-Funktionen implementieren: Farbvergabe, songbezogene Nummerierung, Duplizieren mit Farbe, Löschen inkl. Bereinigung der Takt-Verweise. Prüfen: Tests aus 1.2 grün

## 2. Capability `song-structure`: Domain

- [x] 2.1 Tests erfassen: alle Szenarien aus `specs/song-structure/spec.md` als Unit-Tests gegen `src/domain/structure.ts` (Operationen) und `src/domain/timeline.ts` (Fortlauf, Fill-Überdeckung, Akzente). Prüfen: Tests rot
- [x] 2.2 `structure.ts` implementieren: Segment anfügen/umbenennen/löschen/verschieben/duplizieren, Block anfügen/löschen, Takt anfügen/einfügen/löschen (leerer Block entfällt), Takteigenschaften für Auswahl, Platzhalter anlegen, Akzente (Entfernen bei Kürzung). Prüfen: Operations-Tests grün
- [x] 2.3 `timeline.ts` implementieren: `resolveSong` mit Groove-Fortlauf (D2) und Fill-Überdeckung inkl. Songanfang und überlappender Fills. Prüfen: Timeline-Tests grün

## 3. Capability `song-library`: Store und Song-Liste

- [x] 3.1 Tests erfassen: Szenarien aus `specs/song-library/spec.md` (Store-Unit-Tests und Komponententests der Song-Liste) sowie Store-Tests, dass die bestehende Pattern-API im geöffneten Song wirkt (Undo/Redo, Revision von Pattern und Song). Prüfen: Tests rot
- [x] 3.2 `notebookStore.ts` nach D5 implementieren und `libraryStore.ts` ablösen. `PatternEditor`/`Sequencer` an den neuen Store anbinden. Prüfen: Store-Tests und alle Sequencer-/Editor-Tests grün
- [x] 3.3 Song-Liste (anlegen, umbenennen, löschen mit Hinweis, sortiert, Taktzahl, Leerzustand, öffnen) und Navigation Liste ↔ Doppelseite ↔ Pattern-Editor implementieren. Prüfen: Tests aus 3.1 grün

## 4. Capability `library-persistence` (geändert)

- [x] 4.1 Tests erfassen: Szenarien aus `specs/library-persistence/spec.md`: Dateiformat v2 inkl. Verweisprüfung, v1-Import in „Importierte Patterns“, songweiser Merge mit Zählung, Neuladen nach Strukturänderung, IndexedDB-Upgrade v1 → v2 (mit/ohne alte Patterns, zweiter Start) mit fake-indexeddb, Revision des Songs. Bestehende Persistenztests auf Songs umstellen. Prüfen: Tests rot
- [x] 4.2 Dateiformat v2 mit zod inkl. Verweis- und Akzentprüfung sowie v1-Lesepfad implementieren (D6). Prüfen: Format-Tests grün
- [x] 4.3 Songweisen Merge und Importmeldung („Songs hinzugefügt/aktualisiert/unverändert“) implementieren. Prüfen: Merge- und Import-UI-Tests grün
- [x] 4.4 IndexedDB v2 mit Upgrade/Übernahme und songbasiertem `connectStore` implementieren, `main.tsx` anpassen. Prüfen: Repository-Tests grün, App startet im Browser mit übernommenen Daten

## 5. Capability `songbook-view`

- [x] 5.1 Tests erfassen: Szenarien aus `specs/songbook-view/spec.md` als Unit-Tests gegen `src/songbook/layout.ts` (Breiten, Zeilen zu 4 Takten, Segmentumbruch, Startbeat-Anzeige, Fill-Elemente mit inneren Taktstrichen und Zeilenteilung, Mini-Kennzeichen, Akzent-Kürzel) und als Komponententests (Doppelseite, Reihenfolge der Patternseite, „noch leer“, Pattern öffnen und zurück). Prüfen: Tests rot
- [x] 5.2 `layout.ts` nach D3 implementieren. Prüfen: Layout-Tests grün
- [x] 5.3 Mini-Noten: VexFlow-Adapter um `compact` erweitern (D4), Smoke-Test inkl. `currentColor`-Prüfung, Lesbarkeit bei ~32 px/Beat im Browser per Screenshot prüfen und das Ergebnis in design.md festhalten. Prüfen: Smoke-Test grün, Screenshot begutachtet
- [x] 5.4 Doppelseite rendern: `StructurePage` (Blöcke in Pattern-Farbe über `--ctp-*`, Fill-Blöcke, Taktstriche, Akzent-Markierungen) und `PatternPage`. Prüfen: Komponententests aus 5.1 grün, `styles.test.ts` grün (keine Farbliterale)

## 6. Capability `song-structure`: Struktur-Editor (UI)

- [x] 6.1 Komponententests erfassen: Segment anfügen (mit bestehendem/neuem/keinem Groove), Segment-Menü (umbenennen, duplizieren, verschieben, löschen mit Bestätigung), Taktauswahl (Klick, Shift+Klick), Inspector (Länge, Groove, Fill, neuer Platzhalter-Groove/-Fill ohne Verlassen, Akzent hinzufügen/entfernen, Takt einfügen/löschen). Prüfen: Tests rot
- [x] 6.2 `StructureToolbar`, Segment-Menü, Auswahl und `BarInspector` nach D7 implementieren. Prüfen: Tests aus 6.1 grün

## 7. Integration

- [x] 7.1 Gesamtlauf und Dokumentation: `AGENTS.md` (Aufbau: `songbook`, Store) aktualisieren. Prüfen: `npm test` vollständig grün, `npx tsc` und `npm run build` fehlerfrei, jedes Spec-Szenario über seinen Namen einem Test zugeordnet
- [x] 7.2 Browser-Check headless Edge (CDP) gegen den Produktions-Build: Song anlegen, Struktur zuerst mit Platzhaltern, zweitaktiger Groove, Fill über Taktgrenze und über Zeilenumbruch, Akzent, Pattern füllen und zurück, Neuladen, Export/Import. Dazu Screenshots Latte/Mocha. Prüfen: alle Checks OK, Screenshots begutachtet
- [x] 7.3 Übernahme im echten Browser: Produktions-Build mit einer v1-Datenbank (aus Change 1) starten. Prüfen: Song „Importierte Patterns“ mit allen Patterns vorhanden

## Workflow follow-up

- Nach Review in Firefox: Vite-Server beenden, `/opsx:archive` mit Sync, committen
- Danach den Change für Tablet-Reader und Offline/PWA explorieren
