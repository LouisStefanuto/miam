import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import RecipeImportInstagram from '@/components/RecipeImportInstagram';

const ImportInstagramPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <RecipeImportInstagram
      onBack={() => navigate('/')}
      onImportDone={() => {
        queryClient.invalidateQueries({ queryKey: ['recipes'] });
        navigate('/');
      }}
    />
  );
};

export default ImportInstagramPage;
