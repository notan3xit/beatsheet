import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';

const WAIT = 15_000;
const children: ChildProcess[] = [];

export function freePort() {
  return new Promise<number>((resolve) => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const { port } = probe.address() as { port: number };
      probe.close(() => resolve(port));
    });
  });
}

/** Startet den echten Serverprozess; die Konsole sammelt Startmeldung und Mails. */
export async function startProcess({ data, port, cwd, args = [] }: { data: string; port: number; cwd?: string; args?: string[] }) {
  const env = { ...process.env };
  delete env.MAIL_OUTBOX;
  delete env.BEATSHEET_APP_URL;
  const child = spawn(process.execPath, ['--import', './server/register.ts', 'server/main.ts', '--port', String(port), '--data', data, ...args], { env, cwd });
  children.push(child);
  let output = '';
  child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
  child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
  const until = async (pattern: RegExp) => {
    const deadline = Date.now() + WAIT;
    while (Date.now() < deadline) {
      const match = pattern.exec(output);
      if (match) return match;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`Nicht in der Ausgabe gefunden: ${pattern}\n${output}`);
  };
  await until(/beatsheet-Server auf/);
  return { child, until, url: `http://127.0.0.1:${port}` };
}

export function killProcesses() {
  for (const child of children.splice(0)) child.kill('SIGKILL');
}
