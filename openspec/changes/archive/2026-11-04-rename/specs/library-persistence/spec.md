# Spec Delta

## MODIFIED Requirements

### Requirement: Export der Bibliothek
Der Nutzer MUST alle Songs als JSON-Datei exportieren können. Die Datei MUST eine Formatkennung, die Schemaversion 3 und alle Songs mit Titel, Tempo, Struktur, Patterns einschließlich der Spielweisen ihrer Schläge und Änderungsmetadaten enthalten.

#### Scenario: Export herunterladen
- **WHEN** der Nutzer am 3. November 2026 „Exportieren“ wählt
- **THEN** erhält er die Datei `beatsheet-2026-11-03.json`, die alle Songs enthält

#### Scenario: Export ist verlustfrei
- **WHEN** alle Songs exportiert und auf einem leeren Gerät wieder importiert werden
- **THEN** sind alle Songs mit identischen IDs, identischer Struktur und identischen Patterns vorhanden

#### Scenario: Spielweisen im Export
- **WHEN** ein Pattern eine Snare mit Flam und eine Ghost Note enthält und exportiert und wieder importiert wird
- **THEN** hat das importierte Pattern denselben Flam und dieselbe Ghost Note

#### Scenario: Tempo im Export
- **WHEN** ein Song mit Tempo 96 exportiert und wieder importiert wird
- **THEN** hat der importierte Song das Tempo 96

## ADDED Requirements

### Requirement: Exporte unter dem früheren Namen
Dateien, die die App unter ihrem früheren Namen drumstuff exportiert hat (Formatkennung `drumstuff.library`, Endung `.drumbook.json`), MUST sich wie aktuelle Exporte importieren lassen.

#### Scenario: Alter Export
- **WHEN** der Nutzer die Datei `drumstuff-2026-11-02.drumbook.json` mit der Formatkennung `drumstuff.library` und zwei Songs importiert
- **THEN** sind beide Songs mit unveränderten IDs vorhanden
