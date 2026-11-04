# workbooks Specification

## Purpose

Workbooks sind benannte Sammlungen von Songs auf dem Server, die ihr Besitzer mit anderen teilt. Die Capability regelt Anlegen, Umbenennen, Löschen, Mitgliedschaft und die Darstellung als Karten.

## Requirements

### Requirement: Workbook anlegen
Ein angemeldeter Nutzer MUST ein Workbook mit Titel anlegen können. Ohne Titel MUST es „Neues Workbook“ heißen. Er MUST dessen Besitzer und einziges Mitglied sein. Ohne Anmeldung MUST es keine Workbooks geben.

#### Scenario: Workbook anlegen
- **GIVEN** der Nutzer ist als ich@example.com angemeldet
- **WHEN** er ein Workbook „Band“ anlegt
- **THEN** zeigt die Startseite eine Karte „Band“ mit dem Mitglied ich@example.com und ohne Songs

#### Scenario: Ohne Titel
- **WHEN** der angemeldete Nutzer ein Workbook anlegt, ohne einen Titel einzugeben
- **THEN** heißt es „Neues Workbook“

#### Scenario: Abgemeldet
- **WHEN** der Nutzer nicht angemeldet ist
- **THEN** zeigt die Startseite nur „Meine Songs“ und bietet kein Anlegen eines Workbooks an

### Requirement: Workbooks auf der Startseite
Die Startseite MUST für jedes Workbook, in dem der angemeldete Nutzer Mitglied ist, eine Karte mit Titel, Mitgliedern und den Songs des Workbooks zeigen, alphabetisch nach Titel, gefolgt von der Karte „Meine Songs“ mit den Songs, die zu keinem Workbook gehören. Ein Workbook MUST keine eigene Ansicht und keine eigene Adresse haben.

#### Scenario: Zwei Workbooks
- **GIVEN** der Nutzer ist Mitglied von „Proberaum“ und „Band“ und hat den lokalen Song „Skizze“
- **WHEN** er die Startseite öffnet
- **THEN** zeigt sie die Karten „Band“, „Proberaum“ und „Meine Songs“ in dieser Reihenfolge
- **AND** „Skizze“ steht nur in „Meine Songs“

### Requirement: Workbook umbenennen
Der Besitzer MUST den Titel eines Workbooks ändern können. Ein leerer oder nur aus Leerzeichen bestehender Titel MUST abgelehnt werden. Der neue Titel MUST bei allen Mitgliedern erscheinen.

#### Scenario: Umbenennen
- **WHEN** der Besitzer „Band“ in „Band 2026“ umbenennt
- **THEN** zeigen die Karten aller Mitglieder „Band 2026“

#### Scenario: Leerer Titel
- **WHEN** der Besitzer den Titel auf eine leere Zeichenkette ändert
- **THEN** bleibt der bisherige Titel erhalten

### Requirement: Workbook löschen
Der Besitzer MUST ein Workbook ohne Songs nach Bestätigung löschen können. Ein Workbook mit Songs MUST sich nicht löschen lassen.

#### Scenario: Leeres Workbook löschen
- **WHEN** der Besitzer das leere Workbook „Band“ löscht und die Nachfrage bestätigt
- **THEN** verschwindet die Karte „Band“ bei allen Mitgliedern

#### Scenario: Workbook mit Songs
- **WHEN** das Workbook „Band“ einen Song enthält
- **THEN** bietet die App für „Band“ kein Löschen an

### Requirement: Mitglied einladen
Der Besitzer MUST eine Mail-Adresse zum Workbook einladen können. Die Person MUST sofort Mitglied sein, auch ohne bestehendes Konto, und eine Mail mit Titel des Workbooks und Adresse des Besitzers erhalten. Ungültige Adressen und vorhandene Mitglieder MUST die App mit einer Meldung ablehnen.

#### Scenario: Einladen
- **WHEN** der Besitzer anna@example.com zu „Band“ einlädt
- **THEN** ist anna@example.com in der Karte „Band“ als Mitglied aufgeführt
- **AND** an anna@example.com geht eine Mail, die „Band“ und die Adresse des Besitzers nennt

#### Scenario: Erste Anmeldung nach der Einladung
- **GIVEN** anna@example.com wurde zu „Band“ eingeladen und hatte noch kein Konto
- **WHEN** sie sich zum ersten Mal anmeldet
- **THEN** zeigt ihre Startseite die Karte „Band“ mit allen Songs des Workbooks

#### Scenario: Bereits Mitglied
- **WHEN** der Besitzer eine Adresse einlädt, die schon Mitglied ist
- **THEN** meldet die App, dass die Person bereits Mitglied ist, und es geht keine Mail hinaus

### Requirement: Begrenzung der Einladungen
Je Besitzer MUST der Server höchstens 20 Einladungsmails pro Stunde versenden. Eine Einladung über dieser Grenze MUST abgelehnt werden, ohne Mitgliedschaft und ohne Mail.

#### Scenario: Einundzwanzigste Einladung
- **WHEN** ein Besitzer innerhalb einer Stunde die einundzwanzigste Adresse einlädt
- **THEN** wird die Person nicht Mitglied, es geht keine Mail hinaus und die App meldet, dass später erneut eingeladen werden kann

### Requirement: Mitglied entfernen und austreten
Der Besitzer MUST jedes andere Mitglied entfernen können. Ein Mitglied, das nicht Besitzer ist, MUST das Workbook verlassen können. Der Besitzer MUST sein Workbook nicht verlassen können. Beides MUST nach Bestätigung geschehen.

#### Scenario: Entfernen
- **WHEN** der Besitzer anna@example.com aus „Band“ entfernt
- **THEN** ist sie in der Karte „Band“ nicht mehr aufgeführt

#### Scenario: Verlassen
- **WHEN** anna@example.com „Band“ verlässt
- **THEN** zeigt ihre Startseite keine Karte „Band“ mehr

#### Scenario: Besitzer
- **WHEN** der Besitzer die Mitglieder von „Band“ öffnet
- **THEN** bietet die App ihm kein Verlassen an

### Requirement: Popover schließen
Die Popover „Mitglieder“ und „Zu Workbook …“ MUST sich bei einem Klick außerhalb und mit Escape schließen. Eine Nachfrage MUST über dem Popover liegen; solange sie offen ist, MUST das Popover offen bleiben.

#### Scenario: Klick außerhalb
- **WHEN** das Popover „Mitglieder“ von „Band“ offen ist und der Nutzer außerhalb klickt
- **THEN** schließt es sich

#### Scenario: Nachfrage aus dem Popover
- **WHEN** der Besitzer im Popover „Entfernen“ wählt und die Nachfrage „Abbrechen“ anklickt
- **THEN** ist das Popover weiterhin offen

### Requirement: Songs nach dem Austritt
Wer ein Workbook verlässt oder daraus entfernt wird, MUST dessen Songs als eigene Songs in „Meine Songs“ behalten, einschließlich Änderungen, die noch nicht übertragen waren. Diese Songs MUST neue IDs haben, „<Titel> (aus <Workbook>)“ heißen und vom Workbook unabhängig sein. Die App MUST darauf hinweisen und die Songs dabei nennen.

#### Scenario: Entfernt während offline
- **GIVEN** anna@example.com ändert offline den Song „Intro“ aus „Band“
- **AND** währenddessen entfernt der Besitzer sie aus „Band“
- **WHEN** ihre App wieder den Server erreicht
- **THEN** steht „Intro (aus Band)“ mit ihrer Änderung in ihren „Meine Songs“
- **AND** die App meldet, dass sie nicht mehr Mitglied von „Band“ ist und „Intro (aus Band)“ unter „Meine Songs“ liegt
- **AND** ihre Änderung erreicht „Band“ nicht

#### Scenario: Weiterarbeiten nach dem Austritt
- **WHEN** anna@example.com „Intro (aus Band)“ nach dem Austritt ändert
- **THEN** bleibt „Intro“ in „Band“ unverändert

### Requirement: Zugriff nur für Mitglieder
Der Server MUST Workbooks, ihre Mitglieder und Songs nur Mitgliedern zeigen und nur von Mitgliedern ändern lassen. Für Nichtmitglieder MUST ein Workbook wie nicht vorhanden behandelt werden.

#### Scenario: Fremdes Workbook
- **WHEN** ein angemeldeter Nutzer, der nicht Mitglied von „Band“ ist, Songs von „Band“ abruft oder ändert
- **THEN** antwortet der Server wie bei einem nicht vorhandenen Workbook und ändert nichts
