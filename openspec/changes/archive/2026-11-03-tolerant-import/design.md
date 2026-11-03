# Design

## Context

- `parseNotebookFile` (`src/persistence/fileFormat.ts`) prüft zuerst den Kopf (`format` exakt `FORMAT_ID`, `schemaVersion` ≤ 3) und danach die Struktur mit zod. `fileSchemaV1`/`fileSchemaV2` verlangen zusätzlich `format`, `schemaVersion` und `exportedAt`.
- `mergeImport` (`src/persistence/merge.ts`) entscheidet allein nach Revision und Änderungszeitpunkt; `LibraryFileActions` übernimmt das Ergebnis sofort über `store.importSongs`.
- `store.importSongs` ersetzt Songs gleicher ID und hängt neue an; `connectStore` speichert jede geänderte Song-Referenz. Kopien mit neuer ID laufen damit ohne Änderung am Repository durch.
- Pattern-IDs gelten nur innerhalb ihres Songs (`findPattern` sucht im geöffneten Song). Eine Song-Kopie darf die Pattern-IDs des Originals behalten.

## Goals / Non-Goals

**Goals:**
- Prüf- und Planungslogik rein und ohne React (`persistence`), der Dialog nur Darstellung und Auswahl.

**Non-Goals:**
- Zusammenführen zweier Fassungen eines Songs (Automerge) beim Import.
- Neue Schemaversion oder Änderung des Exportformats.

## Decisions

### D1 Erkennung über die Struktur

`parseNotebookFile` prüft keinen Kopf mehr. Ablauf:

1. JSON parsen, sonst Fehler „kein gültiges JSON“.
2. Ist `songs` ein Array → Schema „aktuell“ (bisher V2/V3); sonst ist `patterns` ein Array → Schema V1; sonst Fehler „Die Datei enthält keine importierbaren Songs.“
3. `fromNewerVersion = typeof schemaVersion === 'number' && schemaVersion > SCHEMA_VERSION`.
4. Strukturprüfung wie bisher; `format`, `schemaVersion` und `exportedAt` verschwinden aus den Dateischemata.

Ergebnis: `{ ok: true, songs, fromNewerVersion }`.

Die Struktur hat Vorrang vor der Versionsangabe: Eine Datei mit `schemaVersion: 1` und einer Liste `songs` wird als aktuelles Format gelesen. Alternative (Version entscheidet, Struktur nur ohne Version) verworfen: zwei Regeln statt einer, und die Version ist gerade die Angabe, die sich als unzuverlässig erwiesen hat.

Fehlermeldungen nennen den Projektnamen nicht mehr.

### D2 Importplan als reine Funktionen

`mergeImport` wird ersetzt durch zwei Funktionen in `src/persistence/merge.ts`:

- `planImport(local, incoming, { fromNewerVersion })` → je Song der Datei ein Eintrag `{ song, existing?: Song, newer: 'file' | 'local', choice }`. Wahl für neue Songs `'add' | 'skip'`, für vorhandene `'replace' | 'copy' | 'skip'`. Vorbelegung: neuer Song → `'add'`; vorhanden und `fromNewerVersion` → `'copy'`; sonst `'replace'`, wenn die Datei nach bisheriger Regel (`isNewer`) neuer ist, andernfalls `'skip'`.
- `applyImport(plan, deps)` → `{ songs: Song[], summary: { added, replaced, copied, skipped } }`, `songs` sind die zu übernehmenden Songs für `store.importSongs`.

Ersetzen: Ist die Datei neuer, wird ihr Song unverändert übernommen (gleiche Revision wie auf dem exportierenden Gerät). Sonst erhält er `revision = existing.revision + 1` und `updatedAt = now`, damit die bewusste Ersetzung als jüngste Änderung gilt und nicht von der lokalen Fassung zurückgeschlagen wird.

Kopie: neue Song-ID über `deps.newId`, Titel „<Titel> (Kopie)“ wie bei `duplicatePattern`, `revision = 1`, `createdAt = updatedAt = now`; Patterns, Segmente und ihre IDs bleiben.

Alternative: Auswahl im Store statt in `persistence` verworfen; die Planung ist ohne Store testbar, und `importSongs` bleibt unverändert.

### D3 Import-Dialog

Neue Komponente `src/ui/ImportDialog.tsx`, modal nach dem Muster von `ConfirmDialog` (`role="dialog"`, `aria-modal`, Fokus auf der Hauptaktion).

- Kopf: Warnung bei `fromNewerVersion` (Farbe `--warning`).
- Je vorhandenem Song eine `fieldset` mit dem Titel als `legend` und drei Radiobuttons „Ersetzen“, „Als Kopie“, „Überspringen“; daneben „Datei neuer“ bzw. „Lokal neuer“ mit Revision und Änderungsdatum beider Fassungen.
- Je neuem Song eine `fieldset` mit „Hinzufügen“ und „Überspringen“, als eigene Gruppe vor den vorhandenen Songs.
- Knöpfe „Alle ersetzen“, „Alle als Kopie“, „Alle überspringen“, darunter „Abbrechen“ und „Importieren“.

`LibraryFileActions` zeigt den Dialog bei jedem gültigen Import, damit der Nutzer vor jeder Übernahme sieht und entscheidet, was geschieht. Die Meldung lautet „Import abgeschlossen (Songs): x hinzugefügt, y ersetzt, z als Kopie, w übersprungen.“

## Risks / Trade-offs

- [Eine fremde JSON-Datei mit zufällig passender Struktur wird importiert] → Die vollständige Strukturprüfung bleibt; ein irrtümlich importierter Song lässt sich löschen.
- [Eine Datei aus einer neueren Version wird falsch verstanden] → Warnung und Vorbelegung „Als Kopie“; das Original bleibt erhalten.
- [Ersetzen mit älterer Fassung verliert lokale Änderungen] → nur auf ausdrückliche Wahl, die Vorbelegung ist „Überspringen“; der Dialog zeigt, welche Fassung neuer ist.
- [Doppelte Pattern-IDs über Songs hinweg nach einer Kopie] → Pattern-IDs sind songbezogen; das Szenario „Kopie ist eigenständig“ sichert das ab.

## Prüfung im Browser

Release-Build von artjom geprüft: eigener Export erneut importiert, Datei mit geänderter Formatkennung und mit Schemaversion 4 (Warnung, Kopien), Tastaturbedienung, Hell- und Dunkelmodus. Alles wie spezifiziert.
