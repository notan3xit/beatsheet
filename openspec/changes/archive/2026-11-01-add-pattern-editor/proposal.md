# Proposal

## Why

Drum-Charts schreiben Songs normalerweise komplett aus. Derselbe Groove taucht darin dutzendfach auf, und die eigentlich wichtigen Stellen (Fills, Akzente) gehen dabei unter. Das geplante Notenbuch trennt das „Was“ (Drum-Parts, je nur einmal notiert) vom „Wann“ (Song-Struktur). Dieser erste Change legt das Fundament: eine Pattern-Bibliothek mit Eingabe per Step-Sequencer, Darstellung als Drum-Noten und lokaler Speicherung. Das ist für sich schon nutzbar und klärt früh das größte technische Risiko, das Notenrendering.

## What Changes

- Neues Web-App-Gerüst (Single Page App), Eingabe am Computer
- Pattern-Bibliothek: Patterns vom Typ **Groove** oder **Fill** anlegen, benennen, duplizieren, löschen; jedes Pattern hat eine Länge in Beats
- Step-Sequencer-Editor: Schläge pro Instrument und Rasterposition setzen und entfernen; die Unterteilung ist **pro Beat** umschaltbar (Achtel, Sechzehntel, Achteltriolen, Sechzehnteltriolen)
- Darstellung jedes Patterns als Drum-Noten (Percussion-System, x-Notenköpfe für Becken, Triolenklammern, Hände und Füße als getrennte Stimmen)
- Local-first-Speicherung im Browser, Export und Import der Bibliothek als versionierte JSON-Datei (Grundlage für späteren Sync)

Nicht in diesem Change (folgt in `add-song-structure` bzw. später): Songs, Segmente, Bars, Platzierung von Fills und Akzenten in der Struktur, Reader-Ansicht für das Tablet, Offline/PWA-Installation, Druck/PDF, Sync-Server, Audio-Playback, andere Taktarten als Viertel-Beats, Artikulationen (Ghost Notes, Akzente, offene Hi-Hat-Dynamik).

## Capabilities

### New Capabilities
- `pattern-library`: Verwaltung der Drum-Patterns (Groove/Fill, Name, Länge in Beats), also Anlegen, Bearbeiten der Metadaten, Duplizieren, Löschen, Auflisten
- `pattern-sequencer`: Bearbeiten des Inhalts eines Patterns im Step-Raster, Unterteilung pro Beat, Instrumentenset
- `drum-notation`: Darstellung eines Patterns als Drum-Noten nach gängiger Konvention
- `library-persistence`: Lokale, automatische Speicherung sowie Export/Import im versionierten Dateiformat

### Modified Capabilities

_Keine – es gibt noch keine Specs._

## Impact

- Neues Projekt-Setup (Build, Test-Runner, Abhängigkeiten); bisher existiert kein Code
- Neue Abhängigkeit auf eine Notenrendering-Bibliothek
- Das Dateiformat (`schemaVersion` 1) wird zum Vertrag für `add-song-structure` und einen späteren Sync-Server. Stabile IDs sind ab jetzt Pflicht.
