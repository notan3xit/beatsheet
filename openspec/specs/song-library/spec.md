# song-library Specification

## Purpose

Verwaltet die Songs des Notenbuchs. Ein Song ist die oberste Einheit: Er enthält seine eigenen Patterns und seine Struktur und wird als Doppelseite geöffnet.

## Requirements

### Requirement: Song anlegen
Das System MUST das Anlegen eines Songs mit Titel ermöglichen. Ohne Titel MUST der Song „Neuer Song“ heißen, ein leerer oder nur aus Leerzeichen bestehender Titel MUST abgelehnt werden. Jeder Song MUST eine stabile, eindeutige ID erhalten und startet ohne Patterns und ohne Segmente.

#### Scenario: Song mit Titel anlegen
- **WHEN** der Nutzer einen Song „Hysteria“ anlegt
- **THEN** enthält die Song-Liste „Hysteria“ und der Song ist leer

#### Scenario: Song ohne Titel anlegen
- **WHEN** der Nutzer einen Song anlegt, ohne einen Titel einzugeben
- **THEN** heißt der Song „Neuer Song“

### Requirement: Song umbenennen
Das System MUST das Ändern des Titels ermöglichen. Ein leerer oder nur aus Leerzeichen bestehender Titel MUST abgelehnt werden, der bisherige Titel bleibt dann erhalten.

#### Scenario: Titel ändern
- **WHEN** der Nutzer „Neuer Song“ in „Uprising“ umbenennt
- **THEN** zeigt die Song-Liste „Uprising“

#### Scenario: Leerer Titel
- **WHEN** der Nutzer den Titel auf eine leere Zeichenkette ändert
- **THEN** bleibt der bisherige Titel erhalten

### Requirement: Song löschen
Das System MUST das Löschen eines Songs nach Bestätigung ermöglichen. Die Nachfrage MUST darauf hinweisen, dass alle Patterns und die Struktur des Songs mitgelöscht werden.

#### Scenario: Löschen bestätigt
- **WHEN** der Nutzer einen Song löscht und die Nachfrage bestätigt
- **THEN** ist der Song mit seinen Patterns nicht mehr vorhanden

#### Scenario: Löschen abgebrochen
- **WHEN** der Nutzer die Nachfrage ablehnt
- **THEN** bleibt der Song unverändert

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
