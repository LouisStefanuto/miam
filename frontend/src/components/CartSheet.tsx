import { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ShoppingCart, Trash2, ClipboardCopy } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useRecipes } from '@/hooks/use-recipes';
import { toast } from 'sonner';
import {
  aggregateIngredients,
  generateShoppingListText,
  mergeIngredients,
  servingsFor,
  type AggregatedIngredient,
} from '@/lib/shopping-list';
import { SortableCartIngredientItem } from './SortableCartIngredientItem';
import { AddCartItemForm } from './AddCartItemForm';
import { CartRecipeItem } from './CartRecipeItem';
import { EmptyCartInvite } from './EmptyCartInvite';

export default function CartSheet({ trigger, hotkey }: { trigger?: React.ReactNode; hotkey?: string } = {}) {
  const {
    items, remove, clear, count,
    manualItems, addManualItem, removeManualItem,
    servingsById, setServings,
  } = useCart();
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

  // Recipe ingredients plus the items the user typed in manually
  const rawIngredients = useMemo<AggregatedIngredient[]>(
    () => [
      ...aggregateIngredients(cartRecipes, servingsById),
      ...manualItems.map((i) => ({ id: i.id, name: i.name, details: '' })),
    ],
    [cartRecipes, manualItems, servingsById],
  );

  // Local state for user-reordered / removed ingredients
  const [ingredients, setIngredients] = useState<AggregatedIngredient[]>(rawIngredients);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  // Ingredients the user deleted by hand: they must not come back when the list is recomputed
  const removedIds = useRef<Set<string>>(new Set());

  // Sync when recipes change (new recipe added/removed from cart)
  useEffect(() => {
    const rawIds = new Set(rawIngredients.map((i) => i.id));

    // An ingredient no recipe provides anymore forgets its deletion, so it can come back later
    for (const id of removedIds.current) {
      if (!rawIds.has(id)) removedIds.current.delete(id);
    }

    setIngredients((prev) => mergeIngredients(prev, rawIngredients, removedIds.current));

    // Clean up checked IDs for ingredients that no longer exist
    setCheckedIds((prev) => {
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
    // A manual item is deleted at the source; a recipe ingredient is only hidden from the list
    if (id.startsWith('manual:')) removeManualItem(id);
    else removedIds.current.add(id);
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Nothing in the cart yet: the list stays on screen, the invitation fills the space below it
  const isEmpty = cartRecipes.length === 0 && ingredients.length === 0;

  const copyShoppingList = () => {
    const text = generateShoppingListText(cartRecipes, ingredients, checkedIds, servingsById);
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

        <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-2">
          {/* Selected recipes */}
          {cartRecipes.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-body text-base font-semibold text-muted-foreground uppercase tracking-wide">
                Recettes sélectionnées
              </h3>
              <div className="flex gap-3 overflow-x-auto snap-x pb-1">
                {cartRecipes.map((recipe) => (
                  <CartRecipeItem
                    key={recipe.id}
                    recipe={recipe}
                    servings={servingsFor(recipe, servingsById)}
                    onServingsChange={(n) => setServings(recipe.id, n)}
                    onRemove={() => remove(recipe.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Shopping list preview */}
          <div className="space-y-2">
            <h3 className="font-body text-base font-semibold text-muted-foreground uppercase tracking-wide">
              Liste de courses
            </h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={ingredients.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1.5">
                  {ingredients.map((ing) => (
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
                  <AddCartItemForm onAdd={addManualItem} />
                </ul>
              </SortableContext>
            </DndContext>
          </div>

          {isEmpty && <EmptyCartInvite />}
        </div>

        {/* Actions */}
        <div className="border-t pt-4 flex items-center gap-2">
          <Button
            onClick={copyShoppingList}
            variant="outline"
            disabled={ingredients.length === 0}
            className="flex-1 font-body gap-2"
          >
            <ClipboardCopy size={18} />
            Copier la liste
          </Button>
          <Button
            onClick={clear}
            variant="outline"
            disabled={isEmpty}
            className="flex-1 font-body gap-2 hover:text-destructive"
          >
            <Trash2 size={18} />
            Vider la liste
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
