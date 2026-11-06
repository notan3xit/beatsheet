# Spec Delta

## MODIFIED Requirements

### Requirement: Notensystem
Jedes Pattern MUST auf einem fünflinigen System mit Percussion-Schlüssel dargestellt werden. Nach jeweils so vielen Beats, wie die wirksame Taktart des Patterns vorgibt, MUST ein Taktstrich stehen (`song-meter`). Ein Pattern, dessen Länge kein Vielfaches davon ist, endet mit einem unvollständigen Takt ohne aufgefüllte Pausen.

#### Scenario: Groove über zwei Takte
- **WHEN** ein Groove mit 8 Beats in 4/4 dargestellt wird
- **THEN** erscheint ein Percussion-Schlüssel und das Pattern ist durch einen Taktstrich in zwei Takte zu je 4 Beats geteilt

#### Scenario: Kurzer Fill
- **WHEN** ein Fill mit 1 Beat dargestellt wird
- **THEN** zeigt die Darstellung genau diesen einen Beat, ohne Pausen für die übrigen Beats eines Takts

#### Scenario: Ein Takt mit 6 Beats
- **WHEN** ein Groove mit 6 Beats in 6/4 dargestellt wird
- **THEN** zeigt die Darstellung einen Takt ohne Taktstrich innerhalb der 6 Beats

#### Scenario: Taktart kürzer als das Pattern
- **WHEN** ein Groove mit 7 Beats in 3/4 dargestellt wird
- **THEN** ist das Pattern in Takte zu 3, 3 und 1 Beat geteilt

#### Scenario: Taktart länger als das Pattern
- **WHEN** ein Groove mit 4 Beats in 5/4 dargestellt wird
- **THEN** zeigt die Darstellung einen unvollständigen Takt mit 4 Beats

#### Scenario: Taktart des Songs ändern
- **WHEN** ein Groove mit 4 Beats dem Song folgt und der Nutzer den Standard-Takt von 4/4 auf 3/4 ändert
- **THEN** zeigt die Darstellung einen Taktstrich nach Beat 3 statt eines Takts mit 4 Beats

### Requirement: Notenwerte und Pausen aus dem Raster
Notenwerte MUST sich aus der Unterteilung des Beats und dem Abstand zum nächsten Schlag derselben Stimme im selben Beat ergeben. Lücken vor dem ersten Schlag einer Stimme im Beat MUST durch Pausen gefüllt werden. Hat eine Stimme in einem Takt keinen Schlag, MUST sie dort keine Pausen zeigen. Sonst MUST ein leerer Beat eine Viertelpause zeigen; in einem vollständigen 4/4-Takt MUST stattdessen eine Halbe Pause stehen, wenn die Beats 1 und 2 oder 3 und 4 leer sind.

#### Scenario: Achtel aus Sechzehntel-Raster
- **WHEN** ein Beat in Sechzehnteln Hi-Hat-Schläge auf den Positionen 1 und 3 hat
- **THEN** erscheinen in der oberen Stimme zwei Achtelnoten

#### Scenario: Pause vor Offbeat
- **WHEN** ein Beat in Sechzehnteln einen Snare-Schlag nur auf Position 3 hat
- **THEN** zeigt die obere Stimme eine Achtelpause gefolgt von einer Achtelnote

#### Scenario: Leerer Beat für die Füße
- **WHEN** ein 4/4-Takt Bassdrum nur auf Beat 1 und Beat 3 hat
- **THEN** zeigt die untere Stimme auf Beat 2 und Beat 4 je eine Viertelpause

#### Scenario: Stimme ohne Schläge im Takt
- **WHEN** ein 4/4-Takt Hi-Hat-Achtel und keine Bassdrum- oder Hi-Hat-Pedal-Schläge hat
- **THEN** zeigt die untere Stimme in diesem Takt keine Pausen

#### Scenario: Halbe Pause
- **WHEN** ein 4/4-Takt Bassdrum nur auf Beat 3 und Beat 4 hat
- **THEN** zeigt die untere Stimme auf Beat 1 eine Halbe Pause

#### Scenario: Taktmitte bleibt sichtbar
- **WHEN** ein 4/4-Takt Bassdrum nur auf Beat 1 und Beat 4 hat
- **THEN** zeigt die untere Stimme auf Beat 2 und Beat 3 je eine Viertelpause

#### Scenario: Unvollständiger Takt
- **WHEN** ein Groove mit 6 Beats in 4/4 im zweiten Takt Bassdrum nur auf Beat 6 hat
- **THEN** zeigt die untere Stimme im zweiten Takt auf Beat 5 eine Viertelpause

#### Scenario: Zweiunddreißigstel
- **WHEN** ein Beat in Zweiunddreißigsteln Snare-Schläge auf allen acht Positionen hat
- **THEN** erscheinen in der oberen Stimme acht Zweiunddreißigstelnoten

#### Scenario: Punktierte Sechzehntel aus Zweiunddreißigstel-Raster
- **WHEN** ein Beat in Zweiunddreißigsteln Snare-Schläge nur auf den Positionen 1 und 4 hat
- **THEN** zeigt die obere Stimme eine punktierte Sechzehntelnote, eine Achtelnote und eine Zweiunddreißigstelpause

#### Scenario: Pause vor Zweiunddreißigstel
- **WHEN** ein Beat in Zweiunddreißigsteln einen Snare-Schlag nur auf Position 8 hat
- **THEN** zeigt die obere Stimme Pausen über die ersten sieben Zweiunddreißigstel und danach eine Zweiunddreißigstelnote

#### Scenario: Viertelpausen in anderen Taktarten
- **WHEN** ein 6/4-Takt Bassdrum nur auf Beat 1 hat
- **THEN** zeigt die untere Stimme auf den Beats 2 bis 6 je eine Viertelpause

#### Scenario: Unvollständiger Takt mit 4 Beats
- **WHEN** ein Groove mit 4 Beats in 5/4 Bassdrum nur auf Beat 1 hat
- **THEN** zeigt die untere Stimme auf den Beats 2 bis 4 je eine Viertelpause

### Requirement: Leeres Pattern
Ein Takt ohne Schläge in beiden Stimmen MUST nur in der oberen Stimme Pausen zeigen: in einem vollständigen 4/4-Takt eine Ganze Pause mittig im Takt, sonst eine Viertelpause pro Beat. Die untere Stimme MUST dort keine Pausen zeigen.

#### Scenario: Neuer Groove
- **WHEN** ein neu angelegter, leerer Groove mit 4 Beats in 4/4 dargestellt wird
- **THEN** zeigt die obere Stimme eine Ganze Pause und die untere Stimme keine Pause

#### Scenario: Leerer kurzer Fill
- **WHEN** ein leerer Fill mit 2 Beats dargestellt wird
- **THEN** zeigt die obere Stimme zwei Viertelpausen und die untere Stimme keine Pause

#### Scenario: Neuer Groove in 3/4
- **WHEN** ein neu angelegter, leerer Groove mit 3 Beats in 3/4 dargestellt wird
- **THEN** zeigt die obere Stimme drei Viertelpausen und die untere Stimme keine Pause
