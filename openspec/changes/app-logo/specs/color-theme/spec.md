# Spec Delta

## MODIFIED Requirements

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
