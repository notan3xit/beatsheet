# color-theme Specification

## Purpose

Legt das Farbschema der App fest: Catppuccin Latte bei heller und Mocha bei dunkler Systemeinstellung, mit allen Oberflächenfarben aus der Palette der aktiven Variante.

## Requirements

### Requirement: Farbschema folgt der Systemeinstellung
Die App MUST bei heller Systemeinstellung (oder ohne Angabe) die Catppuccin-Variante Latte und bei dunkler Systemeinstellung die Variante Mocha verwenden. Ändert sich die Systemeinstellung, während die App geöffnet ist, MUST die App ohne Neuladen in die andere Variante wechseln.

#### Scenario: Helle Systemeinstellung
- **WHEN** die App bei heller Systemeinstellung geöffnet wird
- **THEN** ist der Seitenhintergrund Latte „base“ und der Fließtext Latte „text“

#### Scenario: Dunkle Systemeinstellung
- **WHEN** die App bei dunkler Systemeinstellung geöffnet wird
- **THEN** ist der Seitenhintergrund Mocha „base“ und der Fließtext Mocha „text“

#### Scenario: Wechsel zur Laufzeit
- **WHEN** die Systemeinstellung bei geöffneter App von hell auf dunkel wechselt
- **THEN** zeigt die App ohne Neuladen die Mocha-Farben

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
