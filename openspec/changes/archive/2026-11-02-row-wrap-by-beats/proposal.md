# Proposal

## Why

Die Struktur bricht nach festen 4 Takten um. Bei kürzeren Takten bleibt dadurch Platz ungenutzt: Vier 3/4-Takte belegen 12 Beats, ein folgender 4/4-Takt würde mit 16 Beats genau in die Zeile passen und landet trotzdem allein in der nächsten Zeile. Die Zeilenbreite soll sich nach Beats richten, nicht nach der Anzahl der Takte.

## What Changes

- Eine Zeile fasst 16 Beats (die Breite von vier 4/4-Takten). Ein Takt kommt in die laufende Zeile, solange er dort vollständig Platz hat, sonst beginnt eine neue Zeile.
- In 4/4 ändert sich nichts (weiterhin 4 Takte pro Zeile). Kürzere Takte rücken zusammen (z. B. fünf Takte 3/4, 3/4, 3/4, 3/4, 4/4 in einer Zeile, acht 2/4-Takte in einer Zeile).
- Blöcke und Segmente beginnen weiterhin in einer neuen Zeile.

Nicht enthalten: Takte über das Zeilenende hinaus teilen, eine einstellbare Zeilenbreite.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `songbook-view`: „Maßstabsgetreue Struktur“ bricht nach 16 Beats statt nach 4 Takten um.

## Impact

- `src/songbook/layout.ts`: `BARS_PER_ROW` wird durch `BEATS_PER_ROW = 16` ersetzt, `layoutStructure` füllt Zeilen nach Beats.
- `src/ui`: keine Änderung nötig, die Zeilen werden schon nach `row.width` und Taktpositionen gezeichnet.
- Tests: neue Szenarien in `src/songbook/layout.test.ts`; „Zeilenumbruch“ (6 × 4/4 → 4 + 2) bleibt gültig. „Takt am Blockanfang“ in `src/ui/structureShortcuts.test.tsx` setzt eine zweite Zeile aus 3/4-Takten voraus und braucht dafür jetzt 6 statt 5 Takte.
