# Spec Delta

## MODIFIED Requirements

### Requirement: Workbook anlegen
Ein angemeldeter Nutzer MUST über den Eintrag „+ Workbook“ am Ende der Seitenleiste ein Workbook anlegen können. Es MUST „Neues Workbook“ heißen und danach gewählt sein, sodass sein Besitzer es gleich umbenennen kann. Er MUST dessen Besitzer und einziges Mitglied sein. Ohne Anmeldung MUST es keine Workbooks geben.

#### Scenario: Workbook anlegen
- **GIVEN** der Nutzer ist als ich@example.com angemeldet
- **WHEN** er „+ Workbook“ wählt
- **THEN** zeigt die Seitenleiste „Neues Workbook“ mit 0 Songs und 1 Mitglied
- **AND** „Neues Workbook“ ist gewählt und sein Titel lässt sich ändern

#### Scenario: Ohne Titel
- **WHEN** der angemeldete Nutzer ein Workbook anlegt
- **THEN** heißt es „Neues Workbook“

#### Scenario: Abgemeldet
- **WHEN** der Nutzer nicht angemeldet ist
- **THEN** zeigt die Startseite nur „Meine Songs“, ohne den Bereich „Workbooks“

### Requirement: Workbooks auf der Startseite
Angemeldet MUST die Startseite unter „Meine Songs“ den Bereich „Workbooks“ zeigen: eine Seitenleiste mit je einem Eintrag für jedes Workbook, in dem der Nutzer Mitglied ist, alphabetisch nach Titel, mit Titel, Anzahl der Songs und Anzahl der Mitglieder. Daneben MUST das gewählte Workbook mit Titel, Mitgliedern und den Kacheln seiner Songs stehen. Der eigene Bestand des Accounts (siehe `account-songs`) MUST nicht als Workbook erscheinen, weder in der Seitenleiste noch als Ziel von „Zu Workbook …“ oder beim Ziehen. Ein Workbook MUST keine eigene Ansicht und keine eigene Adresse haben.

#### Scenario: Zwei Workbooks
- **GIVEN** der Nutzer ist Mitglied von „Proberaum“ und „Band“ und hat den eigenen Song „Skizze“
- **WHEN** er die Startseite öffnet
- **THEN** zeigt die Seitenleiste „Band“ und „Proberaum“ in dieser Reihenfolge
- **AND** „Skizze“ steht nur in „Meine Songs“

#### Scenario: Angaben in der Seitenleiste
- **GIVEN** „Band“ hat 3 Songs und 2 Mitglieder
- **WHEN** der Nutzer die Startseite öffnet
- **THEN** zeigt der Eintrag „Band“ „3 Songs“ und „2 Mitglieder“

#### Scenario: Ohne Workbooks
- **GIVEN** der Nutzer ist angemeldet und in keinem Workbook Mitglied
- **WHEN** er die Startseite öffnet
- **THEN** enthält die Seitenleiste nur „+ Workbook“
- **AND** die App bietet „Zu Workbook …“ nicht an

### Requirement: Workbook umbenennen
Der Besitzer MUST den Titel eines Workbooks ändern können. Ein leerer oder nur aus Leerzeichen bestehender Titel MUST abgelehnt werden. Der neue Titel MUST bei allen Mitgliedern erscheinen.

#### Scenario: Umbenennen
- **WHEN** der Besitzer „Band“ in „Band 2026“ umbenennt
- **THEN** zeigen die Seitenleisten aller Mitglieder „Band 2026“

#### Scenario: Leerer Titel
- **WHEN** der Besitzer den Titel auf eine leere Zeichenkette ändert
- **THEN** bleibt der bisherige Titel erhalten

### Requirement: Workbook löschen
Der Besitzer MUST ein Workbook ohne Songs nach Bestätigung löschen können. Ein Workbook mit Songs MUST sich nicht löschen lassen.

#### Scenario: Leeres Workbook löschen
- **WHEN** der Besitzer das leere Workbook „Band“ löscht und die Nachfrage bestätigt
- **THEN** verschwindet „Band“ aus den Seitenleisten aller Mitglieder

#### Scenario: Workbook mit Songs
- **WHEN** das Workbook „Band“ einen Song enthält
- **THEN** bietet die App für „Band“ kein Löschen an

### Requirement: Mitglied einladen
Der Besitzer MUST eine Mail-Adresse zum Workbook einladen können. Die Person MUST sofort Mitglied sein, auch ohne bestehendes Konto, und eine Mail mit Titel des Workbooks und Adresse des Besitzers erhalten. Ungültige Adressen und vorhandene Mitglieder MUST die App mit einer Meldung ablehnen.

#### Scenario: Einladen
- **WHEN** der Besitzer anna@example.com zu „Band“ einlädt
- **THEN** ist anna@example.com unter den Mitgliedern von „Band“ aufgeführt
- **AND** an anna@example.com geht eine Mail, die „Band“ und die Adresse des Besitzers nennt

#### Scenario: Erste Anmeldung nach der Einladung
- **GIVEN** anna@example.com wurde zu „Band“ eingeladen und hatte noch kein Konto
- **WHEN** sie sich zum ersten Mal anmeldet
- **THEN** zeigt ihre Seitenleiste „Band“, und gewählt zeigt es alle Songs des Workbooks

#### Scenario: Bereits Mitglied
- **WHEN** der Besitzer eine Adresse einlädt, die schon Mitglied ist
- **THEN** meldet die App, dass die Person bereits Mitglied ist, und es geht keine Mail hinaus

### Requirement: Mitglied entfernen und austreten
Der Besitzer MUST jedes andere Mitglied entfernen können. Ein Mitglied, das nicht Besitzer ist, MUST das Workbook verlassen können. Der Besitzer MUST sein Workbook nicht verlassen können. Beides MUST nach Bestätigung geschehen.

#### Scenario: Entfernen
- **WHEN** der Besitzer anna@example.com aus „Band“ entfernt
- **THEN** ist sie unter den Mitgliedern von „Band“ nicht mehr aufgeführt

#### Scenario: Verlassen
- **WHEN** anna@example.com „Band“ verlässt
- **THEN** zeigt ihre Seitenleiste „Band“ nicht mehr

#### Scenario: Besitzer
- **WHEN** der Besitzer die Mitglieder von „Band“ öffnet
- **THEN** bietet die App ihm kein Verlassen an

## ADDED Requirements

### Requirement: Mitglieder-Popover
Das Popover „Mitglieder“ MUST einen Abschnitt „Mitglieder“ mit der Liste der Mitglieder zeigen und, nur für den Besitzer, darunter einen Abschnitt „Hinzufügen“ mit dem Formular zum Einladen.

#### Scenario: Besitzer öffnet die Mitglieder
- **WHEN** der Besitzer die Mitglieder von „Band“ öffnet
- **THEN** zeigt das Popover die Abschnitte „Mitglieder“ und „Hinzufügen“, das Formular steht unter „Hinzufügen“

#### Scenario: Mitglied öffnet die Mitglieder
- **WHEN** ein Mitglied, das nicht Besitzer ist, die Mitglieder von „Band“ öffnet
- **THEN** zeigt das Popover nur den Abschnitt „Mitglieder“

### Requirement: Workbook wählen
Ein Klick auf einen Eintrag der Seitenleiste MUST dieses Workbook wählen; der gewählte Eintrag MUST hervorgehoben sein. Ohne frühere Wahl MUST das erste Workbook gewählt sein. Die Wahl MUST erhalten bleiben, wenn der Nutzer einen Song öffnet und zur Startseite zurückkehrt. Verschwindet das gewählte Workbook, MUST das erste verbliebene gewählt sein.

#### Scenario: Wählen
- **WHEN** der Nutzer in der Seitenleiste „Proberaum“ wählt
- **THEN** zeigt die Startseite die Songs von „Proberaum“ und der Eintrag „Proberaum“ ist hervorgehoben

#### Scenario: Vorgabe
- **GIVEN** der Nutzer ist Mitglied von „Band“ und „Proberaum“
- **WHEN** er die Startseite zum ersten Mal öffnet
- **THEN** ist „Band“ gewählt

#### Scenario: Rückkehr von einem Song
- **GIVEN** „Proberaum“ ist gewählt
- **WHEN** der Nutzer dort einen Song öffnet und über den Pfad „Songs“ zurückkehrt
- **THEN** ist weiterhin „Proberaum“ gewählt

#### Scenario: Gewähltes Workbook verschwindet
- **GIVEN** „Proberaum“ ist gewählt
- **WHEN** der Nutzer „Proberaum“ verlässt
- **THEN** ist „Band“ gewählt
