# Tasks

## 1. Werte ohne Lücke (pattern-library, song-meter)

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `src/ui/patternEditor.test.tsx` bzw. `songMeter.test.tsx`: „Länge wählen“ und „Eigenen Wert wählen“ über die Auswahl mit ihrem Namen; sichtbarer Text gleich in beiden Zuständen und für Screenreader verborgen, wo die Auswahl ihn trägt; Standard-Takt der Doppelseite unverändert bedienbar; `src/ui/styles.test.ts`: „Ohne Lücke“ (keine feste Breite für Länge und Taktart), Auswahl unsichtbar über dem Text mit Schrift 16px. Prüfen: `npm test -- patternEditor songMeter styles` rot
- [x] 1.2 `ValueSelect`, Länge und Taktart im Pattern-Editor, `MeterMark` umstellen, Stile (design.md D1, D2). Prüfen: `npm test` grün

## 2. Umbruch der Kopfzeilen (navigation)

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/ui/navigation.test.tsx` bzw. `styles.test.ts`: Aktionen und Schloss in einer Gruppe am rechten Rand in beiden Köpfen, gesperrt und entsperrt; Kopfzeilen mit Umbruch, Gruppe rechtsbündig, kein Umbruch in Werten und Knöpfen. Prüfen: `npm test -- navigation styles` rot
- [x] 2.2 `.header-end` in Pattern-Editor und Doppelseite, Stile (design.md D3). Prüfen: `npm test` grün

## 3. Integration

- [x] 3.1 Im Browser prüfen (Skript unter `~/tools/playwright`, hell und dunkel, 1280, 900 und 600 px, gesperrt und entsperrt): keine Lücke hinter Länge und Taktart, Plätze beim Entsperren unverändert, rechte Gruppe bricht gemeinsam um und bleibt rechtsbündig, Schloss im Fenster, keine Werte in mehreren Zeilen; Auswahl öffnet sich per Klick und Tastatur. Prüfen: Screenshots zeigen das erwartete Verhalten
- [x] 3.2 `openspec validate compact-headers --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
