## MODIFIED Requirements

### Requirement: Letzte Änderung auf der Kachel
Jede Song-Kachel MUST die Zeit der letzten Änderung des Songs nennen. In einem gemeinsamen Workbook MUST sie dazu deren Autor nennen: den Namen aus seinem Profil, ohne Profil seine Adresse, ohne Autor oder wenn der Autor kein Mitglied des Workbooks ist niemanden. In „Meine Songs“ MUST sie keinen Autor nennen. Maßgeblich ist die neueste Änderung nach der Uhr des Geräts, das sie gemacht hat.

#### Scenario: Gemeinsames Workbook
- **GIVEN** Max hat „Hysteria“ in „Band“ vor zwei Stunden zuletzt geändert
- **WHEN** ein Mitglied „Band“ wählt
- **THEN** nennt die Kachel „Hysteria“ die Zeit vor zwei Stunden und „Max“

#### Scenario: Autor nicht mehr Mitglied
- **GIVEN** Max hat „Hysteria“ in „Band“ zuletzt geändert und „Band“ danach verlassen
- **WHEN** ein Mitglied „Band“ wählt
- **THEN** nennt die Kachel „Hysteria“ die Zeit der Änderung und keinen Autor

#### Scenario: Meine Songs
- **WHEN** der Nutzer „Meine Songs“ ansieht
- **THEN** nennen die Kacheln die Zeit der letzten Änderung und keinen Autor

### Requirement: Gesehen
Öffnet der Nutzer eine Ansicht eines Songs in einem gemeinsamen Workbook, MUST dessen aktueller Stand als gesehen gelten; solange eine Ansicht des Songs offen ist, MUST das auch für eintreffende Änderungen gelten. Der gesehene Stand MUST zum Konto gehören und unter einer Kennung des Kontos ohne Adresse gespeichert sein: Er MUST auf jedem anderen Gerät desselben Kontos, das die App geöffnet hat und den Server erreicht, binnen 5 Sekunden gelten, und ohne Server MUST er lokal bleiben und beim nächsten Kontakt übertragen werden.

#### Scenario: Song öffnen
- **GIVEN** die Kachel „Hysteria“ trägt einen Punkt
- **WHEN** der Nutzer „Hysteria“ öffnet und zur Startseite zurückkehrt
- **THEN** trägt die Kachel „Hysteria“ keinen Punkt

#### Scenario: Anderes Gerät
- **GIVEN** Artjom hat die Startseite am Laptop geöffnet und „Hysteria“ trägt dort einen Punkt
- **WHEN** er „Hysteria“ am Handy öffnet
- **THEN** verschwindet der Punkt am Laptop binnen 5 Sekunden

#### Scenario: Während der Song offen ist
- **WHEN** Max „Hysteria“ ändert, während Artjom die Doppelseite von „Hysteria“ geöffnet hat, und Artjom danach zur Startseite zurückkehrt
- **THEN** trägt die Kachel „Hysteria“ keinen Punkt

#### Scenario: Keine Adresse im Workbook-Dokument
- **WHEN** artjom@example.org „Hysteria“ in „Band“ öffnet
- **THEN** enthält das gespeicherte Dokument von „Band“ die Adresse „artjom@example.org“ nicht
