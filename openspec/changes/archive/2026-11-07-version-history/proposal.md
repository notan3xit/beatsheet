# Proposal

## Why

Nutzer sehen nirgends, welche Version der App läuft und was sich mit einer Version geändert hat. Die Commits sind für die Entwicklung geschrieben und außerhalb des Repos nicht sichtbar.

## What Changes

- Das Menü zeigt ganz unten die aktuelle Version.
- Ein Klick darauf öffnet einen modalen Dialog „Was ist neu“ mit den Neuerungen je Version in Stichworten, die aktuelle Version zuerst, ältere chronologisch rückwärts.
- Die Neuerungen liegen als Datenliste im Code. Die Versionen 0.2.0 bis 0.5.0 werden nachgetragen.
- Ein Test stellt sicher, dass der oberste Eintrag der Version in `package.json` entspricht.

## Capabilities

### New Capabilities

### Modified Capabilities
- `app-header`: Eintrag „Version“ im Menü, neuer Dialog „Was ist neu“

## Impact

- Neu: `src/ui/changelog.ts`, `src/ui/ChangelogDialog.tsx`
- `src/ui/AppMenu.tsx`, `src/ui/icons.tsx`, `src/ui/styles.css`, `src/ui/appMenu.test.tsx`
- Keine Änderung an Server, Datenmodell, Dateiformat oder Build
