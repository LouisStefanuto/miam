import { useEffect, useMemo, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ShoppingCart, Trash2, ClipboardCopy, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useRecipes } from '@/hooks/use-recipes';
import { toast } from 'sonner';
import type { Recipe } from '@/data/recipes';
import { displayUnit } from '@/lib/units';
import { SortableCartIngredientItem } from './SortableCartIngredientItem';
import { AuthImage } from '@/hooks/use-auth-image';

interface AggregatedIngredient {
  id: string;
  name: string;
  details: string;
}

function aggregateIngredients(recipes: Recipe[]): AggregatedIngredient[] {
  const map = new Map<string, { quantities: { qty: number | string; unit: string }[] }>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase().trim();
      if (!map.has(key)) map.set(key, { quantities: [] });
      map.get(key)!.quantities.push({ qty: ing.quantity, unit: ing.unit });
    }
  }

  const result: AggregatedIngredient[] = [];

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
        parts.push(unit ? `${total} ${displayUnit(unit, total)}` : `${total}`);
      }
    }

    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    result.push({ id: name, name: displayName, details: parts.join(' + ') });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function generateShoppingListText(recipes: Recipe[], ingredients: AggregatedIngredient[], checkedIds: Set<string>): string {
  const lines: string[] = ['Liste de courses', ''];
  lines.push(`Recettes (${recipes.length}) :`);
  for (const r of recipes) {
    lines.push(`  - ${r.title} (${r.servings} pers.)`);
  }
  lines.push('');
  lines.push('Ingrédients :');
  for (const ing of ingredients) {
    const check = checkedIds.has(ing.id) ? 'x' : ' ';
    lines.push(`  [${check}] ${ing.details ? `${ing.details} ` : ''}${ing.name}`);
  }
  return lines.join('\n');
}

export default function CartSheet({ trigger, hotkey }: { trigger?: React.ReactNode; hotkey?: string } = {}) {
  const { items, remove, clear, count } = useCart();
  const { data: allRecipes = [] } = useRecipes();
  const [open, setOpen] = useState(false);

  // Keyboard shortcut to toggle cart
  useEffect(() => {
    if (!hotkey) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === hotkey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkey]);

  const cartRecipes = useMemo(
    () => allRecipes.filter((r) => items.has(r.id)),
    [allRecipes, items],
  );

  const rawIngredients = useMemo(() => aggregateIngredients(cartRecipes), [cartRecipes]);

  // Local state for user-reordered / removed ingredients
  const [ingredients, setIngredients] = useState<AggregatedIngredient[]>(rawIngredients);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Sync when recipes change (new recipe added/removed from cart)
  useEffect(() => {
    setIngredients((prev) => {
      const prevIds = new Set(prev.map((i) => i.id));
      const rawIds = new Set(rawIngredients.map((i) => i.id));

      // Keep existing order for ingredients that are still present, update their details
      const kept = prev
        .filter((i) => rawIds.has(i.id))
        .map((i) => {
          const updated = rawIngredients.find((r) => r.id === i.id)!;
          return { ...i, details: updated.details, name: updated.name };
        });

      // Append new ingredients at the end
      const added = rawIngredients.filter((i) => !prevIds.has(i.id));

      // Bail out if nothing changed to avoid infinite re-render loop
      if (added.length === 0 && kept.length === prev.length &&
          kept.every((k, i) => k.name === prev[i].name && k.details === prev[i].details)) {
        return prev;
      }

      return [...kept, ...added];
    });

    // Clean up checked IDs for ingredients that no longer exist
    setCheckedIds((prev) => {
      const rawIds = new Set(rawIngredients.map((i) => i.id));
      const next = new Set([...prev].filter((id) => rawIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rawIngredients]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setIngredients((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const toggleIngredient = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const sortedIngredients = useMemo(() => {
    const unchecked = ingredients.filter((i) => !checkedIds.has(i.id));
    const checked = ingredients.filter((i) => checkedIds.has(i.id));
    return [...unchecked, ...checked];
  }, [ingredients, checkedIds]);

  const copyShoppingList = () => {
    const text = generateShoppingListText(cartRecipes, sortedIngredients, checkedIds);
    navigator.clipboard.writeText(text).then(
      () => toast.success('Liste de courses copiée !'),
      () => toast.error('Impossible de copier dans le presse-papier'),
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className={`font-body font-semibold shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 gap-1.5 ${count > 0 ? '!text-primary' : ''}`}
          >
            <ShoppingCart size={18} />
            {count > 0 && (
              <span className="text-sm font-bold tabular-nums">{count}</span>
            )}
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full sm:max-w-lg flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle className="font-display">Panier ({count})</SheetTitle>
        </SheetHeader>

        {cartRecipes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
            <ShoppingCart size={48} className="text-muted-foreground/40" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="font-display text-lg font-bold text-foreground">Panier vide, ventre creux</p>
              <p className="text-sm text-muted-foreground font-body">
                Ajoutez des recettes depuis le catalogue,<br />on vous prépare la liste de courses !
              </p>
            </div>
            <Button onClick={() => setOpen(false)} className="font-body">
              Parcourir les recettes
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Selected recipes */}
            <div className="space-y-2">
              <h3 className="font-body text-base font-semibold text-muted-foreground uppercase tracking-wide">
                Recettes sélectionnées
              </h3>
              {cartRecipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 group">
                  {recipe.image ? (
                    <AuthImage src={recipe.image} alt={recipe.title} className="w-14 h-14 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-base font-medium truncate">{recipe.title}</p>
                    <p className="text-sm text-muted-foreground font-body">{recipe.servings} pers. · {recipe.ingredients.length} ingrédients</p>
                  </div>
                  <button
                    onClick={() => remove(recipe.id)}
                    className="shrink-0 p-2 rounded-full text-muted-foreground md:text-muted-foreground/0 md:group-hover:text-muted-foreground hover:!text-destructive hover:bg-destructive/10 transition-colors"
                    title="Retirer du panier"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Shopping list preview */}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-body text-base font-semibold text-muted-foreground uppercase tracking-wide">
                  Liste de courses
                </h3>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sortedIngredients.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-1.5">
                      {sortedIngredients.map((ing) => (
                        <SortableCartIngredientItem
                          key={ing.id}
                          id={ing.id}
                          name={ing.name}
                          details={ing.details}
                          checked={checkedIds.has(ing.id)}
                          onToggle={toggleIngredient}
                          onRemove={removeIngredient}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {cartRecipes.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <Button onClick={copyShoppingList} className="w-full gradient-warm text-primary-foreground font-body font-semibold gap-2 h-12 text-base">
              <ClipboardCopy size={20} />
              Copier la liste de courses
            </Button>
            <Button onClick={clear} variant="ghost" className="w-full font-body text-muted-foreground gap-2 h-12 text-base">
              <Trash2 size={20} />
              Vider le panier
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
