import { describe, expect, it } from 'vitest';
import { readConfig } from './config.ts';

describe('Konfiguration des Servers', () => {
  it('nimmt die Adresse der App aus der Umgebung', () => {
    expect(readConfig([], { BEATSHEET_APP_URL: 'https://a.example' }).appUrl).toBe('https://a.example');
  });

  it('gibt --app-url den Vorrang', () => {
    expect(readConfig(['--app-url', 'https://b.example'], { BEATSHEET_APP_URL: 'https://a.example' }).appUrl).toBe('https://b.example');
  });

  it('behandelt eine leere Variable wie eine fehlende', () => {
    expect(readConfig([], { BEATSHEET_APP_URL: '' }).appUrl).toBeUndefined();
    expect(readConfig([], {}).appUrl).toBeUndefined();
  });

  it('liest das Verzeichnis der Oberfläche', () => {
    expect(readConfig(['--static', 'dist'], {}).staticDir).toBe('dist');
    expect(readConfig([], {}).staticDir).toBeUndefined();
  });

  it('liest den Mail-Ausgang aus der Umgebung', () => {
    expect(readConfig([], { MAIL_OUTBOX: '/srv/outbox' }).mailOutbox).toBe('/srv/outbox');
    expect(readConfig([], {}).mailOutbox).toBeUndefined();
  });

  it('behält die bisherigen Vorgaben', () => {
    expect(readConfig([], {})).toMatchObject({ port: 8787, host: '127.0.0.1', data: './server-data', secureCookie: true });
    expect(readConfig(['--port', '21000', '--host', '0.0.0.0', '--data', '/data', '--insecure-cookie'], {})).toMatchObject({
      port: 21000,
      host: '0.0.0.0',
      data: '/data',
      secureCookie: false,
    });
  });
});
