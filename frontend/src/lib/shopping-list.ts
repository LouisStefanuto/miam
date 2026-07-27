import type { Recipe } from '@/data/recipes';
import { displayUnit } from '@/lib/units';

export interface AggregatedIngredient {
  id: string;
  name: string;
  details: string;
}

/** How many servings the user wants for a recipe, defaulting to the recipe's own. */
export function servingsFor(recipe: Recipe, servingsById: Record<string, number>): number {
  const chosen = servingsById[recipe.id];
  return chosen && chosen > 0 ? chosen : recipe.servings;
}

function servingsRatio(recipe: Recipe, servingsById: Record<string, number>): number {
  if (!recipe.servings || recipe.servings <= 0) return 1;
  return servingsFor(recipe, servingsById) / recipe.servings;
}

/** Keeps 2 decimals at most, without trailing zeros: 1.5 stays 1.5, 66.666… becomes 66.67. */
function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Merges the ingredients of every recipe in the cart, scaled to the servings the user picked,
 * summing quantities that share a unit.
 */
export function aggregateIngredients(
  recipes: Recipe[],
  servingsById: Record<string, number> = {},
): AggregatedIngredient[] {
  const map = new Map<string, { quantities: { qty: number | string; unit: string }[] }>();

  for (const recipe of recipes) {
    const ratio = servingsRatio(recipe, servingsById);
    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase().trim();
      if (!map.has(key)) map.set(key, { quantities: [] });
      const numQty = typeof ing.quantity === 'string' ? parseFloat(ing.quantity) : ing.quantity;
      const scaled = numQty && !isNaN(numQty) ? numQty * ratio : ing.quantity;
      map.get(key)!.quantities.push({ qty: scaled, unit: ing.unit });
    }
  }

  const result: AggregatedIngredient[] = [];

  for (const [name, { quantities }] of map) {
    // Group by unit, case-insensitively, but display it as it was first written ("L", not "l")
    const byUnit = new Map<string, { label: string; total: number | null }>();
    for (const { qty, unit } of quantities) {
      const key = unit.toLowerCase().trim();
      const numQty = typeof qty === 'string' ? parseFloat(qty) : qty;
      const entry = byUnit.get(key) ?? { label: unit.trim(), total: null };
      if (numQty && !isNaN(numQty)) {
        entry.total = (entry.total ?? 0) + numQty;
      }
      byUnit.set(key, entry);
    }

    const parts: string[] = [];
    for (const { label, total } of byUnit.values()) {
      if (total != null) {
        const rounded = roundQuantity(total);
        parts.push(label ? `${rounded} ${displayUnit(label, rounded)}` : `${rounded}`);
      }
    }

    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    result.push({ id: name, name: displayName, details: parts.join(' + ') });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Refreshes the displayed list from the recipe ingredients, keeping the order the user chose
 * and leaving out the ones they removed by hand.
 */
export function mergeIngredients(
  previous: AggregatedIngredient[],
  raw: AggregatedIngredient[],
  removedIds: ReadonlySet<string>,
): AggregatedIngredient[] {
  const rawById = new Map(raw.map((i) => [i.id, i]));
  const previousIds = new Set(previous.map((i) => i.id));

  const kept = previous
    .filter((i) => rawById.has(i.id))
    .map((i) => {
      const updated = rawById.get(i.id)!;
      return { ...i, name: updated.name, details: updated.details };
    });

  const added = raw.filter((i) => !previousIds.has(i.id) && !removedIds.has(i.id));

  // Same list as before: hand back the very same array so React can skip the re-render
  const unchanged = added.length === 0
    && kept.length === previous.length
    && kept.every((i, index) => i.name === previous[index].name && i.details === previous[index].details);

  return unchanged ? previous : [...kept, ...added];
}

export function generateShoppingListText(
  recipes: Recipe[],
  ingredients: AggregatedIngredient[],
  checkedIds: Set<string>,
  servingsById: Record<string, number> = {},
): string {
  const lines: string[] = ['Liste de courses', ''];
  if (recipes.length > 0) {
    lines.push(`Recettes (${recipes.length}) :`);
    for (const r of recipes) {
      lines.push(`  - ${r.title} (${servingsFor(r, servingsById)} pers.)`);
    }
    lines.push('');
  }
  lines.push('Ingrédients :');
  for (const ing of ingredients) {
    const check = checkedIds.has(ing.id) ? 'x' : ' ';
    lines.push(`  [${check}] ${ing.details ? `${ing.details} ` : ''}${ing.name}`);
  }
  return lines.join('\n');
}
