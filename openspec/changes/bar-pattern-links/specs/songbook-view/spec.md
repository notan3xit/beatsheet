# Spec Delta

## ADDED Requirements

### Requirement: Links zu Groove und Fill im Takt-Popover
Das Takt-Popover MUST „zum Groove“ zeigen, wenn alle ausgewählten Takte denselben Groove haben, und „zum Fill“, wenn alle denselben Fill haben. Der Fill eines Takts ist der Fill, der an seinem Ende endet oder ihn ganz überdeckt. Ein Klick MUST den Pattern-Editor des Patterns öffnen. Sonst MUST der jeweilige Link entfallen.

#### Scenario: Takt mit Groove und Fill
- **WHEN** der Nutzer einen Takt mit Groove A und Fill f1 auswählt und „zum Fill“ anklickt
- **THEN** zeigte das Popover „zum Groove“ und „zum Fill“
- **AND** öffnet die App den Pattern-Editor von f1

#### Scenario: Takt mit Groove ohne Fill
- **WHEN** der Nutzer einen Takt mit Groove A ohne Fill auswählt und „zum Groove“ anklickt
- **THEN** zeigte das Popover nur „zum Groove“
- **AND** öffnet die App den Pattern-Editor von A

#### Scenario: Takt ohne Groove und Fill
- **WHEN** der Nutzer einen leeren Takt auswählt
- **THEN** zeigt das Popover keinen der beiden Links

#### Scenario: Von einem Fill überdeckter Takt
- **WHEN** Fill f1 mit 8 Beats in Takt 2 endet, Takt 1 ganz überdeckt und der Nutzer Takt 1 auswählt
- **THEN** zeigt das Popover „zum Fill“ und der Link führt zu f1

#### Scenario: Mehrere Takte mit gleichem Groove und verschiedenen Fills
- **WHEN** die Takte 1 und 2 Groove A haben, nur Takt 2 Fill f1 hat und der Nutzer beide auswählt
- **THEN** zeigt das Popover „zum Groove“, aber nicht „zum Fill“

### Requirement: Hervorhebung der Patterns ausgewählter Takte
Solange Takte ausgewählt sind, MUST die Patternseite die Karte jedes Grooves und Fills dieser Takte mit vollem Rahmen in der Patternfarbe und kräftigerer Füllung hervorheben. Die Hervorhebung MUST die Anordnung der Karten nicht verändern. Andere Karten MUST unverändert bleiben. Die Auswahl eines Segments MUST keine Karte hervorheben.

#### Scenario: Takt mit Groove und Fill
- **WHEN** der Nutzer einen Takt mit Groove A und Fill f1 auswählt
- **THEN** sind die Karten von A und f1 hervorgehoben und die übrigen nicht

#### Scenario: Mehrere Takte mit verschiedenen Grooves
- **WHEN** Takt 1 Groove A hat, Takt 2 Groove B und der Nutzer beide auswählt
- **THEN** sind die Karten von A und B hervorgehoben

#### Scenario: Von einem Fill überdeckter Takt
- **WHEN** Fill f1 einen Takt ganz überdeckt und der Nutzer diesen Takt auswählt
- **THEN** ist die Karte von f1 hervorgehoben

#### Scenario: Auswahl aufheben
- **WHEN** der Nutzer die Auswahl mit Escape aufhebt
- **THEN** ist keine Karte mehr hervorgehoben

#### Scenario: Segment auswählen
- **WHEN** der Nutzer ein Segment auswählt
- **THEN** ist keine Karte hervorgehoben

## MODIFIED Requirements

### Requirement: Aufbau des Takt-Popovers
Das Takt-Popover MUST in sichtbar getrennte Abschnitte gegliedert sein, von oben nach unten: Titel, Abspiel-Knöpfe und Links zu Groove und Fill; Groove, Fill und Länge; Akzente, sofern genau ein Takt ausgewählt ist; „Takt davor“, „Takt danach“ und „Löschen“. „Löschen“ MUST rechts abgesetzt stehen.

#### Scenario: Einzelner Takt
- **WHEN** der Nutzer einen Takt auswählt
- **THEN** zeigt das Popover von oben nach unten Abspiel-Knöpfe, Groove, Fill, Länge, Akzente und die Aktionen zum Einfügen und Löschen, wobei eine Trennlinie zwischen Akzenten und Aktionen steht

#### Scenario: Mehrere Takte
- **WHEN** der Nutzer die Takte 1 bis 2 auswählt
- **THEN** folgen auf Groove, Fill und Länge direkt die Aktionen zum Einfügen und Löschen, ohne Abschnitt für Akzente

#### Scenario: Links neben den Abspiel-Knöpfen
- **WHEN** der Nutzer einen Takt mit Groove A und Fill f1 auswählt
- **THEN** stehen „zum Groove“ und „zum Fill“ im selben Abschnitt hinter den Abspiel-Knöpfen
