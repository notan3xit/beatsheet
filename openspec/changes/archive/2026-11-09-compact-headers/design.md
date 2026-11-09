# Design

## Context

Länge (`.value-length`, 5,5rem) und Taktart (`.value-meter`, 3,75rem) im Pattern-Editor haben feste Breiten, damit Text und Auswahlliste mit Rahmen und Pfeil denselben Platz belegen (`song-lock`, „Gleiche Anordnung beim Entsperren“). Der Standard-Takt der Doppelseite (`MeterMark`) ist schon eine Auswahl ohne Rahmen und Pfeil (`appearance: none`), aber mit fester Breite von 3ch. `.editor-header` bricht um, Aktionen und Schloss sind dort getrennte Elemente; `.page-title` der Doppelseite bricht nicht um.

## Goals / Non-Goals

**Goals:**
- Text und Bedienelement eines Werts belegen per Konstruktion denselben Platz, ohne feste Breiten.
- Gleiches Verhalten auf Desktop-Browsern, iOS und Android.

**Non-Goals:**
- Neue Anordnung der Köpfe für Smartphones über den Umbruch hinaus.
- Die Unterteilung über den Beats im Sequencer.

## Decisions

### D1: Wert mit unsichtbarer Auswahl darüber
Neue Komponente `ValueSelect` (Wert, Optionen, Name, Übernahme): Sichtbar ist immer derselbe Text in einem `span`, der die Breite bestimmt. Entsperrt liegt eine echte `select` absolut darüber (`inset: 0`, `opacity: 0`, volle Fläche). Klick, Tippen und Tastatur erreichen die `select`; jedes Gerät öffnet seine eigene Auswahlliste. Ihre Schriftgröße ist 16px, damit iOS beim Fokus nicht vergrößert. Hover zeigt den gestrichelten Unterstrich wie `TempoMark`, `:focus-visible` der `select` einen Fokusrahmen am Text (über `:has()` bzw. `:focus-within` am Container). Gesperrt entfällt die `select`.

Alternativen: `select` mit `appearance: none` und Breite aus der Textlänge (`field-sizing: content` gibt es nur in Chromium, Breiten in `ch` treffen bei proportionaler Schrift nicht genau; iOS gestaltet `select` nur eingeschränkt). Feste, kleinere Breiten (lassen Lücken übrig).

### D2: Einsatz
- Pattern-Editor: Länge und eigene Taktart über `ValueSelect`. Die folgende Taktart bleibt gedämpfter Text in derselben Hülle, damit „Umschalten verschiebt nichts“ gilt.
- Doppelseite: `MeterMark` nutzt `ValueSelect`; die feste Breite von 3ch entfällt.
- `.value-length` und `.value-meter` verlieren ihre festen Breiten.

### D3: Umbruch der Kopfzeilen
- Pattern-Editor: `.editor-actions` und `LockToggle` kommen in einen gemeinsamen Container `.header-end` mit `margin-left: auto`; gesperrt enthält er nur das Schloss.
- Doppelseite: „Song löschen“, `StructureToggle`, `HistoryButton` und `LockToggle` ebenso in `.header-end`; `.page-title` erhält `flex-wrap: wrap`.
- Kein Umbruch in Elementen: `white-space: nowrap` für Tempoangabe, Taktart, Länge und Knöpfe der Kopfzeile, `flex: none` für die Gruppen.
- Die bisherigen Regeln zum Abstand des Schlosses (`.editor-actions + .lock-toggle`, `.page-title .danger + …`) entfallen zugunsten des Containers.

## Risks / Trade-offs

- [Unsichtbare `select` und Screenreader] → Die `select` trägt den zugänglichen Namen und den Wert; der sichtbare Text ist `aria-hidden`, damit nichts doppelt angesagt wird.
- [Wertwechsel ändert die Breite] → Beim Wählen eines längeren Werts rückt der Rest um wenige Zeichen; das ist eine Bearbeitung, kein Wechsel der Sperre.
- [jsdom prüft keine Layouts] → Breiten und Umbruch prüft der Browser-Check; die Unit-Tests prüfen Aufbau und Stylesheet.
