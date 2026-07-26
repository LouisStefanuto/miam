import { useEffect, useMemo, useState } from 'react';
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
  servingsFor,
  type AggregatedIngredient,
} from '@/lib/shopping-list';
import { SortableCartIngredientItem } from './SortableCartIngredientItem';
import { AddCartItemForm, StartManualListButton } from './AddCartItemForm';
import { CartRecipeItem } from './CartRecipeItem';
import cartImage from '@/assets/cart.png';

export default function CartSheet({ trigger, hotkey }: { trigger?: React.ReactNode; hotkey?: string } = {}) {
  const {
    items, remove, clear, count,
    manualItems, addManualItem, removeManualItem,
    servingsById, setServings,
    manualListStarted, startManualList,
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
  // Focuses the new-item field only when the list is started right now, not when coming back to it
  const [justStarted, setJustStarted] = useState(false);

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
    if (id.startsWith('manual:')) removeManualItem(id);
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Actions stay mounted alongside the list so nothing shifts when the first item lands
  const showEmptyState = cartRecipes.length === 0 && ingredients.length === 0 && !manualListStarted;

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

        {showEmptyState ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-6">
            <img src={cartImage} alt="Panier vide" className="w-48 h-48 object-contain" />
            <div className="space-y-4">
              <p className="font-display text-2xl font-bold text-foreground">Panier vide, ventre creux</p>
              <p className="font-body text-muted-foreground">
                Ajoutez des recettes depuis le catalogue,<br />on vous prépare la liste de courses !
              </p>
              <div className="flex flex-col items-center">
                <StartManualListButton onClick={() => { startManualList(); setJustStarted(true); }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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
                    <AddCartItemForm onAdd={addManualItem} autoFocusInput={justStarted} />
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}

        {/* Actions */}
        {!showEmptyState && (
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
              disabled={cartRecipes.length === 0 && ingredients.length === 0}
              className="flex-1 font-body gap-2 hover:text-destructive"
            >
              <Trash2 size={18} />
              Vider la liste
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
