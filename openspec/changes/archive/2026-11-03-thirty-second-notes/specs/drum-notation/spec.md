# Spec Delta

## MODIFIED Requirements

### Requirement: Notenwerte und Pausen aus dem Raster
Notenwerte MUST sich aus der Unterteilung des Beats und dem Abstand zum nächsten Schlag derselben Stimme im selben Beat ergeben. Lücken vor dem ersten Schlag einer Stimme im Beat MUST durch Pausen gefüllt werden. Hat eine Stimme in einem Takt keinen Schlag, MUST sie dort keine Pausen zeigen. Sonst MUST ein leerer Beat eine Viertelpause zeigen; in einem 4-Beat-Takt MUST stattdessen eine Halbe Pause stehen, wenn die Beats 1 und 2 oder 3 und 4 leer sind.

#### Scenario: Achtel aus Sechzehntel-Raster
- **WHEN** ein Beat in Sechzehnteln Hi-Hat-Schläge auf den Positionen 1 und 3 hat
- **THEN** erscheinen in der oberen Stimme zwei Achtelnoten

#### Scenario: Pause vor Offbeat
- **WHEN** ein Beat in Sechzehnteln einen Snare-Schlag nur auf Position 3 hat
- **THEN** zeigt die obere Stimme eine Achtelpause gefolgt von einer Achtelnote

#### Scenario: Leerer Beat für die Füße
- **WHEN** ein 4-Beat-Takt Bassdrum nur auf Beat 1 und Beat 3 hat
- **THEN** zeigt die untere Stimme auf Beat 2 und Beat 4 je eine Viertelpause

#### Scenario: Stimme ohne Schläge im Takt
- **WHEN** ein 4-Beat-Takt Hi-Hat-Achtel und keine Bassdrum- oder Hi-Hat-Pedal-Schläge hat
- **THEN** zeigt die untere Stimme in diesem Takt keine Pausen

#### Scenario: Halbe Pause
- **WHEN** ein 4-Beat-Takt Bassdrum nur auf Beat 3 und Beat 4 hat
- **THEN** zeigt die untere Stimme auf Beat 1 eine Halbe Pause

#### Scenario: Taktmitte bleibt sichtbar
- **WHEN** ein 4-Beat-Takt Bassdrum nur auf Beat 1 und Beat 4 hat
- **THEN** zeigt die untere Stimme auf Beat 2 und Beat 3 je eine Viertelpause

#### Scenario: Unvollständiger Takt
- **WHEN** ein Groove mit 6 Beats im zweiten Takt Bassdrum nur auf Beat 6 hat
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

### Requirement: Balken pro Beat
Noten MUST je Stimme innerhalb eines Beats gebalkt werden. Balken MUST NOT über Beatgrenzen gehen.

#### Scenario: Sechzehntel im Beat
- **WHEN** ein Beat vier Hi-Hat-Sechzehntel hat
- **THEN** sind die vier Noten durch einen gemeinsamen Doppelbalken verbunden
- **AND** der Balken endet am Ende des Beats

#### Scenario: Zweiunddreißigstel im Beat
- **WHEN** ein Beat acht Snare-Zweiunddreißigstel hat
- **THEN** sind die acht Noten durch einen gemeinsamen dreifachen Balken verbunden
- **AND** der Balken endet am Ende des Beats

### Requirement: Triolen kennzeichnen
Ein Beat mit Achteltriolen-, Sechzehnteltriolen- oder Zweiunddreißigsteltriolen-Unterteilung MUST in jeder Stimme, die in diesem Beat Noten hat, mit einer „3“, „6“ bzw. „12“ über bzw. unter der Gruppe gekennzeichnet werden.

#### Scenario: Achteltriole
- **WHEN** Beat 3 auf Achteltriolen steht und Snare-Schläge auf allen drei Positionen hat
- **THEN** erscheinen drei gebalkte Achtelnoten mit einer „3“ über der Gruppe

#### Scenario: Gemischtes Pattern
- **WHEN** die Beats 1, 2 und 4 in Sechzehnteln und Beat 3 in Achteltriolen stehen
- **THEN** ist nur Beat 3 als Triole gekennzeichnet

#### Scenario: Zweiunddreißigsteltriole
- **WHEN** Beat 1 auf Zweiunddreißigsteltriolen steht und Snare-Schläge auf allen zwölf Positionen hat
- **THEN** erscheinen zwölf Zweiunddreißigstelnoten mit dreifachem Balken und einer „12“ über der Gruppe
