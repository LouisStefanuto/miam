import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenLine, Camera, FileJson, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

const modes = [
  {
    icon: PenLine,
    label: 'Créer manuellement',
    description: 'Rédiger une recette de A à Z',
    to: '/recipes/new',
  },
  {
    icon: Camera,
    label: 'Importer depuis des photos',
    description: 'Scanner une recette avec l\'appareil photo',
    to: '/import/ocr',
  },
  {
    icon: FileJson,
    label: 'Importer un JSON',
    description: 'Coller un export JSON de recette',
    to: '/import/json',
  },
  {
    icon: Instagram,
    label: 'Importer depuis Instagram',
    description: 'Importer des recettes depuis un export Instagram',
    to: '/import/instagram',
    disabled: false,
  },
] as const;

const AddRecipePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border">
        <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span className="sr-only">Retour</span>
        </Button>
        <h1 className="font-display text-lg font-bold text-foreground">Ajouter une recette</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3 pb-24">
        {modes.map((mode) => (
          <button
            key={mode.label}
            disabled={mode.disabled}
            onClick={() => mode.to && navigate(mode.to)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <mode.icon size={22} className="text-primary" />
            </span>
            <div className="min-w-0">
              <p className="font-body font-semibold text-foreground">{mode.label}</p>
              <p className="font-body text-sm text-muted-foreground">{mode.description}</p>
            </div>
          </button>
        ))}
      </main>
    </div>
  );
};

export default AddRecipePage;
