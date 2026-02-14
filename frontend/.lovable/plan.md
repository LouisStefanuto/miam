
# Livre Recettes - Personal Recipe Website v1

## Design
- **Color scheme**: White/light gray backgrounds, orange as primary accent (buttons, highlights, active states), green as secondary accent (tags, badges like veggie indicator, seasons)
- **Style**: Clean, modern, minimal — food-focused with good readability
- **Responsive**: Mobile-friendly layout

## Pages & Features

### 1. Home / Recipe List Page
- Grid/card layout showing all recipes with title, category badge, season, veggie indicator, and first image if available
- **Search bar** at the top for filtering by title
- **Filter sidebar/bar** with dropdowns for:
  - Category (apéro, entrée, plat, dessert)
  - Season (winter, spring, summer, autumn)
  - Veggie toggle (yes/no)
- Calls `GET /api/recipes/search` with query params
- Clicking a recipe card navigates to the detail page

### 2. Recipe Detail Page
- Full recipe view showing:
  - Title, description, images
  - Prep/cook/rest times displayed with icons
  - Category and season badges
  - Veggie badge (green)
  - Ingredients list with quantities and units
  - Source information
- Back button to return to list

### 3. Create Recipe Page
- Form with fields matching `RecipeCreate` schema:
  - Title, description (textarea)
  - Prep time, cook time, rest time (number inputs)
  - Category dropdown, season dropdown, veggie checkbox
  - Dynamic ingredients list (add/remove rows with name, quantity, unit)
  - Image URLs (add/remove)
  - Sources (type + content)
- Submits to `POST /api/recipes`
- Success redirects to the new recipe's detail page

### 4. Export Feature
- Export buttons accessible from the home page (toolbar or menu)
- "Export as Markdown" → calls `POST /api/export/markdown` and triggers file download
- "Export as Word" → calls `POST /api/export/word` and triggers file download

## Technical Setup
- API client configured with base URL `http://localhost:8000` (configurable)
- React Query for data fetching and caching
- React Router for navigation between pages
- Toast notifications for success/error feedback
