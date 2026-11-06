# Spec Delta

## MODIFIED Requirements

### Requirement: Änderungen an verschiedenen Stellen zusammenführen
Zwei Fassungen desselben Songs, die ausgehend von einem gemeinsamen Stand unabhängig geändert wurden, MUST sich zusammenführen lassen. Änderungen an verschiedenen Stellen MUST dabei beide erhalten bleiben. Das Ergebnis MUST unabhängig davon sein, welche Fassung in welche zusammengeführt wird.

#### Scenario: Verschiedene Patterns
- **GIVEN** zwei Fassungen eines Songs mit den Grooves „Verse“ und „Chorus“
- **WHEN** in der einen Fassung bei „Verse“ eine Snare gesetzt wird und in der anderen bei „Chorus“ eine Bassdrum, und beide zusammengeführt werden
- **THEN** enthält „Verse“ die Snare und „Chorus“ die Bassdrum

#### Scenario: Pattern und Struktur
- **WHEN** in der einen Fassung ein Schlag in einem Groove gesetzt wird und in der anderen ein Segment angelegt wird, und beide zusammengeführt werden
- **THEN** enthält der Song den Schlag und das neue Segment

#### Scenario: Verschiedene Schläge im selben Beat
- **WHEN** in der einen Fassung im ersten Beat eines Grooves eine Snare und in der anderen eine Hi-Hat gesetzt wird, und beide zusammengeführt werden
- **THEN** enthält der erste Beat die Snare und die Hi-Hat

#### Scenario: Verschiedene Betonungen im selben Beat
- **WHEN** in der einen Fassung im ersten Beat eines Grooves die Bassdrum und in der anderen die Snare betont wird, und beide zusammengeführt werden
- **THEN** sind im ersten Beat beide Schläge betont

#### Scenario: Verschiedene Spielweisen im selben Beat
- **WHEN** in der einen Fassung im ersten Beat eines Grooves die Ride zur Glocke und in der anderen die Crash zum Choke wird, und beide zusammengeführt werden
- **THEN** enthält der erste Beat die Glocke und den Choke

#### Scenario: Reihenfolge des Zusammenführens
- **WHEN** zwei unabhängig geänderte Fassungen einmal A in B und einmal B in A zusammengeführt werden
- **THEN** sind beide Ergebnisse gleich

### Requirement: Fachliche Gültigkeit nach dem Zusammenführen
Ein zusammengeführter Song MUST die Strukturregeln des Dateiformats erfüllen und sich ohne Verlust exportieren und wieder importieren lassen. Verletzt die Kombination beider Fassungen eine Regel, MUST nur das regelwidrige Element verworfen oder begrenzt werden; alles andere MUST erhalten bleiben.

#### Scenario: Verweis auf gelöschtes Pattern
- **WHEN** die eine Fassung den Groove „Verse“ löscht und die andere „Verse“ einem Takt zuweist, und beide zusammengeführt werden
- **THEN** hat dieser Takt keinen Groove
- **AND** der Song lässt sich exportieren und wieder importieren

#### Scenario: Spielweise ohne Schlag
- **WHEN** die eine Fassung eine Snare entfernt und die andere derselben Snare einen Flam gibt, und beide zusammengeführt werden
- **THEN** liegt an dieser Position weder eine Snare noch ein Flam

#### Scenario: Betonung ohne Schlag
- **WHEN** die eine Fassung eine Snare entfernt und die andere dieselbe Snare betont, und beide zusammengeführt werden
- **THEN** liegt an dieser Position weder eine Snare noch eine Betonung

#### Scenario: Betonung und Ghost Note
- **WHEN** die eine Fassung eine Snare betont und die andere dieselbe Snare zur Ghost Note macht, und beide zusammengeführt werden
- **THEN** ist der Schlag eine unbetonte Ghost Note

#### Scenario: Offene und geschlossene Hi-Hat an derselben Position
- **WHEN** die eine Fassung an einer Position die geschlossene Hi-Hat setzt und die andere an derselben Position die offene, und beide zusammengeführt werden
- **THEN** liegt an dieser Position genau eine der beiden Hi-Hats, unabhängig von der Reihenfolge des Zusammenführens

#### Scenario: Pattern zu lang
- **WHEN** beide Fassungen einen Groove der Länge 10 unabhängig auf 16 Beats verlängern und zusammengeführt werden
- **THEN** hat der Groove höchstens 16 Beats

#### Scenario: Akzent außerhalb des Takts
- **WHEN** die eine Fassung einen Takt von 4 auf 3 Beats verkürzt und die andere auf dessen viertem Beat einen Akzent setzt, und beide zusammengeführt werden
- **THEN** hat der Takt 3 Beats und keinen Akzent auf dem vierten Beat
