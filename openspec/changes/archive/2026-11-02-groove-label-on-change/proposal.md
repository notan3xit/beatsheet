# Proposal

## Why

In der Song-Struktur trägt jeder Takt den Namen seines Grooves. Bei Blöcken mit vielen gleichen Takten wiederholt sich derselbe Name Takt für Takt; das macht die Struktur unruhig und lässt die eigentlich interessanten Stellen, an denen der Groove wechselt, untergehen. Die Farbe zeigt bereits, welcher Groove läuft.

## What Changes

- Ein Takt zeigt den Groove-Namen nur, wenn er der erste Takt seines Segments ist oder sein Groove sich gegenüber dem vorigen Takt des Segments ändert. Folgetakte mit demselben Groove zeigen keinen Namen, behalten aber Farbe, Tooltip mit dem Namen und gegebenenfalls den Startbeat („ab 5“).
- Ob der Groove „wechselt“, entscheidet die Zuordnung des vorigen Takts, nicht dessen Sichtbarkeit: Ein Takt hinter einem vollständig von einem Fill überdeckten Takt mit demselben Groove zeigt keinen Namen. Ein Takt ohne Groove dazwischen gilt als Wechsel.

Nicht enthalten: Änderungen an Fill-Blöcken, Akzenten oder der Patternseite.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `songbook-view`: „Groove-Kennzeichnung im Takt“ zeigt den Namen nur am Segmentanfang und bei einem Groove-Wechsel.

## Impact

- `src/songbook/layout.ts`: `GrooveItem` erhält `showLabel`, berechnet pro Segment in Songreihenfolge
- `src/ui/StructurePage.tsx`: Name nur bei `showLabel`, Tooltip unverändert
- Tests: neue Layout-Tests; „Takte, Groove-Namen, Fill-Block und Akzent erscheinen“ in `src/ui/songbook.test.tsx` erwartet heute den Namen in allen vier Takten und wird an die geänderte Anforderung angepasst (Name einmal).
