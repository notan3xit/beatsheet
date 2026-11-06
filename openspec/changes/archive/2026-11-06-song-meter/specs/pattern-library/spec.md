# Spec Delta

## MODIFIED Requirements

### Requirement: Pattern anlegen
Das System MUST das Anlegen eines Patterns mit Typ (Groove oder Fill), Name und Länge in Beats innerhalb eines Songs ermöglichen; das Pattern gehört ausschließlich zu diesem Song. Ein Beat entspricht einer Viertelnote. Die Länge MUST eine ganze Zahl von 1 bis 16 sein. Ohne Angaben gilt für einen Groove die Beat-Zahl des Standard-Takts des Songs und für einen Fill 1 Beat. Jedes Pattern MUST eine stabile, eindeutige ID erhalten, die sich nie ändert.

#### Scenario: Groove mit Standardwerten anlegen
- **WHEN** der Nutzer in einem Song in 4/4 einen neuen Groove anlegt, ohne die Länge anzugeben
- **THEN** existiert ein Pattern vom Typ Groove mit 4 Beats und einer eindeutigen ID
- **AND** alle Beats sind leer und in Sechzehnteln unterteilt

#### Scenario: Groove im Standard-Takt anlegen
- **WHEN** der Nutzer in einem Song in 7/4 einen neuen Groove anlegt, ohne die Länge anzugeben
- **THEN** existiert ein Pattern vom Typ Groove mit 7 Beats ohne eigene Taktart

#### Scenario: Fill mit Standardwerten anlegen
- **WHEN** der Nutzer in einem Song in 7/4 einen neuen Fill anlegt, ohne die Länge anzugeben
- **THEN** existiert ein Pattern vom Typ Fill mit 1 Beat

#### Scenario: Ungültige Länge
- **WHEN** der Nutzer ein Pattern mit der Länge 0 oder 17 anlegen will
- **THEN** wird das Pattern nicht angelegt und der Nutzer erhält einen Hinweis auf den erlaubten Bereich 1 bis 16

#### Scenario: Pattern gehört zum Song
- **WHEN** der Nutzer im Song „Hysteria“ einen Groove anlegt
- **THEN** erscheint der Groove nur bei „Hysteria“ und in keinem anderen Song
