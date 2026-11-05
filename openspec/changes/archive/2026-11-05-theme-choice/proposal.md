# Proposal

## Why

Das Farbschema folgt bisher allein der Systemeinstellung. Wer die App etwa am Abend auf einem hell eingestellten Gerät dunkel nutzen will (oder umgekehrt), kann das nicht.

## What Changes

- Das Menü bekommt über dem Abschnitt „Klang“ den Abschnitt „Farbschema“ mit „Wie System“, „Hell“ und „Dunkel“, aufgebaut wie „Klang“.
- „Hell“ zeigt immer Latte, „Dunkel“ immer Mocha, „Wie System“ folgt wie bisher der Systemeinstellung, auch bei einem Wechsel zur Laufzeit. Vorgabe ist „Wie System“.
- Die Wahl wirkt sofort, gilt pro Gerät und bleibt über einen Neustart erhalten. Sie gilt schon beim ersten Anzeigen der App, ohne kurzes Aufblitzen des anderen Schemas.
- Die Ablage der Klangwahl wird zu einer allgemeinen Geräte-Einstellung, die beide Wahlen nutzen.

Voraussetzung: `drum-samples` ist archiviert. Dieser Change baut auf dessen Abschnitt „Klang“ und dessen Fassung der Anforderung „Menü“ auf.

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `color-theme`: Das Farbschema folgt der Wahl auf dem Gerät, „Wie System“ der Systemeinstellung; neue Anforderungen zur Wahl im Menü und zur Speicherung pro Gerät.
- `app-header`: Das Menü enthält vor „Klang“ den Abschnitt „Farbschema“.

## Impact

- `src/ui/theme.ts`: Farbschema über ein Attribut am Wurzelelement statt allein über die Media Query; Anbindung an Wahl und Systemeinstellung.
- `src/ui/styles.css`: Dunkel-Block der Tokens hängt am selben Attribut.
- `src/audio/soundSetting.ts`: nutzt die allgemeine Geräte-Einstellung.
- `src/ui/AppMenu.tsx`, `src/ui/App.tsx`, `src/main.tsx`: Abschnitt „Farbschema“, Einstellung vor dem ersten Rendern anwenden.
- Tests: `src/ui/theme.test.ts`, `src/ui/styles.test.ts`, `src/ui/appMenu.test.tsx`.

Keine Auswirkung auf Dateiformat, Song-Dokument, Abgleich und Server.
