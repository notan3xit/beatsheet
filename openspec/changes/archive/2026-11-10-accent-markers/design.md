# Design

## Context

`layoutRow` in `src/songbook/layout.ts` erzeugt für jeden Akzent ein `AccentItem` (`x`, `label`, `barId`); `StructurePage.tsx` zeichnet es als `.accent` mit `top: -0.35rem` über der Zeile. Zeilen sind 1,375rem hoch und haben 0,25rem Abstand (`.structure-row`). Flache Zeilen blenden Akzente aus.

## Goals / Non-Goals

**Goals:**
- Auswahl je Beat als reine Funktion im Layout, testbar ohne DOM.
- Fuß-Markierungen verdecken weder Groove und Fill der eigenen Zeile noch die nächste Zeile.

**Non-Goals:**
- Anzeige verdeckter Akzente (Zähler, Tooltip); das Takt-Popover listet sie bereits.
- Änderungen am Akzent-Editor, an der Wiedergabe oder am Datenmodell.

## Decisions

**D1 Hand und Fuß.** Fuß-Instrumente sind `kick` und `hihatPedal` (`FOOT_INSTRUMENTS` in `layout.ts`), alle übrigen Hand-Instrumente. Der Auftrag nennt „unten“ für beide; gemeint ist Hand oben, Fuß unten, wie Notenhälse und Notation es nahelegen.

**D2 Auswahl.** Je Takt und Beat werden die Akzente nach Hand und Fuß getrennt. Oben gewinnt der Akzent mit dem kleinsten Index in `INSTRUMENTS` (höchste Sequencer-Zeile), unten der mit dem größten; bei gleichem Instrument die frühere Position. Damit gewinnt unten das Hi-Hat-Pedal vor der Bassdrum, wie in der Notation, wo es tiefer steht. `AccentItem` erhält `place: 'top' | 'bottom'`.
Alternative: Kürzel zusammenfassen („Cr SD“). Verworfen, weil Markierungen breiter als ein Viertelbeat werden und sich mit Nachbarn überlagern.

**D3 Platz unten.** `.accent.bottom` sitzt mit `bottom: -0.35rem` unter der Zeile, gespiegelt zu oben. Eine Zeile mit Fuß-Markierung erhält die Klasse `has-foot-accent` und `margin-bottom: 0.35rem`, damit die Markierung nicht in die nächste Zeile ragt. Flache Zeilen blenden auch untere Markierungen aus und erhalten keinen zusätzlichen Abstand.
Alternative: allen Zeilen mehr Abstand geben. Verworfen, weil Songs ohne Fuß-Akzente sonst ohne Grund länger werden.

## Risks / Trade-offs

- [Ein Akzent ist auf der Doppelseite nicht sichtbar] → Gewollt; das Takt-Popover listet alle Akzente, die Wiedergabe spielt alle.
- [Zeilen mit Fuß-Markierung stehen etwas weiter auseinander] → Nur 0,35rem und nur dort, wo eine Markierung steht.
