# Performance Audit — Miam

## Critical Issues

### ~~1. No Pagination (Backend + Frontend)~~ DONE

Pagination implemented across the full stack:

- **Backend**: `limit`/`offset` params threaded through port → service → repository. SQL `LIMIT`/`OFFSET` + `COUNT` query. `PaginatedResult` domain entity. `PaginatedRecipeResponse` API model on `GET /recipes` and `GET /recipes/search`.
- **Frontend**: Catalog renders 20 recipes per page. Pagination UI with page numbers, prev/next. Page resets on filter/search change. Page state persisted in `CatalogFilterContext`.

### 2. Missing Database Indexes
Zero indexes beyond PKs. Every filter (`category`, `season`, `is_veggie`) and every FK join (`images.recipe_id`, `recipe_ingredients.recipe_id`, `sources.recipe_id`) does a full table scan.

**File:** `alembic/versions/0001_initial_schema.py`

**Fix:** Add an Alembic migration with indexes on `recipes.category`, `recipes.season`, `recipes.is_veggie`, and all FK columns. Consider a `pg_trgm` GIN index on `recipes.title` for `ILIKE` searches.

### 3. N+1 Queries on Ingredient Lookup
`_get_or_create_ingredient` fires one `SELECT` per ingredient name. A 50-recipe batch import with 10 ingredients each = ~500 queries.

**File:** `infra/repositories.py:167-177`

**Fix:** Bulk-fetch existing ingredients with `WHERE name IN (...)` before the loop, then only INSERT the new ones.

---

## High-Impact Issues

### ~~4. RecipeCard Expensive CSS + No Search Debounce~~ DONE

Fixed expensive CSS properties on RecipeCard that caused scroll jank:

- **`transition-all`** → scoped to `transition-[box-shadow,transform]` (only the 2 properties that animate)
- **`backdrop-blur-sm`** removed from all badge overlays (4 per card × 20 cards = 80 GPU blur ops) → replaced with opaque `bg-white/90` / `bg-card/95`
- **`drop-shadow-md`** (CSS filter, rasterized per frame) → `shadow-sm` (compositor-friendly box-shadow)
- **`animate-fade-in`** removed (20 simultaneous translateY + opacity animations on every page render)

### 5. Full Recipe Payloads on List Endpoint
Cards only need title, image, category, season — but every recipe comes with full `ingredients[]` and `steps[]`. Wastes bandwidth and memory.

**File:** `frontend/src/lib/api.ts:92-117`

**Fix:** Create a lightweight `/api/recipes` list response (without ingredients/steps). Keep the detailed response for `/api/recipes/{id}`.

### 6. O(n) Image Directory Scan
`get_recipe_image` iterates every file in the images folder to find a match. During export of 200 recipes with 3 images each → 360,000 file comparisons.

**File:** `infra/image_storage.py:45-58`

**Fix:** Store images with a predictable path (`{image_id}.{ext}`) or build a filename lookup cache.

---

## Medium Issues

### 7. Detail Page Fetches Full Recipe List
`RecipeDetailPage` calls `useRecipes()` (all recipes) just to compute `allTags`. Forces a full catalog download on every detail view.

**File:** `frontend/src/pages/RecipeDetailPage.tsx:11-12`

**Fix:** Create a dedicated `/api/tags` endpoint or compute tags only in the catalog.

### 8. No TanStack Query Cache Tuning
`staleTime` defaults to `0` — every window focus triggers a background refetch of all recipes.

**File:** `frontend/src/App.tsx:15`

**Fix:** Set `staleTime: 5 * 60 * 1000` (5 min) on the query client defaults.

### 9. Double-Fetch on Recipe Delete
Service loads the recipe, then `repository.delete_recipe` loads it again internally.

**Files:** `domain/services.py:59-65`, `infra/repositories.py:311-313`

**Fix:** Pass the already-loaded entity to the repository delete method.

### 10. No Code Splitting
All 6 pages are eagerly imported. Import/Export/OCR pages load even when never visited.

**File:** `frontend/src/App.tsx:7-13`

**Fix:** Use `React.lazy()` + `Suspense` for non-catalog routes.

### 11. Batch Import Flushes Per Recipe
`add_recipes` calls `session.flush()` after each recipe instead of batching.

**File:** `infra/repositories.py:119-165`

**Fix:** Remove per-iteration `flush()`, flush once before `commit()`.

---

## Recommended Priority

| Priority | Action | Effort |
|----------|--------|--------|
| 1 | Add DB indexes (migration) | Low |
| ~~2~~ | ~~Add pagination (backend + frontend)~~ | ~~Done~~ |
| 3 | Lightweight list response (no ingredients/steps) | Low |
| ~~4~~ | ~~Fix RecipeCard expensive CSS~~ | ~~Done~~ |
| 5 | Fix N+1 ingredient queries | Low |
| 6 | Set TanStack Query `staleTime` | Trivial |
| 7 | Dedicated `/api/tags` endpoint | Low |
| 8 | Fix image storage linear scan | Low |
| 9 | `React.lazy` code splitting | Low |
| 10 | Fix batch flush + double-fetch | Low |
