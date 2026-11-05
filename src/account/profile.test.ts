import { afterEach, describe, expect, it, vi } from 'vitest';
import { PATTERN_COLORS } from '../domain/types';
import { createHttpProfileApi, initialsOfName, suggestedColor, suggestedName } from './profile';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Spec account-profile › Vorbelegung des Profils', () => {
  it('Name aus der Adresse', () => {
    expect(suggestedName('artjom.weyand@example.com')).toBe('Artjom Weyand');
    expect(suggestedName('anna_maria-berg@example.com')).toBe('Anna Maria Berg');
    expect(suggestedName('ich@example.com')).toBe('Ich');
  });

  it('Kürzel aus dem Namen', () => {
    expect(initialsOfName('Artjom Weyand')).toBe('AW');
    expect(initialsOfName('Kai Meyer')).toBe('KM');
    expect(initialsOfName('Ich')).toBe('IC');
    expect(initialsOfName('  ')).toBe('');
  });

  it('Der Vorschlag bleibt in den Grenzen eines Namens', () => {
    expect(suggestedName(`${'a'.repeat(60)}@example.com`)).toHaveLength(40);
    expect(suggestedName('...@example.com')).toBe('...');
  });

  it('Gleiche Farbe für dieselbe Adresse', () => {
    expect(suggestedColor('ich@example.com')).toBe(suggestedColor('ich@example.com'));
    expect(PATTERN_COLORS).toContain(suggestedColor('ich@example.com'));
  });

  it('Verschiedene Adressen verteilen sich auf die Farben, nie Rot', () => {
    const colors = new Set(Array.from({ length: 200 }, (_, i) => suggestedColor(`person${i}@example.com`)));
    expect(colors.size).toBeGreaterThan(5);
    expect(colors).not.toContain('red');
  });
});

describe('HTTP-Client des Profils (member-profiles, design.md D4)', () => {
  it('lädt und speichert', async () => {
    const fetch = vi.fn(async () => json(200, { profile: { name: 'Artjom', initials: 'AR', color: 'green' } }));
    vi.stubGlobal('fetch', fetch);
    const api = createHttpProfileApi();
    expect(await api.load()).toEqual({ ok: true, profile: { name: 'Artjom', initials: 'AR', color: 'green' } });
    expect(await api.save({ name: 'Artjom', initials: 'AR', color: 'green' })).toEqual({ ok: true, profile: { name: 'Artjom', initials: 'AR', color: 'green' } });
    expect(fetch).toHaveBeenLastCalledWith('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Artjom', initials: 'AR', color: 'green' }),
    });
  });

  it('Gespeichertes Profil ohne Kürzel (Spec account-profile › Vorbelegung des Kürzels)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { profile: { name: 'Artjom Weyand', color: 'green' } })));
    expect(await createHttpProfileApi().load()).toEqual({ ok: true, profile: { name: 'Artjom Weyand', initials: 'AW', color: 'green' } });
  });

  it('kein Profil, ungültige Angaben, nicht erreichbar', async () => {
    const responses = [json(200, { profile: null }), json(400, { error: 'invalid-profile' }), json(502), new Error('offline')];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const next = responses.shift()!;
        if (next instanceof Error) throw next;
        return next;
      }),
    );
    const api = createHttpProfileApi();
    expect(await api.load()).toEqual({ ok: true, profile: null });
    expect(await api.save({ name: '', initials: 'AB', color: 'green' })).toEqual({ ok: false, error: 'invalid-profile' });
    expect(await api.load()).toEqual({ ok: false, error: 'unreachable' });
    expect(await api.load()).toEqual({ ok: false, error: 'unreachable' });
  });
});
