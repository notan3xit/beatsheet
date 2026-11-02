# Design

## Context

Siehe `proposal.md` (Why). Ist-Zustand nach `compact-structure-editing`:
- `StructurePage` rendert Segmente mit Kopf (`.segment-head`) und Zeilen (`.structure-row`). Takte sind `button.bar-frame` mit `aria-label="Takt n"` und `aria-pressed`. Die Auswahl verwaltet `useStructureSelection` lokal in der `StructurePage`.
- `useDismiss` hebt die Auswahl bei `pointerdown` außerhalb der Strukturseite auf (Ausnahme: `.backdrop` des Bestätigungsdialogs).
- `PatternPage` zeigt die Karten (`article.pattern-card`) und die Knöpfe „Neuer Groove“/„Neuer Fill“. Diese rufen `store.createPattern(kind)` auf, das anlegt und den Editor öffnet.
- Alle nötigen Fachoperationen existieren: `insertBarAfter`, `insertBarBefore`, `appendBlockLike`, `insertSegmentAfter`, `setBarProps`, `assignPlaceholder`.
- jsdom 30 kennt `PointerEvent` (inklusive `pointerType`), aber kein `document.elementFromPoint`.

## Goals / Non-Goals

**Goals:**
- Die Abkürzungen sind reine UI-Schicht über der bestehenden Fachlogik, ohne neue Domain-Funktionen.
- Eigenes, kleines Ziehen auf Basis von Pointer Events statt HTML5-Drag-and-Drop. Das erlaubt ein eigenes Ziehbild und eine eigene Hervorhebung und lässt sich später für Touch erweitern.
- Alles in jsdom testbar: Hover über `pointerType`, Treffer beim Abwerfen über eine austauschbare Trefferprüfung.

**Non-Goals:**
- Ziehen bei Touch (die Quellen reagieren vorerst nur auf Maus und Stift, damit Scrollen per Finger unberührt bleibt)
- Auto-Scroll beim Ziehen an den Fensterrand
- Ziehen innerhalb der Struktur (Takt zu Takt, Takte verschieben)

## Decisions

### D1: Hover-Zustand und Einfüge-Knöpfe
- `StructurePage` hält `hover: { segmentId: string | null; rowKey: string | null }`. `onPointerEnter`/`onPointerLeave` an `.segment` und `.structure-row` setzen bzw. löschen die Werte, **nur bei `pointerType === 'mouse'`**. Touch und Stift erzeugen keinen Hover-Zustand (Spec „Takt einfügen beim Überfahren › Touch“).
- `rowKey` = `${blockId}:${erster Takt der Zeile}`, stabil über Re-Renders.
- Die Knöpfe stehen nur bei passendem Hover im DOM, nicht bloß per CSS versteckt. So bleibt die Leseansicht ohne Hover frei von Knöpfen, und der bestehende Test „Song mit Struktur ohne Auswahl“ gilt unverändert.
- **Takt-Knöpfe** (`button.insert-bar`, rund, ca. 0.9rem, mittig auf dem Taktstrich an der Oberkante der Zeile):
  - nach jedem Takt der Zeile bei `x + width`: `aria-label="Takt nach Takt n einfügen"` → `insertBarAfter`
  - am Zeilenanfang nur in der ersten Zeile eines Blocks: `aria-label="Takt vor Takt n einfügen"` → `insertBarBefore`. In Folgezeilen eines Blocks ist der linke Rand dieselbe Stelle wie das Ende der Vorzeile.
  - Dafür bekommt `Row` im Layout ein Feld `firstInBlock: boolean` (rein, getestet). `blockStart` bleibt für den Abstand.
- **Block/Segment** (`button.insert-strip`, schmale gestrichelte Leiste):
  - unter der letzten Zeile des gehoverten Segments: „Block anfügen“ (`aria-label="Block an <Name> anfügen"`) → `appendBlockLike`
  - darunter, in der Lücke vor dem nächsten Segment: „Segment einfügen“ (`aria-label="Segment nach <Name> einfügen"`) → `insertSegmentAfter`, danach das neue Segment auswählen (wie im Segment-Popover)
  - Beide gehören zum `.segment`-Element, damit der Hover beim Wechsel von der letzten Zeile zur Leiste erhalten bleibt.
  - Die Leisten liegen absolut in der Lücke unter dem Segment (`top: 100%`), damit beim Erscheinen nichts verrutscht. Der Abstand zwischen Segmenten steigt dafür von 0,6 auf 1rem.
- Der Hover wird über die nativen `pointerenter`/`pointerleave` des Elements erkannt, nicht über Reacts `onPointerEnter`/`onPointerLeave`. React leitet diese aus `pointerover`/`pointerout` und deren `relatedTarget` ab. Fehlt `relatedTarget` (etwa in user-event), meldet React beim Wechsel auf einen Einfüge-Knopf fälschlich ein Verlassen der Zeile.
- Klicks auf Einfüge-Knöpfe ändern die Auswahl nicht. `onPagePointerDown` ignoriert Buttons ohnehin.

*Alternative:* Positionsberechnung über Mauskoordinaten (nächste Taktgrenze). Verworfen, weil das in jsdom nicht testbar ist und pro Zeile ohnehin nur wenige Grenzen existieren.

### D2: Ziehen, `src/ui/dragPattern.tsx`
Ein `DragProvider` um die Doppelseite (in `Songbook`) hält den Ziehzustand:

```ts
type DragPayload = { kind: 'pattern'; patternId: string } | { kind: 'new'; patternKind: PatternKind };
interface DragState { payload: DragPayload; x: number; y: number; targets: string[] }  // targets = Takt-IDs
```

- **Quelle:** `useDragSource(payload)` liefert `onPointerDown` und `data-drag-source`. Sie reagiert nur auf die Haupttaste und `pointerType !== 'touch'`. Das Ziehen beginnt erst ab 5px Bewegung. Bis dahin ist es ein normaler Klick, „Neuer Groove“ öffnet also weiter den Editor. Nach einem echten Ziehen wird der folgende `click` einmalig abgefangen (Capture auf `document`).
- **Verfolgen:** `pointermove`, `pointerup`, `pointercancel` und `keydown` (Escape) auf `document`, solange gezogen wird.
- **Treffer:** `hitTest(x, y): Element | null`, Standard `document.elementFromPoint`. Takt-Knöpfe tragen `data-bar-id`. Das Ziel ist `hitTest(...)?.closest('[data-bar-id]')`.
- **Zieltakte:** Die `StructurePage` registriert im Provider einen Resolver `(barId) => selection.barIds.includes(barId) ? selection.barIds : [barId]`. Die Auswahl bleibt damit lokal in der `StructurePage`.
- **Loslassen auf Takt:** ein `store.updateSong` mit
  - `pattern` + Groove → `setBarProps(s, targets, { grooveId })`
  - `pattern` + Fill → `setBarProps(s, targets, { fillId })`
  - `new` → `assignPlaceholder(s, targets, patternKind)`
- **Abbrechen:** Loslassen ohne Ziel, Escape oder `pointercancel` setzen den Zustand zurück, ohne `updateSong`.
- **Ziehbild:** ein Chip mit `position: fixed` am Zeiger (Name bzw. „Neuer Groove“, Farbe über `patternStyle`, bei „neu“ `nextColor`), `pointer-events: none`. Solange gezogen wird, hat `body` die Klasse `dragging-pattern` (Cursor `grabbing`, `user-select: none`).
- **Hervorhebung:** Takt-Knöpfe in `targets` bekommen die Klasse `drop-target`, eine gestrichelte Umrandung in `--accent`, die sich von der Auswahl unterscheidet.
- **Testbarkeit:** `App` nimmt optional `hitTest` entgegen und stellt es über `HitTestContext` bereit. Der `DragProvider` in `Songbook` liest es von dort. Tests übergeben eine Funktion, die ein bestimmtes Takt-Element zurückgibt.

*Alternative:* HTML5-Drag-and-Drop. Verworfen: kein Touch, das Ziehbild lässt sich nur eingeschränkt gestalten, und jsdom unterstützt `DataTransfer` nur lückenhaft.

### D3: Zusammenspiel mit Auswahl und Popover
- `useDismiss` ignoriert `pointerdown` auf `[data-drag-source]`. Sonst würde das Ziehen die Auswahl aufheben, bevor sie als Ziel dient (Spec „Groove auf die Auswahl“). Ein bloßer Klick auf eine Karte lässt die Auswahl damit ebenfalls stehen. „Bearbeiten“ und „Neuer …“ wechseln ohnehin die Ansicht.
- Nach dem Abwerfen bleibt die Auswahl bestehen. Ein offenes Popover zeigt dann sofort den neuen Groove bzw. Fill als gewählten Chip.

### D4: Quellen auf der rechten Seite
- `PatternCard`: Der Kartenkopf ist die Ziehquelle (`cursor: grab`). Der Knopf „Bearbeiten“ bleibt anklickbar, er startet kein Ziehen (`pointerdown` auf Buttons in der Karte wird ignoriert).
- „Neuer Groove“/„Neuer Fill“: dieselben Knöpfe sind Quelle mit `payload: { kind: 'new', patternKind }`. Der `onClick` bleibt `store.createPattern(kind)`.

## Risks / Trade-offs

- [Kleine Trefferflächen der Takt-Knöpfe in 1,4rem hohen Zeilen] → Die Knöpfe sind ca. 0.9rem groß und ragen über die Zeilenoberkante. Die Taktfläche darunter bleibt per Klick auswählbar, weil die Knöpfe nur auf den Strichen sitzen.
- [Hover-Knöpfe flackern beim Wechsel zwischen Zeilen] → Der Segment-Hover umfasst alle Zeilen. Zeilen-Hover wechselt direkt von Zeile zu Zeile, weil die Zeilenabstände (0,3rem) kleiner sind als die über den Rand ragenden Knöpfe.
- [Die rechte Seite scrollt, wenn viele Patterns da sind] → Das Ziehen funktioniert über das ganze Fenster. Auto-Scroll ist kein Ziel dieses Changes.
- [Klick nach dem Ziehen löst die Knopfaktion aus (z. B. „Neuer Groove“ öffnet den Editor)] → Der nächste `click` wird nach einem Ziehen einmalig im Capture abgefangen (D2).

## Migration Plan

Keine Datenänderung.

## Ergebnis der Browser-Prüfung (Task 4.2)

Geprüft von artjom am 2026-11-02 auf dem Release-Build: Einfügen beim Überfahren und Ziehen funktionieren wie beschrieben. Grafische Korrekturen danach:
- Der Schlussstrich einer Zeile ist ein eigenes Element (`.row-end`, linke Kante bei x = Zeilenbreite) statt `.bar-frame:last-of-type { border-right }`. Vorher verschwand er, sobald die (+)-Knöpfe als weitere Buttons in der Zeile standen, und lag 1px links von den Trennstrichen an derselben Stelle in anderen Zeilen.
- Die (+)-Knöpfe sind exakt runde Kreise mit einem per Verlauf gezeichneten Plus (kein Schriftzeichen). Takt-Knöpfe und Block-/Segment-Leisten sind einheitlich dezent: Fläche `--control`, Ring `--border`, Zeichen `--muted`, bei Hover `--control-hover`/`--text`. Statt `--accent` wie zunächst.
- Der Startbeat eines längeren Grooves steht sichtbar als „ab 5“ mit Tooltip „Takt beginnt mit Beat 5 des Grooves“. Die nackte Zahl aus `compact-structure-editing` war nicht verständlich.
- Die (+)-Knöpfe wurden je nach Lage mal scharf, mal verwischt gezeichnet, weil Größe, Versatz (`translateX(-50%)` von 14,4px) und Strichstärke (1,5px) auf Subpixeln lagen, ebenso die Zeilen (Rand 1,6rem, Höhe 1,4rem, Abstand 0,3rem). Alle beteiligten Maße liegen jetzt bei 16px Grundschrift auf ganzen Pixeln: Knopf 16px mit `margin-left: -8px` statt `transform`, Striche 2px, Zeilenrand 26px, Zeilenhöhe 22px, Zeilenabstand 4px.
- Das Einrasten auf ganze Pixel half nur bei 100 % Zoom. Beim Zoomen landeten Verläufe und Ring wieder zwischen den Pixeln. Kreis und Plus sind deshalb jetzt ein Inline-SVG (`viewBox 0 0 16 16`, Ring 1, Plus 1,75 Einheiten). Der Browser zeichnet es bei jedem Zoom als Vektorgrafik, gleichmäßig und mittig. Die Farben kommen weiter aus den Tokens (`fill`/`stroke` im CSS).
