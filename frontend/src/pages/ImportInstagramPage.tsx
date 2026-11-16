import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import RecipeImportInstagram from '@/components/RecipeImportInstagram';
import { useOverlayClose } from '@/components/CatalogLayout';
import { AddFlowState, useBackToAddMenu } from '@/components/AddFlowLayout';

const ImportInstagramPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { requestClose } = useOverlayClose();
  const backToAddMenu = useBackToAddMenu();
  // Opened from the welcome on the empty catalog, back slides out to it instead of returning to the add menu.
  const fromCatalog = (useLocation().state as AddFlowState | null)?.fromCatalog ?? false;

  return (
    <RecipeImportInstagram
      onBack={() => (fromCatalog ? requestClose('/') : backToAddMenu())}
      onImportDone={() => {
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
        navigate('/');
      }}
    />
  );
};

export default ImportInstagramPage;
