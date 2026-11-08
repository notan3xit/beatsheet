# Design

## Context

`layoutStructure(song)` in `src/songbook/layout.ts` ist rein und liefert je Segment Zeilen mit Taktrahmen und Balken. `StructurePage` rendert sie, kennt den Sperrzustand (`useNotebook().locked`) und schlüsselt Segmente nach ID, Zeilen nach Index. `resolveSong` in `src/domain/timeline.ts` löst Groove-Fortlauf und Fill-Überdeckung auf; Fills reichen dabei über Block- und Segmentgrenzen. Das Motiv der Song-Kacheln nutzt `layoutStructure` ebenfalls. Im CSS gibt es bisher keine Übergänge.

Ein Mock-up mit „Toxicity“ und „In Bloom“ aus der lokalen Datenbank hat die Entscheidungen vorab geprüft; das Auf- und Zufahren mit erhaltener Auswahl war verständlich.

## Goals / Non-Goals

**Goals:**
- Die Darstellung bleibt eine reine Funktion von Song und Sperrzustand, ohne gemerkten Zustand je Zeile.

**Non-Goals:**
- Wiederholungen im Datenmodell (Block „×4“, Segment „wie Verse“).
- Gleiche Zeilen innerhalb eines Blocks flach zeigen.
- Zeilenlänge nach Taktart (etwa 18 Beats bei 6/4).
- Änderungen am Motiv der Song-Kacheln.

## Decisions

### D1: Vergleich über aufgelöste Takte

Ein Takt wird durch die Signatur aus `ResolvedBar` beschrieben: `beats`, `groove` (Pattern und Offset), `fills` (Pattern, `from`, `to`, `fillOffset`) und `accents`. Ein Block ist die Folge seiner Taktsignaturen, ein Segment die Folge seiner Blöcke. Gleich ist, was dieselbe Folge hat.

Alternative: rohe `Bar`-Felder (`grooveId`, `fillId`, `accents`) vergleichen. Verworfen, weil ein Fill aus dem folgenden Block einen Block anders aussehen lässt, ohne dass sich seine Takte unterscheiden (Szenario „Fill aus dem folgenden Block“).

Ein Block ist flach, wenn irgendein früherer Block des Songs dieselbe Folge hat. Ein wiederholtes Segment besteht aus solchen Blöcken und braucht keine eigene Regel.

Alternative: nur mit dem vorigen Block desselben Segments und mit ganzen Segmenten vergleichen. Verworfen, weil dann der erste Block eines abgewandelten Segments voll bliebe, obwohl er einen früheren Block wiederholt. Leere Blöcke (D2) sind davon ausgenommen: Ob sie flach sind, hängt allein vom Sperrzustand ab, auch innerhalb eines wiederholten Segments. Sonst würde entsperrt jedes neu eingefügte Segment mit leeren Takten sofort flach, gerade wenn man es füllen will.

### D2: Schnittstelle des Layouts

`layoutStructure(song, { locked })` ergänzt `Row` um `flat: boolean`. Leer ist ein Block, wenn keiner seiner aufgelösten Takte `groove`, `fills` oder `accents` hat; er ist flach, wenn `locked` gesetzt ist. Die Vorgabe `locked: false` lässt `motif.ts` unverändert; dessen Reihen hängen nicht von `flat` ab.

Zeilenumbruch, Positionen und Balken bleiben für flache Zeilen gleich. Was nicht gezeigt wird (Namen, Startbeat, Kurzschrift, Akzente), blendet das CSS über die Klasse `flat` aus. Die Zeilennummer bleibt, kleiner (0,55rem) und auf die Höhe der flachen Zeile ausgerichtet; sie gleitet mit. So bleiben Balken, Hervorhebung, Ablegeziele, Popover-Anker und Wiedergabeposition ohne Sonderfall.

### D3: Übergang

`.structure-row` erhält einen Übergang auf `height` und `margin-top`, Balken auf `top`/`bottom`, Beschriftungen und Akzente auf `opacity`, der Segmentname in der Namensspalte (D5) auf seinen Abstand nach oben. Die Dauer steht als Token `--motion-row` (etwa 240 ms) in `styles.css`; unter `prefers-reduced-motion: reduce` ist es `0ms`. Zeilen werden nach Block-ID und Zeilenindex geschlüsselt, damit React beim Umschalten dasselbe Element behält und der Übergang greift.

Die Auswahl besteht aus Takt-IDs und ist von der Darstellung unabhängig; dafür ist nichts zu tun.

### D4: Maße flacher Zeilen

Höhe `0.625rem`, Abstand `0.125rem`, am Blockanfang `0.25rem` mit der gestrichelten Linie dazwischen. Balken mit 1px Innenabstand oben und unten. Die Hervorhebung nutzt die vorhandenen Farben; der Rahmen ist 1px plus 1px Schatten, weil 2px Rahmen in 10px Höhe kaum Füllung übrig lassen. Die Tönungen bleiben die der vollen Zeile, damit Wiederholungen nicht hervortreten.

Die Einfüge-Knöpfe beim Überfahren erscheinen auch an flachen Zeilen, vertikal auf die Zeile zentriert.

### D5: Namensspalte per Container-Abfrage

Die Struktur-Seite ist bereits Container. Ab der Inhaltsbreite `16 × 2.25rem + --row-gutter + --name-col` (mit `--name-col: 7rem` also 44,625rem) wird `.segment` ein Raster aus Namensspalte und Zeilen, und `--beat` rechnet mit der um die Spalte verringerten Breite. Darunter bleibt alles wie heute. `--structure-max` wächst um `--name-col`, damit die Breite pro Beat weiter 3rem erreichen kann. `--structure-width` (Basis für das Nebeneinander der Doppelseite) bleibt, damit sich die Schwelle der Doppelseite nicht verschiebt.

Der Name steht mit `line-height` der vollen Zeile auf ihrer Höhe; beginnt das Segment mit einer flachen Zeile, verringert sich sein Abstand nach oben, damit das Segment nicht höher wird als nötig. Umbruch auf höchstens zwei Zeilen per `line-clamp`, `title` mit dem vollen Namen.

Folge der Regel: Die Namen stehen links, wo die Struktur breit genug ist. Das ist untereinander ab etwa 790 px Fensterbreite und nebeneinander ab etwa 1140 px der Fall; dazwischen (Tablet quer) stehen sie oben.

Alternative: feste Fensterbreite als Schwelle. Verworfen, weil die Breite der linken Seite je nach Anordnung der Doppelseite wechselt.

### D6: Tests

`layout.test.ts` prüft die Erkennung an `flat` (Szenarien aus „Wiederholte Blöcke“ und „Leere Blöcke“). `songbook.test.tsx` prüft Auswahl, Bereichsauswahl und das Umschalten über das Schloss an der Klasse `flat` der Zeilen. Maße, Übergang, reduzierte Bewegung und Namensspalte prüft `styles.test.ts` am CSS-Text, wie dort üblich; jsdom berechnet kein Layout. Die Szenarien zu Fensterbreiten und zur Animation prüft der Browser-Check mit Screenshots.

### D7: Schalter zum Ausklappen

Der Zustand liegt wie `locked` im Notebook-Store (`expanded`, `setExpanded`), gilt nur im Tab und wird beim Öffnen eines Songs auf `false` gesetzt. `layoutStructure(song, { locked, expanded })` liefert ausgeklappt keine flachen Zeilen; Übergang und Auswahl bleiben damit wie in D3.

Der Knopf `StructureToggle` steht in der Kopfzeile der Doppelseite vor `LockToggle`, mit `data-read-safe`, `aria-pressed` und dem Namen „Struktur ausklappen“ bzw. „Struktur einklappen“. Er übernimmt Maße und Farben des Schlosses; eine Regel auf `.structure-toggle` setzt `margin-left: auto`, und das Schloss rückt direkt an ihn heran. Das Symbol ist ein SVG aus zwei waagrechten Linien und einem Pfeil.

## Risks / Trade-offs

- [Eine flache Zeile von 10px ist mit dem Finger schwer zu treffen] → Bearbeitet wird meist das volle Original darüber; die Wiederholung folgt. Im Browser-Check auf dem Tablet prüfen.
- [Die Erkennung läuft bei jedem Rendern über alle Takte] → Linear in der Zahl der Takte (höchstens einige Hundert); Signaturen als Zeichenketten, Segmentvergleich über eine Map.
- [Beim Entsperren verschiebt sich die Struktur] → Gewollt und animiert; das Schloss liegt außerhalb der Struktur.
- [Langer Name in einem Segment aus einer einzigen flachen Zeile macht das Segment höher] → Hingenommen; zwei Zeilen Namen sind die Obergrenze.
