# Spec Delta

## ADDED Requirements

### Requirement: Workbook-Songs im Import
Der Export MUST auch die Songs aus Workbooks enthalten. Wählt der Nutzer im Import-Dialog für einen Song, der zu einem Workbook gehört, „Ersetzen“, MUST der Dialog vor der Übernahme darauf hinweisen, dass die Änderung alle Mitglieder des Workbooks betrifft. Der ersetzte Song MUST im Workbook bleiben. Ein als Kopie importierter Song MUST in „Meine Songs“ landen.

#### Scenario: Workbook-Song ersetzen
- **GIVEN** „Intro“ gehört zu „Band“
- **WHEN** der Nutzer eine Datei mit „Intro“ importiert und für „Intro“ „Ersetzen“ wählt
- **THEN** nennt der Dialog, dass die Änderung alle Mitglieder von „Band“ betrifft
- **AND** nach der Übernahme sehen alle Mitglieder von „Band“ „Intro“ in der Fassung der Datei

#### Scenario: Workbook-Song als Kopie
- **WHEN** der Nutzer „Intro“ aus „Band“ als Kopie importiert
- **THEN** steht „Intro (Kopie)“ in „Meine Songs“ und „Intro“ in „Band“ ist unverändert

#### Scenario: Export
- **WHEN** der Nutzer exportiert, während „Intro“ zu „Band“ gehört
- **THEN** enthält die Datei „Intro“
