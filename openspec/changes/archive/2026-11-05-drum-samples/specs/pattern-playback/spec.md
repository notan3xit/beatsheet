# Spec Delta

## MODIFIED Requirements

### Requirement: Klang der Instrumente
Jedes der zehn Instrumente MUST mit einem eigenen Klang erklingen, je nach gewähltem Klang aus einer Aufnahme oder im Browser erzeugt (siehe `playback-sound`). Die Klänge MUST sich so unterscheiden, dass Bassdrum, Snare, die drei Toms, Hi-Hat geschlossen, Hi-Hat offen, Hi-Hat-Pedal, Ride und Crash einzeln erkennbar sind; die Toms MUST in der Tonhöhe von Tom 1 über Tom 2 zum Standtom abfallen. Spielweisen und das Abstoppen der offenen Hi-Hat MUST für beide Klänge gelten.

#### Scenario: Jedes Instrument klingt
- **WHEN** ein Pattern auf je einer eigenen Position einen Schlag jedes der zehn Instrumente enthält und abgespielt wird
- **THEN** erklingen zehn Schläge mit zehn verschiedenen Klängen

#### Scenario: Tonhöhe der Toms
- **WHEN** Tom 1, Tom 2 und Standtom nacheinander erklingen
- **THEN** ist Tom 1 am höchsten und das Standtom am tiefsten

#### Scenario: Offene Hi-Hat mit Aufnahmen abgestoppt
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** die offene Hi-Hat auf der „1“ und die geschlossene Hi-Hat auf der „2“ liegen
- **THEN** endet der Klang der offenen Hi-Hat auf der „2“
