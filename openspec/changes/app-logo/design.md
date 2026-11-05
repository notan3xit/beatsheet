# Design

## Context

`AppHeader` zeigt `<h1>Beatsheet</h1>` zwischen `AppMenu` und `AccountMenu`; Tests finden die Überschrift über ihren Namen „Beatsheet“. Farben kommen nur über Tokens aus `src/ui/styles.css`, `styles.test.ts` prüft das am Stylesheet. Formen und Werte stammen aus der Skizzenseite der Explore-Phase (Beete A, E-Form, Comfortaa 700).

## Goals / Non-Goals

**Goals:**
- Logo als React-Komponente mit Inline-SVG, Farben ausschließlich über CSS-Tokens, damit Hell und Dunkel ohne eigenen Code folgen.
- Höhe der „e“-Striche aus der Schrift selbst ableiten statt aus festen Pixelwerten.

**Non-Goals:**
- Favicon, App-Symbol, Manifest.
- Comfortaa außerhalb des Logos.

## Decisions

### D1: Komponente `Logo` mit Text und Inline-SVG

`src/ui/Logo.tsx` rendert das `h1` mit `aria-label="Beatsheet"`: ein SVG der Beete, danach einen Span mit den Buchstaben als Text und je „e“ einem SVG. Alle SVGs tragen `aria-hidden="true"`. Die Buchstaben bleiben Text, damit Kerning und Grundlinie der Schrift gelten.

Alternative: Schriftzug als Pfade. Verworfen: kein Schriftladen nötig, aber jede Anpassung an Größe oder Strichstärke erfordert neue Pfade, und die Abstimmung mit der x-Höhe wäre von Hand.

### D2: „e“ in der Einheit `ex`

Das SVG eines „e“ ist `height: 1ex` hoch und `vertical-align: baseline`; `ex` ist die x-Höhe der aktuellen Schrift. Der viewBox ist 100 hoch, Strichstärke `s` (Startwert 19, Anteil der x-Höhe wie in der Skizze), Striche bei `y = s/2`, `50`, `100 − s/2`, `stroke-linecap: round`, Endpunkte um `s/2` eingerückt, damit die runden Enden in der Breite bleiben. Breite 1 ex, Mittelstrich 65 % der Breite. Feinwerte werden am Bildschirm abgestimmt und als Konstanten in `Logo.tsx` festgehalten.

Alternative: feste Pixelhöhe. Verworfen: hängt von Schriftgröße und Schrift ab und bricht, sobald die Schrift nicht geladen ist.

### D3: Farben als Logo-Tokens

In `styles.css`:
- `--logo-beet: color-mix(in srgb, var(--ctp-mauve) 55%, var(--ctp-maroon))`
- `--logo-beet-light: var(--ctp-pink)` (Glanzlicht, im SVG mit Deckkraft 0,6; eine Mischung mit `--bg` würde in Mocha abdunkeln)
- `--logo-leaf: var(--ctp-green)`
- Strichfarben je „e“ (oben, Mitte, unten): blue/green/peach, mauve/teal/yellow, peach/blue/green als `--logo-e1-1` … `--logo-e3-3`

SVG-Elemente nutzen Klassen, deren `fill`/`stroke` auf diese Tokens zeigen; im TSX stehen keine Farben. `styles.test.ts` erhält einen Test, der die Logo-Tokens auf erlaubte Formen prüft: Palettenvariable, Mischung mit `--bg` oder Mischung zweier Palettenvariablen außer red, sowie dass `--ctp-red` weiterhin nur in `--danger` vorkommt.

### D4: Schrift über `@fontsource/comfortaa`

`main.tsx` importiert `@fontsource/comfortaa/700.css`. Vite bündelt die woff2-Dateien nach `dist/assets`, der Server liefert sie aus (`server/static.ts` kennt `font/woff2`). Nur der Schriftzug setzt `font-family: 'Comfortaa'`, gefolgt von der Schriftliste des `body`; `font-display: swap` aus Fontsource zeigt bis zum Laden die Systemschrift, die Striche passen sich über `ex` mit an.

Alternative: Google Fonts per `<link>`. Verworfen: fremder Server beim Laden, und die App arbeitet sonst ohne externe Quellen.

### D5: Tests

jsdom berechnet weder Schriften noch Layout. Die Tests prüfen daher Struktur und Stylesheet:
- Reihenfolge Menü-Knopf, Beete, Schriftzug, Konto-Symbol; Name der Überschrift; `aria-hidden` an allen SVGs.
- Buchstaben `b a t s h t` als Text, drei „e“-SVGs mit je drei Linien, Mittelstrich kürzer, `y` ± halbe Strichstärke deckt 0…100 ab.
- Stylesheet: `height: 1ex` und `vertical-align: baseline` für die „e“, `font-family` mit Comfortaa nur in der Regel des Schriftzugs, Farben der Linien je „e“ verschieden und ungleich red.
- Schriftquelle: `main.tsx` importiert das Fontsource-Stylesheet, dessen `src`-URLs relativ sind.

## Risks / Trade-offs

- [Comfortaa wirkt in 1,15 rem leicht] → Schriftgröße des Logos unabhängig von der bisherigen `h1`-Größe abstimmen; Strichstärke am Bildschirm prüfen.
- [Drei Striche neben dem Hamburger-Menü] → Mittelstrich kürzer und Striche farbig; der Menü-Knopf bleibt einfarbig und mit gleich langen Strichen.
- [Bis die Schrift geladen ist, erscheint die Systemschrift] → `ex` hält die Striche auch dann auf x-Höhe; Wechsel nur beim ersten Laden ohne Cache.
- [Zusätzliche Bundle-Größe] → ein Schnitt; Fontsource liefert Subsets mit `unicode-range`, der Browser lädt nur das lateinische.
