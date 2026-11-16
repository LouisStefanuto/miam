import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import NewcomerWelcome from './NewcomerWelcome';

describe('NewcomerWelcome', () => {
  it('offers every way to add a recipe that works today', () => {
    const onAdd = vi.fn();
    render(<NewcomerWelcome pendingShares={0} onAdd={onAdd} onOpenInbox={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Votre livre de recettes est tout neuf');
    expect(screen.queryByRole('button', { name: /Photos/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Créer manuellement/ }));
    fireEvent.click(screen.getByRole('button', { name: /Instagram/ }));
    fireEvent.click(screen.getByRole('button', { name: /JSON/ }));
    expect(onAdd.mock.calls).toEqual([['/recipes/new'], ['/import/instagram'], ['/import/json']]);
  });

  it('points to the inbox only when someone shared recipes', () => {
    const onOpenInbox = vi.fn();
    const { rerender } = render(<NewcomerWelcome pendingShares={0} onAdd={vi.fn()} onOpenInbox={onOpenInbox} />);
    expect(screen.queryByRole('button', { name: /partagée/ })).not.toBeInTheDocument();

    rerender(<NewcomerWelcome pendingShares={2} onAdd={vi.fn()} onOpenInbox={onOpenInbox} />);
    fireEvent.click(screen.getByRole('button', { name: /2 recettes partagées avec vous/ }));
    expect(onOpenInbox).toHaveBeenCalledOnce();
  });
});
