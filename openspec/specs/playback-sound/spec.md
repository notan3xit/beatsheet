# playback-sound Specification

## Purpose

Legt fest, mit welchem Klang Pattern- und Song-Wiedergabe erklingen: Aufnahmen des DRSKit oder der Synth, wie der Nutzer wählt und was gilt, wenn die Aufnahmen auf einem Gerät nicht spielbar sind.

## Requirements

### Requirement: Klang wählen
Das Menü MUST einen Abschnitt „Klang“ mit den Optionen „DRSKit“ und „Synth“ enthalten, von denen genau eine als gewählt markiert ist. Das Wählen einer Option MUST den Klang ab dem nächsten Schlag ändern, auch während einer laufenden Wiedergabe.

#### Scenario: Synth wählen
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** der Nutzer im Menü „Synth“ wählt
- **THEN** ist „Synth“ als gewählt markiert
- **AND** die Schläge der nächsten Wiedergabe erklingen synthetisch

#### Scenario: Wechsel während der Wiedergabe
- **GIVEN** die Wiedergabe läuft mit dem Klang „Synth“ und die Aufnahmen sind bereit
- **WHEN** der Nutzer im Menü „DRSKit“ wählt
- **THEN** läuft die Wiedergabe ohne Neustart weiter
- **AND** die folgenden Schläge erklingen mit den Aufnahmen

### Requirement: Wahl pro Gerät
Die Wahl des Klangs MUST auf dem Gerät gespeichert werden und nach einem Neuladen der App gelten. Sie MUST NOT mit dem Konto oder anderen Geräten abgeglichen werden. Ohne gespeicherte Wahl MUST „DRSKit“ gelten.

#### Scenario: Vorgabe
- **GIVEN** auf dem Gerät wurde noch kein Klang gewählt
- **WHEN** der Nutzer das Menü öffnet
- **THEN** ist „DRSKit“ als gewählt markiert

#### Scenario: Wahl bleibt erhalten
- **GIVEN** der Nutzer hat „Synth“ gewählt
- **WHEN** er die App neu lädt und das Menü öffnet
- **THEN** ist „Synth“ als gewählt markiert

### Requirement: Klang der Aufnahmen
Mit dem Klang „DRSKit“ MUST jedes der zehn Instrumente mit einer Aufnahme des DRSKit erklingen. Ein Schlag mit vollem Pegel MUST die Aufnahme eines normalen Schlags nutzen, eine Ghost Note und ein Flam-Vorschlag die Aufnahme eines leisen Schlags desselben Instruments.

#### Scenario: Normaler Schlag
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein normaler Snare-Schlag erklingt
- **THEN** spielt die Aufnahme des normalen Snare-Schlags

#### Scenario: Ghost Note
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** eine Ghost Note auf der Snare erklingt
- **THEN** spielt die Aufnahme des leisen Snare-Schlags

#### Scenario: Flam
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein Flam auf Tom 1 erklingt
- **THEN** spielt vor der Position die Aufnahme des leisen Tom-1-Schlags und auf der Position die des normalen

### Requirement: Laden im Hintergrund
Ist „DRSKit“ gewählt, MUST die App die Aufnahmen nach dem Start ohne Zutun des Nutzers laden. Bis sie bereit sind, MUST jeder Schlag synthetisch erklingen. Sobald sie bereit sind, MUST der nächste Schlag mit den Aufnahmen erklingen, ohne dass die Wiedergabe neu startet.

#### Scenario: Abspielen vor dem Laden
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen werden noch geladen
- **WHEN** der Nutzer die Wiedergabe startet
- **THEN** erklingen die Schläge synthetisch

#### Scenario: Aufnahmen werden während der Wiedergabe bereit
- **GIVEN** die Wiedergabe läuft synthetisch, weil die Aufnahmen noch geladen werden
- **WHEN** die Aufnahmen bereit sind
- **THEN** erklingen die folgenden Schläge mit den Aufnahmen, ohne Neustart der Wiedergabe

### Requirement: Ersatz durch den Synth
Lassen sich die Aufnahmen nicht laden oder in keinem angebotenen Format dekodieren, MUST jeder Schlag synthetisch erklingen und das Menü MUST bei „DRSKit“ den Hinweis „auf diesem Gerät nicht verfügbar“ zeigen. Die gespeicherte Wahl MUST dabei unverändert bleiben, damit ein späterer Start es erneut versucht.

#### Scenario: Aufnahmen nicht dekodierbar
- **GIVEN** der Klang ist „DRSKit“ und das Gerät kann keines der Formate der Aufnahmen dekodieren
- **WHEN** der Nutzer die Wiedergabe startet
- **THEN** erklingen die Schläge synthetisch
- **AND** das Menü zeigt bei „DRSKit“ „auf diesem Gerät nicht verfügbar“

#### Scenario: Erneuter Versuch nach Neustart
- **GIVEN** beim letzten Start ließen sich die Aufnahmen nicht laden und der Klang ist „DRSKit“
- **WHEN** die App neu geladen wird und die Aufnahmen jetzt erreichbar sind
- **THEN** erklingen die Schläge mit den Aufnahmen
- **AND** das Menü zeigt keinen Hinweis bei „DRSKit“

#### Scenario: Zweites Format
- **GIVEN** das Gerät kann das erste angebotene Format nicht dekodieren, wohl aber das zweite
- **WHEN** die Aufnahmen geladen sind
- **THEN** erklingen die Schläge mit den Aufnahmen

### Requirement: Herkunft der Aufnahmen
Das Menü MUST im Abschnitt „Klang“ die Herkunft der Aufnahmen nennen: „DRSKit von DrumGizmo.org“ mit Verweis auf die Seite des Sets und die Lizenz „CC BY 4.0“ mit Verweis auf den Lizenztext.

#### Scenario: Namensnennung im Menü
- **WHEN** der Nutzer das Menü öffnet
- **THEN** nennt der Abschnitt „Klang“ „DRSKit von DrumGizmo.org“ und „CC BY 4.0“ als Verweise
