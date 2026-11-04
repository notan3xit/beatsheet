import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { startServer, type Harness } from './testHarness.ts';

let root: string;
let dist: string;
let server: Harness;
const open: Harness[] = [];

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'static-'));
  dist = join(root, 'dist');
  mkdirSync(join(dist, 'assets'), { recursive: true });
  mkdirSync(join(dist, 'api'));
  writeFileSync(join(dist, 'index.html'), '<!doctype html>start');
  writeFileSync(join(dist, 'assets', 'app-abc.js'), 'console.log(1)');
  writeFileSync(join(dist, 'assets', 'app-abc.css'), 'a{}');
  writeFileSync(join(dist, 'daten.unbekannt'), 'x');
  writeFileSync(join(dist, '.env'), 'GEHEIM');
  writeFileSync(join(dist, 'api', 'x'), 'DATEI');
  writeFileSync(join(root, 'secret'), 'GEHEIM');
  // Verknüpfungen brauchen unter Windows besondere Rechte
  if (process.platform !== 'win32') symlinkSync(join(root, 'secret'), join(dist, 'link'));
  server = await startServer({ staticDir: dist });
});

afterAll(async () => {
  await server.close();
  rmSync(root, { recursive: true, force: true });
});

afterEach(async () => {
  await Promise.all(open.splice(0).map((harness) => harness.close()));
});

/** Rohe Anfrage: `fetch` würde `..` im Pfad schon im Client auflösen. */
function raw(path: string, base = server.url, method = 'GET') {
  return new Promise<{ status: number; headers: Record<string, unknown>; body: string }>((resolve, reject) => {
    const { hostname, port } = new URL(base);
    const outgoing = request({ hostname, port, path, method }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode ?? 0, headers: response.headers, body: Buffer.concat(chunks).toString() }));
    });
    outgoing.on('error', reject);
    outgoing.end();
  });
}

describe('Auslieferung der Oberfläche', () => {
  it('liefert / als index.html', async () => {
    const response = await raw('/');
    expect(response.status).toBe(200);
    expect(response.body).toBe('<!doctype html>start');
    expect(response.headers['content-type']).toMatch(/^text\/html/);
  });

  it('liefert Dateien mit passendem Typ, unbekannte Endungen als Binärdaten', async () => {
    const script = await raw('/assets/app-abc.js');
    expect(script.status).toBe(200);
    expect(script.body).toBe('console.log(1)');
    expect(script.headers['content-type']).toMatch(/^text\/javascript/);
    expect((await raw('/assets/app-abc.css')).headers['content-type']).toMatch(/^text\/css/);
    expect((await raw('/daten.unbekannt')).headers['content-type']).toBe('application/octet-stream');
  });

  it('ignoriert die Abfrage im Pfad', async () => {
    expect((await raw('/index.html?v=1')).status).toBe(200);
  });

  it('antwortet auf HEAD mit denselben Kopfzeilen, ohne Körper', async () => {
    const get = await raw('/');
    const head = await raw('/', server.url, 'HEAD');
    expect(head.status).toBe(200);
    expect(head.body).toBe('');
    expect(head.headers['content-type']).toBe(get.headers['content-type']);
    expect(head.headers['content-length']).toBe(get.headers['content-length']);
    expect(head.headers['cache-control']).toBe(get.headers['cache-control']);
  });

  it('antwortet auf unbekannte Dateien mit 404', async () => {
    expect((await raw('/fehlt.js')).status).toBe(404);
  });

  it('liefert andere Methoden als GET und HEAD nicht aus', async () => {
    expect((await raw('/', server.url, 'POST')).status).toBe(404);
  });

  it.each(['/api/x', '/%61pi/x'])('erreicht über %s nur die API', async (path) => {
    const response = await raw(path);
    expect(response.status).toBe(404);
    expect(JSON.parse(response.body)).toEqual({ error: 'not-found' });
  });

  it('antwortet ohne Verzeichnis mit 404', async () => {
    const plain = await startServer();
    open.push(plain);
    expect((await raw('/', plain.url)).status).toBe(404);
  });
});

describe('Kein Zugriff außerhalb des Verzeichnisses', () => {
  it.each(['/../secret', '/%2e%2e/secret', '/..%2fsecret', '/..%5csecret', '/assets/../../secret', '/assets/%2e%2e/%2e%2e/secret'])(
    'liefert %s nicht aus',
    async (path) => {
      const response = await raw(path);
      expect(response.status).toBe(404);
      expect(response.body).not.toContain('GEHEIM');
    },
  );

  it('liefert Punktdateien nicht aus', async () => {
    for (const path of ['/.env', '/%2eenv', '/assets/../.env']) expect((await raw(path)).status).toBe(404);
  });

  it('beantwortet Verzeichnisse mit 404', async () => {
    expect((await raw('/assets')).status).toBe(404);
    expect((await raw('/assets/')).status).toBe(404);
  });

  it.skipIf(process.platform === 'win32')('liefert symbolische Verknüpfungen nicht aus', async () => {
    const response = await raw('/link');
    expect(response.status).toBe(404);
    expect(response.body).not.toContain('GEHEIM');
  });

  it.each(['/%ff%', '/index.html%00', '/%00'])('beantwortet die ungültige Kodierung %s mit 404', async (path) => {
    expect((await raw(path)).status).toBe(404);
  });
});

describe('Zwischenspeichern der Oberfläche', () => {
  it('macht gehashte Dateien ein Jahr unveränderlich', async () => {
    expect((await raw('/assets/app-abc.js')).headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('lässt alle anderen Dateien neu prüfen', async () => {
    expect((await raw('/')).headers['cache-control']).toBe('no-cache');
    expect((await raw('/index.html')).headers['cache-control']).toBe('no-cache');
    expect((await raw('/daten.unbekannt')).headers['cache-control']).toBe('no-cache');
  });
});
