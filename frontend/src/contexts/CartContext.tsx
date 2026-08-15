import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { IngredientRename } from '@/lib/shopping-list';

export interface ManualCartItem {
  id: string;
  name: string;
}

interface CartContextType {
  items: Set<string>;
  toggle: (recipeId: string) => void;
  /** Adds a recipe, optionally for a number of servings other than the recipe's own. */
  add: (recipeId: string, servings?: number) => void;
  remove: (recipeId: string) => void;
  clear: () => void;
  has: (recipeId: string) => boolean;
  count: number;
  manualItems: ManualCartItem[];
  addManualItem: (name: string) => void;
  removeManualItem: (id: string) => void;
  renameManualItem: (id: string, name: string) => void;
  /** Servings picked per recipe; recipes absent from the map use their own servings. */
  servingsById: Record<string, number>;
  setServings: (recipeId: string, servings: number) => void;
  /**
   * Hand edits to the recipe ingredients. They live here, above the router, so that leaving the
   * cart and coming back does not undo them, and they are written to storage for the next visit.
   */
  hiddenIngredientIds: Set<string>;
  hideIngredient: (id: string) => void;
  /** Forgets the deletions of ingredients no recipe provides anymore, so they can come back later. */
  pruneHiddenIngredients: (presentIds: ReadonlySet<string>) => void;
  ingredientRenames: Record<string, IngredientRename>;
  renameIngredient: (id: string, rename: IngredientRename) => void;
  forgetIngredientRename: (id: string) => void;
  /** Ingredient ids in the order the user dragged them into; empty until they move one. */
  ingredientOrder: string[];
  setIngredientOrder: (ids: string[]) => void;
}

const CartContext = createContext<CartContextType | null>(null);

function loadCart(): Set<string> {
  try {
    const raw = localStorage.getItem('miam-cart');
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveCart(items: Set<string>) {
  localStorage.setItem('miam-cart', JSON.stringify([...items]));
}

function loadManualItems(): ManualCartItem[] {
  try {
    const raw = localStorage.getItem('miam-cart-manual');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((i) => i && typeof i.id === 'string' && typeof i.name === 'string');
      }
    }
  } catch { /* ignore */ }
  return [];
}

function saveManualItems(items: ManualCartItem[]) {
  localStorage.setItem('miam-cart-manual', JSON.stringify(items));
}

function loadServings(): Record<string, number> {
  try {
    const raw = localStorage.getItem('miam-cart-servings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>)
            .filter(([, v]) => typeof v === 'number' && v > 0),
        ) as Record<string, number>;
      }
    }
  } catch { /* ignore */ }
  return {};
}

function saveServings(servings: Record<string, number>) {
  localStorage.setItem('miam-cart-servings', JSON.stringify(servings));
}

function loadHiddenIngredients(): Set<string> {
  try {
    const raw = localStorage.getItem('miam-cart-hidden');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.filter((id) => typeof id === 'string'));
    }
  } catch { /* ignore */ }
  return new Set();
}

function saveHiddenIngredients(ids: Set<string>) {
  localStorage.setItem('miam-cart-hidden', JSON.stringify([...ids]));
}

function loadIngredientOrder(): string[] {
  try {
    const raw = localStorage.getItem('miam-cart-order');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((id) => typeof id === 'string');
    }
  } catch { /* ignore */ }
  return [];
}

function saveIngredientOrder(ids: string[]) {
  localStorage.setItem('miam-cart-order', JSON.stringify(ids));
}

function loadIngredientRenames(): Record<string, IngredientRename> {
  try {
    const raw = localStorage.getItem('miam-cart-renames');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).filter(
            ([, v]) => v && typeof v === 'object'
              && typeof (v as IngredientRename).label === 'string'
              && typeof (v as IngredientRename).from === 'string',
          ),
        ) as Record<string, IngredientRename>;
      }
    }
  } catch { /* ignore */ }
  return {};
}

function saveIngredientRenames(renames: Record<string, IngredientRename>) {
  localStorage.setItem('miam-cart-renames', JSON.stringify(renames));
}

function newManualId(): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `manual:${rand}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Set<string>>(loadCart);
  const [manualItems, setManualItems] = useState<ManualCartItem[]>(loadManualItems);
  const [servingsById, setServingsById] = useState<Record<string, number>>(loadServings);
  const [hiddenIngredientIds, setHiddenIngredientIds] = useState<Set<string>>(loadHiddenIngredients);
  const [ingredientRenames, setIngredientRenames] = useState<Record<string, IngredientRename>>(loadIngredientRenames);
  const [ingredientOrder, setIngredientOrderState] = useState<string[]>(loadIngredientOrder);

  /** A recipe leaving the cart forgets its servings, so it comes back with its own default. */
  const forgetServings = useCallback((id: string) => {
    setServingsById((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      saveServings(next);
      return next;
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        forgetServings(id);
      } else {
        next.add(id);
      }
      saveCart(next);
      return next;
    });
  }, [forgetServings]);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      saveCart(next);
      return next;
    });
    forgetServings(id);
  }, [forgetServings]);

  const setServings = useCallback((recipeId: string, servings: number) => {
    setServingsById((prev) => {
      const value = Math.max(1, Math.round(servings));
      if (prev[recipeId] === value) return prev;
      const next = { ...prev, [recipeId]: value };
      saveServings(next);
      return next;
    });
  }, []);

  const add = useCallback((id: string, servings?: number) => {
    setItems((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveCart(next);
      return next;
    });
    if (servings != null) setServings(id, servings);
  }, [setServings]);

  const clear = useCallback(() => {
    setItems(new Set());
    saveCart(new Set());
    setManualItems([]);
    saveManualItems([]);
    setServingsById({});
    saveServings({});
    // Emptying the cart drops the hand edits too, so the next list starts from the recipes alone
    setHiddenIngredientIds(new Set());
    saveHiddenIngredients(new Set());
    setIngredientRenames({});
    saveIngredientRenames({});
    setIngredientOrderState([]);
    saveIngredientOrder([]);
  }, []);

  const addManualItem = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setManualItems((prev) => {
      const next = [...prev, { id: newManualId(), name: trimmed }];
      saveManualItems(next);
      return next;
    });
  }, []);

  const removeManualItem = useCallback((id: string) => {
    setManualItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveManualItems(next);
      return next;
    });
  }, []);

  const renameManualItem = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setManualItems((prev) => {
      if (!prev.some((i) => i.id === id && i.name !== trimmed)) return prev;
      const next = prev.map((i) => (i.id === id ? { ...i, name: trimmed } : i));
      saveManualItems(next);
      return next;
    });
  }, []);

  const hideIngredient = useCallback((id: string) => {
    setHiddenIngredientIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      saveHiddenIngredients(next);
      return next;
    });
  }, []);

  const pruneHiddenIngredients = useCallback((presentIds: ReadonlySet<string>) => {
    setHiddenIngredientIds((prev) => {
      const next = new Set([...prev].filter((id) => presentIds.has(id)));
      if (next.size === prev.size) return prev;
      saveHiddenIngredients(next);
      return next;
    });
  }, []);

  const renameIngredient = useCallback((id: string, rename: IngredientRename) => {
    setIngredientRenames((prev) => {
      const current = prev[id];
      if (current?.label === rename.label && current?.from === rename.from) return prev;
      const next = { ...prev, [id]: rename };
      saveIngredientRenames(next);
      return next;
    });
  }, []);

  const setIngredientOrder = useCallback((ids: string[]) => {
    setIngredientOrderState((prev) => {
      if (prev.length === ids.length && prev.every((id, index) => id === ids[index])) return prev;
      saveIngredientOrder(ids);
      return ids;
    });
  }, []);

  const forgetIngredientRename = useCallback((id: string) => {
    setIngredientRenames((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      saveIngredientRenames(next);
      return next;
    });
  }, []);

  const value = useMemo<CartContextType>(() => ({
    items, toggle, add, remove, clear,
    has: (id: string) => items.has(id),
    count: items.size,
    manualItems, addManualItem, removeManualItem, renameManualItem,
    servingsById, setServings,
    hiddenIngredientIds, hideIngredient, pruneHiddenIngredients,
    ingredientRenames, renameIngredient, forgetIngredientRename,
    ingredientOrder, setIngredientOrder,
  }), [
    items, toggle, add, remove, clear,
    manualItems, addManualItem, removeManualItem, renameManualItem,
    servingsById, setServings,
    hiddenIngredientIds, hideIngredient, pruneHiddenIngredients,
    ingredientRenames, renameIngredient, forgetIngredientRename,
    ingredientOrder, setIngredientOrder,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
