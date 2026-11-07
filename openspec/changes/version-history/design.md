# Design

## Context

Die App kennt ihre Version bisher nicht: `package.json` gelangt nicht in das Bundle, einen `define`-Eintrag in `vite.config.ts` gibt es nicht. Dialoge bestehen aus `.backdrop` und `.dialog` mit `useEscape`, das Menü rendert den Import-Dialog außerhalb seines aufklappbaren Teils. Die Kopfzeile liegt außerhalb des Sperr-Riegels in `main`, der Song-Sperrzustand betrifft sie also nicht. `appMenu.test.tsx` verlangt für jeden Eintrag mit Rolle `menuitem` ein Symbol.

## Goals / Non-Goals

**Goals:**
- Die Versionsnummer hat nur zwei Quellen, die ein Test abgleicht: `package.json` und der oberste Eintrag.

**Non-Goals:**
- Die Version selbst hochziehen und 0.6.0 eintragen: Das gehört zum nächsten Release.
- Hinweis auf Neuerungen seit dem letzten Besuch.
- Build-Teil der Version (`+7715f7e`) anzeigen.

## Decisions

**D1: Neuerungen als Datenliste in `src/ui/changelog.ts`.** `CHANGELOG: { version, date, items }[]`, oberster Eintrag ist die aktuelle Version. Eine `CHANGELOG.md` bräuchte Parser und Formatregeln, aus Commits erzeugte Texte wären für die Entwicklung statt für Nutzer geschrieben.

**D2: Version aus dem obersten Eintrag.** Das Menü zeigt `CHANGELOG[0].version`. Das spart einen Build-Eingriff. `src/ui/changelog.test.ts` vergleicht diese Nummer mit `package.json`, sodass ein Hochziehen ohne Eintrag am Hook vor dem Push scheitert.

**D3: Tests prüfen keine Texte der Liste.** `ChangelogDialog` bekommt die Einträge als Prop und wird mit einer eigenen Testliste geprüft. Tests über das Menü nutzen `CHANGELOG[0].version`. Änderungen an Formulierungen können so keinen Test brechen.

**D4: Eintrag „Version“ als `menuitem` mit Symbol.** Er bleibt so bei der Regel „jeder Eintrag hat ein Symbol“ und schließt das Menü wie die übrigen. Neu ist ein Info-Symbol in `icons.tsx`.

**D5: Dialog wie der Import-Dialog.** `.backdrop`, `.dialog`, Fokus auf „Schließen“ in `.dialog-actions` statt eines ×, wie bei den übrigen Dialogen. Titel und „Schließen“ bleiben stehen, nur die Liste rollt. Die Höhe ist auf `32rem` begrenzt, damit sich das Modal nicht über das ganze Fenster zieht.

**D6: Datum als Text umformen.** `2026-11-07` wird durch Umstellen zu `07.11.2026`. Über `Date` könnte sich der Tag je nach Zeitzone verschieben.

**D7: Inhalt.** Stichworte beschreiben die Wirkung für Nutzer. Interna (Automerge, Hook, Server-Grenzen, Paket) und Logo oder Branding entfallen. Die Daten stammen aus den Git-Tags. Nachzutragen:

- 0.5.0 (2026-11-07)
  - Standard-Takt pro Song; Patterns folgen ihm oder haben eine eigene Taktart
  - Neue Schlag-Arten: Drag, Rim Shot, Cross-Stick, Ride-Glocke, Choke und Betonung
  - Fill-Kurzschrift zeigt alle Schläge, auch Hi-Hat, Ride und Ghost Notes
  - Links „zum Groove“ und „zum Fill“ im Takt-Popover
  - Karten der ausgewählten Takte werden auf der Patternseite hervorgehoben
- 0.4.0 (2026-11-05)
  - Song-Ansicht passt sich der Breite an
  - Patternseite in Song-Reihenfolge, Grooves und Fills gemischt
- 0.3.0 (2026-11-05)
  - DRSKit-Aufnahmen als Klang neben dem Synth
  - Farbschema wählbar: Wie System, Hell, Dunkel
- 0.2.0 (2026-11-05)
  - Patterns mit Sequencer und Notenbild, Song-Struktur mit Grooves und Fills
  - Patterns und Songs abspielen, ab einer Stelle und in Schleife
  - Flams, Ghost Notes und 32tel
  - Export und Import mit Auswahl pro Song
  - Anmeldung per Mail, Songs im Konto und auf mehreren Geräten
  - Workbooks zum Teilen mit anderen
  - Songs öffnen gesperrt, ein Schloss gibt das Bearbeiten frei
  - Song-Übersicht als Kacheln, Profile mit Name, Kürzel und Farbe

## Risks / Trade-offs

- [Bis zum nächsten Release zeigt das Menü 0.5.0, obwohl die Funktion darin noch nicht enthalten war] → Der Abgleich verlangt das so; mit 0.6.0 kommt der eigene Eintrag.
- [Der Abgleich verbindet einen Test mit echten Daten] → Er prüft nur die Nummer, nie die Texte.
