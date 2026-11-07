# Design

## Context

`createSampleLoader` fängt Abruf- und Dekodierfehler ab und merkt sich nur den Zustand `unavailable`. Das Menü liest diesen Zustand über `useSyncExternalStore`. Motivation: siehe proposal.md.

## Goals / Non-Goals

**Goals:**
- Der Fehlergrund ist auf dem Gerät ablesbar, ohne Konsole.

**Non-Goals:**
- Die Ursache auf dem iPad beheben.
- Formatwahl ändern: Ein Abruffehler oder ein Dekodierfehler nach bestandener Probe versucht weiterhin kein weiteres Format.
- Hängende Vorgänge erkennen: Ein Abruf oder Dekodieren, das nie endet, bleibt im Zustand `loading` ohne Hinweis.

## Decisions

### D1: Der Lader hält die Gründe als fertige Zeilen

`SampleLoader` erhält `failures(): readonly string[]`, eine Zeile je versuchtem, gescheitertem Format, zum Beispiel `Dekodieren, crash-soft (opus): EncodingError: Decoding failed`. Es ist leer, außer im Zustand `unavailable`, und wird nur beim Übergang dorthin ersetzt; damit ist es als Snapshot für `useSyncExternalStore` stabil.

Alternative: strukturierte Fehlerobjekte, die das Menü formatiert. Verworfen: Es gibt nur diese eine Anzeige.

### D2: Aufnahme und Format statt URL

Die Zeile nennt Schlüssel und `SampleFormat.name`, nicht die URL: Die gehashten Dateinamen sind lang und sagen nichts zusätzlich. `browserFetch` meldet deshalb bei einer Fehlerantwort nur `HTTP <Status>`.

### D3: Alle Aufnahmen eines Formats abwarten

Die übrigen Aufnahmen laufen alle zu Ende, auch nach einem Fehlschlag, damit dessen Anzahl feststeht. Ob eine oder alle Aufnahmen scheitern, unterscheidet Speicherdruck von einer einzelnen fehlerhaften Datei. Gibt es mehrere Fehlschläge, endet die Zeile mit `(3 Aufnahmen gescheitert)`. Die Zeile nennt den ersten Fehlschlag in der Reihenfolge von `SAMPLE_KEYS`.

### D4: Fehlertext robust lesen

Fehler mit `name` und `message` erscheinen als `name: message`, ein schlichtes `Error` nur mit `message`, alles andere über `String()`. So bleibt auch eine Ablehnung ohne Fehlerobjekt (`null`) sichtbar.

### D5: Eintrag „Details“ und Dialog

Der Klang-Eintrag ist selbst ein Knopf (`menuitemradio`), ein Link darin wäre ungültig. „Details“ ist deshalb ein eigener Knopf mit `role="menuitem"` direkt unter „DRSKit“; `MenuChoice` rendert ihn aus einem optionalen Feld der Option. Er schließt das Menü und setzt einen Zustand in `AppMenu`, und der Dialog liegt wie `ChangelogDialog` außerhalb des aufklappbaren Teils, damit er das Schließen des Menüs überdauert.

`SampleFailureDialog` folgt dem Aufbau von `ChangelogDialog` (`.backdrop`, `.dialog`, Escape, Knopf „Schließen“) und zeigt `failures()` als Liste. Die Zeilen brechen über `overflow-wrap: anywhere` um.

Alternative: Meldung im Stapel oben. Verworfen: Der Grund braucht mehrere Zeilen und stünde bei betroffenen Geräten nach jedem Start über dem Inhalt. Aus demselben Grund öffnet sich der Dialog nicht von selbst.

### D6: Browser ohne Dekodiermöglichkeit

Der Lader von `createDeviceSound` liefert in diesem Fall die Zeile `Dekodieren: in diesem Browser nicht möglich`.

## Risks / Trade-offs

- [Englische Browsertexte in deutscher Oberfläche] → Bewusst unübersetzt, sie dienen der Diagnose.
- [`unavailable` steht erst fest, wenn alle Aufnahmen fertig sind] → Bis dahin spielt ohnehin der Synth.
