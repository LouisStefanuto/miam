import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface CartContextType {
  items: Set<string>;
  toggle: (recipeId: string) => void;
  remove: (recipeId: string) => void;
  clear: () => void;
  has: (recipeId: string) => boolean;
  count: number;
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Set<string>>(loadCart);

  const toggle = useCallback((id: string) => {
    setItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveCart(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      saveCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems(new Set());
    saveCart(new Set());
  }, []);

  const value = useMemo<CartContextType>(() => ({
    items, toggle, remove, clear,
    has: (id: string) => items.has(id),
    count: items.size,
  }), [items, toggle, remove, clear]);

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
