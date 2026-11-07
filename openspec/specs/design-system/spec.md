# design-system Specification

## Purpose

Legt fest, wie die App Farben einsetzt und welche Kontraste sie einhält, damit jede Oberfläche in Hell und Dunkel lesbar und ruhig bleibt.

## Requirements

### Requirement: Farben ausschließlich aus der Palette
Jede Farbe, die die App für Hintergründe, Flächen, Text, Rahmen, Zustände und Meldungen verwendet, MUST eine Farbe der aktiven Catppuccin-Variante sein. Transparente Abstufungen einer Palettenfarbe und Mischungen einer Palettenfarbe mit „base“ der aktiven Variante sind zulässig, für Schrift und Ränder auch Mischungen mit „text“. Das Logo darf zusätzlich zwei Palettenfarben der aktiven Variante außer „red“ miteinander mischen.

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
- **THEN** sind sie in „red“ der aktiven Variante gehalten, ihre Schrift darf dafür mit „text“ gemischt sein

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

### Requirement: Flächen in Patternfarbe mit Schrift
Gewählte Chips und Kürzel in Patternfarbe MUST im Hellmodus tonal sein (Patternfarbe mit „base“ gemischt, Beschriftung „text“) und im Dunkelmodus voll in der Patternfarbe, Beschriftung „base“.

#### Scenario: Gewählter Chip im Hellmodus
- **WHEN** im Takt-Popover bei heller Einstellung ein Chip in der Patternfarbe „yellow“ gewählt ist
- **THEN** ist seine Fläche die mit „base“ gemischte Patternfarbe und seine Beschriftung „text“

#### Scenario: Gewählter Chip im Dunkelmodus
- **WHEN** im Takt-Popover bei dunkler Einstellung ein Chip in der Patternfarbe „yellow“ gewählt ist
- **THEN** ist seine Fläche voll in der Patternfarbe und seine Beschriftung „base“

### Requirement: Rollen der Schriftfarben
Schrift MUST eine der Text-Rollen verwenden: Fließtext, gedämpfter Text, Fehlertext, Beschriftung auf Akzentflächen oder eine mit „text“ gemischte Patternfarbe. Akzent- und Patternfarben MUST NOT ungemischt als Schrift dienen. Akzentfarben sind Flächen, Rahmen und Symbolen vorbehalten.

#### Scenario: Link im Popover
- **WHEN** das Takt-Popover einen Link zeigt
- **THEN** hat er keine Akzentfarbe als Schrift

#### Scenario: Pattern-Name
- **WHEN** die Patternseite den Namen eines Patterns in der Farbe „yellow“ zeigt
- **THEN** ist seine Schrift mit „text“ gemischt

### Requirement: Lesekontrast
Jede lesbare Schrift MUST in Hell und Dunkel mindestens den Kontrast 4,5:1 zu ihrer Fläche einhalten, auf getönten Flächen mit jeder Patternfarbe. Deaktivierte Bedienelemente sind ausgenommen. Auf Schaltflächen und getönten Flächen MUST Schrift deshalb statt gedämpfter die volle Textfarbe verwenden, sofern gedämpfte Schrift den Kontrast verfehlt.

#### Scenario: Schrift auf hervorgehobenem Fill
- **WHEN** ein Fill in der Patternfarbe „mauve“ oder „rosewater“ hervorgehoben ist
- **THEN** hat seine Kurzschrift in Hell und Dunkel mindestens den Kontrast 4,5:1 zur Fläche

#### Scenario: Gedämpfter Text
- **WHEN** gedämpfter Text auf Seitenhintergrund oder Seitenfläche steht
- **THEN** hat er in Hell und Dunkel mindestens den Kontrast 4,5:1

#### Scenario: Fehlermeldung
- **WHEN** die App eine Fehlermeldung zeigt
- **THEN** hat ihr Text in Hell und Dunkel mindestens den Kontrast 4,5:1 zur getönten Fläche

### Requirement: Zustandskontrast
Rahmen, die einen Zustand tragen, MUST in Hell und Dunkel mindestens den Kontrast 3:1 zur Seitenfläche einhalten, mit jeder Patternfarbe. Trennlinien, Motive und leere Zellen des Sequencers sind Schmuck und ausgenommen. Gesetzte Zellen des Sequencers sind ausgenommen, weil dort im Hellmodus der Farbton den Zustand trägt.

#### Scenario: Hervorgehobener Balken
- **WHEN** ein Balken in der Patternfarbe „yellow“ hervorgehoben ist
- **THEN** hat sein Rahmen in Hell und Dunkel mindestens den Kontrast 3:1 zur Seitenfläche

### Requirement: Links als gedämpfter Text
Links innerhalb der Oberfläche MUST als gedämpfter Text ohne Fläche erscheinen und beim Überfahren in voller Textfarbe unterstrichen sein, wie der Pfad über der Überschrift.

#### Scenario: Links im Takt-Popover
- **WHEN** der Nutzer einen Link im Takt-Popover überfährt
- **THEN** erscheint er in voller Textfarbe und unterstrichen
