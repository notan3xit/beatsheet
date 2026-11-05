# Proposal

## Why

Die Song-Übersicht besteht aus einer schmalen Spalte von Karten mit Tabellen, Zahlenspalten und drei Formularen zum Anlegen. Sie wirkt unruhig, nutzt breite Bildschirme nicht und lässt Songs nur über ein Menü in ein Workbook verschieben.

## What Changes

- Songs erscheinen als Kacheln statt als Tabellenzeilen: oben ein stilisiertes Motiv der Song-Struktur, darunter Titel, Taktzahl und Tempo.
- Das Motiv wird aus der Struktur abgeleitet: je Zeile der Strukturseite eine Reihe abgerundeter Striche in den Pattern-Farben, ohne Taktstriche und mit gleichmäßigen Abständen.
- „Meine Songs“ steht oben, ohne die bisherige Überschrift „Songs“ darüber; die Kacheln stehen nebeneinander und brechen um.
- Darunter folgt angemeldet der Bereich „Workbooks“: links eine Seitenleiste mit je einem Eintrag pro Workbook (Titel, Anzahl Songs und Mitglieder), rechts die Kacheln des gewählten Workbooks. Die Auswahl bleibt beim Öffnen eines Songs und der Rückkehr erhalten.
- Angelegt wird über eine Kachel „+ Song“ bzw. einen Eintrag „+ Workbook“ statt über Eingabefelder; ein neuer Song öffnet sich direkt.
- **BREAKING (Oberfläche):** Die Zahlenspalten Grooves und Fills entfallen.
- Eine Kachel aus „Meine Songs“ lässt sich auf einen Workbook-Eintrag oder in den Bereich des gewählten Workbooks ziehen; das verschiebt den Song. „Zu Workbook …“ bleibt an jeder Kachel erhalten.

Aus einem Workbook heraus lässt sich nicht ziehen; Server, Datenmodell und Dateiformat bleiben unverändert.

## Capabilities

### New Capabilities
- `song-motif`: Ableitung und Darstellung des Struktur-Motivs eines Songs

### Modified Capabilities
- `song-library`: Song-Liste als Kacheln, Anlegen über „+ Song“
- `workbooks`: Bereich „Workbooks“ mit Seitenleiste statt Karten, Anlegen über „+ Workbook“, Auswahl
- `workbook-sync`: Verschieben auch per Ziehen, Anlegen über „+ Song“ im Workbook
- `app-messages`: Szenarien nennen das Workbook statt seiner Karte
- `navigation`: Die Song-Liste verliert die Überschrift „Songs“

## Impact

- `src/ui/SongList.tsx`, `src/ui/SongTable.tsx` (entfällt), `src/ui/WorkbookCard.tsx`, `src/ui/styles.css`, neue Komponenten für Kachel, Motiv und Seitenleiste
- `src/songbook/`: reine Ableitung des Motivs aus `layoutStructure`
- `src/sync/sync.ts`: `createSongIn` und `createWorkbook` liefern die ID des Neuen
- Tests in `songList`, `workbooks`, `account` und `songLock`, die Tabelle, Karten oder Eingabefelder erwarten
