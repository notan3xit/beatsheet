# Proposal

## Why

Kontraste sind bisher nirgends geregelt: Tests prüfen, welche Tokens im CSS stehen, nicht, ob das Ergebnis lesbar ist. Die helle Ansicht verfehlt 4,5:1 an vielen Stellen, Text auf hervorgehobenen Fills auch die dunkle. Dasselbe Problem kehrt mit jeder Farbänderung zurück. Ein Mock-up der korrigierten hellen Ansicht wirkte merkbar angenehmer.

## What Changes

- Die helle Ansicht übernimmt die Werte des Mock-ups: dunklerer gedämpfter Text, schwächere Tönung von Balken und Fills, tonale gewählte Chips und Kürzel, stärker mit Text gemischte Pattern-Namen, Fehlertext und Ränder.
- Die dunkle Ansicht senkt nur die Tönung von Fills und Hervorhebungen, soweit die Regel es verlangt.
- Neue Capability `design-system` sammelt alle Regeln zum Einsatz von Farben. Die Farbregeln aus `color-theme` wandern dorthin, `color-theme` regelt nur noch die Wahl von Latte und Mocha.
- `AGENTS.md` verweist auf die Regeln, damit sie bei jeder Änderung bekannt sind.
- Wenige Tests prüfen die Prinzipien am aufgelösten Ergebnis.

## Capabilities

### New Capabilities
- `design-system`: Palette, Rot, Akzentflächen, Rollen der Schriftfarben, Lese- und Zustandskontrast, Links

### Modified Capabilities
- `color-theme`: Regeln zum Einsatz von Farben wandern nach `design-system`
- `songbook-view`: gewählte Chips tonal im Hellmodus, Pattern-Namen gemischt

## Impact

- `src/ui/styles.css`: neue Tokens, Regeln nutzen sie
- `src/ui/styles.test.ts`: Anpassung betroffener Tests; neu `src/ui/designSystem.test.ts`
- `AGENTS.md`
- Keine Änderung an Datenmodell, Dateiformat oder Server
