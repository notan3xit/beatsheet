# pattern-playback Specification

## Purpose

Macht das im Pattern-Editor geöffnete Pattern hörbar: Es wird mit synthetisierten Drum-Klängen im Tempo seines Songs in einer Schleife abgespielt, damit der Nutzer seine Eingabe akustisch prüfen kann.

## Requirements

### Requirement: Wiedergabe starten und stoppen
Der Pattern-Editor MUST eine Taste anbieten, die die Wiedergabe des geöffneten Patterns startet und, während sie läuft, wieder stoppt. Die Taste MUST zeigen, ob die Wiedergabe läuft. Ihr zugänglicher Name MUST „Abspielen“ bzw. „Stopp“ lauten.

#### Scenario: Wiedergabe starten
- **WHEN** der Nutzer im Pattern-Editor „Abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von Beat 1
- **AND** die Taste heißt „Stopp“

#### Scenario: Wiedergabe stoppen
- **WHEN** die Wiedergabe läuft und der Nutzer „Stopp“ wählt
- **THEN** erklingt kein weiterer Schlag
- **AND** die Taste heißt „Abspielen“

#### Scenario: Leeres Pattern
- **WHEN** der Nutzer ein Pattern ohne Schläge abspielt
- **THEN** läuft die Wiedergabe ohne Klang und ohne Fehler, und die Wiedergabeposition wandert durch das Raster

### Requirement: Wiedergabe in der Schleife
Die Wiedergabe MUST nach dem letzten Beat des Patterns ohne Pause wieder bei Beat 1 beginnen und so lange laufen, bis der Nutzer sie stoppt oder den Pattern-Editor verlässt.

#### Scenario: Zweiter Durchlauf
- **WHEN** ein Pattern mit 4 Beats bei 120 BPM abgespielt wird
- **THEN** beginnt der zweite Durchlauf genau 2 Sekunden nach dem ersten

### Requirement: Zeitliche Lage der Schläge
Jeder gesetzte Schlag MUST zu dem Zeitpunkt erklingen, den Beat, Position und Unterteilung seines Beats ergeben: Ein Beat dauert 60/Tempo Sekunden, und Position k (gezählt ab 1) eines Beats mit Unterteilung n liegt (k−1)/n Beats nach dessen Beginn. Gleichzeitige Schläge MUST gleichzeitig erklingen.

#### Scenario: Sechzehntel
- **WHEN** Beat 1 in Sechzehnteln einen Hi-Hat-Schlag auf Position 2 hat und das Tempo 120 BPM ist
- **THEN** erklingt die Hi-Hat 0,125 Sekunden nach Beginn des Durchlaufs

#### Scenario: Gemischte Unterteilung
- **WHEN** Beat 2 auf Achteltriolen steht, dort die Snare auf Position 3 liegt und das Tempo 60 BPM ist
- **THEN** erklingt die Snare 1⅔ Sekunden nach Beginn des Durchlaufs

#### Scenario: Gleichzeitige Schläge
- **WHEN** an derselben Position Bassdrum und Crash gesetzt sind
- **THEN** erklingen beide zum selben Zeitpunkt

### Requirement: Klang der Instrumente
Jedes der zehn Instrumente MUST mit einem eigenen, im Browser erzeugten Klang erklingen, der ohne Audiodateien auskommt. Die Klänge MUST sich so unterscheiden, dass Bassdrum, Snare, die drei Toms, Hi-Hat geschlossen, Hi-Hat offen, Hi-Hat-Pedal, Ride und Crash einzeln erkennbar sind; die Toms MUST in der Tonhöhe von Tom 1 über Tom 2 zum Standtom abfallen.

#### Scenario: Jedes Instrument klingt
- **WHEN** ein Pattern auf je einer eigenen Position einen Schlag jedes der zehn Instrumente enthält und abgespielt wird
- **THEN** erklingen zehn Schläge mit zehn verschiedenen Klängen

#### Scenario: Tonhöhe der Toms
- **WHEN** Tom 1, Tom 2 und Standtom nacheinander erklingen
- **THEN** ist Tom 1 am höchsten und das Standtom am tiefsten

### Requirement: Klang der Spielweisen
Eine Ghost Note MUST deutlich leiser erklingen als ein normaler Schlag desselben Instruments. Ein Flam MUST als zwei Schläge erklingen: ein leiser Vorschlag kurz vor der Position und der Hauptschlag genau auf der Position.

#### Scenario: Ghost Note
- **WHEN** die Snare auf Position 1 eine Ghost Note und auf Position 3 einen normalen Schlag hat
- **THEN** erklingt der Schlag auf Position 1 leiser als der auf Position 3

#### Scenario: Flam
- **WHEN** Tom 1 auf der „1“ einen Flam hat
- **THEN** erklingt kurz vor der „1“ ein leiser Tom-1-Schlag und auf der „1“ ein normaler

### Requirement: Offene Hi-Hat klingt nach
Die offene Hi-Hat MUST hörbar länger nachklingen als die geschlossene. Erklingt danach die geschlossene Hi-Hat oder das Hi-Hat-Pedal, MUST der Nachklang der offenen Hi-Hat in diesem Moment enden.

#### Scenario: Abgestoppt durch das Pedal
- **WHEN** die offene Hi-Hat auf der „1“ und das Hi-Hat-Pedal auf der „2“ liegen
- **THEN** endet der Klang der offenen Hi-Hat auf der „2“

### Requirement: Änderungen während der Wiedergabe
Ändert der Nutzer das Pattern während der Wiedergabe, MUST die Wiedergabe ohne Neustart weiterlaufen und jede Stelle ab ihrem nächsten Erreichen mit dem geänderten Inhalt spielen. Das gilt für Schläge, Spielweisen, Unterteilungen, die Länge des Patterns und Rückgängig/Wiederherstellen.

#### Scenario: Schlag während der Wiedergabe setzen
- **WHEN** die Wiedergabe läuft und der Nutzer in Beat 3 einen Snare-Schlag setzt, bevor Beat 3 erreicht ist
- **THEN** erklingt dieser Snare-Schlag noch im laufenden Durchlauf

#### Scenario: Pattern kürzen während der Wiedergabe
- **WHEN** die Wiedergabe eines 4-Beat-Patterns in Beat 4 steht und der Nutzer die Länge auf 2 Beats ändert
- **THEN** setzt die Wiedergabe ohne Unterbrechung mit Beat 1 fort

### Requirement: Wiedergabeposition im Sequencer
Während der Wiedergabe MUST der Sequencer die Position hervorheben, die gerade erklingt, in allen Instrumentenzeilen. Nach dem Stopp MUST keine Position hervorgehoben sein.

#### Scenario: Position folgt der Wiedergabe
- **WHEN** die Wiedergabe gerade Beat 2, Position 3 spielt
- **THEN** ist im Sequencer genau die Spalte von Beat 2, Position 3 hervorgehoben

#### Scenario: Keine Hervorhebung nach Stopp
- **WHEN** der Nutzer die Wiedergabe stoppt
- **THEN** ist keine Spalte des Sequencers hervorgehoben

### Requirement: Tempo im Pattern-Editor
Der Pattern-Editor MUST das Tempo des Songs in BPM neben der Abspiel-Taste zeigen und ändern lassen. Das Feld MUST als „Song-Tempo (BPM)“ beschriftet sein, und ein Hinweis am Feld MUST nennen, dass es für alle Patterns des Songs gilt, mit dem Songtitel. Eine Änderung MUST für alle Patterns des Songs gelten und eine laufende Wiedergabe ab dem nächsten Schlag im neuen Tempo fortsetzen. Ein ungültiger Wert MUST abgelehnt werden; das Feld zeigt dann wieder das bisherige Tempo.

#### Scenario: Tempo ändern
- **WHEN** der Nutzer im Pattern-Editor das Tempo von 120 auf 90 BPM ändert
- **THEN** zeigt das Tempo-Feld 90
- **AND** im Pattern-Editor eines anderen Patterns desselben Songs steht ebenfalls 90

#### Scenario: Kennzeichnung als Song-Tempo
- **WHEN** der Nutzer im Song „Hysteria“ den Pattern-Editor des Grooves „Verse“ öffnet
- **THEN** heißt das Feld „Song-Tempo (BPM)“
- **AND** der Hinweis am Feld lautet „gilt für alle Patterns von „Hysteria““

#### Scenario: Tempo während der Wiedergabe
- **WHEN** die Wiedergabe läuft und der Nutzer das Tempo ändert
- **THEN** läuft die Wiedergabe ohne Neustart im neuen Tempo weiter

#### Scenario: Ungültiges Tempo
- **WHEN** der Nutzer als Tempo 0 eingibt
- **THEN** zeigt das Feld wieder das bisherige Tempo und der Song bleibt unverändert

### Requirement: Wiedergabe endet beim Verlassen
Verlässt der Nutzer den Pattern-Editor oder öffnet er ein anderes Pattern, MUST die Wiedergabe enden. Ein neu geöffnetes Pattern MUST nicht von selbst abgespielt werden.

#### Scenario: Zurück zur Doppelseite
- **WHEN** die Wiedergabe läuft und der Nutzer zur Doppelseite des Songs wechselt
- **THEN** erklingt kein weiterer Schlag

### Requirement: Audio nicht verfügbar
Kann der Browser kein Audio erzeugen, MUST die Abspiel-Taste deaktiviert sein und ein Hinweis erklären, dass die Wiedergabe in diesem Browser nicht möglich ist. Das Bearbeiten des Patterns MUST davon unberührt bleiben.

#### Scenario: Browser ohne Web Audio
- **WHEN** der Pattern-Editor in einem Browser ohne Audio-Unterstützung geöffnet wird
- **THEN** ist „Abspielen“ deaktiviert und ein Hinweis nennt den Grund
