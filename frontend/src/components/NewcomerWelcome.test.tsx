import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import NewcomerWelcome from './NewcomerWelcome';

describe('NewcomerWelcome', () => {
  it('offers manual creation and Instagram, and leaves the other ways to the add menu', () => {
    const onAdd = vi.fn();
    render(<NewcomerWelcome pendingShares={0} onAdd={onAdd} onOpenInbox={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("C'est l'heure d'écrire votre première recette");
    expect(screen.getAllByRole('button')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /Créer manuellement/ }));
    fireEvent.click(screen.getByRole('button', { name: /Instagram/ }));
    expect(onAdd.mock.calls).toEqual([['/recipes/new'], ['/import/instagram']]);
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
