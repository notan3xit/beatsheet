# Design

## Context

- `patternPageOrder(song)` in `src/songbook/layout.ts` sortiert Grooves vor Fills, je nach erstem Auftreten, unbenutzte alphabetisch. Nur `PatternPage` nutzt sie; `PatternChips` zeigt `song.patterns` in Anlegereihenfolge.
- `.pattern-grid` ist ein Grid mit einer Spalte, ab `@container (min-width: 28.5rem)` zwei. `PatternCard` setzt `wide`, wenn `naturalCardWidth` (in `vexflow.ts`) nicht in eine Spalte passt.
- Die Patternseite ist nebeneinander höchstens `calc(2 * 15rem + 0.75rem + 2rem + 2px)` breit (`styles.css`, Container-Query auf `.songbook`).
- `NotationView` misst die Breite seines eigenen Containers (`useWidth`) und übergibt sie als `maxWidth` an `renderNotation`. Das Karten-SVG trägt seine natürliche Breite als Inline-Breite und schrumpft per `max-width: 100%`.
- Groove-Karte und Fill-Karte haben dieselbe Klasse und Optik: Kante links (`border-left: 3px solid var(--pc)`), Einzug 0,5rem. In der Struktur: `.item.groove` mit Kante links und 22 % Tönung, `.item.fill` ringsum gerahmt mit 40 % Tönung.

## Goals / Non-Goals

**Goals:**
- Eine Sortierfunktion für Patternseite und Chips.
- Kartenbreite aus den Noten, ohne Messen in JavaScript für die Anordnung.

**Non-Goals:**
- Anordnung als Einstellung.
- Gruppierung nach Segmenten.

## Decisions

### D1: Gemeinsame Reihenfolge

`songPatternOrder(song)` ersetzt `patternPageOrder` in `layout.ts`. Sie läuft die Takte in Songreihenfolge ab und vergibt je Takt erst dem Groove, dann dem Fill einen Rang beim ersten Auftreten. Unbenutzte Patterns folgen, Grooves vor Fills, jeweils alphabetisch (`localeCompare` mit `de`, `sensitivity: 'base'` wie bisher). `PatternPage` zeigt die Liste, `PatternChips` filtert sie nach `kind`.

### D2: Fluss statt Raster

- `.pattern-grid`: `display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1rem 0.75rem`. Der Zeilenabstand bleibt der Segmentabstand.
- `.pattern-card`: `flex: 0 1 auto; min-width: min(7.5rem, 100%); max-width: 100%`. Die Breite ergibt sich aus dem Inhalt, also aus der Inline-Breite des SVG; eine zu breite Karte schrumpft auf die Zeile.
- `.pattern-card-header`: `contain: inline-size`. So trägt die Kopfzeile nichts zur natürlichen Breite bei, ein langer Name macht die Karte nicht breiter und wird nach `.pattern-name` mit „…“ gekürzt.
- Entfallen: `@container (min-width: 28.5rem)`, `.pattern-card.wide`, `container-type` an `.pattern-page`, die Klasse `wide`, `naturalCardWidth` mit ihren Tests. `lineWidth` in `vexflow.ts` bleibt als Teil von `renderNotation`.

Alternative: Grid mit `auto-fill` und `dense`. Verworfen, weil `dense` die Reihenfolge bricht und feste Spalten wieder Löcher lassen.

### D3: Umbruchbreite der Noten aus der Patternseite

Misst `NotationView` die eigene Kartenbreite, entsteht ein Kreis: Die Karte ist so breit wie die Noten, die Noten brechen nach der Karte um. Einmal umgebrochen, würden sie nach dem Verbreitern der Seite nie wieder zusammenwachsen.

`NotationView` bekommt die optionale Eigenschaft `maxWidth`; ist sie gesetzt, misst es nicht selbst. `PatternPage` misst `.pattern-grid` mit dem exportierten `useWidth` und gibt jeder Karte die Gitterbreite abzüglich Kante und Einzug ihrer Art (Groove 3px + 0,5rem, Fill 2 × (1px + 0,5rem)).

### D4: Optik von Groove- und Fill-Karte

`PatternCard` setzt `pattern-card groove` bzw. `pattern-card fill`.

- `.pattern-card.groove`: `border-left: 3px solid var(--pc); padding-left: 0.5rem` wie bisher.
- `.pattern-card.fill`: `border: 1px solid var(--pc); border-radius: 3px; padding: 0.25rem 0.5rem; background: color-mix(in srgb, var(--pc) 15%, transparent)`.

Die Tönung ist schwächer als bei `.item.fill` (40 %), weil auf der Karte Noten in Textfarbe liegen und lesbar bleiben müssen; Rahmen ringsum und Tönung gegenüber der bloßen Kante bleiben als Unterschied deutlich.

### D5: Tests

- `layout.test.ts`: „Reihenfolge“ nach dem Szenario (B, f1, A, C, f2), dazu unbenutzte Grooves vor Fills.
- `structureEditor.test.tsx`: „Chips in Reihenfolge des Songs“.
- `patternPage.test.tsx`: Reihenfolge der Karten, „Fill und Groove unterscheiden“ (Klassen `fill` und `groove`); die Tests zu `wide` entfallen mit der Anforderung.
- `styles.test.ts`: Fluss-Regeln aus D2 („Kurze Patterns nebeneinander“, „Umbruch in Reihenfolge“, „Kurzer Fill“), Fill- und Groove-Optik aus D4; die Tests zu zwei Spalten entfallen.
- `vexflow.test.ts`: Tests zu `naturalCardWidth` entfallen.
- Headless-Chromium bei 1650, 1024, 768 und 390 px: Karten in Song-Reihenfolge ohne Löcher (jede Karte beginnt dort, wo die vorige endet, oder am Zeilenanfang), Kartenbreite gleich Notenbreite plus Kante, 4-Beat-Karten ungeschrumpft (außer 390 px), kurzer Fill mindestens 7,5rem, Noten wachsen nach Verkleinern und Vergrößern des Fensters wieder zusammen, Screenshots hell und dunkel.

## Risks / Trade-offs

- [Rechter Rand der Patternseite unruhig] → Gewollt: Reihenfolge und natürliche Breite gehen vor bündigen Spalten.
- [`contain: inline-size` am Kopf] → In allen aktuellen Browsern unterstützt; ohne Unterstützung würde ein langer Name die Karte nur verbreitern.
- [Dichte 4-Beat-Pattern breiter als die Seite] → Schrumpfen wie bisher auf die Zeile.
- [Bestehende Tests zu „Zweispaltige Patternseite“] → Entfallen mit der Anforderung (REMOVED); ihr Ersatz kommt aus „Karten im Fluss“.

## Migration Plan

Keine Datenmigration; nur Darstellung.
