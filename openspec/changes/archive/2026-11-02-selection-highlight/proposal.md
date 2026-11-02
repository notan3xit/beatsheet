# Proposal

## Why

Ausgewählte Takte und Ablegeziele beim Ziehen werden heute mit einem dicken orangen Rahmen pro Takt markiert. Bei mehreren Takten entsteht ein Gitter aus Kästchen mit doppelten Linien, die Groove-Balken schneiden den Rahmen an, und das Orange beißt sich mit den Patternfarben. Gewählte Chips im Popover tragen einen orangen Ring um ihre eigene Farbe. Das wirkt grob. Im Mock-up (https://pub.artjomweyand.de/drumstuff-mockups/auswahl.html, Variante E) hat der Nutzer stattdessen gewählt, die Elemente selbst hervorzuheben.

## What Changes

- **Takte:** Ein ausgewählter Takt zeigt keinen eigenen Rahmen mehr. Stattdessen werden seine Groove- und Fill-Balken hervorgehoben: voller Rahmen in ihrer Patternfarbe, kräftigere Füllung, fetter Name.
- **Leerer Takt:** Ein ausgewählter Takt ohne Groove zeigt einen grauen „Schatten-Groove“ mit durchgehender Umrandung in der Größe eines Groove-Balkens.
- **Ablegeziele** beim Ziehen werden genauso hervorgehoben wie die Auswahl. Gestrichelte Linien entfallen.
- **Chips:** Ein gewählter Chip ist in seiner Patternfarbe gefüllt und zeigt einen Haken; der orange Ring entfällt. „kein“ erscheint gewählt in der Textfarbe gefüllt.
- Orange (`--accent`) bleibt für Hauptknöpfe, Sequencer und das Feld beim Umbenennen.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `songbook-view`: neue Anforderung „Hervorhebung von Auswahl und Ablegeziel“; „Pattern-Chips“ legt fest, wie ein gewählter Chip erscheint.

## Impact

- `src/songbook/layout.ts`: `FillItem` erhält die IDs der Takte, zu denen der Fill gehört bzw. die er vollständig überdeckt
- `src/ui/StructurePage.tsx`: hervorgehobene Takte (Auswahl ∪ Ablegeziele) an die Balken weiterreichen, Schatten-Groove für leere Takte
- `src/ui/PatternChips.tsx`: Haken im gewählten Chip
- `src/ui/styles.css`: neue Klassen, alte Rahmenregeln für `.bar-frame` und `.chip[aria-pressed]` entfallen (nur Tokens)
- Tests: neue Tests; bestehende Tests prüfen `aria-pressed` und die Klasse `drop-target` an den Takt-Knöpfen, beides bleibt erhalten
