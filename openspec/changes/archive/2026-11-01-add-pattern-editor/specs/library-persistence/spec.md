# Spec Delta

## Purpose

Hält die Bibliothek local-first im Gerät des Nutzers und macht sie über ein versioniertes Dateiformat exportier- und importierbar. Dieses Format ist zugleich die Grundlage für die spätere Synchronisierung zwischen Geräten.

## ADDED Requirements

### Requirement: Automatisches lokales Speichern
Jede Änderung an der Bibliothek MUST ohne eigene Speicheraktion des Nutzers lokal auf dem Gerät gespeichert werden und ein Neuladen oder Schließen der App überstehen.

#### Scenario: Neuladen nach Änderung
- **WHEN** der Nutzer einen Schlag setzt und die App anschließend neu lädt
- **THEN** ist der Schlag weiterhin im Pattern vorhanden

#### Scenario: Erster Start
- **WHEN** die App auf einem Gerät ohne gespeicherte Daten gestartet wird
- **THEN** startet sie mit einer leeren Bibliothek

### Requirement: Dauerhaften Speicher anfordern
Die App MUST beim Browser dauerhaften Speicher anfordern, damit lokale Daten nicht automatisch gelöscht werden. Gewährt der Browser ihn nicht, MUST die App den Nutzer darauf hinweisen und den Export als Sicherung empfehlen.

#### Scenario: Speicher nicht dauerhaft
- **WHEN** der Browser dauerhaften Speicher verweigert
- **THEN** zeigt die App einen Hinweis, dass Daten gelöscht werden könnten, mit einem Verweis auf den Export

### Requirement: Änderungsmetadaten
Jedes Pattern MUST einen Erstellungszeitpunkt, einen Zeitpunkt der letzten Änderung und eine Revisionsnummer führen. Die Revisionsnummer MUST bei jeder Änderung des Patterns um 1 steigen.

#### Scenario: Revision nach Änderung
- **WHEN** der Nutzer an einem Pattern mit Revision 3 einen Schlag setzt
- **THEN** hat das Pattern Revision 4 und einen aktualisierten Änderungszeitpunkt

### Requirement: Export der Bibliothek
Der Nutzer MUST die gesamte Bibliothek als JSON-Datei exportieren können. Die Datei MUST eine Formatkennung, die Schemaversion 1 und alle Patterns mit ID, Typ, Name, Länge, Unterteilungen, Schlägen und Änderungsmetadaten enthalten.

#### Scenario: Export herunterladen
- **WHEN** der Nutzer „Exportieren“ wählt
- **THEN** erhält er eine Datei mit der Endung `.drumbook.json`, die alle Patterns der Bibliothek enthält

#### Scenario: Export ist verlustfrei
- **WHEN** eine Bibliothek exportiert und in eine leere Bibliothek wieder importiert wird
- **THEN** sind alle Patterns mit identischen IDs und identischem Inhalt vorhanden

### Requirement: Import einer Bibliothek
Der Nutzer MUST eine exportierte Datei importieren können. Patterns mit unbekannter ID MUST hinzugefügt werden. Bei gleicher ID MUST die Fassung mit der höheren Revision gelten, bei gleicher Revision die mit dem späteren Änderungszeitpunkt. Nach dem Import MUST die App anzeigen, wie viele Patterns hinzugefügt, aktualisiert und unverändert gelassen wurden.

#### Scenario: Neue Patterns importieren
- **WHEN** der Nutzer eine Datei mit zwei Patterns importiert, deren IDs lokal unbekannt sind
- **THEN** enthält die Bibliothek beide Patterns zusätzlich
- **AND** die App meldet „2 hinzugefügt, 0 aktualisiert, 0 unverändert“

#### Scenario: Neuere Fassung gewinnt
- **WHEN** ein Pattern lokal Revision 2 hat und die Importdatei dasselbe Pattern mit Revision 5 enthält
- **THEN** wird das lokale Pattern durch die importierte Fassung ersetzt

#### Scenario: Ältere Fassung wird ignoriert
- **WHEN** ein Pattern lokal Revision 5 hat und die Importdatei dasselbe Pattern mit Revision 2 enthält
- **THEN** bleibt das lokale Pattern unverändert

### Requirement: Ungültige Importdateien
Eine Datei, die kein gültiges JSON ist, eine fremde Formatkennung hat, eine unbekannte oder höhere Schemaversion trägt oder die Strukturregeln verletzt, MUST vollständig abgewiesen werden. Die Bibliothek MUST dabei unverändert bleiben, und der Nutzer MUST eine verständliche Fehlermeldung erhalten.

#### Scenario: Neuere Schemaversion
- **WHEN** der Nutzer eine Datei mit Schemaversion 2 importiert
- **THEN** wird der Import abgewiesen mit dem Hinweis, dass die Datei mit einer neueren Version erstellt wurde
- **AND** die Bibliothek bleibt unverändert

#### Scenario: Beschädigte Datei
- **WHEN** der Nutzer eine Datei importiert, in der ein Pattern die Länge 0 hat
- **THEN** wird der gesamte Import abgewiesen und kein Pattern der Datei übernommen
