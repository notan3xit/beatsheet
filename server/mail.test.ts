import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConsoleMailer, createOutboxMailer } from './mail.ts';

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

const mail = { to: 'ich@example.com', subject: 'Dein Anmeldecode für beatsheet', text: 'Code: 012345\n' };

describe('Mail-Ausgang (design.md D6)', () => {
  it('schreibt eine vollständige Datei nach dem Vertrag von fs4', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'outbox-'));
    dirs.push(dir);
    await createOutboxMailer(dir, () => new Date('2026-11-03T14:25:30.000Z')).send(mail);
    const files = await readdir(dir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^20261103T142530_[A-Za-z0-9-]{1,64}\.json$/);
    const path = join(dir, files[0]!);
    expect((await stat(path)).mode & 0o777).toBe(0o644);
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({
      from_name: 'beatsheet',
      to: ['ich@example.com'],
      subject: mail.subject,
      text: mail.text,
    });
  });

  it('vergibt bei mehreren Mails in derselben Sekunde verschiedene Namen', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'outbox-'));
    dirs.push(dir);
    const mailer = createOutboxMailer(dir, () => new Date('2026-11-03T14:25:30.000Z'));
    await mailer.send(mail);
    await mailer.send(mail);
    expect(new Set(await readdir(dir)).size).toBe(2);
  });

  it('gibt die Mail ohne Ausgang auf der Konsole aus', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await createConsoleMailer().send(mail);
    expect(log.mock.calls.flat().join('\n')).toContain('012345');
    log.mockRestore();
  });
});
