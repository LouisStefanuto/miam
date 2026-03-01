export type Season = 'printemps' | 'été' | 'automne' | 'hiver';
export type RecipeType = 'apéro' | 'entrée' | 'plat' | 'pâtes' | 'dessert' | 'boisson';
export type Difficulty = 'facile' | 'moyen' | 'difficile';
export type Diet = 'végétarien';

export interface Ingredient {
  name: string;
  quantity: number | string;
  unit: string;
}

export interface Step {
  text: string;
}

export interface Recipe {
  id: string;
  title: string;
  image?: string;
  type: RecipeType;
  season: Season;
  tags: string[];
  rating: number;
  difficulty: Difficulty;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  restTime?: number;
  diets: Diet[];
  ingredients: Ingredient[];
  steps: Step[];
  variants?: string;
  tested: boolean;
  createdAt: string;
  updatedAt: string;
}
