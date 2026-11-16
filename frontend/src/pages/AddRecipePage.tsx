import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PixelSprite from '@/components/PixelSprite';
import { ADD_RECIPE_MODES } from '@/lib/add-recipe-modes';

const AddRecipePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto px-4 pt-3 md:pt-8 pb-24">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Retour au catalogue" className="-ml-2">
          <ArrowLeft size={22} />
        </Button>

        <h1 className="mt-4 font-display text-[32px] leading-tight font-bold text-foreground">Nouvelle recette</h1>
        <p className="mt-1 font-body text-muted-foreground">Choisissez comment l'ajouter.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {ADD_RECIPE_MODES.map((mode) => (
            <button
              key={mode.label}
              disabled={mode.comingSoon}
              onClick={() => navigate(mode.to)}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={`relative min-h-[184px] p-4 rounded-3xl flex flex-col justify-between text-left transition-transform duration-200 enabled:active:scale-[0.97] md:enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed ${mode.tile}`}
            >
              <span className={`w-12 h-12 rounded-full grid place-items-center ${mode.chip}`}>
                <mode.icon size={22} />
              </span>
              <PixelSprite
                sprite={mode.sprite}
                scale={mode.spriteScale}
                className={`absolute top-3 right-3 ${mode.comingSoon ? 'opacity-60' : ''}`}
              />

              <span className="block min-w-0">
                <span className="block font-body text-[17px] font-bold leading-tight">
                  {mode.label}
                  {mode.comingSoon && (
                    <span className="ml-2 align-middle text-[11px] font-semibold bg-secondary text-muted-foreground rounded-full px-2 py-0.5">
                      Bientôt
                    </span>
                  )}
                </span>
                <span className={`block mt-1 font-body text-[13px] ${mode.sub}`}>{mode.description}</span>
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AddRecipePage;
