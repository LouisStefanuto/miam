import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRecipe, useRecipes, useUpdateRecipe, useDeleteRecipe } from '@/hooks/use-recipes';
import RecipeDetail from '@/components/RecipeDetail';
import ShareDialog from '@/components/ShareDialog';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Recipe } from '@/data/recipes';
import { leaveRecipe } from '@/lib/api';

const RecipeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: recipe, isLoading, isError } = useRecipe(id!);
  const { data: recipes = [] } = useRecipes();
  const updateMutation = useUpdateRecipe();
  const deleteMutation = useDeleteRecipe();
  const { remove: removeFromCart } = useCart();
  const queryClient = useQueryClient();
  const [customTags, setCustomTags] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    customTags.forEach((t) => tagSet.add(t));
    return Array.from(tagSet).sort();
  }, [recipes, customTags]);

  const handleSave = (updated: Recipe) => {
    updateMutation.mutate({ recipe: updated, originalImage: recipe?.image }, {
      onSuccess: (result) => {
        toast({ title: 'Recette modifiée !', description: result.title });
      },
      onError: () => {
        toast({ title: 'Erreur', description: 'Impossible de modifier la recette.', variant: 'destructive' });
      },
    });
  };

  const handleRatingChange = (rating: number) => {
    if (!recipe) return;
    updateMutation.mutate({ recipe: { ...recipe, rating } });
  };

  const handleTestedToggle = (tested: boolean) => {
    if (!recipe) return;
    updateMutation.mutate({ recipe: { ...recipe, tested } });
  };

  const handleDelete = () => {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        removeFromCart(id);
        toast({ title: 'Recette supprimée', description: recipe?.title });
        navigate('/');
      },
      onError: () => {
        toast({ title: 'Erreur', description: 'Impossible de supprimer la recette.', variant: 'destructive' });
      },
    });
  };

  const handleRemoveFromCollection = async () => {
    if (!id || !recipe) return;
    try {
      await leaveRecipe(id);
      removeFromCart(id);
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({ title: 'Recette retirée', description: recipe.title });
      navigate('/');
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de retirer la recette.', variant: 'destructive' });
    }
  };

  const handleAddTag = (tag: string) => {
    if (!customTags.includes(tag)) {
      setCustomTags((prev) => [...prev, tag]);
    }
  };

  const handleDeleteTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
    // Remove the tag from all recipes that have it
    recipes.forEach((r) => {
      if (r.tags.includes(tag)) {
        updateMutation.mutate({ recipe: { ...r, tags: r.tags.filter((t) => t !== tag) } });
      }
    });
    toast({ title: `Tag "${tag}" supprimé`, description: 'Retiré de toutes les recettes.' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-muted-foreground">Chargement de la recette…</p>
      </div>
    );
  }

  if (isError || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-muted-foreground mb-2">Recette introuvable</p>
          <button onClick={() => navigate('/')} className="font-body text-primary hover:underline">
            Retour au catalogue
          </button>
        </div>
      </div>
    );
  }

  const isOwner = !recipe.userRole || recipe.userRole === 'owner';

  return (
    <RecipeDetail
      recipe={recipe}
      onBack={() => navigate('/')}
      onRatingChange={recipe.userRole !== 'reader' ? handleRatingChange : undefined}
      onSave={recipe.userRole !== 'reader' ? handleSave : undefined}
      onTestedToggle={recipe.userRole !== 'reader' ? handleTestedToggle : undefined}
      allTags={allTags}
      onAddTag={handleAddTag}
      onDeleteTag={handleDeleteTag}
      onDelete={isOwner ? handleDelete : undefined}
      onRemoveFromCollection={!isOwner ? handleRemoveFromCollection : undefined}
      shareButton={isOwner && id ? <ShareDialog recipeId={id} /> : undefined}
    />
  );
};

export default RecipeDetailPage;
