import { useCallback, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

/** Shell for a page opened from the settings list, with a header leading back to it. */
export default function SettingsSubpage({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [exiting, setExiting] = useState(false);

  // Same in-and-out slide as the recipe overlay, so going back feels symmetric.
  const goBack = useCallback(() => {
    if (isMobile) setExiting(true);
    else navigate('/settings');
  }, [isMobile, navigate]);

  const handleAnimationEnd = useCallback(
    (event: React.AnimationEvent<HTMLDivElement>) => {
      if (exiting && event.target === event.currentTarget) navigate('/settings');
    },
    [exiting, navigate],
  );

  const slideClass = isMobile
    ? exiting
      ? 'animate-slide-out-to-right'
      : 'animate-slide-in-from-right'
    : '';

  return (
    <div className={`min-h-screen bg-background ${slideClass}`} onAnimationEnd={handleAnimationEnd}>
      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border md:hidden">
        <Button variant="ghost" size="icon" onClick={goBack} aria-label="Retour aux paramètres" className="motion-safe:animate-back-arrow-in">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display text-lg font-bold text-foreground">{title}</h1>
      </header>

      {/* Desktop top banner */}
      <header className="hidden md:flex items-center gap-3 h-16 px-6 bg-background/85 backdrop-blur-md border-b border-border/60 sticky top-0 z-30">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center justify-center h-10 w-10 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary active:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Retour aux paramètres"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">{title}</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">{children}</main>
    </div>
  );
}
