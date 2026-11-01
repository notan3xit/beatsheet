# pattern-library Specification

## Purpose

Verwaltet die Drum-Patterns des Notenbuchs. Jeder Groove und jeder Fill wird genau einmal als Pattern mit Typ, Name und Länge in Beats angelegt und kann später von der Song-Struktur referenziert werden.

## Requirements

### Requirement: Pattern anlegen
Das System MUST das Anlegen eines Patterns mit Typ (Groove oder Fill), Name und Länge in Beats ermöglichen. Ein Beat entspricht einer Viertelnote. Die Länge MUST eine ganze Zahl von 1 bis 16 sein. Ohne Angaben gelten für einen Groove 4 Beats und für einen Fill 1 Beat. Jedes Pattern MUST eine stabile, eindeutige ID erhalten, die sich nie ändert.

#### Scenario: Groove mit Standardwerten anlegen
- **WHEN** der Nutzer einen neuen Groove anlegt, ohne die Länge anzugeben
- **THEN** existiert ein Pattern vom Typ Groove mit 4 Beats und einer eindeutigen ID
- **AND** alle Beats sind leer und in Sechzehnteln unterteilt

#### Scenario: Fill mit Standardwerten anlegen
- **WHEN** der Nutzer einen neuen Fill anlegt, ohne die Länge anzugeben
- **THEN** existiert ein Pattern vom Typ Fill mit 1 Beat

#### Scenario: Ungültige Länge
- **WHEN** der Nutzer ein Pattern mit der Länge 0 oder 17 anlegen will
- **THEN** wird das Pattern nicht angelegt und der Nutzer erhält einen Hinweis auf den erlaubten Bereich 1 bis 16

### Requirement: Pattern-Namen
Jedes Pattern MUST einen nicht leeren Namen haben. Ohne Angabe vergibt das System einen Namen aus Typ und laufender Nummer. Doppelte Namen MUST zulässig sein, da die Identität über die ID läuft.

#### Scenario: Automatischer Name
- **WHEN** der Nutzer den dritten Groove ohne Namen anlegt
- **THEN** heißt das Pattern „Groove 3“

#### Scenario: Leerer Name wird abgelehnt
- **WHEN** der Nutzer den Namen eines Patterns auf eine leere oder nur aus Leerzeichen bestehende Zeichenkette ändert
- **THEN** bleibt der bisherige Name erhalten

### Requirement: Länge eines Patterns ändern
Das System MUST das Ändern der Länge eines bestehenden Patterns innerhalb von 1 bis 16 Beats ermöglichen. Beim Verlängern werden leere Beats mit Sechzehntel-Unterteilung angehängt. Beim Kürzen werden Beats am Ende entfernt. Enthalten diese Schläge, MUST der Nutzer das vorher bestätigen.

#### Scenario: Verlängern
- **WHEN** der Nutzer einen Groove von 4 auf 8 Beats verlängert
- **THEN** bleiben die Beats 1 bis 4 unverändert und die Beats 5 bis 8 sind leer

#### Scenario: Kürzen mit Inhalt
- **WHEN** der Nutzer einen Groove von 4 auf 2 Beats kürzt und Beat 3 Schläge enthält
- **THEN** fragt das System vor dem Kürzen nach einer Bestätigung
- **AND** bei Ablehnung bleibt das Pattern unverändert

#### Scenario: Kürzen ohne Inhalt
- **WHEN** der Nutzer einen Groove von 4 auf 2 Beats kürzt und die Beats 3 und 4 leer sind
- **THEN** wird ohne Nachfrage gekürzt

### Requirement: Pattern duplizieren
Das System MUST das Duplizieren eines Patterns ermöglichen. Die Kopie MUST eine neue ID, den gleichen Typ, die gleiche Länge und den gleichen Inhalt erhalten und den Namen des Originals mit dem Zusatz „(Kopie)“ tragen.

#### Scenario: Groove duplizieren
- **WHEN** der Nutzer den Groove „Verse“ dupliziert
- **THEN** existiert zusätzlich ein Groove „Verse (Kopie)“ mit identischem Inhalt und eigener ID
- **AND** spätere Änderungen an der Kopie verändern das Original nicht

### Requirement: Pattern löschen
Das System MUST das Löschen eines Patterns nach Bestätigung durch den Nutzer ermöglichen.

#### Scenario: Löschen bestätigt
- **WHEN** der Nutzer ein Pattern löscht und die Nachfrage bestätigt
- **THEN** ist das Pattern nicht mehr in der Bibliothek

#### Scenario: Löschen abgebrochen
- **WHEN** der Nutzer ein Pattern löschen will und die Nachfrage ablehnt
- **THEN** bleibt das Pattern unverändert erhalten

### Requirement: Bibliotheksübersicht
Das System MUST alle Patterns in einer Übersicht anzeigen, getrennt nach Grooves und Fills, jeweils mit Name und Länge in Beats und innerhalb der Gruppe alphabetisch nach Name sortiert.

#### Scenario: Gruppierte Übersicht
- **WHEN** die Bibliothek die Grooves „Verse“ und „Chorus“ und den Fill „Tom-Run“ enthält
- **THEN** zeigt die Übersicht unter „Grooves“ zuerst „Chorus“, dann „Verse“, und unter „Fills“ „Tom-Run“, jeweils mit Länge

#### Scenario: Leere Bibliothek
- **WHEN** die Bibliothek keine Patterns enthält
- **THEN** zeigt die Übersicht einen Hinweis, wie man das erste Pattern anlegt
