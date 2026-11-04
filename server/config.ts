import { parseArgs } from 'node:util';

export interface Config {
  port: number;
  host: string;
  data: string;
  secureCookie: boolean;
  appUrl?: string;
  staticDir?: string;
  mailOutbox?: string;
}

/** Konfiguration aus Argumenten und Umgebung; Argumente haben Vorrang. */
export function readConfig(args: string[], env: Record<string, string | undefined>): Config {
  const { values } = parseArgs({
    args,
    options: {
      port: { type: 'string', default: '8787' },
      host: { type: 'string', default: '127.0.0.1' },
      data: { type: 'string', default: './server-data' },
      'insecure-cookie': { type: 'boolean', default: false },
      'app-url': { type: 'string' },
      static: { type: 'string' },
    },
  });
  return {
    port: Number(values.port),
    host: values.host,
    data: values.data,
    secureCookie: !values['insecure-cookie'],
    appUrl: values['app-url'] || env.BEATSHEET_APP_URL || undefined,
    staticDir: values.static,
    mailOutbox: env.MAIL_OUTBOX || undefined,
  };
}
