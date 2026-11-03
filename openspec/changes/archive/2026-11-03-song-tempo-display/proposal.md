# Proposal

## Why

Das Tempo gehört zum Song, lässt sich aber nur im Pattern-Editor eines Grooves oder Fills einstellen und ist dort als „Tempo (BPM)“ beschriftet. Dadurch wirkt es wie eine Eigenschaft des Patterns: Wer es bei „Verse“ ändert, ändert unbemerkt auch „Chorus“. Auf der Doppelseite, wo der Song als Ganzes zu sehen ist, taucht das Tempo gar nicht auf.

## What Changes

- **Tempo auf der Doppelseite:** Im Kopf der Doppelseite steht neben dem Songtitel eine Tempoangabe in Notenschreibweise („♩ = 120“). Ein Klick verwandelt sie in ein Zahlenfeld; Enter oder Verlassen übernimmt, Escape verwirft, ein ungültiger Wert lässt das bisherige Tempo stehen. Das Verhalten entspricht dem des editierbaren Songtitels daneben.
- **Kennzeichnung im Pattern-Editor:** Das Tempo-Feld bleibt im Pattern-Editor einstellbar, heißt aber „Song-Tempo (BPM)“. Ein Hinweis darunter nennt den Song: „gilt für alle Patterns von „<Songtitel>““.
- Datenmodell, Dateiformat und Speicherung bleiben unverändert; es gibt weiterhin genau ein Tempo pro Song.

Nicht enthalten: Tempo in der Song-Liste, abweichende Tempi für Segmente, Takte oder Patterns, Tempowechsel innerhalb eines Songs.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `song-library`: neue Anforderung „Tempo auf der Doppelseite“ (Anzeige als Tempoangabe, Bearbeiten an Ort und Stelle).
- `pattern-playback`: Anforderung „Tempo im Pattern-Editor“ verlangt die Beschriftung als Song-Tempo und den Hinweis auf den Song.

## Impact

- `src/ui/Songbook.tsx` (`SongHeader`): Tempoangabe neben dem Titel
- Neue Komponente für die Tempoangabe (Anzeige ↔ Zahlenfeld), gemeinsame Übernahme-Logik mit dem Feld im Pattern-Editor
- `src/ui/playback.tsx` (`Transport`/`TempoField`): Beschriftung „Song-Tempo (BPM)“ und Hinweis mit Songtitel
- `src/ui/styles.css`: Darstellung der Tempoangabe (nur semantische Tokens)
- Tests: neue UI-Tests für die Doppelseite; in `src/ui/playback.test.tsx` ändert sich die Beschriftung des Felds (geänderte Anforderung)
