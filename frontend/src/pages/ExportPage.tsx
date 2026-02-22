import { useNavigate } from 'react-router-dom';
import RecipeExport from '@/components/RecipeExport';

const ExportPage = () => {
  const navigate = useNavigate();

  return <RecipeExport onBack={() => navigate('/')} />;
};

export default ExportPage;
