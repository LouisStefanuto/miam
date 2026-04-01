import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecipes } from '@/hooks/use-recipes';
import RecipeCard from '@/components/RecipeCard';
import BatchShareDialog from '@/components/BatchShareDialog';
import SearchBar from '@/components/SearchBar';

const ShareBatchPage = () => {
  const navigate = useNavigate();
  const { data: recipes = [] } = useRecipes();
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [showBatchShare, setShowBatchShare] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);

  const shareableRecipes = useMemo(() => {
    const shareable = recipes.filter(r => !r.userRole || r.userRole === 'owner' || r.userRole === 'editor');

    const liveQuery = searchQuery.trim().toLowerCase();
    const allTerms = [...searchTags, ...(liveQuery ? [liveQuery] : [])];
    if (allTerms.length === 0) return shareable;

    return shareable.filter(r =>
      allTerms.every(q =>
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(q)) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      )
    );
  }, [recipes, searchQuery, searchTags]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedRecipes(new Set(shareableRecipes.map(r => r.id)));
  }, [shareableRecipes]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/shares')}>
          <ArrowLeft size={20} />
          <span className="sr-only">Retour</span>
        </Button>
        <h1 className="font-display text-lg font-bold text-foreground">Partager mes recettes</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-3">
        {/* Search bar */}
        <SearchBar tags={searchTags} onTagsChange={setSearchTags} query={searchQuery} onQueryChange={setSearchQuery} />

        {/* Selection action bar */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-body" onClick={selectAll}>
            Tout sélectionner
          </Button>
          <Button
            size="sm"
            className="font-body flex-1"
            disabled={selectedRecipes.size === 0}
            onClick={() => setShowBatchShare(true)}
          >
            <Share2 size={14} className="mr-1" />
            Partager {selectedRecipes.size > 0 ? `${selectedRecipes.size} recette${selectedRecipes.size > 1 ? 's' : ''}` : ''}
          </Button>
        </div>

        {/* Recipe list for selection */}
        {shareableRecipes.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground font-body">Aucune recette à partager</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {shareableRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                selectionMode
                selected={selectedRecipes.has(recipe.id)}
                onSelect={toggleSelection}
              />
            ))}
          </div>
        )}

        <BatchShareDialog
          recipeIds={Array.from(selectedRecipes)}
          open={showBatchShare}
          onOpenChange={(open) => {
            setShowBatchShare(open);
            if (!open) setSelectedRecipes(new Set());
          }}
        />
      </main>
    </div>
  );
};

export default ShareBatchPage;
