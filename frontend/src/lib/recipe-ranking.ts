import type { Recipe, Season } from '@/data/recipes';

// Weights of the signals in the suggestion score. Each signal is in [0, 1].
const RECENCY_WEIGHT = 1;
const RECENCY_HALF_LIFE_DAYS = 30;
const SEASON_WEIGHT = 1;
const TO_TEST_WEIGHT = 0.5;
const RANDOM_WEIGHT = 1.5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Season of a date (meteorological seasons, northern hemisphere). */
export function seasonOf(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'printemps';
  if (month >= 5 && month <= 7) return 'été';
  if (month >= 8 && month <= 10) return 'automne';
  return 'hiver';
}

/** A new random seed for the suggestion order. */
export function newShuffleSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

/** Number in [0, 1) that depends only on the seed and the recipe id. */
export function seededRandom(seed: number, id: string): number {
  // FNV-1a over the id, starting from the seed, then a murmur3 finalizer.
  let h = 2166136261 ^ seed;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 2 ** 32;
}

/**
 * Score of a recipe in the "Suggestions" order: higher for recipes that are
 * new, in season or still to test, plus a random part so the catalog does
 * not always start with the same recipes.
 */
export function suggestionScore(recipe: Recipe, now: Date, seed: number): number {
  const created = Date.parse(recipe.createdAt);
  const ageDays = Number.isNaN(created) ? Infinity : Math.max(0, (now.getTime() - created) / DAY_MS);
  const recency = 0.5 ** (ageDays / RECENCY_HALF_LIFE_DAYS);

  // Recipes without a season fit any time of the year, but less than an in-season one.
  const season = recipe.season === null ? 0.5 : recipe.season === seasonOf(now) ? 1 : 0;

  const toTest = recipe.tested ? 0 : 1;

  return (
    RECENCY_WEIGHT * recency +
    SEASON_WEIGHT * season +
    TO_TEST_WEIGHT * toTest +
    RANDOM_WEIGHT * seededRandom(seed, recipe.id)
  );
}

/** Recipes in the "Suggestions" order. The same seed always gives the same order. */
export function sortBySuggestion(recipes: Recipe[], now: Date, seed: number): Recipe[] {
  const scores = new Map(recipes.map((r) => [r.id, suggestionScore(r, now, seed)]));
  return [...recipes].sort((a, b) => scores.get(b.id)! - scores.get(a.id)!);
}

/**
 * Search results in a fixed order: recipes whose title contains every term
 * come first, then the ones that match on ingredients or tags. Newest first
 * within each group.
 */
export function sortBySearchRelevance(recipes: Recipe[], terms: string[]): Recipe[] {
  const lowerTerms = terms.map((t) => t.toLowerCase());
  const titleMatches = (r: Recipe) => lowerTerms.every((t) => r.title.toLowerCase().includes(t));
  return [...recipes].sort(
    (a, b) => Number(titleMatches(b)) - Number(titleMatches(a)) || b.createdAt.localeCompare(a.createdAt),
  );
}
