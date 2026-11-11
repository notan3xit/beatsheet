# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Ride-Glocke`
- TO: `### Requirement: Ride-Bell`

## MODIFIED Requirements

### Requirement: Systemposition je Instrument
Jedes Instrument MUST an einer festen Systemposition stehen (Linie 1 = unterste Linie):

| Instrument | Position |
|---|---|
| Hi-Hat-Pedal | Hilfslinie unter dem System |
| Kick Drum | Zwischenraum 1 |
| Floor Tom | Zwischenraum 2 |
| Snare | Zwischenraum 3 |
| Tom 2 | Linie 4 |
| Tom 1 | Zwischenraum 4 |
| Ride | Linie 5 |
| Hi-Hat (geschlossen/offen) | über Linie 5 |
| Crash | Hilfslinie über dem System |

#### Scenario: Snare und Kick Drum
- **WHEN** ein Pattern einen Snare- und einen Kick-Drum-Schlag enthält
- **THEN** steht die Snare im Zwischenraum 3 und die Kick Drum im Zwischenraum 1

### Requirement: Hände und Füße als getrennte Stimmen
Kick Drum und Hi-Hat-Pedal MUST als untere Stimme mit Hälsen nach unten notiert werden, alle übrigen Instrumente als obere Stimme mit Hälsen nach oben. Gleichzeitige Schläge einer Stimme MUST als ein Akkord an einem gemeinsamen Hals erscheinen.

#### Scenario: Grundgroove
- **WHEN** ein Beat Hi-Hat und Kick Drum auf der „1“ und Hi-Hat und Snare auf dem „und“ hat
- **THEN** stehen Hi-Hat und Snare in der oberen Stimme mit Hälsen nach oben
- **AND** die Kick Drum steht in der unteren Stimme mit Hals nach unten

### Requirement: Notenwerte und Pausen aus dem Raster
Notenwerte MUST sich aus der Unterteilung des Beats und dem Abstand zum nächsten Schlag derselben Stimme im selben Beat ergeben. Lücken vor dem ersten Schlag einer Stimme im Beat MUST durch Pausen gefüllt werden. Hat eine Stimme in einem Takt keinen Schlag, MUST sie dort keine Pausen zeigen. Sonst MUST ein leerer Beat eine Viertelpause zeigen; in einem vollständigen 4/4-Takt MUST stattdessen eine Halbe Pause stehen, wenn die Beats 1 und 2 oder 3 und 4 leer sind.

#### Scenario: Achtel aus Sechzehntel-Raster
- **WHEN** ein Beat in Sechzehnteln Hi-Hat-Schläge auf den Positionen 1 und 3 hat
- **THEN** erscheinen in der oberen Stimme zwei Achtelnoten

#### Scenario: Pause vor Offbeat
- **WHEN** ein Beat in Sechzehnteln einen Snare-Schlag nur auf Position 3 hat
- **THEN** zeigt die obere Stimme eine Achtelpause gefolgt von einer Achtelnote

#### Scenario: Leerer Beat für die Füße
- **WHEN** ein 4/4-Takt Kick Drum nur auf Beat 1 und Beat 3 hat
- **THEN** zeigt die untere Stimme auf Beat 2 und Beat 4 je eine Viertelpause

#### Scenario: Stimme ohne Schläge im Takt
- **WHEN** ein 4/4-Takt Hi-Hat-Achtel und keine Kick-Drum- oder Hi-Hat-Pedal-Schläge hat
- **THEN** zeigt die untere Stimme in diesem Takt keine Pausen

#### Scenario: Halbe Pause
- **WHEN** ein 4/4-Takt Kick Drum nur auf Beat 3 und Beat 4 hat
- **THEN** zeigt die untere Stimme auf Beat 1 eine Halbe Pause

#### Scenario: Taktmitte bleibt sichtbar
- **WHEN** ein 4/4-Takt Kick Drum nur auf Beat 1 und Beat 4 hat
- **THEN** zeigt die untere Stimme auf Beat 2 und Beat 3 je eine Viertelpause

#### Scenario: Unvollständiger Takt
- **WHEN** ein Groove mit 6 Beats in 4/4 im zweiten Takt Kick Drum nur auf Beat 6 hat
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
- **WHEN** ein 6/4-Takt Kick Drum nur auf Beat 1 hat
- **THEN** zeigt die untere Stimme auf den Beats 2 bis 6 je eine Viertelpause

#### Scenario: Unvollständiger Takt mit 4 Beats
- **WHEN** ein Groove mit 4 Beats in 5/4 Kick Drum nur auf Beat 1 hat
- **THEN** zeigt die untere Stimme auf den Beats 2 bis 4 je eine Viertelpause

### Requirement: Ride-Bell
Ein Schlag auf die Ride-Bell MUST mit Rauten-Notenkopf auf der Systemposition der Ride dargestellt werden.

#### Scenario: Bell
- **WHEN** ein Beat eine Ride-Bell auf der „1“ hat
- **THEN** erscheint auf Linie 5 ein Rauten-Notenkopf

### Requirement: Betonung in den Noten
Eine Spalte mit mindestens einem betonten Schlag MUST genau ein `>` tragen, unabhängig davon, welches Instrument oder welche Stimme betont ist. Alle `>` einer Notenzeile MUST auf derselben Höhe oberhalb von System, Hälsen, Balken und Zeichen über den Noten stehen. Das gilt für jede Darstellung eines Patterns.

#### Scenario: Betonte Snare im Akkord
- **WHEN** auf der „2“ Hi-Hat und eine betonte Snare liegen
- **THEN** steht über dieser Spalte ein `>`

#### Scenario: Nur die Kick Drum betont
- **WHEN** auf der „1“ nur eine betonte Kick Drum liegt
- **THEN** steht das `>` oberhalb des Systems

#### Scenario: Hände und Füße betont
- **WHEN** auf der „1“ eine betonte Hi-Hat und eine betonte Kick Drum liegen
- **THEN** steht über dieser Spalte genau ein `>`

#### Scenario: Einheitliche Höhe
- **WHEN** in einer Notenzeile eine betonte Note mit Balken und eine betonte Viertelnote stehen
- **THEN** stehen beide `>` auf derselben Höhe und berühren keinen Balken

#### Scenario: Offene Hi-Hat
- **WHEN** eine offene Hi-Hat betont ist
- **THEN** steht das `>` über dem „o“
