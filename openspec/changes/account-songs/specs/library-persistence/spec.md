# Spec Delta

## MODIFIED Requirements

### Requirement: Dauerhaften Speicher anfordern
Die App MUST beim Browser dauerhaften Speicher anfordern, damit lokale Daten nicht automatisch gelöscht werden. Gewährt der Browser ihn nicht, MUST die App den Nutzer darauf hinweisen. Ohne Anmeldung MUST sie den Export als Sicherung empfehlen. Angemeldet MUST sie nennen, dass die Songs im Account liegen und nur noch nicht übertragene Änderungen verloren gehen könnten.

#### Scenario: Speicher nicht dauerhaft
- **GIVEN** der Nutzer ist nicht angemeldet
- **WHEN** der Browser dauerhaften Speicher verweigert
- **THEN** zeigt die App einen Hinweis, dass Daten gelöscht werden könnten, mit einem Verweis auf den Export

#### Scenario: Speicher nicht dauerhaft, angemeldet
- **GIVEN** der Nutzer ist angemeldet
- **WHEN** der Browser dauerhaften Speicher verweigert
- **THEN** zeigt die App einen Hinweis, dass die Songs im Account liegen und nur noch nicht übertragene Änderungen verloren gehen könnten
