import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecipeCatalogSkeleton } from './RecipeCardSkeleton';

describe('RecipeCatalogSkeleton', () => {
  it('announces the loading to screen readers', () => {
    render(<RecipeCatalogSkeleton />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des recettes');
  });

  it.each(['card', 'row'] as const)('renders the requested number of %s placeholders', (variant) => {
    render(<RecipeCatalogSkeleton variant={variant} count={5} />);
    expect(screen.getAllByTestId('recipe-skeleton')).toHaveLength(5);
  });
});
