import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import AddFlowLayout, { AddFlowState, useBackToAddMenu } from './AddFlowLayout';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => true }));

function Menu() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/import/instagram', { state: { fromAddMenu: true } satisfies AddFlowState })}>
      Menu
    </button>
  );
}

function ImportPage() {
  const back = useBackToAddMenu();
  return <button onClick={back}>Import</button>;
}

function renderAt(entry: string | { pathname: string; state: AddFlowState }) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<AddFlowLayout menu={<Menu />} />}>
          <Route path="add" element={<Menu />} />
          <Route path="import/instagram" element={<ImportPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AddFlowLayout', () => {
  it('slides a page from the menu over it, and back out to uncover it', async () => {
    renderAt('/add');
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const page = await screen.findByRole('button', { name: 'Import' });
    const layer = page.closest('.fixed') as HTMLElement;
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(layer).toHaveClass('animate-slide-in-from-right');

    fireEvent.click(page);
    expect(layer).toHaveClass('animate-slide-out-to-right');
    expect(page).toBeInTheDocument();

    fireEvent.animationEnd(layer);
    expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('shows a page opened from elsewhere on its own, and back opens the menu', () => {
    renderAt({ pathname: '/import/instagram', state: { fromCatalog: true } });
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });
});
