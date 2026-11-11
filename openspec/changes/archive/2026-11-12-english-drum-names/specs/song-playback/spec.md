# Spec Delta

## MODIFIED Requirements

### Requirement: Klang aus der Struktur
Die Wiedergabe MUST jeden Takt so spielen, wie die Song-Struktur ihn festlegt: den Groove mit seinem Fortlauf über gleiche Takte im Block, den Fill statt des Grooves in den Beats, die er überdeckt, und die Akzente des Takts zusätzlich zu Groove oder Fill. Takte ohne Groove und ohne Fill MUST still bleiben, abgesehen von ihren Akzenten. Zeitpunkte, Klänge und Spielweisen der Schläge MUST denen der Pattern-Wiedergabe entsprechen, im Song-Tempo.

#### Scenario: Groove-Fortlauf
- **WHEN** ein Block aus zwei 4-Beat-Takten mit einem 8-Beat-Groove besteht, der nur auf Beat 5 eine Snare hat, und der Song bei 120 BPM abgespielt wird
- **THEN** erklingt die Snare 2 Sekunden nach Beginn, auf der Eins von Takt 2

#### Scenario: Fill überdeckt den Groove
- **WHEN** zwei 4-Beat-Takte einen Groove mit Kick Drum auf jedem Beat haben, Takt 2 einen 1-Beat-Fill mit Snare auf der Eins trägt und der Song bei 120 BPM abgespielt wird
- **THEN** erklingt 3,5 Sekunden nach Beginn die Snare und keine Kick Drum

#### Scenario: Akzent im leeren Takt
- **WHEN** Takt 1 weder Groove noch Fill hat, aber einen Crash-Akzent auf der Eins
- **THEN** erklingt beim Abspielen nur der Crash zu Beginn von Takt 1

#### Scenario: Akzent zusätzlich zum Groove
- **WHEN** Takt 1 einen Groove mit Kick Drum auf der Eins und einen Crash-Akzent auf der Eins hat
- **THEN** erklingen zu Beginn von Takt 1 Kick Drum und Crash gleichzeitig
