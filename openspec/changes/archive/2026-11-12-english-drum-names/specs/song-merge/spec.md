# Spec Delta

## MODIFIED Requirements

### Requirement: Änderungen an verschiedenen Stellen zusammenführen
Zwei Fassungen desselben Songs, die ausgehend von einem gemeinsamen Stand unabhängig geändert wurden, MUST sich zusammenführen lassen. Änderungen an verschiedenen Stellen MUST dabei beide erhalten bleiben. Das Ergebnis MUST unabhängig davon sein, welche Fassung in welche zusammengeführt wird.

#### Scenario: Verschiedene Patterns
- **GIVEN** zwei Fassungen eines Songs mit den Grooves „Verse“ und „Chorus“
- **WHEN** in der einen Fassung bei „Verse“ eine Snare gesetzt wird und in der anderen bei „Chorus“ eine Kick Drum, und beide zusammengeführt werden
- **THEN** enthält „Verse“ die Snare und „Chorus“ die Kick Drum

#### Scenario: Pattern und Struktur
- **WHEN** in der einen Fassung ein Schlag in einem Groove gesetzt wird und in der anderen ein Segment angelegt wird, und beide zusammengeführt werden
- **THEN** enthält der Song den Schlag und das neue Segment

#### Scenario: Verschiedene Schläge im selben Beat
- **WHEN** in der einen Fassung im ersten Beat eines Grooves eine Snare und in der anderen eine Hi-Hat gesetzt wird, und beide zusammengeführt werden
- **THEN** enthält der erste Beat die Snare und die Hi-Hat

#### Scenario: Verschiedene Betonungen im selben Beat
- **WHEN** in der einen Fassung im ersten Beat eines Grooves die Kick Drum und in der anderen die Snare betont wird, und beide zusammengeführt werden
- **THEN** sind im ersten Beat beide Schläge betont

#### Scenario: Verschiedene Spielweisen im selben Beat
- **WHEN** in der einen Fassung im ersten Beat eines Grooves die Ride zur Bell und in der anderen die Crash zum Choke wird, und beide zusammengeführt werden
- **THEN** enthält der erste Beat die Bell und den Choke

#### Scenario: Reihenfolge des Zusammenführens
- **WHEN** zwei unabhängig geänderte Fassungen einmal A in B und einmal B in A zusammengeführt werden
- **THEN** sind beide Ergebnisse gleich
