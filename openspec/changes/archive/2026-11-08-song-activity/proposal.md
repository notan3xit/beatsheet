# Proposal

## Why

Die Startseite zeigt nicht, wann ein Song zuletzt geändert wurde. In gemeinsamen Workbooks bleibt unbemerkt, was andere seit dem letzten Ansehen geändert haben; man müsste jeden Song öffnen und seinen Verlauf durchsehen.

## What Changes

- Jede Song-Kachel nennt die Zeit der letzten Änderung, relativ („vor 2 Std.“, „gestern“, dann Datum); in gemeinsamen Workbooks dazu, wer sie gemacht hat. Zeit und Autor stammen aus den Changes des Song-Dokuments.
- In gemeinsamen Workbooks trägt eine Kachel einen Punkt, wenn andere den Song seit dem letzten Ansehen mit sichtbarer Wirkung geändert haben oder er noch nie angesehen wurde. Der Eintrag eines Workbooks in der Seitenleiste trägt einen Punkt, wenn eine seiner Kacheln einen trägt.
- Das Öffnen eines Songs merkt seinen Stand als gesehen, für das Konto auf allen Geräten, auch offline.
- Neues Automerge-Dokument je gemeinsamem Workbook, das die gesehenen Stände aller Mitglieder hält. Es reist im bestehenden Abgleich des Workbooks mit; der Server legt es an und lässt jedes Mitglied nur seine eigenen Einträge ändern. Keine neuen Endpunkte.
- Mitglieder können technisch ablesen, was andere gesehen haben; die App zeigt es nicht an.

Nicht Teil dieses Changes: die Song-Liste eines Workbooks in sein Dokument zu verlegen.

## Capabilities

### New Capabilities
- `song-activity`: Zeit und Autor der letzten Änderung eines Songs, gesehener Stand je Konto, Kennzeichnung von Neuem auf Kacheln und in der Seitenleiste.

### Modified Capabilities
- `song-library`: Die Kachel eines Songs nennt zusätzlich die Zeit der letzten Änderung.
- `workbook-sync`: Abgleich des Workbook-Dokuments mit den gesehenen Ständen; der Server prüft, dass jedes Mitglied nur eigene Einträge ändert.
- `server-limits`: Das Workbook-Dokument belegt Speicher beim Besitzer des Workbooks.

## Impact

- `server/songs.ts`, `server/db.ts`, `server/workbooks.ts`: Tabelle für Workbook-Dokumente, optionaler Teil `workbook` im Abgleich, eigene Prüfung statt der für Songs, Löschen mit dem Workbook.
- `src/sync/api.ts`, `src/sync/sync.ts`: Workbook-Dokument mitsenden und übernehmen, nicht für den eigenen Bestand.
- `src/persistence`: Ablage des Workbook-Dokuments in IndexedDB (neue Version), letzte Änderung und Neues je Song aus dem Song-Dokument.
- `src/state`, `src/ui`: Gesehen beim Öffnen eines Songs, Kachel, Seitenleiste; Farben nach `design-system`.
- Ältere App-Versionen senden kein Workbook-Dokument und bleiben verträglich. Dateiformat und Song-Dokumente bleiben unverändert.
