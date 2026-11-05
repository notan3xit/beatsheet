# Design

## Context

Motivation und Umfang: `proposal.md`, Verhalten: `specs/`.

- Die Tasten stehen an drei Stellen: `SongTransport` in `Songbook.tsx`, `Transport` in `playback.tsx` und `PlayActions` in `StructurePopovers.tsx`.
- Alle Tasten tragen `data-read-safe`, sonst blockiert sie der Riegel des gesperrten Songs.
- `.transport .play` hat eine Mindestbreite, nur damit „Abspielen“ und „Stopp“ die Zeile nicht verschieben.
- Die Akzent-Elemente haben nicht die Maße der Chips: Auswahllisten erben den globalen Innenabstand von `select`, „Akzent hinzufügen“ den von `button`, und um beide liegt ein `fieldset` mit Legende.
- `ACCENT_LABELS` in `src/songbook/layout.ts` enthält die Kürzel, die die Struktur für Akzente zeigt.

## Goals / Non-Goals

**Goals:**

- Eine einzige Komponente für alle Abspiel-Knöpfe.
- Bestehende zugängliche Namen bleiben, damit die Tests zum Verhalten gültig bleiben.

**Non-Goals:**

- Neue Abspiel-Logik: `usePlayback` und `useSongPlayback` bleiben unverändert.

## Decisions

### D1: Komponente `PlayButton`

`src/ui/PlayButton.tsx` erhält die Props `symbol` (`play`, `loop`, `stop`), `label`, `disabled` und `onClick`. Sie setzt `aria-label`, `title` und `data-read-safe` und rendert das SVG mit `currentColor` wie `LockIcon`.

Alternative: Unicode-Zeichen. Sie sehen je nach Schrift und System anders aus und widersprächen der Wiedererkennung.

Wiederholen zeigt zwei Pfeile im Rechteck wie bei Musik-Playern. Ein einzelner Kreispfeil läse sich als „neu laden“.

### D2: Aussehen

Alle Abspiel-Knöpfe haben eine feste quadratische Größe: 2rem im Kopf, 1.6rem im Overlay. Die Größe entscheidet CSS über den umgebenden Kontext. Das ersetzt die Mindestbreite von `.transport .play`, und der Wechsel des Symbols verschiebt nichts.

Abspiel-Taste, Schloss, „Song löschen“ und die Aktionen des Pattern-Editors teilen eine Regel mit der Höhe 2rem. So bestimmt keiner der beim Entsperren erscheinenden Knöpfe die Höhe der Kopfzeile. Die Textknöpfe erhalten dafür kleinere Schrift und weniger Innenabstand.

Alternative: Abspiel-Taste vergrößern. Sie ginge auf Kosten der ruhigen Kopfzeile.

Die Farbe ist `--playhead`, das schon Laufposition, laufenden Takt und erklingende Sequencer-Spalte zeigt. So verbindet eine Farbe den Knopf mit dem, was er auslöst. Das Symbol steht in `--playhead` auf einer Fläche aus `color-mix` mit 18 % `--playhead`, in Hell- und Dunkelmodus gleich, damit der Knopf nicht als Signal wirkt.

Alternativen:
- Fläche von `button.primary` in `--accent`: wirkt in Mocha als volle Signalfläche und steht in Konkurrenz zu anderen Hauptaktionen.
- Neue Farbe nur für die Knöpfe: Jede Catppuccin-Farbe kommt auch als Patternfarbe vor, eine neue hätte also keinen Vorteil, trennte aber Knopf und Laufposition.

### D3: Namen

| Stelle | Symbol und Name | Während der Wiedergabe |
|---|---|---|
| Kopf der Doppelseite | Abspielen, „Song abspielen“ | Stoppen, „Stopp“ |
| Pattern-Editor | Wiederholen, „In Schleife abspielen“ | Stoppen, „Stopp“ |
| Overlay, erster Knopf | Abspielen, „Ab hier abspielen“ | unverändert |
| Overlay, zweiter Knopf | Wiederholen, „In Schleife abspielen“ | unverändert |

Das Overlay startet auch während der Wiedergabe neu; gestoppt wird im Kopf. Das hält das Overlay frei von Zustand.

### D4: Abschnitte im Takt-Popover

`BarPopover` gliedert sich in `div.popover-section`; ab dem zweiten trennt eine obere Linie in `--border`. Der erste enthält Titel und `PlayActions` in einer Zeile. Die Akzente sind ein eigener Abschnitt, der bei mehreren Takten entfällt. Das gesperrte Popover rendert nur den ersten Abschnitt und bleibt damit ohne eigenen Zweig für den Aufbau. `SegmentPopover` rendert `PlayActions` zuerst.

### D4a: Overlay schließt beim Abspielen

`StructurePage` reicht `clear` an die Popover weiter, und `PlayActions` ruft es nach dem Start auf. Das entspricht dem Aufheben per Escape: `Bereich beim Start festgehalten` sichert, dass die Wiedergabe weiterläuft.

### D5: Spalten für `-` und `+`

`PatternChips` rendert `-` und `+` vor den Pattern-Chips. Beide und die Knöpfe der Länge erhalten die Klasse `step-button` mit fester Breite, weil der linke Rand der Chips die Breite sonst unterschiedlich macht. Die Zeile Länge nutzt `chips-label` für dieselbe erste Spalte und steht zwischen Fill und dem dritten Abschnitt.

`-` und `+` bedeuten je nach Zeile etwas anderes. Die zugänglichen Namen und Tooltips nennen die konkrete Aktion.

### D6: Akzente

`AccentEditor` ersetzt das `fieldset` durch `div` mit `role="group"` und `aria-label="Akzente"`, sodass der Rahmen entfällt. Die Eingabezeile nutzt `chips-label` und die Klasse `.accent-add select`, die Innenabstand und Schrift der Chips übernimmt. Die Instrument-Auswahl ist auf 9rem begrenzt, damit die Reihe auch mit „Hi-Hat (geschlossen)“ in die Breite des Popovers passt; lange Namen werden darin gekürzt. Der Knopf zeigt `+` und behält den Namen „Akzent hinzufügen“. Die Chips zeigen `<Beat>.<Position> <ACCENT_LABELS>`, die Entfernen-Knöpfe behalten ihren Namen.

## Risks / Trade-offs

- [Blau ist die erste Patternfarbe, ein Groove-Chip kann direkt unter den Abspiel-Knöpfen blau sein] → Knöpfe und Chips unterscheiden sich durch Form und Symbol; bei der Sichtprüfung beurteilen.
- [Ein Symbol allein wird nicht sofort verstanden] → Tooltip und zugänglicher Name nennen die Aktion.
- [Abspielen bedeutet im Kopf „von Anfang an“, im Overlay „ab hier“] → Die Bedeutung ergibt sich aus dem Ort; der Tooltip nennt sie.
- [Die Akzente-Reihe passt nicht in jedes Popover] → Die Instrument-Auswahl ist begrenzt; bei Bedarf bricht die Reihe um, weil `flex-wrap` bleibt.
- [Die Layout-Eigenschaften lassen sich unter jsdom nicht messen] → Tests prüfen Reihenfolge und Klassen, Task 5.2 prüft die Darstellung im Browser.
