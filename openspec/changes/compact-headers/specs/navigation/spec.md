# Spec Delta

## ADDED Requirements

### Requirement: Umbruch der Kopfzeile
Reicht die Breite nicht für eine Zeile, MUST die Kopfzeile von Doppelseite und Pattern-Editor umbrechen statt ihre Elemente zu stauchen. Die Elemente am rechten Rand, auf der Doppelseite ab „Song löschen“ und im Pattern-Editor ab „Rückgängig“, jeweils bis zum Schloss, MUST eine Gruppe bilden, die nur als Ganzes umbricht und rechtsbündig steht. Kein Wert und kein Knopf der Kopfzeile MUST in sich umbrechen.

#### Scenario: Pattern-Editor in mittlerer Breite
- **WHEN** der Nutzer den Pattern-Editor eines entsperrten Songs in einem Fenster ansieht, das nicht für eine Zeile reicht
- **THEN** stehen „Rückgängig“, „Wiederherstellen“, „Duplizieren“, „Löschen“ und das Schloss gemeinsam rechtsbündig in der nächsten Zeile

#### Scenario: Doppelseite in mittlerer Breite
- **WHEN** der Nutzer die Doppelseite eines entsperrten Songs in einem 600 px breiten Fenster ansieht
- **THEN** steht „♩ = 120“ in einer Zeile, „Song löschen“ in einer Zeile, und das Schloss liegt vollständig im Fenster rechtsbündig in der Gruppe am rechten Rand

#### Scenario: Gesperrt
- **WHEN** der Song gesperrt ist und die Kopfzeile umbricht
- **THEN** steht das Schloss rechtsbündig
