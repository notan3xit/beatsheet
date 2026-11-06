# drum-notation Specification

## Purpose

Stellt ein Drum-Pattern als Noten nach gängiger Schlagzeug-Notation dar, damit Drummer die Parts so lesen können, wie sie es von Drum-Charts gewohnt sind.

## Requirements

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

### Requirement: Systemposition je Instrument
Jedes Instrument MUST an einer festen Systemposition stehen (Linie 1 = unterste Linie):

| Instrument | Position |
|---|---|
| Hi-Hat-Pedal | Hilfslinie unter dem System |
| Bassdrum | Zwischenraum 1 |
| Standtom | Zwischenraum 2 |
| Snare | Zwischenraum 3 |
| Tom 2 | Linie 4 |
| Tom 1 | Zwischenraum 4 |
| Ride | Linie 5 |
| Hi-Hat (geschlossen/offen) | über Linie 5 |
| Crash | Hilfslinie über dem System |

#### Scenario: Snare und Bassdrum
- **WHEN** ein Pattern einen Snare- und einen Bassdrum-Schlag enthält
- **THEN** steht die Snare im Zwischenraum 3 und die Bassdrum im Zwischenraum 1

### Requirement: Notenköpfe
Becken (Crash, Ride, Hi-Hat geschlossen und offen) und das Hi-Hat-Pedal MUST mit x-Notenkopf dargestellt werden, Trommeln mit normalem Notenkopf. Die offene Hi-Hat MUST zusätzlich ein „o“ über der Note tragen.

#### Scenario: Becken mit x-Notenkopf
- **WHEN** ein Pattern einen Ride-Schlag enthält
- **THEN** erscheint er als x-Notenkopf auf Linie 5

#### Scenario: Offene Hi-Hat
- **WHEN** ein Pattern einen Schlag auf der offenen Hi-Hat enthält
- **THEN** erscheint er als x-Notenkopf im Zwischenraum über Linie 5 mit einem „o“ darüber

### Requirement: Hände und Füße als getrennte Stimmen
Bassdrum und Hi-Hat-Pedal MUST als untere Stimme mit Hälsen nach unten notiert werden, alle übrigen Instrumente als obere Stimme mit Hälsen nach oben. Gleichzeitige Schläge einer Stimme MUST als ein Akkord an einem gemeinsamen Hals erscheinen.

#### Scenario: Grundgroove
- **WHEN** ein Beat Hi-Hat und Bassdrum auf der „1“ und Hi-Hat und Snare auf dem „und“ hat
- **THEN** stehen Hi-Hat und Snare in der oberen Stimme mit Hälsen nach oben
- **AND** die Bassdrum steht in der unteren Stimme mit Hals nach unten

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

### Requirement: Notenbild in der Textfarbe des Farbschemas
Das Notenbild MUST alle Elemente (Notenlinien, Taktstriche, Schlüssel, Notenköpfe, Hälse, Balken, Pausen, Punkte, Triolenklammern und -ziffern, „o“ der offenen Hi-Hat) in der Textfarbe des aktiven Farbschemas zeichnen. Es MUST keine fest vorgegebene Farbe wie Schwarz verwenden.

#### Scenario: Notenbild im Dunkelmodus
- **WHEN** ein Pattern mit Triole und offener Hi-Hat bei dunkler Systemeinstellung dargestellt wird
- **THEN** sind alle Elemente des Notenbilds in Mocha „text“ gezeichnet und auf dem dunklen Hintergrund lesbar

#### Scenario: Keine fest vorgegebene Farbe
- **WHEN** ein beliebiges Pattern dargestellt wird
- **THEN** enthält das Notenbild keine fest vorgegebene Füll- oder Linienfarbe, sondern übernimmt die Textfarbe der Umgebung

### Requirement: Flam
Ein Schlag mit Flam MUST als Hauptnote mit einem durchgestrichenen Vorschlag auf derselben Systemposition unmittelbar davor dargestellt werden. Vorschlag und Hauptnote MUST durch einen Bogen unter den Notenköpfen verbunden sein. Stehen weitere Instrumente am selben Hals, MUST der Vorschlag nur für die Instrumente mit Flam erscheinen.

#### Scenario: Flam auf der Snare
- **WHEN** ein Beat einen Snare-Schlag mit Flam auf der „1“ hat
- **THEN** steht vor der Snare-Note ein durchgestrichener Vorschlag im Zwischenraum 3
- **AND** ein Bogen unter den Notenköpfen verbindet Vorschlag und Snare-Note

#### Scenario: Flam im Akkord
- **WHEN** auf der „1“ Hi-Hat und Snare mit Flam liegen
- **THEN** hat nur die Snare einen Vorschlag, die Hi-Hat nicht

### Requirement: Ghost Note
Ein Schlag als Ghost Note MUST mit einem Notenkopf in runden Klammern dargestellt werden. Stehen weitere Instrumente am selben Hals, MUST nur der Notenkopf der Ghost Note eingeklammert sein.

#### Scenario: Ghost Note auf der Snare
- **WHEN** ein Beat eine Snare-Ghost-Note auf Sechzehntel-Position 2 hat
- **THEN** erscheint dort ein eingeklammerter Snare-Notenkopf

#### Scenario: Ghost Note im Akkord
- **WHEN** auf derselben Position Hi-Hat und eine Snare-Ghost-Note liegen
- **THEN** ist nur der Snare-Notenkopf eingeklammert
