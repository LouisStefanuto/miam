const API_BASE_URL = "http://localhost:8000";

export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface Image {
  id: string;
  caption: string | null;
  display_order: number;
}

export interface ImageUploadResponse {
  title: string;
  recipe: string;
  image_id: string;
}

export interface Source {
  type: string;
  raw_content: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  rest_time_minutes: number | null;
  season: string | null;
  category: string;
  is_veggie: boolean;
  ingredients: Ingredient[];
  images: Image[];
  sources: Source[];
}

export interface RecipeCreate {
  title: string;
  description: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  rest_time_minutes: number | null;
  season: string | null;
  category: string;
  is_veggie: boolean;
  ingredients: { name: string; quantity: number | null; unit: string | null }[];
  images: { caption: string | null; display_order: number | null }[];
  sources: { type: string; raw_content: string }[];
}

export function getImageUrl(imageId: string): string {
  return `${API_BASE_URL}/api/images/${imageId}`;
}

export async function uploadImage(recipeId: string, file: File): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append("recipe_id", recipeId);
  formData.append("image", file);
  const res = await fetch(`${API_BASE_URL}/api/images`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function searchRecipes(params: {
  title?: string;
  category?: string;
  is_veggie?: boolean;
  season?: string;
}): Promise<Recipe[]> {
  const query = new URLSearchParams();
  if (params.title) query.set("title", params.title);
  if (params.category) query.set("category", params.category);
  if (params.is_veggie !== undefined) query.set("is_veggie", String(params.is_veggie));
  if (params.season) query.set("season", params.season);
  const qs = query.toString();
  return apiFetch<Recipe[]>(`/api/recipes/search${qs ? `?${qs}` : ""}`);
}

export async function getRecipe(id: string): Promise<Recipe> {
  return apiFetch<Recipe>(`/api/recipes/${id}`);
}

export async function createRecipe(data: RecipeCreate): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/recipes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function exportMarkdown(): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/api/export/markdown`, { method: "POST" });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export async function exportWord(): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/api/export/word`, { method: "POST" });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}
