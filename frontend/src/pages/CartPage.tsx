import { useEffect, useRef, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate } from 'react-router-dom';
import { Trash2, ClipboardCopy, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { toast } from 'sonner';
import { servingsFor } from '@/lib/shopping-list';
import { SortableCartIngredientItem } from '@/components/SortableCartIngredientItem';
import { AddCartItemForm } from '@/components/AddCartItemForm';
import { CartRecipeItem } from '@/components/CartRecipeItem';
import { EmptyCartInvite } from '@/components/EmptyCartInvite';

const CartPage = () => {
  const navigate = useNavigate();
  const { remove, clear, count, addManualItem, servingsById, setServings } = useCart();
  const isMobile = useIsMobile();
  const {
    cartRecipes, ingredients, checkedIds, isEmpty,
    sensors, collisionDetection, handleDragEnd,
    toggleIngredient, removeIngredient, renameIngredient,
    shoppingListText,
  } = useShoppingList();

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number>();

  useEffect(() => () => {
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
  }, []);

  const copyShoppingList = () => {
    navigator.clipboard.writeText(shoppingListText()).then(
      () => {
        // On mobile the button itself confirms the copy, no toast on top of it
        if (isMobile) {
          setCopied(true);
          if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
          copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
        } else {
          toast.success('Liste de courses copiée !');
        }
      },
      () => toast.error('Impossible de copier dans le presse-papier'),
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border md:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Retour au catalogue">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display text-xl font-bold text-foreground">Panier ({count})</h1>
      </header>
      <header className="sticky top-0 z-30 hidden md:flex items-center gap-3 h-16 px-6 bg-background/85 backdrop-blur-md border-b border-border/60">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Retour au catalogue">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Panier ({count})</h1>
      </header>

      <main className="max-w-lg w-full mx-auto px-4 py-4 pb-24 space-y-6 flex-1 flex flex-col">
        {/* Actions — pinned under the header so they stay reachable on long lists */}
        <div className="sticky top-14 md:top-16 z-10 flex items-center gap-2 bg-background py-2">
          <Button
            onClick={copyShoppingList}
            variant="outline"
            disabled={ingredients.length === 0}
            className={`flex-1 font-body gap-2 transition-colors ${copied ? 'border-primary text-primary' : ''}`}
          >
            {copied ? <Check size={18} /> : <ClipboardCopy size={18} />}
            {copied ? 'Copié !' : 'Copier la liste'}
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

        {/* Shopping list */}
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
      </main>
    </div>
  );
};

export default CartPage;
