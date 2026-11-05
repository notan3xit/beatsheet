# Design

## Context

Der Scheduler (`src/audio/scheduler.ts`) kennt nur die Schnittstelle `Voices` mit `trigger(instrument, time, gain)` und `silence()`. Ghost Notes kommen dort als `gain = GHOST_GAIN` (0,3) an, Flam-Vorschläge als `gain · FLAM_GRACE_GAIN` (0,4) kurz vor dem Hauptschlag. `createVoices` (`voices.ts`) erzeugt die Synth-Stimmen samt Abstoppen der offenen Hi-Hat. `createWebAudioPlayer` legt den `AudioContext` erst beim ersten Start an (Autoplay-Regeln). Eine Einstellungsablage gibt es bisher nicht. Der Server liefert `dist` aus; Dateien unter `assets/` bekommen `Cache-Control: immutable`, unbekannte Endungen `application/octet-stream`. Motivation siehe proposal.md, Verhalten siehe `specs/playback-sound`.

Die Auswahl der DRSKit-Aufnahmen stammt aus der Klangprobe: Das SFZ-Mapping des Sets (`sfzinstruments/DrumGizmo.DRSKit`, `Stereo/DrumGizmo DRSKit.sfz`) bei Anschlag 100 bzw. 40 ergibt:

| Instrument | Ordner | normal | leise | Mikrofone |
|---|---|---|---|---|
| Bassdrum | `Kdrum_with_contact` | 15 | 4 | Kdrum_back, Snare_bottom, OH, Amb |
| Snare | `Snare` | 37 | 14 | Snare_top, Snare_bottom, OH, Amb |
| Tom 1 | `Tom1` | 17 | 5 | Tom1, Snare_bottom, OH, Amb |
| Tom 2 | `Tom2` | 13 | 4 | Tom2, Snare_bottom, OH, Amb |
| Standtom | `Tom3` | 13 | 4 | Tom3, Snare_bottom, OH, Amb |
| Hi-Hat | `Hihat_closed` | 13 | 4 | Hihat, OH, Amb |
| Hi-Hat offen | `Hihat_open` | 9 | 3 | Hihat, OH, Amb |
| Hi-Hat-Pedal | `Hihat_foot` | 6 | 3 | Hihat, OH, Amb |
| Ride | `Ride_tip` | 6 | 2 | Ride, OH, Amb |
| Crash | `Crash_left_shank` | 9 | 4 | OH, Amb |

OH und Amb stehen jeweils für das Paar L/R.

## Goals / Non-Goals

**Goals:**
- Scheduler und Abspiel-Logik bleiben unverändert; der Klang wird allein hinter `Voices` gewählt.
- Laden, Formatwahl und Umschalten ohne Browser-APIs testbar (Dekodieren und Abrufen injiziert).
- Die Audiodateien sind aus dem DRSKit-Repository reproduzierbar erzeugt.

**Non-Goals:**
- Zufällige Auswahl unter mehreren Aufnahmen je Schlag (Round-Robin), Anschlagstärken zwischen normal und leise.
- Lautstärkeregler oder Mischpult je Instrument.

## Decisions

### D1: Umschaltbare Stimmen

`createSwitchingVoices(synth, samples, choose)` in `src/audio/switchingVoices.ts` implementiert `Voices`: Bei jedem `trigger` fragt `choose()`, ob die Aufnahmen spielen (gewählt „DRSKit“ und Ladezustand `ready`), und leitet an die Sample- oder Synth-Stimmen weiter. `silence()` geht an beide. Damit gilt der Wechsel ab dem nächsten Schlag, ohne Neustart und ohne Wissen des Schedulers.

`createWebAudioPlayer` bekommt die Klangwahl und den Lader übergeben und baut beim ersten Start die umschaltbaren Stimmen.

Alternative: Player bei Klangwechsel neu aufbauen. Verworfen: Die Wiedergabe müsste neu starten, die Spec verlangt den Wechsel ohne Neustart.

### D2: Sample-Stimmen

`createSampleVoices(ctx, getBuffers)` in `src/audio/sampleVoices.ts`: je Schlag ein `AudioBufferSourceNode` über eine Hüllkurven-Gain-Stufe auf einen eigenen Master. Kein Kompressor, die Aufnahmen sind im Pegel vorbereitet.

Wahl der Aufnahme aus dem Pegel: `gain ≥ 0,5` → normaler Schlag mit Pegel `gain`; darunter → leiser Schlag mit Pegel `min(1, gain / GHOST_GAIN)`. Eine Ghost Note spielt so den leisen Schlag unverändert, ein Flam-Vorschlag (0,4) ihn leicht lauter. Die `Voices`-Schnittstelle bleibt dadurch gleich.

Die offene Hi-Hat wird wie beim Synth abgestoppt: Geschlossene Hi-Hat oder Pedal nach ihr setzen ihre Hüllkurve mit einer Zeitkonstante von 10 ms auf 0. Beim Synth sind es 4 ms; bei einer Aufnahme würde das hörbar knacken.

`silence()` trennt den Master und legt einen neuen an, wie `createVoices`.

### D3: Laden und Formatwahl

`createSampleLoader({ fetch, decode, formats })` in `src/audio/sampleLoader.ts` mit den Zuständen `idle`, `loading`, `ready`, `unavailable` und `subscribe`. `load()`:

1. Für das erste Format (Opus in WebM) wird zuerst die normale Snare abgerufen und dekodiert. Schlägt das Dekodieren fehl, folgt das zweite Format (AAC in MP4).
2. Ist ein Format dekodierbar, werden die übrigen 19 Dateien dieses Formats parallel geladen. Danach `ready`.
3. Schlägt jedes Format fehl oder scheitert ein Abruf, ist der Zustand `unavailable`. Ein Abruffehler probiert kein weiteres Format, weil er nichts über den Codec aussagt.

`load()` ist idempotent und wird gestartet, sobald die App läuft und „DRSKit“ gewählt ist, auch wenn der Nutzer später auf „DRSKit“ wechselt. Ein neuer Versuch erfolgt erst beim nächsten App-Start (Spec: „Erneuter Versuch nach Neustart“).

Dekodiert wird mit einem `OfflineAudioContext` (2 Kanäle, 48 kHz), weil der echte `AudioContext` erst beim ersten Abspielen entsteht. Ein `AudioBuffer` ist an keinen Kontext gebunden und spielt auch im späteren `AudioContext`. Fehlt `OfflineAudioContext`, ist der Zustand `unavailable`.

Alternative: erst beim ersten Abspielen laden. Verworfen: Der erste Groove käme dann fast immer vom Synth.

### D4: Dateien und Auslieferung

Die Dateien liegen unter `src/audio/samples/drs/` als `<instrument>-<normal|soft>.webm` und `.m4a` und werden über `import.meta.glob(…, { query: '?no-inline', import: 'default', eager: true })` eingebunden. Vite legt sie mit Hash unter `assets/` ab; `?no-inline` verhindert, dass Dateien unter 4 KB als Data-URL ins Skript wandern. Der Server liefert sie dort mit `immutable` aus, das ist zugleich der Offline-Weg: Einmal geladen, bleiben sie im Browser-Cache. Ein Service Worker entfällt.

`server/static.ts` ergänzt `.webm` → `audio/webm` und `.m4a` → `audio/mp4`.

Zuschnitt (gemessen: Opus etwa 430 KB, AAC etwa 470 KB):
- Stereo, 48 kHz. Die Paare OH und Amb werden ganz links und ganz rechts eingeordnet, die Nahmikrofone mittig, alle mit gleichem Pegel. Die Klangprobe hatte alle Mikrofone mittig, das Ergebnis ist dadurch breiter als dort.
- Opus und AAC-LC mit je 96 kbit/s. Mit 128 kbit/s wäre AAC allein über 600 KB groß, beide Formate zusammen über 1 MB.
- Ende bei −60 dB unter der Spitze, höchstens 4 s für Crash, Ride und offene Hi-Hat, sonst 1,5 s, 30 ms Ausblenden. Beginn 2 ms vor dem Einsatz (−40 dB).
- Ein gemeinsamer Pegelfaktor je Set: Effektivwert der ersten 200 ms der normalen Snare auf 0,18, Spitze höchstens 0,98. Das Verhältnis zwischen normalem und leisem Schlag bleibt wie aufgenommen.

### D5: Erzeugungsskript

`scripts/drs-samples.mjs` (Node, braucht `ffmpeg` im `PATH`, läuft nicht im Build) erzeugt die Dateien aus D4:
- Die Tabelle aus Context steht im Skript. Die FLAC-Dateien werden von `raw.githubusercontent.com` zu einem festen Commit des DRSKit-Repositorys geladen.
- `ffmpeg` dekodiert sie in Gleitkommazahlen. Mischen, Kürzen und Pegel rechnet das Skript selbst, danach kodiert `ffmpeg` beide Formate.

`src/audio/samples/drs/README.md` nennt Quelle, Commit, Lizenz (CC BY 4.0), Autoren und die Bearbeitung.

Alternative: das Python-Skript der Klangprobe übernehmen. Verworfen: Das Projekt ist sonst reines Node und wird auch unter Windows genutzt. Für DRSKit reicht die feste Tabelle statt eines SFZ-Parsers.

### D6: Klangwahl

`createSoundSetting(storage)` in `src/audio/soundSetting.ts` liest und schreibt `localStorage['beatsheet.sound']` mit den Werten `drs` und `synth`, Vorgabe `drs`, und bietet `get`, `set` und `subscribe` für `useSyncExternalStore`. Ist der Speicher nicht nutzbar (privater Modus, Ausnahme beim Zugriff), gilt die Wahl nur im Speicher. Unbekannte Werte gelten als Vorgabe.

Alternative: im Profil auf dem Server. Verworfen: Ob Aufnahmen spielbar sind, hängt vom Gerät ab (Spec „Wahl pro Gerät“).

### D7: Menü

`AppMenu` bekommt unter dem Eintrag zum Konto ein `<hr>` und eine Gruppe (`role="group"`, `aria-label="Klang"`) mit der Überschrift „Klang“:
- zwei Einträge `role="menuitemradio"` mit `aria-checked`, „DRSKit“ und „Synth“; Wählen schließt das Menü wie jeder Eintrag;
- bei Zustand `unavailable` unter „DRSKit“ der Hinweis „auf diesem Gerät nicht verfügbar“ in gedämpfter Schrift;
- eine kleine Zeile mit den Verweisen „DRSKit von DrumGizmo.org“ (Seite des Sets) und „CC BY 4.0“ (Lizenztext) als gewöhnliche Links mit `target="_blank"` und `rel="noopener"`. Sie sind keine Menü-Einträge, weil sie keine Aktion der App auslösen; per Tab bleiben sie erreichbar.

Klangwahl und Lader entstehen in `App` (Prop `sound` für Tests, sonst Gerätespeicher und DRSKit-Formate) und erreichen Menü und Player über einen Kontext. `App` startet `load()` nur, wenn der Player verfügbar ist; ohne Web Audio gibt es nichts abzuspielen.

## Risks / Trade-offs

- [AAC-Dateien beginnen mit Encoder-Vorlauf (etwa 1024 Samples); dekodiert ein Browser ihn mit, kommt jeder Schlag rund 21 ms zu spät] → Im Headless-Chromium den Einsatz der dekodierten Snare messen. Liegt er später als bei Opus, bekommt das Format einen festen Startversatz, der beim `start(time, offset)` übersprungen wird. Safari auf dem iPad prüft artjom von Hand.
- [Unbekannt, welche Formate WebKit auf dem iPad über `decodeAudioData` dekodiert] → Zwei Formate und Ersatz durch den Synth; die Spec verlangt nur, dass etwas klingt.
- [Wird zwischen offener Hi-Hat und dem abstoppenden Schlag der Klang gewechselt, stoppt die offene Hi-Hat nicht] → hingenommen, ein Wechsel ist selten und der Nachklang endet von selbst nach höchstens 4 s.
- [Paket und `dist` wachsen um etwa 0,7 MB] → hingenommen; geladen wird je Gerät nur ein Format.
- [Stereo-Mischung weicht von der gehörten Klangprobe ab] → Hörprüfung im Browser als Task, bei Bedarf Pegel der Paare im Skript anpassen.
- [Speicher: dekodiert etwa 10 MB Gleitkommadaten] → hingenommen, auch für ein iPad unkritisch.

## Migration Plan

Keine Datenmigration. Eine ältere Version ignoriert den Eintrag `beatsheet.sound` und spielt weiter den Synth.
