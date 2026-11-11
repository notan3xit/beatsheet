# pattern-playback Specification

## Purpose

Macht das im Pattern-Editor geöffnete Pattern hörbar: Es wird mit dem gewählten Drum-Klang im Tempo seines Songs in einer Schleife abgespielt, damit der Nutzer seine Eingabe akustisch prüfen kann.

## Requirements

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
Jedes der zehn Instrumente MUST mit einem eigenen Klang erklingen, je nach gewähltem Klang aus einer Aufnahme oder im Browser erzeugt (siehe `playback-sound`). Die Klänge MUST sich so unterscheiden, dass Bassdrum, Snare, die drei Toms, Hi-Hat geschlossen, Hi-Hat offen, Hi-Hat-Pedal, Ride und Crash einzeln erkennbar sind; die Toms MUST in der Tonhöhe von Tom 1 über Tom 2 zum Standtom abfallen. Spielweisen und das Abstoppen der offenen Hi-Hat MUST für beide Klänge gelten.

#### Scenario: Jedes Instrument klingt
- **WHEN** ein Pattern auf je einer eigenen Position einen Schlag jedes der zehn Instrumente enthält und abgespielt wird
- **THEN** erklingen zehn Schläge mit zehn verschiedenen Klängen

#### Scenario: Tonhöhe der Toms
- **WHEN** Tom 1, Tom 2 und Standtom nacheinander erklingen
- **THEN** ist Tom 1 am höchsten und das Standtom am tiefsten

#### Scenario: Offene Hi-Hat mit Aufnahmen abgestoppt
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** die offene Hi-Hat auf der „1“ und die geschlossene Hi-Hat auf der „2“ liegen
- **THEN** endet der Klang der offenen Hi-Hat auf der „2“

### Requirement: Klang der Spielweisen
Eine Ghost Note MUST deutlich leiser erklingen als ein normaler Schlag desselben Instruments. Ein Flam MUST als zwei Schläge erklingen: ein leiser Vorschlag kurz vor der Position und der Hauptschlag genau auf der Position. Ein Drag MUST ebenso klingen, aber mit zwei leisen Vorschlägen.

#### Scenario: Ghost Note
- **WHEN** die Snare auf Position 1 eine Ghost Note und auf Position 3 einen normalen Schlag hat
- **THEN** erklingt der Schlag auf Position 1 leiser als der auf Position 3

#### Scenario: Flam
- **WHEN** Tom 1 auf der „1“ einen Flam hat
- **THEN** erklingt kurz vor der „1“ ein leiser Tom-1-Schlag und auf der „1“ ein normaler

#### Scenario: Drag
- **WHEN** die Snare auf der „1“ einen Drag hat
- **THEN** erklingen kurz vor der „1“ zwei leise Snare-Schläge und auf der „1“ ein normaler

### Requirement: Klang von Rim Shot, Cross-Stick, Glocke und Choke
Rim Shot, Cross-Stick und Ride-Glocke MUST sich hörbar vom normalen Schlag des Instruments unterscheiden; ein Rim Shot MUST lauter und schärfer klingen als ein normaler Snare-Schlag, ein Cross-Stick leiser und kürzer. Ein Crash mit Choke MUST kurz nach seinem Einsatz abrupt enden.

#### Scenario: Rim Shot
- **WHEN** die Snare auf Position 1 einen Rim Shot und auf Position 3 einen normalen Schlag hat
- **THEN** erklingt der Schlag auf Position 1 lauter als der auf Position 3 und mit eigenem Klang

#### Scenario: Cross-Stick
- **WHEN** die Snare auf Position 1 einen Cross-Stick und auf Position 3 einen normalen Schlag hat
- **THEN** erklingt der Schlag auf Position 1 leiser und kürzer als der auf Position 3

#### Scenario: Ride-Bell
- **WHEN** die Ride auf Position 1 eine Glocke und auf Position 3 einen normalen Schlag hat
- **THEN** erklingen beide Schläge mit verschiedenem Klang

#### Scenario: Choke
- **WHEN** die Crash auf der „1“ einen Choke und auf der „3“ einen normalen Schlag hat
- **THEN** ist der Klang auf der „1“ nach einem Bruchteil einer Sekunde verstummt, der auf der „3“ klingt nach

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

### Requirement: Wiedergabe endet beim Verlassen
Verlässt der Nutzer den Pattern-Editor oder öffnet er ein anderes Pattern, MUST die Wiedergabe enden. Ein neu geöffnetes Pattern MUST nicht von selbst abgespielt werden.

#### Scenario: Zurück zur Doppelseite
- **WHEN** die Wiedergabe läuft und der Nutzer zur Doppelseite des Songs wechselt
- **THEN** erklingt kein weiterer Schlag

### Requirement: Audio nicht verfügbar
Kann der Browser kein Audio erzeugen, MUST die Abspiel-Knöpfe deaktiviert sein und ein Hinweis erklären, dass die Wiedergabe in diesem Browser nicht möglich ist. Das Bearbeiten des Patterns MUST davon unberührt bleiben.

#### Scenario: Browser ohne Web Audio
- **WHEN** der Pattern-Editor in einem Browser ohne Audio-Unterstützung geöffnet wird
- **THEN** sind „Einmal abspielen“ und „In Schleife abspielen“ deaktiviert und ein Hinweis nennt den Grund

### Requirement: Klang der Betonung
Ein betonter Schlag MUST lauter erklingen als derselbe Schlag ohne Betonung. Bei Flam und Drag MUST nur der Hauptschlag lauter werden. Viele gleichzeitige betonte Schläge MUST NOT hörbar übersteuern.

#### Scenario: Betonter Schlag
- **WHEN** die Hi-Hat auf Position 1 betont und auf Position 3 unbetont ist
- **THEN** erklingt der Schlag auf Position 1 lauter als der auf Position 3

#### Scenario: Betonter Flam
- **WHEN** die Snare auf der „1“ einen betonten Flam hat
- **THEN** erklingt der Vorschlag so leise wie bei einem unbetonten Flam und der Hauptschlag lauter als ein normaler

#### Scenario: Betonte Spielweise
- **WHEN** die Snare auf Position 1 einen betonten Rim Shot und auf Position 3 einen unbetonten hat
- **THEN** erklingen beide mit dem Klang des Rim Shots, der auf Position 1 lauter
