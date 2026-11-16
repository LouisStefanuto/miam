import { PenLine, Camera, FileJson, Instagram, LucideIcon } from 'lucide-react';
import { PixelSpriteData, sprites } from '@/lib/pixel-sprites';

/** One way to add a recipe, shown as a colored tile on the add page and on the empty catalog. */
export interface AddRecipeMode {
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

export const ADD_RECIPE_MODES: AddRecipeMode[] = [
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
    description: 'Import depuis Instagram',
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
