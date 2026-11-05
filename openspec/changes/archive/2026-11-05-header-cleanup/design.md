# Design

## Context

`AccountMenu` zeigt entweder den Anmelden-Knopf oder ein absolut positioniertes Formular und führt dafür den Zustand `closed | email | code`. `LibraryFileActions` rendert Export, Import, Datei-Input und `ImportDialog` direkt in der Kopfzeile. Andere Popover nutzen `useDismiss`, Menüs das Muster `role="menu"` aus `MoveMenu`. Symbole sind Inline-SVGs.

## Goals / Non-Goals

**Goals:**
- Ein Formular und eine Abmelde-Aktion, erreichbar über zwei Wege

**Non-Goals:**
- Fokusführung und Pfeiltasten im Menü über das hinaus, was `MoveMenu` bietet
- Modales Konto-Popover für Angemeldete: Es bleibt am Symbol

## Decisions

### D1: Zustand in `AppHeader`

Der neue `AppHeader` (`src/ui/AppHeader.tsx`) hält `accountOpen` und nutzt den Hook `useLogout(session)`. `AppMenu` und `AccountMenu` erhalten Öffnen und Abmelden als Props. Alternative: eigener Context; bei zwei Geschwistern unnötig.

### D2: `AccountMenu` trennt Sichtbarkeit und Schritt

`Step` wird zu `email | code`, die Sichtbarkeit kommt als Prop. Escape ändert nur die Sichtbarkeit, „Abbrechen“ und erfolgreiches Anmelden setzen zusätzlich Schritt, Code und Fehler zurück. So bleibt ein gesendeter Code nach versehentlichem Schließen erreichbar, statt in die 30-Sekunden-Sperre zu führen. `useDismiss` gilt nur für das Popover der Angemeldeten; seine Fläche ist `.account` samt Konto-Symbol, damit dessen Klick das Popover nicht erst schließt und dann wieder öffnet.

Der Schritt lebt nur im Speicher; nach dem Neuladen beginnt das Formular wieder mit der Mail-Adresse.

### D3: `AppMenu` ersetzt `LibraryFileActions`

Die Export- und Import-Logik zieht nach `src/ui/AppMenu.tsx`. Datei-Input und `ImportDialog` liegen außerhalb des aufklappbaren Teils und bleiben gemountet, sonst ginge die Auswahl mit dem Schließen des Menüs verloren. „Importieren“ ist ein `menuitem`-Knopf und ruft `click()` auf dem Input auf. Der Input trägt `hidden` und `aria-label="Importieren"`: nicht fokussierbar und nicht sichtbar, für Tests weiter über `getByLabelText('Importieren')` erreichbar.

Alternative: `<label>` im Menü wie bisher. Verworfen, weil ein `menuitem` ein Knopf sein soll und das Menü beim Auswählen schließt.

### D4: Namen der Bedienelemente

Das Konto-Symbol heißt abgemeldet `Anmelden`, angemeldet `Konto <Adresse>`; `title` ist `Anmelden` bzw. die Adresse. Das Menü heißt `Menü`. Einträge haben `role="menuitem"` und kollidieren daher nicht mit `getByRole('button', …)`.

### D5: Symbole und Darstellung

`src/ui/icons.tsx` enthält `MenuIcon`, `PersonIcon` (`filled`), `ExportIcon` und `ImportIcon` als SVG mit `viewBox="0 0 16 16"` und `currentColor`. `PersonIcon` ist ein Ring mit Kopf und Schultern; die Schultern laufen als Pfad auf dem Ring aus, so ist kein `clipPath` mit eindeutiger ID nötig. Gefüllt und ungefüllt haben dieselbe Farbe, eine Signalfarbe wäre für einen Normalzustand zu laut. Die Menüeinträge „Anmelden“ und „Abmelden“ nutzen `PersonIcon`, ein `<hr>` trennt sie vom Export. Das Menü steht auf der Ebene `--z-popover`, links an seinem Knopf ausgerichtet. Das Popover der Angemeldeten behält die Klasse `.account-form`.

Im Code-Schritt tragen die Knöpfe `white-space: nowrap`; der Dialog ist `min(23rem, calc(100vw - 2rem))` breit; nur auf sehr schmalen Bildschirmen dürfen die Knöpfe in eine zweite Reihe rutschen. „Neu senden“ ist ein Textknopf (`.text-button`) mit `--muted` und `margin-right: auto`.

### D6: Bestätigung beim erneuten Senden

Der Schritt `code` erhält `resent: boolean`. Nur eine erfolgreiche zweite Anforderung setzt es; der Hinweis lautet dann „Wir haben einen neuen Code an … geschickt.“ `sendCode` unterscheidet das über den aktuellen Schritt.

### D7: Betreff

`server/auth.ts` setzt den Betreff auf `${code} ist dein Anmeldecode für beatsheet`. Der Code steht vorn, damit er in gekürzten Listen sichtbar bleibt.

### D8: Anpassung bestehender Tests

Geänderte Anforderungen tragen diese Anpassungen:
- Abmelden öffnet zuerst das Konto-Popover
- Adresse im Tooltip des Konto-Symbols statt als Text der Kopfzeile
- `Neuen Code anfordern` wird `Neu senden`
- `Exportieren` öffnet zuerst das Menü und ist `menuitem`

### D9: Anmeldedialog

Das Formular steht in `.backdrop` und `.dialog` wie `ImportDialog`, ein Weg für Menü und Symbol. Ein Klick auf den Hintergrund schließt nicht: Bei einem Modal erwartet das niemand zwingend, anders als bei Popovern, und so kann weder ein Klick ins Menü eines Passwortmanagers noch ein Ziehen aus dem Feld den Dialog schließen. Escape läuft wie bei `ImportDialog` über `onKeyDown`; `tabIndex={-1}` hält den Fokus im Dialog, wenn ein Klick auf Text ihn vom Feld nimmt.

`--backdrop` mischt im Hellmodus `--ctp-text` statt `--ctp-crust`, weil `crust` in Latte hell ist und die Seite aufhellen würde; im Dunkelmodus bleibt `crust`. `.dialog` nutzt `--bg` wie die Popover statt `--surface` und erhält einen Rand, denn `--surface` liegt in beiden Farbschemata nah am Schleier. Das gilt für alle modalen Dialoge, damit sie gleich aussehen.

### D10: Anordnung ohne `gap`

`.field` und das Formular setzten `display: flex` mit `gap`. Ein eingefügtes Kind wird dort zum Flex-Element und bekommt einen eigenen Abstand, auch mit Höhe 0; das erklärt ein leichtes Springen nach unten. `.login-form` und ihre Felder sind Blöcke mit festen Außenabständen an den eigenen Elementen, ein leeres eingefügtes Element nimmt dort keinen Platz ein. Pauschal 1px mehr Platz einzuplanen behöbe das nicht, weil der Abstand vom `gap` kommt. `.field` bleibt für die übrigen Formulare unverändert.

Beide Schritte haben denselben Aufbau: Überschrift, Feld, `.login-message`, Knöpfe. `.login-message` hält mit `min-height` zwei Zeilen frei, das reicht für den längsten Fehlertext, und zeigt entweder den Fehler oder den Hinweis, nie beides. Der Dialog behält so seine Größe und bleibt damit auch mittig stehen. Nur eine sehr lange Adresse oder ein sehr schmaler Bildschirm kann den Platz überschreiten; dann wächst er, statt Text abzuschneiden.

## Risks / Trade-offs

- [Code im Betreff ist in Benachrichtigungen lesbar] → Vom Nutzer gewünscht; der Code gilt 10 Minuten und nur für die Adresse.
- [Bei Klick außerhalb geht der Klick zusätzlich an sein Ziel] → Gleiches Verhalten wie bei den übrigen Popovern.
- [`click()` auf einem Input mit `hidden`] → In aktuellen Browsern zulässig; beim Test im Browser zu prüfen.
- [Optik nur begrenzt testbar] → Artjom prüft Darstellung und Ablauf im Browser.
- [Ursache des Springens nicht nachgestellt] → D10 beruht auf dem CSS, ein Passwortmanager steht hier nicht zur Verfügung; Artjom prüft es mit seinem. Ein eingefügtes Element mit eigener Höhe verschiebt weiterhin.
