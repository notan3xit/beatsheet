# Spec Delta

## MODIFIED Requirements

### Requirement: Knöpfe nur mit Freigabe
Solange ein Song gesperrt ist, MUST jeder Knopf auf der Doppelseite und im Pattern-Editor wirkungslos sein, außer er ist als lesend freigegeben. Freigegeben MUST nur sein, was den Song nicht ändert: Schloss, Pfad, Abspiel-Tasten, Abspiel-Aktionen der Popover, Links zu Groove und Fill im Takt-Popover, Takte, Segmentnamen und die Namen der Pattern-Karten. Song-Liste, App-Kopfzeile und Bestätigungsdialoge MUST davon unberührt bleiben.

#### Scenario: Knopf ohne Freigabe per Maus
- **WHEN** der Song gesperrt ist und der Nutzer auf einen Knopf ohne Freigabe klickt
- **THEN** bewirkt der Klick nichts

#### Scenario: Knopf ohne Freigabe per Tastatur
- **WHEN** der Song gesperrt ist und der Nutzer einen Knopf ohne Freigabe fokussiert und Enter drückt
- **THEN** bewirkt die Taste nichts

#### Scenario: Knopf ohne Freigabe im entsperrten Song
- **WHEN** der Song entsperrt ist und der Nutzer auf einen Knopf ohne Freigabe klickt
- **THEN** führt der Knopf seine Aktion aus

#### Scenario: Alle aktiven Knöpfe freigegeben
- **WHEN** der Nutzer einen gesperrten Song auf der Doppelseite, mit geöffnetem Popover oder im Pattern-Editor ansieht
- **THEN** ist jeder dort aktive Knopf als lesend freigegeben

#### Scenario: Freigegebener Knopf
- **WHEN** der Song gesperrt ist und der Nutzer im Pfad auf „Songs“ klickt
- **THEN** zeigt die App die Song-Liste

### Requirement: Auswahl im gesperrten Song
Takte und Segmente eines gesperrten Songs MUST auswählbar bleiben wie im entsperrten Song. Ihr Popover MUST nur die Aktionen „Ab hier abspielen“ und „In Schleife abspielen“ anbieten, das Popover von Takten zusätzlich die Links zu Groove und Fill. Die Patternseite MUST die Karten ausgewählter Takte hervorheben wie im entsperrten Song.

#### Scenario: Takte auswählen
- **WHEN** der Nutzer bei gesperrtem Song Takt 5 anklickt und mit Shift Takt 8 anklickt
- **THEN** sind die Takte 5 bis 8 ausgewählt und hervorgehoben
- **AND** bietet das Popover außer den Links zu Groove und Fill nur „Ab hier abspielen“ und „In Schleife abspielen“

#### Scenario: Segment auswählen
- **WHEN** der Nutzer bei gesperrtem Song den Segmentnamen „Verse“ anklickt
- **THEN** ist das Segment ausgewählt und das Popover bietet nur „Ab hier abspielen“ und „In Schleife abspielen“

#### Scenario: Schleife im gesperrten Song
- **WHEN** der Nutzer bei gesperrtem Song die Takte 5 bis 8 auswählt und „In Schleife abspielen“ wählt
- **THEN** spielt die App die Takte 5 bis 8 in Schleife

#### Scenario: Link im gesperrten Song
- **WHEN** der Nutzer bei gesperrtem Song einen Takt mit Groove A auswählt und „zum Groove“ anklickt
- **THEN** öffnet die App den Pattern-Editor von A gesperrt

#### Scenario: Karten im gesperrten Song
- **WHEN** der Nutzer bei gesperrtem Song einen Takt mit Groove A auswählt
- **THEN** ist die Karte von A hervorgehoben
