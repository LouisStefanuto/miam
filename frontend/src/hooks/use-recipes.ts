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
    mutationFn: updateRecipe,
    onSuccess: (updated: Recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.setQueryData(['recipes', updated.id], updated);
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
