import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import RecipeImportOCR from '@/components/RecipeImportOCR';
import { toast } from '@/hooks/use-toast';

const ImportOCRPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <RecipeImportOCR
      onBack={() => navigate('/add')}
      onImportRecipes={(imported) => {
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
        toast({ title: `${imported.length} recette${imported.length > 1 ? 's' : ''} importée${imported.length > 1 ? 's' : ''} !` });
        navigate('/');
      }}
    />
  );
};

export default ImportOCRPage;
