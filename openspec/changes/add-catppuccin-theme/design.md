# Design

## Context

Siehe `proposal.md` (Why). Ist-Zustand: `src/ui/styles.css` definiert elf eigene Farb-Tokens (`--bg`, `--surface`, `--accent` …) mit festen Hex-Werten. Zusätzlich stehen einzelne Farben direkt in Regeln (`.message.status`, `.message.alert`, `.storage-note`, `.backdrop`, `.dialog`, `button.primary`). VexFlow zeichnet SVG mit den Standardattributen `fill="black"` / `stroke="black"` (`SVGContext`).

## Goals / Non-Goals

**Goals:**
- Eine einzige Quelle für Farbwerte (`@catppuccin/palette`), keine abgetippten Hex-Codes im Projekt
- Semantische Tokens in der UI, damit spätere Varianten oder ein Umschalter nur die Zuordnung ändern
- Kein Aufblitzen der falschen Variante beim Start

**Non-Goals:**
- Manueller Umschalter, Frappé/Macchiato
- Farbvergabe an Patterns (`add-song-structure`). Dieser Change stellt aber alle 14 Akzente als CSS-Variablen bereit.

## Decisions

### D1: Palette zur Laufzeit als CSS-Variablen erzeugen
`src/ui/theme.ts` erzeugt aus `flavors.latte` und `flavors.mocha` des Pakets einen CSS-Text:

```css
:root { color-scheme: light; --ctp-base: <latte.base>; --ctp-text: <latte.text>; ... alle 26 Farben }
@media (prefers-color-scheme: dark) {
  :root { color-scheme: dark; --ctp-base: <mocha.base>; ... }
}
```

`main.tsx` fügt diesen Text als `<style>` ein, *bevor* React rendert. Der Wechsel zur Laufzeit erledigt der Browser über die Media Query, dafür braucht es kein JavaScript. `color-scheme` sorgt dafür, dass native Elemente (Select, Scrollbalken, Dateidialog-Button) passend erscheinen.

- Alternative: die mitgelieferte `@catppuccin/palette/css/catppuccin.css` importieren und in `styles.css` per Hand `--ctp-base: var(--ctp-latte-base)` usw. für beide Varianten zuordnen. Verworfen, weil das 2 × 26 handgeschriebene Zuordnungen wären und sich nicht als Unit-Test prüfen ließe.
- Ohne Angabe der Systemeinstellung greift Latte (Basisregel ohne Media Query).

### D2: Semantische Tokens in `styles.css`

| Token | Palette | Verwendung |
|---|---|---|
| `--bg` | `base` | Seitenhintergrund |
| `--surface` | `mantle` | Karten (Sequencer, Notenbild), Kopfzeile, Dialog |
| `--beat-alt` | `crust` | jeder zweite Beat im Sequencer |
| `--step` / `--step-hover` | `surface0` / `surface1` | leere Sequencer-Zelle |
| `--border` | `surface1` | Rahmen |
| `--text` / `--muted` | `text` / `subtext0` | Text, Nebentext |
| `--accent` | `peach` | gesetzte Zelle, primärer Button |
| `--accent-soft` | `peach` 25 % | ausgewähltes Pattern |
| `--danger` | `red` | Löschen, Fehlermeldung |
| `--success` | `green` | Importmeldung (Text, Fläche 20 %) |
| `--warning` | `yellow` | Speicherhinweis (Text, Fläche 25 %) |
| `--backdrop` | `crust` 60 % | Dialog-Hintergrund |

Abstufungen entstehen mit `color-mix(in srgb, var(--ctp-x) N%, transparent)`, dazu sind nach Spec transparente Abstufungen zulässig. Text auf `--accent`-Flächen (primärer Button) bekommt `--bg`, damit der Kontrast in beiden Varianten stimmt.

Mit `--accent: peach` bleibt die bisherige orange Anmutung erhalten, und es gibt genügend Abstand zu `red`, in Latte wie in Mocha.

### D3: VexFlow zeichnet mit `currentColor`
Nach `renderer.getContext()` werden `setFillStyle('currentColor')` und `setStrokeStyle('currentColor')` gesetzt. Der Container `.notation` erhält `color: var(--text)`. Damit erbt jedes SVG-Element die Textfarbe. Ob einzelne VexFlow-Elemente (Tuplet-Ziffern, Annotation, Punkte) eigene Farben setzen, prüft der Smoke-Test: Im erzeugten SVG darf kein `fill`/`stroke` außer `currentColor` oder `none` vorkommen.

### D4: Teststrategie
- **Unit (`theme.test.ts`):** Der erzeugte CSS-Text enthält Latte-Werte in der Basisregel und Mocha-Werte im Dark-Media-Block, und zwar alle 26 Farben, gelesen aus dem Paket (keine abgetippten Erwartungswerte).
- **Unit (`styles.test.ts`):** `styles.css` enthält keine Farbliterale (Hex, `rgb()`, `hsl()`, benannte Farben wie `white`/`black`), nur Tokens. `var(--ctp-red)` kommt ausschließlich in `--danger` vor. `--accent` ist nicht `red`.
- **Smoke-Test Renderer:** keine festen Farben im SVG (D3).
- **Browser-Check (headless Chromium über CDP):** `Emulation.setEmulatedMedia` mit `prefers-color-scheme: light/dark`. Geprüft werden die berechneten Farben von `body` (Hintergrund, Text) und des Notenbilds, der Wechsel ohne Neuladen und dass alle berechneten Farben im DOM aus der aktiven Palette stammen. Dazu kommen Screenshots beider Varianten zur Sichtprüfung. Diese Prüfung deckt die Szenarien ab, die jsdom nicht abbilden kann (Media Queries, berechnete Styles).

## Risks / Trade-offs

- [`color-mix()` erst ab Safari 16.2 / Firefox 113 / Chrome 111] → Für eine neue App vertretbar. Ältere Browser zeigen dann keine Abstufungen, die Grundfarben funktionieren trotzdem.
- [Kurzes Aufblitzen in Latte, falls das Style-Element zu spät eingefügt wird] → Das Einfügen passiert synchron am Anfang von `main.tsx`, vor dem ersten Rendern
- [Mocha-Akzente (Pastell) auf dunklem Grund mit Text darauf] → Text auf Akzentflächen nutzt `--bg` (dunkel), das hat in Mocha guten Kontrast. Die Sichtprüfung erfolgt per Screenshot.
- [Neue VexFlow-Versionen könnten Elemente mit eigener Farbe zeichnen] → Smoke-Test schlägt dann an

## Open Questions

- Für den Browser-Check ist laut Absprache Chrome vorgesehen, Chrome ist auf dem Entwicklungsrechner aber nicht installiert. Möglich sind der Ersatz durch Edge (gleiche Chromium-Engine, gleiches CDP) oder eine Chrome-Installation. Das Prüfverfahren ist dasselbe, die Frage ändert also weder Specs noch Tasks.
