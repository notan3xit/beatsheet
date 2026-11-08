# Spec Delta

## MODIFIED Requirements

### Requirement: Song abspielen
Der Kopf der Doppelseite MUST die Knöpfe „Song abspielen“ und „Song in Schleife abspielen“ anbieten. „Song abspielen“ MUST den Song vom ersten Takt an einmal bis zum Ende abspielen, „Song in Schleife abspielen“ MUST nach dem letzten Takt ohne Pause wieder mit dem ersten beginnen. Während einer Wiedergabe auf der Doppelseite MUST der Knopf des laufenden Modus „Stopp“ heißen und die Wiedergabe beenden, unabhängig davon, wie sie gestartet wurde. Ohne Schleife MUST die Wiedergabe am Songende von selbst enden. Ein Song ohne Takte MUST beide Knöpfe deaktiviert zeigen.

#### Scenario: Ganzen Song abspielen
- **WHEN** der Nutzer auf der Doppelseite eines Songs mit 4 Takten „Song abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von Takt 1
- **AND** der Knopf heißt „Stopp“

#### Scenario: Ganzen Song in Schleife
- **WHEN** der Nutzer auf der Doppelseite eines Songs mit 4 Takten „Song in Schleife abspielen“ wählt
- **THEN** folgt auf Takt 4 wieder Takt 1
- **AND** der Knopf heißt „Stopp“

#### Scenario: Ende des Songs
- **WHEN** die einmalige Wiedergabe das Ende des letzten Takts erreicht
- **THEN** endet die Wiedergabe, die Knöpfe heißen wieder „Song abspielen“ und „Song in Schleife abspielen“, und kein Takt ist hervorgehoben

#### Scenario: Stoppen
- **WHEN** die Wiedergabe läuft und der Nutzer „Stopp“ wählt
- **THEN** erklingt kein weiterer Schlag

#### Scenario: Stoppen einer Overlay-Wiedergabe
- **WHEN** die Takte 2 bis 3 aus dem Takt-Overlay in Schleife laufen
- **THEN** heißt im Kopf der Doppelseite der Knopf „Song in Schleife abspielen“ „Stopp“ und beendet die Wiedergabe

#### Scenario: Song ohne Takte
- **WHEN** der Nutzer die Doppelseite eines Songs ohne Segmente öffnet
- **THEN** sind „Song abspielen“ und „Song in Schleife abspielen“ deaktiviert

### Requirement: Song-Wiedergabe ohne Audio
Kann der Browser kein Audio erzeugen, MUST „Song abspielen“ und „Song in Schleife abspielen“ deaktiviert sein und ein Hinweis erklären, dass die Wiedergabe in diesem Browser nicht möglich ist. Die Popover-Aktionen zum Abspielen MUST dann ebenfalls deaktiviert sein.

#### Scenario: Browser ohne Web Audio auf der Doppelseite
- **WHEN** die Doppelseite in einem Browser ohne Audio-Unterstützung geöffnet wird
- **THEN** sind „Song abspielen“ und „Song in Schleife abspielen“ deaktiviert und ein Hinweis nennt den Grund

## ADDED Requirements

### Requirement: Laufende Schleife in der Struktur
Läuft eine Schleife über einen Teil des Songs, MUST die linke Seite jeden Takt dieses Bereichs, der nicht ausgewählt ist, grau markieren. Eine einmalige Wiedergabe und eine Schleife über den ganzen Song MUST NOT markiert werden. Mit dem Ende der Schleife, durch Stopp oder Wechsel zum einmaligen Durchlauf, MUST die Markierung verschwinden.

#### Scenario: Andere Auswahl während der Schleife
- **WHEN** die Takte 2 bis 3 aus dem Takt-Overlay in Schleife laufen und der Nutzer Takt 6 auswählt
- **THEN** sind die Takte 2 und 3 grau markiert und Takt 6 ist ausgewählt

#### Scenario: Auswahl entspricht dem Bereich
- **WHEN** die Takte 2 bis 3 aus dem Takt-Overlay in Schleife laufen und ausgewählt sind
- **THEN** ist kein Takt grau markiert

#### Scenario: Einmalige Wiedergabe
- **WHEN** der Nutzer Takt 3 auswählt, „Ab hier abspielen“ wählt und danach Takt 1 auswählt
- **THEN** ist kein Takt grau markiert

#### Scenario: Ganzer Song in Schleife
- **WHEN** der Song über „Song in Schleife abspielen“ läuft und der Nutzer die Auswahl aufhebt
- **THEN** ist kein Takt grau markiert

#### Scenario: Wechsel zum einmaligen Durchlauf
- **WHEN** die Takte 2 bis 3 in Schleife laufen, Takt 6 ausgewählt ist und der Nutzer „Song abspielen“ wählt
- **THEN** ist kein Takt mehr grau markiert

### Requirement: Kopfknöpfe spielen die Auswahl
Sind auf der Doppelseite Takte oder ein Segment ausgewählt und läuft keine Wiedergabe, MUST der Kopf statt „Song abspielen“ den Knopf „Ab Auswahl abspielen“ und statt „Song in Schleife abspielen“ den Knopf „Auswahl in Schleife abspielen“ zeigen. Sie MUST wie „Ab hier abspielen“ bzw. „In Schleife abspielen“ im Popover der Auswahl wirken und wie diese das Popover schließen und die Auswahl bestehen lassen. Ohne Auswahl MUST der Kopf wieder den ganzen Song abspielen.

#### Scenario: Ab Auswahl
- **WHEN** in einem Song mit 4 Takten die Takte 2 bis 3 ausgewählt sind und der Nutzer im Kopf „Ab Auswahl abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von Takt 2 und endet nach Takt 4

#### Scenario: Auswahl in Schleife
- **WHEN** die Takte 2 bis 3 ausgewählt sind und der Nutzer im Kopf „Auswahl in Schleife abspielen“ wählt
- **THEN** laufen die Takte 2 bis 3 in Schleife, kein Popover ist geöffnet und die Takte 2 bis 3 sind ausgewählt

#### Scenario: Segment ausgewählt
- **WHEN** das Segment „Chorus“ ausgewählt ist und der Nutzer im Kopf „Auswahl in Schleife abspielen“ wählt
- **THEN** laufen die Takte von „Chorus“ in Schleife

#### Scenario: Üben vor dem Start
- **WHEN** die Takte 2 bis 3 ausgewählt sind, der Nutzer „Üben“ einschaltet und dann „Auswahl in Schleife abspielen“ wählt
- **THEN** laufen die Takte 2 bis 3 im Übetempo in Schleife

#### Scenario: Ohne Auswahl
- **WHEN** nichts ausgewählt ist
- **THEN** zeigt der Kopf „Song abspielen“ und „Song in Schleife abspielen“
