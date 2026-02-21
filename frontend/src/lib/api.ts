import { Recipe, RecipeType, Season, Difficulty } from '@/data/recipes';

const API_BASE = 'http://localhost:8000/api';

// --- Mapping: Frontend (French) ↔ Backend (English/numeric) ---

const seasonToBackend: Record<Season, string> = {
  printemps: 'spring',
  été: 'summer',
  automne: 'autumn',
  hiver: 'winter',
};

const seasonToFrontend: Record<string, Season> = {
  spring: 'printemps',
  summer: 'été',
  autumn: 'automne',
  winter: 'hiver',
};

const categoryToBackend: Record<RecipeType, string> = {
  'apéro': 'apero',
  'entrée': 'entree',
  'plat': 'plat',
  'pâtes': 'pâtes',
  'dessert': 'dessert',
  'boisson': 'boisson',
};

const categoryToFrontend: Record<string, RecipeType> = {
  apero: 'apéro',
  entree: 'entrée',
  plat: 'plat',
  'pâtes': 'pâtes',
  dessert: 'dessert',
  boisson: 'boisson',
};

const difficultyToBackend: Record<Difficulty, number> = {
  facile: 1,
  moyen: 2,
  difficile: 3,
};

const difficultyToFrontend: Record<number, Difficulty> = {
  1: 'facile',
  2: 'moyen',
  3: 'difficile',
};

// --- Backend response types ---

interface BackendIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

interface BackendImage {
  id: string;
  caption: string | null;
  display_order: number;
}

interface BackendRecipe {
  id: string;
  title: string;
  description: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  rest_time_minutes: number | null;
  season: string | null;
  category: string;
  is_veggie: boolean;
  difficulty: number | null;
  number_of_people: number | null;
  rate: number | null;
  tested: boolean;
  tags: string[];
  preparation: string[];
  ingredients: BackendIngredient[];
  images: BackendImage[];
  sources: { type: string; raw_content: string }[];
}

// --- Conversion functions ---

export function getImageUrl(imageId: string): string {
  return `${API_BASE}/images/${imageId}`;
}

function backendToFrontend(b: BackendRecipe): Recipe {
  return {
    id: b.id,
    title: b.title,
    image: b.images.length > 0 ? getImageUrl(b.images[0].id) : undefined,
    type: categoryToFrontend[b.category] ?? 'plat',
    season: b.season ? (seasonToFrontend[b.season] ?? 'été') : 'été',
    tags: b.tags,
    rating: b.rate ?? 3,
    difficulty: b.difficulty ? (difficultyToFrontend[b.difficulty] ?? 'moyen') : 'moyen',
    servings: b.number_of_people ?? 4,
    prepTime: b.prep_time_minutes ?? 0,
    cookTime: b.cook_time_minutes ?? 0,
    restTime: b.rest_time_minutes ?? undefined,
    diets: b.is_veggie ? ['végétarien'] : [],
    ingredients: b.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity ?? '',
      unit: i.unit ?? '',
    })),
    steps: b.preparation.map((text) => ({ text })),
    tested: b.tested,
    createdAt: '',
    updatedAt: '',
  };
}

function frontendToBackendCreate(r: Recipe) {
  return {
    title: r.title,
    description: '',
    prep_time_minutes: r.prepTime || null,
    cook_time_minutes: r.cookTime || null,
    rest_time_minutes: r.restTime || null,
    season: r.season ? seasonToBackend[r.season] : null,
    category: categoryToBackend[r.type] ?? 'plat',
    is_veggie: r.diets.includes('végétarien'),
    difficulty: r.difficulty ? difficultyToBackend[r.difficulty] : null,
    number_of_people: r.servings || null,
    rate: r.rating || null,
    tested: r.tested,
    tags: r.tags,
    preparation: r.steps.map((s) => s.text).filter((t) => t.trim()),
    ingredients: r.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name,
        quantity: typeof i.quantity === 'string' ? (parseFloat(i.quantity) || null) : (i.quantity || null),
        unit: i.unit || null,
      })),
  };
}

// --- API functions ---

export async function fetchRecipes(): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE}/recipes`);
  if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.status}`);
  const data: BackendRecipe[] = await res.json();
  return data.map(backendToFrontend);
}

export async function fetchRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`${API_BASE}/recipes/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch recipe: ${res.status}`);
  const data: BackendRecipe = await res.json();
  return backendToFrontend(data);
}

export async function updateRecipe(recipe: Recipe): Promise<Recipe> {
  const body = frontendToBackendCreate(recipe);
  const res = await fetch(`${API_BASE}/recipes/${recipe.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update recipe: ${res.status}`);
  const data: BackendRecipe = await res.json();
  return backendToFrontend(data);
}

export async function createRecipe(recipe: Recipe): Promise<{ id: string }> {
  const body = frontendToBackendCreate(recipe);
  const res = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create recipe: ${res.status}`);
  const result = await res.json();

  // Upload image if present (base64 data URL)
  if (recipe.image?.startsWith('data:')) {
    await uploadImage(result.id, recipe.image);
  }

  return result;
}

async function uploadImage(recipeId: string, dataUrl: string): Promise<void> {
  const blob = await fetch(dataUrl).then((r) => r.blob());
  const ext = blob.type.split('/')[1] || 'jpg';
  const formData = new FormData();
  formData.append('recipe_id', recipeId);
  formData.append('image', blob, `recipe.${ext}`);
  const res = await fetch(`${API_BASE}/images`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to upload image: ${res.status}`);
}
