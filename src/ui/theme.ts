import { flavors, type CatppuccinFlavor } from '@catppuccin/palette';

/** Alle Palettenfarben einer Variante als --ctp-<name>. */
function variables(flavor: CatppuccinFlavor): string {
  return flavor.colorEntries.map(([name, color]) => `  --ctp-${name}: ${color.hex};`).join('\n');
}

/** Catppuccin Latte (hell, Standard) und Mocha (dunkel) nach Systemeinstellung (design.md D1). */
export function buildThemeCss(): string {
  return [
    `:root {\n  color-scheme: light;\n${variables(flavors.latte)}\n}`,
    `@media (prefers-color-scheme: dark) {\n:root {\n  color-scheme: dark;\n${variables(flavors.mocha)}\n}\n}`,
  ].join('\n');
}

/** Fügt das Farbschema einmalig in das Dokument ein; vor dem ersten Rendern aufrufen. */
export function installTheme(doc: Document = document): void {
  if (doc.getElementById('ctp-theme')) return;
  const style = doc.createElement('style');
  style.id = 'ctp-theme';
  style.textContent = buildThemeCss();
  doc.head.prepend(style);
}
