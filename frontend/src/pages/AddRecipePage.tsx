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
    icon: Instagram,
    label: 'Importer depuis Instagram',
    description: 'Importer des recettes depuis un export Instagram',
    to: '/import/instagram',
  },
  {
    icon: FileJson,
    label: 'Importer un JSON',
    description: 'Coller un export JSON de recette',
    to: '/import/json',
  },
  {
    icon: Camera,
    label: 'Importer depuis des photos',
    description: 'Scanner une recette avec l\'appareil photo',
    to: '/import/ocr',
    disabled: true,
    comingSoon: true,
  },
];

const AddRecipePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border md:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Retour au catalogue">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display text-lg font-bold text-foreground">Ajouter une recette</h1>
      </header>
      <header className="sticky top-0 z-30 hidden md:flex items-center gap-3 h-16 px-6 bg-background/85 backdrop-blur-md border-b border-border/60">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Retour au catalogue">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Ajouter une recette</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3 pb-24">
        {modes.map((mode) => (
          <button
            key={mode.label}
            disabled={mode.disabled}
            onClick={() => mode.to && navigate(mode.to)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border border-border transition-colors text-left ${mode.disabled ? 'bg-muted/60 opacity-60 cursor-not-allowed' : 'bg-card hover:bg-secondary/50'}`}
          >
            <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${mode.disabled ? 'bg-muted' : 'bg-primary/10'}`}>
              <mode.icon size={22} className={mode.disabled ? 'text-muted-foreground' : 'text-primary'} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-body font-semibold text-foreground">{mode.label}</p>
                {mode.comingSoon && (
                  <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">Bientôt</span>
                )}
              </div>
              <p className="font-body text-sm text-muted-foreground">{mode.description}</p>
            </div>
          </button>
        ))}
      </main>
    </div>
  );
};

export default AddRecipePage;
