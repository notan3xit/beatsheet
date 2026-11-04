import { chmodSync, cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { freePort, killProcesses, startProcess } from './processHarness.ts';

const TIMEOUT = 30_000;
const COPIED = ['package.json', 'server', 'src/domain', 'src/persistence'];

let dirs: string[] = [];

/** Alle Pfade unterhalb, ohne der Verknüpfung auf `node_modules` zu folgen. */
const listing = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((path) => path !== 'node_modules' && !path.startsWith('node_modules/'))
    .sort();

function setWritable(dir: string, writable: boolean) {
  for (const path of ['', ...listing(dir)]) {
    const full = join(dir, path);
    chmodSync(full, statSync(full).isDirectory() ? (writable ? 0o755 : 0o555) : writable ? 0o644 : 0o444);
  }
}

/** Das Paket: nur die festgelegten Pfade, mit einer einfachen Oberfläche und ohne Schreibrechte. */
function buildPackage() {
  const base = mkdtempSync(join(tmpdir(), 'package-'));
  dirs.push(base);
  const app = join(base, 'app');
  for (const path of COPIED) cpSync(path, join(app, path), { recursive: true });
  mkdirSync(join(app, 'dist'));
  writeFileSync(join(app, 'dist', 'index.html'), '<!doctype html>start');
  symlinkSync(resolve('node_modules'), join(app, 'node_modules'));
  setWritable(app, false);
  return { app, data: join(base, 'data') };
}

afterEach(() => {
  killProcesses();
  for (const base of dirs.splice(0)) {
    setWritable(join(base, 'app'), true);
    rmSync(base, { recursive: true, force: true });
  }
});

// Unter Windows wirken Dateirechte und Verknüpfungen anders (design.md D9)
describe.skipIf(process.platform === 'win32')('Betrieb aus einem Paket', () => {
  it(
    'läuft allein aus den Pfaden des Pakets, ohne Schreibrechte darin',
    async () => {
      const { app, data } = buildPackage();
      const before = listing(app);
      const { url, until } = await startProcess({ data, port: await freePort(), cwd: app, args: ['--static', 'dist'] });

      const page = await fetch(`${url}/`);
      expect(page.status).toBe(200);
      expect(await page.text()).toBe('<!doctype html>start');
      expect((await fetch(`${url}/api/health`)).status).toBe(200);

      const code = await fetch(`${url}/api/auth/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ich@example.com' }),
      });
      expect(code.status).toBe(204);
      await until(/\b\d{6}\b/);

      expect(listing(app)).toEqual(before);
      expect(readdirSync(data)).toEqual(expect.arrayContaining(['beatsheet.sqlite', 'secret']));
    },
    TIMEOUT,
  );
});
