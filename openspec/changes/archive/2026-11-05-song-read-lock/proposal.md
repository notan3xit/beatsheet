# Proposal

## Why

Beim Lesen und Mitspielen genügt ein Fehlklick, um einen Song zu ändern, in einem Workbook auch für alle Mitglieder. Songs werden meist gelesen und selten bearbeitet, deshalb soll Bearbeiten ein bewusster Schritt sein.

## What Changes

- Doppelseite und Pattern-Editor zeigen oben ein Schloss, das für den ganzen Song gilt.
- Ein Song öffnet gesperrt. Ein Song ohne Segmente und ohne Patterns öffnet entsperrt, weil es dort nur etwas anzulegen gibt.
- Gesperrt lässt sich der Song ansehen und abspielen, aber nicht ändern:
  - Titel, Tempo, Name, Länge und Unterteilung erscheinen als Text.
  - Aktionen zum Einfügen, Löschen, Duplizieren und Rückgängigmachen, „+ Groove“, „+ Fill“ und das Ziehen von Patterns entfallen.
  - Takte und Segmente bleiben auswählbar, ihr Popover bietet nur die Abspiel-Aktionen.
  - Der Pattern-Editor zeigt den Sequencer weiter, seine Zellen reagieren aber nicht.
- Der Sperrzustand gilt nur lokal im Tab. Er wird nicht gespeichert und nicht abgeglichen.
- Beim Entsperren springt nichts: Werte behalten Text und Platz und werden nur zu Bedienelementen. Der Hinweis „gilt für alle Patterns …“ entfällt.
- Pfad und Überschrift stehen auf der Doppelseite und im Pattern-Editor auf derselben Höhe.

Nicht enthalten: Übungstempo, Berechtigungen und Rollen, Änderungen an Song-Liste und App-Kopfzeile.

## Capabilities

### New Capabilities

- `song-lock`: Schloss eines geöffneten Songs, Sperrzustand beim Öffnen und was gesperrt möglich ist.

### Modified Capabilities

- `songbook-view`: Das Bearbeiten über Pattern-Editor und Auswahl setzt einen entsperrten Song voraus, ebenso „Erstes Segment anlegen“.
- `navigation`: Überschriften sind nur bei entsperrtem Song editierbar; gleiche Höhe der Kopfzeile in beiden Ansichten.
- `song-library`: Beim Bearbeiten der Tempoangabe wird nur die Zahl zum Feld, auf ihrem Platz.
- `pattern-playback`: Tempo im Pattern-Editor als „♩ = <BPM> (Song-Tempo)“, bedient wie auf der Doppelseite, ohne Hinweis am Feld.

## Impact

- `src/state/notebookStore.ts`: Sperrzustand neben dem geöffneten Song
- `src/ui`: `Songbook`, `StructurePage`, `StructurePopovers`, `PatternPage`, `PatternEditor`, `Sequencer`, `TempoMark`, `EditableHeading`, `playback`, `styles.css`
- Tests: `src/test/notebook.ts` und Tests, die Songs direkt oder über die Oberfläche öffnen und danach bearbeiten

Keine Auswirkung auf Dateiformat, Song-Dokument und Server.
