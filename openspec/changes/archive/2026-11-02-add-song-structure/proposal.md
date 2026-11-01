# Proposal

## Why

Mit `add-pattern-editor` lassen sich Grooves und Fills schreiben, aber noch nicht zu einem Song anordnen. Das eigentliche Notenbuch fehlt also: links der Fahrplan des Songs in maßstabsgetreuen Takten, rechts jeder Drum-Part genau einmal. Die Exploration hat das Modell geklärt. Die Struktur kommt zuerst, Patterns können als leere Platzhalter beginnen, und die Darstellung zeigt Längen ehrlich, statt Inkonsistenzen zu verbieten.

## What Changes

- **Songs:** Die App verwaltet mehrere Songs (anlegen, umbenennen, löschen, öffnen). Patterns gehören zu genau einem Song. **BREAKING:** Die globale Pattern-Bibliothek entfällt.
- **Struktur:** Ein Song besteht aus Segmenten (Intro, Verse …). Ein Segment besteht aus Blöcken (logische Gruppierung). Ein Block besteht aus Takten. Jeder Takt hat eine eigene Länge (Viertel-Taktart), einen Groove oder keinen, optional einen Fill, der an seinem Ende endet, und optional Akzente.
- **Grooves über mehrere Takte** laufen über aufeinanderfolgende Takte mit demselben Groove fort. Sie beginnen neu bei einem Groove-Wechsel und am Blockanfang.
- **Fills** überlagern den Groove von rechts, mit ihrer Länge ab dem Taktende rückwärts, auch über Taktgrenzen hinweg.
- **Akzente** (Instrument + Position im Takt) kommen zum Groove hinzu.
- **Struktur zuerst:** Grooves und Fills lassen sich aus der Struktur heraus als leere Platzhalter anlegen.
- **Buch-Ansicht** (Desktop): links die Struktur, maßstabsgetreu mit 4 Takten pro Zeile, Groove-Farben, Mini-Noten für Fills und Akzent-Markierungen. Rechts die Patterns des Songs mit Noten. Ein Klick öffnet den bestehenden Pattern-Editor.
- **Farben:** Jedes Pattern bekommt eine Catppuccin-Akzentfarbe, gespeichert als Name, `red` ausgenommen.
- **Persistenz:** Ein Song ist das Speicher- und spätere Sync-Dokument. **BREAKING:** Das Dateiformat wird auf Schemaversion 2 angehoben. Dateien in v1 werden weiterhin importiert. Bestehende lokale Patterns wandern automatisch in einen Song „Importierte Patterns“.

Nicht enthalten: Tablet-Reader und Offline/PWA (eigener Change), kompakte Morph-Blöcke, Achtel-Taktarten (6/8, 7/8), Kopieren von Patterns zwischen Songs, Undo für Strukturänderungen, Audio.

## Capabilities

### New Capabilities
- `song-library`: Songs verwalten und öffnen (Song-Liste)
- `song-structure`: Aufbau und Bearbeitung der Song-Struktur (Segmente, Blöcke, Takte, Groove-Zuordnung, Fills, Akzente, Platzhalter) und ihre musikalische Bedeutung (Fortlauf mehrtaktiger Grooves, Überlagerung durch Fills)
- `songbook-view`: Darstellung eines Songs als Doppelseite (maßstabsgetreue Struktur links, Patterns rechts)

### Modified Capabilities
- `pattern-library`: Patterns gehören zu einem Song. Dazu kommen Farbvergabe, Nummerierung pro Song, Löschen mit Verwendungshinweis und eine Übersicht pro Song.
- `library-persistence`: Speichereinheit ist der Song, Dateiformat v2 mit Songs, Import von v1 und Migration der lokalen v1-Daten

## Impact

- Datenmodell (`src/domain`): neue Typen Song/Segment/Block/Bar/Accent, `Pattern` bekommt `color`
- `src/state`: Store hält Songs statt einer flachen Pattern-Liste. Der Pattern-Editor arbeitet im Kontext eines Songs.
- `src/persistence`: IndexedDB-Version 2 (Object Store `songs`, Migration aus `patterns`), Dateiformat v2 inklusive v1-Lesepfad
- `src/ui`: Song-Liste, Buch-Ansicht, Struktur-Editor. Die bisherige Bibliotheksübersicht wird zur rechten Buchseite.
- `src/notation`: Mini-Darstellung für Fills
- Bestehende Tests der globalen Bibliothek werden fachlich angepasst. Die Specs ändern sich, deshalb sind diese Anpassungen gemäß `AGENTS.md` zulässig.
