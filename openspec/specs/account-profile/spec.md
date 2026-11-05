# account-profile Specification

## Purpose

Gibt jedem Account einen Namen, ein Kürzel und eine Farbe, unter denen andere Mitglieder gemeinsamer Workbooks ihn erkennen. Regelt, wann das Profil angelegt werden muss und wie es sich ändern lässt.

## Requirements

### Requirement: Profil anlegen
Ist ein Nutzer angemeldet und hat sein Account noch kein Profil, MUST die App einen Dialog „Profil“ mit Name, Kürzel und Farbe zeigen, bevor er die App nutzen kann. Der Dialog MUST sich nur mit „Speichern“ oder „Abmelden“ schließen lassen, nicht mit Escape oder einem Klick daneben. Er MUST bei jedem Start erscheinen, bis ein Profil gespeichert ist, auch auf anderen Geräten und für bereits bestehende Accounts.

#### Scenario: Erste Anmeldung
- **WHEN** sich ich@example.com zum ersten Mal anmeldet
- **THEN** zeigt die App den Dialog „Profil“
- **AND** Escape und ein Klick daneben lassen ihn offen

#### Scenario: Speichern
- **GIVEN** der Dialog „Profil“ ist offen
- **WHEN** der Nutzer „Speichern“ wählt
- **THEN** schließt sich der Dialog, und beim nächsten Start erscheint er nicht mehr

#### Scenario: Abmelden statt Speichern
- **GIVEN** der Dialog „Profil“ ist offen
- **WHEN** der Nutzer „Abmelden“ wählt
- **THEN** ist er abgemeldet, und sein Account hat weiter kein Profil

#### Scenario: Neuladen ohne Profil
- **GIVEN** der Nutzer hat den Dialog nicht gespeichert
- **WHEN** er die App neu lädt
- **THEN** zeigt die App den Dialog „Profil“ erneut

#### Scenario: Server nicht erreichbar
- **WHEN** die App startet und der Server nicht erreichbar ist
- **THEN** zeigt sie keinen Dialog „Profil“

### Requirement: Vorbelegung des Profils
Ohne gespeichertes Profil MUST der Dialog den Namen aus dem Teil der Adresse vor dem @ vorbelegen, mit Leerzeichen statt `.`, `_` und `-` und großen Anfangsbuchstaben. Die Farbe MUST aus der Adresse abgeleitet sein, für dieselbe Adresse immer dieselbe.

#### Scenario: Name aus der Adresse
- **WHEN** sich artjom.weyand@example.com zum ersten Mal anmeldet
- **THEN** steht im Dialog der Name „Artjom Weyand“

#### Scenario: Gleiche Farbe für dieselbe Adresse
- **WHEN** sich ich@example.com auf zwei Geräten zum ersten Mal anmeldet
- **THEN** ist auf beiden dieselbe Farbe vorgewählt

### Requirement: Vorbelegung des Kürzels
Ohne gespeichertes Profil MUST der Dialog das Kürzel zusammen mit dem Namen vorbelegen: die Anfangsbuchstaben der ersten beiden Wörter des vorbelegten Namens, bei einem Wort seine ersten beiden Buchstaben, groß geschrieben. Ändert der Nutzer den Namen, MUST das Kürzel unverändert bleiben. Hat ein gespeichertes Profil kein Kürzel, MUST es auf dieselbe Weise aus seinem Namen gebildet werden.

#### Scenario: Kürzel aus dem vorbelegten Namen
- **WHEN** sich artjom.weyand@example.com zum ersten Mal anmeldet
- **THEN** steht im Dialog das Kürzel „AW“

#### Scenario: Kürzel bleibt bei geändertem Namen
- **GIVEN** der Dialog zeigt den vorbelegten Namen „Artjom Weyand“ und das Kürzel „AW“
- **WHEN** der Nutzer den Namen in „Kai Meyer“ ändert
- **THEN** bleibt das Kürzel „AW“

#### Scenario: Gespeichertes Profil ohne Kürzel
- **GIVEN** ein Account hat ein Profil mit dem Namen „Artjom Weyand“, aber kein Kürzel
- **WHEN** die App sein Profil lädt
- **THEN** hat es das Kürzel „AW“, und der Dialog „Profil“ erscheint nicht

### Requirement: Name, Kürzel und Farbe
Der Name MUST 1 bis 40 Zeichen lang sein, ohne Zeilenumbrüche und Steuerzeichen; Leerzeichen am Rand MUST entfallen. Er MUST nicht eindeutig sein. Das Kürzel MUST 1 bis 2 Zeichen lang sein, ohne Leer- und Steuerzeichen. Die Farbe MUST eine der Pattern-Farben sein, Rot MUST nicht wählbar sein. Ungültige Angaben MUST der Server ablehnen und die App mit einer Meldung im Dialog.

#### Scenario: Leerer Name
- **WHEN** der Nutzer den Namen leert und „Speichern“ wählt
- **THEN** bleibt der Dialog offen und meldet, dass ein Name nötig ist

#### Scenario: Zu langer Name
- **WHEN** ein Client einen Namen mit 41 Zeichen speichern will
- **THEN** lehnt der Server das ab, und das Profil bleibt unverändert

#### Scenario: Ungültiges Kürzel
- **WHEN** der Nutzer das Kürzel leert oder „A B“ einträgt und „Speichern“ wählt
- **THEN** bleibt der Dialog offen und meldet, dass das Kürzel 1 bis 2 Zeichen ohne Leerzeichen haben muss

#### Scenario: Gleicher Name
- **GIVEN** es gibt einen Account mit dem Namen „Anna“
- **WHEN** ein anderer Account den Namen „Anna“ speichert
- **THEN** wird das Profil gespeichert

### Requirement: Profil ändern
Das Konto-Popover des angemeldeten Nutzers MUST „Profil bearbeiten“ anbieten. Es MUST den Dialog „Profil“ mit dem gespeicherten Namen, Kürzel und der gespeicherten Farbe öffnen; dort MUST zusätzlich „Abbrechen“ den Dialog ohne Änderung schließen, ebenso Escape.

#### Scenario: Name ändern
- **GIVEN** der Nutzer heißt „Artjom“
- **WHEN** er im Konto-Popover „Profil bearbeiten“ wählt, „Art“ einträgt und „Speichern“ wählt
- **THEN** heißt er „Art“

#### Scenario: Kürzel ändern
- **GIVEN** der Nutzer hat das Kürzel „AW“
- **WHEN** er es in „A“ ändert und „Speichern“ wählt
- **THEN** zeigen seine Kreise „A“

#### Scenario: Abbrechen
- **WHEN** der Nutzer den geöffneten Dialog mit „Abbrechen“ schließt
- **THEN** bleibt sein Profil unverändert
