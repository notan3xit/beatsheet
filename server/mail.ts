import { randomUUID } from 'node:crypto';
import { chmod, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/**
 * Schreibt Mails nach dem Vertrag von fs4 in den Ausgang (design.md D6): erst als Punktdatei, dann umbenannt.
 * Bei einem Fehler wird nicht erneut geschrieben, weil jede Datei eine eigene Mail ist.
 */
export function createOutboxMailer(dir: string, now: () => Date = () => new Date()): Mailer {
  return {
    async send({ to, subject, text }) {
      const stamp = now().toISOString().replace(/[-:]/g, '').slice(0, 15);
      const name = `${stamp}_${randomUUID()}.json`;
      const temporary = join(dir, `.${name}.tmp`);
      await writeFile(temporary, JSON.stringify({ from_name: 'beatsheet', to: [to], subject, text }), { mode: 0o644 });
      await chmod(temporary, 0o644);
      await rename(temporary, join(dir, name));
    },
  };
}

/** Ohne `$MAIL_OUTBOX` (etwa beim Entwickeln) erscheint die Mail auf der Konsole. */
export function createConsoleMailer(): Mailer {
  return {
    async send({ to, subject, text }) {
      console.log(`Mail an ${to}: ${subject}\n${text}`);
    },
  };
}
