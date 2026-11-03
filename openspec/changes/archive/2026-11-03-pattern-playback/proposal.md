# Proposal

## Why

Ein Pattern lässt sich im Sequencer eingeben und als Notenbild prüfen, aber nicht anhören. Ob ein Groove oder Fill so klingt wie gemeint (Triolen, Ghost Notes, Flams, Hi-Hat offen/geschlossen), merkt man erst am Set. Eine Wiedergabe direkt im Pattern-Editor macht Eingabefehler sofort hörbar.

## What Changes

- **Wiedergabe im Pattern-Editor:** Eine Abspiel-/Stopp-Taste spielt das geöffnete Pattern als Audio ab, in einer Schleife bis zum Stopp. Jeder gesetzte Schlag erklingt an seiner zeitlichen Lage, auch bei gemischten Unterteilungen.
- **Synthetisierte Klänge:** Alle zehn Instrumente werden im Browser per Web Audio erzeugt (keine Audiodateien). Ghost Notes klingen leiser, Flams mit hörbarem Vorschlag; die offene Hi-Hat klingt nach und wird von geschlossener Hi-Hat oder Hi-Hat-Pedal abgestoppt.
- **Änderungen während der Wiedergabe:** Bearbeitet der Nutzer das Pattern während des Abspielens (Schlag setzen, Unterteilung, Länge, Rückgängig), ist die Änderung ohne Neustart beim nächsten Erreichen der Stelle hörbar.
- **Wiedergabeposition im Raster:** Die gerade erklingende Position wird im Sequencer hervorgehoben.
- **Tempo pro Song:** Jeder Song bekommt ein Tempo in BPM (ganzzahlig, 30 bis 300, Vorgabe 120). Es lässt sich im Pattern-Editor neben der Abspiel-Taste ändern, wird mit dem Song gespeichert, exportiert und importiert und gilt für alle Patterns des Songs.
- **Dateiformat bleibt bei Schemaversion 3:** Der Export enthält zusätzlich das Tempo jedes Songs. Fehlt es in einer Importdatei, gilt 120; Dateien der Schemaversion 2 und 3 bleiben unverändert importierbar.
- **Unbekannte Felder werden beim Import ignoriert** statt die Datei abzuweisen. Damit bleiben künftige Erweiterungen, die nur Felder hinzufügen, ohne neue Schemaversion lesbar, auch für ältere App-Versionen. Die Schemaversion steigt nur noch bei Änderungen, die eine ältere Version falsch lesen würde. Die heute ausgelieferte Version lehnt das neue Feld `tempo` noch ab; ab dieser Version gilt die Toleranz.
- **Stopp beim Verlassen:** Verlässt der Nutzer den Pattern-Editor oder wechselt das Pattern, endet die Wiedergabe.

Nicht enthalten: Wiedergabe eines ganzen Songs entlang seiner Struktur (Grooves, Fills, Akzente), Metronom/Vorzähler, Lautstärke je Instrument, Samples, Swing, Tastenkürzel für Start/Stopp, Anzeige des Tempos auf der Doppelseite.

## Capabilities

### New Capabilities
- `pattern-playback`: Audio-Wiedergabe des geöffneten Patterns im Pattern-Editor: Start/Stopp, Schleife, zeitliche Lage der Schläge, Klang der Instrumente und Spielweisen, Live-Änderungen, Wiedergabeposition, Tempo-Bedienung.

### Modified Capabilities
- `song-library`: neue Anforderung „Song-Tempo“ (Vorgabe 120 BPM, gültiger Bereich, Ablehnung ungültiger Werte, Änderung erhöht die Song-Revision).
- `library-persistence`: Export enthält das Tempo (Schemaversion bleibt 3); Songs ohne Tempo werden mit 120 importiert; unbekannte Felder werden ignoriert; ungültiges Tempo führt zur Abweisung; lokal gespeicherte Songs ohne Tempo laden mit 120.

## Impact

- Neu `src/domain/playback.ts`: reine Funktionen für den Zeitplan eines Patterns (Schläge → Zeitpunkte in Beats, Lautstärke, Flam-Vorschlag, Hi-Hat-Abstoppen) und Tempo-Regeln (`setTempo`, Grenzen, Vorgabe)
- Neu `src/audio/`: Web-Audio-Synthese der Instrumente und ein vorausplanender Abspieler (Lookahead-Scheduler); einzige Stelle mit `AudioContext`
- `src/domain/types.ts`: `Song.tempo: number`; `createSong`, `songFromV1Patterns` und der Import (Tempo fehlt) setzen 120
- `src/persistence/repository.ts`: beim Laden aus IndexedDB fehlendes Tempo mit 120 ergänzen (ohne Revision, ohne Rückschreiben)
- `src/persistence/fileFormat.ts`: optionales Feld `tempo` im Song-Schema (Vorgabe 120), Schemata ohne `.strict()` (unbekannte Felder werden entfernt statt abgewiesen), Schemaversion bleibt 3
- `src/ui/PatternEditor.tsx`, `src/ui/Sequencer.tsx`, `src/ui/styles.css`: Abspiel-Taste, Tempo-Feld, Hervorhebung der Wiedergabeposition (Farbe über semantisches Token)
- Tests: neue Tests für den Zeitplan, die Tempo-Regeln, den Abspieler (mit nachgebildetem `AudioContext`) und die UI; in `fileFormat.test.ts` wird der Test „Export herunterladen“ um den Schlüssel `tempo` ergänzt (geänderte Anforderung)
- Test-Hilfen (`src/test/songs.ts`) bekommen das Tempo 120 als Vorgabe
- `AGENTS.md`: Regel für Formaterweiterungen (additiv ohne Versionssprung)
- Keine neue Abhängigkeit; die IndexedDB-Version bleibt unverändert
