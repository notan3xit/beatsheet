# Proposal

## Why

Drei Darstellungsfehler: Beim Überfahren der Mitglieder-Kürzel eines Workbooks werden nur die grauen Kreise dunkler. Im Mitglieder-Popover rutscht „Einladen“ kurz nach dem Öffnen nach unten. Auf der Patternseite schneidet die Karte manche Noten unten ab und lässt bei anderen oben viel Leerraum.

## What Changes

- Die Kürzel im Kopf eines Workbooks behalten beim Überfahren ihre Fläche, die grauen wie die farbigen und „+n“.
- Im Formular „Hinzufügen“ sind Feld und „Einladen“ gleich hoch und stehen auf einer Linie; die Lage des Knopfs hängt nicht davon ab, was der Browser nachträglich am Feld ändert.
- Die Höhe einer Pattern-Karte folgt den sichtbaren Zeichen des Notenbilds: Unten wird nichts abgeschnitten, oben und unten bleibt nur ein schmaler Rand.

## Capabilities

### New Capabilities

### Modified Capabilities
- `workbooks`: neue Anforderungen „Kürzel beim Überfahren“ und „Einladen-Formular steht fest“.
- `songbook-view`: neue Anforderung „Höhe des Notenbilds der Pattern-Karte“.

## Impact

- `src/ui/styles.css` (`.avatars`, `.member-invite`), `src/ui/WorkbookCard.tsx`
- `src/notation/render/vexflow.ts` (`fitCard`)
- Keine Änderung an Datenmodell, Dateiformat, Abgleich oder Server
