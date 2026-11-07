# Design

## Context

`styles.css` hält Tokens in `:root` und überschreibt sie unter `:root[data-theme='dark']`, Muster: `--accent-fill-mix`, `--avatar-mix`. Patternfarben kommen je Element als `--pc` und sind an der Wurzel unbekannt. Tönungen stehen als Literale in den Regeln. Das Mock-up (`~/tools/playwright/mockups/latte-kontrast`) enthält die geprüften Werte für Latte und misst jeden Text der echten App im Browser; es liegt außerhalb des Repos. Auf einer Patternfarbe erreicht Schrift 4,5:1 höchstens bei 26 % Tönung in Latte und 33 % in Mocha.

## Goals / Non-Goals

**Goals:**
- Ein Verstoß fällt beim Testlauf auf, auch bei künftigen Farbänderungen.

**Non-Goals:**
- Andere Bereiche eines Design Systems wie Abstände oder Typografie.
- Browser-Audit im Repo: Playwright bleibt bewusst außerhalb.
- Sichtbare Änderung an Sequencer-Zellen.

## Decisions

**D1: Werte als Tokens je Variante.** Alle Tönungen und Mischanteile der Patternfarbe werden Tokens, sodass der Test das Ergebnis aus den Tokens berechnen kann. Direkt an den Regeln stehen nur noch `var(--pc)` und ein Token. So entfällt auch die Falle des Mock-ups, dass ein von `--pc` abhängiges Token an der Wurzel ungültig ist.

| Token | Latte | Mocha |
|---|---:|---:|
| `--muted` | subtext1 | subtext0 |
| `--danger-text` | 65 % red mit text | red |
| `--tint-groove` | 16 % | 22 % |
| `--tint-fill` | 20 % | 28 % |
| `--tint-strong` | 26 % | 33 % |
| `--tint-card` | 16 % | 16 % |
| `--tint-chip` | 12 % | 22 % |
| `--tint-drag` | 30 % | 31 % |
| `--chip-on-mix` | 30 % | 100 % |
| `--avatar-mix` | 30 % | 100 % |
| `--name-mix` | 30 % | 65 % |
| `--name-tinted-mix` | 18 % | 65 % |
| `--name-strong-mix` | 0 % | 65 % |
| `--edge-mix` | 69 % | 100 % |

Mocha behält seine Werte, wo die Regel eingehalten ist. `--tint-drag` gilt für das gezogene Pattern, das Text auf heute 35 % zeigt und im Mock-up nicht zu sehen war. Das Motiv ist Schmuck ohne Text; sein Mischanteil wird ebenfalls Token, ohne den Wert zu ändern.

**D2: Gedämpfter Text auf Flächen.** `.item`, `.pattern-card.fill`, `.pattern-card.highlighted`, `.insert-strip` und `.kind-badge` setzen lokal `--muted: var(--text)`. Das spart Sonderregeln an jedem Text.

**D3: Regeln stehen an drei Stellen mit je eigener Aufgabe.** `design-system` ist die Quelle. `AGENTS.md` nennt nur die Merksätze und verweist darauf; so sind sie in jeder Sitzung bekannt und jeder Change sieht sie. Tests erzwingen die Prinzipien. Die Farbregeln aus `color-theme` ziehen um, damit es eine Quelle gibt.

**D4: Vier Prinzipien-Tests in `src/ui/designSystem.test.ts`.** Eine kleine Hilfsfunktion löst Tokens aus `styles.css` und der Palette je Variante auf und rechnet `color-mix` aus.
- Lesekontrast: Tabelle aus Schrift-Rolle und Fläche, geprüft in beiden Varianten und mit jeder Patternfarbe.
- Zustandskontrast: Rahmen in Patternfarbe gegen die Seitenfläche.
- Rollen: jede `color:`-Deklaration im CSS nutzt eine Text-Rolle.
- Tönungen: keine Mischung mit `--pc` nennt einen festen Prozentwert, damit der Kontrast-Test nichts übersieht.

Weitere Tests je Element entfallen. Bestehende Tests werden nur angepasst, wo sie alte Werte oder Spec-Namen festschreiben.

**D5: Browser-Messung einmalig bei der Umsetzung.** Das Skript des Mock-ups prüft am Ende in hell und dunkel jeden Text der echten App. Es findet auch Paare, die die Tabelle nicht kennt.

**D6: Zwei Korrekturen nach Durchsicht der dunklen Ansicht.** Der graue Innenrand der ersten Zelle eines Beats entfällt bei gesetzten Zellen: Er erschien nur bei einem Teil der gesetzten Zellen und wirkte wie ein unklarer Rand. Die Fill-Kurzschrift bekommt `--mark-weight`, im Dunkelmodus 500 statt 700, weil helle Schrift auf dunklem Grund kräftiger wirkt. Hat die Schrift keine mittlere Stärke, zeigt der Browser dort die normale.

## Risks / Trade-offs

- [Die Tabelle der Rollen kann vom CSS abweichen, etwa bei neuer Schrift auf neuer Fläche] → Die Rollen- und Tönungs-Tests engen das ein; `AGENTS.md` nennt die Regel. Ein Restrisiko bleibt, ein Browser-Audit im Repo wäre der teurere Schutz.
- [Die dunkle Ansicht ändert sich, ohne dass ein Mock-up dazu gezeigt wurde] → Es sinken nur Tönungen von Fills und Hervorhebungen; Screenshots folgen bei der Umsetzung zur Abnahme.
- [Ähnliche Patternfarben rücken in Latte näher zusammen] → Am Mock-up gesehen und angenommen.
