import { Clock, Star, Users, ShoppingCart } from 'lucide-react';
import beaverIcon from '/icon.png';
import { Recipe } from '@/data/recipes';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthImage } from '@/hooks/use-auth-image';


const difficultyLabels: Record<string, { label: string; bars: number }> = {
  facile: { label: 'Facile', bars: 1 },
  moyen: { label: 'Moyen', bars: 2 },
  difficile: { label: 'Difficile', bars: 3 },
};

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const DifficultyBars = ({ level }: { level: number }) => (
  <div className="flex gap-0.5 items-end">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className={`w-1 rounded-sm ${i <= level ? 'bg-primary' : 'bg-muted'}`}
        style={{ height: `${8 + i * 4}px` }}
      />
    ))}
  </div>
);

const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={i <= rating ? 'fill-primary text-primary' : 'text-muted'}
      />
    ))}
  </div>
);

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const isMobile = useIsMobile();
  const totalTime = recipe.prepTime + recipe.cookTime;
  const diff = difficultyLabels[recipe.difficulty];
  const cart = useCart();
  const inCart = cart.has(recipe.id);
  const imageSrc = useAuthImage(recipe.image);

  if (isMobile) {
    return (
      <button
        onClick={(e) => { if (e.metaKey || e.ctrlKey) { e.preventDefault(); cart.toggle(recipe.id); } else { onClick(); } }}
        className="group text-left w-full relative rounded-lg overflow-hidden shadow-card"
      >
        {/* Full image background */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={recipe.title}
              className={`w-full h-full object-cover ${!recipe.tested ? 'opacity-60 saturate-[0.3]' : ''}`}
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-muted flex items-center justify-center ${!recipe.tested ? 'opacity-60' : ''}`}>
              <img src={beaverIcon} alt="Pas d'image" className="w-10 h-10 opacity-50 grayscale" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />

          {/* Cart button top right */}
          <div className="absolute top-2 right-2">
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); cart.toggle(recipe.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); cart.toggle(recipe.id); } }}
              className={`w-8 h-8 rounded-full border-2 border-card/95 bg-card/95 flex items-center justify-center shadow-sm transition-colors ${inCart ? 'text-primary fill-primary' : 'text-gray-600 dark:text-gray-300'}`}
              title={inCart ? 'Retirer du panier' : 'Ajouter au panier'}
            >
              <ShoppingCart size={16} className={inCart ? 'fill-primary' : ''} />
            </div>
          </div>

          {/* Overlaid content at bottom */}
          <div className="absolute bottom-3 left-3 right-3">
            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <Badge className="bg-primary text-primary-foreground capitalize font-body text-xs">
                {recipe.type}
              </Badge>
              {recipe.diets.includes('végétarien') && (
                <Badge variant="secondary" className="bg-card/95 text-green-600 font-body text-xs">
                  Végé
                </Badge>
              )}
            </div>
            {/* Title */}
            <h3 className="font-display text-lg font-bold text-primary-foreground drop-shadow-lg leading-tight line-clamp-2">
              {recipe.title}
            </h3>
            {/* Rating + meta */}
            <div className="flex items-center gap-3 mt-1">
              <StarRating rating={recipe.rating} size={13} />
              <span className="flex items-center gap-1 text-xs text-primary-foreground/80 font-body">
                <Clock size={12} />
                {totalTime ? `${totalTime} min` : '-'}
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { if (e.metaKey || e.ctrlKey) { e.preventDefault(); cart.toggle(recipe.id); } else { onClick(); } }}
      className="group text-left w-full h-full flex flex-col bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-[box-shadow,transform] duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={recipe.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!recipe.tested ? 'opacity-60 saturate-[0.3]' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-muted flex items-center justify-center ${!recipe.tested ? 'opacity-60' : ''}`}>
            <img src={beaverIcon} alt="Pas d'image" className="w-10 h-10 opacity-50 grayscale" />
          </div>
        )}
        {/* Cart button top right */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); cart.toggle(recipe.id); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); cart.toggle(recipe.id); } }}
            className={`w-8 h-8 rounded-full border-2 border-card/95 bg-card/95 flex items-center justify-center shadow-sm transition-colors ${inCart ? 'text-primary fill-primary' : 'text-gray-600 dark:text-gray-300 hover:text-primary'}`}
            title={inCart ? 'Retirer du panier' : 'Ajouter au panier'}
          >
            <ShoppingCart size={16} className={inCart ? 'fill-primary' : ''} />
          </div>
        </div>
        {/* Type badge */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge variant="secondary" className="bg-card/95 text-card-foreground font-body text-xs capitalize">
            {recipe.type}
          </Badge>
          {recipe.diets.includes('végétarien') && (
            <Badge variant="secondary" className="bg-card/95 text-green-600 font-body text-xs">
              Végé
            </Badge>
          )}
          {recipe.userRole && recipe.userRole !== 'owner' && (
            <Badge variant="secondary" className="bg-card/95 text-muted-foreground font-body text-xs flex items-center gap-0.5">
              <Users size={10} />
              {recipe.userRole === 'editor' ? 'Editeur' : 'Lecteur'}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display text-lg font-semibold text-card-foreground leading-tight line-clamp-2 min-h-[2lh] group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>

        <div className="mt-2">
          <StarRating rating={recipe.rating} />
        </div>

        <div className="flex items-end gap-3 text-xs text-muted-foreground font-body mt-2">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {totalTime ? `${totalTime} min` : '-'}
          </span>
          <span className="flex items-end gap-1">
            <DifficultyBars level={diff.bars} />
            {diff.label}
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} />
            {recipe.servings}
          </span>
        </div>

      </div>
    </button>
  );
}
