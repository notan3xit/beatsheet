# Proposal

## Why

Die aktuelle Ansicht (Song-Liste, Doppelseite eines Songs, Pattern-Editor) steckt nur im Speicher der App. Neuladen führt immer zurück zur Song-Übersicht, ein Lesezeichen oder Link auf einen Song oder ein Pattern ist nicht möglich, und die Zurück-Taste des Browsers verlässt die App, statt eine Ebene zurückzugehen.

## What Changes

- **Position in der URL:** Die Ansicht wird im Hash-Teil der Adresse abgebildet: Song-Liste `#/`, Doppelseite `#/songs/<Song-ID>`, Pattern-Editor `#/songs/<Song-ID>/patterns/<Pattern-ID>`. Die Adresse folgt jeder Navigation in der App.
- **Neuladen und Links:** Beim Start öffnet die App die Ansicht, die die Adresse nennt. Ein Lesezeichen oder kopierter Link führt damit direkt zum Song oder Pattern.
- **Browser-Zurück und -Vor:** Jede Navigation in der App legt einen Verlaufseintrag an; Zurück und Vor im Browser wechseln zwischen den Ansichten.
- **Unbekannte Adresse:** Nennt die Adresse einen Song, den es (auf diesem Gerät) nicht gibt, zeigt die App die Song-Liste; ein unbekanntes Pattern führt zur Doppelseite seines Songs. Die Adresse wird dann auf die tatsächlich gezeigte Ansicht korrigiert.

Hash statt Pfad, weil die App als statische Dateien ausgeliefert wird (relativer `base`, kein Server, der unbekannte Pfade auf `index.html` umleitet); Pfad-URLs würden beim Neuladen 404 liefern.

Nicht enthalten: Austausch von Songs über Links (die Daten liegen lokal auf dem Gerät; ein Link funktioniert nur dort, wo der Song gespeichert ist), Auswahl oder Popover in der Adresse, lesbare Namen statt IDs.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `navigation`: neue Anforderungen „Position in der Adresse“, „Browser-Verlauf“ und „Unbekannte Adresse“.

## Impact

- Neu `src/state/route.ts`: reine Funktionen Ansicht ↔ Hash (ohne Browser-APIs)
- Neu `src/ui/urlSync.ts`: verbindet Store und `window.location`/`hashchange` (Start, Navigation, Zurück/Vor)
- `src/main.tsx`: Verbindung nach dem Laden der Songs herstellen
- `src/state/notebookStore.ts`: unverändert in der Schnittstelle; die Verbindung nutzt `openSong`, `openPattern`, `backToBook`, `backToList` und `getState`
- Tests: neue Tests für `route.ts` und `urlSync.ts` (jsdom); bestehende Tests bleiben unverändert
