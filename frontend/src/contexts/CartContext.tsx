import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

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
  /** Servings picked per recipe; recipes absent from the map use their own servings. */
  servingsById: Record<string, number>;
  setServings: (recipeId: string, servings: number) => void;
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

  const value = useMemo<CartContextType>(() => ({
    items, toggle, add, remove, clear,
    has: (id: string) => items.has(id),
    count: items.size,
    manualItems, addManualItem, removeManualItem,
    servingsById, setServings,
  }), [
    items, toggle, add, remove, clear,
    manualItems, addManualItem, removeManualItem,
    servingsById, setServings,
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
