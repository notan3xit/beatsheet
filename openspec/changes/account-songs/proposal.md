# Proposal

## Why

„Meine Songs“ liegen nur im Browser. Wer sich auf einem zweiten Gerät anmeldet, sieht sie nicht, obwohl der Account dort derselbe ist. Eigene Songs sollen zum Account gehören und auf allen eigenen Geräten verfügbar sein.

## What Changes

- Angemeldet gehören „Meine Songs“ zum Account und erreichen alle Geräte mit demselben Login binnen weniger Sekunden.
- Beim Anmelden wandern lokale Songs in den Bestand des Accounts und werden mit dem zusammengeführt, was dort schon liegt. Die App weist darauf hin.
- Offline bleiben eigene Songs voll nutzbar, auch Anlegen und Löschen. Der Abgleich folgt beim nächsten Kontakt.
- **BREAKING** Abmelden entfernt übertragene eigene Songs vom Gerät. Sie bleiben im Account und kommen bei der nächsten Anmeldung zurück. Songs, die nie übertragen wurden, bleiben auf dem Gerät.
- Ein eigener Song lässt sich weiter „Zu Workbook …“ verschieben. Die eigenen anderen Geräte folgen, ohne Änderungen zu verlieren.
- Ohne Anmeldung bleibt die App rein lokal.

Nicht enthalten: Songs aus einem Workbook zurück in „Meine Songs“ holen, Speichergrenzen je Account, Account löschen, Neuladen ohne Netz (eigener Change).

## Capabilities

### New Capabilities
- `account-songs`: Eigene Songs im Account, Übernahme beim Anmelden, Offline-Arbeit, Abmelden, Verschieben in ein Workbook, Zugriffsschutz.

### Modified Capabilities
- `account-auth`: Abmelden lässt übertragene eigene Songs nicht mehr auf dem Gerät.
- `song-library`: „Meine Songs“ umfasst lokale und zum Account gehörende Songs.
- `workbooks`: Der persönliche Bestand erscheint nicht als Workbook-Karte.
- `workbook-sync`: Abmelden behandelt eigene Songs nach `account-songs`.

## Impact

- `server/`: persönlicher Bestand je Account (ein verstecktes Workbook), Endpunkt zum Verschieben zwischen Workbooks, Antwort `moved` im Abgleich.
- `src/sync`: Hochladen lokaler Songs, Löschen ohne Verbindung, Verschieben.
- `src/persistence`: vorgemerktes Löschen; keine neue IndexedDB-Version.
- `src/ui`: Filter für den persönlichen Bestand, Hinweis nach der Übernahme.
- Bestehende Tests, die „Meine Songs“ als rein lokal voraussetzen, ändern sich mit den Anforderungen. Keine neuen Abhängigkeiten.
