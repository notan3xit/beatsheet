# Proposal

## Why

Wer im Takt-Popover sieht, welcher Groove und Fill zu einem Takt gehören, muss das Pattern rechts erst suchen, um es zu lesen oder zu öffnen. Das kostet vor allem in Songs mit vielen Karten Zeit.

## What Changes

- Das Takt-Popover zeigt die Links „zum Groove“ und „zum Fill“, sofern gesetzt. Sie öffnen den Pattern-Editor.
- Die Patternseite hebt die Karten der Grooves und Fills ausgewählter Takte hervor.
- Beides gilt auch im gesperrten Song, der nach dem Öffnen der Normalfall ist. Die Links sind dort lesend freigegeben, der Editor öffnet gesperrt.

## Capabilities

### New Capabilities

### Modified Capabilities
- `songbook-view`: neue Anforderungen zu Links und Karten-Hervorhebung, Aufbau des Takt-Popovers
- `song-lock`: Freigabe der Links, Inhalt des Popovers im gesperrten Song

## Impact

- `src/ui/Songbook.tsx`, `StructurePage.tsx`, `StructurePopovers.tsx`, `PatternPage.tsx`, `styles.css`
- `src/songbook/layout.ts`: Ermitteln der Patterns ausgewählter Takte
- Keine Änderung an Datenmodell, Dateiformat oder Wiedergabe
