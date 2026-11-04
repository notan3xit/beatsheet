# account-auth Specification

## Purpose

Identifiziert Nutzer über ihre Mail-Adresse, ohne Passwort: Anmeldung mit einem Einmalcode per Mail, Sitzung im Browser, Abmelden. Grundlage für den Zugriff auf geteilte Workbooks.

## Requirements

### Requirement: Anmeldecode anfordern
Der Nutzer MUST in der App einen Anmeldecode für eine Mail-Adresse anfordern können. Der Server MUST an diese Adresse eine Mail mit einem sechsstelligen Code senden, der 10 Minuten gültig ist. Die Antwort MUST für bekannte und unbekannte Adressen gleich sein. Eine Anforderung MUST einen zuvor angeforderten Code derselben Adresse ungültig machen.

#### Scenario: Code anfordern
- **WHEN** der Nutzer „Anmelden“ wählt, „ich@example.com“ eingibt und „Code senden“ wählt
- **THEN** geht an ich@example.com eine Mail mit einem sechsstelligen Code
- **AND** die App fragt nach dem Code

#### Scenario: Ungültige Adresse
- **WHEN** der Nutzer „keine-adresse“ eingibt und „Code senden“ wählt
- **THEN** wird keine Mail gesendet und die App meldet, dass die Adresse ungültig ist

#### Scenario: Neuer Code ersetzt den alten
- **WHEN** der Nutzer für dieselbe Adresse nach mehr als 30 Sekunden erneut einen Code anfordert
- **THEN** gilt nur noch der neue Code

### Requirement: Mit Code anmelden
Gibt der Nutzer den gültigen Code seiner Adresse ein, MUST er angemeldet sein. Beim ersten Anmelden einer Adresse MUST ein Konto für sie entstehen. Ein Code MUST nach erfolgreicher Anmeldung ungültig sein. Groß-/Kleinschreibung und Leerzeichen am Rand der Adresse MUST keine Rolle spielen.

#### Scenario: Erste Anmeldung
- **WHEN** der Nutzer den erhaltenen Code für ich@example.com eingibt
- **THEN** ist er angemeldet und die App zeigt „ich@example.com“

#### Scenario: Erneute Anmeldung mit anderer Schreibweise
- **GIVEN** ein Konto für ich@example.com
- **WHEN** sich der Nutzer mit „ Ich@Example.com “ und dem erhaltenen Code anmeldet
- **THEN** ist er mit demselben Konto angemeldet

#### Scenario: Code zweimal verwenden
- **WHEN** ein Code, mit dem bereits angemeldet wurde, erneut eingegeben wird
- **THEN** wird die Anmeldung abgelehnt

### Requirement: Falscher oder abgelaufener Code
Ein falscher oder abgelaufener Code MUST abgelehnt werden, mit einer verständlichen Meldung. Nach 5 falschen Eingaben MUST der Code ungültig sein, auch wenn danach der richtige eingegeben wird.

#### Scenario: Falscher Code
- **WHEN** der Nutzer einen falschen Code eingibt
- **THEN** bleibt er abgemeldet und die App meldet, dass der Code nicht stimmt

#### Scenario: Abgelaufener Code
- **WHEN** der Nutzer einen Code 11 Minuten nach der Anforderung eingibt
- **THEN** bleibt er abgemeldet und die App meldet, dass der Code abgelaufen ist

#### Scenario: Zu viele Fehlversuche
- **WHEN** der Nutzer fünfmal einen falschen Code und danach den richtigen eingibt
- **THEN** bleibt er abgemeldet und die App bittet ihn, einen neuen Code anzufordern

### Requirement: Begrenzung der Code-Anforderungen
Je Adresse MUST höchstens ein Code alle 30 Sekunden und höchstens 10 Codes pro Stunde versendet werden. Über alle Adressen MUST der Server höchstens 50 Anmeldemails pro Stunde versenden. Eine abgelehnte Anforderung MUST keine Mail auslösen, und die App MUST melden, dass später erneut angefordert werden kann.

#### Scenario: Zweite Anforderung innerhalb von 30 Sekunden
- **WHEN** der Nutzer für dieselbe Adresse zweimal innerhalb von 30 Sekunden einen Code anfordert
- **THEN** geht nur eine Mail hinaus und die App meldet, dass er kurz warten soll

#### Scenario: Elfte Anforderung in einer Stunde
- **WHEN** für dieselbe Adresse innerhalb einer Stunde zum elften Mal ein Code angefordert wird, jeweils mehr als 30 Sekunden nach dem vorigen
- **THEN** geht keine elfte Mail hinaus

### Requirement: Sitzung
Nach der Anmeldung MUST der Nutzer angemeldet bleiben, auch nach Neuladen oder Schließen der App, bis er sich abmeldet oder 90 Tage seit der Anmeldung vergangen sind. Die App MUST die Adresse des angemeldeten Nutzers zeigen.

#### Scenario: Neuladen
- **WHEN** der angemeldete Nutzer die App neu lädt
- **THEN** zeigt die App weiterhin seine Adresse

#### Scenario: Sitzung abgelaufen
- **WHEN** seit der Anmeldung mehr als 90 Tage vergangen sind
- **THEN** ist der Nutzer abgemeldet

### Requirement: Abmelden
Der angemeldete Nutzer MUST sich abmelden können. Die Sitzung MUST danach auch auf dem Server ungültig sein. Songs, die zum Account gehören, MUST im Account erhalten bleiben und das Gerät nach `account-songs` verlassen. Nur lokale Songs MUST unverändert auf dem Gerät bleiben.

#### Scenario: Abmelden
- **WHEN** der angemeldete Nutzer „Abmelden“ wählt
- **THEN** zeigt die App wieder „Anmelden“
- **AND** seine Songs stehen unverändert im Account und erscheinen bei der nächsten Anmeldung wieder

#### Scenario: Alte Sitzung nach dem Abmelden
- **WHEN** nach dem Abmelden mit dem Sitzungsschlüssel der beendeten Sitzung angefragt wird
- **THEN** behandelt der Server die Anfrage als nicht angemeldet

### Requirement: Schutz von Codes und Sitzungen
Codes und Sitzungsschlüssel MUST auf dem Server nicht im Klartext gespeichert werden. Der Sitzungsschlüssel MUST für Skripte im Browser unzugänglich sein und MUST nicht bei Anfragen von fremden Seiten mitgesendet werden.

#### Scenario: Gespeicherte Daten
- **WHEN** nach einer Anmeldung die Datenbank des Servers gelesen wird
- **THEN** enthält sie weder den Code noch den Sitzungsschlüssel im Klartext

#### Scenario: Sitzungs-Cookie
- **WHEN** der Server nach der Anmeldung die Sitzung setzt
- **THEN** ist das Cookie `HttpOnly` und `SameSite=Lax`

### Requirement: Nutzung ohne Anmeldung
Die App MUST ohne Anmeldung und ohne erreichbaren Server vollständig nutzbar bleiben; Songs MUST weiterhin lokal gespeichert werden. Ist der Server nicht erreichbar, MUST ein Anmeldeversuch mit einer verständlichen Meldung scheitern.

#### Scenario: Server nicht erreichbar
- **WHEN** die App startet und der Server nicht erreichbar ist
- **THEN** zeigt sie „Anmelden“ und Songs lassen sich wie bisher anlegen und bearbeiten

#### Scenario: Anmelden ohne Server
- **WHEN** der Nutzer bei nicht erreichbarem Server einen Code anfordert
- **THEN** meldet die App, dass der Server nicht erreichbar ist
