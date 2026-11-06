# Proposal

## Why

Im Schriftzug liest das Auge die Strich-„e“ nicht als Buchstaben. Am Wortanfang entsteht so „batsh…“ statt „beat“. Ein normales erstes „e“ macht den Anfang lesbar.

## What Changes

- Das „e“ von „beat“ wird ein normaler Buchstabe in Comfortaa.
- Die beiden „e“ von „sheet“ bleiben aus drei Strichen und behalten ihre Farben.
- Die Farb-Tokens des ersten Strich-„e“ entfallen.

## Capabilities

### New Capabilities

### Modified Capabilities
- `app-header`: Die Anforderungen „Schrift des Schriftzugs“ und „‚e‘ aus drei Strichen“ gelten für das normale „e“ von „beat“ bzw. die Strich-„e“ von „sheet“.

## Impact

`src/ui/Logo.tsx`, `src/ui/styles.css`, `src/ui/logo.test.tsx`. Keine Änderung an API, Abhängigkeiten oder Dateiformat.
