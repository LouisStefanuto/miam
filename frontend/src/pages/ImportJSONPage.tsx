import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import RecipeImportJSON from '@/components/RecipeImportJSON';
import { useOverlayClose } from '@/components/CatalogLayout';
import { AddFlowState, useBackToAddMenu } from '@/components/AddFlowLayout';
import { toast } from '@/hooks/use-toast';

const ImportJSONPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { requestClose } = useOverlayClose();
  const backToAddMenu = useBackToAddMenu();
  // Opened from the welcome on the empty catalog, back slides out to it instead of returning to the add menu.
  const fromCatalog = (useLocation().state as AddFlowState | null)?.fromCatalog ?? false;

  return (
    <RecipeImportJSON
      onBack={() => (fromCatalog ? requestClose('/') : backToAddMenu())}
      onImportRecipes={() => {
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
        toast({ title: 'Import terminé !' });
        navigate('/');
      }}
    />
  );
};

export default ImportJSONPage;
