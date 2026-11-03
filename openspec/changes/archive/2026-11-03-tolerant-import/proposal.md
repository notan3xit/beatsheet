# Proposal

## Why

Der Import weist heute Dateien wegen formaler Angaben ab (fremde Formatkennung, fehlende oder höhere Schemaversion), auch wenn ihr Inhalt lesbar ist. Eine Umbenennung des Projekts oder ein Export aus einer neueren Version macht exportierte Songs damit unbrauchbar. Außerdem entscheidet bei vorhandenen Songs allein die Revision, ob ersetzt wird; der Nutzer hat keine Wahl, und ein falsch gelesener Song kann einen intakten lokalen Song überschreiben.

## What Changes

- Die Formatkennung wird beim Import nicht mehr geprüft; der Export schreibt sie weiter.
- Die Schemaversion ist beim Import optional. Fehlt sie, entscheidet die Struktur: `songs` → aktuelles Format, `patterns` → Format der Schemaversion 1.
- Eine höhere Schemaversion wird nicht mehr abgewiesen: Der Import läuft mit Warnung, vorhandene Songs sind dabei mit „Als Kopie“ vorbelegt.
- Neuer Import-Dialog vor jeder Übernahme: Für jeden vorhandenen Song wählt der Nutzer „Ersetzen“, „Als Kopie“ oder „Überspringen“, für jeden neuen „Hinzufügen“ oder „Überspringen“, mit Vorbelegung und Schaltern für alle vorhandenen Songs.
- Eine Kopie erhält eine neue ID und den Titel „<Titel> (Kopie)“; das Original bleibt unverändert.
- Abgewiesen wird nur noch, was sich nicht als Songs lesen lässt: kein gültiges JSON, keine erkennbare Struktur, verletzte Strukturregeln.
- Die Erfolgsmeldung zählt hinzugefügte, ersetzte, als Kopie übernommene und übersprungene Songs.
- **BREAKING** (Verhalten): Vorhandene Songs werden nicht mehr allein nach Revision ersetzt oder belassen; der Nutzer entscheidet im Dialog, die Revision bestimmt nur die Vorbelegung.

Nicht enthalten: Umbenennung des Projekts, Zusammenführen zweier Fassungen eines Songs beim Import.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `library-persistence`: Import ohne formale Pflichtangaben, Import aus neueren Versionen mit Warnung, Auswahl pro vorhandenem Song, neue Importmeldung.
- `song-merge`: Der Import einer Ausgangsfassung belegt „Überspringen“ vor, statt den zusammengeführten Song selbsttätig zu belassen.

## Impact

- `src/persistence/fileFormat.ts`: Kopfprüfung, Erkennung über die Struktur, Ergebnis mit Hinweis auf neuere Version
- `src/persistence/merge.ts`: Import nach Auswahl pro Song statt nach Revision; Vorbelegung
- `src/ui/LibraryFileActions.tsx` und neuer Import-Dialog; `src/ui/styles.css`
- Dateiformat und Schemaversion bleiben unverändert
