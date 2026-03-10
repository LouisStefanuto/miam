import { Recipe, RecipeType, Season, Difficulty } from '@/data/recipes';
import { API_BASE } from '@/lib/config';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('miam-auth-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Wrapper around fetch that auto-injects auth headers and handles 401
 * by clearing the session and redirecting to the login page.
 */
async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...init?.headers, ...authHeaders() },
  });
  if (res.status === 401) {
    localStorage.removeItem('miam-auth-token');
    localStorage.removeItem('miam-auth-user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  return res;
}

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
  display_order: number;
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

function getImageUrl(imageId: string): string {
  return `${API_BASE}/images/${imageId}`;
}

function getImageIdFromUrl(url: string): string | null {
  const prefix = `${API_BASE}/images/`;
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  return null;
}

async function deleteImage(imageId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/images/${imageId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(`Failed to delete image: ${res.status}`);
}

function backendToFrontend(b: BackendRecipe): Recipe {
  return {
    id: b.id,
    title: b.title,
    image: b.images.length > 0 ? getImageUrl(b.images[0].id) : undefined,
    type: categoryToFrontend[b.category] ?? 'plat',
    season: b.season ? (seasonToFrontend[b.season] ?? 'été') : 'été',
    tags: b.tags,
    rating: b.rate ?? 0,
    difficulty: b.difficulty ? (difficultyToFrontend[b.difficulty] ?? 'moyen') : 'moyen',
    servings: b.number_of_people ?? 4,
    prepTime: b.prep_time_minutes ?? 0,
    cookTime: b.cook_time_minutes ?? 0,
    restTime: b.rest_time_minutes ?? undefined,
    diets: b.is_veggie ? ['végétarien'] : [],
    ingredients: [...b.ingredients]
      .sort((a, b) => a.display_order - b.display_order)
      .map((i) => ({
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
      .map((i, index) => ({
        name: i.name,
        quantity: typeof i.quantity === 'string' ? (parseFloat(i.quantity) || null) : (i.quantity || null),
        unit: i.unit || null,
        display_order: index,
      })),
  };
}

// --- Backend paginated response ---

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number | null;
  offset: number;
}

// --- API functions ---

export async function fetchRecipes(): Promise<Recipe[]> {
  const res = await apiFetch(`${API_BASE}/recipes`);
  if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.status}`);
  const data: PaginatedResponse<BackendRecipe> = await res.json();
  return data.items.map(backendToFrontend);
}

export async function fetchRecipe(id: string): Promise<Recipe> {
  const res = await apiFetch(`${API_BASE}/recipes/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch recipe: ${res.status}`);
  const data: BackendRecipe = await res.json();
  return backendToFrontend(data);
}

export async function updateRecipe(recipe: Recipe, originalImage?: string): Promise<Recipe> {
  const body = frontendToBackendCreate(recipe);
  const res = await apiFetch(`${API_BASE}/recipes/${recipe.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update recipe: ${res.status}`);

  const oldImageId = originalImage ? getImageIdFromUrl(originalImage) : null;
  const imageChanged = originalImage !== recipe.image;

  // Delete old image if image was changed or removed
  if (imageChanged && oldImageId) {
    await deleteImage(oldImageId);
  }

  // Upload new image if present (base64 data URL)
  if (recipe.image?.startsWith('data:')) {
    await uploadImage(recipe.id!, recipe.image);
    return fetchRecipe(recipe.id!);
  }

  // If image was removed (no new image), re-fetch to get clean state
  if (imageChanged && !recipe.image) {
    return fetchRecipe(recipe.id!);
  }

  const data: BackendRecipe = await res.json();
  return backendToFrontend(data);
}

export async function createRecipe(recipe: Recipe): Promise<{ id: string }> {
  const body = frontendToBackendCreate(recipe);
  const res = await apiFetch(`${API_BASE}/recipes`, {
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

export async function deleteRecipe(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/recipes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete recipe: ${res.status}`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToMarkdown(): Promise<void> {
  const res = await apiFetch(`${API_BASE}/export/markdown`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to export: ${res.status}`);
  const blob = await res.blob();
  downloadBlob(blob, 'recipes.zip');
}

export async function exportToWord(): Promise<void> {
  const res = await apiFetch(`${API_BASE}/export/word`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to export: ${res.status}`);
  const blob = await res.blob();
  downloadBlob(blob, 'recipes.docx');
}

export async function importRecipesBatch(jsonPayload: { recipes: unknown[] }): Promise<{ ids: string[] }> {
  const res = await apiFetch(`${API_BASE}/recipes/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonPayload),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to import recipes: ${res.status} – ${detail}`);
  }
  return res.json();
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/** Load a data URL into an HTMLImageElement. */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/** Resize and compress an image to JPEG via canvas. */
function canvasToBlob(img: HTMLImageElement, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas not supported'));
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
      'image/jpeg',
      quality,
    );
  });
}

/**
 * Progressively compress an image until it fits under MAX_IMAGE_SIZE.
 * Tries reducing quality first, then resolution.
 */
async function compressImage(dataUrl: string): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const attempts = [
    { maxWidth: 1600, quality: 0.8 },
    { maxWidth: 1600, quality: 0.6 },
    { maxWidth: 1200, quality: 0.6 },
    { maxWidth: 1200, quality: 0.4 },
    { maxWidth: 800,  quality: 0.4 },
  ];
  for (const { maxWidth, quality } of attempts) {
    const blob = await canvasToBlob(img, maxWidth, quality);
    if (blob.size <= MAX_IMAGE_SIZE) return blob;
  }
  throw new Error('Image trop volumineuse, même après compression');
}

async function uploadImage(recipeId: string, dataUrl: string): Promise<void> {
  const blob = await compressImage(dataUrl);
  const formData = new FormData();
  formData.append('recipe_id', recipeId);
  formData.append('image', blob, 'recipe.jpg');
  const res = await apiFetch(`${API_BASE}/images`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to upload image: ${res.status}`);
}
