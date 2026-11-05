# Proposal

## Why

Die App-Kopfzeile wirkt unaufgeräumt: Beim Anmelden verschwindet der Anmelden-Knopf, das Formular überlagert Importieren und Exportieren, ohne sie zu sperren, und es lässt sich weder wegklicken noch mit Escape schließen. Im Code-Schritt brechen die Knöpfe auf drei Zeilen um, und der Code muss erst aus der Mail herausgesucht werden.

## What Changes

- Links in der Kopfzeile öffnet ein Hamburger-Symbol ein Menü mit „Exportieren“, „Importieren“ und „Anmelden“ bzw. „Abmelden“, jeweils mit Symbol und Text.
- Ein Trennstrich teilt im Menü Import und Export von Anmelden und Abmelden.
- Rechts in der Kopfzeile steht immer ein kreisförmiges Konto-Symbol. Angemeldet ist es gefüllt, sein Tooltip nennt die Adresse.
- Anmelden öffnet aus Menü und Konto-Symbol denselben mittigen Dialog. Ein Klick daneben schließt ihn nicht; Escape schließt ihn und behält den Schritt, nur „Abbrechen“ setzt ihn zurück.
- Der Dialog behält in allen Schritten dieselbe Größe; Hinweise und Fehler erscheinen an einer festen Stelle unter dem Eingabefeld. Auch Elemente, die etwa ein Passwortmanager einfügt, verschieben die Knöpfe nicht.
- Angemeldet öffnet das Konto-Symbol ein Popover mit Adresse und „Abmelden“; beides steht nicht mehr direkt in der Kopfzeile.
- Im Code-Schritt steht „Neu senden“ links als unauffälliger Textknopf und bestätigt das Senden sichtbar, „Abbrechen“ und „Anmelden“ stehen rechts, alle einzeilig.
- Der Betreff der Anmeldemail beginnt mit dem Code.
- Die Speicherwarnung nennt den Export im Menü.
- Der Hintergrund modaler Dialoge dunkelt die Seite in beiden Farbschemata ab, und Dialoge heben sich mit Rand von ihm ab.

Knöpfe außerhalb der App-Kopfzeile (Song-Kopf, Pattern-Editor) bleiben unverändert.

## Capabilities

### New Capabilities
- `app-header`: Aufbau der App-Kopfzeile mit Menü und Konto-Symbol

### Modified Capabilities
- `account-auth`: Code im Betreff, Adresse im Konto-Popover statt dauerhaft in der Kopfzeile, Schließen, stabile Anordnung und erneutes Senden im Anmeldedialog
- `library-persistence`: Verweis der Speicherwarnung auf den Export im Menü

## Impact

- `src/ui/App.tsx`, `src/ui/AccountMenu.tsx`, `src/ui/LibraryFileActions.tsx` (geht im neuen Menü auf), `src/ui/styles.css`, neue Symbole als Inline-SVG
- `server/auth.ts`: Betreff der Anmeldemail
- Tests, die Abmelden, Adresse, „Neuen Code anfordern“ oder „Exportieren“ direkt in der Kopfzeile erwarten
- Keine neuen Abhängigkeiten, keine Änderung an API, Datenbank oder Dateiformat
