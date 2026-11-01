# Spec Delta

## MODIFIED Requirements

### Requirement: Pattern anlegen
Das System MUST das Anlegen eines Patterns mit Typ (Groove oder Fill), Name und Länge in Beats innerhalb eines Songs ermöglichen; das Pattern gehört ausschließlich zu diesem Song. Ein Beat entspricht einer Viertelnote. Die Länge MUST eine ganze Zahl von 1 bis 16 sein. Ohne Angaben gelten für einen Groove 4 Beats und für einen Fill 1 Beat. Jedes Pattern MUST eine stabile, eindeutige ID erhalten, die sich nie ändert.

#### Scenario: Groove mit Standardwerten anlegen
- **WHEN** der Nutzer einen neuen Groove anlegt, ohne die Länge anzugeben
- **THEN** existiert ein Pattern vom Typ Groove mit 4 Beats und einer eindeutigen ID
- **AND** alle Beats sind leer und in Sechzehnteln unterteilt

#### Scenario: Fill mit Standardwerten anlegen
- **WHEN** der Nutzer einen neuen Fill anlegt, ohne die Länge anzugeben
- **THEN** existiert ein Pattern vom Typ Fill mit 1 Beat

#### Scenario: Ungültige Länge
- **WHEN** der Nutzer ein Pattern mit der Länge 0 oder 17 anlegen will
- **THEN** wird das Pattern nicht angelegt und der Nutzer erhält einen Hinweis auf den erlaubten Bereich 1 bis 16

#### Scenario: Pattern gehört zum Song
- **WHEN** der Nutzer im Song „Hysteria“ einen Groove anlegt
- **THEN** erscheint der Groove nur bei „Hysteria“ und in keinem anderen Song

### Requirement: Pattern-Namen
Jedes Pattern MUST einen nicht leeren Namen haben. Ohne Angabe vergibt das System einen Namen aus Typ und laufender Nummer innerhalb des Songs. Doppelte Namen MUST zulässig sein, da die Identität über die ID läuft.

#### Scenario: Automatischer Name
- **WHEN** der Nutzer den dritten Groove eines Songs ohne Namen anlegt
- **THEN** heißt das Pattern „Groove 3“

#### Scenario: Leerer Name wird abgelehnt
- **WHEN** der Nutzer den Namen eines Patterns auf eine leere oder nur aus Leerzeichen bestehende Zeichenkette ändert
- **THEN** bleibt der bisherige Name erhalten

### Requirement: Pattern duplizieren
Das System MUST das Duplizieren eines Patterns innerhalb seines Songs ermöglichen. Die Kopie MUST eine neue ID, den gleichen Typ, die gleiche Länge und den gleichen Inhalt erhalten, den Namen des Originals mit dem Zusatz „(Kopie)“ tragen und eine eigene Farbe nach der Farbvergabe-Regel bekommen.

#### Scenario: Groove duplizieren
- **WHEN** der Nutzer den Groove „Verse“ dupliziert
- **THEN** existiert zusätzlich ein Groove „Verse (Kopie)“ mit identischem Inhalt und eigener ID
- **AND** spätere Änderungen an der Kopie verändern das Original nicht

### Requirement: Pattern löschen
Das System MUST das Löschen eines Patterns nach Bestätigung durch den Nutzer ermöglichen. Wird das Pattern in der Struktur verwendet, MUST die Nachfrage die Zahl der betroffenen Takte nennen; nach dem Löschen haben diese Takte keinen Groove bzw. keinen Fill mehr.

#### Scenario: Löschen bestätigt
- **WHEN** der Nutzer ein Pattern löscht und die Nachfrage bestätigt
- **THEN** ist das Pattern nicht mehr im Song

#### Scenario: Löschen abgebrochen
- **WHEN** der Nutzer ein Pattern löschen will und die Nachfrage ablehnt
- **THEN** bleibt das Pattern unverändert erhalten

#### Scenario: Verwendetes Pattern löschen
- **WHEN** der Nutzer Groove A löscht, der in 12 Takten verwendet wird, und bestätigt
- **THEN** nannte die Nachfrage 12 Takte
- **AND** diese 12 Takte haben danach keinen Groove

## ADDED Requirements

### Requirement: Pattern-Farbe
Jedes Pattern MUST eine Catppuccin-Akzentfarbe ungleich „red“ haben, gespeichert als Farbname. Ein neues Pattern MUST die erste Farbe einer festen Reihenfolge erhalten, die im Song noch nicht vergeben ist; sind alle vergeben, beginnt die Reihenfolge von vorn.

#### Scenario: Erste Patterns eines Songs
- **WHEN** in einem leeren Song nacheinander zwei Grooves und ein Fill angelegt werden
- **THEN** erhalten sie die ersten drei Farben der Reihenfolge in dieser Reihenfolge

#### Scenario: Freie Farbe wird wiederverwendet
- **WHEN** das Pattern mit der ersten Farbe gelöscht und danach ein neues Pattern angelegt wird
- **THEN** erhält das neue Pattern wieder die erste Farbe

## REMOVED Requirements

### Requirement: Bibliotheksübersicht
**Reason**: Es gibt keine globale Bibliothek mehr; die Patterns eines Songs zeigt die rechte Seite der Doppelseite.
**Migration**: Siehe `songbook-view`, Anforderung „Patternseite“.
