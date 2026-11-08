# Spec Delta

## MODIFIED Requirements

### Requirement: Bearbeiten über die Auswahl
Ein Klick auf einen Segmentnamen MUST das Segment auswählen. Ein Klick auf einen Takt MUST diesen Takt auswählen, Shift+Klick einen Bereich in Songreihenfolge. Es MUST immer nur entweder ein Segment oder Takte ausgewählt sein. Zur Auswahl MUST ein Popover an der Auswahl erscheinen, das alle Aktionen für diese Auswahl enthält, die der Sperrzustand des Songs zulässt. Das Popover MUST innerhalb der Breite der linken Seite liegen und nach links rücken, wo es an der Auswahl über den rechten Rand ragen würde. Escape oder ein Klick außerhalb von Struktur, Popover, Abspiel-Knöpfen und Übetempo im Kopf der Doppelseite MUST die Auswahl aufheben und das Popover schließen.

#### Scenario: Takte auswählen
- **WHEN** der Nutzer Takt 5 anklickt und mit Shift Takt 8 anklickt
- **THEN** sind die Takte 5 bis 8 ausgewählt und ein Popover für diese Takte ist geöffnet

#### Scenario: Segment auswählen
- **WHEN** Takt 2 ausgewählt ist und der Nutzer auf den Segmentnamen „Verse“ klickt
- **THEN** ist nur das Segment „Verse“ ausgewählt und das Popover zeigt die Aktionen für das Segment

#### Scenario: Auswahl aufheben
- **WHEN** Takte ausgewählt sind und der Nutzer Escape drückt
- **THEN** ist nichts mehr ausgewählt und kein Popover ist geöffnet

#### Scenario: Popover am rechten Rand
- **WHEN** der Nutzer in einem 390 px breiten Fenster den letzten Takt einer 16-Beat-Zeile auswählt
- **THEN** liegt das Takt-Popover vollständig innerhalb der Breite der linken Seite

#### Scenario: Bedienung im Kopf
- **WHEN** die Takte 2 bis 3 ausgewählt sind und der Nutzer im Kopf „Üben“ einschaltet
- **THEN** sind weiterhin die Takte 2 bis 3 ausgewählt
