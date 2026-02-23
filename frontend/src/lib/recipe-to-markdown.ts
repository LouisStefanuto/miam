import type { Recipe } from '@/data/recipes';

const difficultyMap: Record<string, string> = {
  facile: '●○○',
  moyen: '●●○',
  difficile: '●●●',
};

const seasonMap: Record<string, string> = {
  printemps: 'Printemps',
  été: 'Été',
  automne: 'Automne',
  hiver: 'Hiver',
};

export function recipeToMarkdown(recipe: Recipe): string {
  const lines: string[] = [];

  lines.push(`# ${recipe.title}`);
  lines.push('');

  // Info line
  const infoParts: string[] = [
    recipe.type.charAt(0).toUpperCase() + recipe.type.slice(1),
    seasonMap[recipe.season] ?? recipe.season,
    difficultyMap[recipe.difficulty] ?? recipe.difficulty,
    `${recipe.servings} pers.`,
  ];
  if (recipe.diets.length > 0) {
    infoParts.push(recipe.diets.join(', '));
  }
  lines.push(infoParts.join(' · '));

  // Times
  const timeParts: string[] = [];
  if (recipe.prepTime) timeParts.push(`Prépa: ${recipe.prepTime} min`);
  if (recipe.cookTime) timeParts.push(`Cuisson: ${recipe.cookTime} min`);
  if (recipe.restTime) timeParts.push(`Repos: ${recipe.restTime} min`);
  if (timeParts.length > 0) {
    lines.push(timeParts.join(' · '));
  }

  // Tags
  if (recipe.tags.length > 0) {
    lines.push(`Tags: ${recipe.tags.join(', ')}`);
  }

  // Ingredients
  lines.push('');
  lines.push('## Ingrédients');
  for (const ing of recipe.ingredients) {
    const qty = ing.quantity ? `${ing.quantity} ` : '';
    const unit = ing.unit ? `${ing.unit} ` : '';
    lines.push(`- ${qty}${unit}${ing.name}`);
  }

  // Steps
  if (recipe.steps.length > 0) {
    lines.push('');
    lines.push('## Préparation');
    recipe.steps.forEach((step, i) => {
      lines.push(`${i + 1}. ${step.text}`);
    });
  }

  // Variants
  if (recipe.variants) {
    lines.push('');
    lines.push('## Variantes');
    lines.push(recipe.variants);
  }

  return lines.join('\n');
}
