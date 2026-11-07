# Spec Delta

## Purpose

Legt fest, wie sich Beatsheet zum Home-Bildschirm eines Geräts hinzufügen lässt und wie es von dort startet: mit Name und Icon, in einem eigenen Fenster.

## ADDED Requirements

### Requirement: Start in eigenem Fenster
Die App MUST sich zum Home-Bildschirm hinzufügen lassen. Von dort gestartet MUST sie in einem eigenen Fenster ohne Bedienelemente des Browsers auf ihrer Startseite öffnen.

#### Scenario: Start vom Home-Bildschirm
- **GIVEN** der Nutzer hat die App zum Home-Bildschirm hinzugefügt
- **WHEN** er sie dort startet
- **THEN** öffnet sie in einem eigenen Fenster ohne Adressleiste
- **AND** zeigt ihre Startseite

#### Scenario: Weiter im Browser nutzbar
- **WHEN** der Nutzer die App im Browser öffnet
- **THEN** verhält sie sich wie ohne Home-Bildschirm

### Requirement: Name und Icon
Auf dem Home-Bildschirm MUST die App den Namen „Beatsheet“ und das Symbol der Roten Beete aus dem Logo auf deckendem Hintergrund tragen. Das Icon MUST für die vom Gerät verlangten Größen vorliegen und MUST auch dann vollständig sichtbar bleiben, wenn das Gerät seine Ecken oder Form maskiert.

#### Scenario: Icon auf dem iPad
- **WHEN** der Nutzer die App auf dem iPad zum Home-Bildschirm hinzufügt
- **THEN** zeigt der Home-Bildschirm die Rote Beete mit dem Namen „Beatsheet“

#### Scenario: Maskiertes Icon
- **GIVEN** ein Gerät maskiert Icons als Kreis
- **WHEN** es das Icon der App zeigt
- **THEN** ist die Rote Beete vollständig sichtbar

### Requirement: Farbe der Systemleiste
Die Farbe, die das Gerät um die App herum zeigt, MUST der Fläche der Kopfzeile im aktuell gezeigten Farbschema entsprechen. Sie MUST der Wahl im Menü folgen, bei „Wie System“ der Systemeinstellung, und sich ohne Neuladen ändern. Bis die App geladen ist, MUST sie der Systemeinstellung folgen.

#### Scenario: Wie System
- **GIVEN** das Farbschema ist „Wie System“ und das System ist auf dunkel eingestellt
- **WHEN** die App geladen ist
- **THEN** nutzt das Gerät die Farbe der Kopfzeile in Mocha

#### Scenario: Wahl weicht von der Systemeinstellung ab
- **GIVEN** das System ist auf dunkel eingestellt und das Farbschema ist „Hell“
- **WHEN** die App geladen ist
- **THEN** nutzt das Gerät die Farbe der Kopfzeile in Latte

#### Scenario: Wahl ändern
- **GIVEN** die App läuft mit dem Farbschema „Hell“
- **WHEN** der Nutzer im Menü „Dunkel“ wählt
- **THEN** nutzt das Gerät ohne Neuladen die Farbe der Kopfzeile in Mocha

#### Scenario: Systemeinstellung ändert sich
- **GIVEN** das Farbschema ist „Wie System“
- **WHEN** das System von hell auf dunkel wechselt
- **THEN** nutzt das Gerät ohne Neuladen die Farbe der Kopfzeile in Mocha
