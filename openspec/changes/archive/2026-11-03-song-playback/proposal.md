# Proposal

## Why

Bisher lässt sich nur ein einzelnes Pattern im Pattern-Editor anhören. Ob der Song als Ganzes stimmt, zeigt sich erst im Zusammenspiel: wie ein Groove über mehrere Takte fortläuft, wo ein Fill einsetzt, wie Akzente sitzen und wie die Segmente aufeinander folgen. Zum Üben will man außerdem einzelne Stellen wiederholt hören, etwa den Chorus oder die Takte vor einem Fill.

## What Changes

- **Song abspielen:** Im Kopf der Doppelseite neben der Tempoangabe startet „Song abspielen“ den ganzen Song von vorn. Er läuft einmal bis zum Ende. Während der Wiedergabe heißt die Taste „Stopp“, unabhängig davon, wie die Wiedergabe gestartet wurde.
- **Ab hier abspielen:** Takt- und Segment-Popover bieten „Ab hier abspielen“. Die Wiedergabe beginnt beim ersten ausgewählten Takt bzw. am Anfang des Segments und läuft einmal bis zum Songende.
- **In Schleife abspielen:** Takt- und Segment-Popover bieten „In Schleife abspielen“. Die ausgewählten Takte bzw. das Segment wiederholen sich, bis der Nutzer stoppt.
- **Bereich beim Start festgehalten:** Startpunkt und Schleife bleiben bestehen, auch wenn der Nutzer danach die Auswahl ändert oder aufhebt.
- **Klang aus der Struktur:** Es gelten die Regeln der Song-Struktur. Grooves laufen innerhalb eines Blocks fort, Fills überdecken von rechts, Akzente kommen zusätzlich dazu. Takte ohne Groove und Fill bleiben stumm, ihre Akzente erklingen trotzdem.
- **Änderungen während der Wiedergabe:** Änderungen an Struktur, Patterns und Song-Tempo sind ohne Neustart hörbar.
- **Wiedergabeposition:** Auf der linken Seite ist der laufende Takt hervorgehoben. Eine Linie wandert maßstabsgetreu durch ihn, und die Seite scrollt mit, damit der laufende Takt sichtbar bleibt.
- **Ein Abspieler:** Song- und Pattern-Wiedergabe schließen sich aus. Ein Wechsel der Ansicht beendet jede Wiedergabe.

Nicht enthalten: Metronom oder Vorzähler, Wiederholungszeichen oder Sprünge in der Struktur, Lautstärke je Segment, Wiedergabe aus der Song-Liste, Tastenkürzel.

## Capabilities

### New Capabilities
- `song-playback`: Wiedergabe eines Songs auf der Doppelseite. Umfasst Start (ganzer Song, ab hier, Schleife), den Klang aus Groove-Fortlauf, Fill-Überdeckung und Akzenten, Live-Änderungen, die Wiedergabeposition in der Struktur und das Ende der Wiedergabe.

### Modified Capabilities
- `songbook-view`: „Segment-Popover“ und „Takt-Popover“ bieten zusätzlich „Ab hier abspielen“ und „In Schleife abspielen“.

## Impact

- Neu in `src/domain/playback.ts`: Zeitplan eines Songs auf Basis von `resolveSong` (`src/domain/timeline.ts`), Bereich für Start und Schleife.
- `src/audio/scheduler.ts`: Die Quelle wird allgemein (Länge, Schläge, Schleife ja/nein), statt selbst ein Pattern auszuwerten. Die Wiedergabe kann am Ende stoppen. Der Zustand meldet zusätzlich die fortlaufende Position in Beats für die Linie.
- `src/ui/playback.tsx`: Die Pattern-Quelle wird auf die allgemeine Schnittstelle umgestellt, dazu kommt ein Hook für die Song-Wiedergabe.
- `src/ui/Songbook.tsx`, `src/ui/StructurePage.tsx`, `src/ui/StructurePopovers.tsx`, `src/ui/styles.css`: Taste im Kopf, Aktionen in den Popovers, Hervorhebung und Linie, Mitscrollen.
- Tests: neue Tests für den Song-Zeitplan, den Scheduler im Einmal-Modus und die UI. Bestehende Scheduler-Tests ändern nur, wie sie die Quelle übergeben; ihre Erwartungen bleiben gleich.
- Kein neues Datenfeld und keine Änderung am Dateiformat.
