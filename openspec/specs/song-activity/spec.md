# song-activity Specification

## Purpose

Zeigt, wann und von wem ein Song zuletzt geändert wurde, und macht in gemeinsamen Workbooks sichtbar, was andere seit dem letzten Ansehen geändert haben.

## Requirements

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

### Requirement: Zeitangabe
Die Zeit der letzten Änderung MUST relativ erscheinen: unter einer Minute als „gerade eben“, am selben Tag in Minuten bzw. Stunden, am Vortag als „gestern“, sonst als Datum, mit Jahr nur bei einem anderen Jahr. Eine Zeit in der Zukunft MUST als „gerade eben“ erscheinen. Bei geöffneter Startseite MUST die Angabe spätestens nach einer Minute dem Lauf der Zeit folgen.

#### Scenario: Gestern
- **WHEN** die letzte Änderung gestern um 21:10 war
- **THEN** erscheint „gestern“

#### Scenario: Uhr eines Geräts geht vor
- **WHEN** die letzte Änderung eine Zeit trägt, die nach der aktuellen liegt
- **THEN** erscheint „gerade eben“

### Requirement: Neues auf der Kachel
In einem gemeinsamen Workbook MUST eine Kachel einen Punkt tragen, wenn andere Autoren den Song seit dem gesehenen Stand des Nutzers so geändert haben, dass er sich sichtbar unterscheidet, oder wenn der Nutzer den Song nie gesehen hat und er Änderungen anderer enthält. Eigene Änderungen, auch von anderen Geräten, MUST keinen Punkt erzeugen. Der Punkt MUST auch ohne Farbe erkennbar sein. In „Meine Songs“ MUST es keinen Punkt geben.

#### Scenario: Max ändert
- **GIVEN** Artjom hat „Hysteria“ in „Band“ gesehen
- **WHEN** Max danach in „Hysteria“ einen Schlag setzt
- **THEN** trägt die Kachel „Hysteria“ bei Artjom einen Punkt

#### Scenario: Hin und zurück
- **GIVEN** Artjom hat „Hysteria“ gesehen
- **WHEN** Max in „Hysteria“ einen Schlag setzt und wieder entfernt
- **THEN** trägt die Kachel „Hysteria“ bei Artjom keinen Punkt

#### Scenario: Eigenes anderes Gerät
- **WHEN** Artjom „Hysteria“ am Handy ändert
- **THEN** trägt die Kachel „Hysteria“ an seinem Laptop keinen Punkt

#### Scenario: Neuer Song eines anderen
- **WHEN** Max einen Song in „Band“ anlegt
- **THEN** trägt dessen Kachel bei Artjom einen Punkt

### Requirement: Neues in der Seitenleiste
Der Eintrag eines gemeinsamen Workbooks in der Seitenleiste MUST denselben Punkt tragen, wenn mindestens eine seiner Kacheln einen trägt, sonst keinen. Eine Anzahl MUST er nicht nennen.

#### Scenario: Songs mit Neuem
- **GIVEN** in „Band“ tragen „Hysteria“ und „Intro“ einen Punkt
- **WHEN** der Nutzer die Startseite öffnet
- **THEN** trägt der Eintrag „Band“ einen Punkt

#### Scenario: Nichts Neues
- **GIVEN** in „Proberaum“ trägt keine Kachel einen Punkt
- **WHEN** der Nutzer die Startseite öffnet
- **THEN** trägt der Eintrag „Proberaum“ keinen Punkt

### Requirement: Gesehen
Öffnet der Nutzer eine Ansicht eines Songs in einem gemeinsamen Workbook, MUST dessen aktueller Stand als gesehen gelten; solange eine Ansicht des Songs offen ist, MUST das auch für eintreffende Änderungen gelten.

#### Scenario: Song öffnen
- **GIVEN** die Kachel „Hysteria“ trägt einen Punkt
- **WHEN** der Nutzer „Hysteria“ öffnet und zur Startseite zurückkehrt
- **THEN** trägt die Kachel „Hysteria“ keinen Punkt

#### Scenario: Während der Song offen ist
- **WHEN** Max „Hysteria“ ändert, während Artjom die Doppelseite von „Hysteria“ geöffnet hat, und Artjom danach zur Startseite zurückkehrt
- **THEN** trägt die Kachel „Hysteria“ keinen Punkt

### Requirement: Gesehen auf allen Geräten
Der gesehene Stand MUST zum Konto gehören: Er MUST auf jedem anderen Gerät desselben Kontos, das die App geöffnet hat und den Server erreicht, binnen 5 Sekunden gelten, und ohne Server MUST er lokal bleiben und beim nächsten Kontakt übertragen werden.

#### Scenario: Anderes Gerät
- **GIVEN** Artjom hat die Startseite am Laptop geöffnet und „Hysteria“ trägt dort einen Punkt
- **WHEN** er „Hysteria“ am Handy öffnet
- **THEN** verschwindet der Punkt am Laptop binnen 5 Sekunden

### Requirement: Gesehen ohne Adresse
Der gesehene Stand MUST unter einer Kennung des Kontos ohne Adresse gespeichert sein.

#### Scenario: Keine Adresse im Workbook-Dokument
- **WHEN** artjom@example.org „Hysteria“ in „Band“ öffnet
- **THEN** enthält das gespeicherte Dokument von „Band“ die Adresse „artjom@example.org“ nicht

### Requirement: Spät eintreffende Änderungen
Ob eine Änderung neu ist, MUST davon abhängen, ob der gesehene Stand sie enthält, nicht von ihrer Zeit. Eine Änderung, die ein anderer offline vor dem Ansehen gemacht hat und die erst danach eintrifft, MUST als neu gelten. Kennt ein Gerät den gesehenen Stand noch nicht vollständig, MUST es nur Änderungen als neu zählen, die der Stand sicher nicht enthält.

#### Scenario: Offline-Änderung von Max
- **GIVEN** Max ändert „Hysteria“ am Vormittag offline
- **AND** Artjom öffnet „Hysteria“ am Mittag
- **WHEN** Max’ Änderung am Abend den Server erreicht
- **THEN** trägt die Kachel „Hysteria“ bei Artjom einen Punkt

### Requirement: Beginn ohne Markierungen
Hat ein Nutzer in einem gemeinsamen Workbook noch keinen gesehenen Stand, MUST beim ersten Abgleich der aktuelle Stand aller Songs des Workbooks als gesehen gelten, sodass bestehende Songs keinen Punkt tragen.

#### Scenario: Neues Mitglied
- **GIVEN** anna@example.com wird zu „Band“ mit zehn Songs eingeladen
- **WHEN** sie „Band“ zum ersten Mal sieht
- **THEN** trägt keine Kachel von „Band“ einen Punkt
