# Proposal

## Why

Ein Fill erscheint in der Song-Struktur als farbiger Block mit seinem Namen. Bei 1–2 Beats ist für den Namen kaum Platz, und der Name sagt beim Spielen wenig darüber, wie der Fill aufgebaut ist. Auf Papier nutzt der Nutzer eine kompakte Buchstaben-Schreibweise (k, s, v, t, f, '), die an den Aufbau erinnert, ohne alles zu kodieren. Echte Noten passen nicht in eine Strukturzeile (eine frühere Mini-Notation wurde deshalb entfernt). Ein Mock-up (https://pub.artjomweyand.de/drumstuff-mockups/fill-kurzschrift.html, Variante V2) hat die Darstellung bestätigt.

## What Changes

- **Kurzschrift statt Name:** Ein Fill-Block zeigt eine automatisch aus dem Fill-Pattern erzeugte Buchstaben-Kurzschrift; der Name ist nur noch als Tooltip verfügbar.
- **Buchstaben und Höhenstufen:** oben `'` (Crash), `t` (Tom 1, Tom 2); Mitte `v` (Snare mit Flam), `s` (Snare); unten `f` (Floor Tom), `k` (Kick). Hi-Hat, Ride, Hi-Hat-Pedal und Ghost Notes entfallen. Pro Zeitpunkt und Stufe steht höchstens ein Buchstabe, nach der Priorität `'` vor `t`, `v` vor `s`, `f` vor `k`.
- **Position:** Jeder Buchstabe steht maßstabsgetreu an seinem Zeitpunkt, mittig auf seinem Rasterplatz. Die oberste und unterste Stufe ragen über bzw. unter den Block hinaus.
- **Abschnitte:** Ist ein Fill abgeschnitten oder über einen Zeilenumbruch geteilt, zeigt jeder sichtbare Abschnitt die Buchstaben seines Zeitraums.

Nicht enthalten: manuelle Kurzschrift pro Fill, Feinabstimmung an echten Fills (folgt nach Erfahrung), Kurzschrift für Grooves.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `songbook-view`: „Fill-Blöcke“ zeigt Kurzschrift statt Name (Name als Tooltip) und keine Noten; neue Anforderung „Fill-Kurzschrift“ (Buchstaben, Höhenstufen, Weglassen, Priorität, Position).

## Impact

- Neu `src/notation/shorthand.ts`: reine Funktion Pattern → Kurzschrift-Zeichen (Zeit, Rasterbreite, Stufe, Buchstabe)
- `src/songbook/layout.ts`: Fill-Instanzen kennen ihren Versatz im Pattern; `FillItem` erhält die Zeichen seines sichtbaren Abschnitts
- `src/ui/StructurePage.tsx` (`FillBlock`), `src/ui/styles.css`: Darstellung der Buchstaben, Name als `title`
- Tests: neue Tests für `shorthand.ts`, Layout und UI. `src/ui/songbook.test.tsx` prüft heute den Fill-Namen als Text in der Struktur („Takte, Groove-Namen, Fill-Block und Akzent erscheinen“, „Kurzer Fill“); das ändert sich fachlich (Name nur als Tooltip) und wird angepasst.
