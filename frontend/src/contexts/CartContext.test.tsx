import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

/** jsdom's own storage leaks between tests, so each one gets a fresh Map-backed stub. */
function stubLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  });
}

/** Mounts a cart the way a screen does, so unmounting stands for leaving that screen. */
function mountCart() {
  return renderHook(() => useCart(), { wrapper: CartProvider });
}

const rename = { label: 'Beurre demi-sel', from: '200 g Beurre' };

describe('CartContext hand edits to the shopping list', () => {
  beforeEach(stubLocalStorage);

  it('keeps a rewritten label after the screen is torn down and rebuilt', () => {
    const first = mountCart();
    act(() => first.result.current.renameIngredient('beurre', rename));
    first.unmount();

    const second = mountCart();
    expect(second.result.current.ingredientRenames.beurre).toEqual(rename);
  });

  it('keeps a hand deletion after the screen is torn down and rebuilt', () => {
    const first = mountCart();
    act(() => first.result.current.hideIngredient('farine'));
    first.unmount();

    const second = mountCart();
    expect(second.result.current.hiddenIngredientIds.has('farine')).toBe(true);
  });

  it('forgets the deletions of ingredients no recipe provides anymore', () => {
    const { result } = mountCart();
    act(() => result.current.hideIngredient('farine'));
    act(() => result.current.pruneHiddenIngredients(new Set(['beurre'])));

    expect(result.current.hiddenIngredientIds.has('farine')).toBe(false);
  });

  it('keeps a rewritten label dormant while no recipe provides the ingredient', () => {
    const { result } = mountCart();
    act(() => result.current.renameIngredient('beurre', rename));
    // The recipe leaving the cart takes the line away, but not the wording the user chose for it
    act(() => result.current.pruneHiddenIngredients(new Set()));

    expect(result.current.ingredientRenames.beurre).toEqual(rename);
  });

  it('drops the hand edits when the cart is emptied', () => {
    const first = mountCart();
    act(() => {
      first.result.current.renameIngredient('beurre', rename);
      first.result.current.hideIngredient('farine');
    });
    act(() => first.result.current.clear());
    first.unmount();

    const second = mountCart();
    expect(second.result.current.ingredientRenames).toEqual({});
    expect(second.result.current.hiddenIngredientIds.size).toBe(0);
  });
});
