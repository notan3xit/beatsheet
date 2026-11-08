# Proposal

## Why

Jeder Song ist ein Automerge-Dokument, das alle Änderungen aller Geräte enthält, die App zeigt davon aber nichts. Wer in einem gemeinsamen Workbook versehentlich etwas verstellt, kann weder nachsehen, was sich wann und durch wen geändert hat, noch einen früheren Stand zurückholen.

## What Changes

- Jede Änderung an einem Song trägt, sofern angemeldet, die Adresse ihres Autors und markiert Wiederherstellungen; die Adresse der Sitzung wird dafür lokal gemerkt, damit auch Offline-Änderungen einen Autor haben.
- Neue Ansicht „Verlauf“ je Song, erreichbar über einen Knopf auf der Doppelseite, nicht auf Smartphones: eine Liste von Bearbeitungen, neueste zuerst. Eine Bearbeitung fasst aufeinanderfolgende Änderungen derselben Person am selben Gegenstand (Song-Daten, Struktur, ein Pattern) am selben Tag zusammen und nennt ihren Nettounterschied. Eine leer angelegte und erst später gefüllte Pattern-Neuanlage erscheint als eine Bearbeitung. Personen erscheinen nur in gemeinsamen Workbooks.
- Zu einer gewählten Bearbeitung zeigt der Verlauf je nach Gegenstand: Eigenschaften und Sequencer vorher/nachher mit markierten neuen, geänderten und entfernten Schlägen sowie die Verwendung im Song; die Struktur vorher/nachher als Motiv, dessen Takte beim Überfahren sofort ihren Groove und Fill nennen; Song-Daten alt/neu. Ein Regler mit Schrittknöpfen führt durch den Stand vor der Bearbeitung und ihre Einzelschritte.
- Wiederherstellen eines gewählten Stands, für den Gegenstand oder den ganzen Song, nach Bestätigung in einem Dialog, der die Folgen nennt. Die Wiederherstellung ist eine neue Änderung auf dem aktuellen Stand; die Historie bleibt unverändert. Beim Wiederherstellen der Struktur kommen gelöschte Patterns, die sie nutzt, mit zurück.
- Die Adresse der App nennt auch den Verlauf eines Songs.

## Capabilities

### New Capabilities
- `song-history`: Autor jeder Änderung, Bildung und Anzeige der Bearbeitungen eines Songs, Vergleichsansicht, Wiederherstellen früherer Stände.

### Modified Capabilities
- `navigation`: Die Adresse und der Pfad umfassen den Verlauf eines Songs.

## Impact

- `src/persistence/songDoc.ts`, `repository.ts`: Änderungen mit Nachricht (Autor, Wiederherstellung) schreiben; Historie eines Dokuments lesen (Changes, Stände zu Heads).
- Neues reines Modul für Bearbeitungen, Nettounterschiede und Folgen einer Wiederherstellung (ohne React und Browser-APIs).
- `src/state`: Ansicht „Verlauf“, Wiederherstellen über `store.updateSong`; `src/account`: Adresse der Sitzung lokal merken.
- `src/ui`: Verlaufsansicht, Knopf auf der Doppelseite, Sequencer und Motiv in lesender Vergleichsform, Bestätigungsdialog mit Inhalt; Farben und Kontraste nach `design-system`.
- Server und Dateiformat bleiben unverändert; Nachrichten reisen im Automerge-Dokument mit. Das Dokument wächst um die Nachrichten der Änderungen.
