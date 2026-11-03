# Proposal

## Why

Songs sollen mit anderen gemeinsam bearbeitet werden und auf mehreren eigenen Geräten verfügbar sein. Anmeldung (`account-auth`) und zusammenführbare Song-Dokumente (`song-merge`) gibt es bereits; es fehlt ein Ort für geteilte Songs und der Abgleich über den Server.

## What Changes

- Workbooks: benannte Sammlungen von Songs auf dem Server mit genau einem Besitzer. Nur angemeldet nutzbar. Anlegen, umbenennen, löschen, solange sie leer sind.
- Mitglieder: Der Besitzer lädt per Mail-Adresse ein. Die Person ist sofort Mitglied und bekommt eine Benachrichtigung per Mail. Der Besitzer kann Mitglieder entfernen, Mitglieder können ein Workbook verlassen. Alle Mitglieder lesen und schreiben.
- Wer ein Workbook verlässt oder entfernt wird, behält dessen Songs als eigene, vom Workbook abgekoppelte Songs, einschließlich offline gemachter Änderungen.
- Startseite: Jedes Workbook erscheint als Karte mit Titel, Mitgliedern und seinen Songs, die lokalen Songs in der Karte „Meine Songs“. Es entsteht keine neue Navigationsebene, Song-Adressen bleiben unverändert.
- Ein lokaler Song wird über „Zu Workbook …“ in ein Workbook verschoben. Ein in einer Workbook-Karte angelegter Song entsteht direkt dort. Löschen eines Workbook-Songs löscht ihn nach Nachfrage für alle.
- Synchronisierung: Änderungen erreichen die anderen Geräte binnen weniger Sekunden. Der Server benachrichtigt verbundene Clients über Änderungen; offline gemachte Änderungen werden beim nächsten Kontakt abgeglichen.
- Der Server weist ungültige Song-Daten und unabhängig entstandene Fassungen eines Songs zurück. Die eigene Fassung bleibt dann als Kopie erhalten.
- Import: „Ersetzen“ eines Workbook-Songs wirkt für alle Mitglieder, der Import-Dialog weist darauf hin.

Nicht enthalten: Songs kopieren oder aus einem Workbook herausnehmen, Workbooks abgeben, Leserechte, Veröffentlichen, Anzeige anwesender Mitglieder, Betrieb hinter HTTPS.

## Capabilities

### New Capabilities
- `workbooks`: Workbooks anlegen, umbenennen und löschen, Mitglieder einladen, entfernen und austreten, Darstellung als Karten.
- `workbook-sync`: Songs in Workbooks (verschieben, anlegen, löschen), Abgleich zwischen Geräten, Umgang mit Offline-Änderungen, ungültigen und unabhängig entstandenen Fassungen.

### Modified Capabilities
- `song-library`: Song-Liste in Karten je Workbook und „Meine Songs“.
- `library-persistence`: Export enthält Workbook-Songs; Import-Dialog weist bei „Ersetzen“ eines Workbook-Songs darauf hin, dass es alle Mitglieder betrifft.

## Impact

- `server/`: Tabellen für Workbooks, Mitglieder und Song-Dokumente; Endpunkte für Workbooks, Mitglieder, Songs, Sync; Ereigniskanal (Server-Sent Events); Einladungsmails. Der Server nutzt Dokumentform und Formatprüfung aus `src/persistence` mit.
- `src/`: neues Modul für den Abgleich mit dem Server; Repository speichert je Song die Zugehörigkeit zu einem Workbook und den letzten Server-Stand (neue IndexedDB-Version); Store kennt Workbooks; Startseite mit Karten.
- Keine neuen Laufzeitabhängigkeiten.
