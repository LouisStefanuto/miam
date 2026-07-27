import cartImage from '@/assets/cart.png';

/**
 * Shown in the middle of the empty shopping list, as an invitation to fill it.
 * Makes way for the items as soon as the list holds something.
 */
export function EmptyCartInvite() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-5 py-8">
      <img src={cartImage} alt="" aria-hidden="true" className="w-40 h-40 object-contain" />
      <div className="space-y-2">
        <p className="font-display text-2xl font-bold text-foreground">Panier vide, ventre creux</p>
        <p className="font-body text-muted-foreground">
          Ajoutez des recettes depuis le catalogue,<br />ou écrivez vos articles directement dans la liste.
        </p>
      </div>
    </div>
  );
}
