import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecipeCardSkeletonProps {
  /** Same variants as RecipeCard, so the placeholder takes the exact space of the card that replaces it. */
  variant?: 'card' | 'row';
}

/** Grey stand-in for a RecipeCard while the recipes load. */
export function RecipeCardSkeleton({ variant = 'card' }: RecipeCardSkeletonProps) {
  const isMobile = useIsMobile();

  if (variant === 'row') {
    return (
      <div data-testid="recipe-skeleton" className="w-full flex items-center gap-4 px-2 py-1.5">
        <Skeleton className="w-[72px] h-[72px] shrink-0 rounded-lg" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div data-testid="recipe-skeleton" className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-card">
        <Skeleton className="absolute inset-0 rounded-none" />
        {/* Title and meta lines sit where the overlaid text of the real card goes. */}
        <div className="absolute bottom-3 left-3 right-3 space-y-2">
          <Skeleton className="h-5 w-2/3 bg-foreground/10" />
          <Skeleton className="h-3 w-1/3 bg-foreground/10" />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="recipe-skeleton" className="w-full h-full flex flex-col bg-card rounded-lg overflow-hidden shadow-card">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-4 flex flex-col flex-1">
        {/* Two lines of the card title (text-lg, leading-tight), so the card keeps its final height. */}
        <div className="text-lg leading-tight h-[2lh] flex flex-col justify-center gap-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="mt-2 h-3.5 w-20" />
        <div className="mt-2 h-5 flex items-end">
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

interface RecipeCatalogSkeletonProps {
  variant?: 'card' | 'row';
  count?: number;
}

/** Placeholder catalog: the grid (or list) filled with skeleton cards. */
export function RecipeCatalogSkeleton({ variant = 'card', count = 8 }: RecipeCatalogSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => <RecipeCardSkeleton key={i} variant={variant} />);
  return (
    <div
      role="status"
      aria-busy="true"
      className={variant === 'row'
        ? 'flex flex-col -mx-2'
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}
    >
      <span className="sr-only">Chargement des recettes…</span>
      {items}
    </div>
  );
}
