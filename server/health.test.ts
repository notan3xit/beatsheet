import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorOf, startServer, type Harness } from './testHarness.ts';

const open: Harness[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(open.splice(0).map((harness) => harness.close()));
});

describe('Health-Pfad', () => {
  it('antwortet ohne Sitzung mit 200', async () => {
    const server = await startServer();
    open.push(server);
    const response = await server.api('GET', '/api/health');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('antwortet mit 503, wenn die Datenbank nicht lesbar ist', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const server = await startServer();
    open.push(server);
    server.db.close();
    const response = await server.api('GET', '/api/health');
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await errorOf(response)).toBe('unhealthy');
  });
});
