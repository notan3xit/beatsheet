# Proposal

## Why

Der Pattern-Editor spielt nur in Schleife, der Kopf der Doppelseite nur einmal; wer einen Fill einmal hören oder den ganzen Song durchlaufen lassen will, kann das nicht. Zum Üben fehlt außerdem ein langsameres Abspielen, ohne das gespeicherte Song-Tempo zu verstellen und ohne es zum normalen Hören wieder zurückdrehen zu müssen.

## What Changes

- Die Köpfe von Doppelseite und Pattern-Editor bieten je zwei Abspiel-Knöpfe: einmal abspielen und in Schleife abspielen, für den Song wie für Grooves und Fills.
- Während der Wiedergabe wird der laufende Knopf zu Stopp; der andere erscheint grau, bleibt bedienbar und wechselt den Modus ohne Neustart.
- Gleiche Anordnung in beiden Köpfen: Song-Tempo, Abspiel-Knöpfe, Übetempo. Im Pattern-Editor rückt das Song-Tempo dafür vor die Abspiel-Knöpfe.
- Neu: Übetempo. Ein Schalter „Üben“ lässt jede Wiedergabe des Songs im Übetempo statt im Song-Tempo laufen, auch während sie läuft. Der Wert in BPM ist per Klick und über −/+ in 5er-Schritten änderbar und unabhängig vom Song-Tempo; auf schmalen Bildschirmen ohne −/+.
- Der Wert gilt pro Gerät und Song und bleibt über Sitzungen erhalten; ohne gespeicherten Wert gilt 75 % des Song-Tempos, auf 5 gerundet. Der Schalter gilt pro Song bis zum Neuladen. Beides ändert den Song nicht und ist auch im gesperrten Song bedienbar.
- Starten aus Takt- oder Segment-Popover schließt das Popover, lässt die Auswahl aber bestehen; ein Klick auf die Auswahl öffnet es wieder. Weicht die Auswahl danach vom Bereich einer laufenden Schleife ab, sind dessen Takte grau markiert.
- Mit Auswahl spielen die Kopfknöpfe der Doppelseite die Auswahl („Ab Auswahl abspielen“, „Auswahl in Schleife abspielen“); Abspiel-Knöpfe und Übetempo im Kopf heben die Auswahl nicht auf.
- Keine Tastenkürzel.

## Capabilities

### New Capabilities
- `practice-tempo`: Übetempo eines Songs: Schalter, Wert, Grenzen, Wirkung auf die Wiedergabe, Speicherung pro Gerät.

### Modified Capabilities
- `pattern-playback`: Einmaliges Abspielen neben der Schleife; Namen der Knöpfe.
- `song-playback`: Ganzen Song in Schleife abspielen; Kopfknöpfe spielen die Auswahl; graue Markierung einer laufenden Teil-Schleife.
- `songbook-view`: Bedienung von Abspiel-Knöpfen und Übetempo im Kopf hebt die Auswahl nicht auf.
- `playback-controls`: Zwei Knöpfe in beiden Köpfen, grauer nicht laufender Knopf, gleiche Anordnung in beiden Köpfen; Auswahl bleibt beim Start aus dem Popover.

## Impact

- `src/audio/scheduler.ts`: Schleife während der Wiedergabe umschaltbar, auch kurz vor dem Ende eines einmaligen Durchlaufs.
- `src/ui/playback.tsx`, `PlayButton.tsx`, `Songbook.tsx`, `PatternEditor.tsx`: Transport mit zwei Knöpfen, Tempo der Wiedergabe aus Song-Tempo und Übetempo.
- Neues reines Modul für Vorgabe und Grenzen des Übetempos; Speicherung im lokalen Speicher des Browsers neben den bestehenden Geräte-Einstellungen.
- `src/ui/styles.css`: grauer Abspiel-Knopf, Übetempo-Steuerung; Farbpaare nach `design-system`.
- Song-Dokument, Dateiformat, Server und Abgleich bleiben unverändert.
