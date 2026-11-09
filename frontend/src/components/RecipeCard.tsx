import { Clock, Star, Users, ShoppingCart, Check, Leaf, Wine, Salad, Beef, UtensilsCrossed, Cake, CupSoda, LucideIcon } from 'lucide-react';
import { Recipe, RecipeType } from '@/data/recipes';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthImage } from '@/hooks/use-auth-image';
import { getDefaultRecipeImage } from '@/lib/recipe-default-image';
import { displayTitle } from '@/lib/recipe-title';


const difficultyLabels: Record<string, { label: string; bars: number }> = {
  facile: { label: 'Facile', bars: 1 },
  moyen: { label: 'Moyen', bars: 2 },
  difficile: { label: 'Difficile', bars: 3 },
};

const typeIcons: Record<RecipeType, LucideIcon> = {
  'apéro': Wine,
  'entrée': Salad,
  'plat': Beef,
  'pâtes': UtensilsCrossed,
  'dessert': Cake,
  'boisson': CupSoda,
};

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  /** 'row' is a compact list item: small square image with a short text summary beside it. */
  variant?: 'card' | 'row';
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
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

/** Small leaf marking a vegetarian recipe, shown next to its time. */
const VeggieLeaf = ({ size, className = 'text-green-600' }: { size: number; className?: string }) => (
  <Leaf size={size} className={`shrink-0 ${className}`} role="img" aria-label="Végétarien">
    <title>Végétarien</title>
  </Leaf>
);

const StarRating = ({ rating, size = 14, emptyClassName = 'text-white/30' }: { rating: number; size?: number; emptyClassName?: string }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={i <= rating ? 'fill-primary text-primary' : emptyClassName}
      />
    ))}
  </div>
);

const iconSwap = 'col-start-1 row-start-1 transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.3,1.6,0.5,1)] motion-reduce:transition-none';

/** Frosted glass disc over the photo: a cart to add, solid orange with a check once in the cart. */
const CartToggle = ({ inCart, onToggle }: { inCart: boolean; onToggle: () => void }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onToggle(); } }}
    className={`w-8 h-8 rounded-full grid place-items-center ring-1 ring-inset ring-white/25 backdrop-blur-md backdrop-saturate-150 transition-[background-color,box-shadow,transform] duration-200 active:scale-90 motion-reduce:transition-none ${
      inCart
        ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.6)]'
        : 'bg-black/30 text-white shadow-[0_2px_10px_-2px_rgb(0_0_0/0.3)] hover:bg-black/45'
    }`}
    title={inCart ? 'Retirer du panier' : 'Ajouter au panier'}
    aria-pressed={inCart}
  >
    <ShoppingCart size={16} className={`${iconSwap} ${inCart ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} />
    <Check size={16} strokeWidth={3} className={`${iconSwap} ${inCart ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'}`} />
  </div>
);

export default function RecipeCard({ recipe, onClick, variant = 'card', selectionMode, selected, onSelect }: RecipeCardProps) {
  const isMobile = useIsMobile();
  const totalTime = recipe.prepTime + recipe.cookTime;
  const title = displayTitle(recipe.title);
  const isVeggie = recipe.diets.includes('végétarien');
  const diff = difficultyLabels[recipe.difficulty];
  const cart = useCart();
  const inCart = cart.has(recipe.id);
  const fetchedImage = useAuthImage(recipe.image);
  const imageSrc = recipe.image ? fetchedImage : getDefaultRecipeImage(recipe.type);
  const isDefault = !recipe.image;

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelect) {
      e.preventDefault();
      onSelect(recipe.id);
      return;
    }
    if (e.metaKey || e.ctrlKey) { e.preventDefault(); cart.toggle(recipe.id); } else { onClick(); }
  };

  const selectionCheck = (
    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors ${selected ? 'bg-primary border-primary text-primary-foreground' : 'border-card/95 bg-card/95 text-transparent'}`}>
      <Check size={16} />
    </div>
  );

  if (variant === 'row') {
    const TypeIcon = typeIcons[recipe.type] ?? UtensilsCrossed;
    return (
      <button
        onClick={handleClick}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        className={`w-full flex items-center gap-4 px-2 py-1.5 text-left rounded-lg transition-colors active:bg-secondary/60 ${selectionMode && selected ? 'bg-primary/10' : ''}`}
      >
        <div className="w-[72px] h-[72px] shrink-0 rounded-lg overflow-hidden bg-muted">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              className={`w-full h-full ${isDefault ? 'object-contain p-2' : 'object-cover'}`}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full animate-pulse" />
          )}
        </div>

        {/* Line heights are tight so that even a two-line title stays within the image height. */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-bold text-foreground leading-tight line-clamp-2">
            {title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] leading-4 text-foreground/80 font-body">
            <TypeIcon size={14} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{totalTime ? `${totalTime} min` : '-'}</span>
          </p>
          <div className="mt-0.5 flex items-center gap-2 h-3">
            <StarRating rating={recipe.rating} size={12} emptyClassName="text-muted-foreground/30" />
            {isVeggie && <VeggieLeaf size={13} />}
          </div>
        </div>

        {selectionMode && selectionCheck}
      </button>
    );
  }

  if (isMobile) {
    return (
      <button
        onClick={handleClick}
        className={`group text-left w-full relative rounded-lg overflow-hidden shadow-card ${selectionMode && selected ? 'ring-2 ring-primary' : ''}`}
      >
        {/* Full image background */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={title}
              className={`w-full h-full ${isDefault ? 'object-contain bg-muted p-4' : 'object-cover'}`}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Top right: selection check or cart button */}
          <div className="absolute top-2 right-2">
            {selectionMode ? selectionCheck : <CartToggle inCart={inCart} onToggle={() => cart.toggle(recipe.id)} />}
          </div>

          {/* Overlaid content at bottom */}
          <div className="absolute bottom-3 left-3 right-3">
            {/* Title */}
            <h3 className="font-display text-lg font-bold text-primary-foreground drop-shadow-lg leading-tight line-clamp-2">
              {title}
            </h3>
            {/* Rating + meta */}
            <div className="flex items-center gap-3 mt-1">
              <StarRating rating={recipe.rating} size={13} />
              <span className="flex items-center gap-1 text-xs text-primary-foreground/80 font-body">
                <Clock size={12} />
                {totalTime ? `${totalTime} min` : '-'}
              </span>
              {isVeggie && <VeggieLeaf size={14} className="text-green-400 drop-shadow" />}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`group text-left w-full h-full flex flex-col bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-[box-shadow,transform] duration-300 hover:-translate-y-1 ${selectionMode && selected ? 'ring-2 ring-primary' : ''}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${isDefault ? 'object-contain bg-muted p-4' : 'object-cover'}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted animate-pulse" />
        )}
        {/* Top right: selection check or cart button */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {selectionMode ? selectionCheck : <CartToggle inCart={inCart} onToggle={() => cart.toggle(recipe.id)} />}
        </div>
        {/* Role badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
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
          {title}
        </h3>

        <div className="mt-2">
          <StarRating rating={recipe.rating} emptyClassName="text-muted-foreground/30" />
        </div>

        <div className="flex items-end gap-3 text-xs text-muted-foreground font-body mt-2">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {totalTime ? `${totalTime} min` : '-'}
          </span>
          {isVeggie && <VeggieLeaf size={14} />}
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
