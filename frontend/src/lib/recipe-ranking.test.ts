import { describe, it, expect } from 'vitest';
import type { Recipe } from '@/data/recipes';
import { seasonOf, seededRandom, suggestionScore, sortBySuggestion, sortBySearchRelevance } from './recipe-ranking';

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe',
    title: 'Recette',
    description: '',
    type: 'plat',
    season: null,
    tags: [],
    rating: 0,
    difficulty: 'facile',
    servings: 4,
    prepTime: 0,
    cookTime: 0,
    diets: [],
    ingredients: [],
    steps: [],
    tested: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '',
    ...overrides,
  };
}

const NOW = new Date('2026-11-06T12:00:00Z'); // autumn
const SEED = 42;
const ids = (recipes: Recipe[]) => recipes.map((r) => r.id);

describe('seasonOf', () => {
  it('maps months to seasons', () => {
    expect(seasonOf(new Date(2026, 2, 1))).toBe('printemps');
    expect(seasonOf(new Date(2026, 4, 31))).toBe('printemps');
    expect(seasonOf(new Date(2026, 5, 1))).toBe('été');
    expect(seasonOf(new Date(2026, 7, 31))).toBe('été');
    expect(seasonOf(new Date(2026, 8, 1))).toBe('automne');
    expect(seasonOf(new Date(2026, 10, 30))).toBe('automne');
    expect(seasonOf(new Date(2026, 11, 1))).toBe('hiver');
    expect(seasonOf(new Date(2026, 1, 28))).toBe('hiver');
  });
});

describe('seededRandom', () => {
  it('is stable for a given seed and id', () => {
    expect(seededRandom(SEED, 'abc')).toBe(seededRandom(SEED, 'abc'));
  });

  it('stays in [0, 1)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const value = seededRandom(seed, `recipe-${seed}`);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('changes with the seed', () => {
    expect(seededRandom(1, 'abc')).not.toBe(seededRandom(2, 'abc'));
  });
});

describe('suggestionScore', () => {
  // Same id and seed, so the random part is the same and only the signal differs.
  const score = (overrides: Partial<Recipe>) => suggestionScore(makeRecipe(overrides), NOW, SEED);

  it('ranks in-season above all-season above out-of-season', () => {
    expect(score({ season: 'automne' })).toBeGreaterThan(score({ season: null }));
    expect(score({ season: null })).toBeGreaterThan(score({ season: 'été' }));
  });

  it('ranks recipes with a photo above recipes without', () => {
    expect(score({ image: 'https://example.com/photo.jpg' })).toBeGreaterThan(score({ image: undefined }));
  });

  it('ranks recipes to test above tested ones', () => {
    expect(score({ tested: false })).toBeGreaterThan(score({ tested: true }));
  });

  it('ranks newer recipes above older ones', () => {
    const lastWeek = score({ createdAt: '2026-10-30T12:00:00Z' });
    const lastYear = score({ createdAt: '2025-11-06T12:00:00Z' });
    expect(lastWeek).toBeGreaterThan(lastYear);
  });

  it('treats a missing creation date as old', () => {
    expect(score({ createdAt: '' })).toBeLessThan(score({ createdAt: '2026-11-01T00:00:00Z' }));
    expect(Number.isFinite(score({ createdAt: '' }))).toBe(true);
  });
});

describe('sortBySuggestion', () => {
  const recipes = Array.from({ length: 30 }, (_, i) => makeRecipe({ id: `recipe-${i}` }));

  it('gives the same order for the same seed', () => {
    expect(ids(sortBySuggestion(recipes, NOW, SEED))).toEqual(ids(sortBySuggestion(recipes, NOW, SEED)));
  });

  it('gives another order for another seed', () => {
    expect(ids(sortBySuggestion(recipes, NOW, 1))).not.toEqual(ids(sortBySuggestion(recipes, NOW, 2)));
  });

  it('does not depend on the input order', () => {
    const reversed = [...recipes].reverse();
    expect(ids(sortBySuggestion(reversed, NOW, SEED))).toEqual(ids(sortBySuggestion(recipes, NOW, SEED)));
  });

  it('does not change the input', () => {
    const before = ids(recipes);
    sortBySuggestion(recipes, NOW, SEED);
    expect(ids(recipes)).toEqual(before);
  });

  it('usually puts a new, in-season recipe to test before an old, out-of-season tested one', () => {
    const favored = makeRecipe({ id: 'favored', season: 'automne', tested: false, createdAt: '2026-11-01T00:00:00Z' });
    const other = makeRecipe({ id: 'other', season: 'été', tested: true, createdAt: '2024-01-01T00:00:00Z' });
    let favoredFirst = 0;
    for (let seed = 0; seed < 100; seed++) {
      if (sortBySuggestion([other, favored], NOW, seed)[0].id === 'favored') favoredFirst++;
    }
    expect(favoredFirst).toBeGreaterThan(90);
  });

  it('always puts a recipe with a photo before an otherwise alike one without', () => {
    const withPhoto = makeRecipe({ id: 'with-photo', image: 'https://example.com/photo.jpg' });
    const withoutPhoto = makeRecipe({ id: 'without-photo' });
    for (let seed = 0; seed < 100; seed++) {
      expect(sortBySuggestion([withoutPhoto, withPhoto], NOW, seed)[0].id).toBe('with-photo');
    }
  });

  it('still lets a new, in-season recipe to test without a photo come first', () => {
    const fresh = makeRecipe({ id: 'fresh', season: 'automne', tested: false, createdAt: '2026-11-01T00:00:00Z' });
    const oldWithPhoto = makeRecipe({ id: 'old-with-photo', season: 'été', image: 'https://example.com/photo.jpg' });
    let freshFirst = 0;
    for (let seed = 0; seed < 100; seed++) {
      if (sortBySuggestion([oldWithPhoto, fresh], NOW, seed)[0].id === 'fresh') freshFirst++;
    }
    expect(freshFirst).toBeGreaterThan(50);
  });

  it('still lets a weaker recipe come first some of the time', () => {
    const inSeason = makeRecipe({ id: 'in-season', season: 'automne' });
    const allSeason = makeRecipe({ id: 'all-season', season: null });
    let allSeasonFirst = 0;
    for (let seed = 0; seed < 100; seed++) {
      if (sortBySuggestion([inSeason, allSeason], NOW, seed)[0].id === 'all-season') allSeasonFirst++;
    }
    expect(allSeasonFirst).toBeGreaterThan(5);
    expect(allSeasonFirst).toBeLessThan(50);
  });
});

describe('sortBySearchRelevance', () => {
  it('puts title matches first, newest first within each group', () => {
    const recipes = [
      makeRecipe({ id: 'ingredient-old', title: 'Ratatouille', createdAt: '2025-01-01T00:00:00Z' }),
      makeRecipe({ id: 'title-old', title: 'Tarte à la tomate', createdAt: '2025-02-01T00:00:00Z' }),
      makeRecipe({ id: 'ingredient-new', title: 'Gaspacho', createdAt: '2026-06-01T00:00:00Z' }),
      makeRecipe({ id: 'title-new', title: 'Salade de tomates', createdAt: '2026-07-01T00:00:00Z' }),
    ];
    expect(ids(sortBySearchRelevance(recipes, ['tomate']))).toEqual([
      'title-new',
      'title-old',
      'ingredient-new',
      'ingredient-old',
    ]);
  });

  it('needs every term in the title to count as a title match', () => {
    const recipes = [
      makeRecipe({ id: 'one-term', title: 'Tarte aux pommes', createdAt: '2026-01-01T00:00:00Z' }),
      makeRecipe({ id: 'both-terms', title: 'Tarte tatin aux pommes', createdAt: '2025-01-01T00:00:00Z' }),
    ];
    expect(ids(sortBySearchRelevance(recipes, ['tarte', 'tatin']))).toEqual(['both-terms', 'one-term']);
  });
});
