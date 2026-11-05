import { useId, useState } from 'react';
import { MAX_NAME, type ProfileError, type ProfileResult } from '../account/profile';
import { PATTERN_COLORS, type MemberProfile, type PatternColor } from '../domain/types';
import { patternStyle } from './patternStyle';
import { useEscape } from './useDismiss';

/** Deutsche Namen der wählbaren Farben (Catppuccin-Akzente ohne Rot). */
export const COLOR_NAMES: Record<PatternColor, string> = {
  blue: 'Blau',
  green: 'Grün',
  peach: 'Pfirsich',
  mauve: 'Malve',
  teal: 'Petrol',
  yellow: 'Gelb',
  pink: 'Rosa',
  sapphire: 'Saphir',
  maroon: 'Weinrot',
  lavender: 'Lavendel',
  sky: 'Himmelblau',
  flamingo: 'Flamingo',
  rosewater: 'Rosenholz',
};

type DialogError = ProfileError | 'empty' | 'initials';

const MESSAGES: Record<DialogError, string> = {
  empty: 'Bitte gib einen Namen ein.',
  initials: 'Das Kürzel muss 1 bis 2 Zeichen ohne Leerzeichen haben.',
  'invalid-profile': 'Name oder Farbe sind ungültig.',
  unauthenticated: 'Bitte melde dich erneut an.',
  unreachable: 'Der Server ist nicht erreichbar.',
};

/**
 * Dialog „Profil“ (member-profiles, design.md D5). Pflicht (`required`): nur Speichern oder Abmelden;
 * beim Ändern zusätzlich Abbrechen und Escape.
 */
export function ProfileDialog({
  initial,
  required,
  onSave,
  onCancel,
  onLogout,
}: {
  initial: MemberProfile;
  required: boolean;
  onSave: (profile: MemberProfile) => Promise<ProfileResult>;
  onCancel: () => void;
  onLogout: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [initials, setInitials] = useState(initial.initials);
  const [color, setColor] = useState(initial.color);
  const [error, setError] = useState<DialogError | null>(null);
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const nameId = useId();
  const initialsId = useId();
  useEscape(!required, onCancel);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('empty');
    // Wie auf dem Server: 1–2 Zeichen ohne Leer- und Steuerzeichen
    const short = initials.trim();
    if ([...short].length < 1 || [...short].length > 2 || /[\s\p{Cc}]/u.test(short)) return setError('initials');
    setBusy(true);
    const result = await onSave({ name: trimmed, initials: short, color });
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="backdrop anchored">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="dialog login-dialog">
        <h2 id={titleId}>Profil</h2>
        <form
          className="login-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="profile-fields">
            <label className="field" htmlFor={nameId}>
              Name
              <input id={nameId} value={name} maxLength={MAX_NAME} onChange={(e) => setName(e.target.value)} autoFocus />
            </label>
            <label className="field" htmlFor={initialsId}>
              Kürzel
              <input id={initialsId} value={initials} onChange={(e) => setInitials(e.target.value)} />
            </label>
          </div>
          <fieldset className="color-choice">
            <legend>Farbe</legend>
            {PATTERN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="color-swatch"
                aria-label={COLOR_NAMES[c]}
                title={COLOR_NAMES[c]}
                aria-pressed={c === color}
                data-color={c}
                style={patternStyle(c)}
                onClick={() => setColor(c)}
              />
            ))}
          </fieldset>
          <div className="profile-preview" aria-hidden="true">
            <span className="avatar colored" style={patternStyle(color)}>
              {initials.trim()}
            </span>
            <span>{name.trim()}</span>
          </div>
          <div className="login-message">{error && <p role="alert">{MESSAGES[error]}</p>}</div>
          <div className="dialog-actions">
            {required ? (
              <button type="button" className="text-button" onClick={onLogout}>
                Abmelden
              </button>
            ) : (
              <button type="button" onClick={onCancel}>
                Abbrechen
              </button>
            )}
            <button type="submit" className="primary" disabled={busy}>
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
