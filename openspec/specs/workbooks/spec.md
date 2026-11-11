# workbooks Specification

## Purpose

Workbooks sind benannte Sammlungen von Songs auf dem Server, die ihr Besitzer mit anderen teilt. Die Capability regelt Anlegen, Umbenennen, Löschen, Mitgliedschaft und die Darstellung als Karten.

## Requirements

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
Angemeldet MUST unter „Meine Songs“ der Bereich „Workbooks“ stehen: eine Seitenleiste mit einem Eintrag je Workbook des Nutzers, alphabetisch, mit Titel, Anzahl der Songs und der Mitglieder; daneben das gewählte Workbook mit Titel, Mitgliedern und den Kacheln seiner Songs. Der eigene Bestand (`account-songs`) MUST weder in der Seitenleiste noch als Ziel von „Zu Workbook …“ oder beim Ziehen aus „Meine Songs“ erscheinen. Ein Workbook MUST keine eigene Ansicht und keine eigene Adresse haben.

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

### Requirement: Erklärung der Workbooks
Neben der Überschrift „Workbooks“ MUST ein Knopf mit dem Symbol eines Fragezeichens im Kreis und der Beschriftung „Was sind Workbooks?“ für Screenreader stehen, solange der Bereich sichtbar ist. Er MUST ein Popover öffnen und schließen, das in höchstens drei Sätzen erklärt, wozu Workbooks dienen. Das Popover MUST sich bei einem Klick außerhalb und mit Escape schließen. Der Bereich MUST ohne Workbook keinen Hinweistext zeigen.

#### Scenario: Erklärung öffnen
- **GIVEN** der Nutzer ist angemeldet
- **WHEN** er neben „Workbooks“ auf den Knopf „Was sind Workbooks?“ klickt
- **THEN** zeigt die App ein Popover mit der Erklärung der Workbooks

#### Scenario: Erklärung schließen
- **GIVEN** das Popover mit der Erklärung ist offen
- **WHEN** der Nutzer Escape drückt, außerhalb klickt oder erneut auf den Knopf „Was sind Workbooks?“ klickt
- **THEN** ist das Popover geschlossen

#### Scenario: Ohne Workbook
- **GIVEN** der Nutzer ist angemeldet und hat kein Workbook
- **WHEN** er die Startseite öffnet
- **THEN** zeigt der Bereich „Workbooks“ die Überschrift mit dem Knopf „Was sind Workbooks?“ und „+ Workbook“, aber keinen Hinweistext

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
Der Besitzer MUST eine Mail-Adresse zum Workbook einladen können. Die Person MUST sofort Mitglied sein, auch ohne bestehendes Konto, und eine Mail mit Titel des Workbooks und Adresse des Besitzers erhalten; hat der Besitzer ein Profil, MUST die Mail auch seinen Namen nennen. Ungültige Adressen und vorhandene Mitglieder MUST die App mit einer Meldung ablehnen.

#### Scenario: Einladen
- **WHEN** der Besitzer anna@example.com zu „Band“ einlädt
- **THEN** ist anna@example.com unter den Mitgliedern von „Band“ aufgeführt
- **AND** an anna@example.com geht eine Mail, die „Band“ und die Adresse des Besitzers nennt

#### Scenario: Name des Besitzers in der Mail
- **GIVEN** der Besitzer ich@example.com heißt „Artjom“
- **WHEN** er anna@example.com zu „Band“ einlädt
- **THEN** lautet der Betreff der Mail „Artjom (ich@example.com) hat dich zu „Band“ eingeladen“

#### Scenario: Erste Anmeldung nach der Einladung
- **GIVEN** anna@example.com wurde zu „Band“ eingeladen und hatte noch kein Konto
- **WHEN** sie sich zum ersten Mal anmeldet
- **THEN** zeigt ihre Seitenleiste „Band“, und gewählt zeigt es alle Songs des Workbooks

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
- **THEN** ist sie unter den Mitgliedern von „Band“ nicht mehr aufgeführt

#### Scenario: Verlassen
- **WHEN** anna@example.com „Band“ verlässt
- **THEN** zeigt ihre Seitenleiste „Band“ nicht mehr

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

### Requirement: Mitglieder-Popover
Das Popover „Mitglieder“ MUST einen Abschnitt „Mitglieder“ mit der Liste der Mitglieder zeigen und, nur für den Besitzer, darunter einen Abschnitt „Hinzufügen“ mit dem Formular zum Einladen.

#### Scenario: Besitzer öffnet die Mitglieder
- **WHEN** der Besitzer die Mitglieder von „Band“ öffnet
- **THEN** zeigt das Popover die Abschnitte „Mitglieder“ und „Hinzufügen“, das Formular steht unter „Hinzufügen“

#### Scenario: Mitglied öffnet die Mitglieder
- **WHEN** ein Mitglied, das nicht Besitzer ist, die Mitglieder von „Band“ öffnet
- **THEN** zeigt das Popover nur den Abschnitt „Mitglieder“

### Requirement: Einladen-Formular steht fest
Im Formular „Hinzufügen“ MUST das Feld „Mail-Adresse“ und der Knopf „Einladen“ gleich hoch auf einer Linie stehen. Der Knopf MUST seine Lage behalten, solange das Popover offen ist und sich sein Inhalt nicht ändert.

#### Scenario: Feld und Knopf auf einer Linie
- **WHEN** der Besitzer die Mitglieder von „Band“ öffnet
- **THEN** haben das Feld „Mail-Adresse“ und der Knopf „Einladen“ dieselbe Ober- und Unterkante

#### Scenario: Knopf bleibt stehen
- **GIVEN** der Besitzer hat die Mitglieder von „Band“ geöffnet
- **WHEN** drei Sekunden vergehen, ohne dass er etwas eingibt
- **THEN** steht „Einladen“ an derselben Stelle wie direkt nach dem Öffnen

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

### Requirement: Mitglieder mit Profil
Die Kürzel im Kopf eines Workbooks MUST für Mitglieder mit Profil ihr Kürzel in ihrer Farbe zeigen, die Mitgliederliste ihren Namen ohne Adresse. Mitglieder ohne Profil MUST mit ihrer Adresse, grau und mit dem Hinweis „noch nicht angemeldet“ erscheinen. Der Server MUST die Profile nur Mitgliedern gemeinsamer Workbooks zeigen.

#### Scenario: Kürzel in Farbe
- **GIVEN** anna@example.com heißt „Anna Berg“ mit dem Kürzel „AB“ und der Farbe Grün
- **WHEN** ein Mitglied „Band“ wählt
- **THEN** zeigt der Kopf von „Band“ für sie „AB“ in Grün

#### Scenario: Mitgliederliste
- **GIVEN** anna@example.com heißt „Anna Berg“
- **WHEN** ein Mitglied die Mitglieder von „Band“ öffnet
- **THEN** steht dort „Anna Berg“ und nicht „anna@example.com“

#### Scenario: Noch nicht angemeldet
- **GIVEN** ben@example.com wurde zu „Band“ eingeladen und hat sich nie angemeldet
- **WHEN** ein Mitglied die Mitglieder von „Band“ öffnet
- **THEN** steht dort „ben@example.com“ mit „noch nicht angemeldet“

### Requirement: Kürzel beim Überfahren
Beim Überfahren MUST jedes Kürzel im Kopf eines Workbooks seine Fläche behalten, mit und ohne Profil.

#### Scenario: Überfahren der Kürzel
- **GIVEN** „Band“ hat die Mitglieder anna@example.com mit Profil und ben@example.com ohne Profil
- **WHEN** der Nutzer die Kürzel im Kopf von „Band“ überfährt
- **THEN** behalten das farbige Kürzel von Anna und das graue von Ben ihre Fläche

### Requirement: Geänderte Profile erscheinen bei allen
Ändert ein Nutzer sein Profil, MUST die Änderung bei allen anderen Mitgliedern seiner Workbooks, die die App geöffnet haben und den Server erreichen, binnen 5 Sekunden erscheinen, ohne Neuladen.

#### Scenario: Neuer Name
- **GIVEN** anna@example.com und ich@example.com haben „Band“ geöffnet
- **WHEN** anna@example.com sich in „Anna B.“ umbenennt
- **THEN** zeigt die App von ich@example.com binnen 5 Sekunden „Anna B.“ unter den Mitgliedern von „Band“
