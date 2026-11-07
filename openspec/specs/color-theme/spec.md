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
