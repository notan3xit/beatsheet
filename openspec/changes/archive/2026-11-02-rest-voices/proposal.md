# Proposal

## Why

Hände und Füße werden als zwei unabhängige Stimmen notiert, und jede Stimme bekommt für jeden Beat ohne Schläge eine Viertelpause. Ein Groove nur mit Hi-Hats zeigt deshalb unter dem System eine Reihe von Bassdrum-Pausen, die nichts aussagen. Auch in Stimmen, die etwas spielen, stehen leere Beats als einzelne Viertelpausen da, wo gedruckte Noten eine Halbe oder Ganze setzen würden. Beides macht das Notenbild unruhiger als nötig, gerade in den verkleinerten Patternkarten.

## What Changes

- **Leere Stimme ohne Pausen:** Hat eine Stimme in einem Takt keinen Schlag, zeigt sie in diesem Takt keine Pausen. Die Zweistimmigkeit bleibt; die andere Stimme wird unverändert notiert.
- **Takt ohne Schläge:** Sind beide Stimmen eines Takts leer, zeigt die obere Stimme die Pausen mittig im System, wie bisher sichtbar.
- **Pausen zusammenfassen (nur volle 4-Beat-Takte):** Leere Beats 1+2 bzw. 3+4 werden zu einer Halben Pause; ein komplett leerer 4-Beat-Takt zeigt eine Ganze Pause. Leere Beats 2+3 bleiben zwei Viertelpausen, damit die Taktmitte sichtbar bleibt.
- **Unvollständige Takte** (Patternlänge kein Vielfaches von 4): keine Zusammenfassung, jeder leere Beat bekommt eine Viertelpause.
- Unverändert: Pausen innerhalb eines Beats (Lücke vor dem ersten Schlag), einschließlich punktierter Pausen, Notenwerte, Balken, Triolen.

Nicht enthalten: Pausen über Beatgrenzen innerhalb eines Beats zusammenfassen (z. B. Achtelpause am Beatende mit der folgenden Viertelpause), einstimmige Notation, Taktartangaben.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `drum-notation`: „Notenwerte und Pausen aus dem Raster“ regelt Pausen für leere Beats neu (leere Stimme ohne Pausen, Halbe und Ganze im 4-Beat-Takt, Viertel in unvollständigen Takten); „Leeres Pattern“ zeigt eine Ganze Pause pro vollem Takt bzw. Viertelpausen im unvollständigen Takt, nur in der oberen Stimme.
- `songbook-view`: „Patternseite“ beschreibt das leere Pattern nicht mehr als „eine Viertelpause pro Beat“, sondern verweist auf die Pausenregeln der Notation.

## Impact

- `src/notation/model.ts`: Pausen für leere Beats pro Takt statt pro Beat bestimmen; neue Dauern Halbe und Ganze
- `src/notation/render/vexflow.ts`: leere Stimme unsichtbar auffüllen (VexFlow verlangt volle Stimmen), Halbe/Ganze Pausen zeichnen, Ganze Pause mittig
- Tests: `src/notation/model.test.ts` „Leerer Beat für die Füße“ und „Neuer Groove“ sowie `src/ui/songbook.test.tsx` „Leerer Platzhalter“ prüfen die bisherigen Viertelpausen und werden an die geänderten Szenarien angepasst; neue Tests für Zusammenfassung und unvollständige Takte.
