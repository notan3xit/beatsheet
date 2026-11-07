# Proposal

## Why

Auf dem iPad lässt sich Beatsheet nur als Safari-Tab sinnvoll nutzen: Zum Home-Bildschirm hinzugefügt, fehlen eigenes Fenster und Icon. Außerdem nennt WebKit den Start vom Home-Bildschirm als Kriterium für dauerhaften Speicher, den Safari im Tab bisher verweigert.

## What Changes

- Die App lässt sich zum Home-Bildschirm hinzufügen und startet dort in einem eigenen Fenster mit Name und Icon.
- Die Farbe der Systemleiste passt zur Kopfzeile und folgt der Wahl des Farbschemas im Menü.

Nicht enthalten: Start ohne Netz (Service Worker, Anmeldestatus ohne Server), Änderungen am Speicher-Hinweis und eine Aufforderung zum Installieren in der App. Über den Speicher-Hinweis entscheidet die Prüfung auf dem iPad.

## Capabilities

### New Capabilities

- `home-screen-app`: App auf dem Home-Bildschirm mit Name, Icon und eigenem Fenster

### Modified Capabilities

## Impact

- `index.html`: Verweise auf Manifest und Icon, Meta-Tags
- `src/ui/theme.ts`: `connectTheme` setzt auch die Farbe der Systemleiste
- `public/`: neu, mit `manifest.json`, Icons und ihrer SVG-Vorlage
- Neue Tests, keine neue Abhängigkeit
- Server: keine Änderung, er liefert `.json` und `.png` bereits mit passendem Typ aus
