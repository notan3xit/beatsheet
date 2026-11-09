## ADDED Requirements

### Requirement: Song kopieren
Jede Song-Kachel MUST ein Symbol „Kopieren“ tragen, in „Meine Songs“ wie in Workbooks, auch ohne Anmeldung. Nach bestätigter Rückfrage MUST in „Meine Songs“ ein Song „<Titel> (Kopie)“ mit neuer ID entstehen, mit Tempo, Standard-Takt, Patterns und Struktur des Originals. Die Kopie MUST ohne den Verlauf des Originals beginnen und von ihm unabhängig sein. Das Original MUST unverändert bleiben. Abbrechen und Escape MUST nichts ändern.

#### Scenario: Eigenen Song kopieren
- **GIVEN** „Skizze“ liegt in „Meine Songs“
- **WHEN** der Nutzer an der Kachel „Skizze“ „Kopieren“ wählt und die Rückfrage bestätigt
- **THEN** stehen „Skizze“ und „Skizze (Kopie)“ in „Meine Songs“, mit denselben Takten und Patterns

#### Scenario: Song aus einem Workbook kopieren
- **GIVEN** „Uprising“ liegt in „Band“
- **WHEN** der Nutzer an der Kachel „Uprising“ „Kopieren“ wählt und die Rückfrage bestätigt
- **THEN** steht „Uprising (Kopie)“ in „Meine Songs“
- **AND** „Uprising“ steht unverändert in „Band“, und die anderen Mitglieder von „Band“ sehen die Kopie nicht

#### Scenario: Kopie ist unabhängig
- **GIVEN** der Nutzer hat „Uprising“ aus „Band“ kopiert
- **WHEN** er das Tempo von „Uprising (Kopie)“ ändert
- **THEN** behält „Uprising“ in „Band“ sein Tempo

#### Scenario: Kopie ohne Verlauf
- **GIVEN** „Uprising“ hat Bearbeitungen mehrerer Mitglieder von „Band“
- **WHEN** der Nutzer den Verlauf von „Uprising (Kopie)“ öffnet
- **THEN** enthält er keine Bearbeitung aus „Uprising“

#### Scenario: Kopieren abgebrochen
- **WHEN** der Nutzer an der Kachel „Skizze“ „Kopieren“ wählt und die Rückfrage abbricht oder Escape drückt
- **THEN** bleibt „Meine Songs“ unverändert

#### Scenario: Ohne Anmeldung
- **GIVEN** der Nutzer ist nicht angemeldet
- **WHEN** er „Skizze“ kopiert
- **THEN** steht „Skizze (Kopie)“ in „Meine Songs“, und der Server kennt den Song nicht

### Requirement: Rückfrage beim Kopieren aus einem Workbook
Für einen Song aus einem Workbook MUST die Rückfrage „„<Titel>“ nach „Meine Songs“ kopieren?“ lauten und nennen: Die Kopie ist zunächst privat und lässt sich durch Aufnahme in ein Workbook wieder teilen; der Song im Workbook bleibt unverändert; die Kopie beginnt ohne Verlauf. Die Knöpfe MUST „Abbrechen“ und „Kopieren“ heißen.

#### Scenario: Rückfrage für einen Workbook-Song
- **WHEN** der Nutzer an der Kachel „Uprising“ in „Band“ „Kopieren“ wählt
- **THEN** fragt die App „„Uprising“ nach „Meine Songs“ kopieren?“ mit den Knöpfen „Abbrechen“ und „Kopieren“

### Requirement: Rückfrage beim Kopieren eines eigenen Songs
Für einen Song aus „Meine Songs“ MUST die Rückfrage „„<Titel>“ kopieren?“ lauten und nennen: Die Kopie liegt in „Meine Songs“; das Original bleibt unverändert; die Kopie beginnt ohne Verlauf. Die Knöpfe MUST „Abbrechen“ und „Kopieren“ heißen.

#### Scenario: Rückfrage für einen eigenen Song
- **WHEN** der Nutzer an der Kachel „Skizze“ in „Meine Songs“ „Kopieren“ wählt
- **THEN** fragt die App „„Skizze“ kopieren?“ mit den Knöpfen „Abbrechen“ und „Kopieren“
