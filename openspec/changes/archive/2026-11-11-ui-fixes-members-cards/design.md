# Design

## Context

**Kürzel:** `.avatars:hover .avatar` setzt `--control-hover`; `.avatar.colored` überschreibt das für Kürzel mit Profil. Nur graue Kürzel (ohne Profil, „+n“) ändern sich daher beim Überfahren.

**Einladen:** `.member-invite` ist eine Flex-Zeile mit `align-items: end`. Das Feld erbt die Schrift von `.field` (0,8rem), der Knopf nicht. Gemessen in Headless-Chromium: Knopf 33,8 px, Feld 28,6 px hoch, unten bündig, oben 5 px versetzt; über drei Sekunden bleibt alles stehen. Das Nachrutschen tritt dort nicht auf. Bei artjom verursacht es der Passwortmanager (abgeschaltet rutscht nichts), wie zuvor im Anmeldedialog (header-cleanup D10): `.field` ist eine Flex-Spalte mit `gap`, ein eingefügtes Element bekommt dort einen eigenen Abstand, auch mit Höhe 0. Das Label wächst, und der unten ausgerichtete Knopf rutscht mit nach unten.

**Pattern-Karten:** `fitCard` in `src/notation/render/vexflow.ts` schneidet die `viewBox` auf `svg.getBBox()` zu und begrenzt die Unterkante auf `totalHeight` (Zeilen × `rowHeight` 130). VexFlow 5 zeichnet Notenköpfe, Schlüssel, Fähnchen und Triolenziffern als `<text>` in einer Notenschrift. Gemessen in Chromium: `getBBox` eines solchen `<text>` ist der Schriftkasten, 160 Einheiten hoch, weit über und unter dem sichtbaren Zeichen. Deshalb liegt die Oberkante zu hoch (Leerraum über der Sextole), und die Unterkante überschreitet immer `totalHeight` und wird dort abgeschnitten (Balken unter dem System fehlen).

## Goals / Non-Goals

**Goals:**
- Zuschnitt der Karten aus den sichtbaren Zeichen, für alle Elemente einschließlich der selbst gezeichneten Betonungen.
- Lage von „Einladen“ unabhängig von nachträglichen Änderungen der Feldhöhe.

**Non-Goals:**
- Hover-Effekt für die Kürzel; der Zeiger zeigt weiter an, dass sie klickbar sind.
- Zuschnitt im Pattern-Editor und in der Mini-Darstellung.

## Decisions

**D1 Kürzel ohne Hover.** Die Regel `.avatars:hover .avatar` entfällt, die Regel für farbige Kürzel heißt nur noch `.avatar.colored`. `.avatars` hat eine Klasse und bekommt daher keinen allgemeinen Hover der Buttons.
Alternative: einheitlicher Hover für alle Kürzel (z. B. Rahmen). Verworfen, weil die Kürzel wie bisher aussehen sollen.

**D2 Einladen-Formular ohne `gap`.** Feld und Knopf in `.member-invite` erhalten dieselbe feste Höhe und Schriftgröße; die Zeile bleibt unten ausgerichtet. Wie im Anmeldedialog sind `.member-invite .field` und sein Feld Blöcke mit festem Außenabstand am Feld statt `gap`; der Abstand zwischen Feld und Knopf steht als Außenabstand am Knopf statt als `gap` der Zeile. Ein eingefügtes leeres Element nimmt dann weder im Label noch in der Zeile Platz ein.
Alternative: `autocomplete="off"` oder Attribute gegen Passwortmanager. Verworfen, weil Manager solche Attribute oft übergehen.

**D3 Zuschnitt aus der Tinte.** `fitCard` bestimmt Ober- und Unterkante aus den Blattelementen des SVG: Pfade und Rechtecke über `getBBox`, `<text>` über die Grundlinie (`y`) und `actualBoundingBoxAscent`/`Descent` aus `measureText` eines Canvas mit Schrift und Größe des Elements. Die Unterkante ist nicht mehr auf `totalHeight` begrenzt; die `viewBox` darf über die von `renderer.resize` gesetzte Fläche hinausgehen. Rand bleibt `CARD_TRIM_MARGIN`.
Ist die Notenschrift beim Zeichnen noch nicht geladen (`document.fonts.check`), wird nach `document.fonts.load` erneut zugeschnitten. Ohne `getBBox` oder Canvas (jsdom) bleibt die volle Höhe.
Alternative: Begrenzungen aus VexFlow (`getBoundingBox` je Note, Balken, Klammern). Verworfen, weil jede Elementart einzeln behandelt werden müsste und die eigenen Betonungen und Choke-Punkte fehlen.
Alternative: festen Zuschlag unten und Abzug oben. Verworfen, weil der Schriftkasten je nach Zeichen unterschiedlich weit übersteht.

**D4 Zeilenabstand.** Bleibt `rowHeight` 130. Zeigt die Prüfung im Browser, dass Balken unter einer Zeile in die nächste ragen, wird `CARD.rowHeight` erhöht.

## Risks / Trade-offs

- [Ein eingefügtes Element mit eigener Höhe verschiebt weiterhin] → Die Browser-Prüfung fügt leere Elemente ein wie ein Passwortmanager; artjom prüft mit seinem.
- [Canvas misst mit Ersatzschrift, solange die Notenschrift lädt] → erneuter Zuschnitt nach dem Laden (D3).
- [Karten werden höher, wo bisher abgeschnitten wurde] → Gewollt; die Spalten fließen ohnehin nach Inhalt.
