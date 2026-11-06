# Tasks

## 1. Schriftzug (app-header)

- [x] 1.1 Tests aus den Szenarien erfassen (rot): In `src/ui/logo.test.tsx` erwartet das Szenario „Form“ zwei Strich-„e“ und das Szenario „Schrift“ `beatsh` als zusammenhängenden Text vor dem ersten Strich-„e“; `npx vitest run src/ui/logo.test.tsx` schlägt in genau diesen Tests fehl
- [x] 1.2 In `src/ui/Logo.tsx` das erste Strich-„e“ durch den Buchstaben ersetzen und die Tokens `--logo-e1-*` aus `src/ui/styles.css` entfernen (`--logo-e2-*` und `--logo-e3-*` behalten ihre Namen, Kommentare nennen die „e“ von „sheet“); `npx vitest run src/ui/logo.test.tsx` ist grün

## 2. Abschluss

- [x] 2.1 `npm run build` und `npm test` laufen fehlerfrei; die Kopfzeile zeigt im Browser in hell und dunkel `beatsh≡≡t`
- [x] 2.2 `openspec validate logo-plain-e --strict` besteht
