# Spec Delta

## ADDED Requirements

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
