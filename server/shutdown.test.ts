import type { ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { freePort, killProcesses, startProcess } from './processHarness.ts';

const TIMEOUT = 30_000;
const EMAIL = 'ich@example.com';

const dirs: string[] = [];

afterEach(() => {
  killProcesses();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

async function login(url: string, until: (pattern: RegExp) => Promise<RegExpExecArray>) {
  const post = (path: string, body: unknown) => fetch(`${url}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  await post('/api/auth/code', { email: EMAIL });
  const code = (await until(/\b(\d{6})\b/))[1];
  const response = await post('/api/auth/verify', { email: EMAIL, code });
  return response.headers.get('set-cookie')!.split(';')[0]!;
}

function exit(child: ChildProcess) {
  return new Promise<{ code: number | null; signal: NodeJS.Signals | null; ms: number }>((resolve) => {
    const start = Date.now();
    child.once('exit', (code, signal) => resolve({ code, signal, ms: Date.now() - start }));
  });
}

// Unter Windows beendet `kill` den Prozess hart, ohne dass ein Signal ankommt
describe.skipIf(process.platform === 'win32')('Beenden auf SIGTERM', () => {
  it(
    'endet mit offenem Ereigniskanal innerhalb von zwei Sekunden mit Code 0',
    async () => {
      const data = mkdtempSync(join(tmpdir(), 'shutdown-'));
      dirs.push(data);
      const { child, until, url } = await startProcess({ data, port: await freePort(), args: ['--insecure-cookie'] });
      const cookie = await login(url, until);
      const events = await fetch(`${url}/api/events`, { headers: { Cookie: cookie } });
      expect(events.status).toBe(200);
      await events.body!.getReader().read();

      const ended = exit(child);
      child.kill('SIGTERM');
      const result = await ended;
      expect(result.code).toBe(0);
      expect(result.signal).toBeNull();
      expect(result.ms).toBeLessThan(2000);
    },
    TIMEOUT,
  );

  it(
    'behält bestätigte Daten über den Neustart',
    async () => {
      const data = mkdtempSync(join(tmpdir(), 'shutdown-'));
      dirs.push(data);
      const port = await freePort();
      const first = await startProcess({ data, port, args: ['--insecure-cookie'] });
      const cookie = await login(first.url, first.until);
      const ended = exit(first.child);
      first.child.kill('SIGTERM');
      await ended;

      const second = await startProcess({ data, port, args: ['--insecure-cookie'] });
      const session = await fetch(`${second.url}/api/auth/session`, { headers: { Cookie: cookie } });
      expect(session.status).toBe(200);
      expect(await session.json()).toMatchObject({ email: EMAIL });
    },
    TIMEOUT,
  );
});
