import { useMemo, useState } from 'react';
import { ShoppingCart, Trash2, ClipboardCopy, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useRecipes } from '@/hooks/use-recipes';
import { toast } from 'sonner';
import type { Recipe } from '@/data/recipes';

function aggregateIngredients(recipes: Recipe[]): { name: string; details: string }[] {
  const map = new Map<string, { quantities: { qty: number | string; unit: string }[] }>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase().trim();
      if (!map.has(key)) map.set(key, { quantities: [] });
      map.get(key)!.quantities.push({ qty: ing.quantity, unit: ing.unit });
    }
  }

  const result: { name: string; details: string }[] = [];

  for (const [name, { quantities }] of map) {
    // Group by unit and sum numeric quantities
    const byUnit = new Map<string, number | null>();
    for (const { qty, unit } of quantities) {
      const u = unit.toLowerCase().trim();
      const numQty = typeof qty === 'string' ? parseFloat(qty) : qty;
      if (!byUnit.has(u)) byUnit.set(u, null);
      if (numQty && !isNaN(numQty)) {
        byUnit.set(u, (byUnit.get(u) ?? 0) + numQty);
      }
    }

    const parts: string[] = [];
    for (const [unit, total] of byUnit) {
      if (total != null) {
        parts.push(unit ? `${total} ${unit}` : `${total}`);
      }
    }

    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    result.push({ name: displayName, details: parts.join(' + ') });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function generateShoppingListText(recipes: Recipe[]): string {
  const lines: string[] = ['Liste de courses', ''];
  lines.push(`Recettes (${recipes.length}) :`);
  for (const r of recipes) {
    lines.push(`  - ${r.title} (${r.servings} pers.)`);
  }
  lines.push('');
  lines.push('Ingrédients :');
  const ingredients = aggregateIngredients(recipes);
  for (const ing of ingredients) {
    lines.push(`  [ ] ${ing.details ? `${ing.details} ` : ''}${ing.name}`);
  }
  return lines.join('\n');
}

export default function CartSheet() {
  const { items, remove, clear, count } = useCart();
  const { data: allRecipes = [] } = useRecipes();
  const [open, setOpen] = useState(false);

  const cartRecipes = useMemo(
    () => allRecipes.filter((r) => items.has(r.id)),
    [allRecipes, items],
  );

  const ingredients = useMemo(() => aggregateIngredients(cartRecipes), [cartRecipes]);

  const copyShoppingList = () => {
    const text = generateShoppingListText(cartRecipes);
    navigator.clipboard.writeText(text).then(
      () => toast.success('Liste de courses copiée !'),
      () => toast.error('Impossible de copier dans le presse-papier'),
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="font-body font-semibold gap-2 shrink-0 relative">
          <ShoppingCart size={18} />
          Panier
          {count > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display">Panier ({count})</SheetTitle>
        </SheetHeader>

        {cartRecipes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground font-body">Aucune recette dans le panier</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Selected recipes */}
            <div className="space-y-2">
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Recettes sélectionnées
              </h3>
              {cartRecipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} className="w-12 h-12 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium truncate">{recipe.title}</p>
                    <p className="text-xs text-muted-foreground font-body">{recipe.servings} pers. · {recipe.ingredients.length} ingrédients</p>
                  </div>
                  <button
                    onClick={() => remove(recipe.id)}
                    className="shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Retirer du panier"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Shopping list preview */}
            <div className="space-y-2">
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Liste de courses
              </h3>
              <ul className="space-y-1">
                {ingredients.map((ing) => (
                  <li key={ing.name} className="flex items-baseline gap-2 font-body text-sm">
                    <span className="w-4 h-4 shrink-0 rounded border border-muted-foreground/30 mt-0.5" />
                    <span>
                      {ing.details && <span className="font-medium">{ing.details} </span>}
                      {ing.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        {cartRecipes.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <Button onClick={copyShoppingList} className="w-full gradient-warm text-primary-foreground font-body font-semibold gap-2">
              <ClipboardCopy size={16} />
              Copier la liste de courses
            </Button>
            <Button onClick={clear} variant="ghost" className="w-full font-body text-muted-foreground gap-2">
              <Trash2 size={16} />
              Vider le panier
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
