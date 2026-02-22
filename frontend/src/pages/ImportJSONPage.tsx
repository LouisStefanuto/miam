import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import RecipeImportJSON from '@/components/RecipeImportJSON';
import { toast } from '@/hooks/use-toast';

const ImportJSONPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <RecipeImportJSON
      onBack={() => navigate('/')}
      onImportRecipes={() => {
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
        toast({ title: 'Import terminé !' });
        navigate('/');
      }}
    />
  );
};

export default ImportJSONPage;
