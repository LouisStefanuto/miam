import { useEffect, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ShoppingCart, Trash2, ClipboardCopy } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { toast } from 'sonner';
import { servingsFor } from '@/lib/shopping-list';
import { SortableCartIngredientItem } from './SortableCartIngredientItem';
import { AddCartItemForm } from './AddCartItemForm';
import { CartRecipeItem } from './CartRecipeItem';
import { EmptyCartInvite } from './EmptyCartInvite';

export default function CartSheet({ trigger, hotkey }: { trigger?: React.ReactNode; hotkey?: string } = {}) {
  const { remove, clear, count, addManualItem, servingsById, setServings } = useCart();
  const {
    cartRecipes, ingredients, checkedIds, isEmpty,
    sensors, collisionDetection, handleDragEnd,
    toggleIngredient, removeIngredient, renameIngredient,
    shoppingListText,
  } = useShoppingList();
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

  const copyShoppingList = () => {
    navigator.clipboard.writeText(shoppingListText()).then(
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
            <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragEnd={handleDragEnd}>
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
                      onRename={renameIngredient}
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
