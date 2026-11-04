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
Das System MUST die Songs in Karten auflisten: je Workbook eine Karte (siehe `workbooks`) und eine Karte „Meine Songs“ mit den lokalen und den zum Account gehörenden Songs (siehe `account-songs`). Jede Karte MUST ihre Songs alphabetisch nach Titel in einer Tabelle mit den Spalten Titel, Takte, Grooves und Fills zeigen, mit einer Kopfzeile. Ist „Meine Songs“ leer, MUST die Karte einen Hinweis zeigen, wie man den ersten Song anlegt. Die Auswahl eines Songs MUST seine Doppelseite öffnen.

#### Scenario: Sortierte Liste
- **WHEN** die Songs „Uprising“ (32 Takte, 2 Grooves, 1 Fill) und „Hysteria“ (0 Takte, keine Patterns) in „Meine Songs“ existieren
- **THEN** zeigt die Tabelle von „Meine Songs“ zuerst „Hysteria“ mit 0, 0, 0, dann „Uprising“ mit 32, 2, 1
- **AND** die Kopfzeile lautet Titel, Takte, Grooves, Fills

#### Scenario: Leere Liste
- **WHEN** keine Songs existieren
- **THEN** zeigt „Meine Songs“ einen Hinweis zum Anlegen des ersten Songs

#### Scenario: Song öffnen
- **WHEN** der Nutzer in einer Karte „Hysteria“ auswählt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

#### Scenario: Neuer Song landet in „Meine Songs“
- **WHEN** der Nutzer über das Eingabefeld der Song-Liste den Song „Skizze“ anlegt
- **THEN** steht „Skizze“ in „Meine Songs“

### Requirement: Song-Tempo
Jeder Song MUST ein Tempo in BPM haben, eine ganze Zahl von 30 bis 300. Ein neuer Song und ein Song, für den kein Tempo gespeichert ist, MUST das Tempo 120 haben. Ein Tempo außerhalb des Bereichs oder keine ganze Zahl MUST abgelehnt werden; das bisherige Tempo bleibt dann erhalten. Eine Änderung des Tempos MUST die Revision des Songs um 1 erhöhen.

#### Scenario: Tempo eines neuen Songs
- **WHEN** der Nutzer einen Song anlegt
- **THEN** hat der Song das Tempo 120

#### Scenario: Tempo ändern
- **WHEN** der Nutzer das Tempo eines Songs mit Revision 4 von 120 auf 140 ändert
- **THEN** hat der Song das Tempo 140 und Revision 5

#### Scenario: Tempo außerhalb des Bereichs
- **WHEN** der Nutzer das Tempo auf 301 oder auf 29 setzt
- **THEN** bleibt das bisherige Tempo erhalten und die Revision des Songs unverändert

#### Scenario: Gleiches Tempo
- **WHEN** der Nutzer das Tempo auf den Wert setzt, den der Song bereits hat
- **THEN** bleibt die Revision des Songs unverändert

### Requirement: Tempo auf der Doppelseite
Die Doppelseite MUST im Kopf neben dem Songtitel das Tempo des Songs als Tempoangabe „♩ = <BPM>“ zeigen. Ein Klick auf die Angabe MUST sie in ein Zahlenfeld mit dem aktuellen Tempo verwandeln. Enter oder Verlassen des Felds MUST das Tempo übernehmen, Escape MUST die Eingabe verwerfen. Danach MUST wieder die Tempoangabe erscheinen. Ein abgelehntes Tempo MUST das bisherige stehen lassen.

#### Scenario: Tempoangabe
- **WHEN** der Nutzer die Doppelseite eines Songs mit Tempo 120 öffnet
- **THEN** steht neben dem Songtitel „♩ = 120“

#### Scenario: Tempo auf der Doppelseite ändern
- **WHEN** der Nutzer auf „♩ = 120“ klickt, 96 eingibt und Enter drückt
- **THEN** steht neben dem Songtitel „♩ = 96“ und der Song hat das Tempo 96
- **AND** der Pattern-Editor jedes Patterns des Songs zeigt das Song-Tempo 96

#### Scenario: Eingabe verwerfen
- **WHEN** der Nutzer auf „♩ = 120“ klickt, 96 eingibt und Escape drückt
- **THEN** steht weiterhin „♩ = 120“ und der Song ist unverändert

#### Scenario: Ungültiges Tempo auf der Doppelseite
- **WHEN** der Nutzer auf „♩ = 120“ klickt, 0 eingibt und das Feld verlässt
- **THEN** steht weiterhin „♩ = 120“ und der Song ist unverändert
