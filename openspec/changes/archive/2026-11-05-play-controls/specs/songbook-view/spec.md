# Spec Delta

## ADDED Requirements

### Requirement: Aufbau des Takt-Popovers
Das Takt-Popover MUST in sichtbar getrennte Abschnitte gegliedert sein, von oben nach unten: Titel und Abspiel-Knöpfe; Groove, Fill und Länge; Akzente, sofern genau ein Takt ausgewählt ist; „Takt davor“, „Takt danach“ und „Löschen“. „Löschen“ MUST rechts abgesetzt stehen.

#### Scenario: Einzelner Takt
- **WHEN** der Nutzer einen Takt auswählt
- **THEN** zeigt das Popover von oben nach unten Abspiel-Knöpfe, Groove, Fill, Länge, Akzente und die Aktionen zum Einfügen und Löschen, wobei eine Trennlinie zwischen Akzenten und Aktionen steht

#### Scenario: Mehrere Takte
- **WHEN** der Nutzer die Takte 1 bis 2 auswählt
- **THEN** folgen auf Groove, Fill und Länge direkt die Aktionen zum Einfügen und Löschen, ohne Abschnitt für Akzente

### Requirement: Abspiel-Knöpfe zuoberst
Im Segment-Popover MUST die Abspiel-Knöpfe über allen anderen Elementen stehen.

#### Scenario: Segment auswählen
- **WHEN** der Nutzer ein Segment auswählt
- **THEN** stehen die Abspiel-Knöpfe über dem Feld für den Segmentnamen

### Requirement: Einheitliche Zeilen für Groove, Fill und Länge
Die Zeilen Groove, Fill und Länge MUST mit ihrer Beschriftung beginnen, gefolgt von zwei gleich breiten Knöpfen `-` und `+` in derselben Spalte aller Zeilen. Dahinter MUST bei Groove und Fill die Chips der Patterns stehen, bei der Länge der aktuelle Wert. `-` MUST bei Groove und Fill „kein“ bedeuten und `+` „neu“, bei der Länge „verringern“ und „erhöhen“.

#### Scenario: Reihenfolge bei den Grooves
- **WHEN** der Song die Grooves A und B hat und der Nutzer einen Takt auswählt
- **THEN** zeigt die Zeile Groove in dieser Reihenfolge `-`, `+`, A und B

#### Scenario: Reihenfolge bei der Länge
- **WHEN** der Nutzer einen Takt mit 4 Beats auswählt
- **THEN** zeigt die Zeile Länge in dieser Reihenfolge `-`, `+` und „4/4“

### Requirement: Kompakte Akzente im Takt-Popover
Eingabe und Knopf für einen neuen Akzent MUST in einer Reihe stehen, in den Maßen der Chips. Der Knopf MUST `+` zeigen und „Akzent hinzufügen“ heißen. Die Auswahl von Beat und Position MUST dies als Tooltip nennen. Vorhandene Akzente MUST als Chips darunter stehen, mit Beat und Position, dann dem Kürzel des Instruments, etwa „1.1 Cr“. Ohne Akzente MUST diese Zeile entfallen.

#### Scenario: Reihe für einen neuen Akzent
- **WHEN** der Nutzer einen Takt auswählt
- **THEN** stehen Instrument, Beat, Position und der Knopf `+` in einer Reihe hinter der Beschriftung „Akzente“

#### Scenario: Chip eines Akzents
- **WHEN** Takt 1 einen Crash-Akzent auf Beat 1, Position 1 hat und der Nutzer Takt 1 auswählt
- **THEN** zeigt das Popover den Chip „1.1 Cr“, dessen Knopf „Crash auf 1.1 entfernen“ heißt

#### Scenario: Ohne Akzente
- **WHEN** der Nutzer einen Takt ohne Akzente auswählt
- **THEN** zeigt das Popover keine Akzent-Chips

## MODIFIED Requirements

### Requirement: Pattern-Chips
Groove und Fill MUST im Takt-Popover als Chips in der Farbe des jeweiligen Patterns wählbar sein, ergänzt um „neu“ und „kein“. Der Chip „neu“ MUST die Farbe zeigen, die ein neues Pattern erhalten würde. Ein Chip MUST als gewählt erscheinen, wenn alle ausgewählten Takte dieses Pattern haben. Ein gewählter Chip MUST in seiner Patternfarbe gefüllt sein und einen Haken zeigen, ohne zusätzlichen Rahmen in einer anderen Farbe.

#### Scenario: Groove-Chips
- **WHEN** der Song die Grooves A (blau) und B (grün) hat und der Nutzer Takte mit Groove A auswählt
- **THEN** zeigt das Popover die Chips „kein“, „neu“ in der nächsten freien Farbe, A und B, und A erscheint als gewählt

#### Scenario: Gemischte Auswahl
- **WHEN** der Nutzer einen Takt mit Groove A und einen Takt mit Groove B auswählt
- **THEN** erscheint keiner der Groove-Chips als gewählt

#### Scenario: Gewählter Chip mit Haken
- **WHEN** der Nutzer Takte mit Groove A auswählt
- **THEN** zeigt der Chip A einen Haken und die anderen Groove-Chips nicht
