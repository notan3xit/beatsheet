# practice-tempo Specification

## Purpose
Lässt einen Song zum Üben langsamer abspielen als in seinem Song-Tempo, ohne den Song zu ändern, und mit einem Schalter jederzeit zwischen Üben und normalem Abspielen wechseln.

## Requirements

### Requirement: Übetempo-Steuerung
Die Köpfe von Doppelseite und Pattern-Editor MUST nach den Abspiel-Knöpfen eine Steuerung des Übetempos zeigen: einen Schalter „Üben“ und das Übetempo als „♩ = <BPM>“. Der Schalter MUST zeigen, ob er an ist; ist er an, MUST die Steuerung hervorgehoben sein, sonst gedämpft. Doppelseite und Pattern-Editor desselben Songs MUST denselben Schalter und denselben Wert zeigen.

#### Scenario: Doppelseite
- **WHEN** der Nutzer die Doppelseite von „Hysteria“ (120 BPM) zum ersten Mal ansieht
- **THEN** steht nach den Abspiel-Knöpfen der Schalter „Üben“, ausgeschaltet, und „♩ = 90“

#### Scenario: Gleicher Stand im Pattern-Editor
- **WHEN** der Nutzer auf der Doppelseite von „Hysteria“ „Üben“ einschaltet und den Groove „Verse“ öffnet
- **THEN** ist „Üben“ im Pattern-Editor eingeschaltet und zeigt dasselbe Übetempo

### Requirement: Wiedergabe im Übetempo
Ist „Üben“ eingeschaltet, MUST jede Wiedergabe des Songs und seiner Patterns im Übetempo statt im Song-Tempo laufen, unabhängig davon, wie sie gestartet wurde. Ist es ausgeschaltet, MUST sie im Song-Tempo laufen. Schalter und Übetempo MUST eine laufende Wiedergabe ab dem nächsten Schlag ohne Neustart ändern.

#### Scenario: Pattern im Übetempo
- **GIVEN** „Üben“ ist eingeschaltet, das Übetempo ist 60, das Song-Tempo 120
- **WHEN** ein Pattern mit 4 Beats in Schleife abgespielt wird
- **THEN** beginnt der zweite Durchlauf 4 Sekunden nach dem ersten

#### Scenario: Aus dem Takt-Overlay
- **GIVEN** „Üben“ ist eingeschaltet
- **WHEN** der Nutzer einen Takt auswählt und „In Schleife abspielen“ wählt
- **THEN** läuft die Schleife im Übetempo

#### Scenario: Ausschalten während der Wiedergabe
- **WHEN** der Song im Übetempo läuft und der Nutzer „Üben“ ausschaltet
- **THEN** läuft die Wiedergabe ohne Neustart im Song-Tempo weiter

### Requirement: Übetempo ändern
Ein Klick auf das Übetempo MUST es zum Eingabefeld machen, das sich wie die Tempoangabe des Songs bedient: Enter oder Verlassen übernimmt, Escape verwirft. Jedes gültige Tempo MUST übernommen werden, auch über dem Song-Tempo. Ein Wert, der kein gültiges Tempo ist, MUST abgelehnt werden; die Angabe zeigt dann wieder das bisherige Übetempo.

#### Scenario: Wert eingeben
- **WHEN** der Nutzer auf das Übetempo klickt, 96 eingibt und Enter drückt
- **THEN** steht dort „♩ = 96“

#### Scenario: Über dem Song-Tempo
- **WHEN** der Nutzer bei einem Song-Tempo von 120 als Übetempo 140 eingibt und „Üben“ eingeschaltet ist
- **THEN** steht dort „♩ = 140“ und die Wiedergabe läuft mit 140 BPM

#### Scenario: Ungültiger Wert
- **WHEN** der Nutzer als Übetempo 0 eingibt
- **THEN** zeigt die Angabe wieder das bisherige Übetempo

### Requirement: Übetempo in Schritten
Neben dem Übetempo MUST je ein Knopf „Übetempo verringern“ und „Übetempo erhöhen“ das Übetempo um 5 BPM ändern, begrenzt auf das kleinste und das größte gültige Tempo. Am größten gültigen Tempo MUST „Übetempo erhöhen“ deaktiviert sein, am kleinsten „Übetempo verringern“. Auf schmalen Bildschirmen MUST NOT die Knöpfe erscheinen.

#### Scenario: Erhöhen
- **WHEN** das Übetempo 90 ist und der Nutzer „Übetempo erhöhen“ wählt
- **THEN** steht dort „♩ = 95“

#### Scenario: Über das Song-Tempo hinaus
- **WHEN** das Übetempo 120 ist, das Song-Tempo 120, und der Nutzer „Übetempo erhöhen“ wählt
- **THEN** steht dort „♩ = 125“

#### Scenario: An der Obergrenze
- **WHEN** das Übetempo 298 ist und der Nutzer „Übetempo erhöhen“ wählt
- **THEN** steht dort „♩ = 300“ und „Übetempo erhöhen“ ist deaktiviert

#### Scenario: Smartphone
- **WHEN** der Nutzer die Doppelseite auf einem Smartphone ansieht
- **THEN** zeigt die Steuerung „Üben“ und das Übetempo, aber keine Knöpfe zum Verringern und Erhöhen

### Requirement: Übetempo unabhängig vom Song-Tempo
Das Übetempo MUST genau so gespielt werden, wie der Nutzer es eingestellt hat. Eine Änderung des Song-Tempos MUST NOT das Übetempo ändern.

#### Scenario: Song-Tempo gesenkt
- **GIVEN** das Übetempo ist 100 und „Üben“ ist eingeschaltet
- **WHEN** der Nutzer das Song-Tempo auf 80 senkt
- **THEN** steht beim Übetempo weiterhin „♩ = 100“ und die Wiedergabe läuft mit 100 BPM

### Requirement: Vorgabe des Übetempos
Hat der Nutzer das Übetempo eines Songs auf diesem Gerät nie geändert, MUST es 75 % des Song-Tempos betragen, auf ein Vielfaches von 5 gerundet und mindestens das kleinste gültige Tempo. Gespeichert MUST die Vorgabe erst werden, wenn der Nutzer das Übetempo ändert.

#### Scenario: Vorgabe
- **WHEN** der Nutzer einen Song mit 130 BPM öffnet, dessen Übetempo er nie geändert hat
- **THEN** steht beim Übetempo „♩ = 100“

### Requirement: Übetempo bleibt auf dem Gerät
Das Übetempo MUST pro Song auf dem Gerät gespeichert werden und ein Neuladen der App überdauern. Es MUST NOT Teil des Songs sein: Es MUST NOT den Song ändern, im Verlauf erscheinen, abgeglichen oder exportiert werden.

#### Scenario: Neu laden
- **WHEN** der Nutzer das Übetempo von „Hysteria“ auf 85 setzt und die App neu lädt
- **THEN** steht bei „Hysteria“ „♩ = 85“

#### Scenario: Anderer Song
- **WHEN** der Nutzer das Übetempo von „Hysteria“ auf 85 setzt und einen anderen Song öffnet
- **THEN** zeigt dieser sein eigenes Übetempo

#### Scenario: Kein Teil des Songs
- **WHEN** der Nutzer das Übetempo ändert
- **THEN** bleibt der Song unverändert und sein Verlauf erhält keinen Eintrag

### Requirement: Schalter gilt bis zum Neuladen
Der Schalter „Üben“ MUST pro Song gelten, bis die App neu geladen wird. Ein Song MUST nach dem Laden der App mit ausgeschaltetem „Üben“ beginnen.

#### Scenario: Anderer Song
- **WHEN** der Nutzer bei „Hysteria“ „Üben“ einschaltet und einen anderen Song öffnet
- **THEN** ist dort „Üben“ ausgeschaltet

#### Scenario: Zurück zum Song
- **WHEN** der Nutzer bei „Hysteria“ „Üben“ einschaltet, zur Song-Liste wechselt und „Hysteria“ wieder öffnet
- **THEN** ist „Üben“ eingeschaltet

#### Scenario: Neu laden
- **WHEN** der Nutzer „Üben“ einschaltet und die App neu lädt
- **THEN** ist „Üben“ ausgeschaltet

### Requirement: Üben im gesperrten Song
Schalter und Übetempo MUST auch in einem gesperrten Song bedienbar sein.

#### Scenario: Gesperrter Song
- **WHEN** der Song gesperrt ist und der Nutzer „Üben“ einschaltet und „Übetempo erhöhen“ wählt
- **THEN** ist „Üben“ eingeschaltet und das Übetempo um 5 höher
