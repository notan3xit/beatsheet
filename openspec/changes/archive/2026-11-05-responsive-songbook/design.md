# Design

## Context

- `.pages` ist ein Grid `minmax(0, 3fr) minmax(0, 2fr)`. Beide Seiten (`.page`) haben `padding: 1rem`, 1px Rahmen und `min-width: 0`.
- Die Struktur misst in `--beat` (2,25rem, auf `.structure-page`). Eine Zeile ist `--beat × Beats` breit, davor steht `--row-gutter` (1,625rem). Bei 16 Beats ist die Seite damit etwa 636 px breit. `.structure-page` hat bewusst kein `overflow`, damit die Popover nicht abgeschnitten werden.
- Das Popover (`Popover` in `StructurePopovers.tsx`) sitzt absolut in der Zeile bzw. im Segmentkopf, bei `left: --beat × x`. Es ist `max-content` breit, höchstens 24rem. `barAnchor` begrenzt x mit `POPOVER_BEATS = 11` am rechten Zeilenrand. Das stimmt nur bei vollem Maßstab.
- `.pattern-grid` hat immer zwei Spalten, `.pattern-card.wide` belegt beide. Die Noten in Kartengröße bringen ihre Breite aus dem Renderer mit, eine Karte mit 4 Beats ist ungeschrumpft etwa 220 px breit (208 px Noten plus Farbkante und Einzug). `.notation-card svg` schrumpft per `max-width: 100%`.
- Die Kopfzeile `.pattern-card-header` ist ein Flex-Container. `.pattern-name` hat `overflow-wrap: anywhere`, `.pattern-meta` hat `nowrap`.
- jsdom berechnet kein Layout. Layoutregeln prüfen die Tests heute am Text von `styles.css` (`styles.test.ts`), echtes Verhalten prüft das Headless-Chromium unter `~/tools/playwright`.

## Goals / Non-Goals

**Goals:**
- Umbruch, Höchstbreiten und Spaltenzahl ergeben sich aus den Inhaltsmaßen, ohne Media Queries auf die Fensterbreite.
- Ein einziger Ort bestimmt den Maßstab (`--beat`); Zeilen, Balken, Knöpfe und Popover folgen ihm.

**Non-Goals:**
- Weniger Beats pro Zeile auf schmalen Geräten.
- Größere Trefferflächen für Touch, Bereichsauswahl auf Touch.
- Kleinere Ränder auf dem Smartphone.

## Decisions

### D1: Doppelseite mit Container-Query auf `.songbook`

`.songbook` wird `container-type: inline-size`. `.pages` ist ohne Bedingung eine Spalte (`display: flex; flex-direction: column; gap: 1rem`), beide Seiten haben die volle Breite.

`@container (min-width: 56.75rem)` stellt die Seiten nebeneinander (`flex-direction: row; align-items: flex-start`):

- `.structure-page`: `flex: 3 1 var(--structure-width); max-width: var(--structure-max)`
  - `--structure-width: calc(16 * 2.25rem + var(--row-gutter) + 2rem + 2px)`: 16 Beats, Rand, Padding, Rahmen; etwa 636 px.
  - `--structure-max`: dasselbe mit 3rem; etwa 828 px.
- `.pattern-page`: `flex: 2 1 16rem; max-width: calc(2 * 15rem + 0.75rem + 2rem + 2px)`. 16rem ist eine Spalte mit einer 4-Beat-Karte samt Padding. Die Höchstbreite sind zwei Spalten zu 15rem; das reicht für eine 4-Beat-Karte mit etwas Luft. Breitere Karten (etwa 4 Beats in 32teln, ungeschrumpft rund 760 px) belegen beide Spalten und schrumpfen darin (Risiken).

Die Schwelle ist die Summe der Basisbreiten: 39,75rem (Struktur) + 1rem + 16rem. Darüber verteilt Flexbox den übrigen Platz 3:2, eine Seite an ihrer Höchstbreite gibt den Rest an die andere ab, und was beide nicht nehmen, bleibt rechts frei.

Rechnung mit 40 px Rand von `.songbook`: Nebeneinander ab etwa 950 px Fensterbreite, also auch bei Tablets quer mit 1024 px. Bei 1650 px sind die Struktur 828 px und die Patternseite etwa 526 px breit. Bei 768 px stehen die Seiten untereinander.

Ein Container ist auch Bezugsrahmen für `position: fixed`. Das Ziehbild (`.drag-image`, in `DragProvider` innerhalb von `.songbook`) wird deshalb per Portal in `document.body` gerendert, damit es am Zeiger bleibt.

Alternative: `flex-wrap` ohne Query (bisherige Fassung). Verworfen, weil mit Höchstbreiten die Seiten nach dem Umbruch unterschiedlich breit wären. Alternative: Media Query auf die Fensterbreite. Verworfen, weil sie den Rand von `.songbook` mitrechnen müsste.

### D2: Maßstab aus der Breite der Strukturseite

`.structure-page` wird `container-type: inline-size`, und `--beat` wird `min(3rem, (100cqw - var(--row-gutter)) / 16)`. Die Einheit `cqw` bezieht sich auf die Inhaltsbreite der Strukturseite. Das geht, weil die Breite der Seite nach D1 aus `flex-basis`, Wachstum und Höchstbreite bzw. der vollen Breite kommt, nicht aus dem Inhalt. `--beat` ist eine nicht registrierte Custom Property und wird erst beim Verwenden in den Nachfahren aufgelöst, also gegen den Container `.structure-page`.

Nebeneinander ist die Seite mindestens `--structure-width` breit, `--beat` also mindestens 2,25rem, und höchstens `--structure-max`, also höchstens 3rem. Untereinander füllt eine 16-Beat-Zeile die Seite: bei 768 px etwa 42 px pro Beat, bei 390 px etwa 18 px. Alle Maße der Struktur, die in `--beat` angegeben sind (Zeilen, Balken, Rahmen, Einfüge-Knöpfe, Popover-Lage), folgen ohne weitere Änderung. Feste Maße bleiben: Zeilenhöhe, `--item-gap` und die Schriftgrößen. Namen und „ab n“ werden gekürzt bzw. abgeschnitten, wie heute bei kurzen Takten.

Alternative: `--beat` per ResizeObserver in JavaScript setzen. Verworfen, weil CSS dasselbe ohne Rendern nach jeder Größenänderung leistet.

### D3: Patternseite mit Container-Query

`.pattern-page` wird `container-type: inline-size`. `.pattern-grid` hat ohne Bedingung eine Spalte, `.pattern-card.wide` hat dann keine Wirkung. `@container (min-width: 28.5rem)` setzt zwei Spalten und `grid-column: 1 / -1` für `.wide`. 28,5rem sind zwei 4-Beat-Karten zu etwa 220 px plus 0,75rem Spaltenabstand. Wann eine Karte `wide` ist, regelt D7.

### D4: Popover rückt in die Seite

`Popover` misst sich nach dem Rendern (`useLayoutEffect`, erneut bei Größenänderung der Strukturseite). Ragt sein rechter Rand über den Inhaltsrand der nächsten `.structure-page` hinaus, verschiebt es sich um diesen Überstand nach links, höchstens bis an den linken Inhaltsrand. Die Verschiebung kommt als `translate` auf den gesetzten `left`-Wert. `max-width` wird `min(24rem, 100cqw)`, damit das Popover auch auf dem Smartphone in die Seite passt.

`POPOVER_BEATS` und die Begrenzung in `barAnchor` entfallen. Der Anker ist der erste ausgewählte Takt der letzten Zeile der Auswahl. Das gilt für Takt- und Segment-Popover gleichermaßen.

Alternative: weiterhin in Beats begrenzen und die Breite des Popovers in Beats umrechnen. Verworfen, weil das Popover bei schrumpfendem Maßstab nicht mitschrumpft und seine Breite vom Inhalt abhängt (Chips, Akzente).

### D5: Einzeilige Kopfzeile der Karte

`.pattern-card h3` wird `flex: 0 1 auto; min-width: 0`. `.pattern-name` bekommt `display: block; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis` statt `overflow-wrap: anywhere`. `.pattern-meta` bleibt `nowrap` und `flex: none`. Der Knopf trägt `title={pattern.name}`. Das Attribut steht immer da, wie bei den Balken der Struktur, weil ohne Layout nicht entscheidbar ist, ob gekürzt wird.

### D6: Tests

- `styles.test.ts` (Text von `styles.css`):
  - „Tablet quer“, „Tablet hochkant“ und „Großes Fenster“: `.songbook` als Container, `.pages` ohne Bedingung untereinander, Schwelle der Query gleich der Summe der Basisbreiten aus D1, darin 3:2 mit den Höchstbreiten; Rechnung bei 1024, 768 und 1650 px.
  - „Smartphone hochkant“: `.structure-page` als Container mit `--beat` nach D2.
  - „Schmale Patternseite“: eine Spalte ohne Bedingung, zwei in `@container (min-width: 28.5rem)`, `.wide` nur dort.
  - „Langer Name“: `.pattern-name` mit `nowrap` und `ellipsis`, ohne `overflow-wrap: anywhere`.
- `vexflow.test.ts`: `naturalCardWidth` für 4 Beats Achtel (≤ 222 px mit Kante und Einzug), 4 Beats 32tel und 8 Beats Achtel (> 222 px), gleich der Breite des gezeichneten Karten-SVG.
- `patternPage.test.tsx`: „Langer Name“, der Knopf hat den vollen Namen als `title`; „Dichtes kurzes Pattern über beide Spalten“, die Karte des 32tel-Grooves hat `wide`, die des Achtel-Grooves nicht.
- `structureEditor.test.tsx`: „Popover am rechten Rand“, mit gestellten `getBoundingClientRect` von Seite und Popover. Das Popover verschiebt sich um den Überstand und nicht über den linken Rand hinaus. Ohne Überstand verschiebt es sich nicht.
- Headless-Chromium (außerhalb des Repos, `~/tools/playwright`) bei 1650, 1400, 1024, 768 und 390 px, mit einem 32tel-Groove: Seiten nebeneinander bzw. untereinander, `scrollWidth` gleich `clientWidth` für beide Seiten und das Dokument, Popover des letzten Takts innerhalb der Seite, Kopfzeilen einzeilig, Noten der 4-Beat-Karte ungeschrumpft. Dazu Screenshots.

### D7: Breite Karten nach Notenbreite

`vexflow.ts` exportiert `naturalCardWidth(model)`: die Breite der Noten in einer Zeile ohne Umbruch im Kartenmaßstab, also die Summe von `staveWidth` aller Takte mit Schlüssel am ersten, plus Rand, mal `CARD_SCALE`. Das ist dieselbe Rechnung, mit der `renderNotation` `totalWidth` bestimmt; beide nutzen eine gemeinsame Funktion. Sie braucht nur den VexFlow-Formatter, kein Zeichnen.

`PatternCard` setzt `wide`, wenn `naturalCardWidth` plus Farbkante und Einzug (3px + 0,5rem) größer ist als die kleinste Spalte bei zwei Spalten, `(28,5rem − 0,75rem) / 2` = 222 px. Gemessen im Browser: 4 Beats in Achteln etwa 219 px (eine Spalte), 8 Beats in Achteln etwa 394 px, 4 Beats in 32teln etwa 760 px (beide Spalten), 2 Beats etwa 140 px. In jsdom rechnet VexFlow mit anderen Glyphenmaßen (32tel etwa 650 px); die Entscheidung fällt im Browser mit denselben Werten wie das gezeichnete SVG. Berechnet wird mit `useMemo` je Pattern.

Alternative: gegen die tatsächliche Spaltenbreite messen (ResizeObserver). Verworfen: zwischen 222 px und 15rem schwankt die Spalte nur wenig, und die feste Grenze ist ohne Layout testbar.

## Risks / Trade-offs

- [`cqw` in einer Custom Property am Container selbst] → Die Property wird erst in den Nachfahren berechnet. Prüfen im Chromium, ob 1rem-Rundung oder Subpixel die Zeile breiter als die Seite machen. Falls ja, die Formel um 1px kürzen.
- [Feste Maße bei 18 px pro Beat: „ab 5“, Fill-Kurzschrift, Einfüge-Knöpfe liegen dicht] → Bewusst „brauchbar, nicht ideal“. Bearbeitet wird über die Auswahl, die Knöpfe erscheinen ohnehin nur bei Maus-Hover.
- [Schwellen in rem hängen an den Maßen des Notenrenderers] → Ändert sich die Kartengröße der Noten, prüft der Browser-Check die Schwelle aus D3. Ein Kommentar an der Regel nennt die Herkunft.
- [Bestehende Tests zu „Zweispaltige Patternseite“ prüfen nur die Klasse `wide`] → Bleiben gültig: 8 Beats in Achteln sind weiterhin breit, 2 und 4 Beats in Achteln nicht.
- [Untereinander, etwa bei 768 px, haben die zwei Spalten wieder Luft neben den Karten] → In Kauf genommen; der Kasten hat dort ohnehin die volle Breite.
- [Bei 3rem pro Beat werden die Balken länger, die Zeilenhöhe bleibt] → Gewollt; die Obergrenze hält das Verhältnis im Rahmen.
- [Eine 4-Beat-Karte, breiter als zwei Spalten (schon 4 Beats in 32teln, etwa 760 px)] → Bewusst in Kauf genommen: Sie belegt beide Spalten und schrumpft per `max-width` auf etwa 2/3. Die Patternseite bleibt dafür kompakt; eine Höchstbreite nach dem breitesten Pattern brächte die leeren Flächen zurück.

## Migration Plan

Keine Datenmigration; nur Darstellung.
