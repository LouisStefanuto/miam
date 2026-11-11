import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRecipes, useCreateRecipe, useUpdateRecipe } from '@/hooks/use-recipes';
import RecipeForm from '@/components/RecipeForm';
import { toast } from '@/hooks/use-toast';
import { Recipe } from '@/data/recipes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOverlayClose } from '@/components/CatalogLayout';

/** Navigation state for opening this page straight from the catalog, skipping the add menu. */
export interface CreateRecipeState {
  fromCatalog?: boolean;
}


const CreateRecipePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: recipes = [] } = useRecipes();
  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();
  const [customTags, setCustomTags] = useState<string[]>([]);
  const { requestClose } = useOverlayClose();
  const fromCatalog = (useLocation().state as CreateRecipeState | null)?.fromCatalog ?? false;
  // On mobile the page is normally reached through the add menu, so back returns there;
  // opened straight from the catalog, it slides back out to the catalog instead.
  const handleBack = useCallback(
    () => (isMobile && !fromCatalog ? navigate('/add') : requestClose('/')),
    [isMobile, fromCatalog, navigate, requestClose],
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    customTags.forEach((t) => tagSet.add(t));
    return Array.from(tagSet).sort();
  }, [recipes, customTags]);

  const handleSave = (recipe: Recipe) => {
    createMutation.mutate(recipe, {
      onSuccess: () => {
        toast({ title: 'Recette créée !', description: recipe.title });
        navigate('/');
      },
      onError: () => {
        toast({ title: 'Erreur', description: 'Impossible de créer la recette.', variant: 'destructive' });
      },
    });
  };

  const handleAddTag = (tag: string) => {
    if (!customTags.includes(tag)) {
      setCustomTags((prev) => [...prev, tag]);
    }
  };

  const handleDeleteTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
    recipes.forEach((r) => {
      if (r.tags.includes(tag)) {
        updateMutation.mutate({ recipe: { ...r, tags: r.tags.filter((t) => t !== tag) } });
      }
    });
    toast({ title: `Tag "${tag}" supprimé`, description: 'Retiré de toutes les recettes.' });
  };

  return (
    <RecipeForm
      onBack={handleBack}
      onSave={handleSave}
      allTags={allTags}
      onAddTag={handleAddTag}
      onDeleteTag={handleDeleteTag}
    />
  );
};

export default CreateRecipePage;
