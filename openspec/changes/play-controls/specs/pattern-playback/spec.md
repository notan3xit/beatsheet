# Spec Delta

## MODIFIED Requirements

### Requirement: Wiedergabe starten und stoppen
Der Pattern-Editor MUST eine Taste anbieten, die die Wiedergabe des geöffneten Patterns startet und, während sie läuft, wieder stoppt. Die Taste MUST zeigen, ob die Wiedergabe läuft. Ihr zugänglicher Name MUST „In Schleife abspielen“ bzw. „Stopp“ lauten.

#### Scenario: Wiedergabe starten
- **WHEN** der Nutzer im Pattern-Editor „In Schleife abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von Beat 1
- **AND** die Taste heißt „Stopp“

#### Scenario: Wiedergabe stoppen
- **WHEN** die Wiedergabe läuft und der Nutzer „Stopp“ wählt
- **THEN** erklingt kein weiterer Schlag
- **AND** die Taste heißt „In Schleife abspielen“

#### Scenario: Leeres Pattern
- **WHEN** der Nutzer ein Pattern ohne Schläge abspielt
- **THEN** läuft die Wiedergabe ohne Klang und ohne Fehler, und die Wiedergabeposition wandert durch das Raster

### Requirement: Audio nicht verfügbar
Kann der Browser kein Audio erzeugen, MUST die Abspiel-Taste deaktiviert sein und ein Hinweis erklären, dass die Wiedergabe in diesem Browser nicht möglich ist. Das Bearbeiten des Patterns MUST davon unberührt bleiben.

#### Scenario: Browser ohne Web Audio
- **WHEN** der Pattern-Editor in einem Browser ohne Audio-Unterstützung geöffnet wird
- **THEN** ist „In Schleife abspielen“ deaktiviert und ein Hinweis nennt den Grund
