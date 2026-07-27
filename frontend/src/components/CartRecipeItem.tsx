import { Users, X } from 'lucide-react';
import type { Recipe } from '@/data/recipes';
import { AuthImage } from '@/hooks/use-auth-image';
import { getDefaultRecipeImage } from '@/lib/recipe-default-image';
import { ServingsPicker } from './ServingsPicker';

interface CartRecipeItemProps {
  recipe: Recipe;
  /** Servings the shopping list is computed with, which may differ from the recipe's own. */
  servings: number;
  onServingsChange: (servings: number) => void;
  onRemove: () => void;
}

/** A recipe card in the cart carousel. Tapping it opens the servings picker. */
export function CartRecipeItem({ recipe, servings, onServingsChange, onRemove }: CartRecipeItemProps) {
  return (
    <div className="relative shrink-0 w-36 snap-start group">
      <ServingsPicker
        servings={servings}
        onChange={onServingsChange}
        label={recipe.title}
        trigger={
          <button
            type="button"
            className="w-full text-left rounded-lg overflow-hidden bg-secondary/50 hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={`${recipe.title} — changer le nombre de personnes`}
          >
            {recipe.image ? (
              <AuthImage src={recipe.image} alt="" className="w-full h-20 object-cover" />
            ) : (
              <img
                src={getDefaultRecipeImage(recipe.type)}
                alt=""
                className="w-full h-20 object-contain bg-muted p-2"
              />
            )}
            <div className="p-2.5 space-y-1">
              <p className="font-body text-sm font-medium truncate">{recipe.title}</p>
              <span className="flex items-center gap-1.5 font-body text-sm text-muted-foreground tabular-nums">
                <Users size={14} className="shrink-0" />
                {servings} pers.
              </span>
            </div>
          </button>
        }
      />

      <button
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors"
        title="Retirer du panier"
      >
        <X size={16} />
      </button>
    </div>
  );
}
