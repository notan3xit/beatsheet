# Spec Delta

## ADDED Requirements

### Requirement: Gesehene Stände abgleichen
Die gesehenen Stände (`song-activity`) aller Mitglieder eines gemeinsamen Workbooks MUST in einem gemeinsamen Dokument des Workbooks liegen, das wie die Songs abgeglichen und nach den Regeln von `song-merge` zusammengeführt wird, auch nach Offline-Arbeit. Jedes Mitglied MUST es lesen können. Der eigene Bestand MUST kein solches Dokument haben. Das Dokument MUST weder als Song erscheinen noch zur Anzahl der Songs oder zur Frage zählen, ob sich das Workbook löschen lässt.

#### Scenario: Gleichzeitig gesehen
- **GIVEN** Artjom und Max sind offline
- **WHEN** beide „Hysteria“ öffnen und danach den Server erreichen
- **THEN** gilt „Hysteria“ für beide als gesehen

#### Scenario: Anzahl der Songs
- **GIVEN** „Band“ hat 3 Songs
- **WHEN** ein Mitglied einen Song von „Band“ geöffnet hat
- **THEN** zeigt der Eintrag „Band“ weiterhin „3 Songs“

### Requirement: Nur eigene gesehene Stände
Der Server MUST eine Übertragung des Workbook-Dokuments zurückweisen, wenn sie Einträge eines anderen Mitglieds ändert oder das Dokument nicht seiner Form entspricht. Das gespeicherte Dokument MUST dann unverändert bleiben, und das Gerät MUST die Fassung des Servers übernehmen.

#### Scenario: Fremden Eintrag ändern
- **WHEN** ein Client von max@example.org den gesehenen Stand von artjom@example.org ändert
- **THEN** weist der Server die Übertragung zurück und der gesehene Stand von artjom@example.org bleibt unverändert
