# Design

## Context

`layoutStructure` fasst die Fill-Abschnitte aller Takte zu Instanzen zusammen (`fillInstances`, globale Beats `[start, end)`) und schneidet sie pro Zeile zu `FillItem`s zu (`x`, `width`, `continuesLeft/Right`, `barlines`, `barIds`). Der sichtbare Teil kann am Anfang abgeschnitten sein (Fill länger als der Song davor) oder von einem später endenden Fill überdeckt werden; `FillSpan.fillOffset` gibt an, ab welchem Beat des Fills ein Abschnitt spielt. `FillBlock` (`StructurePage.tsx`) zeigt heute den Namen als Text und als `title`. Eine Strukturzeile ist 1,375rem hoch, 1 Beat = `--beat` (2,25rem).

## Goals / Non-Goals

**Goals:**
- Kurzschrift als reine, testbare Funktion ohne VexFlow und ohne React.
- Layout liefert pro `FillItem` fertig positionierte Zeichen; die UI zeichnet nur.

**Non-Goals:**
- Manuelle Kurzschrift, Einstellungen zur Zuordnung.
- Zeilenabstände generell ändern (erst im Browser prüfen, siehe Risiken).

## Decisions

### D1: `shorthand(pattern)` in `src/notation/shorthand.ts`

```ts
interface ShorthandMark { time: number; slot: number; level: 0 | 1 | 2; char: string }
```

`time` in Beats ab Pattern-Anfang (`beat + position / subdivision`), `slot = 1 / subdivision` (Breite des Rasterplatzes). Je Position werden die Instrumente in Prioritätsreihenfolge geprüft: `crash`→(0,`'`), `tom1`/`tom2`→(0,`t`), Snare mit Flam→(1,`v`), `snare`→(1,`s`), `floorTom`→(2,`f`), `kick`→(2,`k`). Ghost Notes (`articulations` = `ghost`) zählen nicht als Schlag. Pro Stufe gewinnt der erste Treffer. Hi-Hat, offene Hi-Hat, Ride und Pedal kommen in der Tabelle nicht vor. Ein Tom-Flam bleibt `t`.

Ergebnis sortiert nach `time`, dann `level`.

### D2: Zeichen im Layout

`FillInstance` erhält `offset`: den Pattern-Beat, der bei `start` spielt (aus `fillOffset` des ersten Abschnitts). `layoutRow` berechnet für jedes `FillItem` die Zeichen im sichtbaren Zeitraum `[from, to)`:

- globale Zeit eines Zeichens = `instance.start - instance.offset + mark.time`
- aufgenommen, wenn `from <= global < to`
- `x` relativ zum `FillItem` = `global - from + mark.slot / 2` (Mitte des Rasterplatzes)

`FillItem.marks: { x: number; level: 0 | 1 | 2; char: string }[]`. Die Zeichen werden einmal pro Pattern berechnet (Map nach Pattern-ID).

### D3: Darstellung

`FillBlock` zeigt statt des Namens ein `<span class="shorthand" aria-hidden="true">` mit einem absolut positionierten `<span class="mark level-N">` je Zeichen (`left: calc(var(--beat) * x)`, `transform: translateX(-50%)`). Der Name bleibt als `title` des Blocks (die Buchstaben sind `aria-hidden`). Ein `aria-label` am rollenlosen `div` wurde bei der Umsetzung weggelassen, da es ohne Rolle nicht zuverlässig vorgelesen wird. Schrift: Monospace, 10 px, fett, `line-height: 1`, Farbe `--text`. Stufen: oben `top: -6px`, Mitte `4px`, unten `14px` (Mock-up V2). Der Block erlaubt `overflow: visible`; die Zeichen liegen über Nachbarelementen (`z-index`), fangen aber keine Klicks ab (`pointer-events: none` wie alle Balken).

## Risks / Trade-offs

- [Buchstaben über und unter dem Block stoßen an Nachbarzeilen oder Akzente („Cr“)] → im Browser prüfen; bei Bedarf Zeilen mit Fill etwas mehr Abstand geben (Folgeanpassung, nicht Teil dieses Changes ohne Rücksprache).
- [Sechzehntel ergeben ca. 0,56rem Abstand pro Buchstabe] → Höhenstufen trennen benachbarte Instrumente; Feinschliff an echten Fills (Nutzer).
- [Fill-Name nicht mehr sichtbar] → gewollt; Tooltip und Patternseite zeigen ihn, Farbe identifiziert den Fill.

## Ergebnis der Browser-Prüfung

Am 2026-11-02 vom Nutzer im Release-Build (pub) geprüft und vorerst freigegeben („passt erstmal“). Feinschliff der Kurzschrift an echten Fills folgt nach weiterer Nutzung.
