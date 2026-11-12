# Spec Delta

## MODIFIED Requirements

### Requirement: Übetempo-Steuerung
Die Köpfe von Doppelseite und Pattern-Editor MUST nach den Abspiel-Knöpfen eine Steuerung des Übetempos zeigen: einen Schalter „Tempo“ und das Übetempo als „♩ = <BPM>“. Der Schalter MUST zeigen, ob er an ist; ist er an, MUST der Teil aus Schalter und Übetempo hervorgehoben sein, sonst gedämpft. Doppelseite und Pattern-Editor desselben Songs MUST denselben Schalter und denselben Wert zeigen.

#### Scenario: Doppelseite
- **WHEN** der Nutzer die Doppelseite von „Hysteria“ (120 BPM) zum ersten Mal ansieht
- **THEN** steht nach den Abspiel-Knöpfen der Schalter „Tempo“, ausgeschaltet, und „♩ = 90“

#### Scenario: Gleicher Stand im Pattern-Editor
- **WHEN** der Nutzer auf der Doppelseite von „Hysteria“ „Tempo“ einschaltet und den Groove „Verse“ öffnet
- **THEN** ist „Tempo“ im Pattern-Editor eingeschaltet und zeigt dasselbe Übetempo

#### Scenario: Hervorhebung nur für Tempo
- **WHEN** „Tempo“ an und „Metronom“ aus ist
- **THEN** sind Schalter und Übetempo hervorgehoben und „Metronom“ zeigt den Zustand aus

### Requirement: Wiedergabe im Übetempo
Ist „Tempo“ eingeschaltet, MUST jede Wiedergabe des Songs und seiner Patterns im Übetempo statt im Song-Tempo laufen, unabhängig davon, wie sie gestartet wurde. Ist es ausgeschaltet, MUST sie im Song-Tempo laufen. Schalter und Übetempo MUST eine laufende Wiedergabe ab dem nächsten Schlag ohne Neustart ändern.

#### Scenario: Pattern im Übetempo
- **GIVEN** „Tempo“ ist eingeschaltet, das Übetempo ist 60, das Song-Tempo 120
- **WHEN** ein Pattern mit 4 Beats in Schleife abgespielt wird
- **THEN** beginnt der zweite Durchlauf 4 Sekunden nach dem ersten

#### Scenario: Aus dem Takt-Overlay
- **GIVEN** „Tempo“ ist eingeschaltet
- **WHEN** der Nutzer einen Takt auswählt und „In Schleife abspielen“ wählt
- **THEN** läuft die Schleife im Übetempo

#### Scenario: Ausschalten während der Wiedergabe
- **WHEN** der Song im Übetempo läuft und der Nutzer „Tempo“ ausschaltet
- **THEN** läuft die Wiedergabe ohne Neustart im Song-Tempo weiter

### Requirement: Übetempo ändern
Ein Klick auf das Übetempo MUST es zum Eingabefeld machen, das sich wie die Tempoangabe des Songs bedient: Enter oder Verlassen übernimmt, Escape verwirft. Jedes gültige Tempo MUST übernommen werden, auch über dem Song-Tempo. Ein Wert, der kein gültiges Tempo ist, MUST abgelehnt werden; die Angabe zeigt dann wieder das bisherige Übetempo.

#### Scenario: Wert eingeben
- **WHEN** der Nutzer auf das Übetempo klickt, 96 eingibt und Enter drückt
- **THEN** steht dort „♩ = 96“

#### Scenario: Über dem Song-Tempo
- **WHEN** der Nutzer bei einem Song-Tempo von 120 als Übetempo 140 eingibt und „Tempo“ eingeschaltet ist
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
- **THEN** zeigt die Steuerung „Tempo“ und das Übetempo, aber keine Knöpfe zum Verringern und Erhöhen

### Requirement: Übetempo unabhängig vom Song-Tempo
Das Übetempo MUST genau so gespielt werden, wie der Nutzer es eingestellt hat. Eine Änderung des Song-Tempos MUST NOT das Übetempo ändern.

#### Scenario: Song-Tempo gesenkt
- **GIVEN** das Übetempo ist 100 und „Tempo“ ist eingeschaltet
- **WHEN** der Nutzer das Song-Tempo auf 80 senkt
- **THEN** steht beim Übetempo weiterhin „♩ = 100“ und die Wiedergabe läuft mit 100 BPM

### Requirement: Schalter gilt bis zum Neuladen
Der Schalter „Tempo“ MUST pro Song gelten, bis die App neu geladen wird. Ein Song MUST nach dem Laden der App mit ausgeschaltetem „Tempo“ beginnen.

#### Scenario: Anderer Song
- **WHEN** der Nutzer bei „Hysteria“ „Tempo“ einschaltet und einen anderen Song öffnet
- **THEN** ist dort „Tempo“ ausgeschaltet

#### Scenario: Zurück zum Song
- **WHEN** der Nutzer bei „Hysteria“ „Tempo“ einschaltet, zur Song-Liste wechselt und „Hysteria“ wieder öffnet
- **THEN** ist „Tempo“ eingeschaltet

#### Scenario: Neu laden
- **WHEN** der Nutzer „Tempo“ einschaltet und die App neu lädt
- **THEN** ist „Tempo“ ausgeschaltet

### Requirement: Üben im gesperrten Song
Schalter und Übetempo MUST auch in einem gesperrten Song bedienbar sein.

#### Scenario: Gesperrter Song
- **WHEN** der Song gesperrt ist und der Nutzer „Tempo“ einschaltet und „Übetempo erhöhen“ wählt
- **THEN** ist „Tempo“ eingeschaltet und das Übetempo um 5 höher
