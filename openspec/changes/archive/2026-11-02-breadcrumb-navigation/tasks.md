# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe werden zuerst die Szenarien der Delta-Specs als Tests erfasst. Diese Tests müssen rot sein, bevor implementiert wird. Eine Gruppe ist abgeschlossen, sobald ihre Tests grün sind. Bestehende Tests, die „Alle Songs“, „Zurück zum Song“ oder die Felder „Songtitel“/„Name“ benutzen, ändern sich fachlich mit der Bedienung und werden in Gruppe 4 angepasst; alle anderen bleiben unverändert.

## 1. Capability `navigation`: Editierbare Überschrift

- [x] 1.1 Tests aus den Szenarien erfassen (rot), neue Datei `src/ui/navigation.test.tsx`: „Songtitel ändern“ (Klick auf Überschrift `heading` „Neuer Song“, Feld „Songtitel“, Enter), „Patternname beim Verlassen übernehmen“ (Feld „Name“, `user.tab()`), „Escape verwirft“, „Leerer Name“; jeweils prüfen, dass danach wieder eine Überschrift (Rolle `heading`, Ebene 2) und kein Feld da ist. Prüfen: Tests rot
- [x] 1.2 `EditableHeading` nach design.md D2 und Einbau in `SongHeader` (label „Songtitel“) und Pattern-Editor (label „Name“, ersetzt `NameField`); CSS ohne Farbliterale. Prüfen: Tests aus 1.1 grün

## 2. Capability `navigation`: Breadcrumbs

- [x] 2.1 Tests aus den Szenarien erfassen (rot) in `src/ui/navigation.test.tsx`: „Pfad im Pattern-Editor“ (`navigation` „Pfad“ mit Knöpfen „Songs“, „Hysteria“; Überschrift „Verse“), „Zur Doppelseite“, „Zur Song-Liste aus dem Pattern-Editor“, „Pfad auf der Doppelseite“ (nur „Songs“, kein Knopf „Alle Songs“), Song-Liste mit Überschrift „Songs“. Prüfen: Tests rot
- [x] 2.2 `Breadcrumbs` nach D1 und Kopfzeilen nach D3 (Zurück-Knöpfe entfernen, Überschrift „Songs“ in der Song-Liste). Prüfen: Tests aus 2.1 grün

## 3. Capability `song-library`: Song-Tabelle

- [x] 3.1 Test „Sortierte Liste“ in `src/ui/songList.test.tsx` an das geänderte Szenario anpassen (rot): Tabelle mit Kopfzeile Titel/Takte/Grooves/Fills, Zeilen „Hysteria 0 0 0“ und „Uprising 32 2 1“ (Song mit 2 Grooves und 1 Fill). Prüfen: Test rot
- [x] 3.2 Tabelle nach D4 in `SongList.tsx` und CSS (Linien oben und zwischen den Zeilen, Zahlen rechtsbündig, nur Tokens). Prüfen: Test aus 3.1 grün, „Leere Liste“ und „Song öffnen“ grün

## 4. Bestehende Tests an die neue Bedienung anpassen

- [x] 4.1 Tests mit „Alle Songs“/„Zurück zum Song“ auf die Breadcrumb-Knöpfe umstellen und Tests mit `getByLabelText('Songtitel'|'Name')` auf Überschrift bzw. Klick + Feld umstellen (`songList.test.tsx`, `songbook.test.tsx`, `patternPage.test.tsx`, `patternEditor.test.tsx`, `structureShortcuts.test.tsx`). Nur die Bedienschritte ändern, nicht die geprüften fachlichen Ergebnisse. Prüfen: `npm test` grün

## 5. Integration

- [x] 5.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 5.2 Im Browser (Release-Build) prüfen, hell und dunkel: Pfad und Überschrift wirken als zusammengehöriger Kopf, Umschalten Überschrift/Feld springt nicht, Escape verwirft, Song-Tabelle mit Linien oben und zwischen den Zeilen, Klick auf die Zeile öffnet den Song. Ergebnis in design.md festhalten
- [x] 5.3 `openspec validate breadcrumb-navigation --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
