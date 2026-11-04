import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { errorOf, startServer, type Harness } from './testHarness.ts';

const HOUR = 3_600_000;
const OWNER = 'ich@example.com';
const ANNA = 'anna@example.com';

interface Workbook {
  id: string;
  title: string;
  owner: string;
  members: string[];
}

let h: Harness;
let owner: string;

beforeEach(async () => {
  h = await startServer({ appUrl: 'https://beatsheet.example/' });
  owner = await h.login(OWNER);
});

afterEach(() => h.close());

const create = async (cookie: string, title?: string) => {
  const response = await h.api('POST', '/api/workbooks', { cookie, body: title === undefined ? {} : { title } });
  expect(response.status).toBe(201);
  return (await response.json()) as Workbook;
};
/** Geteilte Workbooks; der eigene Bestand steht in `personal.test.ts`. */
const list = async (cookie: string) =>
  ((await (await h.api('GET', '/api/workbooks', { cookie })).json()) as { workbooks: (Workbook & { personal?: boolean })[] }).workbooks.filter((w) => !w.personal);
const invite = (id: string, email: string, cookie = owner) => h.api('POST', `/api/workbooks/${id}/members`, { cookie, body: { email } });
const removeMember = (id: string, email: string, cookie = owner) =>
  h.api('DELETE', `/api/workbooks/${id}/members/${encodeURIComponent(email)}`, { cookie });

describe('Workbook anlegen', () => {
  it('legt ein Workbook mit Titel an, der Nutzer ist Besitzer und einziges Mitglied', async () => {
    const workbook = await create(owner, 'Band');
    expect(workbook).toMatchObject({ title: 'Band', owner: OWNER, members: [OWNER] });
    expect(await list(owner)).toEqual([workbook]);
  });

  it('nennt ein Workbook ohne Titel „Neues Workbook“', async () => {
    expect((await create(owner)).title).toBe('Neues Workbook');
    expect((await create(owner, '   ')).title).toBe('Neues Workbook');
  });

  it('weist einen Titel ab, der kein Text ist oder einen Zeilenumbruch enthält', async () => {
    for (const title of [42, 'Band\nBcc: x@example.com', 'x'.repeat(201)]) {
      const response = await h.api('POST', '/api/workbooks', { cookie: owner, body: { title } });
      expect(response.status).toBe(400);
      expect(await errorOf(response)).toBe('invalid-title');
    }
  });

  it('listet nur Workbooks, in denen der Nutzer Mitglied ist', async () => {
    await create(owner, 'Band');
    expect(await list(await h.login(ANNA))).toEqual([]);
  });
});

describe('Workbook umbenennen', () => {
  it('lässt den Besitzer umbenennen, und alle Mitglieder sehen den neuen Titel', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    const response = await h.api('PATCH', `/api/workbooks/${id}`, { cookie: owner, body: { title: 'Band 2026' } });
    expect(response.status).toBe(200);
    expect((await list(await h.login(ANNA)))[0]!.title).toBe('Band 2026');
  });

  it('lehnt einen leeren Titel ab und behält den bisherigen', async () => {
    const { id } = await create(owner, 'Band');
    const response = await h.api('PATCH', `/api/workbooks/${id}`, { cookie: owner, body: { title: '  ' } });
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe('invalid-title');
    expect((await list(owner))[0]!.title).toBe('Band');
  });

  it('verbietet das Umbenennen für Mitglieder, die nicht Besitzer sind', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    const response = await h.api('PATCH', `/api/workbooks/${id}`, { cookie: await h.login(ANNA), body: { title: 'Meins' } });
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe('not-owner');
  });
});

describe('Workbook löschen', () => {
  it('löscht ein leeres Workbook für alle Mitglieder', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    expect((await h.api('DELETE', `/api/workbooks/${id}`, { cookie: owner })).status).toBe(204);
    expect(await list(owner)).toEqual([]);
    expect(await list(await h.login(ANNA))).toEqual([]);
  });

  it('weist das Löschen eines Workbooks mit Songs ab', async () => {
    const { id } = await create(owner, 'Band');
    h.db.prepare('INSERT INTO songs (id, workbook_id, doc, deleted, updated_at) VALUES (?, ?, ?, 0, 0)').run('s', id, new Uint8Array());
    const response = await h.api('DELETE', `/api/workbooks/${id}`, { cookie: owner });
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe('not-empty');
  });

  it('verbietet das Löschen für Mitglieder, die nicht Besitzer sind', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    const response = await h.api('DELETE', `/api/workbooks/${id}`, { cookie: await h.login(ANNA) });
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe('not-owner');
  });
});

describe('Mitglied einladen', () => {
  it('macht die Person sofort zum Mitglied und schickt eine Mail mit Titel und Besitzer', async () => {
    const { id } = await create(owner, 'Band');
    expect((await invite(id, ' Anna@Example.com ')).status).toBe(204);
    expect((await list(owner))[0]!.members).toEqual([OWNER, ANNA]);
    expect(h.mails).toHaveLength(1);
    const [mail] = h.mails;
    expect(mail!.to).toBe(ANNA);
    expect(mail!.subject).toBe(`${OWNER} hat dich zu „Band“ eingeladen`);
    expect(mail!.text).toContain('Band');
    expect(mail!.text).toContain(OWNER);
    expect(mail!.text).toContain('https://beatsheet.example/');
  });

  it('lässt den Link ohne konfigurierte App-Adresse weg', async () => {
    await h.close();
    h = await startServer();
    owner = await h.login(OWNER);
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    expect(h.mails[0]!.text).not.toContain('http');
  });

  it('zeigt das Workbook bei der ersten Anmeldung nach der Einladung', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    expect((await list(await h.login(ANNA))).map((w) => w.id)).toEqual([id]);
  });

  it('weist ungültige Adressen ab', async () => {
    const { id } = await create(owner, 'Band');
    const response = await invite(id, 'keine-adresse');
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe('invalid-email');
    expect(h.mails).toHaveLength(0);
  });

  it('weist vorhandene Mitglieder ohne Mail ab', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    h.mails.length = 0;
    const response = await invite(id, ANNA);
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe('already-member');
    expect(h.mails).toHaveLength(0);
  });

  it('verbietet das Einladen für Mitglieder, die nicht Besitzer sind', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    const response = await invite(id, 'ben@example.com', await h.login(ANNA));
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe('not-owner');
  });
});

describe('Begrenzung der Einladungen', () => {
  it('lehnt die einundzwanzigste Einladung einer Stunde ohne Mitgliedschaft und Mail ab', async () => {
    const { id } = await create(owner, 'Band');
    for (let i = 0; i < 20; i++) expect((await invite(id, `p${i}@example.com`)).status).toBe(204);
    h.mails.length = 0;
    const response = await invite(id, 'p20@example.com');
    expect(response.status).toBe(429);
    expect(await errorOf(response)).toBe('rate-limited');
    expect(h.mails).toHaveLength(0);
    expect((await list(owner))[0]!.members).not.toContain('p20@example.com');

    h.advance(HOUR + 1);
    expect((await invite(id, 'p20@example.com')).status).toBe(204);
  });

  it('zählt Einladungen und Anmeldecodes gemeinsam gegen die Gesamtgrenze', async () => {
    // Drei Besitzer mit je einem Anmeldecode, dazu 47 Einladungen: zusammen 50 Mails
    const owners = [owner, await h.login('b@example.com'), await h.login('c@example.com')];
    let invited = 0;
    for (const [o, cookie] of owners.entries()) {
      const { id } = await create(cookie, `Band ${o}`);
      for (let i = 0; i < 20 && invited < 47; i++, invited++) expect((await invite(id, `p${invited}@example.com`, cookie)).status).toBe(204);
    }
    const third = (await list(owners[2]!))[0]!.id;
    expect((await invite(third, 'zuviel@example.com', owners[2])).status).toBe(429);
    const code = await h.api('POST', '/api/auth/code', { body: { email: 'neu@example.com' } });
    expect(code.status).toBe(429);
  });
});

describe('Mitglied entfernen und austreten', () => {
  it('lässt den Besitzer ein Mitglied entfernen', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    const anna = await h.login(ANNA);
    expect((await removeMember(id, ANNA)).status).toBe(204);
    expect((await list(owner))[0]!.members).toEqual([OWNER]);
    expect(await list(anna)).toEqual([]);
  });

  it('lässt ein Mitglied das Workbook verlassen', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    const anna = await h.login(ANNA);
    expect((await removeMember(id, ANNA, anna)).status).toBe(204);
    expect(await list(anna)).toEqual([]);
  });

  it('verbietet dem Besitzer, sein Workbook zu verlassen', async () => {
    const { id } = await create(owner, 'Band');
    expect((await removeMember(id, OWNER)).status).toBe(403);
    expect((await list(owner))[0]!.members).toEqual([OWNER]);
  });

  it('verbietet Mitgliedern, andere zu entfernen', async () => {
    const { id } = await create(owner, 'Band');
    await invite(id, ANNA);
    await invite(id, 'ben@example.com');
    expect((await removeMember(id, 'ben@example.com', await h.login(ANNA))).status).toBe(403);
    expect((await list(owner))[0]!.members).toContain('ben@example.com');
  });

  it('antwortet 404 für eine Adresse, die nicht Mitglied ist', async () => {
    const { id } = await create(owner, 'Band');
    expect((await removeMember(id, ANNA)).status).toBe(404);
  });
});

describe('Zugriff nur für Mitglieder', () => {
  it('behandelt das Workbook für Nichtmitglieder wie nicht vorhanden und ändert nichts', async () => {
    const { id } = await create(owner, 'Band');
    const stranger = await h.login(ANNA);
    const requests: Promise<Response>[] = [
      h.api('PATCH', `/api/workbooks/${id}`, { cookie: stranger, body: { title: 'Meins' } }),
      h.api('DELETE', `/api/workbooks/${id}`, { cookie: stranger }),
      invite(id, 'ben@example.com', stranger),
      removeMember(id, OWNER, stranger),
    ];
    for (const response of await Promise.all(requests)) expect(response.status).toBe(404);
    expect((await list(owner))[0]).toMatchObject({ title: 'Band', members: [OWNER] });
  });

  it('antwortet ohne Sitzung mit 401', async () => {
    const { id } = await create(owner, 'Band');
    const requests: Promise<Response>[] = [
      h.api('GET', '/api/workbooks'),
      h.api('POST', '/api/workbooks', { body: {} }),
      h.api('PATCH', `/api/workbooks/${id}`, { body: { title: 'x' } }),
      h.api('DELETE', `/api/workbooks/${id}`),
      h.api('POST', `/api/workbooks/${id}/members`, { body: { email: ANNA } }),
      h.api('DELETE', `/api/workbooks/${id}/members/${ANNA}`),
    ];
    for (const response of await Promise.all(requests)) expect(response.status).toBe(401);
  });
});

describe('Körpergrenze', () => {
  it('erlaubt unter /api/workbooks größere Körper als 4 KB und begrenzt sie auf 2 MB', async () => {
    const large = await h.api('POST', '/api/workbooks', { cookie: owner, body: { title: 'Band', padding: 'x'.repeat(10_000) } });
    expect(large.status).toBe(201);
    const tooLarge = await h.api('POST', '/api/workbooks', { cookie: owner, body: { padding: 'x'.repeat(2 * 1024 * 1024) } });
    expect(tooLarge.status).toBe(413);
  });

  it('lässt die übrigen Endpunkte bei 4 KB', async () => {
    const response = await h.api('POST', '/api/auth/code', { body: { email: ANNA, padding: 'x'.repeat(10_000) } });
    expect(response.status).toBe(413);
  });
});
