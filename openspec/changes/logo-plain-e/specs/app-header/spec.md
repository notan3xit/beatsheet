## MODIFIED Requirements

### Requirement: Schrift des Schriftzugs
Der Schriftzug MUST in Kleinbuchstaben in der Schrift Comfortaa (fett) stehen. Das „e“ von „beat“ MUST ein normaler Buchstabe dieser Schrift sein. Die App MUST die Schrift selbst ausliefern, ohne Abruf von einem fremden Server. Die übrige Oberfläche MUST ihre bisherige Schrift behalten.

#### Scenario: Schrift
- **WHEN** die Kopfzeile erscheint
- **THEN** stehen die Buchstaben von „beatsh“ und das abschließende „t“ des Schriftzugs in Comfortaa
- **AND** Menüeinträge und Seiteninhalt stehen in der bisherigen Schrift

#### Scenario: Keine fremde Quelle
- **WHEN** die App geladen wird
- **THEN** lädt sie die Schrift vom eigenen Server und von keinem anderen

### Requirement: „e“ aus drei Strichen
Die beiden „e“ von „sheet“ MUST aus je drei waagerechten Strichen mit runden Enden bestehen, oberer und unterer gleich lang, der mittlere kürzer und links bündig. Der obere Strich MUST mit der Oberkante der Kleinbuchstaben abschließen, der untere auf der Grundlinie stehen. Jeder Strich MUST eine Akzentfarbe der aktiven Variante ungleich „red“ haben, die Striche eines „e“ MUST verschiedene Farben haben.

#### Scenario: Form
- **WHEN** die Kopfzeile erscheint
- **THEN** bestehen die beiden „e“ von „sheet“ aus je drei waagerechten Strichen, der mittlere kürzer als die beiden anderen
- **AND** das „e“ von „beat“ besteht nicht aus Strichen

#### Scenario: Höhe wie die Kleinbuchstaben
- **WHEN** die Kopfzeile erscheint
- **THEN** reichen die Striche eines „e“ von der Grundlinie bis zur Oberkante der Kleinbuchstaben wie „a“ und „s“

#### Scenario: Farben
- **WHEN** die Kopfzeile in hellem oder dunklem Farbschema erscheint
- **THEN** hat jeder Strich eine Akzentfarbe der aktiven Variante ungleich „red“
- **AND** die drei Striche eines „e“ unterscheiden sich in der Farbe
