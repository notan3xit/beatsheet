# Spec Delta

## ADDED Requirements

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
