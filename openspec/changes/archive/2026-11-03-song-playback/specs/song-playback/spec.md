# Spec Delta

## Purpose

Macht einen ganzen Song auf seiner Doppelseite hörbar. Die Wiedergabe folgt der Struktur mit Groove-Fortlauf, Fills und Akzenten, beginnt am Anfang oder an einer gewählten Stelle und kann einen Abschnitt zum Üben in einer Schleife wiederholen.

## ADDED Requirements

### Requirement: Song abspielen
Der Kopf der Doppelseite MUST eine Taste „Song abspielen“ anbieten, die den Song vom ersten Takt an einmal bis zum Ende abspielt. Während einer Wiedergabe auf der Doppelseite MUST die Taste „Stopp“ heißen und die Wiedergabe beenden, unabhängig davon, wie sie gestartet wurde. Am Songende MUST die Wiedergabe von selbst enden. Ein Song ohne Takte MUST die Taste deaktiviert zeigen.

#### Scenario: Ganzen Song abspielen
- **WHEN** der Nutzer auf der Doppelseite eines Songs mit 4 Takten „Song abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von Takt 1
- **AND** die Taste heißt „Stopp“

#### Scenario: Ende des Songs
- **WHEN** die Wiedergabe das Ende des letzten Takts erreicht
- **THEN** endet die Wiedergabe, die Taste heißt wieder „Song abspielen“ und kein Takt ist hervorgehoben

#### Scenario: Stoppen
- **WHEN** die Wiedergabe läuft und der Nutzer „Stopp“ wählt
- **THEN** erklingt kein weiterer Schlag

#### Scenario: Song ohne Takte
- **WHEN** der Nutzer die Doppelseite eines Songs ohne Segmente öffnet
- **THEN** ist „Song abspielen“ deaktiviert

### Requirement: Ab hier abspielen
Takt- und Segment-Popover MUST die Aktion „Ab hier abspielen“ anbieten. Sie MUST die Wiedergabe am Anfang des ersten ausgewählten Takts bzw. am Anfang des ausgewählten Segments starten und einmal bis zum Songende laufen lassen.

#### Scenario: Ab einem Takt
- **WHEN** der Nutzer in einem Song mit 4 Takten Takt 3 auswählt und „Ab hier abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von Takt 3 und endet nach Takt 4

#### Scenario: Ab einem Segment
- **WHEN** der Nutzer das Segment „Chorus“ auswählt und „Ab hier abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang des ersten Takts von „Chorus“

### Requirement: Auswahl in Schleife abspielen
Takt- und Segment-Popover MUST die Aktion „In Schleife abspielen“ anbieten. Sie MUST die ausgewählten Takte bzw. alle Takte des Segments abspielen und danach ohne Pause wieder mit dem ersten von ihnen beginnen, bis der Nutzer stoppt.

#### Scenario: Takte in Schleife
- **WHEN** der Nutzer in einem Song mit 4 Takten zu je 4 Beats bei 120 BPM die Takte 2 bis 3 auswählt und „In Schleife abspielen“ wählt
- **THEN** beginnt die Wiedergabe mit Takt 2, und 4 Sekunden später beginnt Takt 2 erneut
- **AND** Takt 1 und Takt 4 erklingen nicht

#### Scenario: Segment in Schleife
- **WHEN** der Nutzer das Segment „Chorus“ auswählt und „In Schleife abspielen“ wählt
- **THEN** folgt auf den letzten Takt von „Chorus“ wieder dessen erster Takt

### Requirement: Bereich beim Start festgehalten
Startpunkt und Schleifenbereich MUST beim Start der Wiedergabe festgelegt werden. Ändert oder hebt der Nutzer danach die Auswahl auf, MUST die Wiedergabe unverändert weiterlaufen. Wird ein Takt gelöscht, an dem der Bereich beginnt oder endet, MUST die Wiedergabe enden.

#### Scenario: Auswahl ändern während der Schleife
- **WHEN** die Takte 2 bis 3 in Schleife laufen und der Nutzer Takt 1 auswählt
- **THEN** laufen weiterhin die Takte 2 bis 3 in Schleife

#### Scenario: Auswahl aufheben während der Schleife
- **WHEN** die Takte 2 bis 3 in Schleife laufen und der Nutzer Escape drückt
- **THEN** laufen weiterhin die Takte 2 bis 3 in Schleife

#### Scenario: Anfangstakt gelöscht
- **WHEN** die Takte 2 bis 3 in Schleife laufen und der Nutzer Takt 2 löscht
- **THEN** endet die Wiedergabe

### Requirement: Klang aus der Struktur
Die Wiedergabe MUST jeden Takt so spielen, wie die Song-Struktur ihn festlegt: den Groove mit seinem Fortlauf über gleiche Takte im Block, den Fill statt des Grooves in den Beats, die er überdeckt, und die Akzente des Takts zusätzlich zu Groove oder Fill. Takte ohne Groove und ohne Fill MUST still bleiben, abgesehen von ihren Akzenten. Zeitpunkte, Klänge und Spielweisen der Schläge MUST denen der Pattern-Wiedergabe entsprechen, im Song-Tempo.

#### Scenario: Groove-Fortlauf
- **WHEN** ein Block aus zwei 4-Beat-Takten mit einem 8-Beat-Groove besteht, der nur auf Beat 5 eine Snare hat, und der Song bei 120 BPM abgespielt wird
- **THEN** erklingt die Snare 2 Sekunden nach Beginn, auf der Eins von Takt 2

#### Scenario: Fill überdeckt den Groove
- **WHEN** zwei 4-Beat-Takte einen Groove mit Bassdrum auf jedem Beat haben, Takt 2 einen 1-Beat-Fill mit Snare auf der Eins trägt und der Song bei 120 BPM abgespielt wird
- **THEN** erklingt 3,5 Sekunden nach Beginn die Snare und keine Bassdrum

#### Scenario: Akzent im leeren Takt
- **WHEN** Takt 1 weder Groove noch Fill hat, aber einen Crash-Akzent auf der Eins
- **THEN** erklingt beim Abspielen nur der Crash zu Beginn von Takt 1

#### Scenario: Akzent zusätzlich zum Groove
- **WHEN** Takt 1 einen Groove mit Bassdrum auf der Eins und einen Crash-Akzent auf der Eins hat
- **THEN** erklingen zu Beginn von Takt 1 Bassdrum und Crash gleichzeitig

### Requirement: Änderungen während der Song-Wiedergabe
Ändert der Nutzer während der Wiedergabe die Struktur, ein Pattern oder das Song-Tempo, MUST die Wiedergabe ohne Neustart weiterlaufen und jede Stelle ab ihrem nächsten Erreichen mit dem geänderten Stand spielen.

#### Scenario: Groove eines späteren Takts ändern
- **WHEN** die Wiedergabe in Takt 1 steht und der Nutzer für Takt 3 einen anderen Groove setzt
- **THEN** erklingt in Takt 3 der neue Groove

#### Scenario: Tempo während der Song-Wiedergabe
- **WHEN** die Wiedergabe läuft und der Nutzer das Song-Tempo ändert
- **THEN** läuft die Wiedergabe ohne Neustart im neuen Tempo weiter

### Requirement: Wiedergabeposition in der Struktur
Während der Wiedergabe MUST die linke Seite den laufenden Takt hervorheben und in ihm eine Linie an der aktuellen Position zeigen, maßstabsgetreu nach Beats. Liegt der laufende Takt außerhalb des sichtbaren Bereichs, MUST die Seite so scrollen, dass er sichtbar wird. Nach dem Ende der Wiedergabe MUST weder Hervorhebung noch Linie zu sehen sein.

#### Scenario: Position im Takt
- **WHEN** die Wiedergabe in einem 4-Beat-Takt 3 auf Beat 3 steht
- **THEN** ist Takt 3 hervorgehoben und die Linie steht in der Mitte von Takt 3

#### Scenario: Mitscrollen
- **WHEN** die Wiedergabe einen Takt erreicht, der außerhalb des sichtbaren Bereichs liegt
- **THEN** scrollt die Seite, bis dieser Takt sichtbar ist

#### Scenario: Keine Anzeige nach Stopp
- **WHEN** der Nutzer die Wiedergabe stoppt
- **THEN** ist kein Takt als laufend hervorgehoben und keine Linie zu sehen

### Requirement: Song-Wiedergabe endet beim Verlassen
Verlässt der Nutzer die Doppelseite, etwa zur Song-Liste oder in den Pattern-Editor, MUST die Wiedergabe enden. Song- und Pattern-Wiedergabe MUST NOT gleichzeitig laufen.

#### Scenario: Pattern öffnen während der Wiedergabe
- **WHEN** der Song läuft und der Nutzer auf der Patternseite den Groove „Verse“ öffnet
- **THEN** erklingt kein weiterer Schlag und der Pattern-Editor zeigt „Abspielen“

### Requirement: Song-Wiedergabe ohne Audio
Kann der Browser kein Audio erzeugen, MUST „Song abspielen“ deaktiviert sein und ein Hinweis erklären, dass die Wiedergabe in diesem Browser nicht möglich ist. Die Popover-Aktionen zum Abspielen MUST dann ebenfalls deaktiviert sein.

#### Scenario: Browser ohne Web Audio auf der Doppelseite
- **WHEN** die Doppelseite in einem Browser ohne Audio-Unterstützung geöffnet wird
- **THEN** ist „Song abspielen“ deaktiviert und ein Hinweis nennt den Grund
