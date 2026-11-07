# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
