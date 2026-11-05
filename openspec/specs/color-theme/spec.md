# color-theme Specification

## Purpose

Legt das Farbschema der App fest: Catppuccin Latte (hell) oder Mocha (dunkel), gewählt pro Gerät oder nach Systemeinstellung, mit allen Oberflächenfarben aus der Palette der aktiven Variante.

## Requirements

### Requirement: Farbschema folgt der Systemeinstellung
Die App MUST bei gewähltem Farbschema „Hell“ die Catppuccin-Variante Latte und bei „Dunkel“ die Variante Mocha verwenden. Bei „Wie System“ MUST sie bei heller Systemeinstellung (oder ohne Angabe) Latte und bei dunkler Systemeinstellung Mocha verwenden. Ändert sich bei „Wie System“ die Systemeinstellung, während die App geöffnet ist, MUST die App ohne Neuladen in die andere Variante wechseln.

#### Scenario: Helle Systemeinstellung
- **GIVEN** das Farbschema ist „Wie System“
- **WHEN** die App bei heller Systemeinstellung geöffnet wird
- **THEN** ist der Seitenhintergrund Latte „base“ und der Fließtext Latte „text“

#### Scenario: Dunkle Systemeinstellung
- **GIVEN** das Farbschema ist „Wie System“
- **WHEN** die App bei dunkler Systemeinstellung geöffnet wird
- **THEN** ist der Seitenhintergrund Mocha „base“ und der Fließtext Mocha „text“

#### Scenario: Wechsel zur Laufzeit
- **GIVEN** das Farbschema ist „Wie System“
- **WHEN** die Systemeinstellung bei geöffneter App von hell auf dunkel wechselt
- **THEN** zeigt die App ohne Neuladen die Mocha-Farben

#### Scenario: Hell trotz dunkler Systemeinstellung
- **GIVEN** das Farbschema ist „Hell“
- **WHEN** die App bei dunkler Systemeinstellung geöffnet wird
- **THEN** ist der Seitenhintergrund Latte „base“ und der Fließtext Latte „text“

#### Scenario: Dunkel trotz heller Systemeinstellung
- **GIVEN** das Farbschema ist „Dunkel“
- **WHEN** die App bei heller Systemeinstellung geöffnet wird
- **THEN** ist der Seitenhintergrund Mocha „base“ und der Fließtext Mocha „text“

#### Scenario: Systemwechsel bei fester Wahl
- **GIVEN** das Farbschema ist „Hell“
- **WHEN** die Systemeinstellung bei geöffneter App von hell auf dunkel wechselt
- **THEN** zeigt die App weiter die Latte-Farben

### Requirement: Farben ausschließlich aus der Palette
Jede Farbe, die die App für Hintergründe, Flächen, Text, Rahmen, Zustände und Meldungen verwendet, MUST eine Farbe der aktiven Catppuccin-Variante sein. Transparente Abstufungen einer Palettenfarbe und Mischungen einer Palettenfarbe mit „base“ der aktiven Variante sind zulässig. Das Logo darf zusätzlich zwei Palettenfarben der aktiven Variante außer „red“ miteinander mischen.

#### Scenario: Oberfläche im Hellmodus
- **WHEN** die App bei heller Systemeinstellung Bibliothek, Sequencer und Notenbild zeigt
- **THEN** stammen alle verwendeten Farben aus der Latte-Palette

#### Scenario: Oberfläche im Dunkelmodus
- **WHEN** die App bei dunkler Systemeinstellung Bibliothek, Sequencer und Notenbild zeigt
- **THEN** stammen alle verwendeten Farben aus der Mocha-Palette

#### Scenario: Mischfarbe im Logo
- **WHEN** die Kopfzeile das Logo zeigt
- **THEN** ist jede seiner Farben eine Palettenfarbe, eine Mischung mit „base“ oder eine Mischung zweier Palettenfarben außer „red“

### Requirement: Rot nur für Fehler und destruktive Aktionen
Die Palettenfarbe „red“ MUST ausschließlich für Fehlermeldungen und destruktive Aktionen verwendet werden. Andere Hervorhebungen, zum Beispiel gesetzte Sequencer-Zellen oder das ausgewählte Pattern, MUST NOT „red“ verwenden.

#### Scenario: Löschen und Fehler
- **WHEN** der „Löschen“-Button oder eine fehlgeschlagene Importmeldung angezeigt wird
- **THEN** sind sie in „red“ der aktiven Variante gehalten

#### Scenario: Gesetzte Sequencer-Zelle
- **WHEN** im Sequencer ein Schlag gesetzt ist
- **THEN** ist die Zelle in einer Akzentfarbe ungleich „red“ hervorgehoben

### Requirement: Akzentflächen je nach Variante tonal oder voll
Schaltflächen MUST ohne Rahmen dargestellt werden und sich über ihre Fläche abheben (Standard: „surface0“). Im Hellmodus MUST der Hauptbutton tonal sein (Akzent zu 25 % mit „base“ gemischt, Beschriftung „text“) und gesetzte Sequencer-Zellen gedämpft, aber kräftiger als der Hauptbutton. Im Dunkelmodus MUST beide voll in der Akzentfarbe gefüllt sein, Beschriftung „base“.

#### Scenario: Hauptbutton im Hellmodus
- **WHEN** die App bei heller Systemeinstellung den Button „Song anlegen“ zeigt
- **THEN** ist seine Fläche die Akzentfarbe zu 25 % mit Latte „base“ gemischt
- **AND** seine Beschriftung ist Latte „text“
- **AND** er hat keinen Rahmen

#### Scenario: Hauptbutton im Dunkelmodus
- **WHEN** die App bei dunkler Systemeinstellung den Button „Song anlegen“ zeigt
- **THEN** ist seine Fläche voll in der Akzentfarbe
- **AND** seine Beschriftung ist Mocha „base“

#### Scenario: Gesetzte Sequencer-Zelle im Hellmodus
- **WHEN** im Sequencer bei heller Systemeinstellung ein Schlag gesetzt ist
- **THEN** ist die Zelle in der mit „base“ gemischten Akzentfarbe gefüllt, kräftiger als der Hauptbutton

#### Scenario: Standard-Schaltfläche
- **WHEN** eine Schaltfläche ohne besondere Rolle angezeigt wird, zum Beispiel „Abbrechen“
- **THEN** hat sie keinen Rahmen und eine Fläche in „surface0“

### Requirement: Farbschema wählen
Das Menü MUST einen Abschnitt „Farbschema“ mit den Optionen „Wie System“, „Hell“ und „Dunkel“ enthalten, von denen genau eine als gewählt markiert ist. Das Wählen einer Option MUST das Farbschema sofort und ohne Neuladen ändern.

#### Scenario: Dunkel wählen
- **GIVEN** das Farbschema ist „Wie System“ und die Systemeinstellung ist hell
- **WHEN** der Nutzer im Menü „Dunkel“ wählt
- **THEN** ist „Dunkel“ als gewählt markiert
- **AND** die App zeigt ohne Neuladen die Mocha-Farben

#### Scenario: Zurück zu Wie System
- **GIVEN** das Farbschema ist „Dunkel“ und die Systemeinstellung ist hell
- **WHEN** der Nutzer im Menü „Wie System“ wählt
- **THEN** zeigt die App die Latte-Farben

### Requirement: Wahl des Farbschemas pro Gerät
Die Wahl des Farbschemas MUST auf dem Gerät gespeichert werden und nach einem Neuladen der App gelten, bereits beim ersten Anzeigen. Sie MUST NOT mit dem Konto oder anderen Geräten abgeglichen werden. Ohne gespeicherte Wahl MUST „Wie System“ gelten.

#### Scenario: Vorgabe
- **GIVEN** auf dem Gerät wurde noch kein Farbschema gewählt
- **WHEN** der Nutzer das Menü öffnet
- **THEN** ist „Wie System“ als gewählt markiert

#### Scenario: Wahl bleibt erhalten
- **GIVEN** der Nutzer hat bei heller Systemeinstellung „Dunkel“ gewählt
- **WHEN** er die App neu lädt
- **THEN** zeigt die App vom ersten Anzeigen an die Mocha-Farben
- **AND** im Menü ist „Dunkel“ als gewählt markiert
