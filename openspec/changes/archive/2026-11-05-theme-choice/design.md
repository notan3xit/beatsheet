# Design

## Context

`installTheme` (`src/ui/theme.ts`) schreibt vor dem ersten Rendern ein `<style>` mit `:root` (Latte) und `@media (prefers-color-scheme: dark) { :root { … } }` (Mocha). `styles.css` hat einen eigenen Dunkel-Block in derselben Media Query für Tokens, die je Variante anders gemischt werden (`--accent-fill-mix`, `--backdrop` u. a.). Kein Code liest Farben per JavaScript. Die Klangwahl aus `drum-samples` liegt in `src/audio/soundSetting.ts` (`localStorage['beatsheet.sound']`, `get`/`set`/`subscribe`), der Menüabschnitt „Klang“ in `AppMenu` (`SoundChoice`, design.md D7 von `drum-samples`). jsdom kennt kein `matchMedia`.

## Goals / Non-Goals

**Goals:**
- Ein Schalter für alle dunklen Werte, ohne doppelte CSS-Blöcke.
- Gewählte Variante vor dem ersten Rendern gesetzt, damit nichts aufblitzt.
- Wahl, Systemeinstellung und Anwenden ohne Browser testbar.

**Non-Goals:**
- Weitere Varianten (Frappé, Macchiato).
- Farbschema für die Mails des Servers.

## Decisions

### D1: Attribut `data-theme` am Wurzelelement

`theme.ts` erzeugt `:root { color-scheme: light; …Latte }` und `:root[data-theme='dark'] { color-scheme: dark; …Mocha }`; der Dunkel-Block in `styles.css` wird zu `:root[data-theme='dark'] { … }`. Das Attribut trägt immer die aufgelöste Variante (`light` oder `dark`), auch bei „Wie System“.

`connectTheme(setting, root, media)` setzt das Attribut sofort und bei jeder Änderung der Wahl (`setting.subscribe`) oder der Systemeinstellung (`media` mit `matches` und `change`-Ereignis, im Browser `matchMedia('(prefers-color-scheme: dark)')`). Aufgelöst wird mit der reinen Funktion `resolveTheme(choice, systemDark)`.

Alternative: Media Query behalten und mit `:root:not([data-theme='light'])` plus `:root[data-theme='dark']` überschreiben. Verworfen: Jeder Dunkel-Block stünde zweimal im CSS, und `styles.test.ts` müsste beide Fassungen gleich halten. Ohne JavaScript läuft die App ohnehin nicht.

### D2: Allgemeine Geräte-Einstellung

`createDeviceSetting({ key, values, fallback }, storage)` in `src/state/deviceSetting.ts` übernimmt das Verhalten von `createSoundSetting`: lesen beim Erzeugen, unbekannte Werte als Vorgabe, Speicherfehler nur für die Sitzung, `get`/`set`/`subscribe`. `browserStorage` zieht mit um. `createSoundSetting` wird zum Aufruf mit `beatsheet.sound`; seine Tests bleiben unverändert grün.

Die Farbschema-Wahl ist `createDeviceSetting({ key: 'beatsheet.theme', values: ['system', 'light', 'dark'], fallback: 'system' }, storage)` als `createThemeSetting` in `theme.ts`.

Alternative: eine zweite Kopie von `soundSetting`. Verworfen: gleiche Fehlerbehandlung zweimal.

### D3: Anwenden vor dem ersten Rendern

`main.tsx` erzeugt die Wahl, ruft `installTheme()` und `connectTheme(theme, document.documentElement, matchMedia(…))` vor `createRoot` auf und gibt die Wahl an `App` (`theme`-Prop, Vorgabe wie bei `sound`: Wahl ohne Speicher). `App` stellt sie wie `SoundContext` über einen Kontext bereit. `localStorage` ist synchron, das Attribut steht also, bevor etwas gezeichnet wird.

### D4: Menüabschnitt

`SoundChoice` und der neue Abschnitt teilen sich `MenuChoice` in `AppMenu.tsx`: Gruppe mit `role="group"` und Überschrift, Einträge `role="menuitemradio"` mit `aria-checked` und Haken, Wählen schließt das Menü. Der Hinweis „auf diesem Gerät nicht verfügbar“ ist ein optionaler Zusatz einer Option, die Namensnennung von „Klang“ steht als zusätzlicher Inhalt in der Gruppe. Neuer Abschnitt zwischen Konto-Eintrag und „Klang“, je durch ein `<hr>` getrennt: Überschrift „Farbschema“, Einträge „Wie System“, „Hell“, „Dunkel“. Die vorhandenen Klassen `app-menu-heading` und `app-menu-check` werden genutzt, `app-menu-sound` wird zu `app-menu-choice`.

### D5: Tests

- `resolveTheme` und `connectTheme` mit einem Media-Nachbau (`matches`, `change` auslösbar) und einem Element: alle Szenarien von „Farbschema folgt der Systemeinstellung“, Abmelden der Listener.
- `theme.test.ts`: Latte in `:root`, Mocha in `:root[data-theme='dark']`, keine Media Query mehr; `styles.test.ts`: Dunkel-Tokens im selben Selektor.
- `deviceSetting.test.ts` für das allgemeine Verhalten; `soundSetting.test.ts` unverändert.
- `appMenu.test.tsx`: „Abschnitt Farbschema“, „Dunkel wählen“ (Markierung und `data-theme`), „Vorgabe“, „Wahl bleibt erhalten“ über einen gemeinsamen Speicher.

## Risks / Trade-offs

- [`matchMedia` fehlt (jsdom, sehr alte Browser)] → `connectTheme` behandelt fehlendes `media` wie hell.
- [Bestehende Tests prüfen die Media Query] → fachlich geändert (Wahl statt nur Systemeinstellung); die Spec ist zuerst angepasst, die Tests folgen ihr.
- [Abhängigkeit von `drum-samples`] → Umsetzung beginnt erst nach dessen Archivierung (Task 1.1).

## Migration Plan

Keine Datenmigration. Eine ältere Version ignoriert `beatsheet.theme` und folgt der Systemeinstellung.
