# Spec Delta

## MODIFIED Requirements

### Requirement: Abmelden
Der angemeldete Nutzer MUST sich abmelden können. Die Sitzung MUST danach auch auf dem Server ungültig sein. Songs, die zum Account gehören, MUST im Account erhalten bleiben und das Gerät nach `account-songs` verlassen. Nur lokale Songs MUST unverändert auf dem Gerät bleiben.

#### Scenario: Abmelden
- **WHEN** der angemeldete Nutzer „Abmelden“ wählt
- **THEN** zeigt die App wieder „Anmelden“
- **AND** seine Songs stehen unverändert im Account und erscheinen bei der nächsten Anmeldung wieder

#### Scenario: Alte Sitzung nach dem Abmelden
- **WHEN** nach dem Abmelden mit dem Sitzungsschlüssel der beendeten Sitzung angefragt wird
- **THEN** behandelt der Server die Anfrage als nicht angemeldet
