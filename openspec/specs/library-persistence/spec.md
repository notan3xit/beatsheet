# library-persistence Specification

## Purpose

Hält die Bibliothek local-first im Gerät des Nutzers und macht sie über ein versioniertes Dateiformat exportier- und importierbar. Dieses Format ist zugleich die Grundlage für die spätere Synchronisierung zwischen Geräten.

## Requirements

### Requirement: Automatisches lokales Speichern
Jede Änderung an Songs, ihren Patterns und ihrer Struktur MUST ohne eigene Speicheraktion des Nutzers lokal auf dem Gerät gespeichert werden und ein Neuladen oder Schließen der App überstehen.

#### Scenario: Neuladen nach Änderung
- **WHEN** der Nutzer einen Schlag setzt und die App anschließend neu lädt
- **THEN** ist der Schlag weiterhin im Pattern vorhanden

#### Scenario: Neuladen nach Strukturänderung
- **WHEN** der Nutzer ein Segment anlegt und die App anschließend neu lädt
- **THEN** ist das Segment mit seinen Takten weiterhin vorhanden

#### Scenario: Erster Start
- **WHEN** die App auf einem Gerät ohne gespeicherte Daten gestartet wird
- **THEN** startet sie mit einer leeren Song-Liste

### Requirement: Dauerhaften Speicher anfordern
Die App MUST beim Browser dauerhaften Speicher anfordern, damit lokale Daten nicht automatisch gelöscht werden. Gewährt der Browser ihn nicht, MUST die App den Nutzer darauf hinweisen und den Export als Sicherung empfehlen.

#### Scenario: Speicher nicht dauerhaft
- **WHEN** der Browser dauerhaften Speicher verweigert
- **THEN** zeigt die App einen Hinweis, dass Daten gelöscht werden könnten, mit einem Verweis auf den Export

### Requirement: Änderungsmetadaten
Jeder Song und jedes Pattern MUST einen Erstellungszeitpunkt, einen Zeitpunkt der letzten Änderung und eine Revisionsnummer führen. Die Revisionsnummer eines Patterns MUST bei jeder Änderung des Patterns um 1 steigen, die eines Songs bei jeder Änderung am Song, seinen Patterns oder seiner Struktur.

#### Scenario: Revision nach Änderung
- **WHEN** der Nutzer an einem Pattern mit Revision 3 einen Schlag setzt
- **THEN** hat das Pattern Revision 4 und einen aktualisierten Änderungszeitpunkt
- **AND** die Revision seines Songs ist um 1 gestiegen

#### Scenario: Revision nach Strukturänderung
- **WHEN** der Nutzer in einem Song mit Revision 7 einen Takt einfügt
- **THEN** hat der Song Revision 8

### Requirement: Export der Bibliothek
Der Nutzer MUST alle Songs als JSON-Datei exportieren können. Die Datei MUST eine Formatkennung, die Schemaversion 3 und alle Songs mit Titel, Tempo, Struktur, Patterns einschließlich der Spielweisen ihrer Schläge und Änderungsmetadaten enthalten.

#### Scenario: Export herunterladen
- **WHEN** der Nutzer am 3. November 2026 „Exportieren“ wählt
- **THEN** erhält er die Datei `beatsheet-2026-11-03.json`, die alle Songs enthält

#### Scenario: Export ist verlustfrei
- **WHEN** alle Songs exportiert und auf einem leeren Gerät wieder importiert werden
- **THEN** sind alle Songs mit identischen IDs, identischer Struktur und identischen Patterns vorhanden

#### Scenario: Spielweisen im Export
- **WHEN** ein Pattern eine Snare mit Flam und eine Ghost Note enthält und exportiert und wieder importiert wird
- **THEN** hat das importierte Pattern denselben Flam und dieselbe Ghost Note

#### Scenario: Tempo im Export
- **WHEN** ein Song mit Tempo 96 exportiert und wieder importiert wird
- **THEN** hat der importierte Song das Tempo 96

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

### Requirement: Übernahme lokaler Daten aus der Vorversion
Beim ersten Start nach dem Update MUST die App lokal gespeicherte Patterns der Vorversion in einen neuen Song „Importierte Patterns“ übernehmen. Ohne alte Patterns MUST kein solcher Song entstehen. Die Übernahme MUST genau einmal erfolgen.

#### Scenario: Vorhandene Patterns
- **WHEN** die App mit zwei lokal gespeicherten Patterns der Vorversion startet
- **THEN** enthält die Song-Liste „Importierte Patterns“ mit beiden Patterns

#### Scenario: Keine alten Daten
- **WHEN** die App auf einem Gerät ohne Patterns der Vorversion startet
- **THEN** ist die Song-Liste leer

#### Scenario: Zweiter Start
- **WHEN** die App nach der Übernahme erneut gestartet wird
- **THEN** gibt es weiterhin genau einen Song „Importierte Patterns“

### Requirement: Import von Dateien der Schemaversion 2
Eine gültige Datei der Schemaversion 2 MUST weiterhin importiert werden können. Ihre Schläge MUST normal gespielt sein.

#### Scenario: Export der Vorversion importieren
- **WHEN** der Nutzer eine Datei mit Schemaversion 2 und einem Song importiert
- **THEN** enthält die Song-Liste diesen Song mit unveränderter Struktur und unveränderten Patterns

### Requirement: Unbekannte Felder in Importdateien
Felder, die das Dateiformat nicht kennt, MUST beim Import ignoriert werden, auf jeder Ebene der Datei (Dateikopf, Song, Segment, Block, Takt, Akzent, Pattern, Beat). Eine sonst gültige Datei MUST deswegen nicht abgewiesen werden; die unbekannten Felder werden nicht übernommen.

#### Scenario: Zusätzliches Feld aus einer neueren Version
- **WHEN** der Nutzer eine Datei der Schemaversion 3 importiert, deren Song ein Feld `key` und deren erstes Pattern ein Feld `swing` enthält
- **THEN** wird der Song mit Struktur und Patterns importiert
- **AND** weder Song noch Pattern enthalten danach `key` oder `swing`

### Requirement: Songs ohne Tempo in Importdateien
Ein Song in einer Importdatei, der kein Tempo angibt, MUST mit dem Tempo 120 übernommen werden; alles andere MUST unverändert übernommen werden. Das gilt für jede importierbare Schemaversion.

#### Scenario: Export ohne Tempo importieren
- **WHEN** der Nutzer eine Datei mit Schemaversion 3 und einem Song mit Flams ohne Tempo importiert
- **THEN** enthält die Song-Liste diesen Song mit unveränderter Struktur, unveränderten Patterns samt Flams und dem Tempo 120

#### Scenario: Datei der Schemaversion 2
- **WHEN** der Nutzer eine Datei mit Schemaversion 2 und einem Song importiert
- **THEN** hat der importierte Song das Tempo 120

### Requirement: Lokal gespeicherte Songs ohne Tempo
Songs, die vor dieser Version lokal gespeichert wurden, MUST nach dem Update unverändert geladen werden und das Tempo 120 haben, ohne dass ihre Revision steigt.

#### Scenario: Start nach dem Update
- **WHEN** die App mit einem lokal gespeicherten Song ohne Tempo und Revision 6 startet
- **THEN** zeigt der Pattern-Editor dieses Songs das Tempo 120
- **AND** der Song hat weiterhin Revision 6

### Requirement: Übernahme lokal gespeicherter Songs in das Dokumentformat
Beim ersten Start nach dem Update MUST die App alle lokal gespeicherten Songs in das zusammenführbare Speicherformat übernehmen, mit unveränderten IDs, Inhalten, Änderungszeitpunkten und Revisionen. Die Übernahme MUST genau einmal erfolgen. Lokal gespeicherte Patterns aus der Version vor den Songs MUST dabei weiterhin in „Importierte Patterns“ landen.

#### Scenario: Vorhandene Songs
- **WHEN** die App mit zwei lokal gespeicherten Songs der Vorversion startet, davon einer mit Revision 6 und Flams
- **THEN** enthält die Song-Liste beide Songs mit unveränderter Struktur, unveränderten Patterns samt Flams und Tempo
- **AND** der eine Song hat weiterhin Revision 6

#### Scenario: Zweiter Start
- **WHEN** die App nach der Übernahme erneut gestartet wird
- **THEN** enthält die Song-Liste dieselben Songs genau einmal mit unveränderten Revisionen

#### Scenario: Änderung nach der Übernahme
- **WHEN** der Nutzer nach der Übernahme einen Schlag setzt und die App neu lädt
- **THEN** ist der Schlag weiterhin vorhanden

#### Scenario: Patterns aus der Version vor den Songs
- **WHEN** die App mit zwei lokal gespeicherten Patterns der Version vor den Songs startet
- **THEN** enthält die Song-Liste „Importierte Patterns“ mit beiden Patterns

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

### Requirement: Exporte unter dem früheren Namen
Dateien, die die App unter ihrem früheren Namen drumstuff exportiert hat (Formatkennung `drumstuff.library`, Endung `.drumbook.json`), MUST sich wie aktuelle Exporte importieren lassen.

#### Scenario: Alter Export
- **WHEN** der Nutzer die Datei `drumstuff-2026-11-02.drumbook.json` mit der Formatkennung `drumstuff.library` und zwei Songs importiert
- **THEN** sind beide Songs mit unveränderten IDs vorhanden

### Requirement: Workbook-Songs im Import
Der Export MUST auch die Songs aus Workbooks enthalten. Wählt der Nutzer im Import-Dialog für einen Song, der zu einem Workbook gehört, „Ersetzen“, MUST der Dialog vor der Übernahme darauf hinweisen, dass die Änderung alle Mitglieder des Workbooks betrifft. Der ersetzte Song MUST im Workbook bleiben. Ein als Kopie importierter Song MUST in „Meine Songs“ landen.

#### Scenario: Workbook-Song ersetzen
- **GIVEN** „Intro“ gehört zu „Band“
- **WHEN** der Nutzer eine Datei mit „Intro“ importiert und für „Intro“ „Ersetzen“ wählt
- **THEN** nennt der Dialog, dass die Änderung alle Mitglieder von „Band“ betrifft
- **AND** nach der Übernahme sehen alle Mitglieder von „Band“ „Intro“ in der Fassung der Datei

#### Scenario: Workbook-Song als Kopie
- **WHEN** der Nutzer „Intro“ aus „Band“ als Kopie importiert
- **THEN** steht „Intro (Kopie)“ in „Meine Songs“ und „Intro“ in „Band“ ist unverändert

#### Scenario: Export
- **WHEN** der Nutzer exportiert, während „Intro“ zu „Band“ gehört
- **THEN** enthält die Datei „Intro“
