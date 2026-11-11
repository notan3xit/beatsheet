# Spec Delta

## MODIFIED Requirements

### Requirement: Export der Bibliothek
Der Nutzer MUST alle Songs als JSON-Datei exportieren können. Die Datei MUST eine Formatkennung, die Schemaversion 4 und alle Songs mit Titel, Tempo, Struktur, Patterns einschließlich der Spielweisen und Betonungen ihrer Schläge und Änderungsmetadaten enthalten.

#### Scenario: Export herunterladen
- **WHEN** der Nutzer am 3. November 2026 „Exportieren“ wählt
- **THEN** erhält er die Datei `beatsheet-2026-11-03.json`, die alle Songs enthält

#### Scenario: Export ist verlustfrei
- **WHEN** alle Songs exportiert und auf einem leeren Gerät wieder importiert werden
- **THEN** sind alle Songs mit identischen IDs, identischer Struktur und identischen Patterns vorhanden

#### Scenario: Spielweisen im Export
- **WHEN** ein Pattern eine Snare mit Flam und eine Ghost Note enthält und exportiert und wieder importiert wird
- **THEN** hat das importierte Pattern denselben Flam und dieselbe Ghost Note

#### Scenario: Neue Spielweisen und Betonung im Export
- **WHEN** ein Pattern einen betonten Rim Shot, einen Drag, eine Ride-Bell, einen Crash mit Choke und eine betonte Hi-Hat enthält und exportiert und wieder importiert wird
- **THEN** hat das importierte Pattern dieselben Spielweisen und Betonungen

#### Scenario: Tempo im Export
- **WHEN** ein Song mit Tempo 96 exportiert und wieder importiert wird
- **THEN** hat der importierte Song das Tempo 96
