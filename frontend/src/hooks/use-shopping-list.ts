import { useCallback, useEffect, useMemo, useState } from 'react';
import { closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCart } from '@/contexts/CartContext';
import { useRecipes } from '@/hooks/use-recipes';
import {
  aggregateIngredients,
  generateShoppingListText,
  ingredientLabel,
  mergeIngredients,
  sortByOrder,
  type AggregatedIngredient,
} from '@/lib/shopping-list';

/**
 * The shopping list as the user sees it: recipe ingredients merged with the items they typed,
 * plus the order, deletions, ticks and labels they changed by hand.
 *
 * Shared by the cart page and the cart sheet so both behave the same.
 */
export function useShoppingList() {
  const {
    items, manualItems, removeManualItem, renameManualItem, servingsById,
    hiddenIngredientIds, hideIngredient, pruneHiddenIngredients,
    ingredientRenames, renameIngredient: persistRename, forgetIngredientRename,
    ingredientOrder, setIngredientOrder,
  } = useCart();
  const { data: allRecipes, isSuccess: recipesLoaded } = useRecipes();

  const cartRecipes = useMemo(
    () => (allRecipes ?? []).filter((r) => items.has(r.id)),
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

  // The order, the deletions and the rewritten labels come from the cart, which outlives this screen
  const [ingredients, setIngredients] = useState<AggregatedIngredient[]>(
    () => sortByOrder(mergeIngredients([], rawIngredients, hiddenIngredientIds, ingredientRenames), ingredientOrder),
  );
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Sync when the recipes, the servings or the hand edits change
  useEffect(() => {
    const rawIds = new Set(rawIngredients.map((i) => i.id));

    // An ingredient no recipe provides anymore forgets its deletion, so it can come back later.
    // Only once the recipes are in: until then every ingredient looks gone, and the stored
    // deletions would all be wiped on a cold load.
    if (recipesLoaded) pruneHiddenIngredients(rawIds);

    setIngredients((prev) =>
      sortByOrder(mergeIngredients(prev, rawIngredients, hiddenIngredientIds, ingredientRenames), ingredientOrder),
    );

    // Clean up checked IDs for ingredients that no longer exist
    setCheckedIds((prev) => {
      const next = new Set([...prev].filter((id) => rawIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rawIngredients, hiddenIngredientIds, ingredientRenames, ingredientOrder, recipesLoaded, pruneHiddenIngredients]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ingredients.findIndex((i) => i.id === active.id);
    const newIndex = ingredients.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(ingredients, oldIndex, newIndex);
    setIngredients(next);
    // The cart keeps the order, so it is still there after leaving the screen
    setIngredientOrder(next.map((i) => i.id));
  }, [ingredients, setIngredientOrder]);

  const toggleIngredient = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const removeIngredient = useCallback((id: string) => {
    // A manual item is deleted at the source; a recipe ingredient is only hidden from the list
    if (id.startsWith('manual:')) removeManualItem(id);
    else hideIngredient(id);
    forgetIngredientRename(id);
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [removeManualItem, hideIngredient, forgetIngredientRename]);

  /** Replaces the whole line, quantities included, with what the user typed. */
  const renameIngredient = useCallback((id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    // A manual item is renamed at the source, next to the name it was created with
    if (id.startsWith('manual:')) {
      renameManualItem(id, trimmed);
      return;
    }
    // Fingerprint the recipe line, not the one on screen: editing twice must not chain the renames
    const source = rawIngredients.find((i) => i.id === id);
    if (!source) return;
    persistRename(id, { label: trimmed, from: ingredientLabel(source) });
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, name: trimmed, details: '' } : i)),
    );
  }, [rawIngredients, renameManualItem, persistRename]);

  const shoppingListText = useCallback(
    () => generateShoppingListText(cartRecipes, ingredients, checkedIds, servingsById),
    [cartRecipes, ingredients, checkedIds, servingsById],
  );

  return {
    cartRecipes,
    ingredients,
    checkedIds,
    // Nothing in the cart yet: the list stays on screen, the invitation fills the space below it
    isEmpty: cartRecipes.length === 0 && ingredients.length === 0,
    sensors,
    collisionDetection: closestCenter,
    handleDragEnd,
    toggleIngredient,
    removeIngredient,
    renameIngredient,
    shoppingListText,
  };
}
