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

export type UserRole = 'owner' | 'editor' | 'reader';

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
  userRole?: UserRole;
  ownerName?: string;
}

export interface RecipeShare {
  id: string;
  recipe_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string;
  shared_with_email?: string;
  shared_with_name?: string;
  role: string;
  status: string;
  created_at?: string;
}

export interface PendingShare {
  id: string;
  recipe_id: string;
  recipe_title?: string;
  shared_by_name?: string;
  role: string;
  created_at?: string;
}

export interface Collaborator {
  id: string;
  shared_with_email?: string;
  shared_with_name?: string;
  role: string;
  status: string;
}
