# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren.

## 1. Audiodateien

- [x] 1.1 `scripts/drs-samples.mjs` nach design.md D4 und D5 schreiben (Tabelle, fester Commit, Mischen, Kürzen, Pegel, Opus und AAC). Prüfen: Das Skript erzeugt unter `src/audio/samples/drs/` 20 `.webm`- und 20 `.m4a`-Dateien, zusammen unter 1 MB
- [x] 1.2 `src/audio/samples/drs/README.md` mit Quelle, Commit, Autoren, Lizenz CC BY 4.0, Bearbeitung und Aufruf des Skripts. Prüfen: Der beschriebene Aufruf erzeugt dieselben Dateien neu
- [x] 1.3 Einsatz der normalen Snare in beiden Formaten im Headless-Chromium dekodieren und vergleichen (design.md, Risiko AAC-Vorlauf); bei Versatz den Startversatz je Format festhalten. Prüfen: Die Einsätze liegen nach Versatz höchstens 2 ms auseinander, Ergebnis im README vermerkt

## 2. Klangwahl

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/audio/soundSetting.test.ts`: „Vorgabe“ und „Wahl bleibt erhalten“ von „Wahl pro Gerät“ (neuer Store über denselben Speicher), dazu unbekannter Wert und nicht nutzbarer Speicher nach D6. Prüfen: `npm test -- soundSetting` rot
- [x] 2.2 `createSoundSetting` nach D6. Prüfen: die Tests aus 2.1 grün

## 3. Laden und Formatwahl

- [x] 3.1 Tests erfassen (rot), `src/audio/sampleLoader.test.ts` mit injiziertem Abruf und Dekodieren: Ablauf `idle` → `loading` → `ready`; „Zweites Format“; „Aufnahmen nicht dekodierbar“ (Zustand `unavailable`); Abruffehler ohne zweiten Formatversuch; `load()` idempotent; Benachrichtigung über `subscribe`. Prüfen: `npm test -- sampleLoader` rot
- [x] 3.2 `createSampleLoader` nach D3 samt Dekodieren über `OfflineAudioContext` und Einbindung der Dateien über `import.meta.glob` nach D4. Prüfen: die Tests aus 3.1 grün, `npm run build` legt die Dateien gehasht unter `dist/assets/` ab

## 4. Sample-Stimmen und Umschalten

- [x] 4.1 Tests erfassen (rot), `src/audio/sampleVoices.test.ts` mit `FakeAudioContext`: „Normaler Schlag“, „Ghost Note“, „Flam“ von „Klang der Aufnahmen“ (gewählte Aufnahme und Pegel nach D2); „Offene Hi-Hat mit Aufnahmen abgestoppt“ von `pattern-playback`, auch durch das Pedal; `silence()`. Prüfen: `npm test -- sampleVoices` rot
- [x] 4.2 `createSampleVoices` nach D2, `FakeAudioContext` bei Bedarf um `AudioBufferSourceNode.buffer` und `start(time, offset)` ergänzen. Prüfen: die Tests aus 4.1 und `voices` grün
- [x] 4.3 Tests erfassen (rot), `src/audio/switchingVoices.test.ts`: „Synth wählen“, „Wechsel während der Wiedergabe“, „Abspielen vor dem Laden“, „Aufnahmen werden während der Wiedergabe bereit“ und „Aufnahmen nicht dekodierbar“ (Synth spielt) über einen laufenden Scheduler mit Fake-Uhr; `silence()` an beide. Prüfen: `npm test -- switchingVoices` rot
- [x] 4.4 `createSwitchingVoices` nach D1; `createWebAudioPlayer` bekommt Klangwahl und Lader, `App` erzeugt beide und startet `load()` nach D3. Prüfen: die Tests aus 4.3, `player`, `scheduler`, `playback` und `songPlayback` grün

## 5. Menü

- [x] 5.1 Tests erfassen (rot), `src/ui/appMenu.test.tsx`: „Abschnitt Klang“ von `app-header`; „Vorgabe“, „Synth wählen“ (Markierung und Speicher), „Wahl bleibt erhalten“ über die Oberfläche; Hinweis „auf diesem Gerät nicht verfügbar“ nur im Zustand `unavailable`, nicht nach „Erneuter Versuch nach Neustart“; „Namensnennung im Menü“ mit beiden Verweisen. Prüfen: `npm test -- appMenu` rot
- [x] 5.2 Abschnitt „Klang“ in `AppMenu` nach D7, CSS mit Tokens. Prüfen: die Tests aus 5.1 und `src/ui/styles.test.ts` grün

## 6. Server

- [x] 6.1 Test erfassen (rot), `server/static.test.ts`: `.webm` mit `audio/webm`, `.m4a` mit `audio/mp4`. Prüfen: `npm test -- static` rot
- [x] 6.2 Inhaltstypen in `server/static.ts` nach D4. Prüfen: der Test aus 6.1 grün

## 7. Abschluss

- [x] 7.1 Gesamtprüfung: `openspec validate drum-samples --strict` fehlerfrei, `npm run build` und `npm test` grün
- [x] 7.2 Im Headless-Chromium mit gebautem Server prüfen: Nach dem Start werden die Opus-Dateien geladen, die Wiedergabe spielt Aufnahmen, Wechsel im Menü auf „Synth“ und zurück ohne Neustart, keine Fehler in der Konsole; Menü in Latte und Mocha per Screenshot
- [x] 7.3 Hörprüfung durch artjom im Browser und auf dem iPad: Stereo-Mischung und Pegel gegenüber der Klangprobe, Ghost Notes und Flams, Abstoppen der offenen Hi-Hat, gleiche Lautheit von DRSKit und Synth; auf dem iPad, welches Format spielt oder ob der Hinweis erscheint

## Workflow follow-up

- Specs übernehmen und Change archivieren (`/opsx:archive`).
- Die Namensnennung bleibt Pflicht, solange DRSKit-Aufnahmen ausgeliefert werden.
