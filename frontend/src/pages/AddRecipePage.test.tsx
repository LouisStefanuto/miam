import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AddRecipePage from './AddRecipePage';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => true }));
vi.mock('@/components/CatalogLayout', () => ({ useOverlayClose: () => ({ requestClose: vi.fn() }) }));
vi.mock('@/components/BeaverCatchGame', () => ({ default: () => <p>Jeu du castor</p> }));

function renderMenu() {
  render(
    <MemoryRouter initialEntries={['/add']}>
      <Routes>
        <Route path="add" element={<AddRecipePage />} />
        <Route path="import/json" element={<p>Import JSON</p>} />
      </Routes>
    </MemoryRouter>,
  );
  const tile = screen.getByRole('button', { name: /JSON/ });
  return { tile, carrot: tile.querySelector('.absolute') as HTMLElement };
}

describe('AddRecipePage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the JSON import on a tap of its tile', () => {
    const { tile } = renderMenu();
    fireEvent.pointerDown(tile);
    fireEvent.pointerUp(tile);
    fireEvent.click(tile);
    expect(screen.getByText('Import JSON')).toBeInTheDocument();
  });

  it('wiggles the carrot while the JSON tile is held, then opens the beaver game', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const { tile, carrot } = renderMenu();

    fireEvent.pointerDown(tile);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(carrot.style.transform).toContain('rotate');

    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(await screen.findByText('Jeu du castor')).toBeInTheDocument();

    // Letting go after the game opened does not also open the import.
    fireEvent.pointerUp(tile);
    fireEvent.click(tile);
    expect(screen.queryByText('Import JSON')).not.toBeInTheDocument();
  });
});
