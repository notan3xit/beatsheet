# Spec Delta

## MODIFIED Requirements

### Requirement: Export der Bibliothek
Der Nutzer MUST alle Songs als JSON-Datei exportieren können. Die Datei MUST eine Formatkennung, die Schemaversion 3 und alle Songs mit Titel, Tempo, Struktur, Patterns einschließlich der Spielweisen ihrer Schläge und Änderungsmetadaten enthalten.

#### Scenario: Export herunterladen
- **WHEN** der Nutzer „Exportieren“ wählt
- **THEN** erhält er eine Datei mit der Endung `.drumbook.json`, die alle Songs enthält

#### Scenario: Export ist verlustfrei
- **WHEN** alle Songs exportiert und auf einem leeren Gerät wieder importiert werden
- **THEN** sind alle Songs mit identischen IDs, identischer Struktur und identischen Patterns vorhanden

#### Scenario: Spielweisen im Export
- **WHEN** ein Pattern eine Snare mit Flam und eine Ghost Note enthält und exportiert und wieder importiert wird
- **THEN** hat das importierte Pattern denselben Flam und dieselbe Ghost Note

#### Scenario: Tempo im Export
- **WHEN** ein Song mit Tempo 96 exportiert und wieder importiert wird
- **THEN** hat der importierte Song das Tempo 96

### Requirement: Ungültige Importdateien
Eine Datei, die kein gültiges JSON ist, eine fremde Formatkennung hat, eine unbekannte oder höhere Schemaversion trägt oder die Strukturregeln verletzt, MUST vollständig abgewiesen werden. Die Songs MUST dabei unverändert bleiben, und der Nutzer MUST eine verständliche Fehlermeldung erhalten.

#### Scenario: Neuere Schemaversion
- **WHEN** der Nutzer eine Datei mit Schemaversion 4 importiert
- **THEN** wird der Import abgewiesen mit dem Hinweis, dass die Datei mit einer neueren Version erstellt wurde
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

## ADDED Requirements

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
