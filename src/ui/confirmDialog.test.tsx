import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ConfirmProvider, useConfirm, type ConfirmRequest } from './ConfirmDialog';

function Asker({ request }: { request: ConfirmRequest }) {
  const confirm = useConfirm();
  const [answer, setAnswer] = useState('offen');
  return (
    <>
      <button type="button" onClick={() => void confirm(request).then((ok) => setAnswer(String(ok)))}>
        Fragen
      </button>
      <output>{answer}</output>
    </>
  );
}

function setup(request: ConfirmRequest) {
  const user = userEvent.setup();
  render(
    <ConfirmProvider>
      <Asker request={request} />
    </ConfirmProvider>,
  );
  return user;
}

const request: ConfirmRequest = {
  title: 'Groove auf diesen Stand setzen?',
  content: <ul><li>Folge</li></ul>,
  confirmLabel: 'Wiederherstellen',
};

describe('Bestätigungsdialog mit Titel und Inhalt', () => {
  it('zeigt Titel, Inhalt und die Beschriftung der Bestätigung', async () => {
    const user = setup(request);
    await user.click(screen.getByRole('button', { name: 'Fragen' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Groove auf diesen Stand setzen?' });
    expect(dialog).toHaveTextContent('Folge');
    await user.click(screen.getByRole('button', { name: 'Wiederherstellen' }));
    expect(screen.getByRole('status')).toHaveTextContent('true');
  });

  it('„Abbrechen“ und Escape liefern false', async () => {
    const user = setup(request);
    await user.click(screen.getByRole('button', { name: 'Fragen' }));
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(screen.getByRole('status')).toHaveTextContent('false');

    await user.click(screen.getByRole('button', { name: 'Fragen' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('false');
  });

  it('Ohne Bestätigung nur „Abbrechen“', async () => {
    const user = setup({ ...request, canConfirm: false });
    await user.click(screen.getByRole('button', { name: 'Fragen' }));
    expect(screen.queryByRole('button', { name: 'Wiederherstellen' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
  });
});
