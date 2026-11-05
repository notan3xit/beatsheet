# Spec Delta

## ADDED Requirements

### Requirement: Logo in der Kopfzeile
Zwischen Menü-Knopf und Konto-Symbol MUST die Kopfzeile das Logo als Überschrift zeigen: links das Symbol einer Roten Beete, rechts daneben den Schriftzug „beatsheet“. Die Überschrift MUST den zugänglichen Namen „Beatsheet“ tragen; Symbol und Striche MUST für Screenreader verborgen sein.

#### Scenario: Aufbau
- **WHEN** die Kopfzeile erscheint
- **THEN** stehen von links nach rechts Menü-Knopf, Beeten-Symbol, Schriftzug und Konto-Symbol

#### Scenario: Zugänglicher Name
- **WHEN** ein Screenreader die Kopfzeile liest
- **THEN** nennt er die Überschrift „Beatsheet“

### Requirement: Beeten-Symbol
Das Symbol MUST eine rundliche Knolle mit nach unten auslaufender Wurzelspitze und darüber grüne Blätter zeigen. Die Knolle MUST in einer Mischung aus „mauve“ und „maroon“ der aktiven Variante gehalten sein, die Blätter in „green“. Das Symbol MUST höher sein als die Kleinbuchstaben des Schriftzugs und mit ihm vertikal zentriert stehen.

#### Scenario: Farben im Hellmodus
- **WHEN** die Kopfzeile bei heller Systemeinstellung erscheint
- **THEN** ist die Knolle eine Mischung aus Latte „mauve“ und „maroon“ und die Blätter sind Latte „green“

#### Scenario: Farben im Dunkelmodus
- **WHEN** die Kopfzeile bei dunkler Systemeinstellung erscheint
- **THEN** ist die Knolle eine Mischung aus Mocha „mauve“ und „maroon“ und die Blätter sind Mocha „green“

### Requirement: Schrift des Schriftzugs
Der Schriftzug MUST in Kleinbuchstaben in der Schrift Comfortaa (fett) stehen. Die App MUST die Schrift selbst ausliefern, ohne Abruf von einem fremden Server. Die übrige Oberfläche MUST ihre bisherige Schrift behalten.

#### Scenario: Schrift
- **WHEN** die Kopfzeile erscheint
- **THEN** stehen die Buchstaben „b“, „a“, „t“, „s“, „h“ und „t“ des Schriftzugs in Comfortaa
- **AND** Menüeinträge und Seiteninhalt stehen in der bisherigen Schrift

#### Scenario: Keine fremde Quelle
- **WHEN** die App geladen wird
- **THEN** lädt sie die Schrift vom eigenen Server und von keinem anderen

### Requirement: „e“ aus drei Strichen
Jedes „e“ des Schriftzugs MUST aus drei waagerechten Strichen mit runden Enden bestehen, oberer und unterer gleich lang, der mittlere kürzer und links bündig. Der obere Strich MUST mit der Oberkante der Kleinbuchstaben abschließen, der untere auf der Grundlinie stehen. Jeder Strich MUST eine Akzentfarbe der aktiven Variante ungleich „red“ haben, die Striche eines „e“ MUST verschiedene Farben haben.

#### Scenario: Form
- **WHEN** die Kopfzeile erscheint
- **THEN** besteht jedes der drei „e“ aus drei waagerechten Strichen, der mittlere kürzer als die beiden anderen

#### Scenario: Höhe wie die Kleinbuchstaben
- **WHEN** die Kopfzeile erscheint
- **THEN** reichen die Striche eines „e“ von der Grundlinie bis zur Oberkante der Kleinbuchstaben wie „a“ und „s“

#### Scenario: Farben
- **WHEN** die Kopfzeile in hellem oder dunklem Farbschema erscheint
- **THEN** hat jeder Strich eine Akzentfarbe der aktiven Variante ungleich „red“
- **AND** die drei Striche eines „e“ unterscheiden sich in der Farbe
