# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests ändern sich nur dort, wo eine geänderte Anforderung es verlangt: Szenarien „Neuere Schemaversion“, „Kein gültiges JSON und fremde Formatkennung“, Importmeldung, `mergeImport` → `planImport`/`applyImport`.

## 1. Capability `library-persistence`: Erkennung über die Struktur

- [x] 1.1 Tests aus den Szenarien erfassen (rot) in `src/persistence/fileFormat.test.ts`: „Fremde Formatkennung“, „Ohne Formatkennung und Schemaversion“, „Altes Format ohne Schemaversion“, „Keine erkennbaren Songs“ (Meldung „keine importierbaren Songs“), „Neuere Schemaversion“ (Schemaversion 4 → `ok: true`, `fromNewerVersion: true`), Struktur vor Version (`schemaVersion: 1` mit `songs`); bisherige Tests „Neuere Schemaversion“ und „fremde Formatkennung“ entsprechend umstellen. Prüfen: `npm test -- fileFormat` rot
- [x] 1.2 `parseNotebookFile` nach design.md D1: keine Kopfprüfung, Erkennung über `songs`/`patterns`, `fromNewerVersion`, `format`/`schemaVersion`/`exportedAt` aus den Dateischemata entfernen, Meldungen ohne Projektnamen; `serializeNotebook` unverändert. Prüfen: `npm test -- fileFormat` grün

## 2. Capability `library-persistence`: Importplan

- [x] 2.1 Tests aus den Szenarien erfassen (rot) in `src/persistence/merge.test.ts`: „Vorbelegung nach Revision“, „Gleiche Revision“, „Vorhandener Song aus neuerer Version“ (Vorbelegung `copy`), „Neuere Fassung gewinnt“, „Ältere Fassung wird ignoriert“, „Ältere Fassung ersetzen“ (Revision > lokal), „Kopie neben dem Original“ (neue ID, „Intro (Kopie)“, Revision 1, Zeitpunkte aus `deps`, Patterns gleich), „Gemischte Auswahl“ (Zusammenfassung 1/1/1/1), „Neuen Song überspringen“ (Zusammenfassung 1/0/0/1); in `src/persistence/songDoc.test.ts` „Import der Ausgangsfassung“ auf `planImport` (Vorbelegung `skip`) umstellen. Prüfen: `npm test -- merge songDoc` rot
- [x] 2.2 `planImport` und `applyImport` nach D2 in `src/persistence/merge.ts`, `mergeImport` entfernen. Prüfen: `npm test -- merge songDoc` grün

## 3. Capability `library-persistence`: Import-Dialog

- [x] 3.1 Tests aus den Szenarien erfassen (rot) in `src/ui/persistence.test.tsx`: „Neue Patterns importieren“ und „Alte Exportdatei importieren“ mit neuer Meldung, „Dialog auch ohne vorhandene Songs“ (Dialog erscheint, vorher nichts übernommen), „Neuen Song überspringen“, „Neuere Fassung gewinnt“ und „Ältere Fassung wird ignoriert“ über den Dialog, „Neuere Schemaversion“ und „Warnung vor der Übernahme“ (Warnung, Bestätigen → Song vorhanden), „Abbrechen nach der Warnung“, „Alle auf einmal“, „Import abbrechen“, „Gemischte Auswahl“ (Meldung), „Kopie ist eigenständig“ (Kopie bearbeiten, Original unverändert). Prüfen: `npm test -- persistence` rot
- [x] 3.2 `src/ui/ImportDialog.tsx` nach D3, Einbindung in `LibraryFileActions` (Dialog bei jedem gültigen Import), Styles in `src/ui/styles.css` nur mit semantischen Tokens. Prüfen: `npm test -- persistence styles` grün

## 4. Integration

- [x] 4.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 4.2 Im Browser (Release-Build) prüfen und Ergebnis in design.md festhalten: eigenen Export erneut importieren (Dialog mit „Überspringen“), Datei mit geänderter Formatkennung und mit Schemaversion 4 (Warnung, Kopien), Tastaturbedienung des Dialogs; Hell- und Dunkelmodus
- [x] 4.3 `openspec validate tolerant-import --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
