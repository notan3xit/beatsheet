# Proposal

## Why

Mit leerem Cache scheitern beim gleichzeitigen Abruf der DRSKit-Aufnahmen einzelne Dateien mit HTTP 502. Das DRSKit gilt dann als nicht verfügbar, bis der Nutzer neu lädt; beobachtet in Safari und in der installierten App auf dem iPad. Wer das DRSKit nur einmal ausprobiert, hält es für kaputt. Die Ursache im Proxy oder Server ist nicht belegt, die App soll den Fehler aber in jedem Fall verkraften.

## What Changes

- Ein Abruf, der vorübergehend scheitert, wird automatisch wiederholt, bevor die Aufnahmen als nicht verfügbar gelten.
- Die App ruft höchstens vier Aufnahmen gleichzeitig ab.

Nicht enthalten: Änderungen am Server, solange die Ursache im Proxy nicht geklärt ist, und Wiederholungen beim Dekodieren.

## Capabilities

### New Capabilities

### Modified Capabilities

- `playback-sound`: Vorübergehend gescheiterte Abrufe werden wiederholt, gleichzeitige Abrufe sind begrenzt.

## Impact

- `src/audio/sampleLoader.ts`: Wiederholung und Begrenzung im Lader
- Tests in `src/audio/sampleLoader.test.ts`
