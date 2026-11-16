import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import RecipeImportInstagram from '@/components/RecipeImportInstagram';
import type { CreateRecipeState } from '@/pages/CreateRecipePage';

const ImportInstagramPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Opened from the welcome on the empty catalog, back returns there instead of the add menu.
  const fromCatalog = (useLocation().state as CreateRecipeState | null)?.fromCatalog ?? false;

  return (
    <RecipeImportInstagram
      onBack={() => navigate(fromCatalog ? '/' : '/add')}
      onImportDone={() => {
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
        navigate('/');
      }}
    />
  );
};

export default ImportInstagramPage;
