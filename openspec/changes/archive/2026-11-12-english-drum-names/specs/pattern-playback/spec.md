# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Klang von Rim Shot, Cross-Stick, Glocke und Choke`
- TO: `### Requirement: Klang von Rim Shot, Cross-Stick, Bell und Choke`

## MODIFIED Requirements

### Requirement: Zeitliche Lage der Schläge
Jeder gesetzte Schlag MUST zu dem Zeitpunkt erklingen, den Beat, Position und Unterteilung seines Beats ergeben: Ein Beat dauert 60/Tempo Sekunden, und Position k (gezählt ab 1) eines Beats mit Unterteilung n liegt (k−1)/n Beats nach dessen Beginn. Gleichzeitige Schläge MUST gleichzeitig erklingen.

#### Scenario: Sechzehntel
- **WHEN** Beat 1 in Sechzehnteln einen Hi-Hat-Schlag auf Position 2 hat und das Tempo 120 BPM ist
- **THEN** erklingt die Hi-Hat 0,125 Sekunden nach Beginn des Durchlaufs

#### Scenario: Gemischte Unterteilung
- **WHEN** Beat 2 auf Achteltriolen steht, dort die Snare auf Position 3 liegt und das Tempo 60 BPM ist
- **THEN** erklingt die Snare 1⅔ Sekunden nach Beginn des Durchlaufs

#### Scenario: Gleichzeitige Schläge
- **WHEN** an derselben Position Kick Drum und Crash gesetzt sind
- **THEN** erklingen beide zum selben Zeitpunkt

### Requirement: Klang der Instrumente
Jedes der zehn Instrumente MUST mit einem eigenen Klang erklingen, je nach gewähltem Klang aus einer Aufnahme oder im Browser erzeugt (siehe `playback-sound`). Die Klänge MUST sich so unterscheiden, dass Kick Drum, Snare, die drei Toms, Hi-Hat geschlossen, Hi-Hat offen, Hi-Hat-Pedal, Ride und Crash einzeln erkennbar sind; die Toms MUST in der Tonhöhe von Tom 1 über Tom 2 zur Floor Tom abfallen. Spielweisen und das Abstoppen der offenen Hi-Hat MUST für beide Klänge gelten.

#### Scenario: Jedes Instrument klingt
- **WHEN** ein Pattern auf je einer eigenen Position einen Schlag jedes der zehn Instrumente enthält und abgespielt wird
- **THEN** erklingen zehn Schläge mit zehn verschiedenen Klängen

#### Scenario: Tonhöhe der Toms
- **WHEN** Tom 1, Tom 2 und Floor Tom nacheinander erklingen
- **THEN** ist Tom 1 am höchsten und die Floor Tom am tiefsten

#### Scenario: Offene Hi-Hat mit Aufnahmen abgestoppt
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** die offene Hi-Hat auf der „1“ und die geschlossene Hi-Hat auf der „2“ liegen
- **THEN** endet der Klang der offenen Hi-Hat auf der „2“

### Requirement: Klang von Rim Shot, Cross-Stick, Bell und Choke
Rim Shot, Cross-Stick und Ride-Bell MUST sich hörbar vom normalen Schlag des Instruments unterscheiden; ein Rim Shot MUST lauter und schärfer klingen als ein normaler Snare-Schlag, ein Cross-Stick leiser und kürzer. Ein Crash mit Choke MUST kurz nach seinem Einsatz abrupt enden.

#### Scenario: Rim Shot
- **WHEN** die Snare auf Position 1 einen Rim Shot und auf Position 3 einen normalen Schlag hat
- **THEN** erklingt der Schlag auf Position 1 lauter als der auf Position 3 und mit eigenem Klang

#### Scenario: Cross-Stick
- **WHEN** die Snare auf Position 1 einen Cross-Stick und auf Position 3 einen normalen Schlag hat
- **THEN** erklingt der Schlag auf Position 1 leiser und kürzer als der auf Position 3

#### Scenario: Ride-Bell
- **WHEN** die Ride auf Position 1 eine Bell und auf Position 3 einen normalen Schlag hat
- **THEN** erklingen beide Schläge mit verschiedenem Klang

#### Scenario: Choke
- **WHEN** die Crash auf der „1“ einen Choke und auf der „3“ einen normalen Schlag hat
- **THEN** ist der Klang auf der „1“ nach einem Bruchteil einer Sekunde verstummt, der auf der „3“ klingt nach
