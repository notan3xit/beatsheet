# Spec Delta

## MODIFIED Requirements

### Requirement: Wiedergabe starten und stoppen
Der Pattern-Editor MUST zwei Abspiel-Knöpfe anbieten: „Einmal abspielen“ und „In Schleife abspielen“. Beide MUST die Wiedergabe des geöffneten Patterns am Anfang von Beat 1 starten. Während der Wiedergabe MUST der Knopf des laufenden Modus „Stopp“ heißen und die Wiedergabe beenden.

#### Scenario: Wiedergabe starten
- **WHEN** der Nutzer im Pattern-Editor „In Schleife abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von Beat 1
- **AND** der Knopf heißt „Stopp“

#### Scenario: Einmal starten
- **WHEN** der Nutzer im Pattern-Editor „Einmal abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von Beat 1
- **AND** der Knopf heißt „Stopp“

#### Scenario: Wiedergabe stoppen
- **WHEN** die Wiedergabe in Schleife läuft und der Nutzer „Stopp“ wählt
- **THEN** erklingt kein weiterer Schlag
- **AND** die Knöpfe heißen „Einmal abspielen“ und „In Schleife abspielen“

#### Scenario: Leeres Pattern
- **WHEN** der Nutzer ein Pattern ohne Schläge abspielt
- **THEN** läuft die Wiedergabe ohne Klang und ohne Fehler, und die Wiedergabeposition wandert durch das Raster

### Requirement: Wiedergabe in der Schleife
In Schleife MUST die Wiedergabe nach dem letzten Beat des Patterns ohne Pause wieder bei Beat 1 beginnen und so lange laufen, bis der Nutzer sie stoppt oder den Pattern-Editor verlässt. Einmal gestartet MUST sie nach dem letzten Beat von selbst enden.

#### Scenario: Zweiter Durchlauf
- **WHEN** ein Pattern mit 4 Beats bei 120 BPM in Schleife abgespielt wird
- **THEN** beginnt der zweite Durchlauf genau 2 Sekunden nach dem ersten

#### Scenario: Ende eines einmaligen Durchlaufs
- **WHEN** ein Pattern mit 4 Beats bei 120 BPM einmal abgespielt wird
- **THEN** endet die Wiedergabe nach 2 Sekunden, die Knöpfe heißen wieder „Einmal abspielen“ und „In Schleife abspielen“, und keine Spalte des Sequencers ist hervorgehoben

### Requirement: Tempo im Pattern-Editor
Der Pattern-Editor MUST das Tempo des Songs vor den Abspiel-Knöpfen als „♩ = <BPM> (Song-Tempo)“ zeigen und ändern lassen. Die Angabe MUST sich wie die Tempoangabe auf der Doppelseite bedienen lassen. Eine Änderung MUST für alle Patterns des Songs gelten und eine laufende Wiedergabe ab dem nächsten Schlag im neuen Tempo fortsetzen. Ein ungültiger Wert MUST abgelehnt werden; die Angabe zeigt dann wieder das bisherige Tempo.

#### Scenario: Tempo ändern
- **WHEN** der Nutzer im Pattern-Editor das Tempo von 120 auf 90 BPM ändert
- **THEN** steht dort „♩ = 90 (Song-Tempo)“
- **AND** im Pattern-Editor eines anderen Patterns desselben Songs steht ebenfalls „♩ = 90 (Song-Tempo)“

#### Scenario: Kennzeichnung als Song-Tempo
- **WHEN** der Nutzer im Song „Hysteria“ den Pattern-Editor des Grooves „Verse“ öffnet
- **THEN** steht vor den Abspiel-Knöpfen „♩ = 120 (Song-Tempo)“

#### Scenario: Eingabe verwerfen
- **WHEN** der Nutzer im Pattern-Editor auf „♩ = 120“ klickt, 96 eingibt und Escape drückt
- **THEN** steht weiterhin „♩ = 120 (Song-Tempo)“ und der Song ist unverändert

#### Scenario: Tempo während der Wiedergabe
- **WHEN** die Wiedergabe läuft und der Nutzer das Tempo ändert
- **THEN** läuft die Wiedergabe ohne Neustart im neuen Tempo weiter

#### Scenario: Ungültiges Tempo
- **WHEN** der Nutzer als Tempo 0 eingibt
- **THEN** zeigt die Angabe wieder das bisherige Tempo und der Song bleibt unverändert

### Requirement: Audio nicht verfügbar
Kann der Browser kein Audio erzeugen, MUST die Abspiel-Knöpfe deaktiviert sein und ein Hinweis erklären, dass die Wiedergabe in diesem Browser nicht möglich ist. Das Bearbeiten des Patterns MUST davon unberührt bleiben.

#### Scenario: Browser ohne Web Audio
- **WHEN** der Pattern-Editor in einem Browser ohne Audio-Unterstützung geöffnet wird
- **THEN** sind „Einmal abspielen“ und „In Schleife abspielen“ deaktiviert und ein Hinweis nennt den Grund
