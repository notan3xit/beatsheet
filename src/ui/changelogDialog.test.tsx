import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChangelogDialog } from './ChangelogDialog';

const ENTRIES = [
  { version: '1.1.0', date: '2030-02-03', items: ['neuer Punkt', 'zweiter Punkt'] },
  { version: '1.0.0', date: '2030-01-02', items: ['alter Punkt'] },
];

function setup() {
  const onClose = vi.fn();
  render(<ChangelogDialog entries={ENTRIES} onClose={onClose} />);
  return { onClose, user: userEvent.setup() };
}

const dialog = () => screen.getByRole('dialog', { name: 'Was ist neu' });

describe('Spec app-header › Dialog „Was ist neu“', () => {
  it('Reihenfolge der Versionen', () => {
    setup();
    const versions = within(dialog()).getAllByRole('article');
    expect(versions.map((v) => within(v).getByRole('heading').textContent)).toEqual(['1.1.0', '1.0.0']);
    expect(versions[0]).toHaveTextContent('03.02.2030');
    expect(within(versions[0]!).getAllByRole('listitem').map((i) => i.textContent)).toEqual(['neuer Punkt', 'zweiter Punkt']);
    expect(within(versions[1]!).getAllByRole('listitem').map((i) => i.textContent)).toEqual(['alter Punkt']);
  });

  it('Schließen', async () => {
    const { user, onClose } = setup();
    expect(screen.getByRole('button', { name: 'Schließen' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape', async () => {
    const { user, onClose } = setup();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
