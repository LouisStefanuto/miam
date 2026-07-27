import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AlarmSoundPicker from '@/components/AlarmSoundPicker';

/** Dedicated page for picking the timer alarm, kept out of the settings list. */
export default function AlarmSoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border md:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} aria-label="Retour aux paramètres">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display text-lg font-bold text-foreground">Sonnerie</h1>
      </header>

      {/* Desktop top banner */}
      <header className="hidden md:flex items-center gap-3 h-16 px-6 bg-background/85 backdrop-blur-md border-b border-border/60 sticky top-0 z-30">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="inline-flex items-center justify-center h-10 w-10 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary active:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Retour aux paramètres"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Sonnerie</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">
        <p className="font-body text-sm text-muted-foreground">
          Le son joué quand un minuteur d'étape arrive à zéro. Appuyez sur une sonnerie pour l'écouter et la choisir.
        </p>
        <AlarmSoundPicker />
      </main>
    </div>
  );
}
