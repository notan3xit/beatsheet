# Spec Delta

## Purpose

Legt fest, wo die App Meldungen zeigt: gesammelt an einer Stelle oben, damit sie nicht je nach Auslöser an anderer Stelle stehen.

## ADDED Requirements

### Requirement: Meldungen gesammelt oben
Hinweise, Ergebnisse und Fehler von Aktionen MUST gestapelt unter dem Kopf der App erscheinen, unabhängig davon, wo die Aktion ausgelöst wurde. Der Stapel MUST beim Scrollen sichtbar bleiben und MUST keine Inhalte verdecken. Meldungen zu einem Ereignis MUST sich über ein Kreuz am rechten Rand schließen lassen. Hinweise zu einem Zustand MUST stehen bleiben, solange er andauert.

#### Scenario: Fehler einer Aktion in einer Karte
- **WHEN** das Anlegen eines Songs in der Karte „Band“ scheitert
- **THEN** erscheint der Fehler im Stapel und nicht in der Karte

#### Scenario: Erfolgreicher neuer Versuch
- **GIVEN** das Anlegen eines Songs in der Karte „Band“ ist gescheitert
- **WHEN** ein neuer Versuch gelingt
- **THEN** verschwindet der Fehler aus dem Stapel

#### Scenario: Ergebnis des Imports
- **WHEN** ein Import abgeschlossen ist
- **THEN** erscheint das Ergebnis im Stapel und lässt sich schließen

#### Scenario: Hinweis zu einem Zustand
- **WHEN** der Server nicht erreichbar ist
- **THEN** steht der Hinweis im Stapel, ohne dass er sich schließen lässt

### Requirement: Ebenen der Oberfläche
Überlagernde Elemente MUST in fester Reihenfolge liegen, von unten nach oben: Inhalt, Meldungen, Popover, modale Dialoge, gezogene Elemente. Woran der Nutzer gerade arbeitet, MUST also über den Meldungen liegen.

#### Scenario: Meldung und offenes Popover
- **GIVEN** das Formular „Anmelden“ oder ein anderes Popover ist offen
- **WHEN** eine Meldung im Stapel steht
- **THEN** liegt das Popover über der Meldung

#### Scenario: Nachfrage und Popover
- **WHEN** ein Popover eine Nachfrage öffnet
- **THEN** liegt die Nachfrage über dem Popover und den Meldungen

### Requirement: Eingabefehler am Feld
Fehler, die eine Eingabe in einem Formular oder Popover betreffen, MUST beim Formular erscheinen, damit sie beim Korrigieren sichtbar bleiben.

#### Scenario: Ungültige Adresse beim Einladen
- **WHEN** der Besitzer eine ungültige Adresse einlädt
- **THEN** erscheint der Fehler im Popover „Mitglieder“
