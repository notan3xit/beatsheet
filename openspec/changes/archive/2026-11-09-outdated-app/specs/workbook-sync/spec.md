## ADDED Requirements

### Requirement: Abgleich nur mit aktueller App-Version
Die App MUST beim Abgleich und beim Anlegen eines Songs in einem Workbook ihre Version mitsenden. Der Server MUST solche Anfragen zurückweisen, wenn die Version fehlt oder älter ist als seine eigene, und die gespeicherten Songs MUST dann unverändert bleiben. Eine gleiche oder neuere Version MUST er annehmen.

#### Scenario: Veraltete Version
- **GIVEN** der Server läuft in Version 0.9.0
- **WHEN** eine App in Version 0.8.1 „Intro“ aus „Band“ mit einer Änderung abgleicht
- **THEN** weist der Server den Abgleich zurück
- **AND** die anderen Mitglieder sehen „Intro“ unverändert

#### Scenario: Ohne Versionsangabe
- **WHEN** eine App ohne Versionsangabe einen Abgleich sendet
- **THEN** weist der Server ihn zurück, ohne Songs zu ändern oder zu senden

#### Scenario: Aktuelle Version
- **GIVEN** der Server läuft in Version 0.9.0
- **WHEN** eine App in Version 0.9.0 abgleicht
- **THEN** nimmt der Server den Abgleich an

### Requirement: Abgleich pausiert bei veralteter App
Weist der Server einen Abgleich wegen einer veralteten Version zurück, MUST die App den Abgleich aller Workbooks pausieren, bis sie neu geladen wird: Sie MUST keine Songs übertragen und keine vom Server übernehmen. Songs MUST lokal bearbeitbar bleiben, und Änderungen MUST nach dem Neuladen übertragen werden. Solange die Pause dauert, MUST oben ein Hinweis darauf mit dem Knopf „Neu laden“ stehen, statt des Hinweises ohne Verbindung.

#### Scenario: Neue Version veröffentlicht
- **GIVEN** der Nutzer hat die App geöffnet, und auf dem Server läuft inzwischen eine neuere Version
- **WHEN** die App abgleicht
- **THEN** zeigt sie oben einen Hinweis, dass der Abgleich bis zum Neuladen pausiert ist, mit dem Knopf „Neu laden“
- **AND** der Hinweis lässt sich nicht schließen

#### Scenario: Weiterarbeiten während der Pause
- **GIVEN** der Abgleich ist pausiert
- **WHEN** der Nutzer in „Intro“ aus „Band“ einen Takt hinzufügt
- **THEN** bleibt der Takt lokal gespeichert, und die App sendet keinen Abgleich an den Server

#### Scenario: Änderungen eines anderen Mitglieds während der Pause
- **GIVEN** der Abgleich ist pausiert
- **WHEN** ein anderes Mitglied „Intro“ ändert
- **THEN** zeigt die App „Intro“ weiterhin ohne diese Änderung

#### Scenario: Neu laden
- **GIVEN** der Abgleich ist pausiert, und der Nutzer hat „Intro“ lokal geändert
- **WHEN** er „Neu laden“ wählt
- **THEN** lädt die App neu, ohne die Änderung zu verlieren
- **AND** nach dem Neuladen ist die Änderung auf dem Server
