# Proposal

## Why

Im Kopf des Pattern-Editors stehen hinter Länge und Taktart Lücken, weil beide Werte auch gesperrt den Platz einer Auswahlliste mit Rahmen und Pfeil belegen. Wird ein Kopf zu voll, rutscht im Pattern-Editor das Schloss allein in eine neue Zeile, und der Kopf der Doppelseite bricht gar nicht um, sondern staucht Tempoangabe und Knöpfe bis zur Unlesbarkeit und schneidet das Schloss ab.

## What Changes

- Länge und eigene Taktart im Pattern-Editor erscheinen entsperrt als Auswahl ohne Rahmen und Pfeil wie die Tempoangabe und belegen gesperrt wie entsperrt nur die Breite ihres Texts.
- Der Standard-Takt der Doppelseite nutzt dieselbe Umsetzung; sein Verhalten bleibt.
- Die Auswahl öffnet auf jedem Gerät die Auswahlliste des Geräts, ohne dass der Browser beim Antippen vergrößert.
- Die Köpfe von Doppelseite und Pattern-Editor brechen um, wenn der Platz nicht reicht: Die Aktionen am rechten Rand samt Schloss bleiben eine rechtsbündige Gruppe, einzelne Werte und Knöpfe brechen nie in sich um.

## Capabilities

### New Capabilities

### Modified Capabilities
- `navigation`: Umbruch der Kopfzeilen von Doppelseite und Pattern-Editor.
- `song-meter`: Eigene Taktart im Pattern-Editor als Auswahl ohne Rahmen und Pfeil, in Textbreite.
- `pattern-library`: Länge im Pattern-Editor als Auswahl ohne Rahmen und Pfeil, in Textbreite.

## Impact

- `src/ui/PatternEditor.tsx`, `meter.tsx`, `Songbook.tsx`: gemeinsame Komponente für einen Wert mit unsichtbarer Auswahl darüber; rechte Gruppe der Kopfzeilen.
- `src/ui/styles.css`: feste Breiten von Länge und Taktart entfallen; Umbruch der Kopfzeilen.
- Datenmodell, Dateiformat und Server bleiben unverändert.
