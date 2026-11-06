# Design

## Context

Die Auswahl der Takte liegt als lokaler Zustand in `StructurePage` (`useStructureSelection`), die Karten rendert die Geschwisterkomponente `PatternPage`. Welcher Fill zu einem Takt gehört, berechnet `layoutStructure` intern in `fillInstances` und `fill.barIds`. Ein Klick außerhalb der Strukturseite hebt die Auswahl auf, außer auf Ziehquellen; `lock.tsx` macht Knöpfe ohne `data-read-safe` im gesperrten Song wirkungslos.

## Goals / Non-Goals

**Goals:**
- Links und Karten nutzen dieselbe Zuordnung Takt → Fill wie die Hervorhebung der Balken links.

**Non-Goals:**
- Zu einer hervorgehobenen Karte rollen, wenn sie außerhalb des sichtbaren Bereichs liegt.
- Karten für Ablegeziele beim Ziehen hervorheben.
- Die Auswahl über den Besuch im Pattern-Editor hinweg erhalten.

## Decisions

**D1: Auswahl wandert nach `Songbook`.** `Songbook` ruft `useStructureSelection` auf und reicht das Ergebnis an `StructurePage`, die daraus berechneten Patterns an `PatternPage`. Ein eigener Context wäre für genau eine Eltern-Kind-Beziehung zu viel. Das Aufheben der Auswahl (`useDismiss`, `onPagePointerDown`) bleibt in `StructurePage`.

**D2: Zuordnung als reine Funktion in `src/songbook/layout.ts`.** `selectedPatterns(song, barIds)` liefert `{ grooveId, fillId, patternIds }`: `grooveId` und `fillId` nur, wenn alle Takte dasselbe Pattern haben, `patternIds` als Vereinigung aller Grooves und Fills. Sie nutzt `fillInstances` und die `barIds`-Berechnung, die dafür aus `layoutStructure` herausgezogen wird. Die Chips bleiben unberührt: Sie zeigen, was am Takt selbst gesetzt ist, ein überdeckter Takt also „Kein Fill“ und zugleich „zum Fill“.

**D3: Links sind Knöpfe mit `data-read-safe`.** Wie Pfad und Pattern-Namen rufen sie `store.openPattern`. Echte Anker wären nur für „in neuem Tab öffnen“ nötig, das die Navigation bisher nirgends bietet. Die Beschriftung bleibt wie gewünscht klein, der Tooltip nennt den Patternnamen. Sie sehen aus wie der Pfad (`.breadcrumbs button`): gedämpfter Text, beim Überfahren Textfarbe und unterstrichen. So gibt es keinen zweiten Link-Stil und keine Akzentfarbe als Text.

**D4: Links stehen im Kopf des Popovers.** `.popover-head` ist schon eine Reihe und der einzige Abschnitt, den auch das gesperrte Popover zeigt. So bleibt es dort einzeilig und entsperrt ohne zusätzlichen Abschnitt. Die Reihe darf umbrechen.

**D5: Karten-Hervorhebung über `outline` und Füllung.** Ein zusätzlicher `border` würde die Breite ändern und die Karten im Fluss verschieben, `outline` nimmt keinen Platz ein. Die Füllung folgt `.item.highlighted`, abgeschwächt, damit die Noten lesbar bleiben.

## Risks / Trade-offs

- [Jede Auswahländerung rendert auch `PatternPage` neu] → `NotationView` zeichnet nur bei geändertem Pattern, Maß oder Breite neu; das wird bei der Umsetzung geprüft.
- [Links führen aus der Doppelseite heraus und beenden eine laufende Song-Wiedergabe] → Bestehendes Verhalten beim Verlassen der Doppelseite, ebenso wie beim Klick auf einen Pattern-Namen.
- [Hervorgehobene Karte kann außerhalb des sichtbaren Bereichs liegen] → Bewusst kein Rollen, weil das beim Auswählen die rechte Seite unruhig machen würde. Bei Bedarf eigener Change.
