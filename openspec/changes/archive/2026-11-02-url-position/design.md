# Design

## Context

Die Ansicht liegt im `notebookStore` (`openSongId`, `view: list | book | pattern`), geändert über `openSong`, `openPattern`, `backToBook`, `backToList` und indirekt über `deleteSong`/`remove`. `openSong` prüft die ID nicht; `openPattern` setzt einen offenen Song voraus. `main.tsx` lädt die Songs aus IndexedDB, erzeugt den Store und rendert `App`. Ausgeliefert wird die App als statische Dateien mit relativem `base` (`./`), ohne Server-Fallback auf `index.html`.

## Goals / Non-Goals

**Goals:**
- Adresse und Ansicht in beide Richtungen synchron halten (App → Adresse, Adresse → App), inklusive Start und Browser-Verlauf.
- Store-Schnittstelle unverändert lassen; die Verbindung lebt außerhalb von Store und React-Komponenten.

**Non-Goals:**
- Ein Router-Paket. Drei Ansichten rechtfertigen keine Abhängigkeit.
- Auswahl, Popover oder Scrollposition in der Adresse.

## Decisions

### D1: Hash-Routing

Format: `#/` (Song-Liste), `#/songs/<songId>`, `#/songs/<songId>/patterns/<patternId>`; IDs mit `encodeURIComponent`. Hash, weil Pfad-URLs beim Neuladen auf statischem Hosting ohne Fallback 404 liefern und `base: './'` relative Assetpfade voraussetzt.

Alternative: History-API mit Pfaden. Verworfen wegen fehlendem Server-Fallback (pub, `vite preview` ginge, das Release-Hosting nicht).

### D2: Reine Routenfunktionen (`src/state/route.ts`)

```ts
type Route = { kind: 'list' } | { kind: 'book'; songId: string } | { kind: 'pattern'; songId: string; patternId: string };
routeOf(state: NotebookState): Route
hashOf(route: Route): string
parseHash(hash: string): Route   // nicht lesbar -> { kind: 'list' }
```

Ohne Browser-APIs, damit sie wie die übrige Logik in `state` testbar bleiben.

### D3: Verbindung (`src/ui/urlSync.ts`)

`connectUrl(store, win = window): () => void`:

1. **Start:** `parseHash(location.hash)` anwenden (siehe 3), danach die Adresse per `history.replaceState` auf `hashOf(routeOf(state))` setzen (Korrektur ohne Verlaufseintrag).
2. **App → Adresse:** `store.subscribe`; ändert sich `hashOf(routeOf(state))` gegenüber `location.hash`, `history.pushState(null, '', hash)` (Verlaufseintrag). Änderungen am Inhalt ändern die Route nicht und schreiben daher nichts.
3. **Adresse → App:** `hashchange` und `popstate` → Route anwenden:
   - `list` → `backToList()`
   - `book` → Song existiert? `openSong(id)` : `backToList()`
   - `pattern` → Song existiert? (`openSong` falls nötig, dann Pattern existiert? `openPattern` : Doppelseite) : `backToList()`
   - Danach, falls die angewandte Route von der Adresse abweicht: `replaceState` mit der korrigierten Adresse.
   - Während des Anwendens wird das Schreiben aus Schritt 2 unterdrückt (Flag), damit Zurück/Vor keinen neuen Eintrag erzeugt.
4. Angewandt wird nur, wenn sich die Route vom aktuellen Zustand unterscheidet, damit z. B. ein erneutes `openSong` nicht die Undo-Historie im Pattern-Editor leert.

`main.tsx` ruft `connectUrl(store)` nach dem Erzeugen des Stores und vor dem ersten Rendern auf, damit kein Flackern über die Song-Liste entsteht.

### D4: Löschen

`deleteSong` und `remove` ändern die Ansicht im Store; die Adresse folgt über Schritt 2 mit einem Verlaufseintrag. Geht der Nutzer danach zurück, nennt die Adresse ein gelöschtes Objekt und wird nach Schritt 3 korrigiert.

## Risks / Trade-offs

- [Links funktionieren nur auf dem Gerät, auf dem der Song liegt] → bewusst (Proposal); auf anderen Geräten greift „Unbekannte Adresse“.
- [`pushState` erzeugt kein `hashchange`, `location.hash =` schon] → Schreiben immer über `pushState`/`replaceState`, Lesen über `hashchange` und `popstate`; beide Ereignisse führen zur selben, idempotenten Anwendung (Schritt 4).
- [jsdom unterstützt `pushState`/`popstate`/`hashchange` nur eingeschränkt] → Tests lösen die Ereignisse explizit aus und prüfen `location.hash`.

## Ergebnis der Browser-Prüfung

Am 2026-11-02 vom Nutzer im Release-Build (pub) geprüft und freigegeben: Neuladen bleibt auf Doppelseite bzw. Pattern-Editor, Zurück/Vor wechseln die Ansichten, Links öffnen dieselbe Ansicht, unbekannte IDs führen zur Song-Liste.
