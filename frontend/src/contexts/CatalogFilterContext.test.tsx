import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { CatalogFilterProvider, useCatalogFilters } from './CatalogFilterContext';

function Catalog() {
  const { currentPage, setCurrentPage, setSearchQuery, setSearchTags, filters, setFilters } = useCatalogFilters();
  return (
    <div>
      <span data-testid="page">{currentPage}</span>
      <button onClick={() => setCurrentPage(3)}>go to page 3</button>
      <button onClick={() => setSearchQuery('tarte')}>search</button>
      <button onClick={() => setSearchQuery('')}>search empty</button>
      <button onClick={() => setSearchTags(['dessert'])}>tag</button>
      <button onClick={() => setFilters({ ...filters, type: 'dessert' })}>filter</button>
    </div>
  );
}

/** Mimics the router: the catalog unmounts on /cart and remounts on return. */
function App() {
  const [onCart, setOnCart] = useState(false);
  return (
    <CatalogFilterProvider>
      <button onClick={() => setOnCart((v) => !v)}>toggle cart</button>
      {onCart ? <p>cart</p> : <Catalog />}
    </CatalogFilterProvider>
  );
}

const page = () => screen.getByTestId('page').textContent;
const click = (name: string) => fireEvent.click(screen.getByText(name));

describe('CatalogFilterContext pagination', () => {
  it('keeps the current page when leaving the catalog and coming back', () => {
    render(<App />);
    click('go to page 3');
    expect(page()).toBe('3');

    click('toggle cart');
    expect(screen.getByText('cart')).toBeInTheDocument();
    click('toggle cart');

    expect(page()).toBe('3');
  });

  it.each(['search', 'tag', 'filter'])('goes back to page 1 on a new %s', (action) => {
    render(<App />);
    click('go to page 3');
    click(action);
    expect(page()).toBe('1');
  });

  it('keeps the page when the search query does not change', () => {
    render(<App />);
    click('go to page 3');
    click('search empty');
    expect(page()).toBe('3');
  });
});
