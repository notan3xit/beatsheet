# Design

## Context

`layoutStructure` (`src/songbook/layout.ts`) erzeugt je Takt ein `GrooveItem` mit `label` (Groove-Name) für den sichtbaren Teil des Takts; bei vollständiger Überdeckung durch einen Fill entsteht kein Item. `StructurePage` zeigt `label` als Text und als `title`.

## Goals / Non-Goals

**Goals:**
- Entscheidung „Name zeigen“ in der reinen Layout-Logik, testbar ohne UI.

**Non-Goals:**
- Änderungen an Fill-Blöcken und Akzenten.

## Decisions

### D1: `showLabel` im Layout

`GrooveItem` erhält `showLabel: boolean`. `layoutStructure` läuft je Segment über die Takte in Songreihenfolge (über Blöcke und Zeilen hinweg) und merkt sich die `grooveId` des vorigen Takts; am Segmentanfang ist sie `undefined`. `showLabel = bar.grooveId !== vorige grooveId`. Maßgeblich ist die Zuordnung, nicht die Sichtbarkeit; ein vollständig überdeckter Takt aktualisiert die gemerkte `grooveId` also ebenfalls. `label` bleibt unverändert (Name), damit Tooltip und bestehende Tests gleich bleiben.

Alternative: in der UI pro Zeile entscheiden. Verworfen, weil Zeilen- und Blockgrenzen dann fälschlich als Wechsel zählen würden.

### D2: Darstellung

`StructurePage` rendert `.item-label` nur bei `showLabel`; `title={item.label}` und der Startbeat bleiben immer.

## Risks / Trade-offs

- [Wer eine Zeile mitten im Segment liest, sieht dort keinen Namen] → Farbe und Tooltip zeigen den Groove; so gewünscht (Name nur am Segmentanfang und bei Wechsel).
