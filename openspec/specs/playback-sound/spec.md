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
Mit dem Klang „DRSKit“ MUST jedes der zehn Instrumente mit einer Aufnahme des DRSKit erklingen. Ein Schlag mit vollem Pegel MUST die Aufnahme eines normalen Schlags nutzen, eine Ghost Note sowie die Vorschläge von Flam und Drag die Aufnahme eines leisen Schlags desselben Instruments. Rim Shot, Cross-Stick und Ride-Bell MUST je eine eigene, aus dem DRSKit gewonnene Aufnahme nutzen. Ein Choke MUST die Aufnahme des normalen Crash-Schlags nutzen.

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

#### Scenario: Rim Shot
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein Rim Shot erklingt
- **THEN** spielt die Aufnahme des Rim Shots

#### Scenario: Cross-Stick
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein Cross-Stick erklingt
- **THEN** spielt die Aufnahme des Cross-Sticks

#### Scenario: Ride-Bell
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** eine Ride-Bell erklingt
- **THEN** spielt die Aufnahme der Bell

#### Scenario: Choke
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein Crash mit Choke erklingt
- **THEN** spielt die Aufnahme des normalen Crash-Schlags und endet kurz nach dem Einsatz

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

### Requirement: Details zur Nichtverfügbarkeit
Zeigt das Menü bei „DRSKit“ den Hinweis „auf diesem Gerät nicht verfügbar“, MUST es dort auch den Eintrag „Details“ zeigen. Der Eintrag MUST das Menü schließen und einen Dialog „DRSKit nicht verfügbar“ öffnen, der sich schließen lässt und die gewählte Klangoption nicht ändert. Ohne Hinweis MUST der Eintrag fehlen.

#### Scenario: Details öffnen
- **GIVEN** das Menü zeigt bei „DRSKit“ „auf diesem Gerät nicht verfügbar“
- **WHEN** der Nutzer „Details“ wählt
- **THEN** ist das Menü geschlossen und der Dialog „DRSKit nicht verfügbar“ offen
- **AND** der gewählte Klang bleibt unverändert

#### Scenario: Dialog schließen
- **GIVEN** der Dialog „DRSKit nicht verfügbar“ ist offen
- **WHEN** der Nutzer „Schließen“ wählt
- **THEN** ist der Dialog geschlossen

#### Scenario: Kein Eintrag ohne Fehler
- **GIVEN** die Aufnahmen sind bereit
- **WHEN** der Nutzer das Menü öffnet
- **THEN** zeigt das Menü keinen Eintrag „Details“

### Requirement: Grund der Nichtverfügbarkeit
Der Dialog „DRSKit nicht verfügbar“ MUST den Grund nennen: je versuchtem Format eine Zeile mit Schritt („Abruf“ oder „Dekodieren“), Aufnahme, Format und Fehlertext des Browsers. Scheitern mehrere Aufnahmen eines Formats, MUST die Zeile die erste und die Anzahl nennen.

#### Scenario: Abruf scheitert
- **GIVEN** der Server antwortet auf den Abruf der Aufnahme „crash-soft“ im Format Opus mit dem Status 404
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** nennt der Grund „Abruf“, „crash-soft“, „opus“ und „HTTP 404“

#### Scenario: Beide Formate nicht dekodierbar
- **GIVEN** der Browser kann die Probe-Aufnahme in keinem Format dekodieren
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** nennt der Grund in je einer Zeile „Dekodieren“ mit „opus“ und mit „aac“, jeweils mit dem Fehlertext des Browsers

#### Scenario: Mehrere Aufnahmen scheitern
- **GIVEN** die Probe-Aufnahme lässt sich dekodieren, drei weitere Aufnahmen desselben Formats nicht
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** nennt der Grund die erste gescheiterte Aufnahme und die Anzahl 3

#### Scenario: Browser kann gar nicht dekodieren
- **GIVEN** der Browser bietet keine Möglichkeit, Audiodateien zu dekodieren
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** nennt der Grund, dass das Dekodieren in diesem Browser nicht möglich ist

### Requirement: Hinweis auf Neuladen
Der Dialog „DRSKit nicht verfügbar“ MUST den Hinweis „Neu laden kann das Problem beheben.“ zeigen, wenn mindestens ein Abruf ohne Antwort des Servers oder mit dem Status 404, 408, 429 oder einem Status ab 500 scheiterte. Sonst MUST der Hinweis fehlen.

#### Scenario: Serverfehler beim Abruf
- **GIVEN** der Abruf einer Aufnahme scheitert mit dem Status 502
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** zeigt der Dialog „Neu laden kann das Problem beheben.“

#### Scenario: Keine Antwort des Servers
- **GIVEN** der Abruf einer Aufnahme scheitert ohne Antwort des Servers
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** zeigt der Dialog „Neu laden kann das Problem beheben.“

#### Scenario: Datei auf dem Server nicht gefunden
- **GIVEN** der Abruf einer Aufnahme scheitert mit dem Status 404
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** zeigt der Dialog „Neu laden kann das Problem beheben.“

#### Scenario: Anderer Status beim Abruf
- **GIVEN** der Abruf einer Aufnahme scheitert mit dem Status 403
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** fehlt der Hinweis

#### Scenario: Nicht dekodierbar
- **GIVEN** der Browser kann die Aufnahmen in keinem Format dekodieren
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** fehlt der Hinweis

#### Scenario: Eine von mehreren Ursachen genügt
- **GIVEN** nach bestandener Probe scheitert eine Aufnahme beim Dekodieren und eine andere beim Abruf mit dem Status 502
- **WHEN** der Nutzer den Dialog öffnet
- **THEN** zeigt der Dialog „Neu laden kann das Problem beheben.“

### Requirement: Wiederholung beim Abruf
Scheitert der Abruf einer Aufnahme ohne Antwort des Servers oder mit dem Status 408, 429 oder einem Status ab 500, MUST die App ihn nach kurzer Wartezeit bis zu zweimal wiederholen, bevor er als gescheitert gilt. Andere Fehlschläge MUST NOT wiederholt werden. Bis zum Ergebnis MUST jeder Schlag synthetisch erklingen.

#### Scenario: Wiederholung gelingt
- **GIVEN** der Abruf einer Aufnahme scheitert einmal mit dem Status 502
- **WHEN** die Wiederholung gelingt
- **THEN** erklingen die Schläge mit den Aufnahmen
- **AND** das Menü zeigt keinen Hinweis bei „DRSKit“

#### Scenario: Alle Versuche scheitern
- **GIVEN** der Abruf einer Aufnahme scheitert bei allen drei Versuchen mit dem Status 502
- **WHEN** das Laden endet
- **THEN** zeigt das Menü bei „DRSKit“ „auf diesem Gerät nicht verfügbar“
- **AND** der Dialog nennt den Status 502 und „Neu laden kann das Problem beheben.“

#### Scenario: Keine Antwort des Servers
- **GIVEN** der Abruf einer Aufnahme scheitert einmal ohne Antwort des Servers
- **WHEN** die Wiederholung gelingt
- **THEN** erklingen die Schläge mit den Aufnahmen

#### Scenario: Datei nicht gefunden
- **WHEN** der Abruf einer Aufnahme mit dem Status 404 scheitert
- **THEN** wiederholt die App ihn nicht

#### Scenario: Nicht dekodierbar
- **WHEN** das Dekodieren einer Aufnahme scheitert
- **THEN** ruft die App sie nicht erneut ab

### Requirement: Begrenzte gleichzeitige Abrufe
Die App MUST höchstens vier Aufnahmen gleichzeitig abrufen, auch während Wiederholungen.

#### Scenario: Laden aller Aufnahmen
- **WHEN** die App die Aufnahmen eines Formats lädt
- **THEN** laufen zu keinem Zeitpunkt mehr als vier Abrufe gleichzeitig
- **AND** am Ende sind alle Aufnahmen geladen

### Requirement: Herkunft der Aufnahmen
Das Menü MUST im Abschnitt „Klang“ die Herkunft der Aufnahmen nennen: „DRSKit von DrumGizmo.org“ mit Verweis auf die Seite des Sets und die Lizenz „CC BY 4.0“ mit Verweis auf den Lizenztext.

#### Scenario: Namensnennung im Menü
- **WHEN** der Nutzer das Menü öffnet
- **THEN** nennt der Abschnitt „Klang“ „DRSKit von DrumGizmo.org“ und „CC BY 4.0“ als Verweise
