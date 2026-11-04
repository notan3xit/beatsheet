# Proposal

## Why

Vor dem öffentlichen Betrieb kann jeder mit einer Mail-Adresse den Server unbegrenzt mit Songs, Workbooks und offenen Verbindungen belasten. Grenzen schützen die Platte und die Verfügbarkeit für alle.

## What Changes

- Speichergrenze je Account: Songs zählen beim Besitzer ihres Workbooks. Der eigene Bestand zählt beim Account selbst.
- Gesamtgrenze für den Speicher aller Accounts, weil neue Accounts die Grenze je Account sonst umgehen.
- Grenzen für eigene Workbooks, Mitglieder je Workbook und gleichzeitige Ereignis-Verbindungen, je Account und insgesamt.
- Ist eine Grenze erreicht, weist der Server die Änderung ab. Die App meldet das, die Daten bleiben auf dem Gerät und gehen hinaus, sobald wieder Platz ist.
- Löschen bleibt immer möglich und gibt Speicher frei.

Nicht enthalten: Begrenzung der Anfragen pro Zeit, Anzeige des belegten Speichers, Kompaktierung der Dokumente, Löschen ganzer Accounts.

## Capabilities

### New Capabilities
- `server-limits`: Grenzen für Speicher, Workbooks, Mitglieder und Verbindungen und das Verhalten beim Erreichen.

### Modified Capabilities
- keine

## Impact

- `server/`: Grenzen in einem eigenen Modul, Prüfung in `songs.ts`, `workbooks.ts`, `events.ts`.
- `src/sync`: neue Fehlercodes und Antwort `quota` im Abgleich.
- `src/ui`: Meldungstexte.
- Keine Änderung an Dateiformat und IndexedDB, keine neuen Abhängigkeiten.
