import { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigate } from 'react-router-dom';
import { Trash2, ClipboardCopy, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useRecipes } from '@/hooks/use-recipes';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  aggregateIngredients,
  generateShoppingListText,
  servingsFor,
  type AggregatedIngredient,
} from '@/lib/shopping-list';
import { SortableCartIngredientItem } from '@/components/SortableCartIngredientItem';
import { AddCartItemForm, StartManualListButton } from '@/components/AddCartItemForm';
import { CartRecipeItem } from '@/components/CartRecipeItem';
import cartImage from '@/assets/cart.png';

const CartPage = () => {
  const navigate = useNavigate();
  const {
    items, remove, clear, count,
    manualItems, addManualItem, removeManualItem,
    servingsById, setServings,
  } = useCart();
  const { data: allRecipes = [] } = useRecipes();
  const isMobile = useIsMobile();

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

  const [ingredients, setIngredients] = useState<AggregatedIngredient[]>(rawIngredients);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  // Shows the shopping list instead of the empty state while the user builds a list from scratch
  const [manualMode, setManualMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number>();

  useEffect(() => () => {
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
  }, []);

  useEffect(() => {
    setIngredients((prev) => {
      const prevIds = new Set(prev.map((i) => i.id));
      const rawIds = new Set(rawIngredients.map((i) => i.id));

      const kept = prev
        .filter((i) => rawIds.has(i.id))
        .map((i) => {
          const updated = rawIngredients.find((r) => r.id === i.id)!;
          return { ...i, details: updated.details, name: updated.name };
        });

      const added = rawIngredients.filter((i) => !prevIds.has(i.id));
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

  const copyShoppingList = () => {
    const text = generateShoppingListText(cartRecipes, ingredients, checkedIds, servingsById);
    navigator.clipboard.writeText(text).then(
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
        {cartRecipes.length === 0 && ingredients.length === 0 && !manualMode ? (
          <div className="flex-1 md:flex-none flex flex-col items-center justify-center text-center px-6 gap-6 md:py-20">
            <img src={cartImage} alt="Panier vide" className="w-48 h-48 object-contain" />
            <div className="space-y-4">
              <p className="font-display text-2xl font-bold text-foreground">Panier vide, ventre creux</p>
              <p className="font-body text-muted-foreground">
                Ajoutez des recettes depuis le catalogue,<br />on vous prépare la liste de courses !
              </p>
              <div className="flex flex-col items-center">
                <StartManualListButton onClick={() => setManualMode(true)} />
              </div>
            </div>
          </div>
        ) : (
          <>
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
                disabled={cartRecipes.length === 0 && ingredients.length === 0}
                className="flex-1 font-body gap-2 hover:text-destructive"
              >
                <Trash2 size={18} />
                Vider le panier
              </Button>
            </div>

            {/* Selected recipes */}
            {cartRecipes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-body text-base font-semibold text-muted-foreground uppercase tracking-wide">
                  Recettes sélectionnées
                </h3>
                <div className="flex gap-3 overflow-x-auto snap-x pb-1 -mx-4 px-4">
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
                    <AddCartItemForm
                      onAdd={addManualItem}
                      autoFocusInput={manualMode}
                      onCancel={() => setManualMode(false)}
                    />
                  </ul>
                </SortableContext>
              </DndContext>
            </div>

          </>
        )}
      </main>
    </div>
  );
};

export default CartPage;
