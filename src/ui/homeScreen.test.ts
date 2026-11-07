import { flavors } from '@catppuccin/palette';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path));
const head = () => new DOMParser().parseFromString(read('index.html').toString(), 'text/html').head;
const attr = (selector: string, name: string) => head().querySelector(selector)?.getAttribute(name);
const manifest = () =>
  JSON.parse(read('public/manifest.json').toString()) as {
    display: string;
    start_url: string;
    scope: string;
    theme_color: string;
    background_color: string;
    icons: { src: string; sizes: string; type: string; purpose?: string }[];
  };

/** Breite und Höhe aus dem Kopf der PNG-Datei unter `public/`. */
function pngSize(href: string) {
  const png = read(`public${href}`);
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
}

describe('Spec home-screen-app › Start in eigenem Fenster', () => {
  it('Manifest startet eigenständig auf der Startseite und ist verlinkt', () => {
    const { display, start_url, scope } = manifest();
    expect({ display, start_url, scope }).toEqual({ display: 'standalone', start_url: '/', scope: '/' });
    expect(attr('link[rel="manifest"]', 'href')).toBe('/manifest.json');
    expect(attr('meta[name="apple-mobile-web-app-capable"]', 'content')).toBe('yes');
    expect(attr('meta[name="mobile-web-app-capable"]', 'content')).toBe('yes');
  });
});

describe('Spec home-screen-app › Name und Icon', () => {
  it.each(manifest().icons.map((icon) => [icon.src, icon] as const))('Icon im Manifest: %s', (_, { src, sizes, type }) => {
    expect(type).toBe('image/png');
    expect(pngSize(src)).toBe(sizes);
  });

  it('Größen für Geräte, darunter ein maskierbares Icon', () => {
    const { icons } = manifest();
    expect(icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('Icon für iOS', () => {
    const href = attr('link[rel="apple-touch-icon"]', 'href')!;
    expect(pngSize(href)).toBe('180x180');
    expect(existsSync(resolve(process.cwd(), 'public/icons/icon.svg'))).toBe(true);
  });
});

describe('Spec home-screen-app › Farbe der Systemleiste', () => {
  const themeColor = (scheme: string) => attr(`meta[name="theme-color"][media="(prefers-color-scheme: ${scheme})"]`, 'content');

  it('Startwert nach Systemeinstellung ist die Fläche der Kopfzeile', () => {
    expect(themeColor('light')).toBe(flavors.latte.colors.mantle.hex);
    expect(themeColor('dark')).toBe(flavors.mocha.colors.mantle.hex);
  });

  it('Manifest nutzt die Farben von Latte', () => {
    expect(manifest().theme_color).toBe(flavors.latte.colors.mantle.hex);
    expect(manifest().background_color).toBe(flavors.latte.colors.base.hex);
  });
});
