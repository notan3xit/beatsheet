# Tasks

## 1. Prinzipien-Tests

- [x] 1.1 Tests aus den Szenarien von `design-system` erfassen (rot): `src/ui/designSystem.test.ts` mit Auflösung der Tokens und den vier Prinzipien aus design.md D4, gebündelt mit `it.each`, ohne Wortlaute; der Testlauf schlägt für die heutigen Werte fehl

## 2. Werte und Regeln umsetzen

- [x] 2.1 Tokens aus design.md D1 in `src/ui/styles.css` einführen und die Regeln darauf umstellen, einschließlich der übrigen Mischungen mit `--pc`, `--muted` lokal nach D2, `--danger-text` für Fehlerschrift; die Tests aus 1.1 sind grün
- [x] 2.2 `src/ui/styles.test.ts` an die geänderten Anforderungen anpassen: Spec-Namen `design-system`, Rand der Fills, Fehlerschrift; `npx vitest run src/ui/styles.test.ts` ist grün

## 3. Regeln festhalten

- [x] 3.1 `AGENTS.md`: Absatz „Farbregel“ um Rollen und Kontraste ergänzen und auf `openspec/specs/design-system/spec.md` verweisen; der Absatz nennt keine Prozentwerte
- [x] 3.2 Delta-Specs mit `openspec validate design-system --strict` prüfen

## 4. Gesamtprüfung

- [x] 4.1 `capture.mjs` des Mock-ups in hell und dunkel gegen den neuen Build laufen lassen: kein Text unter 4,5, ohne Stylesheet darüber; Fundstellen beheben; Screenshots der dunklen Ansicht zur Abnahme bereitstellen
- [x] 4.2 `npm test` und `npm run build` laufen fehlerfrei durch

## 5. Durchsicht der dunklen Ansicht

- [x] 5.1 Korrekturen aus design.md D6 in `src/ui/styles.css` umsetzen; im Browser zeigt eine gesetzte erste Zelle keinen Innenrand, die Kurzschrift nutzt im Dunkelmodus die geringere Stärke; `npm test` ist grün

## Workflow follow-up

- Delta-Specs in die Haupt-Specs übernehmen und den Change archivieren (`/opsx:archive`).
- Purpose von `color-theme` beim Übernehmen prüfen.
- Neuerung beim nächsten Release in `src/ui/changelog.ts` aufnehmen.
