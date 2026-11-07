# Proposal

## Why

Scheitert das Laden der DRSKit-Aufnahmen, zeigt das Menü nur „auf diesem Gerät nicht verfügbar“; der Grund geht verloren. Auf einem iPad (iPadOS 17.7) tritt das in der App auf, obwohl dieselben Dateien einzeln abrufbar und auf einer Testseite dekodierbar sind. Ohne Konsole auf dem Gerät lässt sich die Ursache nur über eine Anzeige in der App ermitteln.

## What Changes

- Das Menü zeigt beim Hinweis den Eintrag „Details“, der einen Dialog mit dem Grund öffnet: Schritt, Aufnahme, Format und Fehlertext.
- Scheitern mehrere Aufnahmen eines Formats, nennt der Grund die erste und die Anzahl.
- Wurden mehrere Formate versucht, steht je Format eine Zeile im Dialog.
- Bei Abruffehlern, die vorübergehend sein können, zeigt der Dialog „Neu laden kann das Problem beheben.“

Das Verhalten beim Laden bleibt gleich: gleiche Formatwahl, gleicher Ersatz durch den Synth.

## Capabilities

### New Capabilities

### Modified Capabilities

- `playback-sound`: Der Grund, aus dem die Aufnahmen nicht verfügbar sind, lässt sich aus dem Menü heraus in einem Dialog lesen.

## Impact

- `src/audio/sampleLoader.ts`, `src/audio/deviceSound.ts`: Lader hält den Grund fest
- `src/ui/AppMenu.tsx`: Eintrag „Details“ im Abschnitt „Klang“
- `src/ui/SampleFailureDialog.tsx`, `src/ui/styles.css`: Dialog
- Tests in `src/audio/sampleLoader.test.ts` und `src/ui/appMenu.test.tsx`
