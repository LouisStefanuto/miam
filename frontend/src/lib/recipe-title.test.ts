import { describe, expect, it } from 'vitest';
import { displayTitle } from './recipe-title';

describe('displayTitle', () => {
  it('keeps only the first letter of fully capitalised words', () => {
    expect(displayTitle('POULET BASQUAISE')).toBe('Poulet Basquaise');
    expect(displayTitle('Tarte au CITRON')).toBe('Tarte au Citron');
  });

  it('handles accents, apostrophes, hyphens and punctuation', () => {
    expect(displayTitle('CRÈME BRÛLÉE')).toBe('Crème Brûlée');
    expect(displayTitle("Tarte à L'ANCIENNE")).toBe("Tarte à L'ancienne");
    expect(displayTitle('SAINT-JACQUES poêlées')).toBe('Saint-Jacques poêlées');
    expect(displayTitle('Salade (TOMATES, FETA)')).toBe('Salade (Tomates, Feta)');
  });

  it('leaves other words as typed', () => {
    expect(displayTitle('Tarte à la tomate')).toBe('Tarte à la tomate');
    expect(displayTitle("Burger façon McDonald's")).toBe("Burger façon McDonald's");
    expect(displayTitle('Gâteau au chocolat à 2 ingrédients')).toBe('Gâteau au chocolat à 2 ingrédients');
    expect(displayTitle('Plat A ou B')).toBe('Plat A ou B');
  });
});
