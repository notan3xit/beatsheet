# Tasks

## 1. Wiederholung und Begrenzung

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `src/audio/sampleLoader.test.ts`: „Wiederholung gelingt“, „Alle Versuche scheitern“, „Keine Antwort des Servers“, „Datei nicht gefunden“, „Nicht dekodierbar“, „Laden aller Aufnahmen“, dazu die Wartezeiten nach design.md D2. Prüfen: `npm test -- sampleLoader` rot
- [x] 1.2 Wiederholung nach design.md D1 und D2 umsetzen. Prüfen: Die Tests zur Wiederholung sind grün
- [x] 1.3 Begrenzung nach design.md D3 umsetzen. Prüfen: `npm test -- sampleLoader` grün

## 2. Gesamtprüfung

- [x] 2.1 Gesamten Stand prüfen. Prüfen: `npm test` und `npm run build` laufen fehlerfrei durch; im Browser mit simulierten 502 lädt der Build alle Aufnahmen, und das Menü zeigt keinen Hinweis

## Workflow follow-up

- Mit artjom das Ergebnis durchsehen, dann committen.
- Veröffentlichen, dabei einen Eintrag für die Versionsliste ergänzen.
- Auf dem iPad in einem privaten Tab prüfen, ob das DRSKit beim ersten Laden verfügbar ist.
- Change archivieren.
