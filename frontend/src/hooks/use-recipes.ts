import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRecipes,
  fetchRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '@/lib/api';
import { Recipe } from '@/data/recipes';

export function useRecipes() {
  return useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
  });
}

export function useRecipe(id: string) {
  return useQuery<Recipe>({
    queryKey: ['recipes', id],
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipe, originalImage }: { recipe: Recipe; originalImage?: string }) =>
      updateRecipe(recipe, originalImage),
    onMutate: async ({ recipe }) => {
      await queryClient.cancelQueries({ queryKey: ['recipes', recipe.id] });
      const previous = queryClient.getQueryData<Recipe>(['recipes', recipe.id]);
      queryClient.setQueryData(['recipes', recipe.id], recipe);
      return { previous };
    },
    onError: (_err, { recipe }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['recipes', recipe.id], context.previous);
      }
    },
    onSuccess: (updated: Recipe) => {
      queryClient.setQueryData(['recipes', updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}
