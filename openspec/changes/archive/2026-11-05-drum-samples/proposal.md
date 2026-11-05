# Proposal

## Why

Der synthetisierte Klang ist auf Unterscheidbarkeit ausgelegt und klingt künstlich. Wer Grooves zum Üben nachhört, braucht den Klang eines echten Schlagzeugs. In der Klangprobe hat sich das freie DRSKit (CC BY 4.0) bewährt.

## What Changes

- Neuer Klang „DRSKit“: Aufnahmen eines akustischen Sets, je Instrument ein normaler und ein leiser Schlag. Ghost Notes und Flam-Vorschläge erklingen mit dem leisen Schlag.
- Der bisherige Synth bleibt als Klang „Synth“ erhalten.
- Das Menü bekommt einen Abschnitt „Klang“ mit der Wahl zwischen DRSKit und Synth. Die Wahl gilt pro Gerät und bleibt über einen Neustart erhalten. Vorgabe ist DRSKit.
- Die Aufnahmen laden nach dem Start der App im Hintergrund. Solange sie nicht bereit sind, spielt der Synth. Sind sie bereit, klingt der nächste Schlag schon mit DRSKit.
- Lassen sich die Aufnahmen auf einem Gerät nicht laden oder dekodieren, spielt dort der Synth, und das Menü zeigt bei DRSKit „auf diesem Gerät nicht verfügbar“.
- Das Menü nennt die Herkunft der Aufnahmen mit Lizenz.
- Die Anforderung, ohne Audiodateien auszukommen, entfällt.

Nicht enthalten: weitere Sets, mehrere Aufnahmen pro Anschlagstärke, Hall, ein Service Worker für Offline-Betrieb, eine Einstellungsseite.

## Capabilities

### New Capabilities

- `playback-sound`: Wahl des Klangs, Laden der Aufnahmen, Ersatz durch den Synth und Namensnennung.

### Modified Capabilities

- `pattern-playback`: Instrumente erklingen mit dem gewählten Klang statt ausschließlich synthetisch und ohne Audiodateien; Spielweisen und Abstoppen der offenen Hi-Hat gelten für beide Klänge.
- `app-header`: Das Menü enthält den Abschnitt „Klang“.

## Impact

- `src/audio`: neue Stimmen aus Aufnahmen, Laden mit Formatwahl, Umschalten zwischen Aufnahmen und Synth im Player
- `src/audio/samples/drs/`: Audiodateien (Opus und AAC, zusammen etwa 0,7 MB) mit Herkunftsnotiz
- `scripts/`: Skript, das die Einzelschläge aus dem DRSKit-Repository erzeugt (braucht `ffmpeg`, läuft nicht im Build)
- `src/ui/AppMenu.tsx`, `styles.css`: Abschnitt „Klang“ im Menü
- `server/static.ts`: Inhaltstypen für `.webm` und `.m4a`
- Größe von `dist` und damit des Pakets steigt um die Audiodateien

Keine Auswirkung auf Dateiformat, Song-Dokument, Abgleich und Server-API.
