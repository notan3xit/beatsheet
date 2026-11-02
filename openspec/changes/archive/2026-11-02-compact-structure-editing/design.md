# Design

## Context

Siehe `proposal.md` (Why). Ist-Zustand der linken Buchseite:
- `src/songbook/layout.ts` (`layoutStructure`) teilt jedes Segment in Zeilen zu 4 Takten, über Blockgrenzen hinweg. Ein Blockanfang ist nur `BarFrame.blockStart` (dickerer Strich). `FillItem.mini` steuert die verkleinerten Noten.
- `src/ui/StructurePage.tsx` rendert Zeilen absolut positioniert in der Einheit `--beat` (2.25rem). Eine Zeile ist 3.6rem hoch mit 1rem Abstand. Die Taktnummer steht über der Zeile.
- Die Takt-Auswahl (`useBarSelection`, Klick/Shift-Klick) wirkt auf den `BarInspector` unter der Struktur. Das Segment-Formular ist `StructureToolbar`. `SegmentHeader` trägt sechs Buttons und ein Inline-Umbenennen.
- `src/domain/structure.ts` kennt `appendSegment`, `appendBlock(input)`, `insertBarAfter`, `appendBar`, `deleteBar`, `setBarProps` und `addPlaceholder`. `createPattern` vergibt den automatischen Namen und `nextColor` die freie Farbe.

## Goals / Non-Goals

**Goals:**
- Jede Bearbeitung läuft über eine **Auswahl + Popover**. Diese Grundschicht soll vollständig und ohne Hover bedienbar sein, damit später ein Tablet-Weg und Maus-Abkürzungen darauf aufsetzen können.
- Neue Strukturoperationen als reine Funktionen in `domain/structure.ts`. Layout weiter rein in `songbook/layout.ts`.
- Die Popover-Position wird aus dem Layout berechnet (in Beats und Zeilen), nicht aus DOM-Messungen. Das funktioniert in jsdom und ohne Positionierungs-Bibliothek.

**Non-Goals:**
- Hover-(+), Drag-and-Drop (Folge-Change `structure-pointer-shortcuts`). Die Chips werden aber so gebaut, dass sie dort als Ziehquelle dienen können (D5).
- Takte verschieben, Undo für die Struktur, Tastaturnavigation zwischen Takten (über die normale Tab-Reihenfolge hinaus)
- Neugestaltung des Akzent-Editors: Er zieht unverändert ins Takt-Popover um.

## Decisions

### D1: Layout: Zeilen pro Block
`layoutStructure` bricht Zeilen innerhalb jedes **Blocks** nach 4 Takten um, statt innerhalb des Segments. `SegmentLayout.rows` bleibt flach. Jede `Row` bekommt `blockId` und `blockStart: boolean` (erste Zeile eines Blocks, außer der ersten des Segments), damit das CSS einen etwas größeren Abstand vor einem neuen Block setzen kann. `BarFrame.blockStart` entfällt, weil ein Blockanfang jetzt immer ein Zeilenanfang ist.

Fills über Blockgrenzen funktionieren unverändert: Die Zeilengrenze teilt sie bereits mit `continuesLeft/Right`.

`FillItem.mini` entfällt. Ein Fill zeigt immer seinen Namen. Die `compact`-Option von `renderNotation` bleibt bestehen (eigener Test in `vexflow.test.ts`), wird aber in der Struktur nicht mehr verwendet. Sie könnte später als Hover-Vorschau dienen.

*Alternative:* Blöcke weiterfließen lassen und nur den Strich betonen. Verworfen, weil „unten anfügen“ und späteres Takte-Verschieben klar getrennte Zeilen brauchen.

### D2: Kompakte Maße
- `--beat` bleibt bei 2.25rem (4 Takte 4/4 = 36rem passen in die 3/5-Seite).
- `.structure-row`: `height: 1.4rem`, Abstand 0.3rem. Vor einem neuen Block (`.structure-row.block-start`) 0.6rem, vor einem Segment etwa 0.6rem plus Kopfzeile (kleine Versalien wie bisher, ohne Buttons).
- Groove- und Fill-Elemente füllen die Zeilenhöhe, mit `text-overflow: ellipsis` und `title` = vollständiger Name. Der Startbeat steht als kleine Zahl („5“) rechts im Groove-Element und hat beim Kürzen Vorrang vor dem Namen. Dafür bekommt die Zahl `flex-shrink: 0`.
- **Abstand:** Groove- und Fill-Balken sind nur an Taktgrenzen um `--item-gap` (3px) eingerückt, damit sie nicht an Taktstriche stoßen. Wo ein Fill im selben Takt den Groove von rechts ablöst, schließen beide bündig an, denn dort liegt keine Taktgrenze, sondern der Fill übernimmt. Dafür liefert das Layout an Groove- und Fill-Elementen `atBarStart`/`atBarEnd`. Die gestrichelten Taktstriche im Fill-Block gleichen eine linke Einrückung aus.
- **Taktnummer:** Steht nicht mehr über dem Takt, sondern in einer schmalen Spalte links vor der Zeile, nur für den ersten Takt der Zeile. Jeder Takt-Button behält `aria-label="Takt n"`.
- **Akzente:** kleine Marker (0.55rem Schrift) an der Oberkante, die halb über den Balken hinausragen. Der Zeilenabstand von 0.3rem reicht dafür, weil die Marker nur nach oben ragen.
- `styles.test.ts` prüft die Grenzen aus der Spec „Kompakte Zeilen“ (Höhe ≤ 1.5rem, Abstand ≤ 0.5rem) anhand der Regel `.structure-row`.

### D3: Auswahlmodell
Ein `useStructureSelection(song)` in der UI ersetzt `useBarSelection`:

```ts
type Selection =
  | { kind: 'none' }
  | { kind: 'segment'; segmentId: string }
  | { kind: 'bars'; barIds: string[]; anchor: string };
```

- Klick auf einen Takt setzt `bars` (Shift + Anker = Bereich in Songreihenfolge, wie bisher). Klick auf einen Segmentnamen setzt `segment`. Beide ersetzen jede vorherige Auswahl.
- Verschwindet etwas Ausgewähltes durch eine Änderung (z. B. Löschen), wird die Auswahl bereinigt. Bleibt nichts übrig, ist sie `none`.
- **Schließen:** Escape (`keydown` auf `document`) und `pointerdown` außerhalb von `.structure-page` *und* Popover. Ein Klick auf eine leere Stelle der Strukturseite schließt ebenfalls. Klicks auf Takte und Segmentnamen setzen dagegen eine neue Auswahl.
- Nach „Segment danach einfügen“ und „Erstes Segment anlegen“ wird das neue Segment ausgewählt. Seine Position ist bekannt (Index + 1 bzw. 0), daher liest die UI die ID nach `updateSong` aus dem aktuellen Song. Die Domain-Funktion muss keine ID zurückgeben.

*Alternative:* die Auswahl in den `notebookStore` legen. Verworfen, weil die Auswahl reiner UI-Zustand der Doppelseite ist und nicht gespeichert oder exportiert werden soll.

### D4: Popover
- **Position:** Das Popover wird innerhalb der Zeile verankert, in der die Auswahl endet. Bei Takten ist das der letzte ausgewählte Takt, bei einem Segment die Kopfzeile. Es ist `position: absolute`, `top: 100%`, `left: calc(var(--beat) * x)` mit x = Startposition des ersten ausgewählten Takts in dieser Zeile, mit `max(0, …)`/`min(…, 100% - Breite)` begrenzt. Es überdeckt die folgenden Zeilen, statt sie zu verschieben, damit die Struktur beim Bearbeiten nicht springt. `z-index` über den Akzent-Markern.
- **Semantik:** `role="dialog"`, nicht modal, `aria-label` = „Takt-Auswahl“ bzw. „Segment <Name>“. Beim Öffnen bleibt der Fokus auf dem angeklickten Takt (Shift-Klicks sollen weiter funktionieren). Das Popover ist per Tab als nächstes Element erreichbar, weil es im DOM direkt in der Zeile steht.
- **Segment-Popover:** Namensfeld (`CommitField`-Muster: Enter/Blur übernimmt, leerer Name wird verworfen), ↑, ↓, Duplizieren, „Segment danach einfügen“, „Block anfügen“, Löschen (`useConfirm`, Klasse `danger`).
- **Takt-Popover**, zeilenweise:
  1. Groove: `PatternChips kind="groove"`
  2. Fill: `PatternChips kind="fill"`
  3. Länge: „−“, Anzeige (`4/4` bzw. „gemischt“), „+“ mit `aria-label` „Taktlänge verringern/erhöhen“
  4. „Takt davor“, „Takt danach“, „Löschen“ (`danger`, ohne Bestätigung wie bisher)
  5. bei genau einem Takt: `AccentEditor` (aus `BarInspector` übernommen)
- Validierungsfehler (`ValidationError`) erscheinen wie bisher als `role="alert"` im Popover.

### D5: `PatternChips`
`<PatternChips kind selection />` rendert für jedes Pattern der Art einen Button (`aria-label` = Name, `aria-pressed` = alle ausgewählten Takte haben es, Farbe über `patternStyle`), danach „neu“ (`aria-label` „Neuer Groove“/„Neuer Fill“, gestrichelt in `nextColor(song.patterns)`) und „kein“. Ein Chip zeigt den Namen gekürzt auf etwa 10 Zeichen, mit `title`.

- Klick auf ein Pattern: `setBarProps(s, ids, { grooveId | fillId })`
- Klick auf „neu“: `assignPlaceholder(s, ids, kind)` (D6). `createPattern` vergibt bei leerem Namen „Groove N“/„Fill N“.
- Jeder Chip trägt `data-pattern-id` (bzw. `data-pattern-new`). Darauf kann der Folge-Change das Drag-and-Drop aufbauen, ohne die Chips umzubauen.

`GrooveOptions`, `NEW` und `BEAT_OPTIONS` aus `StructureToolbar` entfallen mit ihr.

### D6: Neue Domain-Funktionen (`structure.ts`)
```ts
insertSegmentAfter(song, afterSegmentId: string | null, deps?): Song
// null = an den Anfang (für den leeren Song). Name "Segment N" (N = segments.length + 1), 1 Block, 4 Takte 4/4, kein Groove.
appendBlockLike(song, segmentId, deps?): Song
// Taktzahl des letzten Blocks, Länge + Groove von dessen letztem Takt (barLike); ohne Blöcke: 4 × 4/4.
insertBarBefore(song, barId, deps?): Song
// barLike(dieser Takt), an seiner Position
assignPlaceholder(song, barIds, kind, deps?): Song
// neues leeres Pattern (Groove 4 Beats, Fill 1 Beat, automatischer Name, nächste freie Farbe) und den Takten zuweisen
changeBarLength(song, barIds, delta: -1 | 1): Song
// pro Takt beats + delta; ValidationError, wenn ein Takt 1..16 verlässt (dann unverändert); Akzente wie bei setBarProps kürzen
```
`appendSegment` bleibt (Tests und Testdaten nutzen es). `appendBlock(input)`, `appendBar` und `deleteBlock` werden nicht mehr von der UI benutzt und entfallen, sofern kein Test der Domain sie braucht. Die Spec-Szenarien zu Blöcken laufen über `appendBlockLike` und `deleteBar`.

`changeBarLength` ist eine eigene Funktion, weil `setBarProps` allen Takten denselben Wert setzt. Das Popover deaktiviert „−“/„+“ vorab mit derselben Grenzprüfung, die als `canChangeBarLength(song, ids, delta)` exportiert wird.

### D7: Tests
- Domain: neue `describe`-Blöcke in `structure.test.ts` je Szenario aus `song-structure` (Segment einfügen, Block anfügen, Takt davor, Länge ±1, Platzhalter ohne Namen).
- Layout: `layout.test.ts` bekommt „Neuer Block in neuer Zeile“. „Kurzer Fill“ prüft `mini` nicht mehr. Der Test „Takte … markieren Blockanfänge“ wird auf `Row.blockStart` umgestellt.
- UI: `structureEditor.test.tsx` wird auf Auswahl + Popover umgeschrieben (Abfragen über `getByRole('dialog', { name: … })` und Chips über `getByRole('button', { name: 'B' })`). `songbook.test.tsx` bekommt „Leseansicht ohne Bedienelemente“ und „Leerer Song“. Der Hinweis `ignore: 'option'` entfällt, weil es keine Auswahllisten mehr gibt.
- CSS: `styles.test.ts` bekommt „Kompakte Zeilen › Zeilenmaße“.

## Risks / Trade-offs

- [Das Popover verdeckt die folgenden Zeilen und damit eventuell Takte, die man per Shift-Klick erreichen will] → Es steht unter der Zeile mit dem *letzten* ausgewählten Takt, ein Bereich wächst also meist nach oben/links frei. Notfalls Esc und neu auswählen. Wenn das in der Praxis stört, lässt sich das Popover über der Zeile platzieren.
- [Rechter Rand: ein Popover am letzten Takt einer Zeile ragt aus der Seite] → die Position wird in Beats auf `Zeilenbreite − POPOVER_BEATS` begrenzt (D4).
- [Ein Scrollbereich auf der Strukturseite (`overflow-x: auto`) schneidet das Popover unten ab, weil `overflow-y` dann ebenfalls `auto` wird] → die Strukturseite hat kein `overflow`. Sehr breite Zeilen (etwa vier 16/4-Takte) ragen dafür sichtbar über den Seitenrand, statt zu scrollen.
- [Gekürzte Namen in 1/4- oder 2/4-Takten werden unleserlich] → Tooltip und Farbe tragen die Information. Die rechte Seite zeigt Namen und Farben vollständig.
- [Ohne Mini-Noten erkennt man einen kurzen Fill nur am Namen] → bewusst so entschieden. Eine Hover-Vorschau mit `compact`-Noten ist im Folge-Change möglich.
- [Klick-außerhalb über `document`-Listener kollidiert mit dem Bestätigungsdialog beim Segment-Löschen] → Der Dialog (`ConfirmDialog`) zählt als „innerhalb“. Die Auswahl bleibt bestehen, bis die Aktion abgeschlossen ist. Danach wird sie bereinigt (D3).

## Migration Plan

Keine Datenänderung: Schema, Dateiformat und IndexedDB bleiben unverändert. Bestehende Songs mit mehreren Blöcken pro Segment erscheinen nach dem Update mit einer neuen Zeile pro Block.

## Ergebnis der Browser-Prüfung (Task 6.2)

Geprüft von artjom am 2026-11-02 auf dem Release-Build. Ein Song mit rund 80 Takten passt etwa auf eine Bildschirmhöhe, das Popover ist vollständig sichtbar, Esc und ein Klick daneben schließen es. Dabei gefunden und behoben: Das Popover wurde abgeschnitten, weil die Strukturseite durch `overflow-x: auto` zum Scrollbereich wurde (siehe Risiken). Auf Wunsch ergänzt: kleiner Abstand zwischen den Balken an Taktgrenzen (D2). Zunächst war auch die Grenze zwischen Groove und Fill im selben Takt eingerückt. Das sah aus wie zwei Teile nebeneinander statt wie eine Überlagerung und wurde korrigiert.
