import { useState, useMemo, useEffect } from 'react';
import { Plus, PenLine, Camera, Instagram } from 'lucide-react';
import { Recipe } from '@/data/recipes';
import { fetchRecipes, createRecipe as apiCreateRecipe } from '@/lib/api';
import HeroSection from '@/components/HeroSection';
import SearchBar from '@/components/SearchBar';
import FilterBar, { Filters } from '@/components/FilterBar';
import RecipeCard from '@/components/RecipeCard';
import RecipeDetail from '@/components/RecipeDetail';
import RecipeForm from '@/components/RecipeForm';
import RecipeImportOCR from '@/components/RecipeImportOCR';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type View = 'catalog' | 'detail' | 'create' | 'import-ocr';

const Index = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes()
      .then(setRecipes)
      .catch((err) => {
        console.error('Failed to fetch recipes:', err);
        toast({ title: 'Erreur', description: 'Impossible de charger les recettes.', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, []);
  const [view, setView] = useState<View>('catalog');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    type: 'tous',
    season: 'toutes',
    difficulty: 'toutes',
    sort: 'recent',
    tested: 'off',
    vegetarian: 'off',
    rapido: 'off',
  });

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    customTags.forEach((t) => tagSet.add(t));
    return Array.from(tagSet).sort();
  }, [recipes, customTags]);

  const filtered = useMemo(() => {
    let result = recipes.filter((r) => {
      const liveQuery = searchQuery.trim().toLowerCase();
      const allTerms = [...searchTags, ...(liveQuery ? [liveQuery] : [])];
      const matchSearch =
        allTerms.length === 0 ||
        allTerms.every((q) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q)) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );

      const matchType = filters.type === 'tous' || r.type === filters.type;
      const matchSeason = filters.season === 'toutes' || r.season === filters.season;
      const matchDifficulty = filters.difficulty === 'toutes' || r.difficulty === filters.difficulty;
      const matchTested = filters.tested === 'off' || r.tested;
      const matchVegetarian = filters.vegetarian === 'off' || r.diets.includes('végétarien');
      const matchRapido = filters.rapido === 'off' || (r.prepTime + r.cookTime) <= 20;

      return matchSearch && matchType && matchSeason && matchDifficulty && matchTested && matchVegetarian && matchRapido;
    });

    switch (filters.sort) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'alpha':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'time':
        result.sort((a, b) => a.prepTime + a.cookTime - (b.prepTime + b.cookTime));
        break;
      case 'recent':
      default:
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return result;
  }, [recipes, searchQuery, searchTags, filters]);

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setView('detail');
    window.scrollTo(0, 0);
  };

  const saveRecipe = async (recipe: Recipe) => {
    const exists = recipes.some((r) => r.id === recipe.id);
    if (exists) {
      // TODO: No PUT endpoint yet — update local state only
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? recipe : r)));
      setSelectedRecipe(recipe);
      toast({ title: 'Recette modifiée !', description: recipe.title });
    } else {
      try {
        const { id } = await apiCreateRecipe(recipe);
        setRecipes([{ ...recipe, id }, ...recipes]);
        setView('catalog');
        toast({ title: 'Recette créée !', description: recipe.title });
      } catch (err) {
        console.error('Failed to create recipe:', err);
        toast({ title: 'Erreur', description: 'Impossible de créer la recette.', variant: 'destructive' });
      }
    }
  };

  const updateRating = (rating: number) => {
    if (!selectedRecipe) return;
    const updated = { ...selectedRecipe, rating };
    setSelectedRecipe(updated);
    setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const toggleTested = (tested: boolean) => {
    if (!selectedRecipe) return;
    const updated = { ...selectedRecipe, tested };
    setSelectedRecipe(updated);
    setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAddTag = (tag: string) => {
    if (!customTags.includes(tag)) {
      setCustomTags((prev) => [...prev, tag]);
    }
  };

  const handleDeleteTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
    setRecipes((prev) => prev.map((r) => ({ ...r, tags: r.tags.filter((t) => t !== tag) })));
    if (selectedRecipe) {
      setSelectedRecipe((prev) => prev ? { ...prev, tags: prev.tags.filter((t) => t !== tag) } : null);
    }
    toast({ title: `Tag "${tag}" supprimé`, description: 'Retiré de toutes les recettes.' });
  };

  if (view === 'detail' && selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={() => setView('catalog')}
        onRatingChange={updateRating}
        onSave={saveRecipe}
        onTestedToggle={toggleTested}
        allTags={allTags}
        onAddTag={handleAddTag}
        onDeleteTag={handleDeleteTag}
      />
    );
  }

  if (view === 'import-ocr') {
    return (
      <RecipeImportOCR
        onBack={() => setView('catalog')}
        onImportRecipes={(imported) => {
          setRecipes((prev) => [...imported, ...prev]);
          toast({ title: `${imported.length} recette${imported.length > 1 ? 's' : ''} importée${imported.length > 1 ? 's' : ''} !` });
          setView('catalog');
        }}
      />
    );
  }

  if (view === 'create') {
    return <RecipeForm onBack={() => setView('catalog')} onSave={saveRecipe} allTags={allTags} onAddTag={handleAddTag} onDeleteTag={handleDeleteTag} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Search + Add button on same line */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <SearchBar tags={searchTags} onTagsChange={setSearchTags} query={searchQuery} onQueryChange={setSearchQuery} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gradient-warm text-primary-foreground font-body font-semibold gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ml-auto shrink-0">
                <Plus size={18} />
                Ajouter une recette
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-body">
              <DropdownMenuItem onClick={() => setView('create')} className="gap-2 cursor-pointer">
                <PenLine size={16} />
                Créer manuellement
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('import-ocr')} className="gap-2 cursor-pointer">
                <Camera size={16} />
                Importer depuis des photos
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="gap-2 cursor-pointer opacity-50">
                <Instagram size={16} />
                Importer depuis Instagram
                <span className="text-xs text-muted-foreground ml-auto">Bientôt</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        {/* Results count */}
        <p className="text-sm text-muted-foreground font-body">
          {filtered.length} recette{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="font-body text-muted-foreground">Chargement des recettes…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={() => openRecipe(recipe)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-foreground mb-2">Aucune recette trouvée</p>
            <p className="font-body text-muted-foreground">Essayez de modifier vos filtres ou votre recherche</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
