import { randomInt } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { createApp } from './app.ts';
import { readConfig } from './config.ts';
import { loadSecret, openDatabase } from './db.ts';
import { createConsoleMailer, createOutboxMailer } from './mail.ts';

/** Startet den Server (design.md D3). */
const config = readConfig(process.argv.slice(2), process.env);

mkdirSync(config.data, { recursive: true, mode: 0o700 });
const db = openDatabase(join(config.data, 'beatsheet.sqlite'));

const server = createServer(
  createApp({
    db,
    secret: loadSecret(config.data),
    now: () => new Date(),
    newCode: () => String(randomInt(0, 1_000_000)).padStart(6, '0'),
    mail: config.mailOutbox ? createOutboxMailer(config.mailOutbox) : createConsoleMailer(),
    secureCookie: config.secureCookie,
    appUrl: config.appUrl,
    staticDir: config.staticDir,
  }),
);

server.listen(config.port, config.host, () => {
  console.log(`beatsheet-Server auf http://${config.host}:${config.port}, Mail ${config.mailOutbox ? `über ${config.mailOutbox}` : 'auf der Konsole'}`);
});

// Offene Ereigniskanäle würden das Warten auf Verbindungen sonst nie beenden (server-deployment, design.md D7)
process.once('SIGTERM', () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  server.closeAllConnections();
});
