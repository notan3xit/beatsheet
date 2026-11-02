# Spec Delta

## MODIFIED Requirements

### Requirement: Pattern-Chips
Groove und Fill MUST im Takt-Popover als Chips in der Farbe des jeweiligen Patterns wählbar sein, ergänzt um „neu“ und „kein“. Der Chip „neu“ MUST die Farbe zeigen, die ein neues Pattern erhalten würde. Ein Chip MUST als gewählt erscheinen, wenn alle ausgewählten Takte dieses Pattern haben. Ein gewählter Chip MUST in seiner Patternfarbe gefüllt sein und einen Haken zeigen, ohne zusätzlichen Rahmen in einer anderen Farbe.

#### Scenario: Groove-Chips
- **WHEN** der Song die Grooves A (blau) und B (grün) hat und der Nutzer Takte mit Groove A auswählt
- **THEN** zeigt das Popover die Chips A, B, „neu“ in der nächsten freien Farbe und „kein“, und A erscheint als gewählt

#### Scenario: Gemischte Auswahl
- **WHEN** der Nutzer einen Takt mit Groove A und einen Takt mit Groove B auswählt
- **THEN** erscheint keiner der Groove-Chips als gewählt

#### Scenario: Gewählter Chip mit Haken
- **WHEN** der Nutzer Takte mit Groove A auswählt
- **THEN** zeigt der Chip A einen Haken und die anderen Groove-Chips nicht

## ADDED Requirements

### Requirement: Hervorhebung von Auswahl und Ablegeziel
Ausgewählte Takte und Ablegeziele beim Ziehen MUST über ihre Balken hervorgehoben werden: Groove- und Fill-Balken mit vollem Rahmen in der Patternfarbe und kräftigerer Füllung. Ein Fill MUST hervorgehoben sein, wenn sein Takt oder ein von ihm ganz überdeckter Takt hervorgehoben ist. Ein Takt ohne Groove MUST einen grauen Schatten-Groove zeigen. Der Takt selbst MUST NOT umrahmt werden; gestrichelte Linien MUST NOT vorkommen.

#### Scenario: Ausgewählte Takte
- **WHEN** der Nutzer die Takte 2 bis 3 eines Blocks mit Groove A auswählt
- **THEN** sind genau die Groove-Balken von Takt 2 und 3 hervorgehoben

#### Scenario: Fill im ausgewählten Takt
- **WHEN** Takt 4 Groove A und den Fill f1 hat und der Nutzer Takt 4 auswählt
- **THEN** sind der Groove-Balken von Takt 4 und der Fill f1 hervorgehoben

#### Scenario: Leerer Takt
- **WHEN** der Nutzer einen Takt ohne Groove auswählt
- **THEN** zeigt dieser Takt einen grauen Schatten-Groove
- **AND** nicht ausgewählte Takte ohne Groove zeigen keinen

#### Scenario: Ablegeziel beim Ziehen
- **WHEN** der Nutzer Groove B über Takt 6 hält, der nicht ausgewählt ist
- **THEN** ist der Groove-Balken von Takt 6 hervorgehoben wie bei einer Auswahl
