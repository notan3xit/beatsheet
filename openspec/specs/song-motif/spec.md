# song-motif Specification

## Purpose

Leitet aus der Struktur eines Songs ein stilisiertes Motiv ab, das seine Kachel in der Song-Übersicht schmückt. Es soll den Song wiedererkennbar machen, nicht lesbar.

## Requirements

### Requirement: Aufbau des Motivs
Das Motiv MUST je Zeile der Strukturseite eine Reihe zeigen, in derselben Reihenfolge. Aufeinanderfolgende Takte einer Zeile mit demselben Groove MUST einen einzigen Strich bilden, ein Fill MUST ein eigener Strich an seiner Stelle sein, ein Takt ohne Groove und Fill MUST ein Punkt sein. Länge und Lage eines Strichs MUST seinem Anteil an den 16 Beats einer Zeile entsprechen.

#### Scenario: Gleicher Groove über mehrere Takte
- **WHEN** eine Zeile aus vier Takten mit Groove „Verse“ besteht
- **THEN** zeigt ihre Reihe einen einzigen Strich über die ganze Breite

#### Scenario: Fill am Ende einer Phrase
- **WHEN** der vierte von vier Takten mit Groove „Verse“ in den letzten zwei Beats einen Fill hat
- **THEN** zeigt die Reihe einen Strich für „Verse“ über die ersten 14 Beats und einen Strich für den Fill über die letzten 2

#### Scenario: Leerer Takt
- **WHEN** eine Zeile zwei leere Takte und zwei Takte mit Groove hat
- **THEN** zeigt die Reihe zwei Punkte und einen Strich

#### Scenario: Blöcke und Segmente
- **WHEN** ein Song zwei Segmente mit je zwei Blöcken zu vier Takten hat
- **THEN** zeigt das Motiv vier Reihen

### Requirement: Darstellung des Motivs
Striche MUST die Farbe ihres Patterns tragen, Grooves gedämpft und Fills in voller Farbe, mit abgerundeten Enden. Taktstriche, Beschriftungen und Akzente MUST das Motiv nicht zeigen. Der Abstand zwischen zwei Reihen MUST überall gleich sein, auch an Grenzen von Blöcken und Segmenten. Striche und Abstände MUST in jeder Kachel gleich groß sein. Das Motiv MUST höchstens die ersten 12 Reihen zeigen; weitere Reihen MUST es weglassen.

#### Scenario: Gleichmäßige Abstände
- **WHEN** ein Song aus mehreren Segmenten und Blöcken dargestellt wird
- **THEN** haben alle Reihen des Motivs denselben Abstand zueinander

#### Scenario: Langer Song
- **WHEN** ein Song 120 Takte in Blöcken zu je 4 Takten hat
- **THEN** zeigt seine Kachel die ersten 12 Reihen
- **AND** seine Striche sind so hoch wie die eines Songs mit 4 Takten

### Requirement: Motiv eines leeren Songs
Ein Song ohne Segmente MUST ein dezentes Muster aus Punkten zeigen.

#### Scenario: Neuer Song
- **WHEN** ein Song noch keine Segmente hat
- **THEN** zeigt seine Kachel ein Muster aus Punkten und keine Striche
