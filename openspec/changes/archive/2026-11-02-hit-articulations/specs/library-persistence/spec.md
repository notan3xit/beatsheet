# Spec Delta

## MODIFIED Requirements

### Requirement: Export der Bibliothek
Der Nutzer MUST alle Songs als JSON-Datei exportieren können. Die Datei MUST eine Formatkennung, die Schemaversion 3 und alle Songs mit Titel, Struktur, Patterns einschließlich der Spielweisen ihrer Schläge und Änderungsmetadaten enthalten.

#### Scenario: Export herunterladen
- **WHEN** der Nutzer „Exportieren“ wählt
- **THEN** erhält er eine Datei mit der Endung `.drumbook.json`, die alle Songs enthält

#### Scenario: Export ist verlustfrei
- **WHEN** alle Songs exportiert und auf einem leeren Gerät wieder importiert werden
- **THEN** sind alle Songs mit identischen IDs, identischer Struktur und identischen Patterns vorhanden

#### Scenario: Spielweisen im Export
- **WHEN** ein Pattern eine Snare mit Flam und eine Ghost Note enthält und exportiert und wieder importiert wird
- **THEN** hat das importierte Pattern denselben Flam und dieselbe Ghost Note

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

## ADDED Requirements

### Requirement: Import von Dateien der Schemaversion 2
Eine gültige Datei der Schemaversion 2 MUST weiterhin importiert werden können. Ihre Schläge MUST normal gespielt sein.

#### Scenario: Export der Vorversion importieren
- **WHEN** der Nutzer eine Datei mit Schemaversion 2 und einem Song importiert
- **THEN** enthält die Song-Liste diesen Song mit unveränderter Struktur und unveränderten Patterns
