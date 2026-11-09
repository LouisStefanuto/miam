import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenLine, Camera, FileJson, Instagram, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PixelSprite from '@/components/PixelSprite';
import { PixelSpriteData, sprites } from '@/lib/pixel-sprites';

interface Mode {
  icon: LucideIcon;
  label: string;
  description: string;
  to: string;
  sprite: PixelSpriteData;
  /** Screen pixels per sprite pixel, to even out sprites of different sizes. */
  spriteScale?: number;
  /** Classes for the tile, the round icon chip and the description line. */
  tile: string;
  chip: string;
  sub: string;
  comingSoon?: boolean;
}

const modes: Mode[] = [
  {
    icon: PenLine,
    label: 'Créer manuellement',
    description: 'De A à Z',
    to: '/recipes/new',
    sprite: sprites.chefBeaver,
    spriteScale: 2.5,
    tile: 'bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_hsl(var(--primary)/0.8)]',
    chip: 'bg-primary-foreground text-primary',
    sub: 'text-primary-foreground/85',
  },
  {
    icon: Instagram,
    label: 'Instagram',
    description: 'Export Instagram',
    to: '/import/instagram',
    sprite: sprites.radish,
    spriteScale: 3.5,
    tile: 'bg-[hsl(340_75%_58%/0.16)] text-foreground',
    chip: 'bg-card text-[hsl(340_70%_50%)] dark:text-[hsl(340_80%_72%)]',
    sub: 'text-foreground/65',
  },
  {
    icon: FileJson,
    label: 'JSON',
    description: 'Coller un export',
    to: '/import/json',
    sprite: sprites.kawaiiCarrot,
    tile: 'bg-[hsl(110_40%_45%/0.18)] text-foreground',
    chip: 'bg-card text-[hsl(110_45%_32%)] dark:text-[hsl(110_45%_62%)]',
    sub: 'text-foreground/65',
  },
  {
    icon: Camera,
    label: 'Photos',
    description: 'Scanner une recette',
    to: '/import/ocr',
    sprite: sprites.sprout,
    tile: 'border border-dashed border-foreground/20 text-muted-foreground',
    chip: 'bg-muted text-muted-foreground',
    sub: 'text-muted-foreground',
    comingSoon: true,
  },
];

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
          {modes.map((mode) => (
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
