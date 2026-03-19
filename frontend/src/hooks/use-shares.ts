import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPendingShares,
  fetchPendingSharesCount,
  shareRecipe,
  acceptShare,
  rejectShare,
  removeShare,
  fetchRecipeShares,
} from '@/lib/api';
import { PendingShare, Collaborator } from '@/data/recipes';

export function usePendingShares() {
  return useQuery<PendingShare[]>({
    queryKey: ['shares', 'pending'],
    queryFn: fetchPendingShares,
  });
}

export function usePendingSharesCount() {
  return useQuery<number>({
    queryKey: ['shares', 'pending', 'count'],
    queryFn: fetchPendingSharesCount,
    refetchInterval: 30000, // poll every 30s
  });
}

export function useShareRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, email, role }: { recipeId: string; email: string; role: string }) =>
      shareRecipe(recipeId, email, role),
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['shares', 'recipe', recipeId] });
    },
  });
}

export function useAcceptShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareId: string) => acceptShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useRejectShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareId: string) => rejectShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', 'pending'] });
    },
  });
}

export function useRemoveShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareId: string) => removeShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useRecipeShares(recipeId: string) {
  return useQuery<Collaborator[]>({
    queryKey: ['shares', 'recipe', recipeId],
    queryFn: () => fetchRecipeShares(recipeId),
    enabled: !!recipeId,
  });
}
