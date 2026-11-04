import { randomInt } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { createApp } from './app.ts';
import { loadSecret, openDatabase } from './db.ts';
import { createConsoleMailer, createOutboxMailer } from './mail.ts';

/** Startet den Server (design.md D3); Konfiguration über Argumente, Mail-Ausgang aus `$MAIL_OUTBOX`. */
const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '8787' },
    host: { type: 'string', default: '127.0.0.1' },
    data: { type: 'string', default: './server-data' },
    'insecure-cookie': { type: 'boolean', default: false },
    'app-url': { type: 'string' },
  },
});

mkdirSync(values.data, { recursive: true, mode: 0o700 });
const outbox = process.env.MAIL_OUTBOX;

const server = createServer(
  createApp({
    db: openDatabase(join(values.data, 'beatsheet.sqlite')),
    secret: loadSecret(values.data),
    now: () => new Date(),
    newCode: () => String(randomInt(0, 1_000_000)).padStart(6, '0'),
    mail: outbox ? createOutboxMailer(outbox) : createConsoleMailer(),
    secureCookie: !values['insecure-cookie'],
    appUrl: values['app-url'],
  }),
);

server.listen(Number(values.port), values.host, () => {
  console.log(`beatsheet-Server auf http://${values.host}:${values.port}, Mail ${outbox ? `über ${outbox}` : 'auf der Konsole'}`);
});
