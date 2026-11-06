# Spec Delta

## ADDED Requirements

### Requirement: Import von Dateien der Schemaversion 3
Eine gültige Datei der Schemaversion 3 MUST weiterhin importiert werden können. Ihre Schläge MUST ihre Spielweisen behalten und unbetont sein.

#### Scenario: Datei der Schemaversion 3
- **WHEN** der Nutzer eine Datei mit Schemaversion 3 und einem Song mit Flams importiert
- **THEN** enthält die Song-Liste diesen Song mit denselben Flams und ohne Betonungen

### Requirement: Bestehende Songs ohne neue Felder
Ein lokal gespeicherter oder synchronisierter Song aus einer früheren Version MUST beim Laden unverändert bleiben und MUST allein dadurch keine neue Revision und keinen Abgleich auslösen.

#### Scenario: Song aus der Vorversion laden
- **WHEN** die App einen gespeicherten Song der Vorversion mit Revision 6 und Flams lädt
- **THEN** hat der Song weiterhin Revision 6 und dieselben Flams

## MODIFIED Requirements

### Requirement: Export der Bibliothek
Der Nutzer MUST alle Songs als JSON-Datei exportieren können. Die Datei MUST eine Formatkennung, die Schemaversion 4 und alle Songs mit Titel, Tempo, Struktur, Patterns einschließlich der Spielweisen und Betonungen ihrer Schläge und Änderungsmetadaten enthalten.

#### Scenario: Export herunterladen
- **WHEN** der Nutzer am 3. November 2026 „Exportieren“ wählt
- **THEN** erhält er die Datei `beatsheet-2026-11-03.json`, die alle Songs enthält

#### Scenario: Export ist verlustfrei
- **WHEN** alle Songs exportiert und auf einem leeren Gerät wieder importiert werden
- **THEN** sind alle Songs mit identischen IDs, identischer Struktur und identischen Patterns vorhanden

#### Scenario: Spielweisen im Export
- **WHEN** ein Pattern eine Snare mit Flam und eine Ghost Note enthält und exportiert und wieder importiert wird
- **THEN** hat das importierte Pattern denselben Flam und dieselbe Ghost Note

#### Scenario: Neue Spielweisen und Betonung im Export
- **WHEN** ein Pattern einen betonten Rim Shot, einen Drag, eine Ride-Glocke, einen Crash mit Choke und eine betonte Hi-Hat enthält und exportiert und wieder importiert wird
- **THEN** hat das importierte Pattern dieselben Spielweisen und Betonungen

#### Scenario: Tempo im Export
- **WHEN** ein Song mit Tempo 96 exportiert und wieder importiert wird
- **THEN** hat der importierte Song das Tempo 96

### Requirement: Ungültige Importdateien
Eine Datei, die kein gültiges JSON ist, weder Songs noch Patterns in erkennbarer Form enthält oder die Strukturregeln verletzt, MUST vollständig abgewiesen werden. Formatkennung und Schemaversion MUST NOT allein zur Abweisung führen. Die Songs MUST dabei unverändert bleiben, und der Nutzer MUST eine verständliche Fehlermeldung erhalten.

#### Scenario: Neuere Schemaversion
- **WHEN** der Nutzer eine sonst gültige Datei mit Schemaversion 5 importiert
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

#### Scenario: Spielweise auf einem unpassenden Instrument
- **WHEN** die Importdatei einen Rim Shot auf Tom 1 oder einen Flam auf der Ride enthält
- **THEN** wird der gesamte Import abgewiesen

#### Scenario: Betonung ohne Schlag
- **WHEN** die Importdatei eine Betonung für eine Position enthält, an der kein Schlag des Instruments liegt
- **THEN** wird der gesamte Import abgewiesen

#### Scenario: Betonte Ghost Note
- **WHEN** die Importdatei eine Betonung für eine Ghost Note enthält
- **THEN** wird der gesamte Import abgewiesen

#### Scenario: Ungültiges Tempo
- **WHEN** die Importdatei einen Song mit Tempo 0 oder 72,5 enthält
- **THEN** wird der gesamte Import abgewiesen

### Requirement: Import aus einer neueren Version
Eine Datei mit höherer Schemaversion als der eigenen MUST wie das aktuelle Format gelesen und nach denselben Strukturregeln geprüft werden. Vor der Übernahme MUST die App warnen, dass die Datei aus einer neueren Version stammt und Inhalte fehlen oder abweichen können. Vorhandene Songs MUST dabei mit „Als Kopie“ vorbelegt sein.

#### Scenario: Warnung vor der Übernahme
- **WHEN** der Nutzer eine sonst gültige Datei mit Schemaversion 5 und einem lokal unbekannten Song importiert
- **THEN** zeigt die App vor der Übernahme die Warnung zur neueren Version
- **AND** nach dem Bestätigen enthält die Song-Liste den Song

#### Scenario: Vorhandener Song aus neuerer Version
- **WHEN** die Datei mit Schemaversion 5 einen Song enthält, der lokal mit niedrigerer Revision existiert
- **THEN** ist für diesen Song „Als Kopie“ vorgewählt

#### Scenario: Abbrechen nach der Warnung
- **WHEN** der Nutzer den Import einer Datei mit Schemaversion 5 abbricht
- **THEN** bleiben die Songs unverändert
