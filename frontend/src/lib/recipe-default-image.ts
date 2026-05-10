import type { RecipeType } from '@/data/recipes';
import apero from '@/assets/recipe-defaults/apero.png';
import boisson from '@/assets/recipe-defaults/boisson.png';
import dessert from '@/assets/recipe-defaults/dessert.png';
import entree from '@/assets/recipe-defaults/entree.png';
import plat from '@/assets/recipe-defaults/plat.png';

const defaults: Record<RecipeType, string> = {
  'apéro': apero,
  'boisson': boisson,
  'dessert': dessert,
  'entrée': entree,
  'plat': plat,
  'pâtes': plat,
};

export function getDefaultRecipeImage(type: RecipeType | undefined): string {
  return type ? defaults[type] ?? plat : plat;
}
