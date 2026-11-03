## MODIFIED Requirements

### Requirement: Import einer Bibliothek
Der Nutzer MUST eine exportierte Datei importieren können. Vor jeder Übernahme MUST die App einen Import-Dialog mit allen Songs der Datei zeigen (siehe „Auswahl im Import-Dialog“). Nach dem Import MUST die App anzeigen, wie viele Songs hinzugefügt, ersetzt, als Kopie übernommen und übersprungen wurden.

#### Scenario: Neue Patterns importieren
- **WHEN** der Nutzer eine Datei mit zwei Songs samt ihren Patterns importiert, deren IDs lokal unbekannt sind, und die Vorbelegung bestätigt
- **THEN** enthält die Song-Liste beide Songs zusätzlich, jeweils mit ihren Patterns
- **AND** die App meldet „2 hinzugefügt, 0 ersetzt, 0 als Kopie, 0 übersprungen“

#### Scenario: Dialog auch ohne vorhandene Songs
- **WHEN** der Nutzer eine Datei der aktuellen Schemaversion importiert, deren Song-IDs lokal alle unbekannt sind
- **THEN** zeigt die App den Import-Dialog mit diesen Songs
- **AND** vor dem Bestätigen ist kein Song übernommen

#### Scenario: Neuere Fassung gewinnt
- **WHEN** ein Song lokal Revision 2 hat, die Importdatei denselben Song mit Revision 5 enthält und der Nutzer die Vorbelegung bestätigt
- **THEN** wird der lokale Song samt Struktur und Patterns durch die importierte Fassung ersetzt

#### Scenario: Ältere Fassung wird ignoriert
- **WHEN** ein Song lokal Revision 5 hat, die Importdatei denselben Song mit Revision 2 enthält und der Nutzer die Vorbelegung bestätigt
- **THEN** bleibt der lokale Song unverändert

### Requirement: Ungültige Importdateien
Eine Datei, die kein gültiges JSON ist, weder Songs noch Patterns in erkennbarer Form enthält oder die Strukturregeln verletzt, MUST vollständig abgewiesen werden. Formatkennung und Schemaversion MUST NOT allein zur Abweisung führen. Die Songs MUST dabei unverändert bleiben, und der Nutzer MUST eine verständliche Fehlermeldung erhalten.

#### Scenario: Neuere Schemaversion
- **WHEN** der Nutzer eine sonst gültige Datei mit Schemaversion 4 importiert
- **THEN** wird der Import nicht abgewiesen, sondern mit der Warnung zur neueren Version angeboten

#### Scenario: Keine erkennbaren Songs
- **WHEN** der Nutzer eine JSON-Datei ohne `songs` und ohne `patterns` importiert
- **THEN** wird der Import abgewiesen mit dem Hinweis, dass die Datei keine importierbaren Songs enthält
- **AND** die Songs bleiben unverändert

#### Scenario: Beschädigte Datei
- **WHEN** der Nutzer eine Datei importiert, in der ein Pattern die Länge 0 hat
- **THEN** wird der gesamte Import abgewiesen und kein Song der Datei übernommen

#### Scenario: Verweis auf fremdes Pattern
- **WHEN** ein Takt in der Importdatei auf ein Pattern verweist, das nicht zu seinem Song gehört
- **THEN** wird der gesamte Import abgewiesen

#### Scenario: Spielweise ohne Schlag
- **WHEN** die Importdatei eine Spielweise für eine Position enthält, an der kein Schlag des Instruments liegt
- **THEN** wird der gesamte Import abgewiesen

#### Scenario: Spielweise auf der Hi-Hat
- **WHEN** die Importdatei einen Flam auf der Hi-Hat enthält
- **THEN** wird der gesamte Import abgewiesen

#### Scenario: Ungültiges Tempo
- **WHEN** die Importdatei einen Song mit Tempo 0 oder 72,5 enthält
- **THEN** wird der gesamte Import abgewiesen

### Requirement: Import von Dateien der Schemaversion 1
Eine gültige Datei der Schemaversion 1 MUST weiterhin importiert werden können. Ihre Patterns MUST in einem neuen Song „Importierte Patterns“ ohne Struktur landen, mit unveränderten Pattern-IDs und Inhalten.

#### Scenario: Alte Exportdatei importieren
- **WHEN** der Nutzer eine Datei mit Schemaversion 1 und drei Patterns importiert und die Vorbelegung bestätigt
- **THEN** gibt es einen neuen Song „Importierte Patterns“ mit diesen drei Patterns
- **AND** die App meldet „1 hinzugefügt, 0 ersetzt, 0 als Kopie, 0 übersprungen“

## ADDED Requirements

### Requirement: Formatkennung und Schemaversion beim Import
Die Formatkennung MUST beim Import ignoriert werden. Die Schemaversion MUST optional sein: Fehlt sie oder ist sie keine Zahl, MUST die Struktur entscheiden, eine Liste `songs` als aktuelles Format, eine Liste `patterns` als Format der Schemaversion 1. Der Export MUST Formatkennung und Schemaversion weiterhin schreiben.

#### Scenario: Fremde Formatkennung
- **WHEN** der Nutzer eine sonst gültige Datei der Schemaversion 3 mit der Formatkennung `anderes.format` importiert
- **THEN** werden ihre Songs importiert

#### Scenario: Ohne Formatkennung und Schemaversion
- **WHEN** der Nutzer eine Datei importiert, die nur eine gültige Liste `songs` mit einem Song enthält
- **THEN** wird der Song importiert

#### Scenario: Altes Format ohne Schemaversion
- **WHEN** der Nutzer eine Datei importiert, die nur eine gültige Liste `patterns` mit zwei Patterns ohne Farbe enthält
- **THEN** gibt es einen neuen Song „Importierte Patterns“ mit diesen zwei Patterns

### Requirement: Import aus einer neueren Version
Eine Datei mit höherer Schemaversion als der eigenen MUST wie das aktuelle Format gelesen und nach denselben Strukturregeln geprüft werden. Vor der Übernahme MUST die App warnen, dass die Datei aus einer neueren Version stammt und Inhalte fehlen oder abweichen können. Vorhandene Songs MUST dabei mit „Als Kopie“ vorbelegt sein.

#### Scenario: Warnung vor der Übernahme
- **WHEN** der Nutzer eine sonst gültige Datei mit Schemaversion 4 und einem lokal unbekannten Song importiert
- **THEN** zeigt die App vor der Übernahme die Warnung zur neueren Version
- **AND** nach dem Bestätigen enthält die Song-Liste den Song

#### Scenario: Vorhandener Song aus neuerer Version
- **WHEN** die Datei mit Schemaversion 4 einen Song enthält, der lokal mit niedrigerer Revision existiert
- **THEN** ist für diesen Song „Als Kopie“ vorgewählt

#### Scenario: Abbrechen nach der Warnung
- **WHEN** der Nutzer den Import einer Datei mit Schemaversion 4 abbricht
- **THEN** bleiben die Songs unverändert

### Requirement: Auswahl im Import-Dialog
Im Import-Dialog MUST der Nutzer für jeden neuen Song „Hinzufügen“ oder „Überspringen“ wählen können, vorbelegt mit „Hinzufügen“. Für jeden vorhandenen Song MUST er „Ersetzen“, „Als Kopie“ oder „Überspringen“ wählen können, zusätzlich für alle vorhandenen Songs auf einmal. Der Dialog MUST je Song zeigen, welche Fassung neuer ist. Abbrechen MUST nichts übernehmen.

#### Scenario: Vorbelegung nach Revision
- **WHEN** die Datei der aktuellen Schemaversion einen Song mit höherer und einen mit niedrigerer Revision als lokal enthält
- **THEN** ist für den ersten „Ersetzen“ und für den zweiten „Überspringen“ vorgewählt

#### Scenario: Gleiche Revision
- **WHEN** die Datei einen Song mit gleicher Revision, aber späterem Änderungszeitpunkt als lokal enthält
- **THEN** ist „Ersetzen“ vorgewählt

#### Scenario: Ältere Fassung ersetzen
- **WHEN** ein Song lokal Revision 5 hat, die Datei ihn mit Revision 2 enthält und der Nutzer „Ersetzen“ wählt
- **THEN** hat der lokale Song danach Struktur und Patterns der importierten Fassung
- **AND** seine Revision ist höher als 5

#### Scenario: Neuen Song überspringen
- **WHEN** die Datei zwei lokal unbekannte Songs enthält und der Nutzer für einen „Überspringen“ wählt
- **THEN** enthält die Song-Liste nur den anderen zusätzlich
- **AND** die App meldet „1 hinzugefügt, 0 ersetzt, 0 als Kopie, 1 übersprungen“

#### Scenario: Alle auf einmal
- **WHEN** die Datei drei vorhandene Songs enthält und der Nutzer „Alle als Kopie“ wählt
- **THEN** ist für alle drei Songs „Als Kopie“ gewählt

#### Scenario: Import abbrechen
- **WHEN** der Nutzer im Import-Dialog „Abbrechen“ wählt
- **THEN** bleiben die Songs unverändert und es wird kein Song hinzugefügt

#### Scenario: Gemischte Auswahl
- **WHEN** die Datei einen neuen Song und drei vorhandene enthält und der Nutzer je einen ersetzt, als Kopie übernimmt und überspringt
- **THEN** meldet die App „1 hinzugefügt, 1 ersetzt, 1 als Kopie, 1 übersprungen“

### Requirement: Import als Kopie
Ein als Kopie importierter Song MUST eine neue ID, den Titel „<Titel> (Kopie)“, die Revision 1 und den Importzeitpunkt als Erstellungs- und Änderungszeitpunkt erhalten. Struktur, Patterns und Tempo MUST denen der Datei entsprechen. Der lokale Song mit der ursprünglichen ID MUST unverändert bleiben.

#### Scenario: Kopie neben dem Original
- **WHEN** der Nutzer den vorhandenen Song „Intro“ als Kopie importiert
- **THEN** enthält die Song-Liste den unveränderten Song „Intro“ und zusätzlich „Intro (Kopie)“ mit Struktur und Patterns aus der Datei

#### Scenario: Kopie ist eigenständig
- **WHEN** der Nutzer einen als Kopie importierten Song bearbeitet
- **THEN** bleibt der Song mit der ursprünglichen ID unverändert
