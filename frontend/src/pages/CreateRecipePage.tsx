import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes, useCreateRecipe } from '@/hooks/use-recipes';
import RecipeForm from '@/components/RecipeForm';
import { toast } from '@/hooks/use-toast';
import { Recipe } from '@/data/recipes';

const CreateRecipePage = () => {
  const navigate = useNavigate();
  const { data: recipes = [] } = useRecipes();
  const createMutation = useCreateRecipe();
  const [customTags, setCustomTags] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    toast({ title: `Tag "${tag}" supprimé`, description: 'Retiré de toutes les recettes.' });
  };

  return (
    <RecipeForm
      onBack={() => navigate('/')}
      onSave={handleSave}
      allTags={allTags}
      onAddTag={handleAddTag}
      onDeleteTag={handleDeleteTag}
    />
  );
};

export default CreateRecipePage;
