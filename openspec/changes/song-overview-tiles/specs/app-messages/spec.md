# Spec Delta

## MODIFIED Requirements

### Requirement: Meldungen gesammelt oben
Hinweise, Ergebnisse und Fehler von Aktionen MUST gestapelt unter dem Kopf der App erscheinen, unabhängig davon, wo die Aktion ausgelöst wurde. Der Stapel MUST beim Scrollen sichtbar bleiben und MUST keine Inhalte verdecken. Meldungen zu einem Ereignis MUST sich über ein Kreuz am rechten Rand schließen lassen. Hinweise zu einem Zustand MUST stehen bleiben, solange er andauert.

#### Scenario: Fehler einer Aktion in einer Karte
- **WHEN** das Anlegen eines Songs in „Band“ scheitert
- **THEN** erscheint der Fehler im Stapel und nicht im Bereich von „Band“

#### Scenario: Erfolgreicher neuer Versuch
- **GIVEN** das Anlegen eines Songs in „Band“ ist gescheitert
- **WHEN** ein neuer Versuch gelingt
- **THEN** verschwindet der Fehler aus dem Stapel

#### Scenario: Ergebnis des Imports
- **WHEN** ein Import abgeschlossen ist
- **THEN** erscheint das Ergebnis im Stapel und lässt sich schließen

#### Scenario: Hinweis zu einem Zustand
- **WHEN** der Server nicht erreichbar ist
- **THEN** steht der Hinweis im Stapel, ohne dass er sich schließen lässt
