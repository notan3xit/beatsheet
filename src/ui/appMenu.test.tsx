import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AccountApi } from '../account/api';
import { createAccountSession } from '../account/session';
import type { PlaybackSound } from '../audio/deviceSound';
import type { LoaderState } from '../audio/sampleLoader';
import { createSoundSetting, SOUND_STORAGE_KEY } from '../audio/soundSetting';
import { serializeNotebook } from '../persistence/fileFormat';
import { createNotebookStore } from '../state/notebookStore';
import { fakePlayer } from '../test/fakePlayer';
import { songWith } from '../test/songs';
import { App } from './App';
import { CHANGELOG } from './changelog';
import { connectTheme, createThemeSetting, THEME_STORAGE_KEY, type ThemeSetting } from './theme';
import * as download from './download';

const ME = 'ich@example.com';
const VERSION_ENTRY = `Version ${CHANGELOG[0]!.version}`;

function fakeSound({ stored, state = 'ready' }: { stored?: Record<string, string>; state?: LoaderState } = {}) {
  const data = new Map(Object.entries(stored ?? {}));
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
  const loader = { state: () => state, buffers: () => null, load: vi.fn(async () => {}), subscribe: () => () => {} };
  return { setting: createSoundSetting(storage), loader, data } satisfies PlaybackSound & { data: Map<string, string> };
}

function setup(email: string | null = null, sound: PlaybackSound = fakeSound(), theme: ThemeSetting = createThemeSetting(null)) {
  const account: AccountApi = {
    session: vi.fn(async () => email),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, email: ME })),
    logout: vi.fn(async () => ({ ok: true as const })),
  };
  const session = createAccountSession(account);
  session.setEmail(email);
  const user = userEvent.setup();
  render(<App store={createNotebookStore([songWith({ title: 'Hysteria' })])} session={session} player={fakePlayer().player} sound={sound} theme={theme} />);
  return { user, account, session, sound, theme };
}

const menuButton = () => screen.getByRole('button', { name: 'Menü' });
const menu = () => screen.getByRole('menu');
const entries = () => within(menu()).getAllByRole('menuitem').map((item) => item.textContent);
const item = (name: string) => within(menu()).getByRole('menuitem', { name });
const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const expectClosed = () => expect(screen.queryByRole('menu')).not.toBeInTheDocument();

describe('Spec app-header › Menü', () => {
  it('Knopf mit Symbol und ohne Text, links vom Titel', () => {
    setup();
    expect(menuButton()).toHaveTextContent('');
    expect(menuButton()).toHaveAttribute('title', 'Menü');
    expect(menuButton().querySelector('svg')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Beatsheet' });
    expect(menuButton().compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('Menü abgemeldet', async () => {
    const { user } = setup();
    expectClosed();
    await user.click(menuButton());
    expect(entries()).toEqual(['Exportieren', 'Importieren', 'Anmelden', VERSION_ENTRY]);
  });

  it('Menü angemeldet', async () => {
    const { user } = setup(ME);
    await user.click(menuButton());
    expect(entries()).toEqual(['Exportieren', 'Importieren', 'Abmelden', VERSION_ENTRY]);
  });

  it('Trennstrich', async () => {
    const { user } = setup();
    await user.click(menuButton());
    const separator = within(menu()).getAllByRole('separator')[0]!;
    expect(item('Importieren').compareDocumentPosition(separator) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(separator.compareDocumentPosition(item('Anmelden')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('Jeder Eintrag hat ein Symbol', async () => {
    const { user } = setup();
    await user.click(menuButton());
    for (const entry of within(menu()).getAllByRole('menuitem')) expect(entry.querySelector('svg')).toBeInTheDocument();
  });
});

describe('Spec app-header › Menü › Eintrag Version', () => {
  it('Eintrag Version', async () => {
    const { user } = setup();
    await user.click(menuButton());
    const separators = within(menu()).getAllByRole('separator');
    const last = within(menu()).getAllByRole('menuitem').at(-1)!;
    expect(last).toHaveTextContent(VERSION_ENTRY);
    expect(follows(within(menu()).getByRole('group', { name: 'Klang' }), separators.at(-1)!)).toBe(true);
    expect(follows(separators.at(-1)!, last)).toBe(true);
    expect(last.nextElementSibling).toBeNull();
  });

  it('Dialog öffnen', async () => {
    const { user } = setup();
    await user.click(menuButton());
    await user.click(item(VERSION_ENTRY));
    expectClosed();
    const dialog = screen.getByRole('dialog', { name: 'Was ist neu' });
    expect(within(dialog).getAllByRole('article')).toHaveLength(CHANGELOG.length);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Was ist neu' })).not.toBeInTheDocument();
  });
});

describe('Spec app-header › Menü schließen', () => {
  it('Klick außerhalb', async () => {
    const { user } = setup();
    await user.click(menuButton());
    await user.click(screen.getByRole('heading', { name: 'Beatsheet' }));
    expectClosed();
  });

  it('Escape', async () => {
    const { user } = setup();
    await user.click(menuButton());
    await user.keyboard('{Escape}');
    expectClosed();
  });
});

describe('Spec app-header › Export und Import über das Menü', () => {
  it('Exportieren', async () => {
    const save = vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    const { user } = setup();
    await user.click(menuButton());
    await user.click(item('Exportieren'));
    expect(save).toHaveBeenCalledTimes(1);
    expectClosed();
    save.mockRestore();
  });

  it('Importieren', async () => {
    const { user } = setup();
    const input = screen.getByLabelText<HTMLInputElement>('Importieren');
    const openPicker = vi.spyOn(input, 'click');
    await user.click(menuButton());
    await user.click(item('Importieren'));
    expect(openPicker).toHaveBeenCalledTimes(1);
    expectClosed();
    const content = serializeNotebook([songWith({ title: 'Aus der Datei' })], new Date());
    await user.upload(input, new File([content], 'songs.json', { type: 'application/json' }));
    expect(await screen.findByRole('dialog', { name: 'Songs importieren' })).toHaveTextContent('Aus der Datei');
    expectClosed();
  });
});

describe('Spec app-header › Anmelden und Abmelden über das Menü', () => {
  it('Anmelden im Menü', async () => {
    const { user } = setup();
    await user.click(menuButton());
    await user.click(item('Anmelden'));
    expect(within(screen.getByRole('dialog', { name: 'Anmelden' })).getByRole('form', { name: 'Anmelden' })).toBeInTheDocument();
    expectClosed();
  });

  it('Schritt bleibt über beide Wege', async () => {
    const { user } = setup();
    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Anmelden' }));
    await user.type(screen.getByLabelText('Mail-Adresse'), ME);
    await user.click(screen.getByRole('button', { name: 'Code senden' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Anmelden' })).not.toBeInTheDocument();
    await user.click(menuButton());
    await user.click(item('Anmelden'));
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
  });

  it('Abmelden im Menü', async () => {
    const { user, account, session } = setup(ME);
    await user.click(menuButton());
    await user.click(item('Abmelden'));
    await waitFor(() => expect(session.getEmail()).toBeNull());
    expect(account.logout).toHaveBeenCalled();
    expectClosed();
  });
});

const soundOption = (name: string) => within(menu()).getByRole('menuitemradio', { name: new RegExp(`^${name}`) });
const UNAVAILABLE = 'auf diesem Gerät nicht verfügbar';

describe('Spec app-header › Menü › Abschnitt Farbschema', () => {
  it('nach dem Eintrag zum Konto ein Trennstrich und darunter „Farbschema“ mit „Wie System“, „Hell“ und „Dunkel“', async () => {
    const { user } = setup();
    await user.click(menuButton());
    const separators = within(menu()).getAllByRole('separator');
    const group = within(menu()).getByRole('group', { name: 'Farbschema' });
    expect(follows(item('Anmelden'), separators[1]!)).toBe(true);
    expect(follows(separators[1]!, group)).toBe(true);
    expect(within(group).getAllByRole('menuitemradio').map((r) => r.textContent)).toEqual(['Wie System', 'Hell', 'Dunkel']);
  });
});

describe('Spec app-header › Menü › Abschnitt Klang', () => {
  it('nach dem Abschnitt „Farbschema“ ein Trennstrich und darunter „Klang“ mit „DRSKit“ und „Synth“', async () => {
    const { user } = setup();
    await user.click(menuButton());
    const separators = within(menu()).getAllByRole('separator');
    const themeGroup = within(menu()).getByRole('group', { name: 'Farbschema' });
    const group = within(menu()).getByRole('group', { name: 'Klang' });
    expect(follows(themeGroup, separators[2]!)).toBe(true);
    expect(follows(separators[2]!, group)).toBe(true);
    expect(within(group).getAllByRole('menuitemradio').map((r) => r.textContent)).toEqual(['DRSKit', 'Synth']);
  });
});

/** Farbschema-Wahl über einen gemeinsamen Speicher, verbunden mit dem Dokument bei heller Systemeinstellung. */
function themeOnDocument(data = new Map<string, string>()) {
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
  const setting = createThemeSetting(storage);
  const media = { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
  connectTheme(setting, document.documentElement, media);
  return { setting, data };
}
const themeOption = (name: string) => within(within(menu()).getByRole('group', { name: 'Farbschema' })).getByRole('menuitemradio', { name });
const documentTheme = () => document.documentElement.getAttribute('data-theme');

describe('Spec color-theme › Farbschema wählen', () => {
  it('Dunkel wählen: markiert, Menü schließt, App sofort in Mocha', async () => {
    const { setting } = themeOnDocument();
    const { user } = setup(null, fakeSound(), setting);
    expect(documentTheme()).toBe('light');
    await user.click(menuButton());
    await user.click(themeOption('Dunkel'));
    expectClosed();
    expect(documentTheme()).toBe('dark');
    await user.click(menuButton());
    expect(themeOption('Dunkel')).toHaveAttribute('aria-checked', 'true');
    expect(themeOption('Wie System')).toHaveAttribute('aria-checked', 'false');
  });

  it('Zurück zu Wie System: bei heller Systemeinstellung wieder Latte', async () => {
    const { setting } = themeOnDocument(new Map([[THEME_STORAGE_KEY, 'dark']]));
    const { user } = setup(null, fakeSound(), setting);
    expect(documentTheme()).toBe('dark');
    await user.click(menuButton());
    await user.click(themeOption('Wie System'));
    expect(documentTheme()).toBe('light');
  });
});

describe('Spec color-theme › Wahl des Farbschemas pro Gerät', () => {
  it('Vorgabe: „Wie System“ ist gewählt', async () => {
    const { user } = setup();
    await user.click(menuButton());
    expect(themeOption('Wie System')).toHaveAttribute('aria-checked', 'true');
    expect(themeOption('Hell')).toHaveAttribute('aria-checked', 'false');
  });

  it('Wahl bleibt erhalten: nach Neuladen von Anfang an dunkel und „Dunkel“ markiert', async () => {
    const first = themeOnDocument();
    first.setting.set('dark');
    cleanup();
    document.documentElement.removeAttribute('data-theme');
    const { setting } = themeOnDocument(first.data);
    expect(documentTheme()).toBe('dark');
    const { user } = setup(null, fakeSound(), setting);
    await user.click(menuButton());
    expect(themeOption('Dunkel')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Spec playback-sound › Klang wählen', () => {
  it('Synth wählen: als gewählt markiert, Menü schließt, Wahl gespeichert', async () => {
    const { user, sound } = setup();
    await user.click(menuButton());
    await user.click(soundOption('Synth'));
    expectClosed();
    expect(sound.setting.get()).toBe('synth');
    await user.click(menuButton());
    expect(soundOption('Synth')).toHaveAttribute('aria-checked', 'true');
    expect(soundOption('DRSKit')).toHaveAttribute('aria-checked', 'false');
  });
});

describe('Spec playback-sound › Wahl pro Gerät', () => {
  it('Vorgabe: DRSKit gewählt', async () => {
    const { user } = setup();
    await user.click(menuButton());
    expect(soundOption('DRSKit')).toHaveAttribute('aria-checked', 'true');
    expect(soundOption('Synth')).toHaveAttribute('aria-checked', 'false');
  });

  it('Wahl bleibt erhalten: nach Neuladen ist „Synth“ gewählt', async () => {
    const first = fakeSound();
    const { user } = setup(null, first);
    await user.click(menuButton());
    await user.click(soundOption('Synth'));
    cleanup();
    const reloaded = fakeSound({ stored: Object.fromEntries(first.data) });
    expect(reloaded.data.get(SOUND_STORAGE_KEY)).toBe('synth');
    const again = setup(null, reloaded);
    await again.user.click(menuButton());
    expect(soundOption('Synth')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Spec playback-sound › Laden im Hintergrund', () => {
  it('mit DRSKit lädt die App die Aufnahmen ohne Zutun', () => {
    const { sound } = setup();
    expect(sound.loader.load).toHaveBeenCalled();
  });

  it('mit Synth lädt sie nicht, erst nach dem Wechsel auf DRSKit', async () => {
    const sound = fakeSound({ stored: { [SOUND_STORAGE_KEY]: 'synth' } });
    const { user } = setup(null, sound);
    expect(sound.loader.load).not.toHaveBeenCalled();
    await user.click(menuButton());
    await user.click(soundOption('DRSKit'));
    expect(sound.loader.load).toHaveBeenCalled();
  });
});

describe('Spec playback-sound › Ersatz durch den Synth', () => {
  it('Aufnahmen nicht dekodierbar: Hinweis bei DRSKit, Wahl unverändert', async () => {
    const { user, sound } = setup(null, fakeSound({ state: 'unavailable' }));
    await user.click(menuButton());
    expect(soundOption('DRSKit')).toHaveTextContent(UNAVAILABLE);
    expect(soundOption('DRSKit')).toHaveAttribute('aria-checked', 'true');
    expect(sound.setting.get()).toBe('drs');
  });

  it('Erneuter Versuch nach Neustart: bereit, kein Hinweis', async () => {
    const { user } = setup(null, fakeSound({ state: 'ready' }));
    await user.click(menuButton());
    expect(soundOption('DRSKit')).not.toHaveTextContent(UNAVAILABLE);
  });

  it('während des Ladens kein Hinweis', async () => {
    const { user } = setup(null, fakeSound({ state: 'loading' }));
    await user.click(menuButton());
    expect(soundOption('DRSKit')).not.toHaveTextContent(UNAVAILABLE);
  });
});

describe('Spec playback-sound › Herkunft der Aufnahmen', () => {
  it('Namensnennung im Menü mit beiden Verweisen', async () => {
    const { user } = setup();
    await user.click(menuButton());
    const group = within(menu()).getByRole('group', { name: 'Klang' });
    const kit = within(group).getByRole('link', { name: 'DRSKit von DrumGizmo.org' });
    const license = within(group).getByRole('link', { name: 'CC BY 4.0' });
    expect(kit).toHaveAttribute('href', 'https://drumgizmo.org/wiki/doku.php?id=kits:drskit');
    expect(license).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    for (const link of [kit, license]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    }
  });
});
