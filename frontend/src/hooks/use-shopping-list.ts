import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCart } from '@/contexts/CartContext';
import { useRecipes } from '@/hooks/use-recipes';
import {
  aggregateIngredients,
  generateShoppingListText,
  mergeIngredients,
  type AggregatedIngredient,
} from '@/lib/shopping-list';

/**
 * The shopping list as the user sees it: recipe ingredients merged with the items they typed,
 * plus the order, deletions, ticks and labels they changed by hand.
 *
 * Shared by the cart page and the cart sheet so both behave the same.
 */
export function useShoppingList() {
  const { items, manualItems, removeManualItem, renameManualItem, servingsById } = useCart();
  const { data: allRecipes = [] } = useRecipes();

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
  // Ingredients the user deleted by hand: they must not come back when the list is recomputed
  const removedIds = useRef<Set<string>>(new Set());
  // Labels the user rewrote: they must survive the list being recomputed
  const renamedById = useRef<Map<string, string>>(new Map());

  // Sync when recipes change (new recipe added/removed from cart)
  useEffect(() => {
    const rawIds = new Set(rawIngredients.map((i) => i.id));

    // An ingredient no recipe provides anymore forgets what the user did to it, so it comes back intact
    for (const id of removedIds.current) {
      if (!rawIds.has(id)) removedIds.current.delete(id);
    }
    for (const id of [...renamedById.current.keys()]) {
      if (!rawIds.has(id)) renamedById.current.delete(id);
    }

    setIngredients((prev) => mergeIngredients(prev, rawIngredients, removedIds.current, renamedById.current));

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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setIngredients((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

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
    else removedIds.current.add(id);
    renamedById.current.delete(id);
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [removeManualItem]);

  /** Replaces the whole line, quantities included, with what the user typed. */
  const renameIngredient = useCallback((id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    // A manual item is renamed at the source, so the new name is kept across sessions
    if (id.startsWith('manual:')) {
      renameManualItem(id, trimmed);
      return;
    }
    renamedById.current.set(id, trimmed);
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, name: trimmed, details: '' } : i)),
    );
  }, [renameManualItem]);

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
