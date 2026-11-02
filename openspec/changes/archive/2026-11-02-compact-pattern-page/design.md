# Design

## Context

`renderNotation` (`src/notation/render/vexflow.ts`) kennt zwei Größen: `NORMAL` für Pattern-Editor und Patternseite (72 Einheiten pro Beat, 210 pro Notenzeile, das SVG wird 1:1 in Pixeln gezeichnet, Umbruch nach `maxWidth`) und `COMPACT` für die Fill-Blöcke der Struktur (ohne Schlüssel, eine Zeile, das SVG skaliert über die `viewBox` auf den Container). Das System mit seinen fünf Linien liegt in einer 210er-Zeile etwa bei y = 80…120, Hälse und Bassdrum reichen bis ca. 45…150. Der Rest ist Leerraum. `NotationView` misst die Containerbreite (`ResizeObserver`) und gibt sie als `maxWidth` weiter. Auf der Patternseite steckt die Notation zusätzlich im Rahmen von `.notation`.

Die Karten (`PatternPage.tsx`) haben eine Kopfzeile aus `h3`, zwei `.pattern-meta` und dem Knopf `.pattern-edit`. Die Kopfzeile ist Ziehquelle (`useDragSource`); ein Klick ohne Bewegung bleibt ein Klick.

## Goals / Non-Goals

**Goals:**
- Kartennotation mit festem Maßstab, unabhängig von der Patternlänge, und ohne leere Ränder oben und unten.
- Pattern-Editor und Fill-Mini-Darstellung bleiben pixelgleich.
- Bestehende zugängliche Namen bleiben, damit die Tests und die Bedienung per Screenreader gleich bleiben.

**Non-Goals:**
- Einen Maßstab, der sich an die Fensterbreite anpasst.
- Die Notation selbst ändern (Positionen, Notenwerte, Balken).

## Decisions

### D1: Dritte Darstellungsgröße `card` im Renderer

`RenderOptions` bekommt zusätzlich `card?: boolean`; `compact` bleibt unverändert, damit bestehende Aufrufe und Tests gleich bleiben (`card` und `compact` schließen sich aus, `compact` hat Vorrang). `card` verwendet die Maße von `NORMAL` mit Schlüssel und Umbruch, gibt dem SVG aber eine `viewBox` in VexFlow-Einheiten und setzt `width`/`height` auf Einheiten × `CARD_SCALE` (Startwert 0,55, im Browser zu prüfen). Damit ist ein Beat in jeder Karte gleich breit, egal wie breit die Karte ist. Der Umbruch rechnet mit `maxWidth / CARD_SCALE`, also in Einheiten. Ein einzelner Takt, der breiter als die Karte ist, wird mit `max-width: 100%` herunterskaliert (nur bei sehr dichten Takten in einer schmalen Spalte).

Alternative: wie `compact` auf die Containerbreite skalieren. Verworfen, weil dann ein 1-Beat-Fill riesig und ein 16-Beat-Groove winzig würde (Spec „Gleicher Maßstab“).

### D2: Höhe auf das tatsächliche Notenbild zuschneiden

Nach dem Zeichnen wird bei `card` die Höhe aus `svg.getBBox()` bestimmt und die `viewBox` vertikal auf `y … y + height` plus ein kleiner Rand (ca. 4 Einheiten) gesetzt. Die Breite bleibt die volle Systembreite, damit der horizontale Maßstab stabil ist. Bei mehreren Notenzeilen wird außerdem `rowHeight` für `card` auf ca. 130 verkleinert, damit zwischen den Zeilen kein großer Abstand bleibt. Ein Crash auf der Hilfslinie und ein Hi-Hat-Pedal darunter passen in diese Höhe.

Fallback: Ohne `getBBox` (jsdom) bleibt die volle Höhe stehen. Das betrifft nur die Tests, die die Höhe nicht prüfen.

Alternative: feste Zuschnittwerte (z. B. y = 30…160). Verworfen, weil ein Pattern ohne Crash und Pedal dann immer noch Leerraum hätte und eines mit offener Hi-Hat („o“) oben abgeschnitten werden könnte.

### D3: Raster mit Spannweite nach Länge

`.pattern-grid` ist ein CSS-Grid mit `grid-template-columns: repeat(2, minmax(0, 1fr))`. Karten mit `beats.length > 4` erhalten die Klasse `wide` (`grid-column: 1 / -1`). Bei `grid-auto-flow: row` bleibt die Reihenfolge der Spec „Patternseite“ erhalten; dadurch kann rechts neben einer kurzen Karte eine Lücke bleiben, wenn danach eine breite folgt. `dense` würde die Lücke füllen, aber die Leserichtung brechen. Verworfen.

Der Zeilenabstand des Rasters ist `1rem`, wie `.segment + .segment` in der Struktur; der Spaltenabstand bleibt `0,75rem`.

### D4: Kopfzeile mit Namensknopf

Die Kopfzeile wird `<header><h3><button aria-label="<Name> bearbeiten">Name</button></h3><span class="pattern-meta">4 Beats</span></header>`. Die Überschrift behält damit den Text des Namens (Tests prüfen `heading.textContent`), und der Knopf behält den zugänglichen Namen „<Name> bearbeiten“. Der Name erscheint in der Patternfarbe (`--pc`), ohne Knopffläche, mit Unterstreichung beim Überfahren. `font-size` der Kopfzeile ca. 0,85rem, Zeilenhöhe 1,2.

Die Kopfzeile bleibt Ziehquelle. Bisher starten Knöpfe innerhalb einer Ziehquelle kein Ziehen (`dragPattern.tsx`, gedacht für den alten Knopf „Bearbeiten“). Der Namensknopf trägt deshalb `data-drag-handle`; so markierte Knöpfe starten das Ziehen der Karte. Ein Klick ohne Bewegung öffnet den Editor, nach einem Ziehen verschluckt die vorhandene Klick-Unterdrückung den folgenden Klick.

### D6: Leere Patterns

`PatternPage` rendert jedes Pattern über `NotationView`, auch ohne Schläge; `isEmptyPattern` und der Hinweis „noch leer“ entfallen. Das Notationsmodell liefert für ein leeres Pattern bereits eine Viertelpause pro Beat (`drum-notation`, „Ein Pattern ohne Schläge“), es ist also keine Änderung am Renderer nötig. Die Länge ist die des Patterns, nicht fest 4 Beats: Ein frischer Groove hat 4 Beats, ein leerer Fill mit 1 Beat zeigt ein kurzes System.

### D5: Anlegen-Knöpfe und Abstände

„Neuer Groove“ und „Neuer Fill“ bekommen den sichtbaren Text „+ Groove“ bzw. „+ Fill“, `aria-label` bleibt „Neuer Groove“/„Neuer Fill“. Sie werden kleiner (Schrift 0,8rem, Polsterung 0,15rem 0,5rem). Abstände: Seitenaktionen `margin-bottom` 0,5rem, Raster `gap` 1rem 0,75rem (D3), Karte `padding` 0 0 0 0,5rem mit dem farbigen linken Rand, keine `margin-bottom` mehr. Alle Farben über Tokens.

## Risks / Trade-offs

- [Feste Skalierung passt nicht zu jeder Fensterbreite: Bei schmalen Fenstern ist ein 4/4-Takt mit Sechzehnteln breiter als eine Spalte.] → `max-width: 100%` skaliert dann diesen einen Takt herunter; `CARD_SCALE` wird im Browser so gewählt, dass ein üblicher 4/4-Groove bei ca. 1400 px Fensterbreite in eine Spalte passt.
- [`getBBox` liefert bei noch nicht eingehängtem Container 0.] → `NotationView` rendert erst im Effekt, wenn der Container im DOM ist; bei einer Höhe von 0 bleibt die volle Höhe stehen.
- [Ein Klick auf den Namen wird beim Ziehen versehentlich zum Öffnen.] → Die vorhandene Klick-Unterdrückung nach dem Ziehen gilt für die ganze Kopfzeile; ein Test deckt Ziehen vom Namen ab.

## Ergebnis der Browser-Prüfung

Am 2026-11-02 vom Nutzer im Release-Build (pub) geprüft: Maßstab, Zuschnitt, zweispaltiges Raster mit breiten Karten, Abstände und leere Patterns passen. `CARD_SCALE` bleibt beim Startwert 0,55.
