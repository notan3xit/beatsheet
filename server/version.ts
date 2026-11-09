import pkg from '../package.json' with { type: 'json' };

/** Header, in dem die App ihre Version mitsendet (outdated-app, design.md D2). */
export const VERSION_HEADER = 'Beatsheet-Version';

/** Version aus `package.json`; das Paket enthält sie neben `server`. */
export const PACKAGE_VERSION: string = pkg.version;

const parse = (version: string) => (/^\d+\.\d+\.\d+$/.test(version) ? version.split('.').map(Number) : null);

/** Fehlt die Version der App, ist sie ungültig oder älter als die des Servers? */
export function isOutdated(app: string | undefined, server: string): boolean {
  const a = app === undefined ? null : parse(app);
  const s = parse(server)!;
  if (!a) return true;
  for (let i = 0; i < 3; i++) if (a[i] !== s[i]) return a[i]! < s[i]!;
  return false;
}
