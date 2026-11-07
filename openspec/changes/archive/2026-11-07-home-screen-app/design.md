# Design

## Context

`index.html` enthält nur `viewport` und `title`; `public/` gibt es nicht. Das Logo liegt als SVG in `src/ui/Logo.tsx`, seine Farben als Tokens im CSS. Dateien aus `public/` landen im Wurzelverzeichnis von `dist`, das der Server mit `no-cache` ausliefert. Routen stehen im Hash, die Startadresse ist daher immer `/`. Motivation: siehe proposal.md.

## Goals / Non-Goals

**Goals:**
- Eigenes Fenster, Name und Icon auf iPadOS und in Chromium-Browsern.

**Non-Goals:**
- Service Worker und Start ohne Netz.
- Eigene Installationsaufforderung, eigene Zurück-Bedienung im Fenster.
- `viewport-fit=cover`: Die App bleibt innerhalb des sicheren Bereichs, Änderungen am Layout entfallen.

## Decisions

### D1: Manifest als `public/manifest.json`

Felder: `id`, `start_url` und `scope` jeweils `/`, `display: standalone`, `name` und `short_name`, `lang: de`, `theme_color`, `background_color`, `icons`. Die Endung `.json` statt `.webmanifest`, weil der Server dafür schon den passenden Typ kennt.

### D2: Apple-Tags zusätzlich zum Manifest

`index.html` erhält `link rel="manifest"`, `link rel="apple-touch-icon"`, `meta name="apple-mobile-web-app-capable"`, `mobile-web-app-capable` und `apple-mobile-web-app-title`. iOS liest das Icon zuverlässig nur aus `apple-touch-icon`, die Meta-Tags decken ältere Versionen ab. `apple-mobile-web-app-status-bar-style` bleibt `default`, damit die Leiste den Inhalt nicht überlagert.

### D3: Icons als fertige PNGs

`public/icons/icon.svg` ist die Vorlage: das Symbol aus `Logo.tsx` mit aufgelösten Latte-Farben auf deckendem Hintergrund `base`. Das Symbol liegt innerhalb des inneren Kreises mit 80 % des Durchmessers, damit es Maskierung übersteht. Daraus entstehen `apple-touch-icon.png` (180), `icon-192.png` und `icon-512.png`; das Manifest führt `icon-512.png` zusätzlich mit `purpose: maskable`.

Die PNGs werden einmalig mit einem beliebigen SVG-Renderer erzeugt und eingecheckt, sie ändern sich nur mit dem Logo.

Alternative: Erzeugen beim Build. Verworfen: Das brächte eine Abhängigkeit in den Build für Dateien, die sich fast nie ändern.

Alternative: Dunkles Icon bei dunkler Einstellung. Verworfen: iOS 17 kennt nur ein Icon.

### D4: Farben

`theme-color` steht als Startwert zweimal in `index.html`, je mit `media="(prefers-color-scheme: ...)"`, mit `mantle` aus Latte und Mocha, der Fläche der Kopfzeile (`--surface`). Das Manifest kennt nur einen Wert und nutzt Latte, `background_color` ist `base`. Ein Test gleicht die Werte mit `@catppuccin/palette` ab, weil Manifest und HTML keine Tokens kennen.

`connectTheme` löst das Farbschema schon bei jeder Änderung von Wahl und Systemeinstellung auf. Es setzt dabei zusätzlich `content` beider Tags auf `mantle` des aufgelösten Schemas. Die Tags bleiben bestehen, damit nicht beim Laden erst eines entfernt und ein anderes angelegt werden muss, und ihr `media` spielt danach keine Rolle mehr, weil beide denselben Wert tragen.

Alternative: Farbe nur nach Systemeinstellung. Verworfen: Wer im Menü bewusst vom System abweicht, sähe eine Leiste im anderen Schema.

Grenze: Bis das JavaScript läuft, gilt der Startwert nach Systemeinstellung. Ob iOS die Farbe im eigenen Fenster für die Statusleiste nutzt, zeigt erst die Prüfung auf dem iPad.

## Risks / Trade-offs

- [Getrennter Speicher: Die installierte App sieht auf iOS lokale Songs aus Safari vermutlich nicht. Die Anmeldung kam dagegen auf dem iPad mit, dort war die App nach dem Einrichten angemeldet] → Songs vorher im Konto abgleichen oder exportieren. Die App merkt davon nichts und braucht keine Änderung.
- [Export über Blob-Link kann im eigenen Fenster versagen; Berichte dazu betreffen ältere iOS-Versionen] → Prüfung auf dem iPad nach dem Veröffentlichen. Versagt er, folgt ein eigener Change.
- [`persist()` kann auch installiert `false` liefern] → Der Speicher-Hinweis bleibt dann wie bisher; das ist die offene Prüfung, kein Fehler dieses Changes.
- [Ohne Netz zeigt das eigene Fenster nur eine Fehlerseite] → Bekannte Grenze dieser Stufe.
- [Einladungslinks aus Mails öffnen den Browser statt der App] → Vom System vorgegeben.
