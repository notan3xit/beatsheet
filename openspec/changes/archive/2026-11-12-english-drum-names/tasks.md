# Tasks

## 1. Namen im Sequencer und Akzent-Editor (pattern-sequencer)

- [x] 1.1 Tests aus den Szenarien anpassen (rot): Zellen und Zeilen über „Kick Drum“, „Floor Tom“ und „Bell“ suchen in `src/ui/sequencer.test.tsx`, `src/ui/songLock.test.tsx` und `src/ui/playback.test.tsx`; Instrumentliste mit „Floor Tom, Kick Drum“. Prüfen: `npm test -- sequencer songLock playback` rot
- [x] 1.2 `INSTRUMENT_LABELS` und `ARTICULATION_LABELS` in `src/domain/types.ts` (design.md D1). Prüfen: `npm test -- sequencer songLock playback` grün

## 2. Kürzel der Akzent-Markierungen (songbook-view)

- [x] 2.1 Tests aus den Szenarien anpassen (rot): „Hand und Fuß auf demselben Schlag“ erwartet „K“ unten in `src/songbook/layout.test.ts` und `src/ui/songbook.test.tsx`. Prüfen: `npm test -- layout songbook` rot
- [x] 2.2 `ACCENT_LABELS` in `src/songbook/layout.ts`: `kick: 'K'`, `floorTom: 'F'` (D2). Prüfen: `npm test -- layout songbook` grün

## 3. Übrige Namen

- [x] 3.1 Testtitel und Kommentare mit den alten Namen umbenennen: `src/audio/voices.test.ts`, `src/audio/switchingVoices.test.ts`, `src/persistence/fileFormat.test.ts`, `src/notation/render/vexflow.test.ts` („Ride-Bell: Raute auf Linie 5“), dazu `src/audio/samples/drs/README.md`. Prüfen: `rg -i "bassdrum|standtom|glocke" src --glob '!src/ui/changelog.ts'` findet nichts

## 4. Integration

- [x] 4.1 Im Browser prüfen (Skript unter `~/tools/playwright`, hell und dunkel): Sequencer zeigt „Floor Tom“ und „Kick Drum“ ohne Umbruch, Spielweise „Bell“ an der Ride, Akzent-Markierungen „K“ unter dem Takt. Prüfen: Screenshots zeigen das erwartete Verhalten
- [x] 4.2 `openspec validate english-drum-names --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
