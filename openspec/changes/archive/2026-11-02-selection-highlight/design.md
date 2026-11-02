# Design

## Context

`StructureRow` (`src/ui/StructurePage.tsx`) zeichnet je Takt einen unsichtbaren Knopf `.bar-frame` (Auswahl per Klick, `aria-pressed`, Klasse `drop-target`) und darüber die Balken aus dem Layout (`GrooveItem` und `EmptyItem` mit `barId`, `FillItem` ohne Takt-ID, `pointer-events: none`). Die Markierung steckt heute im CSS von `.bar-frame[aria-pressed='true']` bzw. `.drop-target` (Rahmen + Tönung in `--accent`). Chips markieren `aria-pressed='true'` mit einem `--accent`-Ring.

## Goals / Non-Goals

**Goals:**
- Hervorhebung an den Balken selbst (Mock-up Variante E), gleich für Auswahl und Ablegeziel.
- Bedienung und Semantik der Takt-Knöpfe unverändert (`aria-pressed`, `drop-target` bleiben, nur ohne eigenes Aussehen).

**Non-Goals:**
- Unterscheidung zwischen Auswahl und Ablegeziel im Aussehen.
- Segmentauswahl (`.segment-select`) umgestalten.

## Decisions

### D1: Hervorgehobene Takte als Menge

`StructureRow` bildet `highlighted = ausgewählte Takte ∪ dropTargets` und gibt `highlighted.has(...)` an `RowItem` weiter. Groove- und leere Balken nutzen ihre `barId`.

### D2: Zuordnung der Fills

`FillItem` erhält `barIds: string[]`: den Takt, zu dem der Fill gehört (der Takt, an dessen Ende er endet, also `start + beats === fill.end`), und alle Takte, die er vollständig überdeckt (`start >= fill.start && start + beats <= fill.end`). Ein Fill ist hervorgehoben, wenn einer dieser Takte hervorgehoben ist. So bleibt auch ein ganz überdeckter Takt sichtbar markiert, obwohl er keinen eigenen Groove-Balken hat. Ein Takt, in den ein Fill nur teilweise hineinreicht, hebt nur seinen Groove-Teil hervor.

### D3: Darstellung

- Klasse `.item.highlighted`: `border: 2px solid var(--pc)` (statt nur links), Füllung `color-mix(var(--pc) 42%)`, bei Fills 62 %, Name `font-weight: 600`.
- Leerer Takt: `EmptyItem` wird bei Hervorhebung als `.item.ghost` gezeichnet: Rahmen `2px solid` in `--muted`-naher Graustufe, Füllung `color-mix(… 14%)`, gleiche Einrückung wie ein Groove-Balken. Neues Token `--ghost: var(--ctp-overlay0)`.
- `.bar-frame[aria-pressed='true']` und `.bar-frame.drop-target` verlieren Rahmen und Tönung.
- Chips: `.chip[aria-pressed='true']` gefüllt mit `var(--pc)`, Text `--on-accent` (Catppuccin `base`: hell auf den kräftigen Latte-Farben, dunkel auf den Mocha-Pastellfarben), ohne Outline; im gewählten Chip ein `<span class="chip-check" aria-hidden="true">✓</span>` vor dem Namen. „kein“ gewählt: Füllung `--text`, Text `--bg`.

Alternative: Rahmen um die Takte als eigene, zusammenhängende Form (Varianten A–D im Mock-up). Verworfen zugunsten von E (Nutzerentscheidung): weniger Schichten, passt zur Formensprache der Balken, Farbe ergibt sich von selbst.

## Risks / Trade-offs

- [Helle Patternfarben (Yellow, Rosewater) im Hellmodus: gefüllter Chip mit hellem Text schlecht lesbar] → Im Browser mit Yellow und Rosewater prüfen; reicht der Kontrast nicht, für diese Farben auf `--text` ausweichen.
- [Auswahl und Ablegeziel sehen gleich aus] → bewusst; beim Ziehen über die Auswahl landet das Pattern ohnehin auf allen markierten Takten.

## Ergebnis der Browser-Prüfung

Am 2026-11-02 vom Nutzer im Release-Build (pub) geprüft und freigegeben. Die gestrichelten Fortsetzungskanten eines Fills über einen Zeilenumbruch bleiben auch im hervorgehobenen Zustand gestrichelt (bestehende Markierung „geht weiter“, nicht Teil der Hervorhebung).
