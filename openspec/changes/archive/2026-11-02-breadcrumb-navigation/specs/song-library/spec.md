# Spec Delta

## MODIFIED Requirements

### Requirement: Song-Liste
Das System MUST alle Songs alphabetisch nach Titel in einer Tabelle mit den Spalten Titel, Takte, Grooves und Fills auflisten, mit einer Kopfzeile. Ohne Songs MUST die Liste einen Hinweis zeigen, wie man den ersten Song anlegt. Die Auswahl eines Songs MUST seine Doppelseite öffnen.

#### Scenario: Sortierte Liste
- **WHEN** die Songs „Uprising“ (32 Takte, 2 Grooves, 1 Fill) und „Hysteria“ (0 Takte, keine Patterns) existieren
- **THEN** zeigt die Tabelle zuerst „Hysteria“ mit 0, 0, 0, dann „Uprising“ mit 32, 2, 1
- **AND** die Kopfzeile lautet Titel, Takte, Grooves, Fills

#### Scenario: Leere Liste
- **WHEN** keine Songs existieren
- **THEN** zeigt die Liste einen Hinweis zum Anlegen des ersten Songs

#### Scenario: Song öffnen
- **WHEN** der Nutzer in der Liste „Hysteria“ auswählt
- **THEN** zeigt die App die Doppelseite von „Hysteria“
