# Proposal

## Why

Abspiel-Knöpfe sehen je nach Ansicht anders aus und heißen anders, und die Beschriftungen machen Kopfzeilen und Overlays unruhig. Der Knopf im Sequencer heißt „Abspielen“, obwohl er in Schleife spielt. Im Takt-Overlay stehen die Abspiel-Knöpfe weit unten, `-` und `+` rutschen mit der Anzahl der Patterns, und die Akzente nehmen unverhältnismäßig viel Platz ein.

## What Changes

- Abspiel-Knöpfe zeigen in der ganzen Anwendung nur noch eines von drei Symbolen: Abspielen, Wiederholen und Stoppen. Der Text steht im Tooltip und im zugänglichen Namen.
- Abspiel-Knöpfe tragen die Farbe der Wiedergabeposition als gedämpfte Fläche, statt der Akzentfarbe.
- Der Kopf der Doppelseite zeigt Abspielen, der Sequencer Wiederholen, Takt- und Segment-Overlay beide. Während der Wiedergabe zeigen Kopf und Sequencer Stoppen.
- Der zugängliche Name der Taste im Sequencer wird „In Schleife abspielen“.
- Das Takt-Overlay wird in getrennte Abschnitte gegliedert:
  - Titel und Abspiel-Knöpfe
  - Groove, Fill und Länge, jeweils mit `-` und `+` vorne in derselben Spalte
  - Akzente in einer Reihe, sofern genau ein Takt ausgewählt ist
  - Takt davor, Takt danach und Löschen
- Das Starten der Wiedergabe aus einem Overlay schließt es.
- Die Knöpfe in den Kopfzeilen sind so hoch wie die Abspiel-Taste, damit beim Entsperren nichts springt.
- Im Segment-Overlay stehen die Abspiel-Knöpfe ebenfalls ganz oben.
- Akzente werden kompakter: kleine Bedienelemente in einer Reihe, `+` statt „Akzent hinzufügen“, Chips als „1.1 Cr“.

Nicht enthalten: Änderungen daran, was und wie abgespielt wird, Neuaufteilung des Segment-Overlays jenseits der Abspiel-Knöpfe.

## Capabilities

### New Capabilities

- `playback-controls`: Einheitliche Symbole, Namen und Maße der Abspiel-Knöpfe in der ganzen Anwendung.

### Modified Capabilities

- `songbook-view`: Aufbau des Takt-Overlays, Lage der Abspiel-Knöpfe, Darstellung von `-`/`+` und Akzenten.
- `pattern-playback`: Zugänglicher Name der Taste im Pattern-Editor.
- `song-playback`: Name dieser Taste in einem Szenario.
- `song-lock`: Die Kopfzeile bleibt beim Entsperren gleich hoch.

## Impact

- `src/ui`: neuer `PlayButton`, `Songbook`, `playback`, `StructurePopovers`, `PatternChips`, `AccentEditor`, `styles.css`
- Tests: Namen der Taste im Pattern-Editor in `playback.test.tsx`, `songPlayback.test.tsx` und `songLock.test.tsx`; Abfrage der Popover-Knöpfe über den Text in `songLock.test.tsx`

Keine Auswirkung auf Datenmodell, Wiedergabe und Server.
