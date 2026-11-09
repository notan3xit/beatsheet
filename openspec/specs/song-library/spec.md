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
Oben auf der Startseite MUST „Meine Songs“ die lokalen und die zum Account gehörenden Songs zeigen (`account-songs`), darunter angemeldet die Workbooks (`workbooks`). Songs MUST als umbrechende Kacheln in der Reihenfolge nach `song-order` erscheinen, jede mit Motiv (`song-motif`), Titel, Taktzahl, Tempo und letzter Änderung (`song-activity`). Ein leeres „Meine Songs“ MUST zeigen, wie man den ersten Song anlegt. Die Auswahl einer Kachel MUST die Doppelseite des Songs öffnen.

#### Scenario: Sortierte Liste
- **WHEN** die Songs „Uprising“ (32 Takte, Tempo 128) und „Hysteria“ (0 Takte, Tempo 120) in „Meine Songs“ existieren
- **THEN** zeigt „Meine Songs“ zuerst die Kachel „Hysteria“ mit „0 Takte“ und „♩ = 120“, dann „Uprising“ mit „32 Takte“ und „♩ = 128“

#### Scenario: Leere Liste
- **WHEN** keine Songs existieren
- **THEN** zeigt „Meine Songs“ einen Hinweis zum Anlegen des ersten Songs

#### Scenario: Song öffnen
- **WHEN** der Nutzer die Kachel „Hysteria“ auswählt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

#### Scenario: Song per Tastatur öffnen
- **WHEN** der Nutzer die Kachel „Hysteria“ mit der Tastatur fokussiert und Enter drückt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

#### Scenario: Neuer Song landet in „Meine Songs“
- **WHEN** der Nutzer in „Meine Songs“ „+ Song“ wählt und danach zur Startseite zurückkehrt
- **THEN** steht „Neuer Song“ in „Meine Songs“

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

### Requirement: Platz beim Bearbeiten der Tempoangabe
Beim Bearbeiten der Tempoangabe MUST „♩ =“ stehen bleiben, und das Feld MUST genau den Platz der Zahl einnehmen, sodass sich nichts daneben verschiebt.

#### Scenario: Platz beim Bearbeiten
- **WHEN** der Nutzer auf „♩ = 120“ klickt
- **THEN** steht weiterhin „♩ =“ da, nur die Zahl ist ein Eingabefeld ohne Pfeil-Knöpfe
- **AND** alles neben der Angabe bleibt an seiner Stelle

### Requirement: Song über die Kachel „+ Song“ anlegen
„Meine Songs“ MUST als letzte Kachel „+ Song“ zeigen. Sie MUST einen Song „Neuer Song“ in „Meine Songs“ anlegen und seine Doppelseite öffnen, wo er sich umbenennen lässt.

#### Scenario: Doppelseite des neuen Songs
- **WHEN** der Nutzer in „Meine Songs“ „+ Song“ wählt
- **THEN** zeigt die App die Doppelseite von „Neuer Song“

### Requirement: Song kopieren
Jede Song-Kachel MUST ein Symbol „Kopieren“ tragen, in „Meine Songs“ wie in Workbooks, auch ohne Anmeldung. Nach bestätigter Rückfrage MUST in „Meine Songs“ ein Song „<Titel> (Kopie)“ mit neuer ID entstehen, mit Tempo, Standard-Takt, Patterns und Struktur des Originals. Die Kopie MUST ohne den Verlauf des Originals beginnen und von ihm unabhängig sein. Das Original MUST unverändert bleiben. Abbrechen und Escape MUST nichts ändern.

#### Scenario: Eigenen Song kopieren
- **GIVEN** „Skizze“ liegt in „Meine Songs“
- **WHEN** der Nutzer an der Kachel „Skizze“ „Kopieren“ wählt und die Rückfrage bestätigt
- **THEN** stehen „Skizze“ und „Skizze (Kopie)“ in „Meine Songs“, mit denselben Takten und Patterns

#### Scenario: Song aus einem Workbook kopieren
- **GIVEN** „Uprising“ liegt in „Band“
- **WHEN** der Nutzer an der Kachel „Uprising“ „Kopieren“ wählt und die Rückfrage bestätigt
- **THEN** steht „Uprising (Kopie)“ in „Meine Songs“
- **AND** „Uprising“ steht unverändert in „Band“, und die anderen Mitglieder von „Band“ sehen die Kopie nicht

#### Scenario: Kopie ist unabhängig
- **GIVEN** der Nutzer hat „Uprising“ aus „Band“ kopiert
- **WHEN** er das Tempo von „Uprising (Kopie)“ ändert
- **THEN** behält „Uprising“ in „Band“ sein Tempo

#### Scenario: Kopie ohne Verlauf
- **GIVEN** „Uprising“ hat Bearbeitungen mehrerer Mitglieder von „Band“
- **WHEN** der Nutzer den Verlauf von „Uprising (Kopie)“ öffnet
- **THEN** enthält er keine Bearbeitung aus „Uprising“

#### Scenario: Kopieren abgebrochen
- **WHEN** der Nutzer an der Kachel „Skizze“ „Kopieren“ wählt und die Rückfrage abbricht oder Escape drückt
- **THEN** bleibt „Meine Songs“ unverändert

#### Scenario: Ohne Anmeldung
- **GIVEN** der Nutzer ist nicht angemeldet
- **WHEN** er „Skizze“ kopiert
- **THEN** steht „Skizze (Kopie)“ in „Meine Songs“, und der Server kennt den Song nicht

### Requirement: Rückfrage beim Kopieren aus einem Workbook
Für einen Song aus einem Workbook MUST die Rückfrage „„<Titel>“ nach „Meine Songs“ kopieren?“ lauten und nennen: Die Kopie ist zunächst privat und lässt sich durch Aufnahme in ein Workbook wieder teilen; der Song im Workbook bleibt unverändert; die Kopie beginnt ohne Verlauf. Die Knöpfe MUST „Abbrechen“ und „Kopieren“ heißen.

#### Scenario: Rückfrage für einen Workbook-Song
- **WHEN** der Nutzer an der Kachel „Uprising“ in „Band“ „Kopieren“ wählt
- **THEN** fragt die App „„Uprising“ nach „Meine Songs“ kopieren?“ mit den Knöpfen „Abbrechen“ und „Kopieren“

### Requirement: Rückfrage beim Kopieren eines eigenen Songs
Für einen Song aus „Meine Songs“ MUST die Rückfrage „„<Titel>“ kopieren?“ lauten und nennen: Die Kopie liegt in „Meine Songs“; das Original bleibt unverändert; die Kopie beginnt ohne Verlauf. Die Knöpfe MUST „Abbrechen“ und „Kopieren“ heißen.

#### Scenario: Rückfrage für einen eigenen Song
- **WHEN** der Nutzer an der Kachel „Skizze“ in „Meine Songs“ „Kopieren“ wählt
- **THEN** fragt die App „„Skizze“ kopieren?“ mit den Knöpfen „Abbrechen“ und „Kopieren“
